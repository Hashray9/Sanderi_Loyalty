import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { X, PlusCircle, MinusCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { api } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { CategoryCard } from '@/components/CategoryCard';
import { AmountInput } from '@/components/AmountInput';
import { CardBottomBar } from '@/components/CardBottomBar';
import { SuccessOverlay } from '@/components/SuccessOverlay';
import { BlockConfirmDialog } from '@/components/BlockConfirmDialog';

const DARK_GRADIENT = ['#050505', '#1c150e', '#18101e', '#0a0a0a'];
const LIGHT_GRADIENT = ['#faf8f5', '#f5ede4', '#f0eaf2', '#f8f6f4'];

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

type Category = 'HARDWARE' | 'PLYWOOD';
type Mode = 'idle' | 'credit' | 'debit';

export default function CardDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { cardUid } = route.params;
    const { t } = useTranslation();
    const { colorScheme } = useTheme();
    const { store } = useAuth();
    const { addAction } = useOfflineQueue();

    const isDark = colorScheme === 'dark';

    const [card, setCard] = useState<CardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cardNotFound, setCardNotFound] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [mode, setMode] = useState<Mode>('idle');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

    const textPrimary = isDark ? '#f5f0eb' : '#1a1510';
    const textSecondary = isDark ? '#8a7e72' : '#7a6e62';

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

    const conversionRate = useCallback(
        (cat: Category) => {
            if (cat === 'HARDWARE') return store?.hardwareConversionRate || 100;
            return store?.plywoodConversionRate || 100;
        },
        [store]
    );

    const handleCreditDone = useCallback(
        async (amount: number) => {
            if (!selectedCategory) return;

            const rate = conversionRate(selectedCategory);
            const points = Math.floor(amount / rate);

            try {
                await addAction({
                    entryId: uuidv4(),
                    actionType: 'CREDIT',
                    payload: {
                        cardUid: cardUid!,
                        category: selectedCategory,
                        amount,
                    },
                });

                setMode('idle');
                setSelectedCategory(null);
                setSuccessMessage(t('credit.successMessage', { points }));
                setShowSuccess(true);
                setTimeout(fetchCard, 1600);
            } catch {
                Alert.alert(t('common.error'), t('credit.failed'));
            }
        },
        [selectedCategory, conversionRate, addAction, cardUid, t, fetchCard]
    );

    const handleDebitDone = useCallback(
        async (points: number) => {
            if (!selectedCategory) return;

            try {
                await addAction({
                    entryId: uuidv4(),
                    actionType: 'DEBIT',
                    payload: {
                        cardUid: cardUid!,
                        category: selectedCategory,
                        points,
                    },
                });

                setMode('idle');
                setSelectedCategory(null);
                setSuccessMessage(t('debit.successMessage', { points }));
                setShowSuccess(true);
                setTimeout(fetchCard, 1600);
            } catch {
                Alert.alert(t('common.error'), t('debit.failed'));
            }
        },
        [selectedCategory, addAction, cardUid, t, fetchCard]
    );

    const handleBlock = useCallback(async () => {
        setIsBlocking(true);
        try {
            await addAction({
                entryId: uuidv4(),
                actionType: 'BLOCK',
                payload: {
                    cardUid: cardUid!,
                    reason: 'OTHER',
                },
            });

            setShowBlockDialog(false);
            setSuccessMessage(t('block.successMessage'));
            setShowSuccess(true);
            setTimeout(() => navigation.goBack(), 1600);
        } catch {
            Alert.alert(t('common.error'), t('block.failed'));
        } finally {
            setIsBlocking(false);
        }
    }, [addAction, cardUid, t, navigation]);

    if (isLoading) {
        return (
            <LinearGradient
                colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
                locations={[0, 0.35, 0.65, 1]}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color="#FA0011" />
            </LinearGradient>
        );
    }

    if (cardNotFound) {
        return (
            <LinearGradient
                colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
                locations={[0, 0.35, 0.65, 1]}
                style={styles.container}
            >
                <SafeAreaView style={styles.notFoundContainer}>
                    <View style={styles.notFoundContent}>
                        <Text style={[styles.notFoundTitle, { color: textPrimary }]}>
                            {t('card.notFound')}
                        </Text>
                        <Text style={[styles.notFoundMessage, { color: textSecondary }]}>
                            {t('card.notFoundMessage')}
                        </Text>
                        <Text style={[styles.cardUidText, { color: textSecondary }]}>
                            Card UID: {cardUid}
                        </Text>

                        <TouchableOpacity
                            style={styles.enrollButtonWrapper}
                            onPress={() => navigation.navigate('Enroll', { cardUid })}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#FA0011', '#c5000d']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.enrollButton}
                            >
                                <PlusCircle size={24} color="#fff" strokeWidth={2} />
                                <Text style={styles.enrollButtonText}>
                                    {t('card.enrollNewCard')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Text style={[styles.backButtonText, { color: textSecondary }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (!card) {
        return null;
    }

    const isActive = card.status === 'ACTIVE';
    const isBlocked = card.status === 'BLOCKED';
    const currentBalance =
        selectedCategory === 'HARDWARE'
            ? card.hardwarePoints
            : selectedCategory === 'PLYWOOD'
                ? card.plywoodPoints
                : 0;

    return (
        <LinearGradient
            colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
            locations={[0, 0.35, 0.65, 1]}
            style={styles.container}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.closeButton}
                            activeOpacity={0.7}
                        >
                            <X size={24} color={textSecondary} strokeWidth={2} />
                        </TouchableOpacity>
                        {card.holder && (
                            <View style={styles.holderInfo}>
                                <Text style={[styles.holderName, { color: textPrimary }]}>
                                    {card.holder.name}
                                </Text>
                                <Text style={[styles.holderMobile, { color: textSecondary }]}>
                                    {card.holder.mobileNumber}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Blocked notice */}
                    {isBlocked && (
                        <View style={[
                            styles.blockedNotice,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(239,68,68,0.10)'
                                    : 'rgba(239,68,68,0.08)',
                                borderColor: isDark
                                    ? 'rgba(239,68,68,0.20)'
                                    : 'rgba(239,68,68,0.15)',
                            },
                        ]}>
                            <Text style={styles.blockedText}>
                                {t('card.blockedMessage')}
                            </Text>
                        </View>
                    )}

                    {/* Category cards */}
                    {isActive && (
                        <View style={styles.categoryRow}>
                            <CategoryCard
                                category="HARDWARE"
                                points={card.hardwarePoints}
                                isSelected={selectedCategory === 'HARDWARE'}
                                onPress={() => {
                                    setSelectedCategory(
                                        selectedCategory === 'HARDWARE' ? null : 'HARDWARE'
                                    );
                                    setMode('idle');
                                }}
                            />
                            <CategoryCard
                                category="PLYWOOD"
                                points={card.plywoodPoints}
                                isSelected={selectedCategory === 'PLYWOOD'}
                                onPress={() => {
                                    setSelectedCategory(
                                        selectedCategory === 'PLYWOOD' ? null : 'PLYWOOD'
                                    );
                                    setMode('idle');
                                }}
                            />
                        </View>
                    )}

                    {/* Credit / Debit action buttons */}
                    {isActive && selectedCategory && mode === 'idle' && (
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200)}
                            exiting={FadeOutDown}
                            style={styles.actionRow}
                        >
                            <TouchableOpacity
                                style={styles.actionTouchable}
                                onPress={() => setMode('credit')}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#22c55e', '#16a34a']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.actionCard}
                                >
                                    <PlusCircle size={32} color="#fff" strokeWidth={1.8} />
                                    <Text style={styles.actionButtonText}>
                                        {t('card.credit').toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionTouchable}
                                onPress={() => setMode('debit')}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#FA0011', '#c5000d']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.actionCard}
                                >
                                    <MinusCircle size={32} color="#fff" strokeWidth={1.8} />
                                    <Text style={styles.actionButtonText}>
                                        {t('card.debit').toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Amount input */}
                    {selectedCategory && (mode === 'credit' || mode === 'debit') && (
                        <AmountInput
                            key={`input-${mode}`}
                            mode={mode}
                            category={selectedCategory}
                            currentBalance={currentBalance}
                            conversionRate={conversionRate(selectedCategory)}
                            onDone={mode === 'credit' ? handleCreditDone : handleDebitDone}
                            onCancel={() => setMode('idle')}
                        />
                    )}
                </ScrollView>

                {/* Bottom bar */}
                <CardBottomBar
                    cardUid={cardUid!}
                    onBlock={() => setShowBlockDialog(true)}
                    showBlock={isActive}
                />

                {/* Block confirm dialog */}
                <BlockConfirmDialog
                    visible={showBlockDialog}
                    onConfirm={handleBlock}
                    onCancel={() => setShowBlockDialog(false)}
                    isLoading={isBlocking}
                />

                {/* Success overlay */}
                <SuccessOverlay
                    visible={showSuccess}
                    message={successMessage}
                    onDismiss={() => setShowSuccess(false)}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        padding: 24,
    },
    scrollContent: {
        paddingBottom: 120,
        paddingTop: 8,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        marginBottom: 28,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    holderInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    holderName: {
        fontSize: 22,
        fontWeight: '800',
    },
    holderMobile: {
        fontSize: 14,
        marginTop: 2,
    },
    blockedNotice: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 20,
    },
    blockedText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
        color: '#ef4444',
    },
    categoryRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 4,
    },
    actionTouchable: {
        flex: 1,
    },
    actionCard: {
        borderRadius: 18,
        paddingVertical: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    notFoundContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFoundContent: {
        alignItems: 'center',
        paddingHorizontal: 32,
        maxWidth: 400,
    },
    notFoundTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    notFoundMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
    },
    cardUidText: {
        fontSize: 14,
        fontFamily: 'monospace',
        marginBottom: 32,
        opacity: 0.7,
    },
    enrollButtonWrapper: {
        width: '100%',
        marginBottom: 16,
    },
    enrollButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    enrollButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
