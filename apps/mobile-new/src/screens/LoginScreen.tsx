import { useState, useEffect } from 'react';
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

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, hasBiometrics, loginWithBiometrics } = useAuth();
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
              <ShieldCheck size={28} color="#fff" strokeWidth={1.2} />
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
                    placeholderTextColor="rgba(255,255,255,0.08)"
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
                    placeholderTextColor="rgba(255,255,255,0.08)"
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
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                  <View style={styles.loginButtonArrow}>
                    <View style={styles.arrowLine} />
                    <ArrowRight size={18} color="#000" strokeWidth={2.5} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 999,
    opacity: 1,
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: '-10%',
    right: '-20%',
    width: '80%',
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 999,
    opacity: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    marginBottom: 64,
  },
  shieldContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 6.4,
    textTransform: 'uppercase',
  },
  formSection: {
    paddingHorizontal: 28,
    gap: 40,
    marginBottom: 64,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    fontFamily: 'serif',
    letterSpacing: 4,
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  mobileInput: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 24,
    fontFamily: 'serif',
    letterSpacing: 8,
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  inputError: {
    borderBottomColor: '#ef4444',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
  },
  loginButtonSection: {
    paddingHorizontal: 28,
    marginBottom: 48,
  },
  loginButton: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  loginButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  loginButtonArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrowLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  biometricSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  biometricButton: {
    alignItems: 'center',
    gap: 16,
  },
  biometricIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 4.8,
    textTransform: 'uppercase',
  },
  signupSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signupLinkLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2.5,
  },
  signupLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2.5,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 32,
    gap: 32,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
  footerBar: {
    width: '33%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
