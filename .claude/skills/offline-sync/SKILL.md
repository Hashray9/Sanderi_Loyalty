# Offline Sync Skill

**Use this skill when**: Implementing offline-first features, SQLite queue, background sync.

## Architecture Overview

```
User Action (Offline)
  ↓
Queue in SQLite
  ↓
Network becomes available
  ↓
Background Sync Service
  ↓
Upload to API
  ↓
Update local DB
  ↓
Remove from queue
```

## Setup expo-sqlite

### Installation (Already done)

```json
// apps/mobile/app.json
{
  "plugins": ["expo-sqlite"]
}
```

After adding, rebuild:
```bash
npx expo prebuild --clean --platform android
```

### Database Initialization

```typescript
// src/lib/database.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('sanderi.db');

export const initDatabase = () => {
  // Queue table for offline actions
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      retries INTEGER DEFAULT 0,
      lastError TEXT
    );
  `);
  
  // Cached data tables
  db.execSync(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      cardId TEXT,
      balance INTEGER DEFAULT 0,
      lastSynced INTEGER
    );
  `);
  
  db.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      customerId TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY(customerId) REFERENCES customers(id)
    );
  `);
};

export default db;
```

## Queue Pattern

### Adding to Queue

```typescript
// src/services/offline-queue.ts
import db from '@/lib/database';

export interface QueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'transaction' | 'customer' | 'nfc_scan';
  data: any;
  timestamp: number;
  retries: number;
  lastError?: string;
}

export const queueAction = async (
  action: QueueItem['action'],
  entity: QueueItem['entity'],
  data: any
): Promise<void> => {
  const timestamp = Date.now();
  const dataJson = JSON.stringify(data);
  
  db.runSync(
    `INSERT INTO sync_queue (action, entity, data, timestamp, retries)
     VALUES (?, ?, ?, ?, 0)`,
    [action, entity, dataJson, timestamp]
  );
  
  console.log(`✅ Queued: ${action} ${entity}`);
  
  // Trigger sync if online
  triggerSyncIfOnline();
};
```

### Processing Queue

```typescript
import NetInfo from '@react-native-community/netinfo';
import { trpc } from '@/lib/trpc';

export const processQueue = async (): Promise<void> => {
  const netState = await NetInfo.fetch();
  
  if (!netState.isConnected) {
    console.log('⚠️ Offline - skipping sync');
    return;
  }
  
  const items = db.getAllSync<QueueItem>(
    `SELECT * FROM sync_queue ORDER BY timestamp ASC`
  );
  
  console.log(`📤 Processing ${items.length} queued items`);
  
  for (const item of items) {
    try {
      await processQueueItem(item);
      
      // Remove from queue on success
      db.runSync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
      console.log(`✅ Synced: ${item.action} ${item.entity} #${item.id}`);
      
    } catch (error) {
      console.error(`❌ Sync failed for #${item.id}:`, error);
      
      // Increment retry count
      db.runSync(
        `UPDATE sync_queue 
         SET retries = retries + 1, lastError = ? 
         WHERE id = ?`,
        [error.message, item.id]
      );
      
      // Give up after 5 retries
      if (item.retries >= 5) {
        console.warn(`⚠️ Giving up on #${item.id} after 5 retries`);
        db.runSync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
      }
    }
  }
};

const processQueueItem = async (item: QueueItem): Promise<void> => {
  const data = JSON.parse(item.data);
  
  switch (item.entity) {
    case 'transaction':
      if (item.action === 'CREATE') {
        await trpc.transactions.create.mutate(data);
      }
      break;
      
    case 'customer':
      if (item.action === 'UPDATE') {
        await trpc.customers.update.mutate(data);
      }
      break;
      
    case 'nfc_scan':
      await trpc.nfc.recordScan.mutate(data);
      break;
      
    default:
      throw new Error(`Unknown entity: ${item.entity}`);
  }
};
```

## Background Sync Service

### Network Listener

```typescript
// src/services/sync-service.ts
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from './offline-queue';

let syncInterval: NodeJS.Timeout | null = null;

export const startSyncService = () => {
  console.log('🚀 Starting sync service');
  
  // Listen for network changes
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log('📡 Network connected - triggering sync');
      processQueue();
      
      // Poll every 30 seconds while online
      if (!syncInterval) {
        syncInterval = setInterval(() => {
          processQueue();
        }, 30000);
      }
    } else {
      console.log('📴 Network disconnected - pausing sync');
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    }
  });
  
  return unsubscribe;
};

