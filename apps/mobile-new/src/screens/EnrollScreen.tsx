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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {
  X,
  AlertCircle,
  Nfc,
  ArrowRight,
  UserPlus,
  RefreshCw,
} from 'lucide-react-native';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useNetwork } from '@/hooks/useNetwork';
import { api } from '@/lib/api';
import {
  SuccessOverlay,
  type TransferDetail,
} from '@/components/SuccessOverlay';
import { v4 as uuidv4 } from 'uuid';

const formatAadhaarInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
};

const enrollSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerAadhaar: z
    .string()
    .min(12, 'Aadhaar number must be 12 digits'),
  customerMobile: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits'),
});

type EnrollForm = z.infer<typeof enrollSchema>;
type EnrollMode = 'NEW' | 'TRANSFER' | null;

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

export default function EnrollScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { cardUid } = route.params;
  const { t } = useTranslation();
  const { addAction } = useOfflineQueue();
  const { isOnline } = useNetwork();

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<EnrollMode>(null);

  // Transfer state
  const [transferMobile, setTransferMobile] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<CustomerResult | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transferDetail, setTransferDetail] = useState<
    TransferDetail | undefined
  >();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollForm>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      customerName: '',
      customerAadhaar: '',
      customerMobile: '',
    },
  });

  const handleModeSelect = (newMode: EnrollMode) => {
    setMode(newMode);
    setTransferMobile('');
    setSearchResult(null);
    setSearchNotFound(false);
  };

  const handleTransferMobileChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setTransferMobile(formatPhoneInput(cleaned));
    }
    setSearchResult(null);
    setSearchNotFound(false);
  };

  const handleSearch = async () => {
    const cleaned = transferMobile.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert(
        t('common.error'),
        'Please enter a valid 10-digit mobile number',
      );
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setSearchNotFound(false);

    try {
      const response = await api.get('/customers/search', {
        params: { mobile: cleaned },
      });

      if (response.data.found) {
        setSearchResult(response.data.customer);
      } else {
        setSearchNotFound(true);
      }
    } catch {
      Alert.alert(t('common.error'), 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!searchResult) return;

    if (!isOnline) {
      Alert.alert(t('common.error'), t('enroll.requiresInternet'));
      return;
    }

    setIsTransferring(true);

    try {
      await api.post('/cards/reissue', {
        oldCardUid: searchResult.cardUid,
        newCardUid: cardUid,
      });

      setTransferDetail({
        type: 'TRANSFER',
        memberName: searchResult.name,
        oldCardUid: searchResult.cardUid,
        newCardUid: cardUid,
        hardwarePoints: searchResult.hardwarePoints,
        plywoodPoints: searchResult.plywoodPoints,
      });

      Keyboard.dismiss();
      setShowSuccess(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Transfer failed. Please try again.';
      Alert.alert(t('common.error'), message);
    } finally {
      setIsTransferring(false);
    }
  };

  const onSubmit = async (data: EnrollForm) => {
    setIsLoading(true);
    try {
      await addAction({
        entryId: uuidv4(),
        actionType: 'ENROLL',
        payload: {
          cardUid: cardUid!,
          customerName: data.customerName,
          customerAadhaar: data.customerAadhaar.replace(/\D/g, ''),
          customerMobile: data.customerMobile.replace(/\D/g, ''),
        },
      });

      Alert.alert('Success', 'Member enrolled successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Scan'),
        },
      ]);
    } catch {
      Alert.alert(t('common.error'), 'Failed to enroll member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradients */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.entryErrorBadge}>
              <AlertCircle size={14} color="#ef4444" strokeWidth={2} />
              <Text style={styles.entryErrorText}>ENTRY ERROR</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <X size={20} color="rgba(156,163,175,1)" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Card Not Found</Text>
            <Text style={styles.subtitle}>ENROLL OR TRANSFER TO THIS CARD</Text>
          </View>

          {/* Card display */}
          <View style={styles.cardPerspective}>
            <View style={styles.card3D}>
              <LinearGradient
                colors={['#111111', '#050505']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {/* Glow overlay */}
                <View style={styles.cardGlowOverlay} />

                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.chipContainer} />
                  <Nfc
                    size={30}
                    color="rgba(255,255,255,0.2)"
                    strokeWidth={1.5}
                  />
                </View>

                {/* Card footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.chipLabel}>NEW CARD DETECTED</Text>
                  <Text style={styles.chipId}>ID: {cardUid}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Mode toggle buttons */}
          <View style={styles.modeButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'NEW' && styles.modeButtonNewActive,
              ]}
              onPress={() => handleModeSelect('NEW')}
              activeOpacity={0.8}
            >
              <UserPlus
                size={14}
                color={mode === 'NEW' ? '#10b981' : 'rgba(255,255,255,0.6)'}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'NEW' && styles.modeButtonNewText,
                ]}
              >
                {t('enroll.newMember').toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'TRANSFER' && styles.modeButtonTransferActive,
              ]}
              onPress={() => handleModeSelect('TRANSFER')}
              activeOpacity={0.8}
            >
              <RefreshCw
                size={14}
                color={
                  mode === 'TRANSFER' ? '#3b82f6' : 'rgba(255,255,255,0.6)'
                }
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'TRANSFER' && styles.modeButtonTransferText,
                ]}
              >
                {t('enroll.transferCard').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* New Member form */}
          {mode === 'NEW' && (
            <Animated.View
              entering={FadeInDown.springify().damping(20).stiffness(200)}
              exiting={FadeOutDown}
              style={styles.formSection}
            >
              <Controller
                control={control}
                name="customerName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.customerName && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="Enter member name"
                        placeholderTextColor="rgba(255,255,255,0.1)"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        editable={!isLoading}
                        autoCapitalize="words"
                      />
                    </View>
                    {errors.customerName && (
                      <Text style={styles.errorText}>
                        {errors.customerName.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="customerAadhaar"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>AADHAAR NUMBER</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.customerAadhaar && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        style={[styles.input, styles.inputAadhaar]}
                        placeholder="0000 0000 0000"
                        placeholderTextColor="rgba(255,255,255,0.1)"
                        keyboardType="number-pad"
                        onBlur={onBlur}
                        onChangeText={text => {
                          const cleaned = text.replace(/\D/g, '');
                          if (cleaned.length <= 12) {
                            onChange(formatAadhaarInput(cleaned));
                          }
                        }}
                        value={value}
                        editable={!isLoading}
                        maxLength={14}
                      />
                    </View>
                    {errors.customerAadhaar && (
                      <Text style={styles.errorText}>
                        {errors.customerAadhaar.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="customerMobile"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.customerMobile && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        style={[styles.input, styles.inputPhone]}
                        placeholder="00000 00000"
                        placeholderTextColor="rgba(255,255,255,0.1)"
                        keyboardType="phone-pad"
                        onBlur={onBlur}
                        onChangeText={text => {
                          const cleaned = text.replace(/\D/g, '');
                          if (cleaned.length <= 10) {
                            onChange(formatPhoneInput(cleaned));
                          }
                        }}
                        value={value}
                        editable={!isLoading}
                        maxLength={11}
                      />
                    </View>
                    {errors.customerMobile && (
                      <Text style={styles.errorText}>
                        {errors.customerMobile.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </Animated.View>
          )}

          {/* Transfer Card flow */}
          {mode === 'TRANSFER' && (
            <Animated.View
              entering={FadeInDown.springify().damping(20).stiffness(200)}
              exiting={FadeOutDown}
              style={styles.transferSection}
            >
              {/* Mobile number search input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputPhone]}
                    placeholder="00000 00000"
                    placeholderTextColor="rgba(255,255,255,0.1)"
                    keyboardType="phone-pad"
                    value={transferMobile}
                    onChangeText={handleTransferMobileChange}
                    maxLength={11}
                    editable={!isSearching && !isTransferring}
                  />
                </View>
              </View>

              {/* Search button */}
              <TouchableOpacity
                style={styles.searchActionButton}
                onPress={handleSearch}
                disabled={isSearching || isTransferring}
                activeOpacity={0.8}
              >
                {isSearching ? (
                  <ActivityIndicator
                    color="rgba(255,255,255,0.9)"
                    size="small"
                  />
                ) : (
                  <Text style={styles.searchActionButtonText}>
                    {t('enroll.searchMember').toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Search result card */}
              {searchResult && (
                <Animated.View
                  entering={FadeInDown.springify().damping(20).stiffness(200)}
                  style={styles.resultCard}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255,255,255,0.05)',
                      'rgba(255,255,255,0.01)',
                    ]}
                    style={styles.resultCardGradient}
                  >
                    {/* Member info */}
                    <Text style={styles.resultName}>{searchResult.name}</Text>
                    <Text style={styles.resultPhone}>
                      {formatPhoneNumber(searchResult.mobileNumber)}
                    </Text>
                    <Text style={styles.resultCardId}>
                      Card: {searchResult.cardUid}
                    </Text>
                    <Text
                      style={[
                        styles.resultStatus,
                        searchResult.cardStatus === 'ACTIVE' &&
                          styles.resultStatusActive,
                        searchResult.cardStatus === 'BLOCKED' &&
                          styles.resultStatusBlocked,
                        searchResult.cardStatus === 'TRANSFERRED' &&
                          styles.resultStatusBlocked,
                      ]}
                    >
                      {searchResult.cardStatus}
                    </Text>

                    {/* Points breakdown */}
                    <View style={styles.resultPointsRow}>
                      <View style={styles.resultPointsCol}>
                        <Text style={styles.resultPointsLabel}>HARDWARE</Text>
                        <Text style={styles.resultPointsValue}>
                          {searchResult.hardwarePoints.toLocaleString()}{' '}
                          <Text style={styles.resultPointsUnit}>pts</Text>
                        </Text>
                      </View>
                      <View style={styles.resultPointsCol}>
                        <Text style={styles.resultPointsLabel}>PLYWOOD</Text>
                        <Text style={styles.resultPointsValue}>
                          {searchResult.plywoodPoints.toLocaleString()}{' '}
                          <Text style={styles.resultPointsUnit}>pts</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Transfer warning */}
                    <Text style={styles.transferWarning}>
                      {t('enroll.transferConfirm')}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Not found state */}
              {searchNotFound && (
                <Animated.View
                  entering={FadeInDown.springify().damping(20).stiffness(200)}
                  style={styles.notFoundState}
                >
                  <Text style={styles.notFoundText}>No member found</Text>
                  <Text style={styles.notFoundHint}>
                    Please check the mobile number
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer button — adapts based on mode */}
        {mode === 'NEW' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.enrollButtonText}>ENROLL MEMBER</Text>
                  <View style={styles.enrollButtonArrow}>
                    <View style={styles.arrowLine} />
                    <ArrowRight size={18} color="#000" strokeWidth={2.5} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'TRANSFER' && searchResult && (
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(200)}
            exiting={FadeOutDown}
            style={styles.footer}
          >
            <TouchableOpacity
              style={styles.enrollButton}
              onPress={handleTransfer}
              disabled={isTransferring}
              activeOpacity={0.9}
            >
              {isTransferring ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.enrollButtonText}>TRANSFER CARD</Text>
                  <View style={styles.enrollButtonArrow}>
                    <View style={styles.arrowLine} />
                    <ArrowRight size={18} color="#000" strokeWidth={2.5} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>

      {/* Success overlay for transfer */}
      <SuccessOverlay
        visible={showSuccess}
        transaction={transferDetail}
        onDismiss={() => {
          setShowSuccess(false);
          navigation.navigate('Scan');
        }}
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
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bgGradientTop: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '70%',
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
    opacity: 1,
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '60%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 999,
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 8,
    marginBottom: 32,
  },
  entryErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  entryErrorText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(156,163,175,1)',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'serif',
    color: '#f5f5f5',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '300',
    color: '#6b7280',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cardPerspective: {
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  card3D: {
    width: 320,
    height: 192,
    borderRadius: 20,
    overflow: 'hidden',
    transform: [
      { perspective: 1200 },
      { rotateX: '15deg' },
      { rotateY: '-10deg' },
    ],
    shadowColor: '#000',
    shadowOffset: { width: -20, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  cardGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardGlowOverlay: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 64,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  chipContainer: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(55,65,81,1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    opacity: 0.4,
  },
  cardFooter: {
    zIndex: 10,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'monospace',
    letterSpacing: 3.2,
    marginBottom: 4,
    opacity: 0.6,
  },
  chipId: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'monospace',
    letterSpacing: 2.4,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Mode toggle buttons (matches Credit/Debit pattern from CardDetailScreen)
  modeButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  modeButtonNewActive: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  modeButtonTransferActive: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: '#3b82f6',
    borderWidth: 1.5,
  },
  modeButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  modeButtonNewText: {
    color: '#10b981',
  },
  modeButtonTransferText: {
    color: '#3b82f6',
  },

  // New Member form
  formSection: {
    paddingHorizontal: 40,
    gap: 32,
    marginBottom: 48,
  },
  inputContainer: {
    gap: 0,
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
  },
  input: {
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: 18,
    fontWeight: '300',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  inputAadhaar: {
    fontSize: 22,
    fontFamily: 'monospace',
    letterSpacing: 6,
  },
  inputPhone: {
    fontSize: 24,
    fontFamily: 'serif',
    letterSpacing: 8,
  },
  inputWrapperError: {
    borderBottomColor: '#ef4444',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
  },

  // Transfer section
  transferSection: {
    paddingHorizontal: 40,
    gap: 24,
  },
  searchActionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchActionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  resultCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  resultCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
    gap: 4,
  },
  resultName: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#fff',
    marginBottom: 2,
  },
  resultPhone: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6b7280',
    letterSpacing: 2.4,
  },
  resultCardId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6b7280',
    letterSpacing: 1,
    marginTop: 8,
  },
  resultStatus: {
    fontSize: 11,
    color: '#6b7280',
    letterSpacing: 1,
    fontWeight: '600',
  },
  resultStatusActive: {
    color: '#10b981',
  },
  resultStatusBlocked: {
    color: '#ef4444',
  },
  resultPointsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  resultPointsCol: {
    flex: 1,
  },
  resultPointsLabel: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  resultPointsValue: {
    fontSize: 16,
    fontFamily: 'serif',
    color: '#fff',
  },
  resultPointsUnit: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
    textTransform: 'uppercase',
  },
  transferWarning: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 16,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  notFoundState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  notFoundText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  notFoundHint: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Footer
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  enrollButton: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  enrollButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 2.2,
  },
  enrollButtonArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  arrowLine: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomGradientFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
});
