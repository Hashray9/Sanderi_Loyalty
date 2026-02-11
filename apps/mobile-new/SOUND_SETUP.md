# NFC Success Sound Setup

## Current Status
✅ react-native-sound package installed
✅ useSound hook created
✅ Sound integrated in ScanScreen
✅ res/raw directory created

## Next Steps: Add the Sound File

You need to add a success beep sound file to play when NFC cards are scanned.

### Option 1: Use a Free Sound (Recommended)

1. Download a free success beep sound from one of these sources:
   - **Pixabay**: https://pixabay.com/sound-effects/search/success%20beep/
   - **Freesound**: https://freesound.org/search/?q=success+beep
   - **Zapsplat**: https://www.zapsplat.com/sound-effect-category/beeps-and-blips/

2. Look for:
   - Short duration (0.2 - 0.5 seconds)
   - Pleasant, upbeat tone
   - MP3 or WAV format

3. Rename the file to `success_beep.mp3`

4. Place it in: `apps/mobile-new/android/app/src/main/res/raw/success_beep.mp3`

### Option 2: Generate Using Online Tool

Use https://sfxr.me/ to generate a custom beep:
1. Click "Pickup/Coin" preset
2. Click "Randomize" until you like the sound
3. Export as WAV
4. Convert to MP3 (use https://cloudconvert.com/wav-to-mp3)
5. Save as `success_beep.mp3` in the raw folder

### Option 3: Use System Sound (Temporary)

If you want to test without adding a file, edit `src/hooks/useSound.ts` and change:

```typescript
// From:
soundRef.current = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {

// To:
soundRef.current = new Sound('default', '', Sound.MAIN_BUNDLE, (error) => {
```

This will use the system's default notification sound.

## After Adding the Sound

1. **IMPORTANT**: The file MUST be in `android/app/src/main/res/raw/` folder (verified ✅)

2. Rebuild the app:
   ```bash
   cd d:\Sanderi_Loyalty\apps\mobile-new\android
   .\gradlew clean
   .\gradlew assembleDebug
   ```

3. Uninstall old app and install fresh:
   ```bash
   adb uninstall com.sanderimobile
   adb install app\build\outputs\apk\debug\app-debug.apk
   ```

4. Check logs to verify sound is loading:
   ```bash
   adb logcat | findstr "Sound"
   ```

## Understanding the Sounds

You will hear **TWO sounds** when scanning NFC:
1. **System NFC beep** (Android's default - cannot be disabled)
2. **Custom success beep** (your app's custom sound - plays right after)

If you only hear one beep, check the logcat for errors.

## Troubleshooting

- **No sound playing**: Check that the file is named exactly `success_beep.mp3` (lowercase, no spaces)
- **App crashes**: Ensure the file is a valid MP3 format
- **Sound too loud/quiet**: Adjust your phone's media volume (not ringer volume)
- **Wrong sound playing**: MP3 files might not work on all Android devices. Try converting to WAV:
  1. Use https://cloudconvert.com/mp3-to-wav
  2. Convert to WAV format (16-bit PCM recommended)
  3. Rename to `success_beep.wav`
  4. Place in `android/app/src/main/res/raw/`
  5. Rebuild the app

**Note**: React Native Sound works best with WAV files on Android. If MP3 doesn't work, WAV is the recommended format.
