# Expo → Bare React Native Migration Guide

## Sanderi Loyalty App

This guide covers migrating from Expo (SDK 52) + pnpm monorepo → Bare React Native + npm.

---

## Table of Contents

1. [Overview of Changes](#1-overview-of-changes)
2. [Pre-Migration Checklist](#2-pre-migration-checklist)
3. [Project Structure: Before vs After](#3-project-structure-before-vs-after)
4. [Step-by-Step Migration](#4-step-by-step-migration)
5. [Package Replacements](#5-package-replacements)
6. [Navigation Migration (Expo Router → React Navigation)](#6-navigation-migration)
7. [File-by-File Changes](#7-file-by-file-changes)
8. [Build & Run](#8-build--run)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview of Changes

| Aspect | Before (Expo) | After (Bare RN) |
|--------|---------------|------------------|
| Framework | Expo SDK 52 + Dev Client | React Native 0.76 (bare) |
| Package Manager | pnpm workspaces | npm workspaces (or flat npm) |
| Navigation | Expo Router (file-based) | React Navigation 6 (explicit) |
| Entry Point | `expo-router/entry` | `index.js` + `AppRegistry` |
| Build | `expo prebuild` + Gradle | React Native CLI + Gradle |
| Metro Config | `expo/metro-config` | `@react-native/metro-config` |
| Babel | `babel-preset-expo` | `metro-react-native-babel-preset` |
| JS Engine | Hermes (via Expo) | Hermes (via RN) |

---

## 2. Pre-Migration Checklist

- [ ] Backup entire project: `git commit` everything or copy the folder
- [ ] Note your current API URL (`http://172.20.10.2:3000`)
- [ ] Note all environment-specific config from `app.json`
- [ ] Document all screens and navigation flows
- [ ] Keep `packages/api/` untouched — only `apps/mobile/` changes

---

## 3. Project Structure: Before vs After

### BEFORE (Expo)
```
apps/mobile/
├── app/                    # File-based routing (Expo Router)
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Entry redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   ├── scan.tsx
│   │   ├── lookup.tsx
│   │   └── settings.tsx
│   └── (card)/
│       ├── _layout.tsx
│       └── [cardUid]/
│           ├── index.tsx
│           ├── enroll.tsx
│           ├── block.tsx
│           └── history.tsx
├── contexts/
├── components/
├── hooks/
├── lib/
├── locales/
├── app.json                # Expo config
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

### AFTER (Bare React Native)
```
apps/mobile/
├── src/
│   ├── screens/            # All screens (flat, no file routing)
│   │   ├── LoginScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   ├── LookupScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── CardDetailScreen.tsx
│   │   ├── EnrollScreen.tsx
│   │   ├── BlockScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── AppTabs.tsx
│   │   └── CardStack.tsx
│   ├── contexts/           # Same (minor import changes)
│   ├── components/         # Same
│   ├── hooks/              # Same
│   ├── lib/                # Minor changes (remove expo-constants)
│   └── locales/            # Same
├── index.js                # NEW: App entry point
├── App.tsx                 # NEW: Root component
├── app.json                # Simplified (no "expo" wrapper)
├── babel.config.js         # Updated preset
├── metro.config.js         # Updated import
├── tsconfig.json           # Updated paths
├── react-native.config.js  # NEW: RN CLI config
└── package.json            # Updated deps
```

---

## 4. Step-by-Step Migration

### Step 1: Initialize a Fresh Bare RN Project (Recommended Approach)

The cleanest approach is to create a fresh bare RN project and copy code into it.

```bash
# From repo root
npx @react-native-community/cli init SanderiMobile --directory apps/mobile-new --pm npm

cd apps/mobile-new
```

This gives you a clean, working Android build out of the box. Then copy over your business logic.

### Step 2: Switch Package Manager (pnpm → npm)

**At repo root:**

```bash
# Remove pnpm artifacts
rm -rf node_modules
rm pnpm-lock.yaml
rm pnpm-workspace.yaml
rm .npmrc

# Create npm workspace config (if keeping monorepo)
# In root package.json, replace the pnpm config with:
```

**Root `package.json` changes:**
```json
{
  "name": "sanderi-loyalty",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev:api": "npm -w @sanderi/api run dev",
    "dev:mobile": "npm -w @sanderi/mobile run start",
    "build:api": "npm -w @sanderi/api run build",
    "test": "npm -w @sanderi/api run test",
    "db:migrate": "npm -w @sanderi/api run db:migrate",
    "db:generate": "npm -w @sanderi/api run db:generate",
    "db:studio": "npm -w @sanderi/api run db:studio"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Then:
```bash
npm install
```

**Alternative: If monorepo causes issues, flatten it.**
Move `apps/mobile/` to its own standalone repo and keep `packages/api/` separate. The mobile app only talks to the API over HTTP anyway — there's no shared code.

### Step 3: Install Bare RN Dependencies

```bash
cd apps/mobile   # or your new project

# Core
npm install react-native react

# Navigation (replaces expo-router)
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# Gesture handling (same package, just needs linking)
npm install react-native-gesture-handler

# Storage & Security (replaces expo-secure-store)
npm install react-native-keychain
# OR
npm install react-native-encrypted-storage

# Biometrics (replaces expo-local-authentication)
npm install react-native-biometrics

# Splash screen (replaces expo-splash-screen)
npm install react-native-splash-screen

# Async Storage (same)
npm install @react-native-async-storage/async-storage

# SQLite (replaces expo-sqlite)
npm install react-native-sqlite-storage

# NFC (same package)
npm install react-native-nfc-manager

# Haptics (replaces expo-haptics)
npm install react-native-haptic-feedback

# Animation (replaces @legendapp/motion)
npm install react-native-reanimated

# Forms & Validation (same)
npm install react-hook-form @hookform/resolvers zod

# i18n (same)
npm install i18next react-i18next

# Config (replaces expo-constants)
npm install react-native-config
```

### Step 4: Create Entry Point

**`index.js`** (NEW file):
```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

**`App.tsx`** (NEW file):
```tsx
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import './src/lib/i18n';

function AppInner() {
  const { colorScheme } = useTheme();

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

**`app.json`** (simplified):
```json
{
  "name": "SanderiLoyalty",
  "displayName": "Sanderi Loyalty"
}
```

### Step 5: Create Navigation Structure

**`src/navigation/RootNavigator.tsx`:**
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import CardStack from './CardStack';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Card: { cardUid: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading screen

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="App" component={AppTabs} />
          <Stack.Screen
            name="Card"
            component={CardStack}
            options={{ presentation: 'fullScreenModal' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
```

**`src/navigation/AuthStack.tsx`:**
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
```

**`src/navigation/AppTabs.tsx`:**
```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ScanScreen from '../screens/ScanScreen';
import LookupScreen from '../screens/LookupScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ tabBarButton: () => null }} // hidden from tab bar
      />
      <Tab.Screen name="Lookup" component={LookupScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
```

**`src/navigation/CardStack.tsx`:**
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CardDetailScreen from '../screens/CardDetailScreen';
import EnrollScreen from '../screens/EnrollScreen';
import BlockScreen from '../screens/BlockScreen';
import HistoryScreen from '../screens/HistoryScreen';

export type CardStackParamList = {
  CardDetail: { cardUid: string };
  Enroll: { cardUid: string };
  Block: { cardUid: string };
  History: { cardUid: string };
};

const Stack = createNativeStackNavigator<CardStackParamList>();

export default function CardStack({ route }: any) {
  const { cardUid } = route.params;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CardDetail"
        component={CardDetailScreen}
        initialParams={{ cardUid }}
      />
      <Stack.Screen name="Enroll" component={EnrollScreen} />
      <Stack.Screen name="Block" component={BlockScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}
```

### Step 6: Update Metro & Babel Config

**`metro.config.js`:**
```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  // Add monorepo support if needed
  // watchFolders: [path.resolve(__dirname, '../..')],
};

module.exports = mergeConfig(defaultConfig, config);
```

**`babel.config.js`:**
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

### Step 7: Update tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2017"],
    "jsx": "react-native",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "App.tsx", "index.js"],
  "exclude": ["node_modules", "android", "ios"]
}
```

---

## 5. Package Replacements

| Expo Package | Bare RN Replacement | Import Change |
|---|---|---|
| `expo-router` | `@react-navigation/native` + stacks/tabs | See navigation section |
| `expo-secure-store` | `react-native-keychain` | `import * as Keychain from 'react-native-keychain'` |
| `expo-local-authentication` | `react-native-biometrics` | `import ReactNativeBiometrics from 'react-native-biometrics'` |
| `expo-splash-screen` | `react-native-splash-screen` | `import SplashScreen from 'react-native-splash-screen'` |
| `expo-status-bar` | React Native `StatusBar` | `import { StatusBar } from 'react-native'` |
| `expo-sqlite` | `react-native-sqlite-storage` | `import SQLite from 'react-native-sqlite-storage'` |
| `expo-haptics` | `react-native-haptic-feedback` | `import HapticFeedback from 'react-native-haptic-feedback'` |
| `expo-constants` | `react-native-config` | `import Config from 'react-native-config'` |
| `@legendapp/motion` | `react-native-reanimated` Animated | `import Animated from 'react-native-reanimated'` |
| `expo/metro-config` | `@react-native/metro-config` | — |
| `babel-preset-expo` | `@react-native/babel-preset` | — |

**Packages that stay the same (no change needed):**
- `react-native-nfc-manager`
- `react-native-gesture-handler`
- `@react-native-async-storage/async-storage`
- `react-hook-form` + `@hookform/resolvers` + `zod`
- `i18next` + `react-i18next`

---

## 6. Navigation Migration

### Expo Router → React Navigation Mapping

| Expo Router | React Navigation |
|---|---|
| `app/_layout.tsx` (Stack) | `RootNavigator.tsx` with `createNativeStackNavigator` |
| `app/(auth)/_layout.tsx` | `AuthStack.tsx` |
| `app/(app)/_layout.tsx` (Tabs) | `AppTabs.tsx` with `createBottomTabNavigator` |
| `app/(card)/_layout.tsx` | `CardStack.tsx` |
| `<Redirect href="/(app)/scan" />` | `navigation.reset({ routes: [{ name: 'App' }] })` |
| `router.push('/(card)/[cardUid]')` | `navigation.navigate('Card', { cardUid })` |
| `router.back()` | `navigation.goBack()` |
| `useLocalSearchParams()` | `route.params` |
| `<Link href="...">` | `<TouchableOpacity onPress={() => navigation.navigate(...)}>` |

### Navigation Hooks Change

```tsx
// BEFORE (Expo Router)
import { useRouter, useLocalSearchParams } from 'expo-router';
const router = useRouter();
const { cardUid } = useLocalSearchParams();
router.push(`/(card)/${cardUid}`);
router.back();

// AFTER (React Navigation)
import { useNavigation, useRoute } from '@react-navigation/native';
const navigation = useNavigation();
const route = useRoute();
const { cardUid } = route.params;
navigation.navigate('Card', { cardUid });
navigation.goBack();
```

---

## 7. File-by-File Changes

### `contexts/AuthContext.tsx`
```diff
- import * as SecureStore from 'expo-secure-store';
- import * as LocalAuthentication from 'expo-local-authentication';
+ import * as Keychain from 'react-native-keychain';
+ import ReactNativeBiometrics from 'react-native-biometrics';

// SecureStore.getItemAsync(key) →
+ await Keychain.getGenericPassword({ service: key });

// SecureStore.setItemAsync(key, value) →
+ await Keychain.setGenericPassword(key, value, { service: key });

// SecureStore.deleteItemAsync(key) →
+ await Keychain.resetGenericPassword({ service: key });

// LocalAuthentication.hasHardwareAsync() →
+ const rnBiometrics = new ReactNativeBiometrics();
+ const { available } = await rnBiometrics.isSensorAvailable();

// LocalAuthentication.authenticateAsync() →
+ const { success } = await rnBiometrics.simplePrompt({ promptMessage: '...' });
```

### `contexts/ThemeContext.tsx`
No changes needed — already uses `@react-native-async-storage/async-storage`.

### `lib/api.ts`
```diff
- import Constants from 'expo-constants';
- const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
+ import Config from 'react-native-config';
+ const API_URL = Config.API_URL || 'http://localhost:3000';
```

Create `.env` file:
```
API_URL=http://172.20.10.2:3000
```

### `lib/i18n.ts`
No changes needed.

### `hooks/useNfc.ts`
No changes needed — already uses `react-native-nfc-manager`.

### `hooks/useNetwork.ts`
No changes needed — already uses `@react-native-community/netinfo`.

### `hooks/useOfflineQueue.ts`
```diff
- import * as SQLite from 'expo-sqlite';
+ import SQLite from 'react-native-sqlite-storage';

// API differences:
// expo-sqlite: SQLite.openDatabaseAsync('name')
// rn-sqlite:   SQLite.openDatabase({ name: 'name.db', location: 'default' })

// expo-sqlite: db.runAsync(sql, params)
// rn-sqlite:   db.executeSql(sql, params)

// expo-sqlite: db.getAllAsync(sql, params)
// rn-sqlite:   db.executeSql(sql, params) → results.rows.raw()
```

### All Screen Files
```diff
// Navigation changes in every screen:
- import { useRouter, useLocalSearchParams } from 'expo-router';
+ import { useNavigation, useRoute } from '@react-navigation/native';

- const router = useRouter();
+ const navigation = useNavigation();

- router.push('/path');
+ navigation.navigate('ScreenName', { params });

- router.back();
+ navigation.goBack();

- const { cardUid } = useLocalSearchParams();
+ const { cardUid } = useRoute().params;
```

### Animation Changes (`@legendapp/motion` → `react-native-reanimated`)
```diff
// BEFORE
- import { Motion } from '@legendapp/motion';
- <Motion.View
-   initial={{ opacity: 0, y: 20 }}
-   animate={{ opacity: 1, y: 0 }}
-   transition={{ type: 'spring', damping: 20, stiffness: 200 }}
- >

// AFTER
+ import Animated, { FadeInDown } from 'react-native-reanimated';
+ <Animated.View entering={FadeInDown.springify().damping(20).stiffness(200)}>
```

### Haptics Changes
```diff
// BEFORE
- import * as Haptics from 'expo-haptics';
- Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// AFTER
+ import HapticFeedback from 'react-native-haptic-feedback';
+ HapticFeedback.trigger('impactMedium');
```

---

## 8. Build & Run

### Android Setup

```bash
cd apps/mobile

# Install deps
npm install

# Navigate to android and build
cd android
.\gradlew assembleDebug

# Install on phone
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Start Metro (in apps/mobile/)
npx react-native start

# OR run directly (builds + installs + starts Metro)
npx react-native run-android
```

### Environment Config

Create `apps/mobile/.env`:
```
API_URL=http://172.20.10.2:3000
```

For Android, also add to `android/app/build.gradle`:
```groovy
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

### ProGuard (Release builds)

Add to `android/app/proguard-rules.pro`:
```
-keep class com.sanderi.loyalty.** { *; }
-keep class com.facebook.hermes.** { *; }
```

---

## 9. Troubleshooting

### Common Issues After Migration

| Issue | Fix |
|---|---|
| `Unable to resolve module` | Run `npx react-native start --reset-cache` |
| Native module not found | Run `cd android && .\gradlew clean && cd ..` then rebuild |
| Keychain/Biometrics crash | Make sure native linking worked: check `android/app/build.gradle` for dependencies |
| SQLite not working | Verify `react-native-sqlite-storage` is in `android/settings.gradle` |
| NFC not detected | Check `AndroidManifest.xml` has NFC permissions |
| Reanimated crash | Make sure `react-native-reanimated/plugin` is LAST in babel plugins |

### Verifying Native Linking

After `npm install`, check that `android/app/build.gradle` includes all native dependencies. With RN 0.76+, autolinking should handle this. Verify with:

```bash
npx react-native config
```

This lists all auto-linked native modules.

### Clean Build

If anything goes wrong:
```bash
cd android
.\gradlew clean
cd ..
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

---

## Migration Order (Recommended)

1. **Create fresh bare RN project** (get a working "Hello World" on phone first)
2. **Add navigation** (React Navigation with all stacks/tabs)
3. **Copy contexts** (AuthContext, ThemeContext — update imports)
4. **Copy hooks** (useNfc, useNetwork, useOfflineQueue — update SQLite)
5. **Copy components** (mostly unchanged)
6. **Copy screens one by one** (update navigation + imports in each)
7. **Copy locales** (unchanged)
8. **Copy lib/** (update api.ts for react-native-config)
9. **Test each screen as you go**
10. **Final full test on device**

This incremental approach ensures you always have a working app to test against.
