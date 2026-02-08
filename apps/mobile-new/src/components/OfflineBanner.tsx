import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface OfflineBannerProps {
    isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    if (isOnline) return null;

    return (
        <Animated.View
            entering={FadeInUp.springify().damping(20).stiffness(200)}
            exiting={FadeOutUp.springify().damping(20).stiffness(200)}
            style={[styles.banner, { backgroundColor: colors.warning + '20' }]}
        >
            <Text style={[styles.text, { color: colors.warning }]}>
                {t('status.offlineBanner')}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    text: {
        fontSize: 13,
        fontWeight: '500',
    },
});
