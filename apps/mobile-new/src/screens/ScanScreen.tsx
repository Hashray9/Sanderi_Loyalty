import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {
  Nfc,
  Search,
  Settings,
  Check,
  Plus,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNfc } from '@/hooks/useNfc';
import { useNetwork } from '@/hooks/useNetwork';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useSound } from '@/hooks/useSound';
import { SparkleParticles } from '@/components/SparkleParticles';

// ─── Theme-derived styles ────────────────────────────────────────────────────

type Theme = ReturnType<typeof useTheme>;

const createStyles = (
  colors: Theme['colors'],
  typo: Theme['typography'],
  sp: Theme['spacing'],
  radius: Theme['borderRadius'],
  btn: Theme['buttons'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    bgGradientTop: {
      position: 'absolute',
      top: '-5%',
      left: '-10%',
      width: '60%',
      height: '40%',
      backgroundColor: colors.surface3,
      borderRadius: radius.full,
      transform: [{ scale: 1.5 }],
      opacity: 0.3,
    },
    bgGradientBottom: {
      position: 'absolute',
      bottom: '0%',
      right: '-10%',
      width: '50%',
      height: '50%',
      backgroundColor: colors.surface3,
      borderRadius: radius.full,
      transform: [{ scale: 1.5 }],
      opacity: 0.3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: sp['3xl'],
      paddingTop: sp.lg,
      marginBottom: sp['4xl'],
    },
    welcomeText: {
      fontSize: typo.fontSize['3xl'],
      fontWeight: typo.fontWeight.normal,
      color: colors.text,
      fontFamily: typo.fontFamily.serif,
      marginBottom: 2,
    },
    welcomeNameItalic: {
      fontSize: typo.fontSize['3xl'],
      fontStyle: 'italic',
      fontWeight: typo.fontWeight.normal,
      color: colors.text,
      fontFamily: typo.fontFamily.serif,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: sp.md,
    },
    searchButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface5,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface5,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sp['3xl'],
    },
    titleSection: {
      alignItems: 'center',
      marginBottom: sp['5xl'],
    },
    mainTitle: {
      fontSize: typo.fontSize['6xl'],
      fontWeight: typo.fontWeight.bold,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 42,
      fontFamily: typo.fontFamily.serif,
    },
    cardContainer: {
      width: '100%',
      height: 340,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    rippleCircle: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    glassCard: {
      width: 200,
      height: 300,
      borderRadius: radius['3xl'],
      overflow: 'hidden',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 60,
      elevation: 18,
      zIndex: 20,
    },
    cardGradient: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      borderRadius: radius['3xl'],
      padding: sp['2xl'],
      justifyContent: 'space-between',
    },
    cardShine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.4,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    nfcIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      backgroundColor: colors.surface3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    credentialsLabel: {
      fontSize: typo.fontSize.nano,
      letterSpacing: 1.8,
      color: colors.textTertiary,
      fontWeight: typo.fontWeight.medium,
    },
    hexagonContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -60 }, { translateY: -60 }],
      width: 120,
      height: 120,
      opacity: 0.05,
    },
    hexagon: {
      width: 120,
      height: 120,
      backgroundColor: colors.text,
      transform: [{ rotate: '0deg' }],
    },
    scanLine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      zIndex: 30,
    },
    scanLineGradient: {
      flex: 1,
    },
    cardFooter: {
      gap: sp.md,
    },
    statusBar: {
      width: 48,
      height: 2,
      backgroundColor: colors.borderProminent,
      borderRadius: 1,
    },
    statusText: {
      fontSize: typo.fontSize.xs,
      letterSpacing: 1.8,
      color: colors.textSecondary,
      fontWeight: typo.fontWeight.medium,
    },
    floatingCheckButton: {
      position: 'absolute',
      right: -6,
      top: '28%',
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: colors.surface3,
      borderWidth: 1,
      borderColor: colors.borderProminent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.background,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
      zIndex: 30,
    },
    floatingAddButton: {
      position: 'absolute',
      left: -4,
      bottom: '28%',
      width: 38,
      height: 38,
      borderRadius: radius.lg,
      backgroundColor: colors.surface3,
      borderWidth: 1,
      borderColor: colors.borderProminent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.background,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
      zIndex: 30,
    },
    footer: {
      paddingHorizontal: sp['3xl'],
      paddingBottom: sp['2xl'],
      marginTop: sp['5xl'],
      gap: sp.lg,
    },
    startButton: {
      backgroundColor: colors.buttonPrimary,
      height: btn.primaryHeight,
      borderRadius: btn.primaryBorderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sp['3xl'],
    },
    startButtonText: {
      fontSize: typo.fontSize.md,
      fontWeight: typo.fontWeight.bold,
      color: colors.buttonPrimaryText,
      letterSpacing: 2.2,
    },
    scanningButton: {
      backgroundColor: colors.surface6,
      height: btn.primaryHeight,
      borderRadius: btn.primaryBorderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sp['3xl'],
    },
    scanningButtonText: {
      fontSize: typo.fontSize.md,
      fontWeight: typo.fontWeight.bold,
      color: colors.text,
      letterSpacing: 2.2,
    },
    startButtonArrow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    arrowLine: {
      width: 36,
      height: 1,
      backgroundColor: colors.buttonArrowLine,
    },
    scanningTextContainer: {
      alignItems: 'center',
      marginTop: sp['2xl'],
    },
    scanningTitle: {
      fontSize: typo.fontSize['2xl'],
      fontStyle: 'italic',
      color: colors.text,
      fontFamily: typo.fontFamily.serif,
      marginBottom: sp.sm,
    },
    scanningSubtitle: {
      fontSize: typo.fontSize.label,
      letterSpacing: 2,
      color: colors.textSecondary,
      fontWeight: typo.fontWeight.medium,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: btn.ghostBorderWidth,
      borderColor: colors.borderProminent,
      height: btn.primaryHeight,
      borderRadius: btn.primaryBorderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sp['3xl'],
    },
    cancelButtonText: {
      fontSize: typo.fontSize.md,
      fontWeight: typo.fontWeight.bold,
      color: colors.textSecondary,
      letterSpacing: 2.2,
    },
    bottomGradientFade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 160,
      backgroundColor: 'transparent',
    },
  });

