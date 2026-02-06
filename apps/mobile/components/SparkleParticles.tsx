import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Motion } from '@legendapp/motion';

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
      {particles.map((p, i) => {
        const toX = Math.cos(p.angle) * p.distance;
        const toY = Math.sin(p.angle) * p.distance;

        return (
          <Motion.View
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: toX, y: toY, opacity: 0, scale: 0.3 }}
            transition={{
              type: 'spring',
              stiffness: 60,
              damping: 12,
              delay: p.delay,
            }}
            style={[styles.particle, { backgroundColor: p.color }]}
          />
        );
      })}
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
