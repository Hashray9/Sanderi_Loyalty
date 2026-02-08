import { useState, useEffect, useCallback } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

interface UseNfcResult {
    isSupported: boolean;
    isEnabled: boolean;
    isScanning: boolean;
    scannedCard: string | null;
    error: string | null;
    startScan: () => Promise<void>;
    stopScan: () => Promise<void>;
    clearScanned: () => void;
}

export function useNfc(): UseNfcResult {
    const [isSupported, setIsSupported] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCard, setScannedCard] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkNfcSupport();
        return () => {
            NfcManager.cancelTechnologyRequest().catch(() => { });
        };
    }, []);

    const checkNfcSupport = async () => {
        try {
            const supported = await NfcManager.isSupported();
            setIsSupported(supported);

            if (supported) {
                await NfcManager.start();
                const enabled = await NfcManager.isEnabled();
                setIsEnabled(enabled);
            }
        } catch (err) {
            console.error('NFC check failed:', err);
            setIsSupported(false);
        }
    };

    const startScan = useCallback(async () => {
        setError(null);
        setScannedCard(null);
        setIsScanning(true);

        try {
            await NfcManager.requestTechnology(NfcTech.NfcA);
            const tag = await NfcManager.getTag();

            if (tag?.id) {
                // Convert byte array to hex string
                const uid = tag.id.toUpperCase();
                setScannedCard(uid);
            } else {
                setError('Failed to read card UID');
            }
        } catch (err) {
            if ((err as Error).message !== 'cancelled') {
                setError('Failed to scan card');
                console.error('NFC scan error:', err);
            }
        } finally {
            await NfcManager.cancelTechnologyRequest();
            setIsScanning(false);
        }
    }, []);

    const stopScan = useCallback(async () => {
        try {
            await NfcManager.cancelTechnologyRequest();
        } catch {
            // Ignore errors when canceling
        }
        setIsScanning(false);
    }, []);

    const clearScanned = useCallback(() => {
        setScannedCard(null);
        setError(null);
    }, []);

    return {
        isSupported,
        isEnabled,
        isScanning,
        scannedCard,
        error,
        startScan,
        stopScan,
        clearScanned,
    };
}
