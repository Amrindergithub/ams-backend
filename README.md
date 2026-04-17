# AMS DApp — Web (Phase 1 submission)

Blockchain-backed Attendance Management System for CN6035. This folder is the Phase 1 deliverable: a React SPA talking to a Node/Express API that persists to MongoDB and writes attendance + certificate records to a local Ganache chain via Truffle-managed smart contracts.

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

- `POST /api/v1/auth/login` — email+password
- `POST /api/v1/auth/wallet-login` — sign-in-with-Ethereum flow
- `GET  /api/v1/session/active` — current QR session
- `POST /api/v1/attendance/checkin` — student QR check-in
- `GET  /api/v1/nft/tiers`, `POST /api/v1/nft/mint`, `GET /api/v1/nft/student/:wallet`, `GET /api/v1/nft/certificate/:tokenId`
- Interactive docs: [http://localhost:5001/explorer](http://localhost:5001/explorer)
