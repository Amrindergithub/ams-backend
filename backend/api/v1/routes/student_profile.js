const router = require("express").Router();
const { internalServerError } = require("../utils/response");
const StudentProfile = require("../models/student_profile");
const BlockchainAttendance = require("../models/blockchain_attendance");
const AuthMiddlewares = require("../middlewares/auth");
const { buildModuleFilter } = require("../utils/module_scope");
const {
  computeAttendance,
  flagFrom,
  LOW_ATTENDANCE_THRESHOLD,
} = require("../utils/attendance");

// Admin-only middleware chain.
const adminOnly = [
  AuthMiddlewares.checkAccessToken,
  AuthMiddlewares.validateAccessToken,
  AuthMiddlewares.checkAdminAccess,
];

// Modules a student is enrolled in. The profile stores a single `course` code
// today; return as an array so future multi-module enrolment is a drop-in
// change (schema → [String]).
function studentModules(student) {
  if (!student || !student.course) return [];
  return [student.course];
}

// POST - Register student profile
router.post("/register", async (req, res) => {
  try {
    const { studentId, name, email, course, walletAddress, enrollmentYear } = req.body;

    if (!studentId || !name || !email || !course) {
      return res.status(400).json({
        status: "failed",
        message: "studentId, name, email, and course are required",
      });
    }

    const existing = await StudentProfile.findOne({ studentId });
    if (existing) {
      return res.status(400).json({
        status: "failed",
        message: "Student already registered",
      });
    }

    const student = new StudentProfile({
      studentId,
      name,
      email,
      course,
      walletAddress: walletAddress || null,
      enrollmentYear: enrollmentYear || null,
    });
    await student.save();

    return res.status(201).json({
      status: "success",
      message: "Student registered successfully",
      data: { student },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// PATCH - Update student wallet address
router.patch("/wallet/:studentId", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({
        status: "failed",
        message: "walletAddress is required",
      });
    }

    const student = await StudentProfile.findOneAndUpdate(
      { studentId: req.params.studentId },
      { walletAddress },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Wallet address updated",
      data: { student },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Student self-profile. Attendance rate is scoped to the modules the
// student is enrolled in — NOT "every session in the system" — so rates
// match the admin view for the same scope.
router.get("/profile/:studentId", async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }

    const modules = studentModules(student);
    const { rate, attended, total } = await computeAttendance(
      student.studentId,
      modules
    );

    student.attendanceRate = rate;
    const flag = flagFrom(rate);
    student.flagged = flag.flagged;
    student.flagReason = flag.flagReason;
    await student.save();

    const recentAttendance = await BlockchainAttendance.find({
      studentId: req.params.studentId,
    }).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({
      status: "success",
      data: {
        student,
        recentAttendance,
        totalSessions: total,
        attendedSessions: attended,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - All students (admin). Rate is computed as the intersection of the
// student's enrolled modules and the admin's module scope — a super_admin
// sees the student's full rate, a lecturer sees the rate only across modules
// they teach. Rates are returned inline and NOT persisted (different admins
// see different numbers for the same student by design).
router.get("/all", adminOnly, async (req, res) => {
  try {
    const students = await StudentProfile.find()
      .sort({ registeredAt: -1 })
      .lean();

    const moduleFilter = buildModuleFilter(req.authUser);
    const adminModules = moduleFilter.courseId ? moduleFilter.courseId.$in : null;

    for (let student of students) {
      const enrolled = student.course ? [student.course] : [];
      const scope = adminModules
        ? enrolled.filter((m) => adminModules.includes(m))
        : enrolled;

      const { rate, inScope } = await computeAttendance(student.studentId, scope);
      student.attendanceRate = rate;
      if (inScope) {
        const flag = flagFrom(rate);
        student.flagged = flag.flagged;
        student.flagReason = flag.flagReason;
      } else {
        student.flagged = false;
        student.flagReason = null;
      }
      student.inAdminScope = inScope;
    }

    const flaggedCount = students.filter((s) => s.flagged).length;

    return res.status(200).json({
      status: "success",
      data: {
        students,
        totalStudents: students.length,
        flaggedCount,
        threshold: LOW_ATTENDANCE_THRESHOLD,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Flagged students only (admin) — same scoping rule as /all.
router.get("/flagged", adminOnly, async (req, res) => {
  try {
    const allStudents = await StudentProfile.find().lean();
    const moduleFilter = buildModuleFilter(req.authUser);
    const adminModules = moduleFilter.courseId ? moduleFilter.courseId.$in : null;

    const flagged = [];
    for (let student of allStudents) {
      const enrolled = student.course ? [student.course] : [];
      const scope = adminModules
        ? enrolled.filter((m) => adminModules.includes(m))
        : enrolled;

      const { rate, inScope } = await computeAttendance(student.studentId, scope);
      if (!inScope) continue;
      if (rate < LOW_ATTENDANCE_THRESHOLD) {
        student.attendanceRate = rate;
        const flag = flagFrom(rate);
        student.flagged = true;
        student.flagReason = flag.flagReason;
        flagged.push(student);
      }
    }

    return res.status(200).json({
      status: "success",
      data: { students: flagged },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

module.exports = router;
