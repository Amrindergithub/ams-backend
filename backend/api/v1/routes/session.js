const router = require("express").Router();
const { internalServerError } = require("../utils/response");
const { errors, successMessages } = require("../utils/constants");
const Session = require("../models/session");
const StudentProfile = require("../models/student_profile");
const BlockchainAttendance = require("../models/blockchain_attendance");
const blockchain = require("../services/blockchain");
const crypto = require("crypto");
const logger = require("../../../core/logger");
const AuthMiddlewares = require("../middlewares/auth");
const { buildModuleFilter, isModuleInScope } = require("../utils/module_scope");

const { FAILED } = errors;
const { SUCCESS } = successMessages;

// Middleware chain that guarantees req.authUser exists and the caller is an
// admin / super_admin with adminApproved status. Reused by every admin-only
// endpoint in this router.
const adminOnly = [
  AuthMiddlewares.checkAccessToken,
  AuthMiddlewares.validateAccessToken,
  AuthMiddlewares.checkAdminAccess,
];

// POST - Admin creates a new session
router.post("/create", adminOnly, async (req, res) => {
  try {
    const { courseId, courseName, date, startTime, endTime } = req.body;

    if (!courseId || !courseName || !date || !startTime || !endTime) {
      return res.status(400).json({
        status: FAILED,
        message: "courseId, courseName, date, startTime, and endTime are required",
      });
    }

    // A regular admin can only create sessions for modules they own.
    // super_admin is allowed to create sessions for any module.
    if (!isModuleInScope(req.authUser, courseId)) {
      return res.status(403).json({
        status: FAILED,
        message: `You are not assigned to module ${courseId}`,
      });
    }

    // Generate unique QR token
    const qrToken = crypto.randomBytes(32).toString("hex");

    // QR expires at session end time
    const expiryDate = new Date(`${date}T${endTime}`);

    const session = new Session({
      courseId,
      courseName,
      date,
      startTime,
      endTime,
      // createdBy is the authenticated admin's email, not something the
      // client can spoof via the request body.
      createdBy: req.authUser.email,
      qrToken,
      qrExpiresAt: expiryDate,
    });

    await session.save();

    return res.status(201).json({
      status: SUCCESS,
      message: "Session created successfully",
      data: {
        sessionId: session._id,
        qrToken,
        qrExpiresAt: expiryDate,
        courseId,
        courseName,
        date,
        startTime,
        endTime,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// POST - Student checks in via QR token
router.post("/check-in", async (req, res) => {
  try {
    const { qrToken, studentId, walletAddress } = req.body;

    if (!qrToken || !studentId) {
      return res.status(400).json({
        status: FAILED,
        message: "qrToken and studentId are required",
      });
    }

    // Find session by QR token
    const session = await Session.findOne({ qrToken, isActive: true });
    if (!session) {
      return res.status(404).json({
        status: FAILED,
        message: "Invalid or expired QR code",
      });
    }

    // Check if student already checked in
    const existingCheckIn = session.checkIns.find(
      (c) => c.studentId === studentId
    );
    if (existingCheckIn) {
      return res.status(400).json({
        status: FAILED,
        message: "You have already checked in for this session",
      });
    }

    // Get student profile
    const student = await StudentProfile.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        status: FAILED,
        message: "Student not registered. Please register first.",
      });
    }

    // Generate hash and record on blockchain
    const attendanceHash = blockchain.generateAttendanceHash(
      studentId,
      session.courseId,
      session.date
    );

    let txHash = null;
    let blockNumber = null;

    try {
      const chainResult = await blockchain.recordOnChain(attendanceHash);
      txHash = chainResult.txHash;
      blockNumber = chainResult.blockNumber;
    } catch (err) {
      logger.warn("Blockchain recording failed, continuing with off-chain:", err.message);
    }

    // Add check-in to session
    session.checkIns.push({
      studentId,
      studentName: student.name,
      walletAddress: walletAddress || student.walletAddress,
      checkInTime: new Date(),
      attendanceHash,
      txHash,
      blockNumber,
      status: "checked-in",
    });
    await session.save();

    // Save to blockchain attendance collection too
    const record = new BlockchainAttendance({
      studentId,
      courseId: session.courseId,
      date: session.date,
      walletAddress: walletAddress || student.walletAddress,
      attendanceHash,
      txHash,
      blockNumber,
      verified: !!txHash,
    });
    await record.save();

    // Update student stats
    student.totalCheckIns += 1;
    await student.save();

    return res.status(201).json({
      status: SUCCESS,
      message: "Checked in successfully",
      data: {
        sessionId: session._id,
        courseId: session.courseId,
        courseName: session.courseName,
        checkInTime: new Date(),
        attendanceHash,
        txHash,
        blockNumber,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// POST - Student checks out
router.post("/check-out", async (req, res) => {
  try {
    const { qrToken, studentId } = req.body;

    if (!qrToken || !studentId) {
      return res.status(400).json({
        status: FAILED,
        message: "qrToken and studentId are required",
      });
    }

    const session = await Session.findOne({ qrToken });
    if (!session) {
      return res.status(404).json({
        status: FAILED,
        message: "Session not found",
      });
    }

    const checkIn = session.checkIns.find((c) => c.studentId === studentId);
    if (!checkIn) {
      return res.status(400).json({
        status: FAILED,
        message: "You have not checked in for this session",
      });
    }

    if (checkIn.status === "checked-out") {
      return res.status(400).json({
        status: FAILED,
        message: "You have already checked out",
      });
    }

    checkIn.checkOutTime = new Date();
    checkIn.status = "checked-out";
    await session.save();

    // Update student stats
    const student = await StudentProfile.findOne({ studentId });
    if (student) {
      student.totalCheckOuts += 1;
      await student.save();
    }

    // Calculate duration
    const duration = Math.round(
      (checkIn.checkOutTime - checkIn.checkInTime) / 60000
    );

    return res.status(200).json({
      status: SUCCESS,
      message: "Checked out successfully",
      data: {
        checkOutTime: checkIn.checkOutTime,
        durationMinutes: duration,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Get all sessions (admin) — scoped to the lecturer's own modules.
// super_admin sees every session in the system.
router.get("/all", adminOnly, async (req, res) => {
  try {
    const sessions = await Session.find(buildModuleFilter(req.authUser)).sort({
      createdAt: -1,
    });
    return res.status(200).json({
      status: SUCCESS,
      data: { sessions },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Get session by ID (admin) — 403 if the session's module is not
// in the caller's scope.
router.get("/:id", adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        status: FAILED,
        message: "Session not found",
      });
    }
    if (!isModuleInScope(req.authUser, session.courseId)) {
      return res.status(403).json({
        status: FAILED,
        message: "This session belongs to a module you do not own",
      });
    }
    return res.status(200).json({
      status: SUCCESS,
      data: { session },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Get session by QR token (for students scanning)
router.get("/qr/:token", async (req, res) => {
  try {
    const session = await Session.findOne({
      qrToken: req.params.token,
      isActive: true,
    });
    if (!session) {
      return res.status(404).json({
        status: FAILED,
        message: "Invalid or expired QR code",
      });
    }
    return res.status(200).json({
      status: SUCCESS,
      data: {
        sessionId: session._id,
        courseId: session.courseId,
        courseName: session.courseName,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        totalCheckIns: session.checkIns.length,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// PATCH - End session (admin) — 403 if the caller doesn't own the module.
router.patch("/end/:id", adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        status: FAILED,
        message: "Session not found",
      });
    }

    if (!isModuleInScope(req.authUser, session.courseId)) {
      return res.status(403).json({
        status: FAILED,
        message: "This session belongs to a module you do not own",
      });
    }

    session.isActive = false;

    // Mark anyone who didn't check out
    session.checkIns.forEach((c) => {
      if (c.status === "checked-in") {
        c.checkOutTime = new Date();
        c.status = "checked-out";
      }
    });

    await session.save();

    return res.status(200).json({
      status: SUCCESS,
      message: "Session ended",
      data: {
        totalAttendees: session.checkIns.length,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

module.exports = router;