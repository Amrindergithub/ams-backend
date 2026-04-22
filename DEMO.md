# DEMO — AMS DApp (10-min marker walkthrough)

A scripted tour of the Phase 1 deliverable. Target length **≤ 10 min**. Each
step maps to a design-handoff screen (see `docs/screens/`) and cites the
endpoint / contract call that backs the click.

## 0 · Pre-flight (do before the marker joins the call)

| Check | Command |
| --- | --- |
| Mongo + Ganache + API + CRA up | `./scripts/preflight.sh` |
| Contracts migrated, addresses synced | `cd backend && npm run migrate:full` |
| Seeded users present | `cd backend && npm run seed` |
| MetaMask connected to Ganache | chainId **1337**, RPC `http://localhost:7545` |
| Ganache test account imported | any private key from `ganache` output |
| Chrome zoom = 100 %, window 1440 × 900 | (consistent with screenshots) |

Open three tabs:

1. `http://localhost:3000` — the DApp.
2. `http://localhost:5001/explorer` — Swagger / OpenAPI spec.
3. Ganache UI — blocks + accounts + events.

Test credentials (from `backend/scripts/seed_users.js`):

- **Admin / lecturer:** `lecturer@uel.ac.uk` / `Admin123!`
- **Student:** `u2414204@uel.ac.uk` / `Student123!`

---

## 1 · Landing (30 s) · design #01

> "This is the Phase 1 web client — a React SPA that talks to an Express API
> and a Ganache chain via Truffle."

Point out:
- Two portals (admin vs student) — same bundle, role-scoped routes.
- "Ganache · on-chain" live pill → heartbeat pulled every 6 s from
  `eth_blockNumber` / `eth_gasPrice` in `components/Navbar.js`.

## 2 · Admin login + dashboard (90 s) · design #02

Login → admin KPI grid.

> "Every number on this page is pulled from the `BlockchainAttendance`
> collection — the hash next to each row is the on-chain receipt."

Highlights:
- KPI cards (total check-ins, verified %, active sessions, NFTs minted).
- 7-day sparkline grouped by day.
- Recent-attendance rows with **click-to-copy** attendance hash + tx hash.
- NFT tier distribution panel (bronze / silver / gold / platinum) —
  fetched from `GET /api/v1/nft/tier-stats`.
- Export CSV in the header triggers a toast confirmation (toast system
  was added for Phase 1 polish — see `context/ToastContext.js`).

## 3 · Create live session (60 s) · design #03

Go to **Sessions → New session**. Fill course + time → submit.

Backend path: `POST /api/v1/sessions/create` (admin-only middleware) writes a
Session doc with a 32-byte `qrToken` that expires at session end time.

Switch to QR display:

- Left: projector QR (from `qrcode.react` using the token).
- Right: check-in feed polled every 5 s — initially empty.
- Bottom: contract pill showing the AttendanceNFT address (auto-wired via
  `backend/scripts/sync-contract-addrs.js`).

## 4 · Student flow: scan + on-chain commit (120 s) · design #04 → #05

Open a second browser profile (incognito) → student login.

Navigate to **Scan** → the three-stage flow:

1. **Idle** — camera reticle pulsing.
2. **Confirm receipt** — decoded token preview, studentId + session.
3. **On-chain success** — `✓ SIGNED` seal + attendance hash + tx hash.

Under the hood (`session.js` routes):

- `/check-in` validates QR token, hashes `(studentId, courseId, date)` as
  `keccak256`, submits via `AttendanceRecord.recordAttendance(bytes32)`,
  stores the receipt in Mongo as `BlockchainAttendance`.
- Contract reverts on duplicate hash → anti-replay.

Switch back to **admin tab** — new row appears in the live feed within 5 s,
KPI "Total check-ins" increments.

Switch to **Ganache tab** — new block, new event `AttendanceRecorded`.

## 5 · Student portal (45 s) · design #06

Student dashboard:
- SVG attendance-rate ring (animated on mount).
- NFT tier progress bar ("next tier in N sessions").
- Recent check-ins list with copyable tx hashes.

Data source: `GET /api/v1/students/profile/:studentId` + `GET /api/v1/blockchain/records`.

## 6 · NFT certificates (75 s) · design #07 + #08

Admin tab → **Certificates**.

> "Soul-bound tier certificates. The contract intentionally isn't
> ERC-721-transfer-compliant — transfer semantics don't fit an academic
> credential model. One cert per tier per wallet, enforced in Solidity."

Click **Mint bronze** on a student who qualifies → `POST /api/v1/nft/mint` →
`AttendanceNFT.mintCertificate(address, studentId, tier, sessionsAttended)`.

Success toast; tile flips; total-minted counter bumps.

Student tab → **My certificates**. Show the holographic tier card with
click-to-detail overlay.

## 7 · Block explorer + analytics (60 s) · design #09 + #10

Admin tab → **Transactions**. Filter chips (all / verified / flagged).
Click any hash → toast confirms copy.

Admin tab → **Analytics**:
- 14-day gradient trend chart.
- Module distribution bars.
- Top-students leaderboard (empty state → "Record a first attendance…").

## 8 · Public verifier (60 s) · design #11

Tab → `/admin/verify` (or `/student/verify` — both routes use the same
component).

Paste the attendance hash from step 4. Emphasise client-side validation:

- 64-hex raw hash ✓
- 0x-prefixed 66-char ✓
- numeric token id ✓

Hit **Verify on-chain** → `GET /api/v1/blockchain/verify/:hash` → calls
`AttendanceRecord.verifyAttendance(bytes32)` → shows wallet / timestamp /
block number. If the hash was never committed, renders the "Not found
on-chain" verdict.

## 9 · Code / architecture (45 s — optional if short on time)

If the marker wants source:

- `backend/contracts/` — two Solidity 0.8 contracts with NatSpec.
- `backend/api/v1/routes/` — thin routing layer; controllers + services
  co-located. `core/server.js` enforces an explicit CORS allow-list driven
  by `ALLOWED_ORIGINS`.
- `frontend/src/utils/api.js` — axios client, baseURL from
  `REACT_APP_API_BASE_URL`.
- `frontend/src/context/ToastContext.js` + `components/Skeleton.js` —
  app-wide UX primitives added in the polish pass.

---

## Recovery cheatsheet (demo gremlins)

| Symptom | Fix |
| --- | --- |
| Dashboard empty, 500 in DevTools | Backend down — `cd backend && node index.js` |
| "Blockchain recording failed" warning in server log | Ganache port wrong — ensure `:7545`, chainId 1337 |
| Student login works, actions blocked with "module not in scope" | Seed script not run — `cd backend && npm run seed` |
| MetaMask asks for a different chain | Re-add Ganache network (RPC `http://localhost:7545`, chainId 1337) |
| Frontend white screen after migrate | Contract addresses stale — `cd backend && npm run migrate:full` regenerates both `.env` files |
| CORS error in console from a different origin | Add it to `ALLOWED_ORIGINS` in `backend/.env` and restart API |

## Known limitations (call out proactively)

- **Phase 1 scope.** Flutter client is parked demo-ready; not part of the
  web submission.
- **SendGrid disabled.** Email verification emits to the server log instead
  of sending; intentional while the API key is unset.
- **Single Ganache deployer key.** No on-chain ACL on mint — the backend
  holds the deployer account as a trusted issuer. Realistic for this Phase
  1 scope; flagged in the report as Phase 2 work.
- **Bundle / dev-dep audit noise.** `npm audit` surfaces advisories in
  `react-scripts` 5 + `truffle` build tooling only; no runtime exposure
  (documented in README).
