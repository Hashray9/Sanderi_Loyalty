import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeOut,
    ZoomIn,
    SlideInDown,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { useTranslation } from 'react-i18next';

interface TransactionDetail {
    type: 'CREDIT' | 'DEBIT';
    category: 'HARDWARE' | 'PLYWOOD';
    points: number;
    memberName: string;
    transactionId: string;
    newBalance: number;
}

interface SuccessOverlayProps {
    visible: boolean;
    transaction?: TransactionDetail;
    onDismiss: () => void;
}

export function SuccessOverlay({ visible, transaction, onDismiss }: SuccessOverlayProps) {
    const { t } = useTranslation();

    useEffect(() => {
        if (visible) {
            HapticFeedback.trigger('notificationSuccess');
        }
    }, [visible]);

    if (!visible || !transaction) return null;

    const isCredit = transaction.type === 'CREDIT';
    const pointsColor = isCredit ? '#10b981' : '#ef4444';
    const sign = isCredit ? '+' : '-';

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.overlay}
        >
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            {/* Background gradients */}
            <View style={styles.bgGradientTop} />
            <View style={styles.bgGradientBottom} />
            <View style={styles.bgGradientCenter} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onDismiss}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color="#fff" strokeWidth={1.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('success.transactionStatus').toUpperCase()}</Text>
                    <View style={styles.headerSpacer} />
                </View>

            {/* Main content */}
            <View style={styles.mainContent}>
                {/* Success checkmark */}
                <Animated.View
                    entering={ZoomIn.springify().stiffness(150).damping(15).delay(100)}
                    style={styles.checkmarkContainer}
                >
                    <View style={styles.checkmarkGlow} />
                    <View style={[styles.particle, { top: '10%', left: '20%' }]} />
                    <View style={[styles.particle, { top: '80%', left: '80%' }]} />
                    <View style={[styles.particle, { top: '40%', left: '90%' }]} />
                    <View style={[styles.particle, { top: '70%', left: '10%' }]} />
                    <View style={styles.checkmarkCircle}>
                        <Check size={48} color="#10b981" strokeWidth={3} />
                    </View>
                </Animated.View>

                {/* Success title */}
                <Animated.Text
                    entering={SlideInDown.delay(200).springify()}
                    style={styles.successTitle}
                >
                    {t('success.transactionSuccessful')}
                </Animated.Text>

                {/* Transaction details card */}
                <Animated.View
                    entering={SlideInDown.delay(300).springify()}
                    style={styles.detailsCard}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                        style={styles.detailsGradient}
                    >
                        {/* Transaction details header */}
                        <View style={styles.detailsHeader}>
                            <Text style={styles.detailsHeaderText}>{t('success.transactionDetails').toUpperCase()}</Text>
                        </View>

                        {/* Points change */}
                        <View style={styles.pointsSection}>
                            <Text style={[styles.pointsValue, { color: pointsColor }]}>
                                {sign}{transaction.points} PTS
                            </Text>
                            <Text style={styles.pointsLabel}>
                                {isCredit ? t('success.creditedTo') : t('success.debitedFrom')} {transaction.category === 'HARDWARE' ? t('points.hardware') : t('points.plywood')}
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Transaction info */}
                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('card.member').toUpperCase()}</Text>
                                <Text style={styles.infoValue}>{transaction.memberName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('success.transactionId').toUpperCase()}</Text>
                                <Text style={styles.infoValue}>#{transaction.transactionId}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('success.newBalance').toUpperCase()}</Text>
                                <View style={styles.balanceContainer}>
                                    <Text style={styles.balanceValue}>{transaction.newBalance.toLocaleString()}</Text>
                                    <Text style={styles.balanceUnit}>PTS</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>

                {/* Done button */}
                <Animated.View
                    entering={SlideInDown.delay(400).springify()}
                    style={styles.footer}
                >
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={onDismiss}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.doneButtonText}>{t('card.done').toUpperCase()}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>

            {/* Bottom gradient fade */}
            <View style={styles.bottomGradientFade} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 100,
    },
    safeArea: {
        flex: 1,
    },
    bgGradientTop: {
        position: 'absolute',
        top: '-5%',
        right: '-10%',
        width: '60%',
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 999,
        opacity: 0.3,
    },
    bgGradientBottom: {
        position: 'absolute',
        bottom: '20%',
        left: '-10%',
        width: '50%',
        height: '30%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 999,
        opacity: 0.3,
    },
    bgGradientCenter: {
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '40%',
        height: '40%',
        backgroundColor: 'rgba(16,185,129,0.02)',
        borderRadius: 999,
        opacity: 0.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
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
        fontSize: 9,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 4,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    headerSpacer: {
        width: 40,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    checkmarkContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    checkmarkGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(16,185,129,0.2)',
    },
    particle: {
        position: 'absolute',
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(229,229,229,0.3)',
    },
    checkmarkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 12,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#e5e5e5',
        fontFamily: 'serif',
        marginBottom: 32,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    detailsCard: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
    },
    detailsGradient: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 32,
    },
    detailsHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    detailsHeaderText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    pointsSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    pointsValue: {
        fontSize: 48,
        fontWeight: '700',
        fontFamily: 'serif',
        marginBottom: 8,
    },
    pointsLabel: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'serif',
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 32,
    },
    infoSection: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6b7280',
        letterSpacing: 2.4,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    balanceValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        fontFamily: 'serif',
    },
    balanceUnit: {
        fontSize: 9,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    footer: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    doneButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 4.8,
        textTransform: 'uppercase',
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
