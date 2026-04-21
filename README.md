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
node index.js      # API on :5001, Swagger at /explorer
```

**Frontend** (from `ams_web/frontend/`, in a separate terminal):

```bash
npm install
npm start          # React dev server on :3000
```

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
