const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  course: { type: String, required: true },
  walletAddress: { type: String, default: null },
  enrollmentYear: { type: String, default: null },
  totalCheckIns: { type: Number, default: 0 },
  totalCheckOuts: { type: Number, default: 0 },
  attendanceRate: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: null },
  registeredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("StudentProfile", studentProfileSchema);