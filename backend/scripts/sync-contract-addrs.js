/*
 * Sync Truffle-deployed contract addresses into .env files.
 *
 * Reads `build/contracts/AttendanceRecord.json` and `AttendanceNFT.json`,
 * picks the most recent network entry, and upserts the addresses into:
 *   - backend/.env           (CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS)
 *   - frontend/.env          (REACT_APP_NFT_CONTRACT_ADDRESS)
 *
 * Idempotent — replaces keys in place if present, appends if missing.
 * Invoked automatically by `npm run migrate:full`.
 */
const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "..", "build", "contracts");
const BACKEND_ENV = path.join(__dirname, "..", ".env");
const FRONTEND_ENV = path.join(__dirname, "..", "..", "frontend", ".env");

function loadAddress(artifactName) {
  const artifactPath = path.join(BUILD_DIR, `${artifactName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Missing Truffle artifact: ${artifactPath}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const networks = artifact.networks || {};
  const networkIds = Object.keys(networks);
  if (networkIds.length === 0) {
    throw new Error(
      `No network deployments found in ${artifactName}.json — run \`truffle migrate\` first.`
    );
  }
  // Prefer the most recently updated network (highest numeric id = most recent ganache session).
  const latestId = networkIds.sort((a, b) => Number(b) - Number(a))[0];
  const address = networks[latestId].address;
  if (!address) {
    throw new Error(
      `No deployed address for ${artifactName} on network ${latestId}.`
    );
  }
  return { networkId: latestId, address };
}

function upsertEnv(envPath, updates) {
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }

  const lines = content.split("\n");
  const seen = new Set();

  const newLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)\s*=/);
    if (!match) return line;
    const key = match[1];
    if (updates[key] !== undefined) {
      seen.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  // Append keys that weren't already present.
  const missing = Object.keys(updates).filter((k) => !seen.has(k));
  if (missing.length) {
    if (newLines.length && newLines[newLines.length - 1] !== "") {
      newLines.push("");
    }
    for (const key of missing) {
      newLines.push(`${key}=${updates[key]}`);
    }
  }

  fs.writeFileSync(envPath, newLines.join("\n"));
}

function main() {
  const record = loadAddress("AttendanceRecord");
  const nft = loadAddress("AttendanceNFT");

  console.log(`AttendanceRecord @ ${record.address}  (network ${record.networkId})`);
  console.log(`AttendanceNFT    @ ${nft.address}  (network ${nft.networkId})`);

  upsertEnv(BACKEND_ENV, {
    CONTRACT_ADDRESS: record.address,
    NFT_CONTRACT_ADDRESS: nft.address,
  });
  console.log(`  wrote  ${path.relative(process.cwd(), BACKEND_ENV)}`);

  upsertEnv(FRONTEND_ENV, {
    REACT_APP_NFT_CONTRACT_ADDRESS: nft.address,
  });
  console.log(`  wrote  ${path.relative(process.cwd(), FRONTEND_ENV)}`);

  console.log("\nAddresses synced. Restart backend + frontend to pick up new values.");
}

try {
  main();
} catch (err) {
  console.error(`sync-contract-addrs failed: ${err.message}`);
  process.exit(1);
}
