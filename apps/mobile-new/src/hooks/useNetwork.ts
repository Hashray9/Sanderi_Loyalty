import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface UseNetworkResult {
    isOnline: boolean;
    isChecking: boolean;
    checkConnection: () => Promise<boolean>;
}

export function useNetwork(): UseNetworkResult {
    const [isOnline, setIsOnline] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    const checkConnection = useCallback(async (): Promise<boolean> => {
        setIsChecking(true);
        try {
            const state = await NetInfo.fetch();
            const online = (state.isConnected ?? false) && state.isInternetReachable !== false;
            setIsOnline(online);
            return online;
        } catch {
            setIsOnline(false);
            return false;
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        checkConnection();

        // Subscribe to network state changes
        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = (state.isConnected ?? false) && state.isInternetReachable !== false;
            setIsOnline(online);
        });

        return () => unsubscribe();
    }, [checkConnection]);

    return {
        isOnline,
        isChecking,
        checkConnection,
    };
}
