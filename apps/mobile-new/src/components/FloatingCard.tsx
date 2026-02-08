import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Nfc } from 'lucide-react-native';

interface FloatingCardProps {
    isScanning: boolean;
}

function PulseRing({ delay }: { delay: number }) {
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0.6);

    useEffect(() => {
        scale.value = withDelay(
            delay,
            withRepeat(
                withTiming(2.2, { duration: 2200, easing: Easing.out(Easing.cubic) }),
                -1,
            ),
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withTiming(0, { duration: 2200, easing: Easing.out(Easing.cubic) }),
                -1,
            ),
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
}

export function FloatingCard({ isScanning }: FloatingCardProps) {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 2000 }),
                withTiming(8, { duration: 2000 }),
            ),
            -1,
            true,
        );
    }, []);

    useEffect(() => {
        scale.value = withSpring(isScanning ? 1.03 : 1);
    }, [isScanning]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
            { perspective: 800 },
            { rotateX: '5deg' },
            { rotateY: '-3deg' },
        ],
    }));

    return (
        <Animated.View style={[styles.cardOuter, animatedStyle]}>
            {/* Holographic base gradient */}
            <LinearGradient
                colors={['#7B4FA2', '#A86B8A', '#C09070', '#6AA08A', '#5878B0']}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {/* Frosted glass overlay */}
                <LinearGradient
                    colors={[
                        'rgba(255,255,255,0.22)',
                        'rgba(255,255,255,0.05)',
                        'rgba(255,255,255,0.15)',
                        'rgba(255,255,255,0.08)',
                    ]}
                    locations={[0, 0.35, 0.65, 1]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.overlay}
                />

                {/* Secondary iridescent shimmer */}
                <LinearGradient
                    colors={[
                        'rgba(200,160,240,0.12)',
                        'rgba(240,180,150,0.08)',
                        'rgba(120,200,180,0.10)',
                    ]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.overlay}
                />

                {/* Top row: text + NFC icon */}
                <View style={styles.cardTop}>
                    <View style={styles.textArea}>
                        <Text style={styles.logo}>S A N D E R I</Text>
                        <Text style={styles.subtitle}>LOYALTY CARD</Text>
                    </View>

                    <View style={styles.nfcArea}>
                        <PulseRing delay={0} />
                        <PulseRing delay={733} />
                        <PulseRing delay={1466} />
                        <View style={styles.nfcSquare}>
                            <Nfc size={22} color="rgba(255,255,255,0.55)" strokeWidth={1.5} />
                        </View>
                    </View>
                </View>

                {/* Bottom row: card number + holo dot */}
                <View style={styles.cardFooter}>
                    <Text style={styles.dotsText}>
                        {'••••   ••••   ••••   '}
                        <Text style={styles.lastDigits}>4281</Text>
                    </Text>
                    <View style={styles.holoDot} />
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    cardOuter: {
        width: 310,
        height: 192,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
        elevation: 24,
    },
    card: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        justifyContent: 'space-between',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flex: 1,
    },
    textArea: {
        justifyContent: 'center',
        flex: 1,
        paddingTop: 12,
    },
    logo: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 3,
        marginTop: 6,
    },
    nfcArea: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: 'rgba(250,0,17,0.30)',
    },
    nfcSquare: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dotsText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.30)',
        letterSpacing: 2,
    },
    lastDigits: {
        color: 'rgba(255,255,255,0.55)',
    },
    holoDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
});
