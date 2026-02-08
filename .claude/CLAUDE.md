# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NFC-based loyalty points platform for Sanderi Hardware & Plywood stores.

## Repository Info

- **Name:** Sanderi_Loyalty
- **Remote:** https://github.com/Hashray9/Sanderi_Loyalty.git
- **Git LFS:** Enabled

## Architecture

- **Mobile App**: `apps/mobile-new/` - Bare React Native 0.83.1 (React 19.2)
- **Backend API**: `packages/api/` - Node.js/Express (TypeScript + Prisma)
- **Database**: PostgreSQL (localhost:5432)
- **Package Manager**: npm (no monorepo tooling)

## Critical Patterns

- **FIFO Points**: 12-month expiry, oldest-first consumption
- **Idempotency**: All mutations use `entryId`
- **Offline-first**: SQLite queue syncs when online
- **Path Alias**: `@/` → `./src/` (mobile app)

## Quick Commands

### Mobile (`apps/mobile-new/`)

```bash
npm install && npm run android    # Build & run
npm start                         # Metro bundler
npm test                          # Jest
```

### Backend (`packages/api/`)

```bash
npm install && npm run dev        # Dev server
npx prisma migrate dev            # Migrations
npx prisma studio                 # Database GUI
npm test                          # Jest
```

## Documentation Structure

### Rules (Workflow & Standards)

Load only what you need for the current task:

- **`rules/workflow.md`** - Core workflow, assumptions, confusion handling
- **`rules/code-quality.md`** - Simplicity, patterns, TDD
- **`rules/communication.md`** - Summaries, failure modes

### Skills (Technical Implementation)

Load only relevant domains:

- **`skills/backend.md`** - API routes, services, middleware, FIFO, idempotency
- **`skills/mobile.md`** - Navigation, screens, components, offline-first
- **`skills/database.md`** - Prisma schema, 10 models, commands
- **`skills/android.md`** - Build config, APK/AAB, debugging
- **`skills/native-modules.md`** - NFC, keychain, biometrics, config
- **`skills/tech-stack.md`** - Complete technology list

## Usage Pattern

```
User: "Fix the NFC scanning bug"
→ Load: rules/workflow.md, skills/mobile.md, skills/native-modules.md

User: "Add new point expiry logic"
→ Load: rules/code-quality.md, skills/backend.md, skills/database.md

User: "Build release APK"
→ Load: skills/android.md
```

This modular approach minimizes token usage—load only what you need.
