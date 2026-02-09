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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    const { cardUid } = route.params;
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

    const renderItem = ({ item, index }: { item: PointEntry; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify().damping(20).stiffness(200)}
        >
            <View style={[styles.item, { backgroundColor: colors.card }]}>
                <View style={styles.itemHeader}>
                    <View style={styles.typeContainer}>
                        <View
                            style={[
                                styles.typeBadge,
                                { backgroundColor: getTypeColor(item.transactionType) },
                            ]}
                        >
                            <Text style={styles.typeText}>{item.transactionType}</Text>
                        </View>
                        <View
                            style={[
                                styles.categoryBadge,
                                { backgroundColor: colors.secondary },
                            ]}
                        >
                            <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                                {item.category}
                            </Text>
                        </View>
                    </View>
                    <Text
                        style={[
                            styles.points,
                            {
                                color:
                                    item.pointsDelta > 0
                                        ? colors.success
                                        : item.pointsDelta < 0
                                            ? colors.error
                                            : colors.text,
                            },
                        ]}
                    >
                        {item.pointsDelta > 0 ? '+' : ''}
                        {item.pointsDelta}
                    </Text>
                </View>

                <View style={styles.itemFooter}>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>
                        {item.staffName}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );

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
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('card.viewHistory')}
                </Text>
                <View style={styles.closeButton} />
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
                        tintColor={colors.primary}
                    />
                }
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.3}
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
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
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
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    item: {
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '500',
    },
    points: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    meta: {
        fontSize: 11,
    },
    date: {
        fontSize: 11,
    },
    emptyContainer: {
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
    footer: {
        paddingVertical: 20,
    },
});
