# AMS DApp — Web (Phase 1 submission)

Blockchain-backed Attendance Management System for CN6035. This folder is the Phase 1 deliverable: a React SPA talking to a Node/Express API that persists to MongoDB and writes attendance + certificate records to a local Ganache chain via Truffle-managed smart contracts.

## Features

- **Admin dashboard** — KPI cards with 7-day sparklines, recent attendance with on-chain hash pills, live NFT tier distribution (Bronze/Silver/Gold/Platinum).
- **Live session QR** — Projector-friendly QR broadcast with a live check-in feed polled every 5s.
- **Student scan flow** — Three-stage flow: camera reticle → confirmation receipt → on-chain success seal.
- **Student portal** — SVG attendance rate ring, NFT tier progress, recent check-ins with copyable tx hashes.
- **Certificate gallery** — Holographic tier cards with shine sweep; click opens a credential detail overlay.
- **Block explorer** — Filter-chip transaction view with click-to-copy hashes and relative timestamps.
- **Analytics** — 14-day gradient-stroke trend chart, module distribution bars, top-students leaderboard.
- **Public verifier** — Paste any attendance hash / tx hash / token id to confirm it was committed to the AMS ledger.

## Screens (design handoff references)

| Route                       | Design | Description                                  |
|-----------------------------|:------:|----------------------------------------------|
| `/admin`                    | #02    | Admin dashboard                              |
| `/admin/sessions`           | #03    | Live session QR + check-in feed              |
| `/student/scan`             | #04    | Student scan flow (idle → confirm → on-chain)|
| `/student`                  | #05    | Student portal                               |
| `/student/certificates`     | #06/07 | Certificate gallery + credential overlay     |
| `/admin/transactions`       | #08    | Block explorer                               |
| `/admin/analytics`          | #09    | Analytics                                    |
| `/verify`                   | #10    | Public verifier                              |

## Screenshots

Design-handoff reference shots live in `docs/screens/` (add PNGs as `02-dashboard.png`, `03-sessions.png`, etc. — filenames match the design numbers in the table above).

| # | Screen | Preview |
|---|--------|---------|
| 02 | Admin dashboard            | `docs/screens/02-dashboard.png` |
| 03 | Live session QR            | `docs/screens/03-sessions.png` |
| 04 | Student scan flow          | `docs/screens/04-scan.png` |
| 05 | Student portal             | `docs/screens/05-student.png` |
| 06 | Certificate gallery        | `docs/screens/06-certificates.png` |
| 07 | Credential detail overlay  | `docs/screens/07-credential.png` |
| 08 | Block explorer             | `docs/screens/08-transactions.png` |
| 09 | Analytics                  | `docs/screens/09-analytics.png` |
| 10 | Public verifier            | `docs/screens/10-verify.png` |

## Design system

Near-black crypto surfaces, violet → mint gradient (`#7c5cff → #00d4a8`), Geist / Geist Mono typography, tier-metallic NFT palette (bronze / silver / gold / platinum), glass panels with backdrop blur.

## Tech stack

- **Frontend:** React 18 (CRA), react-router-dom, ethers v5, `qrcode.react`, `html5-qrcode`.
- **Backend:** Node.js 18, Express, Mongoose, JWT auth.
- **Chain:** Solidity 0.8 contracts (`AttendanceRecord.sol`, `AttendanceNFT.sol`) deployed via Truffle to Ganache (chainId 1337).
- **Storage:** MongoDB (`ams-dapp-dev`) for off-chain metadata, Ganache for immutable records.

## Layout

```
ams_web/
├── frontend/   React SPA (student + admin portals, MetaMask login, QR flows, NFT certificates)
└── backend/    Node/Express API + Truffle workspace
    ├── api/          v1 routes, controllers, services, middlewares
    ├── core/         config, db, jwt, server bootstrap
    ├── contracts/    AttendanceRecord.sol, AttendanceNFT.sol
    ├── migrations/   Truffle deploy scripts
    ├── build/        Truffle-compiled ABI artefacts (consumed by services/)
    ├── utils/swagger/ OpenAPI spec (served at /explorer)
    └── index.js      entry point
```

