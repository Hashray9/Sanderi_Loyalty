import { useState, useMemo } from 'react';
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

const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 3)} ••• ${cleaned.slice(-2)}`;
    }
    return phone;
};

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
        flex: {
            flex: 1,
        },
        bgGradientTop: {
            position: 'absolute',
            top: '-5%',
            left: '-20%',
            width: '80%',
            height: '50%',
            backgroundColor: colors.surface1,
            borderRadius: radius.full,
            transform: [{ scale: 1.5 }],
            opacity: 0.3,
        },
        bgGradientBottom: {
            position: 'absolute',
            bottom: '-10%',
            right: '-20%',
            width: '80%',
            height: '50%',
            backgroundColor: colors.surface1,
            borderRadius: radius.full,
            transform: [{ scale: 1.5 }],
            opacity: 0.3,
        },
        scrollContent: {
            paddingHorizontal: sp['3xl'],
            paddingTop: 0,
            paddingBottom: 100,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: sp.lg,
            marginBottom: sp['5xl'],
        },
        backButton: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -8,
        },
        headerTitle: {
            fontSize: typo.fontSize.label,
            fontWeight: typo.fontWeight.medium,
            color: colors.textHigh,
            letterSpacing: typo.letterSpacing.heading,
            textAlign: 'center',
            textTransform: 'uppercase',
        },
        headerSpacer: {
            width: 40,
        },
        searchSection: {
            marginBottom: sp['4xl'],
        },
        inputLabel: {
            fontSize: typo.fontSize.sm,
            fontWeight: typo.fontWeight.semibold,
            color: colors.textSecondary,
            letterSpacing: typo.letterSpacing.button,
            textTransform: 'uppercase',
            marginBottom: sp.lg,
            marginLeft: sp.xs,
        },
        inputWrapper: {
            borderBottomWidth: 1,
            borderBottomColor: colors.borderProminent,
            marginBottom: sp['4xl'],
        },
        input: {
            fontSize: typo.fontSize['4xl'],
            fontFamily: typo.fontFamily.serif,
            letterSpacing: typo.letterSpacing.phone,
            color: colors.text,
            paddingVertical: sp.lg,
            paddingHorizontal: 0,
        },
        searchButton: {
            position: 'relative',
            backgroundColor: colors.surface3,
            borderWidth: 1,
            borderColor: colors.borderMedium,
            paddingVertical: sp.xl,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        searchButtonText: {
            fontSize: typo.fontSize.label,
            fontWeight: typo.fontWeight.bold,
            color: colors.textHigh,
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
            borderRadius: radius['2xl'],
            overflow: 'hidden',
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 60,
            elevation: 18,
        },
        cardGradient: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.borderMedium,
            borderRadius: radius['2xl'],
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
        statusLabel: {
            fontSize: typo.fontSize.nano,
            letterSpacing: typo.letterSpacing.button,
            color: colors.textSecondary,
            fontWeight: typo.fontWeight.medium,
            textTransform: 'uppercase',
            marginBottom: sp.xs,
        },
        statusValue: {
            fontSize: typo.fontSize.body,
            letterSpacing: typo.letterSpacing.heading,
            color: colors.success,
            fontWeight: typo.fontWeight.semibold,
        },
        statusValueInactive: {
            color: colors.error,
        },
        nfcIconContainer: {
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.borderMedium,
            backgroundColor: colors.surface3,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardBody: {
            zIndex: 10,
        },
        memberName: {
            fontSize: typo.fontSize['2xl'],
            fontFamily: typo.fontFamily.serif,
            color: colors.text,
            marginBottom: 2,
        },
        memberPhone: {
            fontSize: typo.fontSize.sm,
            fontFamily: typo.fontFamily.mono,
            color: colors.textSecondary,
            letterSpacing: typo.letterSpacing.wider,
        },
        cardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: sp.lg,
            borderTopWidth: 1,
            borderTopColor: colors.surface3,
            zIndex: 10,
            gap: sp.lg,
        },
        categoryPoints: {
            flex: 1,
        },
        footerLabel: {
            fontSize: typo.fontSize.nano,
            letterSpacing: typo.letterSpacing.button,
            color: colors.textSecondary,
            fontWeight: typo.fontWeight.medium,
            textTransform: 'uppercase',
            marginBottom: 2,
        },
        categoryPointsValue: {
            fontSize: typo.fontSize.xl,
            fontFamily: typo.fontFamily.serif,
            color: colors.text,
        },
        pointsUnit: {
            fontSize: typo.fontSize.xs,
            color: colors.textSecondary,
            fontStyle: 'italic',
            fontFamily: typo.fontFamily.sans,
            textTransform: 'uppercase',
            marginLeft: 2,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: sp['5xl'],
        },
        emptyText: {
            fontSize: typo.fontSize.xl,
            fontStyle: 'italic',
            color: colors.text,
            fontFamily: typo.fontFamily.serif,
            marginBottom: sp.sm,
        },
        emptyHint: {
            fontSize: typo.fontSize.label,
            letterSpacing: 2,
            color: colors.textSecondary,
            fontWeight: typo.fontWeight.medium,
        },
        bottomAction: {
            marginTop: sp['4xl'],
            gap: sp.lg,
        },
        transactionButton: {
            backgroundColor: colors.buttonPrimary,
            height: btn.primaryHeight,
            borderRadius: btn.primaryBorderRadius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: sp['3xl'],
        },
        transactionButtonText: {
            fontSize: typo.fontSize.label,
            fontWeight: typo.fontWeight.bold,
            color: colors.buttonPrimaryText,
            letterSpacing: 4,
            textTransform: 'uppercase',
        },
        transactionButtonArrow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: sp.md,
        },
        arrowLine: {
            width: 32,
            height: 1,
            backgroundColor: colors.buttonArrowLine,
        },
        blockButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 52,
            borderRadius: radius.none,
            borderWidth: 1,
            borderColor: colors.errorBorder,
            backgroundColor: colors.errorLight,
        },
        blockButtonText: {
            fontSize: typo.fontSize.label,
            fontWeight: typo.fontWeight.bold,
            color: colors.error,
            letterSpacing: 4,
        },
        blockedBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 52,
            borderRadius: radius.none,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface2,
        },
        blockedBannerText: {
            fontSize: typo.fontSize.label,
            fontWeight: typo.fontWeight.bold,
            color: colors.textSecondary,
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

function useStyles() {
    const { colors, typography, spacing, borderRadius, buttons } = useTheme();
    return useMemo(
        () => createStyles(colors, typography, spacing, borderRadius, buttons),
        [colors, typography, spacing, borderRadius, buttons],
    );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LookupScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const styles = useStyles();
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
                            <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
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
                                placeholderTextColor={colors.borderMedium}
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
                                <ActivityIndicator color={colors.textHigh} size="small" />
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
                                    colors={[colors.card, colors.cardDark]}
                                    style={styles.cardGradient}
                                >
                                    {/* Card shine overlay */}
                                    <LinearGradient
                                        colors={['transparent', colors.surface1, 'transparent']}
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
                                            <Nfc size={12} color={colors.textSubtle} strokeWidth={1.5} />
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
                                        <ArrowRight size={18} color={colors.buttonPrimaryText} strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {result.cardStatus === 'ACTIVE' && (
                                <TouchableOpacity
                                    style={styles.blockButton}
                                    onPress={() => setShowBlockConfirm(true)}
                                    activeOpacity={0.8}
                                >
                                    <ShieldOff size={16} color={colors.error} strokeWidth={2} />
                                    <Text style={styles.blockButtonText}>{t('block.warningTitle').toUpperCase()}</Text>
                                </TouchableOpacity>
                            )}

                            {(result.cardStatus === 'BLOCKED' || result.cardStatus === 'TRANSFERRED') && (
                                <View style={styles.blockedBanner}>
                                    <ShieldOff size={16} color={colors.textSecondary} strokeWidth={1.5} />
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