export const triggerSyncIfOnline = async () => {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    processQueue();
  }
};
```

### Initialize in App

```typescript
// app/_layout.tsx
import { startSyncService } from '@/services/sync-service';
import { initDatabase } from '@/lib/database';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database
    initDatabase();
    
    // Start sync service
    const unsubscribe = startSyncService();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  return <Slot />;
}
```

## Offline-First Patterns

### Transaction Creation

```typescript
const createTransaction = async (customerId: string, amount: number) => {
  const transaction = {
    id: generateId(), // Local UUID
    customerId,
    amount,
    type: 'PURCHASE',
    timestamp: Date.now(),
    synced: 0,
  };
  
  // 1. Save locally first
  db.runSync(
    `INSERT INTO transactions (id, customerId, amount, type, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [transaction.id, customerId, amount, 'PURCHASE', transaction.timestamp]
  );
  
  // 2. Update customer balance locally
  db.runSync(
    `UPDATE customers SET balance = balance + ? WHERE id = ?`,
    [amount, customerId]
  );
  
  // 3. Queue for sync
  await queueAction('CREATE', 'transaction', transaction);
  
  // 4. Show success immediately (optimistic UI)
  Alert.alert('Success', 'Transaction recorded');
  
  // 5. Sync will happen in background
};
```

### Customer Lookup (Cached)

```typescript
const getCustomer = async (cardId: string) => {
  // 1. Try local cache first
  const local = db.getFirstSync(
    `SELECT * FROM customers WHERE cardId = ?`,
    [cardId]
  );
  
  if (local) {
    console.log('💾 Cache hit for customer:', local.id);
    
    // 2. Refresh in background if online
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      refreshCustomerCache(cardId).catch(console.error);
    }
    
    return local;
  }
  
  // 3. Fetch from API if not cached
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    throw new Error('Customer not found in cache and device is offline');
  }
  
  const remote = await trpc.customers.getByCardId.query({ cardId });
  
  // 4. Cache for next time
  db.runSync(
    `INSERT OR REPLACE INTO customers (id, name, phone, cardId, balance, lastSynced)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [remote.id, remote.name, remote.phone, cardId, remote.balance, Date.now()]
  );
  
  return remote;
};

const refreshCustomerCache = async (cardId: string) => {
  const customer = await trpc.customers.getByCardId.query({ cardId });
  
  db.runSync(
    `UPDATE customers 
     SET name = ?, phone = ?, balance = ?, lastSynced = ?
     WHERE cardId = ?`,
    [customer.name, customer.phone, customer.balance, Date.now(), cardId]
  );
};
```

## Conflict Resolution

### Last-Write-Wins Strategy

```typescript
const syncTransaction = async (localTx: Transaction) => {
  try {
    // Upload to server
    const serverTx = await trpc.transactions.create.mutate(localTx);
    
    // Update local record with server ID and timestamp
    db.runSync(
      `UPDATE transactions 
       SET id = ?, timestamp = ?, synced = 1
       WHERE id = ?`,
      [serverTx.id, serverTx.timestamp, localTx.id]
    );
    
  } catch (error) {
    if (error.code === 'CONFLICT') {
      // Server has newer version - overwrite local
      const serverTx = error.data;
      
      db.runSync(
        `UPDATE transactions 
         SET amount = ?, timestamp = ?, synced = 1
         WHERE id = ?`,
        [serverTx.amount, serverTx.timestamp, localTx.id]
      );
    } else {
      throw error;
    }
  }
};
```

## UI Indicators

### Sync Status Component

```typescript
const SyncStatus = () => {
  const [queueCount, setQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const updateQueueCount = () => {
      const count = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue`
      );
      setQueueCount(count?.count || 0);
    };
    
    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);
    
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected || false);
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);
  
  if (!isOnline) {
    return (
      <View style={styles.banner}>
        <Text>📴 Offline - {queueCount} items queued</Text>
      </View>
    );
  }
  
  if (queueCount > 0) {
    return (
      <View style={styles.banner}>
        <Text>⏳ Syncing {queueCount} items...</Text>
      </View>
    );
  }
  
  return null;
};
```

## Cache Invalidation

### Clear Stale Cache

```typescript
const clearStaleCache = () => {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  // Remove customers not accessed in a week
  db.runSync(
    `DELETE FROM customers WHERE lastSynced < ?`,
    [oneWeekAgo]
  );
  
  // Remove synced transactions older than a month
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  db.runSync(
    `DELETE FROM transactions WHERE synced = 1 AND timestamp < ?`,
    [oneMonthAgo]
  );
};
```

## Testing

### Simulate Offline Mode

```typescript
// In development
const [isOfflineMode, setIsOfflineMode] = useState(false);

// Override network check
const checkNetwork = async () => {
  if (__DEV__ && isOfflineMode) {
    return { isConnected: false };
  }
  return NetInfo.fetch();
};
```

### Manual Sync Trigger

```typescript
// Add to dev menu
const DevMenu = () => (
  <View>
    <Button title="Force Sync" onPress={processQueue} />
    <Button title="Clear Queue" onPress={clearQueue} />
    <Button title="Clear Cache" onPress={clearStaleCache} />
    <Button 
      title={isOfflineMode ? 'Go Online' : 'Go Offline'} 
      onPress={() => setIsOfflineMode(!isOfflineMode)} 
    />
  </View>
);
```

## Best Practices

1. **Always save locally first** - UI should respond immediately
2. **Queue all mutations** - Even if online, queue for reliability
3. **Cache frequently accessed data** - Reduce API calls
4. **Handle conflicts gracefully** - Last-write-wins or manual resolution
5. **Show sync status** - Users should know what's happening
6. **Expire old cache** - Don't let database grow forever
7. **Retry with backoff** - Don't spam failed requests
8. **Test offline thoroughly** - Airplane mode, throttled connections
