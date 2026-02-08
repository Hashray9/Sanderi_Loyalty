import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface CardBottomBarProps {
    cardUid: string;
    onBlock: () => void;
    showBlock?: boolean;
}

export function CardBottomBar({ cardUid, onBlock, showBlock = true }: CardBottomBarProps) {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.secondary }]}
                onPress={() => navigation.navigate('History', { cardUid })}
            >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                    {t('card.viewHistory')}
                </Text>
            </TouchableOpacity>

            {showBlock && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.error + '15' }]}
                    onPress={onBlock}
                >
                    <Text style={[styles.buttonText, { color: colors.error }]}>
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
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
