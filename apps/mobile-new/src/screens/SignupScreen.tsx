import { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    inviteCode: z.string().min(1, 'Invite code is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

const formatPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { signup } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(data.name, data.mobileNumber.replace(/\D/g, ''), data.password, data.inviteCode);
    } catch (error: any) {
      Alert.alert(t('auth.signupError'), error.message || t('auth.signupError'));
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <UserPlus size={24} color="#fff" strokeWidth={1.2} />
              </View>
              <Text style={styles.headerTitle}>CREATE ACCOUNT</Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder="JOHN DOE"
                      placeholderTextColor="rgba(255,255,255,0.08)"
                      autoCapitalize="words"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="mobileNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                    <TextInput
                      style={[styles.mobileInput, errors.mobileNumber && styles.inputError]}
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
                      <Text style={styles.errorText}>{errors.mobileNumber.message}</Text>
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
                      <Text style={styles.errorText}>{errors.password.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                    <TextInput
                      style={[styles.input, errors.confirmPassword && styles.inputError]}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.08)"
                      secureTextEntry
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                    {errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="inviteCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>INVITE CODE</Text>
                    <TextInput
                      style={[styles.input, errors.inviteCode && styles.inputError]}
                      placeholder="STF-0000"
                      placeholderTextColor="rgba(255,255,255,0.08)"
                      autoCapitalize="characters"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                    {errors.inviteCode && (
                      <Text style={styles.errorText}>{errors.inviteCode.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Sign Up button */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>SIGN UP</Text>
                    <View style={styles.buttonArrow}>
                      <View style={styles.arrowLine} />
                      <ArrowRight size={18} color="#000" strokeWidth={2.5} />
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Login link */}
            <View style={styles.loginSection}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkLabel}>ALREADY HAVE AN ACCOUNT?</Text>
                <Text style={styles.loginLinkText}>LOGIN</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
    marginBottom: 40,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 6.4,
    textTransform: 'uppercase',
  },
  formSection: {
    paddingHorizontal: 28,
    gap: 28,
    marginBottom: 48,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    marginBottom: 4,
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
    fontSize: 20,
    fontWeight: '300',
    fontFamily: 'serif',
    letterSpacing: 4,
    paddingVertical: 12,
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
    fontSize: 20,
    fontFamily: 'serif',
    letterSpacing: 8,
    paddingVertical: 12,
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
  buttonSection: {
    paddingHorizontal: 28,
    marginBottom: 32,
  },
  signupButton: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  signupButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  buttonArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrowLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loginSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginLinkLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2.5,
  },
  loginLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2.5,
    textDecorationLine: 'underline',
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
