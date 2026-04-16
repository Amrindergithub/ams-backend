const router = require("express").Router();
const { internalServerError } = require("../utils/response");
const StudentProfile = require("../models/student_profile");
const BlockchainAttendance = require("../models/blockchain_attendance");
const Session = require("../models/session");
const AuthMiddlewares = require("../middlewares/auth");
const { buildModuleFilter } = require("../utils/module_scope");

const LOW_ATTENDANCE_THRESHOLD = 75;

// Admin-only middleware chain.
const adminOnly = [
  AuthMiddlewares.checkAccessToken,
  AuthMiddlewares.validateAccessToken,
  AuthMiddlewares.checkAdminAccess,
];

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

// GET - Get student profile
router.get("/profile/:studentId", async (req, res) => {
  try {
    const student = await StudentProfile.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }

    const totalSessions = await Session.countDocuments({
      "checkIns.studentId": { $exists: true },
      isActive: false,
    });

    const attendedSessions = await Session.countDocuments({
      "checkIns.studentId": req.params.studentId,
    });

    const rate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;

    student.attendanceRate = rate;
    student.flagged = rate < LOW_ATTENDANCE_THRESHOLD;
    student.flagReason = rate < LOW_ATTENDANCE_THRESHOLD
      ? `Attendance rate ${rate}% is below ${LOW_ATTENDANCE_THRESHOLD}% threshold`
      : null;
    await student.save();

    const recentAttendance = await BlockchainAttendance.find({
      studentId: req.params.studentId,
    }).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({
      status: "success",
      data: {
        student,
        recentAttendance,
        totalSessions,
        attendedSessions,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - All students (admin) — attendance rate is computed relative to the
// caller's module scope, so two different lecturers see different rates for
// the same student. Rates are returned inline and NOT persisted, because
// each admin has a different view.
router.get("/all", adminOnly, async (req, res) => {
  try {
    const students = await StudentProfile.find()
      .sort({ registeredAt: -1 })
      .lean();

    // Sessions in the caller's module scope that have already ended — these
    // are the denominator for attendance rate calculations.
    const moduleFilter = buildModuleFilter(req.authUser);
    const totalSessions = await Session.countDocuments({
      ...moduleFilter,
      isActive: false,
    });

    for (let student of students) {
      const attended = await Session.countDocuments({
        ...moduleFilter,
        "checkIns.studentId": student.studentId,
      });
      const rate =
        totalSessions > 0
          ? Math.round((attended / totalSessions) * 100)
          : 100;
      student.attendanceRate = rate;
      student.flagged = rate < LOW_ATTENDANCE_THRESHOLD;
      student.flagReason =
        rate < LOW_ATTENDANCE_THRESHOLD
          ? `Attendance ${rate}% below ${LOW_ATTENDANCE_THRESHOLD}%`
          : null;
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

// GET - Flagged students only (admin) — recomputes per-request against the
// caller's module scope rather than relying on stored flag state.
router.get("/flagged", adminOnly, async (req, res) => {
  try {
    const allStudents = await StudentProfile.find().lean();
    const moduleFilter = buildModuleFilter(req.authUser);
    const totalSessions = await Session.countDocuments({
      ...moduleFilter,
      isActive: false,
    });

    const flagged = [];
    for (let student of allStudents) {
      const attended = await Session.countDocuments({
        ...moduleFilter,
        "checkIns.studentId": student.studentId,
      });
      const rate =
        totalSessions > 0
          ? Math.round((attended / totalSessions) * 100)
          : 100;
      if (rate < LOW_ATTENDANCE_THRESHOLD) {
        student.attendanceRate = rate;
        student.flagged = true;
        student.flagReason = `Attendance ${rate}% below ${LOW_ATTENDANCE_THRESHOLD}%`;
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