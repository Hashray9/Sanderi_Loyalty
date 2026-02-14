import { useCallback } from 'react';
// import Sound from 'react-native-sound'; // OLD: bare RN
// import ReactNativeHapticFeedback from 'react-native-haptic-feedback'; // OLD: bare RN
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const soundAssets: Record<string, any> = {
    'success_beep': require('../../android/app/src/main/res/raw/success_beep.wav'),
};

export function useSound(soundFile: string) {
    const soundName = soundFile.replace('.mp3', '').replace('.wav', '');
    const source = soundAssets[soundName];
    const player = useAudioPlayer(source);

    const play = useCallback(() => {
        try {
            if (player) {
                player.seekTo(0);
                player.play();
            } else {
                console.warn('Sound not loaded, using haptic feedback');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Sound playback failed:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [player]);

    return { play };
}
