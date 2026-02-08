---
paths:
  - "apps/mobile-new/src/**/*.ts"
  - "apps/mobile-new/src/**/*.tsx"
  - "apps/mobile-new/App.tsx"
  - "apps/mobile-new/index.js"
---

# Mobile Architecture

## Structure

```
apps/mobile-new/
├── index.js             # Entry point (AppRegistry)
├── App.tsx              # Root component (providers + navigation)
├── src/
│   ├── screens/         # 8 screen components
│   ├── navigation/      # React Navigation (stacks + tabs)
│   ├── components/      # 9 reusable UI components
│   ├── contexts/        # AuthContext, ThemeContext
│   ├── hooks/           # useNfc, useNetwork, useOfflineQueue
│   ├── lib/             # api.ts, i18n.ts
│   ├── locales/         # en.json, gu.json
│   └── assets/
├── android/
├── .env                 # API_URL config
└── package.json
```

## Entry Point Flow

`index.js` → `App.tsx` → `RootNavigator`

## Navigation Architecture

**RootNavigator.tsx** — Auth vs App routing

**AuthStack.tsx** — Login screen

**AppTabs.tsx** — Bottom tabs (Scan hidden, Lookup, Settings)

**CardStack.tsx** — Modal (CardDetail, Enroll, Block, History)

## Screens (8)

1. Login - Staff authentication
2. Scan - NFC card scanning
3. Lookup - Mobile number search
4. Settings - App settings, logout
5. CardDetail - Card info, balance, actions
6. Enroll - New cardholder enrollment
7. Block - Card blocking workflow
8. History - Transaction history

## Components (9)

1. FloatingCard - Animated card display
2. SparkleParticles - Success animation
3. PulsingText - Animated text
4. CategoryCard - Hardware/Plywood display
5. AmountInput - Numeric keypad
6. BlockConfirmDialog - Blocking confirmation
7. CardBottomBar - Card action buttons
8. OfflineBanner - Network status
9. SuccessOverlay - Transaction feedback

## Key Patterns

### Offline-First (useOfflineQueue)

- Queues mutations in SQLite when offline
- Syncs to server when network restored
- Handles conflict resolution

### State Management

- **Zustand**: Global app state
- **React Context**: Auth, Theme
- **react-hook-form + Zod**: Forms

### API Client (`lib/api.ts`)

- Uses `react-native-config` for API_URL
- Automatic token refresh on 401
- Request/response interceptors

### Path Alias

`@/` maps to `./src/`

## Commands

```bash
# From apps/mobile-new/
npm start                # Start Metro
npm run android          # Build & run Android
npm run lint             # ESLint
npm test                 # Jest
```
