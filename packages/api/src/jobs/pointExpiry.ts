import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { TransactionType, PointCategory } from '@prisma/client';

export async function processPointExpiry(): Promise<{
  processedCount: number;
  totalPointsExpired: number;
}> {
  const now = new Date();

  // Find all credit entries with remaining points that have expired
  const expiredEntries = await prisma.pointEntry.findMany({
    where: {
      transactionType: TransactionType.CREDIT,
      pointsRemaining: { gt: 0 },
      expiresAt: { lte: now },
      voidedAt: null,
    },
    include: {
      card: true,
    },
  });

  let processedCount = 0;
  let totalPointsExpired = 0;

  for (const entry of expiredEntries) {
    const pointsToExpire = entry.pointsRemaining || 0;
    if (pointsToExpire <= 0) continue;

    const balanceField = entry.category === PointCategory.HARDWARE
      ? 'hardwarePoints'
      : 'plywoodPoints';

    try {
      await prisma.$transaction(async (tx) => {
        // Create expiry entry
        await tx.pointEntry.create({
          data: {
            entryId: `expiry-${entry.id}-${Date.now()}`,
            cardUid: entry.cardUid,
            storeId: entry.storeId,
            staffId: entry.staffId, // Use original staff for audit
            category: entry.category,
            transactionType: TransactionType.EXPIRY,
            amount: 0,
            pointsDelta: -pointsToExpire,
          },
        });

        // Mark original entry as fully used
        await tx.pointEntry.update({
          where: { id: entry.id },
          data: { pointsRemaining: 0 },
        });

        // Update card balance
        await tx.card.update({
          where: { cardUid: entry.cardUid },
          data: {
            [balanceField]: { decrement: pointsToExpire },
          },
        });
      });

      processedCount++;
      totalPointsExpired += pointsToExpire;
    } catch (error) {
      console.error(`Failed to process expiry for entry ${entry.id}:`, error);
    }
  }

  console.log(`Point expiry job completed: ${processedCount} entries, ${totalPointsExpired} points expired`);
  return { processedCount, totalPointsExpired };
}

export function startExpiryJob(): void {
  // Run on 1st of each month at 2:00 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('Starting monthly point expiry job...');
    try {
      await processPointExpiry();
    } catch (error) {
      console.error('Point expiry job failed:', error);
    }
  });

  console.log('Point expiry job scheduled');
}
