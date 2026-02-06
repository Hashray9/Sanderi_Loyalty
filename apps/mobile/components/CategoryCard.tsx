import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Motion } from '@legendapp/motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface CategoryCardProps {
  category: 'HARDWARE' | 'PLYWOOD';
  points: number;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryCard({ category, points, isSelected, onPress }: CategoryCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
      <Motion.View
        animate={{ scale: isSelected ? 1.02 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
            shadowColor: '#000',
          },
        ]}
      >
        <Text
          style={[
            styles.categoryLabel,
            { color: isSelected ? colors.primary : colors.text },
          ]}
        >
          {category}
        </Text>
        <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
          {t('card.totalPoints')}
        </Text>
        <Text style={[styles.pointsValue, { color: colors.text }]}>{points}</Text>
      </Motion.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  pointsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
