import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';

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
      const state = await Network.getNetworkStateAsync();
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

    // Check connection periodically
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isOnline,
    isChecking,
    checkConnection,
  };
}
