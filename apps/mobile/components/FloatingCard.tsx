import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Motion } from '@legendapp/motion';
import { useTheme } from '@/contexts/ThemeContext';

interface FloatingCardProps {
  isScanning: boolean;
}

export function FloatingCard({ isScanning }: FloatingCardProps) {
  const { colors } = useTheme();
  const [bobUp, setBobUp] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setBobUp((v) => !v), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Motion.View
      animate={{
        y: bobUp ? -8 : 8,
        scale: isScanning ? 1.03 : 1,
      }}
      transition={{ type: 'spring', stiffness: 40, damping: 10 }}
      style={[
        styles.card,
        {
          backgroundColor: colors.primary,
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.cardContent}>
        <Text style={styles.logo}>SANDERI</Text>
        <Text style={styles.subtitle}>LOYALTY CARD</Text>
      </View>
      <View style={styles.nfcWave}>
        <Text style={styles.nfcIcon}>⦿</Text>
      </View>
    </Motion.View>
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
    transform: [
      { perspective: 800 },
      { rotateX: '5deg' },
      { rotateY: '-3deg' },
    ],
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
