const AccountConstants = require("./constants").account;

/**
 * Build a Mongo query fragment that restricts results to a single lecturer's
 * modules. Returns `{}` for super_admin so they see everything.
 *
 * @param {{role: string, modules?: string[]}} authUser - the authenticated
 *   admin, as loaded by the checkAdminAccess middleware.
 * @param {string} [field="courseId"] - the field on the target collection
 *   that holds the module code (Session, BlockchainAttendance etc. all use
 *   "courseId").
 * @returns {object} Mongoose-compatible filter fragment.
 */
function buildModuleFilter(authUser, field = "courseId") {
  if (!authUser) return { [field]: { $in: [] } };
  if (authUser.role === AccountConstants.accRoles.superAdmin) return {};
  const modules = Array.isArray(authUser.modules) ? authUser.modules : [];
  return { [field]: { $in: modules } };
}

/**
 * Returns true if the given authUser is allowed to act on a resource with
 * the supplied module code. Used by write endpoints that need to check
 * ownership on an existing document (e.g. end-session, delete-record).
 */
function isModuleInScope(authUser, moduleCode) {
  if (!authUser) return false;
  if (authUser.role === AccountConstants.accRoles.superAdmin) return true;
  const modules = Array.isArray(authUser.modules) ? authUser.modules : [];
  return modules.includes(moduleCode);
}

module.exports = { buildModuleFilter, isModuleInScope };
