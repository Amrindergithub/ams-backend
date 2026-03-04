const router = require("express").Router();
const { internalServerError } = require("../utils/response");
const BlockchainAttendance = require("../models/blockchain_attendance");
const blockchain = require("../services/blockchain");

// POST - Record attendance on-chain
router.post("/check-in", async (req, res) => {
  try {
    const { studentId, courseId, date, walletAddress } = req.body;

    if (!studentId || !courseId || !date) {
      return res.status(400).json({
        status: "failed",
        message: "studentId, courseId, and date are required",
      });
    }

    // Generate hash from attendance data
    const attendanceHash = blockchain.generateAttendanceHash(studentId, courseId, date);

    // Check if already recorded
    const existing = await BlockchainAttendance.findOne({ attendanceHash });
    if (existing) {
      return res.status(400).json({
        status: "failed",
        message: "Attendance already recorded for this student, course, and date",
      });
    }

    // Record on blockchain
    const { txHash, blockNumber } = await blockchain.recordOnChain(attendanceHash);

    // Save to MongoDB
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

// GET - All blockchain attendance records
router.get("/records", async (req, res) => {
  try {
    const records = await BlockchainAttendance.find().sort({ createdAt: -1 });
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

module.exports = router;