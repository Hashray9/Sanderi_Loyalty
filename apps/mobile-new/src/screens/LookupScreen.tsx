import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

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
    const { colors } = useTheme();
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CustomerResult | null>(null);
    const [notFound, setNotFound] = useState(false);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.searchSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                    {t('lookup.enterMobile')}
                </Text>
                <View style={styles.searchRow}>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                                borderColor: colors.border,
                            },
                        ]}
                        placeholder={t('lookup.mobilePlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                        value={mobile}
                        onChangeText={setMobile}
                        maxLength={15}
                    />
                    <TouchableOpacity
                        style={[styles.searchButton, { backgroundColor: colors.primary }]}
                        onPress={handleSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.searchButtonText}>{t('lookup.search')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {notFound && (
                <Animated.View
                    entering={FadeInDown.springify().damping(20).stiffness(200)}
                    exiting={FadeOutDown}
                    style={[styles.notFoundCard, { backgroundColor: colors.card }]}
                >
                    <Text style={[styles.notFoundText, { color: colors.text }]}>
                        {t('lookup.notFound')}
                    </Text>
                    <Text style={[styles.notFoundHint, { color: colors.textSecondary }]}>
                        {t('lookup.notFoundHint')}
                    </Text>
                </Animated.View>
            )}

            {result && (
                <Animated.View
                    entering={FadeInDown.springify().damping(20).stiffness(200)}
                    exiting={FadeOutDown}
                    style={[styles.resultCard, { backgroundColor: colors.card }]}
                >
                    <View style={styles.resultHeader}>
                        <Text style={[styles.customerName, { color: colors.text }]}>
                            {result.name}
                        </Text>
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        result.cardStatus === 'ACTIVE' ? colors.success : colors.warning,
                                },
                            ]}
                        >
                            <Text style={styles.statusText}>{result.cardStatus}</Text>
                        </View>
                    </View>

                    <Text style={[styles.mobile, { color: colors.textSecondary }]}>
                        {result.mobileNumber}
                    </Text>

                    <View style={styles.pointsRow}>
                        <View
                            style={[styles.pointBox, { backgroundColor: colors.secondary }]}
                        >
                            <Text style={[styles.pointLabel, { color: colors.textSecondary }]}>
                                {t('points.hardware')}
                            </Text>
                            <Text style={[styles.pointValue, { color: colors.text }]}>
                                {result.hardwarePoints}
                            </Text>
                        </View>
                        <View
                            style={[styles.pointBox, { backgroundColor: colors.secondary }]}
                        >
                            <Text style={[styles.pointLabel, { color: colors.textSecondary }]}>
                                {t('points.plywood')}
                            </Text>
                            <Text style={[styles.pointValue, { color: colors.text }]}>
                                {result.plywoodPoints}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.viewButton, { backgroundColor: colors.primary }]}
                        onPress={handleViewCard}
                    >
                        <Text style={styles.viewButtonText}>{t('lookup.viewCard')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchSection: {
        marginBottom: 24,
        marginTop: 48,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 16,
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
        fontSize: 16,
        fontWeight: '600',
    },
    notFoundCard: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
    },
    notFoundText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    notFoundHint: {
        fontSize: 14,
        textAlign: 'center',
    },
    resultCard: {
        padding: 20,
        borderRadius: 16,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 20,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    mobile: {
        fontSize: 14,
        marginBottom: 20,
    },
    pointsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    pointBox: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
    },
    pointLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    pointValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    viewButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
