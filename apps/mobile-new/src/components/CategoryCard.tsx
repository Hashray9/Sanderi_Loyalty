import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CategoryCardProps {
    category: 'HARDWARE' | 'PLYWOOD';
    points: number;
    isSelected: boolean;
    onPress: () => void;
}

export function CategoryCard({ category, points, isSelected, onPress }: CategoryCardProps) {
    const { colorScheme } = useTheme();

    const isDark = colorScheme === 'dark';

    const textPrimary = isDark ? '#f5f0eb' : '#1a1510';
    const textSecondary = isDark ? '#8a7e72' : '#7a6e62';

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.04)',
                            borderColor: isSelected
                                ? '#FA0011'
                                : isDark
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.06)',
                            borderWidth: isSelected ? 2 : 1,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.categoryLabel,
                            { color: isSelected ? '#FA0011' : textSecondary },
                        ]}
                    >
                        {category}
                    </Text>
                    <Text style={[styles.pointsLabel, { color: textSecondary }]}>
                        TOTAL POINTS
                    </Text>
                    <Text style={[styles.pointsValue, { color: textPrimary }]}>{points}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    touchable: {
        flex: 1,
    },
    card: {
        flex: 1,
        borderRadius: 18,
        paddingVertical: 24,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    pointsLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    pointsValue: {
        fontSize: 40,
        fontWeight: '800',
    },
});
