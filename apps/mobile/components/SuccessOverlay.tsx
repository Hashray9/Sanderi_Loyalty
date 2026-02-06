import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { AnimatePresence, Motion } from '@legendapp/motion';
import * as Haptics from 'expo-haptics';

interface SuccessOverlayProps {
  visible: boolean;
  message?: string;
  onDismiss: () => void;
}

export function SuccessOverlay({ visible, message, onDismiss }: SuccessOverlayProps) {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(onDismiss, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <Motion.View
          key="success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.overlay}
        >
          <Motion.View
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={styles.circle}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Motion.View>
          {message && (
            <Motion.Text
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', delay: 200 }}
              style={styles.message}
            >
              {message}
            </Motion.Text>
          )}
        </Motion.View>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
