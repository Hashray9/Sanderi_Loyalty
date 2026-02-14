import { useState, useEffect, useCallback, useMemo } from 'react';
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
// import LinearGradient from 'react-native-linear-gradient'; // OLD: bare RN
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Filter, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

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
    safeArea: {
      flex: 1,
    },
    bgGradientTop: {
      position: 'absolute',
      top: '-5%',
      right: '-10%',
      width: '60%',
      height: '40%',
      backgroundColor: colors.surface2,
      borderRadius: radius.full,
      transform: [{ scale: 1.5 }],
      opacity: 0.3,
    },
    bgGradientBottom: {
      position: 'absolute',
      bottom: '20%',
      left: '-10%',
      width: '50%',
      height: '30%',
      backgroundColor: colors.surface1,
      borderRadius: radius.full,
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
      paddingHorizontal: sp['3xl'],
      paddingTop: sp.lg,
      marginBottom: sp['4xl'],
    },
    backButton: {
      width: sp['5xl'],
      height: sp['5xl'],
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -sp.sm,
    },
    headerTitleContainer: {
      alignItems: 'center',
    },
    headerSubtitle: {
      fontSize: typo.fontSize.xs,
      fontWeight: typo.fontWeight.bold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.subtitle,
      textTransform: 'uppercase',
      marginBottom: sp.xs,
    },
    headerTitle: {
      fontSize: typo.fontSize.lg,
      fontWeight: typo.fontWeight.medium,
      color: colors.textHigh,
      fontFamily: typo.fontFamily.sans,
    },
    filterButton: {
      width: sp['5xl'],
      height: sp['5xl'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberCard: {
      marginHorizontal: sp['3xl'],
      marginBottom: sp['4xl'],
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    memberCardGradient: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: sp.lg,
    },
    memberCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
    },
    avatarContainer: {
      width: sp['5xl'],
      height: sp['5xl'],
      borderRadius: radius.xl,
      backgroundColor: colors.avatarBg,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberInfo: {
      gap: 2,
    },
    memberLabel: {
      fontSize: typo.fontSize.xs,
      letterSpacing: typo.letterSpacing.wider,
      color: colors.textSecondary,
      fontWeight: typo.fontWeight.medium,
      textTransform: 'uppercase',
    },
    memberName: {
      fontSize: typo.fontSize.md,
      fontWeight: typo.fontWeight.semibold,
      color: colors.text,
      letterSpacing: typo.letterSpacing.wide,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: sp['3xl'],
      marginBottom: sp.xl,
    },
    listHeaderTitle: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
    },
    listHeaderSubtitle: {
      fontSize: typo.fontSize.sm,
      color: colors.textTertiary,
      fontWeight: typo.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: 0,
    },
    list: {
      paddingHorizontal: sp['3xl'],
      paddingBottom: sp['5xl'],
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sp['3xl'],
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontSize: typo.fontSize.lg,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.wide,
    },
    transactionCard: {
      marginBottom: sp.md,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    transactionGradient: {
      borderWidth: 1,
      borderColor: colors.surface4,
      borderRadius: radius.lg,
      padding: sp.lg,
    },
    transactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: sp.lg,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: sp.sm,
      elevation: sp.sm,
    },
    transactionContent: {
      flex: 1,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: sp.sm,
    },
    transactionTitle: {
      fontSize: typo.fontSize.md,
      fontWeight: typo.fontWeight.medium,
      color: colors.textHigh,
    },
    pointsValue: {
      fontSize: typo.fontSize.lg,
      fontWeight: typo.fontWeight.semibold,
      fontFamily: typo.fontFamily.serif,
    },
    transactionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transactionMeta: {
      flex: 1,
      gap: sp.xs,
    },
    metaDate: {
      fontSize: typo.fontSize.sm,
      color: colors.textSecondary,
      letterSpacing: 0.8,
    },
    metaStaff: {
      fontSize: typo.fontSize.xs,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: typo.letterSpacing.wider,
    },
    typeBadge: {
      paddingHorizontal: sp.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.surface3,
      backgroundColor: colors.surface3,
    },
    typeBadgeText: {
      fontSize: typo.fontSize.xs,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      fontWeight: typo.fontWeight.semibold,
    },
    footer: {
      paddingVertical: sp.xl,
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

function useStyles() {
  const { colors, typography, spacing, borderRadius, buttons } = useTheme();
  return useMemo(
    () => createStyles(colors, typography, spacing, borderRadius, buttons),
    [colors, typography, spacing, borderRadius, buttons],
  );
}

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
  const styles = useStyles();

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
        setEntries(prev => [...prev, ...newEntries]);
        setOffset(prev => prev + LIMIT);
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
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = date.getHours() % 12 || 12;

    return `${month} ${day
      .toString()
      .padStart(2, '0')}, ${year} • ${displayHours
      .toString()
      .padStart(2, '0')}:${minutes} ${ampm}`;
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
    const pointsColor = isCredit ? colors.success : colors.error;
    const sign = isCredit ? '+' : '';

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30)
          .springify()
          .damping(20)
          .stiffness(200)}
      >
        <View style={styles.transactionCard}>
          <LinearGradient
            colors={[colors.surface2, 'rgba(255,255,255,0.01)']}
            style={styles.transactionGradient}
          >
            <View style={styles.transactionRow}>
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: pointsColor, shadowColor: pointsColor },
                ]}
              />
              <View style={styles.transactionContent}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionTitle}>
                    {getTransactionTitle(item)}
                  </Text>
                  <Text style={[styles.pointsValue, { color: pointsColor }]}>
                    {sign}
                    {Math.abs(item.pointsDelta)} PTS
                  </Text>
                </View>
                <View style={styles.transactionFooter}>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.metaDate}>
                      {formatDate(item.createdAt)}
                    </Text>
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
          <ActivityIndicator size="large" color={colors.textHigh} />
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
            <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>ACTIVITY</Text>
            <Text style={styles.headerTitle}>Transaction History</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Filter size={20} color={colors.textMedium} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Member info card */}
        <View style={styles.memberCard}>
          <LinearGradient
            colors={[colors.surface2, 'rgba(255,255,255,0.01)']}
            style={styles.memberCardGradient}
          >
            <View style={styles.memberCardContent}>
              <View style={styles.avatarContainer}>
                <User size={14} color={colors.textLow} strokeWidth={1.5} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberLabel}>MEMBER</Text>
                <Text style={styles.memberName}>
                  {holderName || 'Card Holder'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Transactions list */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>RECENT ACTIVITIES</Text>
        </View>

        <FlatList
          data={entries}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={
            entries.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textMedium}
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
