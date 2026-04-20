const Session = require("../models/session");

const LOW_ATTENDANCE_THRESHOLD = 75;

// Compute a student's attendance rate against a set of module codes.
// Denominator = ended sessions for those modules. Numerator = ended sessions
// in that set where the student appears in checkIns. Only ended sessions
// count so in-progress lectures don't drag the rate down.
async function computeAttendance(studentId, moduleCodes) {
  if (!Array.isArray(moduleCodes) || moduleCodes.length === 0) {
    return { rate: 100, attended: 0, total: 0, inScope: false };
  }
  const baseFilter = { courseId: { $in: moduleCodes }, isActive: false };
  const total = await Session.countDocuments(baseFilter);
  const attended = await Session.countDocuments({
    ...baseFilter,
    "checkIns.studentId": studentId,
  });
  const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
  return { rate, attended, total, inScope: true };
}

function flagFrom(rate) {
  const flagged = rate < LOW_ATTENDANCE_THRESHOLD;
  return {
    flagged,
    flagReason: flagged
      ? `Attendance ${rate}% below ${LOW_ATTENDANCE_THRESHOLD}% threshold`
      : null,
  };
}

module.exports = { computeAttendance, flagFrom, LOW_ATTENDANCE_THRESHOLD };
