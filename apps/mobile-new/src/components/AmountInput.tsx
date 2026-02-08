import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface AmountInputProps {
    mode: 'credit' | 'debit';
    category: 'HARDWARE' | 'PLYWOOD';
    currentBalance?: number;
    conversionRate?: number;
    onDone: (value: number) => void;
    onCancel: () => void;
}

export function AmountInput({
    mode,
    category,
    currentBalance = 0,
    conversionRate = 100,
    onDone,
    onCancel,
}: AmountInputProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    const numValue = parseInt(value, 10) || 0;

    const pointsPreview =
        mode === 'credit' ? Math.floor(numValue / conversionRate) : numValue;
    const rupeesEquivalent =
        mode === 'debit' ? numValue * conversionRate : numValue;

    const handleDone = () => {
        if (numValue <= 0) {
            setError(
                mode === 'credit' ? t('credit.invalidAmount') : t('debit.invalidPoints')
            );
            return;
        }

        if (mode === 'credit' && Math.floor(numValue / conversionRate) <= 0) {
            setError(t('credit.amountTooLow'));
            return;
        }

        if (mode === 'debit' && numValue > currentBalance) {
            setError(t('debit.exceedsBalance'));
            return;
        }

        setError('');
        onDone(numValue);
    };

    return (
        <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(200)}
            exiting={FadeOutUp.springify().damping(20).stiffness(200)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.container, { backgroundColor: colors.secondary }]}>
                    <View style={styles.inputRow}>
                        {mode === 'credit' && (
                            <Text style={[styles.currency, { color: colors.text }]}>₹</Text>
                        )}
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.inputBackground,
                                    color: colors.text,
                                    borderColor: error ? colors.error : colors.border,
                                },
                            ]}
                            placeholder={mode === 'credit' ? '0' : '0'}
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={value}
                            onChangeText={(v) => {
                                setValue(v);
                                setError('');
                            }}
                            autoFocus
                        />
                    </View>

                    {error ? (
                        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                    ) : null}

                    {numValue > 0 && (
                        <View style={[styles.preview, { backgroundColor: colors.primaryLight }]}>
                            {mode === 'credit' ? (
                                <>
                                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                                        {t('card.pointsEarned')}
                                    </Text>
                                    <Text style={[styles.previewValue, { color: colors.success }]}>
                                        +{pointsPreview}
                                    </Text>
                                    <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
                                        {t('credit.conversionRate', { rate: conversionRate })}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                                        {t('card.rupeesEquivalent')}
                                    </Text>
                                    <Text style={[styles.previewValue, { color: colors.primary }]}>
                                        ₹{rupeesEquivalent}
                                    </Text>
                                    <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
                                        {t('debit.remaining')}: {Math.max(0, currentBalance - numValue)}
                                    </Text>
                                </>
                            )}
                        </View>
                    )}

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor: colors.border }]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.cancelText, { color: colors.text }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                            onPress={handleDone}
                        >
                            <Text style={styles.doneText}>{t('card.done')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 20,
        marginTop: 12,
        marginHorizontal: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    currency: {
        fontSize: 28,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 24,
        fontWeight: '600',
    },
    error: {
        fontSize: 12,
        marginTop: 8,
    },
    preview: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    previewValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    previewSub: {
        fontSize: 12,
        marginTop: 4,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
    doneBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
