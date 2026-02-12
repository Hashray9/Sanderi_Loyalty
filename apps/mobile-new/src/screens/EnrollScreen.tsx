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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { X, Search, AlertCircle, Nfc, ArrowRight } from 'lucide-react-native';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { v4 as uuidv4 } from 'uuid';

const enrollSchema = z.object({
    customerName: z.string().min(2, 'Name must be at least 2 characters'),
    customerMobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
});

type EnrollForm = z.infer<typeof enrollSchema>;

export default function EnrollScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { cardUid } = route.params;
    const { t } = useTranslation();
    const { addAction } = useOfflineQueue();

    const [isLoading, setIsLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<EnrollForm>({
        resolver: zodResolver(enrollSchema),
        defaultValues: {
            customerName: '',
            customerMobile: '',
        },
    });

    const onSubmit = async (data: EnrollForm) => {
        setIsLoading(true);
        try {
            await addAction({
                entryId: uuidv4(),
                actionType: 'ENROLL',
                payload: {
                    cardUid: cardUid!,
                    customerName: data.customerName,
                    customerMobile: data.customerMobile,
                },
            });

            Alert.alert('Success', 'Member enrolled successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Scan'),
                },
            ]);
        } catch {
            Alert.alert(t('common.error'), 'Failed to enroll member');
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
                        <View style={styles.entryErrorBadge}>
                            <AlertCircle size={14} color="#ef4444" strokeWidth={2} />
                            <Text style={styles.entryErrorText}>ENTRY ERROR</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={() => navigation.navigate('Lookup')}
                                activeOpacity={0.7}
                            >
                                <Search size={20} color="#fff" strokeWidth={1.5} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <X size={20} color="rgba(156,163,175,1)" strokeWidth={1.5} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Card Not Found</Text>
                        <Text style={styles.subtitle}>REGISTER NEW MEMBER CREDENTIALS</Text>
                    </View>

                    {/* Card display */}
                    <View style={styles.cardPerspective}>
                        <View style={styles.card3D}>
                            <LinearGradient
                                colors={['#111111', '#050505']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                {/* Glow overlay */}
                                <View style={styles.cardGlowOverlay} />

                                {/* Card header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.chipContainer} />
                                    <Nfc size={30} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
                                </View>

                                {/* Card footer */}
                                <View style={styles.cardFooter}>
                                    <Text style={styles.chipLabel}>CHIP ID DETECTED</Text>
                                    <Text style={styles.chipId}>ID: {cardUid}</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Form inputs */}
                    <View style={styles.formSection}>
                        <Controller
                            control={control}
                            name="customerName"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>FULL NAME</Text>
                                    <TextInput
                                        style={[styles.input, errors.customerName && styles.inputError]}
                                        placeholder="Enter member name"
                                        placeholderTextColor="rgba(255,255,255,0.12)"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        editable={!isLoading}
                                        autoCapitalize="words"
                                    />
                                    {errors.customerName && (
                                        <Text style={styles.errorText}>{errors.customerName.message}</Text>
                                    )}
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="customerMobile"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                                    <TextInput
                                        style={[styles.input, errors.customerMobile && styles.inputError]}
                                        placeholder="+1 (000) 000-0000"
                                        placeholderTextColor="rgba(255,255,255,0.12)"
                                        keyboardType="phone-pad"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        editable={!isLoading}
                                        maxLength={15}
                                    />
                                    {errors.customerMobile && (
                                        <Text style={styles.errorText}>{errors.customerMobile.message}</Text>
                                    )}
                                </View>
                            )}
                        />
                    </View>

                    {/* Footer with Enroll button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.enrollButton}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isLoading}
                            activeOpacity={0.9}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <Text style={styles.enrollButtonText}>ENROLL MEMBER</Text>
                                    <View style={styles.enrollButtonArrow}>
                                        <View style={styles.arrowLine} />
                                        <ArrowRight size={18} color="#000" strokeWidth={2.5} />
                                    </View>
                                </>
                            )}
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
        right: '-10%',
        width: '70%',
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 999,
        opacity: 1,
    },
    bgGradientBottom: {
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '60%',
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 999,
        opacity: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 8,
        marginBottom: 32,
    },
    entryErrorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    entryErrorText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(156,163,175,1)',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(255,255,255,0.4)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        fontFamily: 'serif',
        color: '#f5f5f5',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '300',
        color: '#6b7280',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
    },
    cardPerspective: {
        height: 192,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 48,
    },
    card3D: {
        width: 320,
        height: 192,
        borderRadius: 20,
        overflow: 'hidden',
        transform: [
            { perspective: 1200 },
            { rotateX: '15deg' },
            { rotateY: '-10deg' },
        ],
        shadowColor: '#000',
        shadowOffset: { width: -20, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
        elevation: 20,
    },
    cardGradient: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 24,
        justifyContent: 'space-between',
        position: 'relative',
    },
    cardGlowOverlay: {
        position: 'absolute',
        top: -64,
        right: -64,
        width: 128,
        height: 128,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 64,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
    },
    chipContainer: {
        width: 48,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(55,65,81,1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        opacity: 0.4,
    },
    cardFooter: {
        zIndex: 10,
    },
    chipLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
        fontFamily: 'monospace',
        letterSpacing: 3.2,
        marginBottom: 4,
        opacity: 0.6,
    },
    chipId: {
        fontSize: 18,
        fontWeight: '500',
        color: '#fff',
        fontFamily: 'monospace',
        letterSpacing: 2.4,
        textShadowColor: 'rgba(255,255,255,0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    formSection: {
        paddingHorizontal: 40,
        gap: 32,
        marginBottom: 48,
    },
    inputContainer: {
        gap: 4,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#6b7280',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    input: {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(107,114,128,0.3)',
        color: '#fff',
        fontSize: 18,
        fontWeight: '300',
        paddingVertical: 12,
        paddingHorizontal: 0,
    },
    inputError: {
        borderBottomColor: '#ef4444',
    },
    errorText: {
        fontSize: 11,
        color: '#ef4444',
        marginTop: 4,
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 28,
        paddingBottom: 24,
    },
    enrollButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
    },
    enrollButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 2.2,
    },
    enrollButtonArrow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    arrowLine: {
        width: 36,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
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
