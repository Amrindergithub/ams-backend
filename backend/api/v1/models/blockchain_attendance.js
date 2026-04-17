const mongoose = require("mongoose");

const blockchainAttendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  date: { type: String, required: true },
  walletAddress: { type: String, default: null },
  attendanceHash: { type: String, required: true },
  txHash: { type: String, default: null },
  blockNumber: { type: Number, default: null },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlockchainAttendance", blockchainAttendanceSchema);