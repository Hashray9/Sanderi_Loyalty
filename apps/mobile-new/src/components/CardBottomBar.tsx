import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, Ban } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface CardBottomBarProps {
    cardUid: string;
    onBlock: () => void;
    showBlock?: boolean;
}

export function CardBottomBar({ cardUid, onBlock, showBlock = true }: CardBottomBarProps) {
    const navigation = useNavigation<any>();
    const { colorScheme } = useTheme();
    const { t } = useTranslation();

    const isDark = colorScheme === 'dark';

    return (
        <View style={[
            styles.bar,
            {
                backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.04)',
                borderColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
            },
        ]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                    },
                ]}
                onPress={() => navigation.navigate('History', { cardUid })}
                activeOpacity={0.7}
            >
                <Clock
                    size={18}
                    color={isDark ? '#c0b8ae' : '#5a5048'}
                    strokeWidth={2}
                />
                <Text style={[
                    styles.buttonText,
                    { color: isDark ? '#c0b8ae' : '#5a5048' },
                ]}>
                    {t('card.viewHistory')}
                </Text>
            </TouchableOpacity>

            {showBlock && (
                <TouchableOpacity
                    style={[
                        styles.button,
                        {
                            backgroundColor: isDark
                                ? 'rgba(239,68,68,0.10)'
                                : 'rgba(239,68,68,0.08)',
                        },
                    ]}
                    onPress={onBlock}
                    activeOpacity={0.7}
                >
                    <Ban
                        size={18}
                        color={isDark ? '#ef4444' : '#dc2626'}
                        strokeWidth={2}
                    />
                    <Text style={[
                        styles.buttonText,
                        { color: isDark ? '#ef4444' : '#dc2626' },
                    ]}>
                        {t('card.blockCard')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
        gap: 12,
        borderTopWidth: 1,
        borderRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
