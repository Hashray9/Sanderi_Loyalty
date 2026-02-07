# NFC Integration Skill

**Use this skill when**: Working with NFC card reading, react-native-nfc-manager integration.

## Setup & Configuration

### 1. Installation (Already done)

```json
// apps/mobile/app.json
{
  "plugins": [
    ["react-native-nfc-manager", {
      "nfcPermission": "This app uses NFC to read loyalty cards"
    }]
  ]
}
```

After adding this plugin, **must** run:
```bash
npx expo prebuild --clean --platform android
```

### 2. Permissions

Android automatically requests NFC permission. Check `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

## NFC Reading Pattern

### Basic Flow

```typescript
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { Alert } from 'react-native';

// 1. Initialize NFC on app start
useEffect(() => {
  NfcManager.start();
  
  return () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  };
}, []);

// 2. Check if device supports NFC
const checkNFCSupport = async () => {
  const supported = await NfcManager.isSupported();
  if (!supported) {
    Alert.alert('NFC Not Supported', 'This device does not support NFC');
    return false;
  }
  
  const enabled = await NfcManager.isEnabled();
  if (!enabled) {
    Alert.alert('NFC Disabled', 'Please enable NFC in device settings');
    return false;
  }
  
  return true;
};

// 3. Read NFC tag
const readNFCCard = async () => {
  const isSupported = await checkNFCSupport();
  if (!isSupported) return;
  
  try {
    // Request NFC technology
    await NfcManager.requestTechnology(NfcTech.Ndef);
    
    // Read tag
    const tag = await NfcManager.getTag();
    console.log('NFC Tag:', tag);
    
    // Parse NDEF message
    if (tag.ndefMessage && tag.ndefMessage.length > 0) {
      const ndefRecord = tag.ndefMessage[0];
      const payload = Ndef.text.decodePayload(ndefRecord.payload);
      console.log('Card ID:', payload);
      
      // Process card
      await processLoyaltyCard(payload);
    }
  } catch (error) {
    console.error('NFC Read Error:', error);
    Alert.alert('Read Failed', 'Could not read NFC card');
  } finally {
    // Clean up
    NfcManager.cancelTechnologyRequest();
  }
};
```

## Loyalty Card Workflow

### Use Case: Customer Taps Card for Points

```typescript
interface LoyaltyCard {
  cardId: string;
  customerId: string;
  balance: number;
}

const handleNFCTap = async () => {
  try {
    // 1. Show scanning UI
    setIsScanning(true);
    
    // 2. Read card
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    
    // 3. Extract card ID from payload
    const cardId = parseCardId(tag);
    
    // 4. Fetch customer from API
    const customer = await trpc.customers.getByCardId.query({ cardId });
    
    if (!customer) {
      Alert.alert('Invalid Card', 'This card is not registered');
      return;
    }
    
    // 5. Navigate to transaction screen
    router.push({
      pathname: '/transaction',
      params: { customerId: customer.id, cardId },
    });
    
  } catch (error) {
    console.error('NFC Error:', error);
    Alert.alert('Error', 'Failed to read card');
  } finally {
    NfcManager.cancelTechnologyRequest();
    setIsScanning(false);
  }
};

const parseCardId = (tag: any): string => {
  // Parse based on your card format
  if (tag.ndefMessage?.[0]) {
    const record = tag.ndefMessage[0];
    return Ndef.text.decodePayload(record.payload);
  }
  
  // Fallback to tag ID
  return tag.id;
};
```

## Writing to NFC Cards

### Encoding Loyalty Card

```typescript
const writeNFCCard = async (customerId: string, cardId: string) => {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    
    // Create NDEF message
    const bytes = Ndef.encodeMessage([
      Ndef.textRecord(JSON.stringify({ customerId, cardId })),
    ]);
    
    // Write to card
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    
    Alert.alert('Success', 'Card programmed successfully');
  } catch (error) {
    console.error('NFC Write Error:', error);
    Alert.alert('Write Failed', 'Could not write to card');
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
};
```

## UI Components

### Scanning Modal

```typescript
const NFCScanModal = ({ visible, onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  
  useEffect(() => {
    if (visible) {
      startScanning();
    }
    
    return () => {
      NfcManager.cancelTechnologyRequest();
    };
  }, [visible]);
  
  const startScanning = async () => {
    setIsScanning(true);
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      onScan(tag);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest();
    }
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Tap Card to Scan</Text>
          <Image source={require('@/assets/nfc-icon.png')} />
          {isScanning && <ActivityIndicator />}
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};
```

## Error Handling

### Common Errors

1. **NFC Not Supported**
   ```typescript
   const supported = await NfcManager.isSupported();
   if (!supported) {
     // Show message, disable NFC features
   }
   ```

2. **NFC Disabled**
   ```typescript
   const enabled = await NfcManager.isEnabled();
   if (!enabled) {
     Alert.alert('Enable NFC', 'Go to Settings > Connections > NFC', [
       { text: 'Settings', onPress: () => NfcManager.goToNfcSetting() },
       { text: 'Cancel' },
     ]);
   }
   ```

3. **Read Timeout**
   ```typescript
   try {
     await NfcManager.requestTechnology(NfcTech.Ndef, {
       alertMessage: 'Hold your card near the device',
     });
     
     // Add timeout
     const tag = await Promise.race([
       NfcManager.getTag(),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('Timeout')), 10000)
       ),
     ]);
   } catch (error) {
     if (error.message === 'Timeout') {
       Alert.alert('Timeout', 'Please try again');
     }
   }
   ```

## Testing

### Without Physical NFC Cards

Use ADB to simulate:

```bash
# Enable NFC emulation
adb shell settings put secure nfc_payment_default_component 1

# Or use Android Virtual Device with NFC support (API 30+)
```

### With Physical Cards

1. Use NTAG213/215/216 NFC tags (common, cheap)
2. Program with NFC Tools app first
3. Write test data (customer IDs, card IDs)
4. Test read/write in your app

## Offline Support

Store scanned cards locally when offline:

```typescript
const handleOfflineNFC = async (tag: any) => {
  const cardId = parseCardId(tag);
  
  // Check network status
  const isOnline = await NetInfo.fetch().then(s => s.isConnected);
  
  if (!isOnline) {
    // Queue for later sync
    await db.exec(`
      INSERT INTO nfc_queue (cardId, timestamp, action)
      VALUES (?, ?, ?)
    `, [cardId, Date.now(), 'SCAN']);
    
    Alert.alert('Offline', 'Card scanned. Will sync when online.');
  } else {
    // Process immediately
    await processCardOnline(cardId);
  }
};
```

## Best Practices

1. **Always cancel technology request** in cleanup
2. **Check NFC support** before showing NFC features
3. **Provide clear UI feedback** during scanning
4. **Handle timeouts** - users might not tap card
5. **Test with real cards** - emulators are unreliable
6. **Store card data encrypted** if caching locally
7. **Queue offline scans** for later sync

## Debugging

Enable NFC debug logs:

```typescript
NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
  console.log('NFC Tag Discovered:', JSON.stringify(tag, null, 2));
});

NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
  console.log('NFC Session Closed');
});
```

Check logcat for native NFC events:

```bash
adb logcat | grep -i nfc
```
