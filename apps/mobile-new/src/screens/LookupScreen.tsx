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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

const DARK_GRADIENT = ['#050505', '#1c150e', '#18101e', '#0a0a0a'];
const LIGHT_GRADIENT = ['#faf8f5', '#f5ede4', '#f0eaf2', '#f8f6f4'];

interface CustomerResult {
    cardUid: string;
    name: string;
    mobileNumber: string;
    cardStatus: string;
    hardwarePoints: number;
    plywoodPoints: number;
}

export default function LookupScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { colorScheme } = useTheme();
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CustomerResult | null>(null);
    const [notFound, setNotFound] = useState(false);

    const isDark = colorScheme === 'dark';

    const handleSearch = async () => {
        if (mobile.length < 10) {
            Alert.alert(t('common.error'), t('lookup.invalidMobile'));
            return;
        }

        setIsLoading(true);
        setResult(null);
        setNotFound(false);

        try {
            const response = await api.get('/customers/search', {
                params: { mobile },
            });

            if (response.data.found) {
                setResult(response.data.customer);
            } else {
                setNotFound(true);
            }
        } catch {
            Alert.alert(t('common.error'), t('lookup.searchFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewCard = () => {
        if (result) {
            navigation.navigate('Card', { cardUid: result.cardUid });
        }
    };

    const textPrimary = isDark ? '#f5f0eb' : '#1a1510';
    const textSecondary = isDark ? '#8a7e72' : '#7a6e62';

    const statusColor =
        result?.cardStatus === 'ACTIVE' ? (isDark ? '#22c55e' : '#16a34a') : '#d97706';

    return (
        <LinearGradient
            colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
            locations={[0, 0.35, 0.65, 1]}
            style={styles.flex}
        >
            <SafeAreaView style={styles.flex}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <Text style={[styles.title, { color: textPrimary }]}>
                        {t('lookup.enterMobile')}
                    </Text>

                    {/* Search Row */}
                    <View style={[
                        styles.searchRow,
                        {
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.04)',
                            borderColor: isDark
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.08)',
                        },
                    ]}>
                        <TextInput
                            style={[styles.input, { color: textPrimary }]}
                            placeholder={t('lookup.mobilePlaceholder')}
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'}
                            keyboardType="phone-pad"
                            value={mobile}
                            onChangeText={setMobile}
                            maxLength={15}
                        />
                        <View style={[
                            styles.divider,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.10)'
                                    : 'rgba(0,0,0,0.10)',
                            },
                        ]} />
                        <TouchableOpacity
                            onPress={handleSearch}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#FA0011', '#c5000d']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.searchButton}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.searchButtonText}>
                                        {t('lookup.search')}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Not Found */}
                    {notFound && (
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200)}
                            exiting={FadeOutDown}
                            style={[
                                styles.resultCard,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.05)'
                                        : 'rgba(0,0,0,0.03)',
                                    borderColor: isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                        >
                            <Text style={[styles.notFoundText, { color: textPrimary }]}>
                                {t('lookup.notFound')}
                            </Text>
                            <Text style={[styles.notFoundHint, { color: textSecondary }]}>
                                {t('lookup.notFoundHint')}
                            </Text>
                        </Animated.View>
                    )}

                    {/* Result Card */}
                    {result && (
                        <Animated.View
                            entering={FadeInDown.springify().damping(20).stiffness(200)}
                            exiting={FadeOutDown}
                            style={[
                                styles.resultCard,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.05)'
                                        : 'rgba(0,0,0,0.03)',
                                    borderColor: isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                        >
                            {/* Name + Status */}
                            <View style={styles.resultHeader}>
                                <Text style={[styles.customerName, { color: textPrimary }]}>
                                    {result.name}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    { borderColor: statusColor },
                                ]}>
                                    <Text style={[styles.statusText, { color: statusColor }]}>
                                        {result.cardStatus}
                                    </Text>
                                </View>
                            </View>

                            {/* Mobile */}
                            <Text style={[styles.mobile, { color: textSecondary }]}>
                                {result.mobileNumber}
                            </Text>

                            {/* Points */}
                            <View style={styles.pointsRow}>
                                <View style={[
                                    styles.pointBox,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(0,0,0,0.04)',
                                        borderColor: isDark
                                            ? 'rgba(255,255,255,0.08)'
                                            : 'rgba(0,0,0,0.06)',
                                    },
                                ]}>
                                    <Text style={[styles.pointLabel, { color: textSecondary }]}>
                                        {t('points.hardware').toUpperCase()}
                                    </Text>
                                    <Text style={[styles.pointValue, { color: textPrimary }]}>
                                        {result.hardwarePoints}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.pointBox,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(0,0,0,0.04)',
                                        borderColor: isDark
                                            ? 'rgba(255,255,255,0.08)'
                                            : 'rgba(0,0,0,0.06)',
                                    },
                                ]}>
                                    <Text style={[styles.pointLabel, { color: textSecondary }]}>
                                        {t('points.plywood').toUpperCase()}
                                    </Text>
                                    <Text style={[styles.pointValue, { color: textPrimary }]}>
                                        {result.plywoodPoints}
                                    </Text>
                                </View>
                            </View>

                            {/* View Card Button */}
                            <TouchableOpacity
                                onPress={handleViewCard}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#FA0011', '#c5000d']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.viewButton}
                                >
                                    <Text style={styles.viewButtonText}>
                                        {t('lookup.viewCard')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 32,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
        marginBottom: 28,
    },
    input: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        paddingVertical: 10,
    },
    divider: {
        width: 1,
        height: 28,
        marginHorizontal: 12,
    },
    searchButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    resultCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
    },
    notFoundText: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    notFoundHint: {
        fontSize: 14,
        textAlign: 'center',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 24,
        fontWeight: '800',
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    mobile: {
        fontSize: 15,
        marginBottom: 24,
        marginTop: 2,
    },
    pointsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    pointBox: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    pointLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    pointValue: {
        fontSize: 36,
        fontWeight: '800',
    },
    viewButton: {
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
