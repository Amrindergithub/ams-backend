const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  createdBy: { type: String, required: true },
  qrToken: { type: String, required: true, unique: true },
  qrExpiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  checkIns: [
    {
      studentId: { type: String, required: true },
      studentName: { type: String },
      walletAddress: { type: String },
      checkInTime: { type: Date, default: Date.now },
      checkOutTime: { type: Date, default: null },
      attendanceHash: { type: String },
      txHash: { type: String },
      blockNumber: { type: Number },
      status: {
        type: String,
        enum: ["checked-in", "checked-out", "absent"],
        default: "checked-in",
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);