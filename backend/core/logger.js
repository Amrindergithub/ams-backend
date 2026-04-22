/*
 * Tiny console wrapper so runtime logs can be silenced in the test
 * environment (NODE_ENV=test) and tagged with a severity level in the
 * others. Boot-phase logs in core/server.js / core/db.js still use raw
 * console.log on purpose — they are startup breadcrumbs we want to see.
 *
 * Usage:
 *   const logger = require("../../../core/logger");
 *   logger.info("request handled");
 *   logger.error("failed to save user", err);
 */
const isTest = process.env.NODE_ENV === "test";

function info(...args) {
  if (isTest) return;
  // eslint-disable-next-line no-console
  console.log("[info]", ...args);
}

function warn(...args) {
  if (isTest) return;
  // eslint-disable-next-line no-console
  console.warn("[warn]", ...args);
}

function error(...args) {
  if (isTest) return;
  // eslint-disable-next-line no-console
  console.error("[error]", ...args);
}

module.exports = { info, warn, error };
