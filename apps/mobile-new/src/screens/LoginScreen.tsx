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
import { useNavigation } from '@react-navigation/native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
    mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const rnBiometrics = new ReactNativeBiometrics();

export default function LoginScreen() {
    console.log('🔑 LoginScreen: Rendering');
    const navigation = useNavigation<any>();
    const { login, hasBiometrics, loginWithBiometrics } = useAuth();
    const { colors } = useTheme();
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
        console.log('🔑 LoginScreen: Attempting login with:', data.mobileNumber);
        setIsLoading(true);
        try {
            await login(data.mobileNumber, data.password);
            console.log('🔑 LoginScreen: Login successful!');
            // Navigation is handled automatically by RootNavigator when isAuthenticated changes
        } catch (error: any) {
            console.error('🔑 LoginScreen: Login failed:', error);
            console.error('🔑 LoginScreen: Error response:', error.response);
            Alert.alert(t('auth.error'), error.message || t('auth.invalidCredentials'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        try {
            setIsLoading(true);
            await loginWithBiometrics();
            // Navigation is handled automatically by RootNavigator when isAuthenticated changes
        } catch {
            Alert.alert(t('auth.error'), t('auth.biometricFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Logo placeholder */}
                <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.logoText}>SANDERI</Text>
                </View>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('auth.loginSubtitle')}
                </Text>

                <Animated.View
                    entering={FadeInDown.springify().damping(20).stiffness(200)}
                    style={styles.form}
                >
                    <Controller
                        control={control}
                        name="mobileNumber"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {t('auth.mobileNumber')}
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            borderColor: errors.mobileNumber ? colors.error : colors.border,
                                        },
                                    ]}
                                    placeholder={t('auth.mobileNumberPlaceholder')}
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="phone-pad"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    editable={!isLoading}
                                />
                                {errors.mobileNumber && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>
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
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {t('auth.password')}
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            borderColor: errors.password ? colors.error : colors.border,
                                        },
                                    ]}
                                    placeholder={t('auth.passwordPlaceholder')}
                                    placeholderTextColor={colors.textSecondary}
                                    secureTextEntry
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    editable={!isLoading}
                                />
                                {errors.password && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>
                                        {errors.password.message}
                                    </Text>
                                )}
                            </View>
                        )}
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.login')}</Text>
                        )}
                    </TouchableOpacity>

                    {hasBiometrics && (
                        <TouchableOpacity
                            style={[styles.biometricButton, { borderColor: colors.primary }]}
                            onPress={handleBiometricLogin}
                            disabled={isLoading}
                        >
                            <Text style={[styles.biometricButtonText, { color: colors.primary }]}>
                                {t('auth.useFingerprint')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    logoText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    biometricButton: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    biometricButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
