# Sanderi Loyalty Mobile App (Bare React Native)

A loyalty card management mobile application for Sanderi stores, built with bare React Native (no Expo).

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- JDK 17 or higher
- Android Studio with SDK 35
- Android device or emulator

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   # Already created with API_URL
   cat .env
   ```

3. **Start Metro bundler:**
   ```bash
   npm start
   ```

4. **Run on Android:**
   ```bash
   npm run android
   ```

## 📁 Project Structure

```
apps/mobile-new/
├── android/                 # Android native code
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AmountInput.tsx
│   │   ├── BlockConfirmDialog.tsx
│   │   ├── CardBottomBar.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── FloatingCard.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── PulsingText.tsx
│   │   ├── SparkleParticles.tsx
│   │   └── SuccessOverlay.tsx
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ThemeContext.tsx # Theme/dark mode state
│   ├── hooks/               # Custom hooks
│   │   ├── useNfc.ts        # NFC scanning
│   │   ├── useNetwork.ts    # Network status
│   │   └── useOfflineQueue.ts # Offline action queue
│   ├── lib/                 # Utilities
│   │   ├── api.ts           # HTTP client
│   │   └── i18n.ts          # Internationalization
│   ├── locales/             # Translation files
│   │   ├── en.json
│   │   └── gu.json
│   ├── navigation/          # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── AppTabs.tsx
│   │   └── CardStack.tsx
│   └── screens/             # Screen components
│       ├── LoginScreen.tsx
│       ├── ScanScreen.tsx
│       ├── LookupScreen.tsx
│       ├── SettingsScreen.tsx
│       ├── CardDetailScreen.tsx
│       ├── EnrollScreen.tsx
│       ├── BlockScreen.tsx
│       └── HistoryScreen.tsx
├── App.tsx                  # Root component
├── index.js                 # Entry point
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
API_URL=http://YOUR_API_SERVER:3000
```

### Native Module Linking

Most native modules are auto-linked. For some modules, manual configuration may be needed:

#### react-native-config
Add to `android/app/build.gradle`:
```gradle
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

#### react-native-reanimated
Add to `babel.config.js` (already configured):
```js
plugins: ['react-native-reanimated/plugin']
```

#### react-native-splash-screen
Configure launch screen in Android native code.

## 📱 Features

- **NFC Card Scanning**: Tap NFC loyalty cards to read card UID
- **Offline-First**: Queue actions offline, sync when connected
- **Biometric Login**: Fingerprint/Face authentication
- **Multi-language**: English and Gujarati support
- **Dark Mode**: System-aware theme

## 🏗️ Architecture

### Navigation Structure

```
RootNavigator
├── AuthStack (when not authenticated)
│   └── LoginScreen
└── AppTabs (when authenticated)
    ├── ScanScreen
    ├── LookupScreen
    └── SettingsScreen
    └── CardStack (modal)
        ├── CardDetailScreen
        ├── EnrollScreen
        ├── BlockScreen
        └── HistoryScreen
```

### State Management

- **AuthContext**: User auth state, tokens, biometrics
- **ThemeContext**: Color scheme, theme toggle
- **useOfflineQueue**: SQLite-backed action queue

### API Communication

Custom fetch wrapper in `src/lib/api.ts`:
- Bearer token authentication
- 30-second timeout
- Axios-like interface

## 🔐 Security

- **Credentials**: Stored in Keychain (iOS) / Keystore (Android)
- **Biometrics**: Native fingerprint/face authentication
- **No Plain Text**: Sensitive data never stored in AsyncStorage

## 🧪 Development

### Run Tests
```bash
npm test
```

### Type Check
```bash
npx tsc --noEmit
```

### Lint
```bash
npm run lint
```

### Clean Build
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

## 📦 Building for Production

### Android Release Build

1. **Generate signing key:**
   ```bash
   keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in gradle.properties:**
   ```properties
   MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=*****
   MYAPP_UPLOAD_KEY_PASSWORD=*****
   ```

3. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## 🔄 Migration from Expo

This project was migrated from Expo managed workflow. Key changes:

| Expo Package | Bare RN Replacement |
|--------------|---------------------|
| expo-router | @react-navigation |
| expo-secure-store | react-native-keychain |
| expo-local-authentication | react-native-biometrics |
| expo-sqlite | react-native-sqlite-storage |
| expo-network | @react-native-community/netinfo |
| expo-constants | react-native-config |
| expo-haptics | react-native-haptic-feedback |
| @legendapp/motion | react-native-reanimated |

## 📄 License

Private - Sanderi Loyalty Program
