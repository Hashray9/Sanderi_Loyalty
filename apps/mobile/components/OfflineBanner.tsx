import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { AnimatePresence, Motion } from '@legendapp/motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {!isOnline && (
        <Motion.View
          key="offline-banner"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={[styles.banner, { backgroundColor: colors.warning + '20' }]}
        >
          <Text style={[styles.text, { color: colors.warning }]}>
            {t('status.offlineBanner')}
          </Text>
        </Motion.View>
      )}
    </AnimatePresence>
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
