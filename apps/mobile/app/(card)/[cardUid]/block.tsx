import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { v4 as uuidv4 } from 'uuid';
import { BlockConfirmDialog } from '@/components/BlockConfirmDialog';
import { SuccessOverlay } from '@/components/SuccessOverlay';

export default function BlockScreen() {
  const { cardUid } = useLocalSearchParams<{ cardUid: string }>();
  const router = useRouter();
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
        onCancel={() => router.back()}
        isLoading={isLoading}
      />

      <SuccessOverlay
        visible={showSuccess}
        message={t('block.successMessage')}
        onDismiss={() => {
          setShowSuccess(false);
          router.back();
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
