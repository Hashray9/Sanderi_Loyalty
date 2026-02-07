# Fix Android Build Skill

**Use this skill when**: Gradle build fails, APK won't install, or Android-specific errors occur.

## Diagnostic Workflow

### Step 1: Identify Error Type

Run build and categorize the error:

```bash
cd D:\Sanderi_Loyalty\apps\mobile\android
.\gradlew assembleDebug --stacktrace
```

**Error Categories**:
1. **Plugin not found** → pnpm monorepo misconfiguration
2. **Duplicate classes** → Dependency conflicts
3. **Property errors** → Expo config issues
4. **Build hangs** → Gradle daemon issues
5. **Metro bundling fails** → Metro config issues

### Step 2: Run Comprehensive Checks

```bash
# Check pnpm hoisting
cat D:\Sanderi_Loyalty\.npmrc
# Should have: shamefully-hoist=true, node-linker=hoisted

# Check node_modules structure
ls D:\Sanderi_Loyalty\node_modules | grep expo

# Check Hermes in app.json
cat D:\Sanderi_Loyalty\apps\mobile\app.json | grep jsEngine
# Should have: "jsEngine": "hermes"

# Check Gradle settings
cat D:\Sanderi_Loyalty\apps\mobile\android\settings.gradle | head -20
# Should reference ../../node_modules
```

### Step 3: Apply Fixes Based on Error

#### Fix 1: Plugin Not Found Errors

**Symptoms**:
```
Plugin [id: 'expo-module-gradle-plugin'] was not found
```

**Solution**:

1. Update `apps/mobile/android/settings.gradle`:

```gradle
pluginManagement {
    def nodeModulesPath = file("../../node_modules")
    
    includeBuild(new File(nodeModulesPath, "expo-modules-core")) {
        dependencySubstitution {
            substitute(module("com.facebook.react:react-native")).using(project(":packages:react-native"))
        }
    }
    
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url(new File(rootProject.projectDir, "../../node_modules/react-native/android")) }
        maven { url(new File(rootProject.projectDir, "../../node_modules/jsc-android/dist")) }
    }
}

rootProject.name = 'mobile'

apply from: new File(["node", "--print", "require.resolve('expo/package.json')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")
useExpoModules()

include ':app'
includeBuild(new File(rootProject.projectDir, "../../node_modules/react-native"))
```

2. Verify `.npmrc`:

```ini
node-linker=hoisted
shamefully-hoist=true
public-hoist-pattern[]=*expo*
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=@react-native/*
```

3. Clean and rebuild:

```bash
cd D:\Sanderi_Loyalty
rm -rf node_modules apps/mobile/node_modules apps/mobile/android
pnpm install
cd apps/mobile
npx expo prebuild --clean --platform android
cd android
.\gradlew clean assembleDebug
```

#### Fix 2: Property 'release' Not Found

**Symptoms**:
```
Could not get unknown property 'release' for SoftwareComponent container
```

**Solution**:

This is an Expo modules core issue. Ensure proper includeBuild:

```gradle
// In settings.gradle
includeBuild(new File(nodeModulesPath, "expo-modules-core")) {
    dependencySubstitution {
        substitute(module("com.facebook.react:react-native")).using(project(":packages:react-native"))
    }
}
```

If still failing, try:

```bash
cd D:\Sanderi_Loyalty
pnpm update expo expo-modules-core
cd apps/mobile
npx expo prebuild --clean
```

#### Fix 3: Duplicate Classes

**Symptoms**:
```
Task :app:checkDebugDuplicateClasses FAILED
Duplicate class com.facebook.react...
```

**Solution**:

1. Check for multiple React Native versions:

```bash
cd D:\Sanderi_Loyalty
pnpm list react-native
```

Should show only ONE version. If multiple:

```bash
pnpm install --force
```

2. Check package.json for accidental duplicates:

```bash
cat apps/mobile/package.json | grep react-native
```

Remove any direct `react-native` dependency if it conflicts with Expo's.

#### Fix 4: Metro Bundler Issues

**Symptoms**:
- Metro can't find modules
- `Unable to resolve module` errors

**Solution**:

Update `apps/mobile/metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in monorepo
config.watchFolders = [workspaceRoot];

// Support workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Enable symlinks for pnpm
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
```

Then clear Metro cache:

```bash
cd D:\Sanderi_Loyalty\apps\mobile
pnpm start --clear
# or
npx expo start --reset-cache
```

### Step 4: Nuclear Option (Last Resort)

If all else fails:

```bash
# Stop Gradle daemon
cd D:\Sanderi_Loyalty\apps\mobile\android
.\gradlew --stop

# Clear all caches
rd /s /q %USERPROFILE%\.gradle\caches
rd /s /q %USERPROFILE%\.android
rd /s /q D:\Sanderi_Loyalty\node_modules
rd /s /q D:\Sanderi_Loyalty\apps\mobile\node_modules
rd /s /q D:\Sanderi_Loyalty\apps\mobile\android

# Reinstall from scratch
cd D:\Sanderi_Loyalty
pnpm store prune
pnpm install
cd apps/mobile
npx expo prebuild --clean --platform android
cd android
.\gradlew clean assembleDebug
```

## Post-Build Verification

After successful build:

```bash
# APK should exist
ls app\build\outputs\apk\debug\app-debug.apk

# Install on device
adb devices  # Verify device connected
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Verify installation
adb shell pm list packages | grep sanderi
# Should show: package:com.sanderi.loyalty

# Launch app
adb shell am start -n com.sanderi.loyalty/.MainActivity
```

## Prevention Checklist

Before building, always verify:

- [ ] Hermes enabled: `"jsEngine": "hermes"` in `app.json`
- [ ] `.npmrc` has hoisting enabled
- [ ] `settings.gradle` references `../../node_modules`
- [ ] `metro.config.js` configured for monorepo
- [ ] Only one version of react-native installed
- [ ] Ran `pnpm install` from workspace root recently
- [ ] No manual edits to `android/` (always use `expo prebuild --clean`)
