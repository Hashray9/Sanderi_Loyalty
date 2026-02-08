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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
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
    const { colors } = useTheme();
    const { store } = useAuth();
    const { addAction } = useOfflineQueue();

    const [card, setCard] = useState<CardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [mode, setMode] = useState<Mode>('idle');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

    const fetchCard = useCallback(async () => {
        try {
            const response = await api.get(`/cards/${cardUid}/status`);
            setCard(response.data);
        } catch {
            Alert.alert(t('common.error'), t('card.fetchFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [cardUid, t]);

    useEffect(() => {
        fetchCard();
    }, [fetchCard]);

    // Auto-redirect to enroll for unassigned cards
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
            console.log('💳 handleCreditDone called with amount:', amount);
            console.log('💳 selectedCategory:', selectedCategory);
            if (!selectedCategory) {
                console.log('💳 No category selected, returning');
                return;
            }

            const rate = conversionRate(selectedCategory);
            const points = Math.floor(amount / rate);
            console.log('💳 Rate:', rate, 'Points:', points);

            try {
                console.log('💳 Calling addAction...');
                await addAction({
                    entryId: uuidv4(),
                    actionType: 'CREDIT',
                    payload: {
                        cardUid: cardUid!,
                        category: selectedCategory,
                        amount,
                    },
                });
                console.log('💳 addAction completed successfully');

                setMode('idle');
                setSelectedCategory(null);
                setSuccessMessage(t('credit.successMessage', { points }));
                setShowSuccess(true);

                // Refetch balances
                setTimeout(fetchCard, 1600);
            } catch (error) {
                console.error('💳 handleCreditDone error:', error);
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
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!card) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                    {t('card.notFound')}
                </Text>
            </View>
        );
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Top bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
                    </TouchableOpacity>
                    {card.holder && (
                        <View style={styles.holderInfo}>
                            <Text style={[styles.holderName, { color: colors.text }]}>
                                {card.holder.name}
                            </Text>
                            <Text style={[styles.holderMobile, { color: colors.textSecondary }]}>
                                {card.holder.mobileNumber}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Blocked notice */}
                {isBlocked && (
                    <View style={[styles.blockedNotice, { backgroundColor: colors.error + '15' }]}>
                        <Text style={[styles.blockedText, { color: colors.error }]}>
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

                {/* Credit/Debit buttons */}
                {isActive && selectedCategory && mode === 'idle' && (
                    <Animated.View
                        entering={FadeInDown.springify().damping(20).stiffness(200)}
                        exiting={FadeOutDown}
                        style={styles.actionRow}
                    >
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.success }]}
                            onPress={() => setMode('credit')}
                        >
                            <Text style={styles.actionButtonText}>{t('card.credit')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => setMode('debit')}
                        >
                            <Text style={styles.actionButtonText}>{t('card.debit')}</Text>
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
        </View>
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
        paddingBottom: 100,
        paddingTop: 16,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        marginBottom: 24,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 20,
        fontWeight: '300',
    },
    holderInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    holderName: {
        fontSize: 18,
        fontWeight: '600',
    },
    holderMobile: {
        fontSize: 13,
        marginTop: 2,
    },
    blockedNotice: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    blockedText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    categoryRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
