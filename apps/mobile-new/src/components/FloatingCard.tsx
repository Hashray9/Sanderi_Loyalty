import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface FloatingCardProps {
    isScanning: boolean;
}

export function FloatingCard({ isScanning }: FloatingCardProps) {
    const { colors } = useTheme();
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Bobbing animation
        translateY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 2000 }),
                withTiming(8, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        scale.value = withSpring(isScanning ? 1.03 : 1);
    }, [isScanning]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale.value },
                { perspective: 800 },
                { rotateX: '5deg' },
                { rotateY: '-3deg' },
            ],
        };
    });

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    backgroundColor: colors.primary,
                    shadowColor: '#000',
                },
                animatedStyle,
            ]}
        >
            <View style={styles.cardContent}>
                <Text style={styles.logo}>SANDERI</Text>
                <Text style={styles.subtitle}>LOYALTY CARD</Text>
            </View>
            <View style={styles.nfcWave}>
                <Text style={styles.nfcIcon}>⦿</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 280,
        height: 170,
        borderRadius: 16,
        padding: 24,
        justifyContent: 'space-between',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    logo: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 2,
        marginTop: 4,
    },
    nfcWave: {
        position: 'absolute',
        bottom: 16,
        right: 20,
    },
    nfcIcon: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.6)',
    },
});
