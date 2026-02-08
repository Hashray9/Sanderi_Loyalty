import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
} from 'react-native-reanimated';

interface SparkleParticlesProps {
    trigger: boolean;
    onComplete?: () => void;
}

interface Particle {
    angle: number;
    distance: number;
    color: string;
    delay: number;
}

const PARTICLE_COLORS = [
    '#2563eb',
    '#3b82f6',
    '#60a5fa',
    '#93c5fd',
    '#ffffff',
];

function SparkleParticle({ particle, active }: { particle: Particle; active: boolean }) {
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (active) {
            const toX = Math.cos(particle.angle) * particle.distance;
            const toY = Math.sin(particle.angle) * particle.distance;

            x.value = withDelay(particle.delay, withSpring(toX, { damping: 12, stiffness: 60 }));
            y.value = withDelay(particle.delay, withSpring(toY, { damping: 12, stiffness: 60 }));
            opacity.value = withDelay(particle.delay, withSpring(0, { damping: 12, stiffness: 60 }));
            scale.value = withDelay(particle.delay, withSpring(0.3, { damping: 12, stiffness: 60 }));
        } else {
            x.value = 0;
            y.value = 0;
            opacity.value = 1;
            scale.value = 1;
        }
    }, [active, particle]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x.value },
                { translateY: y.value },
                { scale: scale.value },
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View
            style={[
                styles.particle,
                { backgroundColor: particle.color },
                animatedStyle,
            ]}
        />
    );
}

export function SparkleParticles({ trigger, onComplete }: SparkleParticlesProps) {
    const [active, setActive] = useState(false);
    const particles = useRef<Particle[]>(
        Array.from({ length: 20 }, (_, i) => ({
            angle: (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5,
            distance: 150 + Math.random() * 100,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            delay: i * 30,
        }))
    ).current;

    useEffect(() => {
        if (trigger) {
            setActive(true);
            const timer = setTimeout(() => {
                setActive(false);
                onComplete?.();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [trigger, onComplete]);

    if (!active) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((p, i) => (
                <SparkleParticle key={i} particle={p} active={active} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
