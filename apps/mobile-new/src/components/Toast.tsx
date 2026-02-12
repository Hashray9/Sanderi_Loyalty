import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'error' | 'warning' | 'info';
    onHide?: () => void;
    duration?: number;
}

export function Toast({ visible, message, type = 'error', onHide, duration = 3000 }: ToastProps) {
    useEffect(() => {
        if (visible && onHide) {
            const timer = setTimeout(() => {
                onHide();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [visible, onHide, duration]);

    if (!visible) return null;

    const backgroundColor = type === 'error' ? 'rgba(239,68,68,0.95)' :
                           type === 'warning' ? 'rgba(245,158,11,0.95)' :
                           'rgba(59,130,246,0.95)';

    return (
        <Animated.View
            entering={SlideInUp.springify().damping(20).stiffness(200)}
            exiting={SlideOutUp.springify().damping(20).stiffness(200)}
            style={[styles.container, { backgroundColor }]}
        >
            <View style={styles.content}>
                <AlertTriangle size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 28,
        right: 28,
        zIndex: 1000,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    message: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.4,
        lineHeight: 18,
    },
});
