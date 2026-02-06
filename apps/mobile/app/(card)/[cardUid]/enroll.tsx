import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Motion } from '@legendapp/motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { api } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { SuccessOverlay } from '@/components/SuccessOverlay';

const enrollSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerMobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
});

type EnrollForm = z.infer<typeof enrollSchema>;

type Tab = 'new' | 'existing';

interface ExistingCustomer {
  cardUid: string;
  name: string;
  mobileNumber: string;
  hardwarePoints: number;
  plywoodPoints: number;
}

export default function EnrollScreen() {
  const { cardUid } = useLocalSearchParams<{ cardUid: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { addAction } = useOfflineQueue();

  const [tab, setTab] = useState<Tab>('new');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Existing customer search state
  const [searchMobile, setSearchMobile] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<ExistingCustomer | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollForm>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      customerName: '',
      customerMobile: '',
    },
  });

  const onSubmitNew = async (data: EnrollForm) => {
    setIsLoading(true);
    try {
      await addAction({
        entryId: uuidv4(),
        actionType: 'ENROLL',
        payload: {
          cardUid: cardUid!,
          customerName: data.customerName,
          customerMobile: data.customerMobile,
        },
      });

      setSuccessMessage(t('enroll.successMessage'));
      setShowSuccess(true);
    } catch {
      Alert.alert(t('common.error'), t('enroll.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchMobile.length < 10) {
      Alert.alert(t('common.error'), t('lookup.invalidMobile'));
      return;
    }

    setIsSearching(true);
    setFoundCustomer(null);
    setSearchDone(false);

    try {
      const response = await api.get('/customers/search', {
        params: { mobile: searchMobile },
      });

      if (response.data.found) {
        setFoundCustomer(response.data.customer);
      }
      setSearchDone(true);
    } catch {
      Alert.alert(t('common.error'), t('lookup.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!foundCustomer) return;

    setIsLoading(true);
    try {
      // Block old card
      await addAction({
        entryId: uuidv4(),
        actionType: 'BLOCK',
        payload: {
          cardUid: foundCustomer.cardUid,
          reason: 'OTHER',
        },
      });

      // Reissue to new card
      await api.post('/cards/reissue', {
        oldCardUid: foundCustomer.cardUid,
        newCardUid: cardUid,
      });

      setSuccessMessage(t('enroll.transferSuccess'));
      setShowSuccess(true);
    } catch {
      Alert.alert(t('common.error'), t('reissue.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('card.enroll')}
          </Text>
          <View style={styles.closeButton} />
        </View>

        {/* Card UID */}
        <View style={[styles.cardInfo, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {t('enroll.cardUid')}
          </Text>
          <Text style={[styles.cardUid, { color: colors.text }]}>{cardUid}</Text>
        </View>

        {/* Tab toggle */}
        <View style={[styles.tabRow, { backgroundColor: colors.secondary }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'new' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setTab('new')}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === 'new' ? '#fff' : colors.textSecondary },
              ]}
            >
              {t('enroll.newCustomer')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'existing' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setTab('existing')}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === 'existing' ? '#fff' : colors.textSecondary },
              ]}
            >
              {t('enroll.existingCustomer')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* New Customer Form */}
        {tab === 'new' && (
          <Motion.View
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={styles.formSection}
          >
            <Controller
              control={control}
              name="customerName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('enroll.customerName')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: errors.customerName ? colors.error : colors.border,
                      },
                    ]}
                    placeholder={t('enroll.namePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                  {errors.customerName && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.customerName.message}
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
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('enroll.customerMobile')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: errors.customerMobile ? colors.error : colors.border,
                      },
                    ]}
                    placeholder={t('enroll.mobilePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    maxLength={15}
                  />
                  {errors.customerMobile && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.customerMobile.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit(onSubmitNew)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('enroll.submit')}</Text>
              )}
            </TouchableOpacity>
          </Motion.View>
        )}

        {/* Existing Customer Search */}
        {tab === 'existing' && (
          <Motion.View
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={styles.formSection}
          >
            <Text style={[styles.label, { color: colors.text }]}>
              {t('enroll.searchCustomer')}
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('lookup.mobilePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={searchMobile}
                onChangeText={setSearchMobile}
                maxLength={15}
              />
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.searchButtonText}>{t('lookup.search')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchDone && !foundCustomer && (
              <View style={[styles.notFoundCard, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
                  {t('lookup.notFound')}
                </Text>
              </View>
            )}

            {foundCustomer && (
              <View style={[styles.customerCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {foundCustomer.name}
                </Text>
                <Text style={[styles.customerMobile, { color: colors.textSecondary }]}>
                  {foundCustomer.mobileNumber}
                </Text>
                <View style={styles.pointsRow}>
                  <View style={styles.pointBox}>
                    <Text style={[styles.pointLabel, { color: colors.textSecondary }]}>
                      {t('points.hardware')}
                    </Text>
                    <Text style={[styles.pointValue, { color: colors.text }]}>
                      {foundCustomer.hardwarePoints}
                    </Text>
                  </View>
                  <View style={styles.pointBox}>
                    <Text style={[styles.pointLabel, { color: colors.textSecondary }]}>
                      {t('points.plywood')}
                    </Text>
                    <Text style={[styles.pointValue, { color: colors.text }]}>
                      {foundCustomer.plywoodPoints}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.transferNote, { color: colors.warning }]}>
                  {t('enroll.transferConfirm')}
                </Text>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleTransfer}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {t('enroll.transferAndAssign')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Motion.View>
        )}
      </ScrollView>

      <SuccessOverlay
        visible={showSuccess}
        message={successMessage}
        onDismiss={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    marginBottom: 16,
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
  cardInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardUid: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    gap: 16,
  },
  inputContainer: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notFoundCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  notFoundText: {
    fontSize: 14,
  },
  customerCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerMobile: {
    fontSize: 14,
    marginBottom: 16,
  },
  pointsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pointBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  pointLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  pointValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  transferNote: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
