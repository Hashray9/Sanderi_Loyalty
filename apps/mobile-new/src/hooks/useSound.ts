import { useEffect, useRef, useCallback } from 'react';
import Sound from 'react-native-sound';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

export function useSound(soundFile: string) {
    const soundRef = useRef<Sound | null>(null);
    const isLoadedRef = useRef(false);

    useEffect(() => {
        // Load the sound file from Android res/raw folder
        const soundName = soundFile.replace('.mp3', '').replace('.wav', '');

        soundRef.current = new Sound(soundName, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.error('Failed to load sound:', soundName, error);
                isLoadedRef.current = false;
            } else {
                console.log('Sound loaded successfully:', soundName);
                isLoadedRef.current = true;
            }
        });

        return () => {
            // Release the sound when component unmounts
            if (soundRef.current) {
                soundRef.current.release();
                soundRef.current = null;
            }
        };
    }, [soundFile]);

    const play = useCallback(() => {
        if (soundRef.current && isLoadedRef.current) {
            soundRef.current.setVolume(1.0);
            soundRef.current.play((success) => {
                if (success) {
                    console.log('Sound played successfully');
                } else {
                    console.error('Sound playback failed');
                    // Fallback to haptic feedback if sound fails
                    ReactNativeHapticFeedback.trigger('notificationSuccess');
                }
            });
        } else {
            console.warn('Sound not loaded, using haptic feedback');
            // Fallback to haptic feedback if sound not loaded
            ReactNativeHapticFeedback.trigger('notificationSuccess');
        }
    }, []);

    return { play };
}
