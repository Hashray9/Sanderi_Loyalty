import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Filter, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface PointEntry {
    id: string;
    entryId: string;
    category: 'HARDWARE' | 'PLYWOOD';
    transactionType: 'CREDIT' | 'DEBIT' | 'EXPIRY' | 'VOID' | 'TRANSFER';
    pointsDelta: number;
    storeName: string;
    staffName: string;
    createdAt: string;
    expiresAt: string | null;
}

export default function HistoryScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { cardUid, holderName } = route.params;
    const { t } = useTranslation();
    const { colors } = useTheme();

    const [entries, setEntries] = useState<PointEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    const fetchHistory = async (reset = false) => {
        try {
            const currentOffset = reset ? 0 : offset;
            const response = await api.get(`/cards/${cardUid}/history`, {
                params: { limit: String(LIMIT), offset: String(currentOffset) },
            });

            const { entries: newEntries, pagination } = response.data;

            if (reset) {
                setEntries(newEntries);
                setOffset(LIMIT);
            } else {
                setEntries((prev) => [...prev, ...newEntries]);
                setOffset((prev) => prev + LIMIT);
            }

            setHasMore(pagination.hasMore);
        } catch {
            // Silently fail — list will remain empty/stale
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory(true);
    }, [cardUid]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHistory(true);
    }, []);

    const onLoadMore = () => {
        if (hasMore && !isLoading) {
            fetchHistory();
        }
    };

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'CREDIT':
                return colors.success;
            case 'DEBIT':
                return colors.primary;
            case 'EXPIRY':
                return colors.warning;
            case 'VOID':
                return colors.error;
            case 'TRANSFER':
                return colors.textSecondary;
            default:
                return colors.text;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        const displayHours = date.getHours() % 12 || 12;

        return `${month} ${day.toString().padStart(2, '0')}, ${year} • ${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const getTransactionTitle = (item: PointEntry) => {
        const category = item.category === 'HARDWARE' ? 'Hardware' : 'Plywood';
        switch (item.transactionType) {
            case 'CREDIT':
                return `${category} Purchase`;
            case 'DEBIT':
                return `${category} Redemption`;
            case 'EXPIRY':
                return `${category} Expiry`;
            case 'VOID':
                return `${category} Void`;
            case 'TRANSFER':
                return `${category} Transfer`;
            default:
                return `${category} Transaction`;
        }
    };

    const renderItem = ({ item, index }: { item: PointEntry; index: number }) => {
        const isCredit = item.pointsDelta > 0;
        const pointsColor = isCredit ? '#10b981' : '#ef4444';
        const sign = isCredit ? '+' : '';

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 30).springify().damping(20).stiffness(200)}
            >
                <View style={styles.transactionCard}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                        style={styles.transactionGradient}
                    >
                        <View style={styles.transactionRow}>
                            <View style={[styles.indicator, { backgroundColor: pointsColor, shadowColor: pointsColor }]} />
                            <View style={styles.transactionContent}>
                                <View style={styles.transactionHeader}>
                                    <Text style={styles.transactionTitle}>{getTransactionTitle(item)}</Text>
                                    <Text style={[styles.pointsValue, { color: pointsColor }]}>
                                        {sign}{Math.abs(item.pointsDelta)} PTS
                                    </Text>
                                </View>
                                <View style={styles.transactionFooter}>
                                    <View style={styles.transactionMeta}>
                                        <Text style={styles.metaDate}>{formatDate(item.createdAt)}</Text>
                                        <Text style={styles.metaStaff}>
                                            Processed by {item.staffName || 'System'}
                                        </Text>
                                    </View>
                                    <View style={styles.typeBadge}>
                                        <Text style={styles.typeBadgeText}>
                                            {item.transactionType === 'CREDIT' ? 'Credit' : 'Debit'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('history.noTransactions')}
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (!hasMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    if (isLoading && entries.length === 0) {
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

    return (
        <View style={styles.container}>
            {/* Background gradients */}
            <View style={styles.bgGradientTop} />
            <View style={styles.bgGradientBottom} />

            <SafeAreaView style={styles.safeArea}>
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
                        <Text style={styles.headerSubtitle}>ACTIVITY</Text>
                        <Text style={styles.headerTitle}>Transaction History</Text>
                    </View>
                    <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
                        <Filter size={20} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                    </TouchableOpacity>
                </View>

                {/* Member info card */}
                <View style={styles.memberCard}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                        style={styles.memberCardGradient}
                    >
                        <View style={styles.memberCardContent}>
                            <View style={styles.avatarContainer}>
                                <User size={14} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberLabel}>MEMBER</Text>
                                <Text style={styles.memberName}>{holderName || 'Card Holder'}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Transactions list */}
                <View style={styles.listHeader}>
                    <Text style={styles.listHeaderTitle}>RECENT ACTIVITIES</Text>
                    <Text style={styles.listHeaderSubtitle}>DEC 2023 - PRESENT</Text>
                </View>

                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="rgba(255,255,255,0.6)"
                        />
                    }
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.3}
                    showsVerticalScrollIndicator={false}
                />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
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
    filterButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberCard: {
        marginHorizontal: 28,
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    memberCardGradient: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 16,
    },
    memberCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
        gap: 2,
    },
    memberLabel: {
        fontSize: 9,
        letterSpacing: 2.4,
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    memberName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 1.2,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 28,
        marginBottom: 20,
    },
    listHeaderTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 3.2,
        textTransform: 'uppercase',
    },
    listHeaderSubtitle: {
        fontSize: 10,
        color: '#4b5563',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0,
    },
    list: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        letterSpacing: 1.2,
    },
    transactionCard: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    transactionGradient: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 16,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    transactionContent: {
        flex: 1,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    transactionTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
    },
    pointsValue: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'serif',
    },
    transactionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionMeta: {
        flex: 1,
        gap: 4,
    },
    metaDate: {
        fontSize: 10,
        color: '#6b7280',
        letterSpacing: 0.8,
    },
    metaStaff: {
        fontSize: 9,
        color: '#4b5563',
        textTransform: 'uppercase',
        letterSpacing: 2.4,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    typeBadgeText: {
        fontSize: 9,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1.6,
        fontWeight: '600',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    bottomGradientFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 160,
        backgroundColor: 'transparent',
        pointerEvents: 'none',
    },
});
