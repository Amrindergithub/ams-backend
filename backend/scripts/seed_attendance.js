require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

const Session = require("../api/v1/models/session");
const StudentProfile = require("../api/v1/models/student_profile");
const BlockchainAttendance = require("../api/v1/models/blockchain_attendance");
const blockchain = require("../api/v1/services/blockchain");

const STUDENT_ID = process.argv[2] || "2414204";
const TARGET_COUNT = parseInt(process.argv[3] || "5", 10);
const COURSE_ID = "CN6035";
const COURSE_NAME = "Computer and Network Security";
const LECTURER_EMAIL = "amrinder.lecturer@uel.ac.uk";

const envDbName = `${process.env.DB_NAME}-${process.env.NODE_ENV}`;
const mongoUri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${envDbName}`;

async function main() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log(`Connected to ${envDbName}`);

  const student = await StudentProfile.findOne({ studentId: STUDENT_ID });
  if (!student) throw new Error(`No StudentProfile for ${STUDENT_ID}`);
  console.log(`Student: ${student.name} (${student.studentId}) wallet=${student.walletAddress}`);

  const today = new Date();
  for (let i = 0; i < TARGET_COUNT; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (TARGET_COUNT - i));
    const dateStr = d.toISOString().slice(0, 10);
    const qrToken = crypto.randomBytes(32).toString("hex");

    const session = await new Session({
      courseId: COURSE_ID,
      courseName: COURSE_NAME,
      date: dateStr,
      startTime: "09:00",
      endTime: "11:00",
      createdBy: LECTURER_EMAIL,
      qrToken,
      qrExpiresAt: new Date(`${dateStr}T11:00`),
      isActive: false,
    }).save();

    const attendanceHash = blockchain.generateAttendanceHash(STUDENT_ID, COURSE_ID, dateStr);
    let txHash = null;
    let blockNumber = null;
    try {
      const chainResult = await blockchain.recordOnChain(attendanceHash);
      txHash = chainResult.txHash;
      blockNumber = chainResult.blockNumber;
      console.log(`  [${i + 1}/${TARGET_COUNT}] ${dateStr} → tx ${txHash.slice(0, 18)}... block ${blockNumber}`);
    } catch (err) {
      console.log(`  [${i + 1}/${TARGET_COUNT}] ${dateStr} → chain recording skipped (${err.message})`);
    }

    const checkInTime = new Date(`${dateStr}T09:05`);
    const checkOutTime = new Date(`${dateStr}T10:55`);
    session.checkIns.push({
      studentId: STUDENT_ID,
      studentName: student.name,
      walletAddress: student.walletAddress,
      checkInTime,
      checkOutTime,
      attendanceHash,
      txHash,
      blockNumber,
      status: "checked-out",
    });
    await session.save();

    await new BlockchainAttendance({
      studentId: STUDENT_ID,
      courseId: COURSE_ID,
      date: dateStr,
      walletAddress: student.walletAddress,
      attendanceHash,
      txHash,
      blockNumber,
      verified: !!txHash,
    }).save();
  }

  student.totalCheckIns = (student.totalCheckIns || 0) + TARGET_COUNT;
  student.totalCheckOuts = (student.totalCheckOuts || 0) + TARGET_COUNT;
  await student.save();
  console.log(`Updated ${STUDENT_ID}: totalCheckIns=${student.totalCheckIns} (rate recomputed on next profile fetch)`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
