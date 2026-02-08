---
paths:
  - "apps/mobile-new/android/**"
  - "apps/mobile-new/app.json"
  - "apps/mobile-new/.env"
---

# Android Build

## Configuration

- **Package**: `com.sanderimobile`
- **Min SDK**: 24 (Android 7.0)
- **Target/Compile SDK**: 36
- **Hermes**: Enabled
- **New Architecture**: Enabled (Fabric + TurboModules)
- **Kotlin**: 2.1.20
- **NDK**: 27.1.12297006

## Manual Build Commands

```bash
# From apps/mobile-new/android/
./gradlew assembleDebug               # Debug APK
./gradlew assembleRelease             # Release APK
./gradlew bundleRelease               # Release AAB

# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# List devices
adb devices

# Port forwarding for API
adb reverse tcp:3000 tcp:3000
```

## Build Features

- **ProGuard**: Enabled for release
- **APK Splits**: By ABI (arm64-v8a, armeabi-v7a, x86, x86_64)

## Clean Build

```bash
cd android && ./gradlew clean
watchman watch-del-all
rm -rf node_modules && npm install
```

## Debugging

```bash
npx react-native log-android          # Logcat
npm run android -- --deviceId=<id>    # Target specific device
```
