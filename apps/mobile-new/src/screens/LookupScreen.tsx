import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Nfc, ArrowRight, ShieldOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import { BlockConfirmDialog } from '@/components/BlockConfirmDialog';

interface CustomerResult {
    cardUid: string;
    name: string;
    mobileNumber: string;
    cardStatus: string;
    hardwarePoints: number;
    plywoodPoints: number;
}

// Helper function to format phone number for display (masked)
const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 3)} ••• ${cleaned.slice(-2)}`;
    }
    return phone;
};

// Helper function to format input as user types (10 digits with spaces - 5 5 format)
const formatPhoneInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

export default function LookupScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { colorScheme } = useTheme();
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CustomerResult | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

    const handleMobileChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setMobile(formatPhoneInput(cleaned));
        }
    };

    const handleSearch = async () => {
        const cleaned = mobile.replace(/\D/g, '');
        if (cleaned.length !== 10) {
            Alert.alert(t('common.error'), 'Please enter a valid 10-digit mobile number');
            return;
        }

        setIsLoading(true);
        setResult(null);
        setNotFound(false);

        try {
            const response = await api.get('/customers/search', {
                params: { mobile: cleaned },
            });

            if (response.data.found) {
                setResult(response.data.customer);
            } else {
                setNotFound(true);
            }
        } catch {
            Alert.alert(t('common.error'), t('lookup.searchFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewCard = () => {
        if (result) {
            navigation.navigate('Card', { cardUid: result.cardUid });
        }
    };

    const handleBlockCard = async () => {
        if (!result) return;

        setIsBlocking(true);
        try {
            await api.post(`/cards/${result.cardUid}/block`, {
                reason: 'OTHER',
            });

            setShowBlockConfirm(false);
            setResult({ ...result, cardStatus: 'BLOCKED' });
            Alert.alert('Success', t('block.success'));
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to block card';
            Alert.alert(t('common.error'), message);
        } finally {
            setIsBlocking(false);
        }
    };

    const totalPoints = result ? result.hardwarePoints + result.plywoodPoints : 0;
    const tierName = totalPoints >= 10000 ? 'PLATINUM TIER' : totalPoints >= 5000 ? 'GOLD TIER' : 'SILVER TIER';
    const statusText = result?.cardStatus === 'ACTIVE' ? 'Active'
        : result?.cardStatus === 'BLOCKED' ? 'Blocked'
        : result?.cardStatus === 'TRANSFERRED' ? 'Transferred'
        : result?.cardStatus || '';

    return (
        <View style={styles.container}>
            {/* Background gradients */}
            <View style={styles.bgGradientTop} />
            <View style={styles.bgGradientBottom} />

            <SafeAreaView style={styles.flex}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={24} color="#fff" strokeWidth={1.5} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Search Member</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchSection}>
                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="00000 00000"
                                placeholderTextColor="rgba(255,255,255,0.1)"
                                keyboardType="phone-pad"
                                value={mobile}
                                onChangeText={handleMobileChange}
                                maxLength={11}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="rgba(255,255,255,0.9)" size="small" />
                            ) : (
                                <Text style={styles.searchButtonText}>Search Member</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Result Card Area */}
                    <View style={styles.cardArea}>
                        {result && (
                            <Animated.View
                                entering={FadeInDown.springify().damping(20).stiffness(200)}
                                exiting={FadeOutDown}
                                style={styles.memberCard}
                            >
                                <LinearGradient
                                    colors={['#1A1A1A', '#050505']}
                                    style={styles.cardGradient}
                                >
                                    {/* Card shine overlay */}
                                    <LinearGradient
                                        colors={['transparent', 'rgba(255,255,255,0.02)', 'transparent']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.cardShine}
                                    />

                                    {/* Card Header */}
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.statusLabel}>Status</Text>
                                            <Text style={[
                                                styles.statusValue,
                                                result.cardStatus !== 'ACTIVE' && styles.statusValueInactive,
                                            ]}>{statusText}</Text>
                                        </View>
                                        <View style={styles.nfcIconContainer}>
                                            <Nfc size={12} color="#9ca3af" strokeWidth={1.5} />
                                        </View>
                                    </View>

                                    {/* Card Body */}
                                    <View style={styles.cardBody}>
                                        <Text style={styles.memberName}>{result.name}</Text>
                                        <Text style={styles.memberPhone}>
                                            {formatPhoneNumber(result.mobileNumber)}
                                        </Text>
                                    </View>

                                    {/* Card Footer - Points by Category */}
                                    <View style={styles.cardFooter}>
                                        <View style={styles.categoryPoints}>
                                            <Text style={styles.footerLabel}>Hardware</Text>
                                            <Text style={styles.categoryPointsValue}>
                                                {result.hardwarePoints.toLocaleString()}{' '}
                                                <Text style={styles.pointsUnit}>pts</Text>
                                            </Text>
                                        </View>
                                        <View style={styles.categoryPoints}>
                                            <Text style={styles.footerLabel}>Plywood</Text>
                                            <Text style={styles.categoryPointsValue}>
                                                {result.plywoodPoints.toLocaleString()}{' '}
                                                <Text style={styles.pointsUnit}>pts</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        )}

                        {notFound && (
                            <Animated.View
                                entering={FadeInDown.springify().damping(20).stiffness(200)}
                                exiting={FadeOutDown}
                                style={styles.emptyState}
                            >
                                <Text style={styles.emptyText}>No member found</Text>
                                <Text style={styles.emptyHint}>Please check the mobile number</Text>
                            </Animated.View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    {result && (
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200).delay(100)}
                            exiting={FadeOutDown}
                            style={styles.bottomAction}
                        >
                            {result.cardStatus === 'ACTIVE' && (
                                <TouchableOpacity
                                    style={styles.transactionButton}
                                    onPress={handleViewCard}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.transactionButtonText}>Make Transactions</Text>
                                    <View style={styles.transactionButtonArrow}>
                                        <View style={styles.arrowLine} />
                                        <ArrowRight size={18} color="#000" strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {result.cardStatus === 'ACTIVE' && (
                                <TouchableOpacity
                                    style={styles.blockButton}
                                    onPress={() => setShowBlockConfirm(true)}
                                    activeOpacity={0.8}
                                >
                                    <ShieldOff size={16} color="#ef4444" strokeWidth={2} />
                                    <Text style={styles.blockButtonText}>{t('block.warningTitle').toUpperCase()}</Text>
                                </TouchableOpacity>
                            )}

                            {(result.cardStatus === 'BLOCKED' || result.cardStatus === 'TRANSFERRED') && (
                                <View style={styles.blockedBanner}>
                                    <ShieldOff size={16} color="#6b7280" strokeWidth={1.5} />
                                    <Text style={styles.blockedBannerText}>
                                        {result.cardStatus === 'TRANSFERRED' ? 'CARD TRANSFERRED' : 'CARD BLOCKED'}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Block confirmation dialog */}
            <BlockConfirmDialog
                visible={showBlockConfirm}
                onConfirm={handleBlockCard}
                onCancel={() => setShowBlockConfirm(false)}
                isLoading={isBlocking}
            />

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
    flex: {
        flex: 1,
    },
    bgGradientTop: {
        position: 'absolute',
        top: '-5%',
        left: '-20%',
        width: '80%',
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 999,
        transform: [{ scale: 1.5 }],
        opacity: 0.3,
    },
    bgGradientBottom: {
        position: 'absolute',
        bottom: '-10%',
        right: '-20%',
        width: '80%',
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 999,
        transform: [{ scale: 1.5 }],
        opacity: 0.3,
    },
    scrollContent: {
        paddingHorizontal: 28,
        paddingTop: 0,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        marginBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 11,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 4.8,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    headerSpacer: {
        width: 40,
    },
    searchSection: {
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
        marginBottom: 16,
        marginLeft: 4,
    },
    inputWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        marginBottom: 32,
    },
    input: {
        fontSize: 24,
        fontFamily: 'serif',
        letterSpacing: 8,
        color: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 0,
    },
    searchButton: {
        position: 'relative',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    searchButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 280,
    },
    memberCard: {
        width: '100%',
        maxWidth: 340,
        aspectRatio: 1.6,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 60,
        elevation: 18,
    },
    cardGradient: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 24,
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
    statusLabel: {
        fontSize: 8,
        letterSpacing: 3.2,
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 12,
        letterSpacing: 4.8,
        color: '#10b981',
        fontWeight: '600',
    },
    statusValueInactive: {
        color: '#ef4444',
    },
    nfcIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        zIndex: 10,
    },
    memberName: {
        fontSize: 18,
        fontFamily: 'serif',
        color: '#fff',
        marginBottom: 2,
    },
    memberPhone: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: '#6b7280',
        letterSpacing: 2.4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        zIndex: 10,
        gap: 16,
    },
    categoryPoints: {
        flex: 1,
    },
    footerLabel: {
        fontSize: 8,
        letterSpacing: 3.2,
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    categoryPointsValue: {
        fontSize: 16,
        fontFamily: 'serif',
        color: '#fff',
    },
    pointsUnit: {
        fontSize: 9,
        color: '#6b7280',
        fontStyle: 'italic',
        fontFamily: 'sans-serif',
        textTransform: 'uppercase',
        marginLeft: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#fff',
        fontFamily: 'serif',
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 11,
        letterSpacing: 2,
        color: '#6b7280',
        fontWeight: '500',
    },
    bottomAction: {
        marginTop: 32,
        gap: 16,
    },
    transactionButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
    },
    transactionButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    transactionButtonArrow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    arrowLine: {
        width: 32,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    blockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 52,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
    },
    blockButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ef4444',
        letterSpacing: 4,
    },
    blockedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 52,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    blockedBannerText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 4,
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
