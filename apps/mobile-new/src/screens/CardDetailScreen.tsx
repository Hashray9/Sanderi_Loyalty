import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, User, Wrench, Layers, PlusCircle, MinusCircle, Zap, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { api } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { SuccessOverlay } from '@/components/SuccessOverlay';
import { Toast } from '@/components/Toast';

interface CardData {
    cardUid: string;
    status: 'UNASSIGNED' | 'ACTIVE' | 'BLOCKED';
    hardwarePoints: number;
    plywoodPoints: number;
    holder: {
        name: string;
        mobileNumber: string;
    } | null;
    expiringPoints: {
        hardware: { points: number; expiresAt: string | null };
        plywood: { points: number; expiresAt: string | null };
    };
}

interface TransactionDetail {
    type: 'CREDIT' | 'DEBIT';
    category: 'HARDWARE' | 'PLYWOOD';
    points: number;
    memberName: string;
    transactionId: string;
    newBalance: number;
}

type Category = 'HARDWARE' | 'PLYWOOD';
type TransactionType = 'CREDIT' | 'DEBIT' | null;

export default function CardDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { cardUid } = route.params;
    const { t } = useTranslation();
    const { colorScheme } = useTheme();
    const { store } = useAuth();
    const { addAction } = useOfflineQueue();

    const [card, setCard] = useState<CardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cardNotFound, setCardNotFound] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [transactionType, setTransactionType] = useState<TransactionType>(null);
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [transactionDetail, setTransactionDetail] = useState<TransactionDetail | undefined>(undefined);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const fetchCard = useCallback(async () => {
        try {
            const response = await api.get(`/cards/${cardUid}/status`);
            setCard(response.data);
            setCardNotFound(false);
        } catch (error: any) {
            // If card not found (404), show not found screen
            if (error?.response?.status === 404 || error?.response?.data?.code === 'CARD_NOT_FOUND') {
                setCardNotFound(true);
            } else {
                Alert.alert(t('common.error'), t('card.fetchFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [cardUid, t]);

    useEffect(() => {
        fetchCard();
    }, [fetchCard]);

    useEffect(() => {
        if (card && card.status === 'UNASSIGNED') {
            navigation.navigate('Enroll', { cardUid });
        }
    }, [card, cardUid, navigation]);

    // If card not found, navigate to Enroll screen
    useEffect(() => {
        if (cardNotFound || (!isLoading && !card)) {
            navigation.replace('Enroll', { cardUid });
        }
    }, [cardNotFound, card, isLoading, cardUid, navigation]);

    const conversionRate = useCallback(
        (cat: Category) => {
            if (cat === 'HARDWARE') return store?.hardwareConversionRate || 100;
            return store?.plywoodConversionRate || 100;
        },
        [store]
    );

    const formatIndian = (num: string) => {
        const digits = num.replace(/\D/g, '');
        if (!digits) return '';
        const len = digits.length;
        if (len <= 3) return digits;
        let result = digits.slice(len - 3);
        let remaining = digits.slice(0, len - 3);
        while (remaining.length > 2) {
            result = remaining.slice(remaining.length - 2) + ',' + result;
            remaining = remaining.slice(0, remaining.length - 2);
        }
        if (remaining.length > 0) result = remaining + ',' + result;
        return result;
    };

    const handleAmountChange = (text: string) => {
        const raw = text.replace(/,/g, '');
        if (raw === '' || /^\d+$/.test(raw)) {
            setAmount(raw);
        }
    };

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        setTransactionType(null);
        setAmount('');
    };

    const handleTransactionTypeSelect = (type: TransactionType) => {
        setTransactionType(type);
        setAmount('');
    };

    const handleProcessTransaction = useCallback(async () => {
        if (!selectedCategory || !transactionType || !amount) {
            Alert.alert(t('common.error'), 'Please fill all fields');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Alert.alert(t('common.error'), 'Please enter a valid amount');
            return;
        }

        setIsProcessing(true);

        try {
            const entryId = uuidv4();
            let points: number;

            if (transactionType === 'CREDIT') {
                const rate = conversionRate(selectedCategory);
                points = Math.floor(numericAmount / rate);

                await addAction({
                    entryId,
                    actionType: 'CREDIT',
                    payload: {
                        cardUid: cardUid!,
                        category: selectedCategory,
                        amount: numericAmount,
                    },
                });
            } else {
                // DEBIT - amount is in points
                points = Math.floor(numericAmount);

                // Check if balance is sufficient
                const currentBalance = selectedCategory === 'HARDWARE' ? card!.hardwarePoints : card!.plywoodPoints;
                if (points > currentBalance) {
                    setToastMessage(t('card.cannotDebitMore', { points: currentBalance.toLocaleString() }));
                    setToastVisible(true);
                    setIsProcessing(false);
                    return;
                }

                await addAction({
                    entryId,
                    actionType: 'DEBIT',
                    payload: {
                        cardUid: cardUid!,
                        category: selectedCategory,
                        points,
                    },
                });
            }

            // Calculate new balance
            const currentBalance = selectedCategory === 'HARDWARE' ? card!.hardwarePoints : card!.plywoodPoints;
            const newBalance = transactionType === 'CREDIT' ? currentBalance + points : currentBalance - points;

            // Set transaction detail for success overlay
            setTransactionDetail({
                type: transactionType,
                category: selectedCategory,
                points,
                memberName: card!.holder!.name,
                transactionId: entryId.slice(-6).toUpperCase(),
                newBalance,
            });

            setShowSuccess(true);
            setAmount('');
            setTransactionType(null);
            setSelectedCategory(null);
        } catch {
            Alert.alert(t('common.error'), 'Transaction failed');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedCategory, transactionType, amount, conversionRate, addAction, cardUid, t, fetchCard]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.bgGradientTop} />
                <View style={styles.bgGradientBottom} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="rgba(255,255,255,0.9)" />
                </View>
            </View>
        );
    }

    // Return null while navigating to prevent rendering errors
    if (!card) {
        return null;
    }

    const isActive = card.status === 'ACTIVE';
    const isBlocked = card.status === 'BLOCKED';
    const tierName = card.holder ? 'PLATINUM' : 'UNASSIGNED';

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
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerSubtitle}>{t('card.transaction').toUpperCase()}</Text>
                            <Text style={styles.headerTitle}>{t('card.pointManager')}</Text>
                        </View>
                        <View style={styles.headerSpacer} />
                    </View>

                    {/* Member Info Card */}
                    {card.holder && (
                        <View style={styles.memberCard}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                style={styles.memberCardGradient}
                            >
                                <View style={styles.memberCardContent}>
                                    <View style={styles.avatarContainer}>
                                        <User size={16} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberLabel}>{t('card.member').toUpperCase()}</Text>
                                        <Text style={styles.memberName}>{card.holder.name}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.historyButton}
                                        onPress={() => navigation.navigate('History', { cardUid, holderName: card.holder?.name || 'Card Holder' })}
                                        activeOpacity={0.7}
                                    >
                                        <Clock size={18} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Category Selection */}
                    {isActive && (
                        <>
                            <Text style={styles.sectionLabel}>{t('card.selectCategory')}</Text>
                            <View style={styles.categoryGrid}>
                                {/* Hardware Card */}
                                <TouchableOpacity
                                    style={styles.categoryCard}
                                    onPress={() => handleCategorySelect('HARDWARE')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={
                                            selectedCategory === 'HARDWARE'
                                                ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']
                                                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']
                                        }
                                        style={[
                                            styles.categoryCardGradient,
                                            selectedCategory === 'HARDWARE' && styles.categoryCardGradientActive,
                                        ]}
                                    >
                                        <View style={styles.categoryCardHeader}>
                                            <Wrench size={20} color={selectedCategory === 'HARDWARE' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'} strokeWidth={1.5} />
                                            {selectedCategory === 'HARDWARE' && (
                                                <View style={styles.activeIndicator} />
                                            )}
                                        </View>
                                        <View style={styles.categoryCardFooter}>
                                            <Text style={[styles.categoryName, selectedCategory === 'HARDWARE' && styles.categoryNameActive]}>{t('points.hardware')}</Text>
                                            <View style={styles.pointsRow}>
                                                <Text style={[styles.pointsValue, selectedCategory === 'HARDWARE' && styles.pointsValueActive]}>
                                                    {card.hardwarePoints.toLocaleString()}
                                                </Text>
                                                <Text style={styles.pointsUnit}>PTS</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Plywood Card */}
                                <TouchableOpacity
                                    style={styles.categoryCard}
                                    onPress={() => handleCategorySelect('PLYWOOD')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={
                                            selectedCategory === 'PLYWOOD'
                                                ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)']
                                                : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']
                                        }
                                        style={[
                                            styles.categoryCardGradient,
                                            selectedCategory === 'PLYWOOD' && styles.categoryCardGradientActive,
                                        ]}
                                    >
                                        <View style={styles.categoryCardHeader}>
                                            <Layers size={20} color={selectedCategory === 'PLYWOOD' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'} strokeWidth={1.5} />
                                            {selectedCategory === 'PLYWOOD' && (
                                                <View style={styles.activeIndicator} />
                                            )}
                                        </View>
                                        <View style={styles.categoryCardFooter}>
                                            <Text style={[styles.categoryName, selectedCategory === 'PLYWOOD' && styles.categoryNameActive]}>{t('points.plywood')}</Text>
                                            <View style={styles.pointsRow}>
                                                <Text style={[styles.pointsValue, selectedCategory === 'PLYWOOD' && styles.pointsValueActive]}>
                                                    {card.plywoodPoints.toLocaleString()}
                                                </Text>
                                                <Text style={styles.pointsUnit}>PTS</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Credit/Debit Buttons */}
                    {selectedCategory && (
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200)}
                            exiting={FadeOutDown}
                            style={styles.actionButtonsContainer}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    transactionType === 'CREDIT' && styles.actionButtonCreditActive,
                                ]}
                                onPress={() => handleTransactionTypeSelect('CREDIT')}
                                activeOpacity={0.8}
                            >
                                <PlusCircle
                                    size={14}
                                    color={transactionType === 'CREDIT' ? '#10b981' : 'rgba(255,255,255,0.6)'}
                                    strokeWidth={2}
                                />
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        transactionType === 'CREDIT' && styles.actionButtonCreditText,
                                    ]}
                                >
                                    {t('card.credit').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    transactionType === 'DEBIT' && styles.actionButtonDebitActive,
                                ]}
                                onPress={() => handleTransactionTypeSelect('DEBIT')}
                                activeOpacity={0.8}
                            >
                                <MinusCircle
                                    size={14}
                                    color={transactionType === 'DEBIT' ? '#ef4444' : 'rgba(255,255,255,0.6)'}
                                    strokeWidth={2}
                                />
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        transactionType === 'DEBIT' && styles.actionButtonDebitText,
                                    ]}
                                >
                                    {t('card.debit').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Amount Input */}
                    {selectedCategory && transactionType && (
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200).delay(100)}
                            exiting={FadeOutDown}
                            style={styles.amountSection}
                        >
                            <Text style={styles.amountLabel}>
                                {transactionType === 'DEBIT' ? t('card.enterPoints') : t('card.enterAmount')}
                            </Text>
                            {transactionType === 'DEBIT' && amount && selectedCategory && (
                                <Text style={styles.equivalentText}>
                                    {t('card.equivalentAmount', {
                                        amount: formatIndian(String(parseInt(amount, 10) * conversionRate(selectedCategory))),
                                    })}
                                </Text>
                            )}
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0"
                                placeholderTextColor="rgba(255,255,255,0.05)"
                                keyboardType="numeric"
                                value={formatIndian(amount)}
                                onChangeText={handleAmountChange}
                                maxLength={15}
                            />
                            <View style={styles.amountUnderline} />
                        </Animated.View>
                    )}
                </ScrollView>

                {/* Process Transaction Button */}
                {selectedCategory && transactionType && amount && (
                    <Animated.View
                        entering={FadeInDown.springify().damping(20).stiffness(200).delay(200)}
                        exiting={FadeOutDown}
                        style={styles.bottomSection}
                    >
                        <TouchableOpacity
                            style={styles.processButton}
                            onPress={handleProcessTransaction}
                            disabled={isProcessing}
                            activeOpacity={0.9}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="#000" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.processButtonText}>{t('card.processTransaction').toUpperCase()}</Text>
                                    <Zap size={18} color="#000" strokeWidth={2.5} />
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </SafeAreaView>

            {/* Success overlay */}
            <SuccessOverlay
                visible={showSuccess}
                transaction={transactionDetail}
                onDismiss={() => {
                    setShowSuccess(false);
                    fetchCard();
                }}
            />

            {/* Toast notification */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type="error"
                onHide={() => setToastVisible(false)}
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
        right: '-10%',
        width: '60%',
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 999,
        transform: [{ scale: 1.5 }],
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
        transform: [{ scale: 1.5 }],
        opacity: 0.3,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 28,
        paddingTop: 0,
        paddingBottom: 200,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        marginBottom: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 6.4,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'sans-serif',
    },
    headerSpacer: {
        width: 40,
    },
    memberCard: {
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    memberCardGradient: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 20,
    },
    memberCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(31,41,55,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberInfo: {
        flex: 1,
    },
    memberLabel: {
        fontSize: 10,
        letterSpacing: 2.4,
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 1.2,
    },
    historyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6b7280',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
        marginBottom: 24,
        marginLeft: 4,
    },
    categoryGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 40,
    },
    categoryCard: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 24,
        backgroundColor: 'transparent',
    },
    categoryCardActive: {},
    categoryCardGradientActive: {
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 2,
    },
    categoryCardGradient: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 24,
        padding: 24,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    categoryCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    categoryCardFooter: {},
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    categoryNameActive: {
        color: '#fff',
        fontWeight: '600' as const,
    },
    pointsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    pointsValue: {
        fontSize: 20,
        fontFamily: 'serif',
        color: '#fff',
    },
    pointsValueActive: {
        color: '#fff',
        fontWeight: '700' as const,
    },
    pointsUnit: {
        fontSize: 9,
        color: '#6b7280',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 40,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    actionButtonCreditActive: {
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderColor: '#10b981',
        borderWidth: 1.5,
    },
    actionButtonDebitActive: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderColor: '#ef4444',
        borderWidth: 1.5,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
    },
    actionButtonCreditText: {
        color: '#10b981',
    },
    actionButtonDebitText: {
        color: '#ef4444',
    },
    amountSection: {
        paddingTop: 16,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9ca3af',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    amountInput: {
        width: '100%',
        fontSize: 48,
        fontFamily: 'serif',
        letterSpacing: 4,
        color: '#fff',
        textAlign: 'center',
        paddingVertical: 16,
        paddingHorizontal: 0,
    },
    amountUnderline: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    equivalentText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        letterSpacing: 1,
    },
    bottomSection: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    processButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    processButtonText: {
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
    notFoundContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    notFoundTitle: {
        fontSize: 20,
        fontStyle: 'italic',
        color: '#fff',
        fontFamily: 'serif',
        marginBottom: 12,
        textAlign: 'center',
    },
    notFoundMessage: {
        fontSize: 14,
        color: '#6b7280',
        letterSpacing: 1.2,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    goBackButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 0,
    },
    goBackButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
});
