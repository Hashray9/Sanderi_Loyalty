import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { useNetwork } from './useNetwork';

export interface OfflineAction {
    entryId: string;
    actionType: 'ENROLL' | 'CREDIT' | 'DEBIT' | 'BLOCK' | 'VOID';
    payload: Record<string, unknown>;
    createdAt: string;
    status: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED';
    retryCount: number;
}

interface UseOfflineQueueResult {
    queue: OfflineAction[];
    queueCount: number;
    isSyncing: boolean;
    addAction: (action: Omit<OfflineAction, 'createdAt' | 'status' | 'retryCount'>) => Promise<void>;
    syncQueue: () => Promise<void>;
    loadQueue: () => Promise<void>;
}

const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 50;
const QUEUE_KEY = '@sanderi_offline_queue';

export function useOfflineQueue(): UseOfflineQueueResult {
    const [queue, setQueue] = useState<OfflineAction[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const { isOnline } = useNetwork();

    const loadQueue = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(QUEUE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as OfflineAction[];
                setQueue(parsed);
            }
        } catch (error) {
            console.error('Failed to load queue:', error);
        }
    }, []);

    const saveQueue = useCallback(async (newQueue: OfflineAction[]) => {
        try {
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
            setQueue(newQueue);
        } catch (error) {
            console.error('Failed to save queue:', error);
        }
    }, []);

    const addAction = useCallback(
        async (action: Omit<OfflineAction, 'createdAt' | 'status' | 'retryCount'>) => {
            const currentQueue = [...queue];

            // Check queue size - only pending/failed actions
            const pendingCount = currentQueue.filter(
                a => a.status === 'PENDING' || a.status === 'FAILED'
            ).length;

            if (pendingCount >= MAX_QUEUE_SIZE) {
                throw new Error('Offline queue is full');
            }

            const newAction: OfflineAction = {
                ...action,
                createdAt: new Date().toISOString(),
                status: 'PENDING',
                retryCount: 0,
            };

            const newQueue = [...currentQueue, newAction];
            await saveQueue(newQueue);

            // Try to sync immediately if online
            if (isOnline) {
                syncQueue();
            }
        },
        [queue, isOnline, saveQueue]
    );

    const syncQueue = useCallback(async () => {
        if (isSyncing || !isOnline) return;

        setIsSyncing(true);

        try {
            const stored = await AsyncStorage.getItem(QUEUE_KEY);
            if (!stored) {
                setIsSyncing(false);
                return;
            }

            let currentQueue = JSON.parse(stored) as OfflineAction[];

            // Get pending actions
            const pending = currentQueue.filter(
                a => a.status === 'PENDING' || (a.status === 'FAILED' && a.retryCount < MAX_RETRIES)
            );

            if (pending.length === 0) {
                setIsSyncing(false);
                return;
            }

            // Format for batch sync
            const actions = pending.map((action) => ({
                actionType: action.actionType,
                entryId: action.entryId,
                createdAt: action.createdAt,
                ...action.payload,
            }));

            // Update status to syncing
            currentQueue = currentQueue.map(a =>
                pending.find(p => p.entryId === a.entryId)
                    ? { ...a, status: 'SYNCING' as const }
                    : a
            );
            await saveQueue(currentQueue);

            // Send to server
            const response = await api.post('/sync/offline-actions', { actions });
            const results = response.data.results as Array<{
                entryId: string;
                success: boolean;
                error?: string;
            }>;

            // Update based on results
            currentQueue = currentQueue.map(a => {
                const result = results.find(r => r.entryId === a.entryId);
                if (result) {
                    if (result.success) {
                        return { ...a, status: 'SUCCESS' as const };
                    } else {
                        return {
                            ...a,
                            status: 'FAILED' as const,
                            retryCount: a.retryCount + 1
                        };
                    }
                }
                return a;
            });

            await saveQueue(currentQueue);
        } catch (error) {
            console.error('❌ Sync failed:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }

            // Revert syncing status to pending
            const stored = await AsyncStorage.getItem(QUEUE_KEY);
            if (stored) {
                let currentQueue = JSON.parse(stored) as OfflineAction[];
                currentQueue = currentQueue.map(a =>
                    a.status === 'SYNCING' ? { ...a, status: 'PENDING' as const } : a
                );
                await saveQueue(currentQueue);
            }
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, isOnline, saveQueue]);

    // Auto-sync when coming online
    useEffect(() => {
        if (isOnline) {
            syncQueue();
        }
    }, [isOnline, syncQueue]);

    // Initial load
    useEffect(() => {
        loadQueue();
    }, [loadQueue]);

    const queueCount = queue.filter(
        (a) => a.status === 'PENDING' || a.status === 'FAILED'
    ).length;

    return {
        queue,
        queueCount,
        isSyncing,
        addAction,
        syncQueue,
        loadQueue,
    };
}
