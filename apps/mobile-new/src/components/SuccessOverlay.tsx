import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    ZoomIn,
    SlideInDown,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

interface SuccessOverlayProps {
    visible: boolean;
    message?: string;
    onDismiss: () => void;
}

export function SuccessOverlay({ visible, message, onDismiss }: SuccessOverlayProps) {
    useEffect(() => {
        if (visible) {
            HapticFeedback.trigger('notificationSuccess');
            const timer = setTimeout(onDismiss, 1500);
            return () => clearTimeout(timer);
        }
    }, [visible, onDismiss]);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.overlay}
        >
            <Animated.View
                entering={ZoomIn.springify().stiffness(200).damping(15)}
                style={styles.circle}
            >
                <Text style={styles.checkmark}>✓</Text>
            </Animated.View>
            {message && (
                <Animated.Text
                    entering={SlideInDown.delay(200).springify()}
                    style={styles.message}
                >
                    {message}
                </Animated.Text>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    message: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