Truffle + Node live in the same folder because `api/v1/services/blockchain.js` and `api/v1/services/nft.js` load ABIs via `../../../build/contracts/*.json`.

## Prerequisites

- Node.js 18+
- MongoDB running on `:27017`
- Ganache running on `:7545` with the contracts migrated (`cd backend && npx truffle migrate --reset`)
- MetaMask in the browser, connected to `http://localhost:7545` (chainId 1337)

## Run it

**Backend** (from `ams_web/backend/`):

```bash
npm install
npm run migrate:full    # truffle migrate --reset + sync contract addresses into .env
npm run seed            # idempotent: seeds admin + student + course docs
node index.js           # API on :5001, Swagger at /explorer
```

**Frontend** (from `ams_web/frontend/`, in a separate terminal):

```bash
npm install
npm start          # React dev server on :3000
```

**Optional — sanity check** before running the stack:

```bash
./scripts/preflight.sh    # pings Mongo :27017, Ganache :7545, API :5001, CRA :3000
```

Demo walkthrough (10-min marker tour) in [`DEMO.md`](./DEMO.md).

## Test credentials (dev DB `ams-dapp-dev`)

- Admin: `lecturer@uel.ac.uk` / `Admin123!` — wallet `0xc88170D193b0740C30fc2C694151155Be95618DE`
- Student: `u2414204@uel.ac.uk` / `Student123!` — wallet `0x82d9B534dd4620906ABCe7706244dDb1960D8b49`

## Key endpoints

