import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Fingerprint, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const formatPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

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
    safeArea: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    bgGradientTop: {
      position: 'absolute',
      top: '-10%',
      left: '-20%',
      width: '80%',
      height: '50%',
      backgroundColor: colors.surface1,
      borderRadius: radius.full,
      opacity: 1,
    },
    bgGradientBottom: {
      position: 'absolute',
      bottom: '-10%',
      right: '-20%',
      width: '80%',
      height: '50%',
      backgroundColor: colors.surface1,
      borderRadius: radius.full,
      opacity: 1,
    },
    header: {
      alignItems: 'center',
      paddingTop: sp['6xl'],
      marginBottom: sp['7xl'],
    },
    shieldContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderProminent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: sp['2xl'],
    },
    headerTitle: {
      fontSize: typo.fontSize.lg,
      fontWeight: typo.fontWeight.medium,
      color: colors.textHigh,
      letterSpacing: typo.letterSpacing.subtitle,
      textTransform: 'uppercase',
    },
    formSection: {
      paddingHorizontal: sp['3xl'],
      gap: sp['5xl'],
      marginBottom: sp['7xl'],
    },
    inputGroup: {
      gap: sp.xs,
    },
    inputLabel: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.semibold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
      marginBottom: sp.sm,
      marginLeft: sp.xs,
    },
    input: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderProminent,
      color: colors.text,
      fontSize: typo.fontSize['4xl'],
      fontWeight: typo.fontWeight.light,
      fontFamily: typo.fontFamily.serif,
      letterSpacing: 4,
      paddingVertical: sp.lg,
      paddingHorizontal: 0,
    },
    mobileInput: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderProminent,
      color: colors.text,
      fontSize: typo.fontSize['4xl'],
      fontFamily: typo.fontFamily.serif,
      letterSpacing: typo.letterSpacing.phone,
      paddingVertical: sp.lg,
      paddingHorizontal: 0,
    },
    inputError: {
      borderBottomColor: colors.error,
    },
    errorText: {
      fontSize: typo.fontSize.label,
      color: colors.error,
      marginTop: 6,
      marginLeft: sp.xs,
    },
    loginButtonSection: {
      paddingHorizontal: sp['3xl'],
      marginBottom: sp['6xl'],
    },
    loginButton: {
      backgroundColor: colors.buttonPrimary,
      height: btn.primaryHeight,
      borderRadius: btn.primaryBorderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sp['3xl'],
    },
    loginButtonText: {
      fontSize: typo.fontSize.label,
      fontWeight: typo.fontWeight.bold,
      color: colors.buttonPrimaryText,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    loginButtonArrow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
    },
    arrowLine: {
      width: 32,
      height: 1,
      backgroundColor: colors.buttonArrowLine,
    },
    biometricSection: {
      alignItems: 'center',
      marginBottom: sp['6xl'],
    },
    biometricButton: {
      alignItems: 'center',
      gap: sp.lg,
    },
    biometricIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      backgroundColor: colors.surface1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    biometricLabel: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.heading,
      textTransform: 'uppercase',
    },
    signupSection: {
      alignItems: 'center',
      marginBottom: sp['2xl'],
    },
    signupLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.sm,
    },
    signupLinkLabel: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.normal,
      color: colors.textLow,
      letterSpacing: 2.5,
    },
    signupLinkText: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: colors.text,
      letterSpacing: 2.5,
      textDecorationLine: 'underline',
    },
    footer: {
      marginTop: 'auto',
      alignItems: 'center',
      paddingBottom: sp['4xl'],
      gap: sp['4xl'],
    },
    footerText: {
      fontSize: typo.fontSize.sm,
      color: colors.borderProminent,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
    },
    footerBar: {
      width: '33%',
      height: 4,
      backgroundColor: colors.borderMedium,
      borderRadius: 2,
    },
    bottomGradientFade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 128,
      backgroundColor: 'transparent',
      pointerEvents: 'none',
    },
  });

function useStyles() {
  const { colors, typography, spacing, borderRadius, buttons } = useTheme();
  return useMemo(
    () => createStyles(colors, typography, spacing, borderRadius, buttons),
    [colors, typography, spacing, borderRadius, buttons],
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, hasBiometrics, loginWithBiometrics } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobileNumber: '',
      password: '',
    },
  });

  // Biometric-first: auto-trigger on mount
  useEffect(() => {
    if (hasBiometrics) {
      handleBiometricLogin();
    }
  }, [hasBiometrics]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.mobileNumber.replace(/\D/g, ''), data.password);
    } catch (error: any) {
      Alert.alert(
        t('auth.error'),
        error.message || t('auth.invalidCredentials'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithBiometrics();
    } catch {
      Alert.alert(t('auth.error'), t('auth.biometricFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradients */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.shieldContainer}>
              <ShieldCheck size={28} color={colors.text} strokeWidth={1.2} />
            </View>
            <Text style={styles.headerTitle}>STAFF LOGIN</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Controller
              control={control}
              name="mobileNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                  <TextInput
                    style={[
                      styles.mobileInput,
                      errors.mobileNumber && styles.inputError,
                    ]}
                    placeholder="00000 00000"
                    placeholderTextColor={colors.placeholderFaint}
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, '');
                      if (cleaned.length <= 10) {
                        onChange(formatPhoneInput(cleaned));
                      }
                    }}
                    value={value}
                    maxLength={11}
                    editable={!isLoading}
                  />
                  {errors.mobileNumber && (
                    <Text style={styles.errorText}>
                      {errors.mobileNumber.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.placeholderFaint}
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Login button */}
          <View style={styles.loginButtonSection}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                  <View style={styles.loginButtonArrow}>
                    <View style={styles.arrowLine} />
                    <ArrowRight size={18} color={colors.buttonPrimaryText} strokeWidth={2.5} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Biometric section */}
          {hasBiometrics && (
            <View style={styles.biometricSection}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.biometricIcon}>
                  <Fingerprint
                    size={36}
                    color="rgba(255,255,255,0.7)"
                    strokeWidth={1.2}
                  />
                </View>
                <Text style={styles.biometricLabel}>USE BIOMETRIC</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign Up link */}
          <View style={styles.signupSection}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.7}
              style={styles.signupLink}
            >
              <Text style={styles.signupLinkLabel}>DON'T HAVE AN ACCOUNT?</Text>
              <Text style={styles.signupLinkText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bottom gradient fade */}
      <View style={styles.bottomGradientFade} />
    </View>
  );
}
