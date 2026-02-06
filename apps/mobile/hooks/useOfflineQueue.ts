import { useState, useEffect, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
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

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sanderi_loyalty.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        entry_id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING'
      );
    `);
  }
  return db;
}

export function useOfflineQueue(): UseOfflineQueueResult {
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useNetwork();

  const loadQueue = useCallback(async () => {
    try {
      const database = await getDb();
      const rows = await database.getAllAsync<{
        entry_id: string;
        action_type: string;
        payload: string;
        created_at: string;
        status: string;
        retry_count: number;
      }>('SELECT * FROM offline_queue ORDER BY created_at ASC');

      setQueue(
        rows.map((row) => ({
          entryId: row.entry_id,
          actionType: row.action_type as OfflineAction['actionType'],
          payload: JSON.parse(row.payload),
          createdAt: row.created_at,
          status: row.status as OfflineAction['status'],
          retryCount: row.retry_count,
        }))
      );
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  }, []);

  const addAction = useCallback(
    async (action: Omit<OfflineAction, 'createdAt' | 'status' | 'retryCount'>) => {
      const database = await getDb();

      // Check queue size
      const countResult = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM offline_queue WHERE status != "SUCCESS"'
      );

      if ((countResult?.count || 0) >= MAX_QUEUE_SIZE) {
        throw new Error('Offline queue is full');
      }

      const createdAt = new Date().toISOString();

      await database.runAsync(
        'INSERT INTO offline_queue (entry_id, action_type, payload, created_at, status, retry_count) VALUES (?, ?, ?, ?, ?, ?)',
        [
          action.entryId,
          action.actionType,
          JSON.stringify(action.payload),
          createdAt,
          'PENDING',
          0,
        ]
      );

      await loadQueue();

      // Try to sync immediately if online
      if (isOnline) {
        syncQueue();
      }
    },
    [isOnline, loadQueue]
  );

  const syncQueue = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    const database = await getDb();

    try {
      // Get pending actions
      const pending = await database.getAllAsync<{
        entry_id: string;
        action_type: string;
        payload: string;
        created_at: string;
        retry_count: number;
      }>(
        'SELECT * FROM offline_queue WHERE status = "PENDING" OR (status = "FAILED" AND retry_count < ?) ORDER BY created_at ASC',
        [MAX_RETRIES]
      );

      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Format for batch sync
      const actions = pending.map((row) => ({
        actionType: row.action_type,
        entryId: row.entry_id,
        createdAt: row.created_at,
        ...JSON.parse(row.payload),
      }));

      // Update status to syncing
      for (const row of pending) {
        await database.runAsync(
          'UPDATE offline_queue SET status = ? WHERE entry_id = ?',
          ['SYNCING', row.entry_id]
        );
      }

      await loadQueue();

      // Send to server
      const response = await api.post('/sync/offline-actions', { actions });
      const results = response.data.results as Array<{
        entryId: string;
        success: boolean;
        error?: string;
      }>;

      // Update based on results
      for (const result of results) {
        if (result.success) {
          await database.runAsync(
            'UPDATE offline_queue SET status = ? WHERE entry_id = ?',
            ['SUCCESS', result.entryId]
          );
        } else {
          const row = pending.find((p) => p.entry_id === result.entryId);
          const newRetryCount = (row?.retry_count || 0) + 1;
          await database.runAsync(
            'UPDATE offline_queue SET status = ?, retry_count = ? WHERE entry_id = ?',
            ['FAILED', newRetryCount, result.entryId]
          );
        }
      }

      // Clean up successful entries (keep for history)
      // await database.runAsync('DELETE FROM offline_queue WHERE status = "SUCCESS"');

      await loadQueue();
    } catch (error) {
      console.error('Sync failed:', error);

      // Revert syncing status to pending
      await database.runAsync(
        'UPDATE offline_queue SET status = "PENDING" WHERE status = "SYNCING"'
      );
      await loadQueue();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, loadQueue]);

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
