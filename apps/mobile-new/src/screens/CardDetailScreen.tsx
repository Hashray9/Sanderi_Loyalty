import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
// import LinearGradient from 'react-native-linear-gradient'; // OLD: bare RN
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Wrench,
  Layers,
  PlusCircle,
  MinusCircle,
  Zap,
  Clock,
  ShieldOff,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { api } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { SuccessOverlay } from '@/components/SuccessOverlay';
import { Toast } from '@/components/Toast';

interface CardData {
  cardUid: string;
  status: 'UNASSIGNED' | 'ACTIVE' | 'BLOCKED' | 'TRANSFERRED';
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

type Theme = ReturnType<typeof useTheme>;

function createStyles(
  colors: Theme['colors'],
  typo: Theme['typography'],
  sp: Theme['spacing'],
  radius: Theme['borderRadius'],
  btn: Theme['buttons'],
) {
  return StyleSheet.create({
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
    scrollContent: {
      paddingHorizontal: sp['3xl'],
      paddingTop: 0,
      paddingBottom: 200,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: sp.lg,
      marginBottom: sp['4xl'],
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
    headerSpacer: {
      width: 40,
    },
    memberCard: {
      marginBottom: sp['4xl'],
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    memberCardGradient: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: sp.xl,
    },
    memberCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.lg,
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: radius.xl,
      backgroundColor: colors.avatarBg,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberInfo: {
      flex: 1,
    },
    memberLabel: {
      fontSize: typo.fontSize.sm,
      letterSpacing: typo.letterSpacing.wider,
      color: colors.textSecondary,
      fontWeight: typo.fontWeight.medium,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    memberName: {
      fontSize: typo.fontSize.lg,
      fontWeight: typo.fontWeight.semibold,
      color: colors.text,
      letterSpacing: typo.letterSpacing.wide,
    },
    historyButton: {
      width: 40,
      height: 40,
      borderRadius: radius.xl,
      backgroundColor: colors.surface3,
      borderWidth: 1,
      borderColor: colors.borderMedium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionLabel: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.semibold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
      marginBottom: sp['2xl'],
      marginLeft: sp.xs,
    },
    categoryGrid: {
      flexDirection: 'row',
      gap: sp.lg,
      marginBottom: sp['5xl'],
    },
    categoryCard: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: radius['2xl'],
      backgroundColor: 'transparent',
    },
    categoryCardActive: {},
    categoryCardGradientActive: {
      borderColor: colors.borderActive,
      borderWidth: 2,
    },
    categoryCardGradient: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      borderRadius: radius['2xl'],
      padding: sp['2xl'],
      justifyContent: 'space-between',
      overflow: 'hidden',
    },
    categoryCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    activeIndicator: {
      width: sp.sm,
      height: sp.sm,
      borderRadius: sp.xs,
      backgroundColor: colors.text,
    },
    categoryCardFooter: {},
    categoryName: {
      fontSize: typo.fontSize.lg,
      fontWeight: typo.fontWeight.medium,
      color: colors.textHigh,
      marginBottom: sp.xs,
    },
    categoryNameActive: {
      color: colors.text,
      fontWeight: typo.fontWeight.semibold,
    },
    pointsRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: sp.xs,
    },
    pointsValue: {
      fontSize: typo.fontSize['3xl'],
      fontFamily: typo.fontFamily.serif,
      color: colors.text,
    },
    pointsValueActive: {
      color: colors.text,
      fontWeight: typo.fontWeight.bold,
    },
    pointsUnit: {
      fontSize: typo.fontSize.xs,
      color: colors.textSecondary,
      fontWeight: typo.fontWeight.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: sp.lg,
      marginBottom: sp['5xl'],
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp.sm,
      paddingVertical: sp.lg,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface1,
    },
    actionButtonCreditActive: {
      backgroundColor: colors.successBg,
      borderColor: colors.success,
      borderWidth: 1.5,
    },
    actionButtonDebitActive: {
      backgroundColor: colors.errorBg,
      borderColor: colors.error,
      borderWidth: 1.5,
    },
    actionButtonText: {
      fontSize: typo.fontSize.label,
      fontWeight: typo.fontWeight.bold,
      color: colors.textMedium,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
    },
    actionButtonCreditText: {
      color: colors.success,
    },
    actionButtonDebitText: {
      color: colors.error,
    },
    amountSection: {
      paddingTop: sp.lg,
      alignItems: 'center',
    },
    amountLabel: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.semibold,
      color: colors.textSubtle,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
      marginBottom: sp.sm,
    },
    amountInput: {
      width: '100%',
      fontSize: typo.fontSize.amount,
      fontFamily: typo.fontFamily.serif,
      letterSpacing: 4,
      color: colors.text,
      textAlign: 'center',
      paddingVertical: sp.lg,
      paddingHorizontal: 0,
    },
    amountUnderline: {
      width: '100%',
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    equivalentText: {
      fontSize: typo.fontSize.body,
      color: colors.textSecondary,
      marginBottom: sp.xs,
      letterSpacing: 1,
    },
    bottomSection: {
      paddingHorizontal: sp['3xl'],
      paddingBottom: sp['5xl'],
    },
    processButton: {
      backgroundColor: colors.buttonPrimary,
      height: btn.primaryHeight,
      borderRadius: btn.primaryBorderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp.md,
    },
    processButtonText: {
      fontSize: typo.fontSize.body,
      fontWeight: typo.fontWeight.bold,
      color: colors.buttonPrimaryText,
      letterSpacing: typo.letterSpacing.heading,
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
      paddingHorizontal: sp['4xl'],
    },
    notFoundTitle: {
      fontSize: typo.fontSize['3xl'],
      fontStyle: 'italic',
      color: colors.text,
      fontFamily: typo.fontFamily.serif,
      marginBottom: sp.md,
      textAlign: 'center',
    },
    notFoundMessage: {
      fontSize: typo.fontSize.lg,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.wide,
      textAlign: 'center',
      marginBottom: sp['4xl'],
      lineHeight: 22,
    },
    goBackButton: {
      backgroundColor: colors.buttonPrimary,
      paddingHorizontal: sp['4xl'],
      paddingVertical: sp.lg,
      borderRadius: btn.primaryBorderRadius,
    },
    goBackButtonText: {
      fontSize: typo.fontSize.label,
      fontWeight: typo.fontWeight.bold,
      color: colors.buttonPrimaryText,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.lg,
      marginBottom: sp['4xl'],
      paddingVertical: sp.xl,
      paddingHorizontal: sp.xl,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    statusBannerTitle: {
      fontSize: typo.fontSize.label,
      fontWeight: typo.fontWeight.bold,
      letterSpacing: typo.letterSpacing.button,
      marginBottom: sp.xs,
    },
    statusBannerSubtitle: {
      fontSize: typo.fontSize.body,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}

function useStyles() {
  const { colors, typography, spacing, borderRadius, buttons } = useTheme();
  return useMemo(
    () => createStyles(colors, typography, spacing, borderRadius, buttons),
    [colors, typography, spacing, borderRadius, buttons],
  );
}

export default function CardDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { cardUid } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const { store } = useAuth();
  const { addAction } = useOfflineQueue();

  const [card, setCard] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cardNotFound, setCardNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [transactionType, setTransactionType] = useState<TransactionType>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionDetail, setTransactionDetail] = useState<
    TransactionDetail | undefined
  >(undefined);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchCard = useCallback(async () => {
    try {
      const response = await api.get(`/cards/${cardUid}/status`);
      setCard(response.data);
      setCardNotFound(false);
    } catch (error: any) {
      // If card not found (404), show not found screen
      if (
        error?.response?.status === 404 ||
        error?.response?.data?.code === 'CARD_NOT_FOUND'
      ) {
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
    [store],
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
        const currentBalance =
          selectedCategory === 'HARDWARE'
            ? card!.hardwarePoints
            : card!.plywoodPoints;
        if (points > currentBalance) {
          setToastMessage(
            t('card.cannotDebitMore', {
              points: currentBalance.toLocaleString(),
            }),
          );
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
      const currentBalance =
        selectedCategory === 'HARDWARE'
          ? card!.hardwarePoints
          : card!.plywoodPoints;
      const newBalance =
        transactionType === 'CREDIT'
          ? currentBalance + points
          : currentBalance - points;

      // Set transaction detail for success overlay
      // Dismiss keyboard before showing success overlay to prevent layout issues
      Keyboard.dismiss();

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
  }, [
    selectedCategory,
    transactionType,
    amount,
    conversionRate,
    addAction,
    cardUid,
    t,
    fetchCard,
  ]);

  if (isLoading) {
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
              <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerSubtitle}>
                {t('card.transaction').toUpperCase()}
              </Text>
              <Text style={styles.headerTitle}>{t('card.pointManager')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Member Info Card */}
          {card.holder && (
            <View style={styles.memberCard}>
              <LinearGradient
                colors={[colors.surface2, 'rgba(255,255,255,0.01)']}
                style={styles.memberCardGradient}
              >
                <View style={styles.memberCardContent}>
                  <View style={styles.avatarContainer}>
                    <User
                      size={16}
                      color={colors.textMedium}
                      strokeWidth={1.5}
                    />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberLabel}>
                      {t('card.member').toUpperCase()}
                    </Text>
                    <Text style={styles.memberName}>{card.holder.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() =>
                      navigation.navigate('History', {
                        cardUid,
                        holderName: card.holder?.name || 'Card Holder',
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Clock
                      size={18}
                      color={colors.textMedium}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Blocked / Transferred Banner */}
          {!isActive &&
            (card.status === 'BLOCKED' || card.status === 'TRANSFERRED') && (
              <View style={styles.statusBanner}>
                <ShieldOff
                  size={18}
                  color={
                    card.status === 'TRANSFERRED'
                      ? colors.warning
                      : colors.error
                  }
                  strokeWidth={1.5}
                />
                <View>
                  <Text
                    style={[
                      styles.statusBannerTitle,
                      {
                        color:
                          card.status === 'TRANSFERRED'
                            ? colors.warning
                            : colors.error,
                      },
                    ]}
                  >
                    {card.status === 'TRANSFERRED'
                      ? 'CARD TRANSFERRED'
                      : 'CARD BLOCKED'}
                  </Text>
                  <Text style={styles.statusBannerSubtitle}>
                    {card.status === 'TRANSFERRED'
                      ? 'This card has been transferred to a new card'
                      : 'This card has been blocked. No transactions allowed.'}
                  </Text>
                </View>
              </View>
            )}

          {/* Category Selection */}
          {isActive && (
            <>
              <Text style={styles.sectionLabel}>
                {t('card.selectCategory')}
              </Text>
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
                        ? [colors.surface6, 'rgba(255,255,255,0.04)']
                        : [colors.surface3, 'rgba(255,255,255,0.01)']
                    }
                    style={[
                      styles.categoryCardGradient,
                      selectedCategory === 'HARDWARE' &&
                        styles.categoryCardGradientActive,
                    ]}
                  >
                    <View style={styles.categoryCardHeader}>
                      <Wrench
                        size={20}
                        color={
                          selectedCategory === 'HARDWARE'
                            ? colors.scanLine
                            : colors.textLow
                        }
                        strokeWidth={1.5}
                      />
                      {selectedCategory === 'HARDWARE' && (
                        <View style={styles.activeIndicator} />
                      )}
                    </View>
                    <View style={styles.categoryCardFooter}>
                      <Text
                        style={[
                          styles.categoryName,
                          selectedCategory === 'HARDWARE' &&
                            styles.categoryNameActive,
                        ]}
                      >
                        {t('points.hardware')}
                      </Text>
                      <View style={styles.pointsRow}>
                        <Text
                          style={[
                            styles.pointsValue,
                            selectedCategory === 'HARDWARE' &&
                              styles.pointsValueActive,
                          ]}
                        >
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
                        ? [colors.surface6, 'rgba(255,255,255,0.04)']
                        : [colors.surface3, 'rgba(255,255,255,0.01)']
                    }
                    style={[
                      styles.categoryCardGradient,
                      selectedCategory === 'PLYWOOD' &&
                        styles.categoryCardGradientActive,
                    ]}
                  >
                    <View style={styles.categoryCardHeader}>
                      <Layers
                        size={20}
                        color={
                          selectedCategory === 'PLYWOOD'
                            ? colors.scanLine
                            : colors.textLow
                        }
                        strokeWidth={1.5}
                      />
                      {selectedCategory === 'PLYWOOD' && (
                        <View style={styles.activeIndicator} />
                      )}
                    </View>
                    <View style={styles.categoryCardFooter}>
                      <Text
                        style={[
                          styles.categoryName,
                          selectedCategory === 'PLYWOOD' &&
                            styles.categoryNameActive,
                        ]}
                      >
                        {t('points.plywood')}
                      </Text>
                      <View style={styles.pointsRow}>
                        <Text
                          style={[
                            styles.pointsValue,
                            selectedCategory === 'PLYWOOD' &&
                              styles.pointsValueActive,
                          ]}
                        >
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
                  transactionType === 'CREDIT' &&
                    styles.actionButtonCreditActive,
                ]}
                onPress={() => handleTransactionTypeSelect('CREDIT')}
                activeOpacity={0.8}
              >
                <PlusCircle
                  size={14}
                  color={
                    transactionType === 'CREDIT'
                      ? colors.success
                      : colors.textMedium
                  }
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    transactionType === 'CREDIT' &&
                      styles.actionButtonCreditText,
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
                  color={
                    transactionType === 'DEBIT'
                      ? colors.error
                      : colors.textMedium
                  }
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
              entering={FadeInDown.springify()
                .damping(20)
                .stiffness(200)
                .delay(100)}
              exiting={FadeOutDown}
              style={styles.amountSection}
            >
              <Text style={styles.amountLabel}>
                {transactionType === 'DEBIT'
                  ? t('card.enterPoints')
                  : t('card.enterAmount')}
              </Text>
              {transactionType === 'DEBIT' && amount && selectedCategory && (
                <Text style={styles.equivalentText}>
                  {t('card.equivalentAmount', {
                    amount: formatIndian(
                      String(
                        parseInt(amount, 10) * conversionRate(selectedCategory),
                      ),
                    ),
                  })}
                </Text>
              )}
              <TextInput
                style={styles.amountInput}
                placeholder="1000"
                placeholderTextColor={colors.surface3}
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
            entering={FadeInDown.springify()
              .damping(20)
              .stiffness(200)
              .delay(200)}
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
                <ActivityIndicator
                  color={colors.buttonPrimaryText}
                  size="small"
                />
              ) : (
                <>
                  <Text style={styles.processButtonText}>
                    {t('card.processTransaction').toUpperCase()}
                  </Text>
                  <Zap
                    size={18}
                    color={colors.buttonPrimaryText}
                    strokeWidth={2.5}
                  />
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
