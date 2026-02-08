import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface BlockConfirmDialogProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function BlockConfirmDialog({
    visible,
    onConfirm,
    onCancel,
    isLoading,
}: BlockConfirmDialogProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.backdrop}>
                <View style={[styles.dialog, { backgroundColor: colors.card }]}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('block.quickConfirm')}
                    </Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        {t('block.quickConfirmMessage')}
                    </Text>

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.cancelBtn, { borderColor: colors.border }]}
                            onPress={onCancel}
                            disabled={isLoading}
                        >
                            <Text style={[styles.cancelText, { color: colors.text }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: colors.error }]}
                            onPress={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmText}>{t('block.confirm')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    dialog: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
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
    confirmBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
