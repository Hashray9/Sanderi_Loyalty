# Testing Credit/Debit with Test Cards

## Test Cards Available

| Card UID | Customer Name | Mobile      | Hardware Points | Plywood Points |
|----------|---------------|-------------|-----------------|----------------|
| TEST001  | Rahul Sharma  | 9876543210  | 150             | 75             |
| TEST002  | Priya Patel   | 9876543211  | 500             | 250            |
| TEST003  | Amit Kumar    | 9876543212  | 0               | 100            |

## How to Test

### 1. Lookup a Card
- Open the mobile app
- Go to "Lookup" or scan screen
- Enter one of the test card UIDs (e.g., `TEST001`) or mobile numbers (e.g., `9876543210`)
- You should see the card details with current point balances

### 2. Credit Points
- After looking up a card, tap on a category (HARDWARE or PLYWOOD)
- Tap "Credit" button
- Enter an amount (e.g., ₹500)
- The app will calculate points based on conversion rate (default: ₹100 = 1 point)
- Tap "Done"
- Check the console logs for any errors

### 3. Debit Points
- After looking up a card, tap on a category
- Tap "Debit" button
- Enter points to redeem (must be ≤ current balance)
- Tap "Done"

## Debugging

### Check Mobile App Logs
Look for these log messages in your React Native console:
- `🌐 API Config:` - Shows the API URL being used
- `❌ Sync failed:` - Shows sync errors with details
- `Error message:` - Specific error message
- `Error stack:` - Stack trace

### Check API Server Logs
Look for these in the API terminal (`npm run dev`):
- `=== SYNC REQUEST ===` - Shows incoming sync requests
- `Actions:` - Shows the actions being processed
- `=== ERROR ===` - Shows any errors with request details

## Common Issues

### 1. "Failed to credit points"
**Possible causes:**
- Network connectivity issue
- API server not running
- Invalid ngrok URL in `.env`
- Validation error (check API logs)

**Solution:**
- Check if API is running on port 3000
- Verify ngrok URL is correct and active
- Check both mobile and API logs for specific error

### 2. UUID Validation Error
**Symptom:** API logs show validation error about UUID
**Cause:** The `entryId` must be a valid UUID v4 format
**Solution:** Already handled - app uses `uuid` package to generate valid UUIDs

### 3. Card Not Found
**Symptom:** Error says "Card not found"
**Cause:** Card UID doesn't exist in database
**Solution:** Use one of the test card UIDs listed above

## Next Steps

If you're still seeing "Failed to credit points":
1. Try the credit operation again
2. Check the mobile app console for the detailed error
3. Check the API terminal for the sync request logs
4. Share the error messages from both logs

The enhanced logging should now show exactly what's failing!