- `POST /api/v1/auth/login` — email + password
- `POST /api/v1/auth/wallet-login` — sign-in-with-Ethereum flow
- `GET  /api/v1/session/active` — current QR session
- `POST /api/v1/attendance/checkin` — student QR check-in
- `GET  /api/v1/nft/tier-stats` — per-tier NFT distribution (dashboard panel)
- `GET  /api/v1/nft/tiers`, `POST /api/v1/nft/mint`, `GET /api/v1/nft/student/:wallet`, `GET /api/v1/nft/certificate/:tokenId`
- Interactive docs: [http://localhost:5001/explorer](http://localhost:5001/explorer)

## Architecture

```
                         ┌─────────────────────┐
                         │   MetaMask (Ext.)   │
                         │  signer / chainId   │
                         └──────────┬──────────┘
                                    │ JSON-RPC
┌──────────────────┐   REST   ┌─────▼─────┐   JSON-RPC   ┌──────────────┐
│  React SPA :3000 │◄────────►│ Express   │◄────────────►│ Ganache :7545│
│  (student+admin) │          │ API :5001 │              │ (chainId 1337│
└──────────┬───────┘          │  Mongoose │              │  Truffle)    │
           │                  │  JWT      │              └──────┬───────┘
           │                  └─────┬─────┘                     │
           │                        │                           │
           │                    Mongoose                     ABI via
           │                        ▼                     build/contracts/
           │                 ┌──────────────┐                   ▼
           │                 │  MongoDB     │             AttendanceRecord
           │                 │  :27017      │             AttendanceNFT
           │                 └──────────────┘             (Solidity 0.8)
           │
     OpenAPI /explorer  •  static build served by CRA dev-server in dev
```

## Data model

**On-chain (immutable, verifiable):**

- `AttendanceRecord.records[]` — `(student, attendanceHash, timestamp)`. The
  hash is `keccak256(studentId || courseId || date)`; the contract rejects
  duplicates so the record doubles as an anti-replay guard.
- `AttendanceNFT.certificates[]` — `(student, studentId, tier,
  sessionsAttended, issuedAt)`. Soul-bound: no `transferFrom`, one tier per
  wallet enforced by `hasTier[student][tier]`.

**Off-chain (MongoDB, `ams-dapp-dev`):**

- `users` — email / password hash (bcrypt) / role (`admin` | `student` |
  `super_admin`) / JWT refresh token.
- `studentprofiles` — studentId, wallet, totalCheckIns, totalCheckOuts.
- `sessions` — course metadata, `qrToken` (32-byte random), `qrExpiresAt`,
  embedded `checkIns[]` array.
- `blockchainattendances` — mirror of on-chain commits plus the original
  `studentId` + `courseId` + `txHash` for UI display.

**Why split?** The chain cannot hold PII (student names / emails) without
violating GDPR. The hybrid model stores only cryptographic commitments
on-chain and keeps mutable metadata in Mongo, letting the verifier endpoint
prove integrity without leaking identity.

## Auth model

Two login paths feed the same JWT session:

1. **Email + password** (`POST /api/v1/auth/login`) — bcrypt-verified, issues
   an access token (short-lived) and refresh token (longer). Admin accounts
   additionally require `adminApproved: true` set by a super-admin.
2. **Sign-in-with-Ethereum** (`POST /api/v1/auth/wallet-login`) — the client
   signs a server-issued nonce with MetaMask; the API recovers the address
   via `ethers.verifyMessage` and matches it to a `StudentProfile`.

Admin-only endpoints layer a module-scope filter on top of the JWT check
(`api/v1/utils/module_scope.js`): a lecturer can only create / view sessions
for modules listed in their `modules[]` claim. `super_admin` bypasses the
scope filter.

CORS is locked down via an allow-list (`backend/core/server.js`) driven by
`ALLOWED_ORIGINS` — defaults to `http://localhost:3000,http://127.0.0.1:3000`.

## Key endpoints

Full spec at `http://localhost:5001/explorer`. The table below covers the
core flow used in `DEMO.md` and the Postman collection.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST   | `/api/v1/auth/login`                    | Email + password login |
| POST   | `/api/v1/auth/wallet-login`             | Sign-in-with-Ethereum |
| POST   | `/api/v1/auth/register`                 | Admin / student registration |
| POST   | `/api/v1/auth/refresh`                  | Exchange refresh token |
| POST   | `/api/v1/session/create`                | Admin creates a live session + QR token |
| GET    | `/api/v1/session/all`                   | Admin lists sessions (module-scoped) |
| GET    | `/api/v1/session/qr/:token`             | Resolve QR token → session metadata |
| POST   | `/api/v1/session/check-in`              | Student check-in → contract commit |
| POST   | `/api/v1/session/check-out`             | Student check-out |
| PATCH  | `/api/v1/session/end/:id`               | Admin closes an active session |
| POST   | `/api/v1/attendance/verify`             | Public: verify hash on-chain |
| GET    | `/api/v1/attendance/student/:id`        | Per-student attendance history |
| GET    | `/api/v1/nft/tiers`                     | Tier definitions + running totals |
| GET    | `/api/v1/nft/tier-stats`                | Per-tier minted counts |
| POST   | `/api/v1/nft/mint`                      | Admin: mint tier certificate |
| GET    | `/api/v1/nft/student/:wallet`           | Certificates held by a wallet |
| GET    | `/api/v1/nft/certificate/:tokenId`      | Single certificate lookup |

## Testing

- **Backend unit tests** — `cd backend && npm test` runs the Mocha auth +
  helper suites. Uses an isolated `NODE_ENV=test` logger (see
  `core/logger.js`) so the suite output stays clean.
- **Contracts** — `cd backend && npx truffle test` exercises the record /
  mint flows on a throwaway Ganache instance. NatSpec on both contracts
  doubles as `solc` docs.
- **Frontend build** — `cd frontend && CI=true npm run build` is the green
  gate used before every commit during the polish pass.
- **Postman collection** — `docs/ams-dapp.postman_collection.json` — import
  into Postman, run top-to-bottom; collection variables auto-capture
  tokens and the attendance hash.

## Known limitations & Phase 2 roadmap

- **Single deployer key.** The backend holds the Ganache deployer and is
  the implicit issuer for all mints; realistic for the Phase 1 scope but
  flagged as Phase 2 work (move to a multi-sig / role-gated mint).
- **Email delivery stubbed.** `SENDGRID_API_KEY` is intentionally unset —
  verification emails are emitted to the server log. Flip one env var to
  go live.
- **Soul-bound, not ERC-721.** Transferable certificates don't fit the
  academic-credential model; the Phase 2 plan is a full ERC-5484
  implementation with revocation hooks for academic appeals.
- **Chain:** Ganache only. Phase 2 will redeploy to a public L2 testnet
  (Base Sepolia / Arbitrum Sepolia) once the issuer-key custody question
  is resolved.
- **Flutter client** lives in a sibling tree and is parked demo-ready; not
  part of this submission bundle.

## Academic reflection

Building the hybrid on/off-chain model made the privacy trade-offs concrete
— every field that lives on-chain had to be justified against the GDPR
right-to-erasure. The NatSpec pass forced me to re-read my own contracts as
a stranger would, which surfaced the anti-replay property of the hash-
unique constraint (previously implicit). Given more time I would move the
mint authority behind a role-gated facade so a compromised deployer key
can't unilaterally issue credentials, and replace the CRA toolchain with
Vite to shed most of the build-time audit noise.

## CN6035 rubric mapping

| Rubric band | Where to look |
| --- | --- |
| Smart contracts + testing | `backend/contracts/AttendanceRecord.sol`, `backend/contracts/AttendanceNFT.sol`, `backend/test/` (Truffle) |
| DApp integration (UI ↔ chain) | `frontend/src/utils/wallet.js`, `frontend/src/pages/ScanQR.js`, `backend/api/v1/services/{blockchain,nft}.js` |
| Authentication & security | `backend/api/v1/controllers/auth.js`, `backend/api/v1/middlewares/auth.js`, `backend/core/server.js` (CORS), `backend/core/jwt.js` |
| Off-chain persistence | `backend/api/v1/models/`, `backend/core/db.js` |
| UI / UX | `frontend/src/pages/*`, `frontend/src/context/ToastContext.js`, `frontend/src/components/{Skeleton,NotFound}.js`, `frontend/src/App.css` |
| API docs | `backend/utils/swagger/swagger.yaml`, `/api/v1/explorer` endpoint |
| Build / ops | `backend/scripts/{seed_users,seed_attendance,sync-contract-addrs}.js`, `scripts/preflight.sh`, `README.md`, `DEMO.md` |

## Known audit notes

After `npm audit fix`, residual advisories remain in **build-time / dev tooling only** — no runtime (production) exposure:

- **Backend:** transitive webpack/ws/yargs-parser warnings via `ganache`, `truffle`, `solc`. Clearing them needs `truffle@5.1.67` (major downgrade) — deferred post-submission.
- **Frontend:** transitive warnings in `react-scripts` 5 (webpack-dev-server, workbox, svgo). Clearing them needs `react-scripts@0.0.0` per `npm audit fix --force` — not viable, deferred.

No advisories touch the served API surface or the shipped React bundle.

## Contributing

- `main` = always green, submission-ready. Do not commit directly once the submission is tagged.
- Feature work on `feat/<short-slug>` branches, merged via pull request (even as a solo repo — it builds the review trail).
- **Conventional commits** — subject line `type(scope): imperative summary ≤72 chars`.
  - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `build`.
  - Scopes (examples): `ui`, `ui/dashboard`, `api/nft`, `auth`, `contracts`, `deps`, `repo`.
- Run `git config commit.template .gitmessage` once after cloning to pick up the local commit template.
- The `.githooks/commit-msg` hook blocks unwanted external co-author trailers; enable with `git config core.hooksPath .githooks`.
