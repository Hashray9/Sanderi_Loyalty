# Sanderi Loyalty

NFC-based loyalty points platform for Sanderi Hardware & Plywood stores.

## Architecture

- **Mobile App**: React Native (Expo + Dev Client) for staff
- **Backend API**: Node.js/Express (TypeScript + Prisma)
- **Database**: PostgreSQL

## Project Structure

```
Sanderi_Loyalty/
├── apps/
│   └── mobile/           # React Native (Expo) app
├── packages/
│   └── api/              # Backend API
└── package.json          # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL
- Android/iOS device with NFC (for mobile testing)

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment
cp packages/api/.env.example packages/api/.env
# Edit .env with your database URL

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed database (optional)
pnpm --filter @sanderi/api db:seed
```

### Development

```bash
# Start API server
pnpm dev:api

# Start mobile app (in another terminal)
pnpm dev:mobile
```

### Test Credentials (after seeding)

- **Admin**: 9999999999 / admin123
- **Employee**: 8888888888 / employee123

## Features

- NFC card scanning
- Point credit/debit with FIFO expiry
- Offline-first mobile app
- Multi-language support (English/Gujarati)
- Dark/Light theme
- Card enrollment, blocking, and reissue
- Transaction history
- Mobile number lookup

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Staff login |
| GET | `/cards/:cardUid/status` | Get card status |
| POST | `/cards/enroll` | Enroll new card |
| POST | `/cards/:cardUid/block` | Block card |
| POST | `/cards/reissue` | Transfer balances |
| GET | `/cards/:cardUid/history` | Transaction history |
| POST | `/points/credit` | Add points |
| POST | `/points/debit` | Deduct points |
| POST | `/points/:entryId/void` | Void transaction |
| GET | `/customers/search` | Search by mobile |
| POST | `/sync/offline-actions` | Batch sync |

## License

Private - All rights reserved
