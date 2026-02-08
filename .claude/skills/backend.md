---
paths:
  - "packages/api/src/**/*.ts"
  - "packages/api/prisma/**"
  - "packages/api/.env"
---

# Backend Architecture

## Structure

```
packages/api/
├── src/
│   ├── routes/          # auth, cards, points, customers, sync, app
│   ├── services/        # pointService (FIFO expiry)
│   ├── middleware/      # auth (JWT), validate (Zod), errorHandler
│   ├── jobs/            # pointExpiry (cron)
│   └── index.ts         # Express app entry
├── prisma/              # Schema, migrations, seed
├── tests/
└── .env                 # DB, JWT, app config
```

## Route Organization

- **auth**: Login, logout, token refresh
- **cards**: Card CRUD, enrollment, blocking
- **points**: Credit, debit, transfers, expiry
- **customers**: CardHolder management
- **sync**: Offline queue sync endpoints
- **app**: Health checks, version info

## Middleware Stack

- **auth**: JWT verification, token extraction
- **validate**: Zod schema validation for request bodies
- **errorHandler**: Centralized error response formatting

## Key Patterns

### FIFO Points System

Points expire oldest-first via `pointsRemaining` tracking:

- 12-month expiry from credit date
- Each `PointEntry` tracks `pointsRemaining` (0 when fully consumed)
- Debits consume from oldest entries first
- Expiry job runs daily via node-cron

### Idempotency Pattern

All mutations use `entryId`:

- Client generates unique `entryId` per operation
- Server checks `ProcessedEntry` table before execution
- Prevents duplicate credits/debits on retry

### Scheduled Jobs

`jobs/pointExpiry.ts`:

- Runs via node-cron (daily at midnight)
- Batch expires points older than 12 months
- Creates `EXPIRY` type PointEntry records

## Commands

```bash
# From packages/api/
npm run dev              # Start dev server (tsx watch)
npm run build            # TypeScript compile
npm start                # Production server
npm test                 # Jest tests
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio
npm run db:seed          # Seed database
```