function useStyles() {
  const { colors, typography, spacing, borderRadius, buttons } = useTheme();
  return useMemo(
    () => createStyles(colors, typography, spacing, borderRadius, buttons),
    [colors, typography, spacing, borderRadius, buttons],
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RippleCircle({
  delay = 0,
  baseScale,
}: {
  delay?: number;
  baseScale?: Animated.Value;
}) {
  const styles = useStyles();
  const scale = useState(() => new Animated.Value(0.6))[0];
  const opacity = useState(() => new Animated.Value(0.8))[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.5,
          duration: 3000,
          delay,
          easing: Easing.bezier(0, 0.2, 0.8, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay,
          easing: Easing.bezier(0, 0.2, 0.8, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, scale, opacity]);

  const combinedScale = baseScale ? Animated.multiply(scale, baseScale) : scale;

  return (
    <Animated.View
      style={[
        styles.rippleCircle,
        {
          transform: [{ scale: combinedScale }],
          opacity,
        },
      ]}
    />
  );
}

function ScanningLine({ isVisible }: { isVisible: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const translateY = useState(() => new Animated.Value(0))[0];
  const lineOpacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (isVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lineOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 390,
            duration: 3400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(lineOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      translateY.setValue(0);
      lineOpacity.setValue(0);
    }
  }, [isVisible, translateY, lineOpacity]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.scanLine,
        {
          transform: [{ translateY }],
          opacity: lineOpacity,
        },
      ]}
    >
      <LinearGradient
        colors={['transparent', colors.scanLine, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.scanLineGradient}
      />
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
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

  // Animation values
  const titleOpacity = useState(() => new Animated.Value(1))[0];
  const cardScale = useState(() => new Animated.Value(1))[0];
  const cardTranslateY = useState(() => new Animated.Value(0))[0];
  const rippleScale = useState(() => new Animated.Value(1))[0];

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

    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1.3,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: -50,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rippleScale, {
        toValue: 1.5,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    setIsScanning(true);
    try {
      await startScan();
    } catch {
      Alert.alert(t('common.error'), t('nfc.scanFailed'));
      handleStopScan();
    }
  }, [
    isSupported,
    isEnabled,
    startScan,
    t,
    titleOpacity,
    cardScale,
    cardTranslateY,
    rippleScale,
  ]);

  const handleStopScan = useCallback(async () => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    await stopScan();
    setIsScanning(false);
  }, [stopScan, titleOpacity, cardScale, cardTranslateY, rippleScale]);

  useEffect(() => {
    if (scannedCard) {
      setIsScanning(false);
      playSuccessSound();
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

  return (
    <View style={styles.container}>
      {/* Background gradients */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      <SafeAreaView style={styles.flex}>
        <SparkleParticles
          trigger={sparkle}
          onComplete={handleSparkleComplete}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.welcomeNameItalic}>
              {staff?.name || 'Manish Bhai'}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Lookup')}
              activeOpacity={0.7}
            >
              <Search size={20} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <Settings size={20} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Title */}
          <Animated.View
            style={[styles.titleSection, { opacity: titleOpacity }]}
          >
            <Text style={styles.mainTitle}>Sanderi</Text>
            <Text style={styles.mainTitle}>loyalty</Text>
          </Animated.View>

          {/* Card area with ripples */}
          <View style={styles.cardContainer}>
            <RippleCircle delay={0} baseScale={rippleScale} />
            <RippleCircle delay={1500} baseScale={rippleScale} />

            {/* Glassmorphic Card */}
            <Animated.View
              style={[
                styles.glassCard,
                {
                  transform: [
                    { scale: cardScale },
                    { translateY: cardTranslateY },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.card, colors.cardDark]}
                style={styles.cardGradient}
              >
                {/* Card shine overlay */}
                <LinearGradient
                  colors={[
                    'transparent',
                    colors.surface3,
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardShine}
                />

                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.nfcIconContainer}>
                    <Nfc size={16} color={colors.textSubtle} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.credentialsLabel}>
                    {isScanning ? 'SECURE_CHIP_V2' : 'CREDENTIALS'}
                  </Text>
                </View>

                {/* Hexagon background */}
                <View style={styles.hexagonContainer}>
                  <View style={styles.hexagon} />
                </View>

                {/* Scanning line */}
                <ScanningLine isVisible={isScanning} />

                {/* Card footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.statusBar} />
                  <Text style={styles.statusText}>
                    {isScanning ? 'READY TO RECEIVE' : 'READY TO SCAN'}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Floating action buttons - hide during scanning */}
            {!isScanning && (
              <>
                <TouchableOpacity
                  style={styles.floatingCheckButton}
                  activeOpacity={0.8}
                >
                  <Check size={18} color={colors.success} strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.floatingAddButton}
                  onPress={() => navigation.navigate('Enroll')}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={colors.info} strokeWidth={2} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Scanning text - show when scanning */}
          {isScanning && (
            <Animated.View style={styles.scanningTextContainer}>
              <Text style={styles.scanningTitle}>Searching for card...</Text>
              <Text style={styles.scanningSubtitle}>
                HOLD NEAR THE BACK OF DEVICE
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {isScanning ? (
            <>
              <View style={styles.scanningButton}>
                <Text style={styles.scanningButtonText}>SCANNING...</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleStopScan}
                activeOpacity={0.9}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartScan}
              activeOpacity={0.9}
            >
              <Text style={styles.startButtonText}>START SCAN</Text>
              <View style={styles.startButtonArrow}>
                <View style={styles.arrowLine} />
                <ArrowRight size={18} color={colors.buttonPrimaryText} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom gradient fade */}
      <View style={styles.bottomGradientFade} />
    </View>
  );
}
