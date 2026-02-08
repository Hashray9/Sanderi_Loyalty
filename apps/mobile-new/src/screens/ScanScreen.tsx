import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useNfc } from '@/hooks/useNfc';
import { useNetwork } from '@/hooks/useNetwork';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { OfflineBanner } from '@/components/OfflineBanner';
import { FloatingCard } from '@/components/FloatingCard';
import { PulsingText } from '@/components/PulsingText';
import { SparkleParticles } from '@/components/SparkleParticles';

export default function ScanScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { isSupported, isEnabled, startScan, stopScan, scannedCard, clearScanned } =
        useNfc();
    const { isOnline } = useNetwork();
    const { queueCount } = useOfflineQueue();
    const [isScanning, setIsScanning] = useState(false);
    const [sparkle, setSparkle] = useState(false);
    const [pendingNav, setPendingNav] = useState<string | null>(null);

    const handleStartScan = useCallback(async () => {
        if (!isSupported) {
            Alert.alert(t('nfc.notSupported'), t('nfc.notSupportedMessage'));
            return;
        }

        if (!isEnabled) {
            Alert.alert(t('nfc.disabled'), t('nfc.enableNfc'));
            return;
        }

        setIsScanning(true);
        try {
            await startScan();
        } catch {
            Alert.alert(t('common.error'), t('nfc.scanFailed'));
            setIsScanning(false);
        }
    }, [isSupported, isEnabled, startScan, t]);

    const handleStopScan = useCallback(async () => {
        await stopScan();
        setIsScanning(false);
    }, [stopScan]);

    useEffect(() => {
        if (scannedCard) {
            setIsScanning(false);
            setSparkle(true);
            setPendingNav(scannedCard);
            clearScanned();
        }
    }, [scannedCard, clearScanned]);

    const handleSparkleComplete = useCallback(() => {
        setSparkle(false);
        if (pendingNav) {
            navigation.navigate('Card', { cardUid: pendingNav });
            setPendingNav(null);
        }
    }, [pendingNav, navigation]);

    useEffect(() => {
        return () => {
            stopScan();
        };
    }, [stopScan]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <OfflineBanner isOnline={isOnline} />

            {queueCount > 0 && (
                <View style={[styles.syncBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.syncText, { color: colors.warning }]}>
                        {queueCount} {t('status.pendingSync')}
                    </Text>
                </View>
            )}

            <View style={styles.centerArea}>
                <View style={styles.cardWrapper}>
                    <SparkleParticles trigger={sparkle} onComplete={handleSparkleComplete} />
                    <FloatingCard isScanning={isScanning} />
                </View>

                <PulsingText
                    text={isScanning ? t('scan.holdNearCard') : t('scan.tapToScan')}
                    style={[styles.hintText, { color: colors.textSecondary }]}
                />

                <TouchableOpacity
                    style={[
                        styles.scanButton,
                        {
                            backgroundColor: isScanning ? colors.error : colors.primary,
                        },
                    ]}
                    onPress={isScanning ? handleStopScan : handleStartScan}
                    activeOpacity={0.8}
                >
                    <Text style={styles.scanButtonText}>
                        {isScanning ? t('scan.cancel') : t('scan.startScan')}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    syncBadge: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    syncText: {
        fontSize: 12,
        fontWeight: '600',
    },
    centerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    cardWrapper: {
        marginBottom: 40,
    },
    hintText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 32,
        textAlign: 'center',
    },
    scanButton: {
        paddingHorizontal: 56,
        paddingVertical: 16,
        borderRadius: 28,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
