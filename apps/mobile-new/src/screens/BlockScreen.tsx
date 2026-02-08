import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { v4 as uuidv4 } from 'uuid';
import { BlockConfirmDialog } from '@/components/BlockConfirmDialog';
import { SuccessOverlay } from '@/components/SuccessOverlay';

export default function BlockScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { cardUid } = route.params;
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { addAction } = useOfflineQueue();

    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleBlock = async () => {
        setIsLoading(true);
        try {
            await addAction({
                entryId: uuidv4(),
                actionType: 'BLOCK',
                payload: {
                    cardUid: cardUid!,
                    reason: 'OTHER',
                },
            });

            setShowSuccess(true);
        } catch {
            Alert.alert(t('common.error'), t('block.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <BlockConfirmDialog
                visible={!showSuccess}
                onConfirm={handleBlock}
                onCancel={() => navigation.goBack()}
                isLoading={isLoading}
            />

            <SuccessOverlay
                visible={showSuccess}
                message={t('block.successMessage')}
                onDismiss={() => {
                    setShowSuccess(false);
                    navigation.goBack();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
