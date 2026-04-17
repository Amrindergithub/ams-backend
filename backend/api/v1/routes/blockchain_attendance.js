const router = require("express").Router();
const { internalServerError } = require("../utils/response");
const BlockchainAttendance = require("../models/blockchain_attendance");
const blockchain = require("../services/blockchain");
const AuthMiddlewares = require("../middlewares/auth");
const { buildModuleFilter, isModuleInScope } = require("../utils/module_scope");

// Admin-only middleware chain. Reused by every admin endpoint in this router.
const adminOnly = [
  AuthMiddlewares.checkAccessToken,
  AuthMiddlewares.validateAccessToken,
  AuthMiddlewares.checkAdminAccess,
];

// POST - Record attendance on-chain (public — used by student manual check-in)
router.post("/check-in", async (req, res) => {
  try {
    const { studentId, courseId, date, walletAddress } = req.body;

    if (!studentId || !courseId || !date) {
      return res.status(400).json({
        status: "failed",
        message: "studentId, courseId, and date are required",
      });
    }

    const attendanceHash = blockchain.generateAttendanceHash(studentId, courseId, date);

    const existing = await BlockchainAttendance.findOne({ attendanceHash });
    if (existing) {
      return res.status(400).json({
        status: "failed",
        message: "Attendance already recorded for this student, course, and date",
      });
    }

    const { txHash, blockNumber } = await blockchain.recordOnChain(attendanceHash);

    const record = new BlockchainAttendance({
      studentId,
      courseId,
      date,
      walletAddress: walletAddress || null,
      attendanceHash,
      txHash,
      blockNumber,
      verified: true,
    });
    await record.save();

    return res.status(201).json({
      status: "success",
      message: "Attendance recorded on blockchain",
      data: {
        attendanceHash,
        txHash,
        blockNumber,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Verify attendance on-chain
router.get("/verify/:hash", async (req, res) => {
  try {
    const { hash } = req.params;

    const onChainResult = await blockchain.verifyOnChain(hash);
    const offChainRecord = await BlockchainAttendance.findOne({ attendanceHash: hash });

    return res.status(200).json({
      status: "success",
      message: onChainResult.exists ? "Attendance verified on blockchain" : "Attendance not found on blockchain",
      data: {
        onChain: onChainResult,
        offChain: offChainRecord || null,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - All blockchain attendance records (admin, scoped by module)
router.get("/records", adminOnly, async (req, res) => {
  try {
    const records = await BlockchainAttendance.find(
      buildModuleFilter(req.authUser)
    ).sort({ createdAt: -1 });
    const onChainCount = await blockchain.getRecordCount();

    return res.status(200).json({
      status: "success",
      message: "Fetched blockchain attendance records",
      data: {
        records,
        onChainCount,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// DELETE - Remove a record from MongoDB (on-chain record remains immutable).
// 403 if the record's module is not in the caller's scope.
router.delete("/records/:id", adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await BlockchainAttendance.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: "failed",
        message: "Record not found",
      });
    }
    if (!isModuleInScope(req.authUser, existing.courseId)) {
      return res.status(403).json({
        status: "failed",
        message: "This record belongs to a module you do not own",
      });
    }
    await BlockchainAttendance.findByIdAndDelete(id);

    return res.status(200).json({
      status: "success",
      message: "Off-chain record deleted. On-chain record remains immutable.",
      data: { deletedId: id },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Export records as CSV (admin, scoped by module)
router.get("/export/csv", adminOnly, async (req, res) => {
  try {
    const records = await BlockchainAttendance.find(
      buildModuleFilter(req.authUser)
    ).sort({ createdAt: -1 });

    const header = "Student ID,Course,Date,Attendance Hash,Tx Hash,Block,Verified,Created At\n";
    const rows = records.map((r) =>
      `${r.studentId},${r.courseId},${r.date},${r.attendanceHash},${r.txHash},${r.blockNumber},${r.verified},${r.createdAt}`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendance-records.csv");
    return res.status(200).send(header + rows);
  } catch (error) {
    internalServerError(res, error);
  }
});

module.exports = router;