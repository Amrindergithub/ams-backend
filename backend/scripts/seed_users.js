/*
 * Seed demo accounts for local dev + coursework demo.
 *
 * Creates one admin/lecturer + one student. Idempotent — running twice
 * updates the existing password/profile rather than erroring on unique-
 * index conflicts.
 *
 * Usage:
 *   node scripts/seed_users.js
 *
 * After this, you can log in via:
 *   Admin:   lecturer@uel.ac.uk / Admin123!
 *   Student: u2414204@uel.ac.uk / Student123!
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Auth = require("../api/v1/models/auth");
const StudentProfile = require("../api/v1/models/student_profile");
const AccountConstants = require("../api/v1/utils/constants").account;
const Headers = require("../api/v1/utils/constants").headers;

// --- demo fixtures (mirror values documented in README) -------------------
const ADMIN = {
  email: "lecturer@uel.ac.uk",
  password: "Admin123!",
  name: "Dr. Mayank",
  role: AccountConstants.accRoles.admin,
  status: AccountConstants.accountStatus.adminApproved,
  modules: ["CN6035"],
  walletAddress: "0xc88170D193b0740C30fc2C694151155Be95618DE",
};

const STUDENT = {
  email: "u2414204@uel.ac.uk",
  password: "Student123!",
  name: "Amrinder",
  role: AccountConstants.accRoles.normalUser,
  status: AccountConstants.accountStatus.active,
  walletAddress: "0x82d9B534dd4620906ABCe7706244dDb1960D8b49",
  profile: {
    studentId: "2414204",
    course: "CN6035",
    enrollmentYear: "2024",
  },
};

const envDbName = `${process.env.DB_NAME}-${process.env.NODE_ENV}`;
const mongoUri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${envDbName}`;

async function upsertAuth(fixture) {
  const existing = await Auth.findOne({ email: fixture.email });
  const hashed = await bcrypt.hash(fixture.password, 10);

  if (existing) {
    existing.password = hashed;
    existing.role = fixture.role;
    existing.status = fixture.status;
    existing.provider = Headers.EMAIL_KEY;
    existing.walletAddress = fixture.walletAddress || null;
    existing.name = fixture.name || "";
    if (fixture.modules) existing.modules = fixture.modules;
    await existing.save();
    console.log(`  updated  Auth  ${fixture.email}  (role=${fixture.role})`);
    return existing;
  }

  const created = await new Auth({
    email: fixture.email,
    password: hashed,
    role: fixture.role,
    status: fixture.status,
    provider: Headers.EMAIL_KEY,
    walletAddress: fixture.walletAddress || null,
    modules: fixture.modules || [],
    name: fixture.name || "",
  }).save();
  console.log(`  created  Auth  ${fixture.email}  (role=${fixture.role})`);
  return created;
}

async function upsertStudentProfile(fixture) {
  const existing = await StudentProfile.findOne({
    studentId: fixture.profile.studentId,
  });

  if (existing) {
    existing.name = fixture.name;
    existing.email = fixture.email;
    existing.course = fixture.profile.course;
    existing.walletAddress = fixture.walletAddress;
    existing.enrollmentYear = fixture.profile.enrollmentYear;
    await existing.save();
    console.log(
      `  updated  StudentProfile  ${fixture.profile.studentId}  (${fixture.name})`
    );
    return existing;
  }

  const created = await new StudentProfile({
    studentId: fixture.profile.studentId,
    name: fixture.name,
    email: fixture.email,
    course: fixture.profile.course,
    walletAddress: fixture.walletAddress,
    enrollmentYear: fixture.profile.enrollmentYear,
  }).save();
  console.log(
    `  created  StudentProfile  ${fixture.profile.studentId}  (${fixture.name})`
  );
  return created;
}

async function main() {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`Connected to ${envDbName}`);

  console.log("Seeding demo accounts:");
  await upsertAuth(ADMIN);
  await upsertAuth(STUDENT);
  await upsertStudentProfile(STUDENT);

  await mongoose.disconnect();
  console.log("\nSeed complete. Test credentials:");
  console.log(`  Admin:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  Student: ${STUDENT.email} / ${STUDENT.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
