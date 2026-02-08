---
paths:
  - "packages/api/prisma/**"
  - "packages/api/src/services/**"
  - "packages/api/src/routes/**"
---

# Database Schema

## Prisma Models (10)

### Core Hierarchy

```
Franchisee
  └── Store
      └── Staff
```

### Card System

**Card**

- `cardUid` (PK): Unique NFC identifier
- `status`: UNASSIGNED | ACTIVE | BLOCKED
- → **CardHolder** (customer information)

### Point Ledger

**PointEntry**

- `type`: CREDIT | DEBIT | EXPIRY | VOID | TRANSFER
- `category`: HARDWARE | PLYWOOD
- `pointsRemaining`: FIFO tracking field (0 when fully consumed)
- `expiryDate`: 12 months from credit

### Supporting Models

**CardBlock**

- `reason`: LOST | STOLEN | FRAUD | OTHER
- Links to Card and blocking Staff

**MobileLookup**

- Monthly search limit tracking per mobile number

**ProcessedEntry**

- `entryId`: Unique operation identifier
- Prevents duplicate transactions

## Commands

```bash
# From packages/api/
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Create and apply migration
npx prisma migrate deploy     # Apply in production
npx prisma db push            # Push schema without migration
npx prisma studio             # Open GUI
npm run db:seed               # Seed sample data
```
