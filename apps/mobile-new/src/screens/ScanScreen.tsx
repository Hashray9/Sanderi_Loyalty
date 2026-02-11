import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {
  Nfc,
  Search,
  Settings,
  WifiOff,
  CloudUpload,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNfc } from '@/hooks/useNfc';
import { useNetwork } from '@/hooks/useNetwork';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useSound } from '@/hooks/useSound';
import { FloatingCard } from '@/components/FloatingCard';
import { PulsingText } from '@/components/PulsingText';
import { SparkleParticles } from '@/components/SparkleParticles';

const DARK_GRADIENT = ['#050505', '#1c150e', '#18101e', '#0a0a0a'];
const LIGHT_GRADIENT = ['#faf8f5', '#f5ede4', '#f0eaf2', '#f8f6f4'];

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const { staff } = useAuth();
  const {
    isSupported,
    isEnabled,
    startScan,
    stopScan,
    scannedCard,
    clearScanned,
  } = useNfc();
  const { isOnline } = useNetwork();
  const { queueCount } = useOfflineQueue();
  const { play: playSuccessSound } = useSound('success_beep.mp3');
  const [isScanning, setIsScanning] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const isDark = colorScheme === 'dark';

  const handleStartScan = useCallback(async () => {
    if (!isSupported) {
      Alert.alert(t('nfc.notSupported'), t('nfc.notSupportedMessage'));
      return;
    }

    if (!isEnabled) {
      Alert.alert(t('nfc.disabled'), t('nfc.enableNfc'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.openSettings'),
          onPress: () => {
            Linking.sendIntent('android.settings.NFC_SETTINGS');
          },
        },
      ]);
      return;
    }

    setIsScanning(true);
    try {
      await startScan();
    } catch {
      Alert.alert(t('common.error'), t('nfc.scanFailed'));
      setIsScanning(false);
    }
  }, [isSupported, isEnabled, startScan, t]);

  const handleStopScan = useCallback(async () => {
    await stopScan();
    setIsScanning(false);
  }, [stopScan]);

  useEffect(() => {
    if (scannedCard) {
      setIsScanning(false);
      playSuccessSound(); // Play success sound when card is scanned
      setSparkle(true);
      setPendingNav(scannedCard);
      clearScanned();
    }
  }, [scannedCard, clearScanned, playSuccessSound]);

  const handleSparkleComplete = useCallback(() => {
    setSparkle(false);
    if (pendingNav) {
      navigation.navigate('Card', { cardUid: pendingNav });
      setPendingNav(null);
    }
  }, [pendingNav, navigation]);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  const textPrimary = isDark ? '#f5f0eb' : '#1a1510';
  const textSecondary = isDark ? '#8a7e72' : '#7a6e62';

  return (
    <LinearGradient
      colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
      locations={[0, 0.35, 0.65, 1]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: textSecondary }]}>
              Hello,
            </Text>
            <Text style={[styles.staffName, { color: textPrimary }]}>
              {staff?.name || 'Staff'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {!isOnline && (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(217,119,6,0.15)'
                      : 'rgba(217,119,6,0.10)',
                  },
                ]}
              >
                <WifiOff size={14} color="#d97706" strokeWidth={2} />
              </View>
            )}
            {queueCount > 0 && (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(250,0,17,0.15)'
                      : 'rgba(250,0,17,0.08)',
                  },
                ]}
              >
                <CloudUpload size={14} color="#FA0011" strokeWidth={2} />
                <Text style={[styles.statusPillText, { color: '#FA0011' }]}>
                  {queueCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Center — Card + Scan */}
        <View style={styles.centerArea}>
          <View style={styles.cardWrapper}>
            <SparkleParticles
              trigger={sparkle}
              onComplete={handleSparkleComplete}
            />
            <FloatingCard isScanning={isScanning} />
          </View>

          <PulsingText
            text={
              isScanning
                ? t('scan.holdCardNearPhone')
                : t('scan.clickStartToScan')
            }
            style={[
              styles.hintText,
              { color: textSecondary },
              isScanning && styles.hintTextScanning,
            ]}
          />

          <TouchableOpacity
            onPress={isScanning ? handleStopScan : handleStartScan}
            activeOpacity={0.85}
          >
            <View style={styles.scanButtonOuter}>
              <LinearGradient
                colors={
                  isScanning ? ['#dc2626', '#b91c1c'] : ['#FA0011', '#c5000d']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanButton}
              >
                <Nfc size={22} color="#fff" strokeWidth={2} />
                <Text style={styles.scanButtonText}>
                  {isScanning ? t('scan.cancel') : t('scan.startScan')}
                </Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Quick Actions */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.04)',
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              },
            ]}
            onPress={() => navigation.navigate('Lookup')}
            activeOpacity={0.7}
          >
            <Search
              size={18}
              color={isDark ? '#c0b8ae' : '#5a5048'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.quickActionText,
                { color: isDark ? '#c0b8ae' : '#5a5048' },
              ]}
            >
              {t('tabs.lookup')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              },
            ]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Settings
              size={18}
              color={isDark ? '#c0b8ae' : '#5a5048'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.quickActionText,
                { color: isDark ? '#c0b8ae' : '#5a5048' },
              ]}
            >
              {t('tabs.settings')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '400',
  },
  staffName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardWrapper: {
    marginBottom: 36,
  },
  hintText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 28,
    textAlign: 'center',
  },
  hintTextScanning: {
    marginTop: 48,
    marginBottom: 40,
  },
  scanButtonOuter: {
    borderRadius: 30,
    shadowColor: '#FA0011',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 56,
    paddingVertical: 18,
    borderRadius: 30,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomBar: {
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
  quickActionButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
