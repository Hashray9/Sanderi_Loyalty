import { prisma } from '../lib/prisma.js';
import { PointCategory, TransactionType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const POINT_EXPIRY_MONTHS = parseInt(process.env.POINT_EXPIRY_MONTHS || '12', 10);
const VOID_WINDOW_DAYS = parseInt(process.env.VOID_WINDOW_DAYS || '7', 10);

export function calculatePoints(amount: number, conversionRate: number): number {
  return Math.floor(amount / conversionRate);
}

export function getExpiryDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + POINT_EXPIRY_MONTHS);
  return date;
}

interface CreditPointsParams {
  entryId: string;
  cardUid: string;
  storeId: string;
  staffId: string;
  category: PointCategory;
  amount: number;
  conversionRate: number;
}

export async function creditPoints(params: CreditPointsParams): Promise<{
  pointsDelta: number;
  newBalance: number;
}> {
  const { entryId, cardUid, storeId, staffId, category, amount, conversionRate } = params;

  // Check idempotency
  const existing = await prisma.processedEntry.findUnique({
    where: { entryId },
  });

  if (existing) {
    // Return current balance for idempotent response
    const card = await prisma.card.findUnique({ where: { cardUid } });
    const balance = category === 'HARDWARE' ? card?.hardwarePoints : card?.plywoodPoints;
    return { pointsDelta: 0, newBalance: balance || 0 };
  }

  const pointsDelta = calculatePoints(amount, conversionRate);

  if (pointsDelta <= 0) {
    throw new AppError(400, 'Amount too small to earn points', 'INSUFFICIENT_AMOUNT');
  }

  const expiresAt = getExpiryDate();
  const balanceField = category === 'HARDWARE' ? 'hardwarePoints' : 'plywoodPoints';

  const result = await prisma.$transaction(async (tx) => {
    // Create point entry
    await tx.pointEntry.create({
      data: {
        entryId,
        cardUid,
        storeId,
        staffId,
        category,
        transactionType: TransactionType.CREDIT,
        amount,
        pointsDelta,
        pointsRemaining: pointsDelta,
        expiresAt,
      },
    });

    // Update card balance
    const updatedCard = await tx.card.update({
      where: { cardUid },
      data: {
        [balanceField]: { increment: pointsDelta },
      },
    });

    // Mark as processed
    await tx.processedEntry.create({
      data: { entryId },
    });

    return {
      pointsDelta,
      newBalance: category === 'HARDWARE' ? updatedCard.hardwarePoints : updatedCard.plywoodPoints,
    };
  });

  return result;
}

interface DebitPointsParams {
  entryId: string;
  cardUid: string;
  storeId: string;
  staffId: string;
  category: PointCategory;
  pointsToDebit: number;
}

export async function debitPointsFIFO(params: DebitPointsParams): Promise<{
  pointsDelta: number;
  newBalance: number;
}> {
  const { entryId, cardUid, storeId, staffId, category, pointsToDebit } = params;

  // Check idempotency
  const existing = await prisma.processedEntry.findUnique({
    where: { entryId },
  });

  if (existing) {
    const card = await prisma.card.findUnique({ where: { cardUid } });
    const balance = category === 'HARDWARE' ? card?.hardwarePoints : card?.plywoodPoints;
    return { pointsDelta: 0, newBalance: balance || 0 };
  }

  const card = await prisma.card.findUnique({ where: { cardUid } });
  if (!card) {
    throw new AppError(404, 'Card not found', 'CARD_NOT_FOUND');
  }

  const currentBalance = category === 'HARDWARE' ? card.hardwarePoints : card.plywoodPoints;
  if (currentBalance < pointsToDebit) {
    throw new AppError(400, 'Insufficient points balance', 'INSUFFICIENT_BALANCE');
  }

  const balanceField = category === 'HARDWARE' ? 'hardwarePoints' : 'plywoodPoints';

  const result = await prisma.$transaction(async (tx) => {
    // Get available credit entries ordered by expiry (oldest first - FIFO)
    const creditEntries = await tx.pointEntry.findMany({
      where: {
        cardUid,
        category,
        transactionType: TransactionType.CREDIT,
        pointsRemaining: { gt: 0 },
        voidedAt: null,
      },
      orderBy: { expiresAt: 'asc' },
    });

    let remainingToDebit = pointsToDebit;

    // Deduct from oldest entries first
    for (const entry of creditEntries) {
      if (remainingToDebit <= 0) break;

      const deductFromThis = Math.min(entry.pointsRemaining || 0, remainingToDebit);

      await tx.pointEntry.update({
        where: { id: entry.id },
        data: {
          pointsRemaining: (entry.pointsRemaining || 0) - deductFromThis,
        },
      });

      remainingToDebit -= deductFromThis;
    }

    // Create debit entry
    await tx.pointEntry.create({
      data: {
        entryId,
        cardUid,
        storeId,
        staffId,
        category,
        transactionType: TransactionType.DEBIT,
        amount: 0, // Debits don't have a transaction amount
        pointsDelta: -pointsToDebit,
      },
    });

    // Update card balance
    const updatedCard = await tx.card.update({
      where: { cardUid },
      data: {
        [balanceField]: { decrement: pointsToDebit },
      },
    });

    // Mark as processed
    await tx.processedEntry.create({
      data: { entryId },
    });

    return {
      pointsDelta: -pointsToDebit,
      newBalance: category === 'HARDWARE' ? updatedCard.hardwarePoints : updatedCard.plywoodPoints,
    };
  });

  return result;
}

export async function voidTransaction(
  originalEntryId: string,
  staffId: string
): Promise<void> {
  const entry = await prisma.pointEntry.findUnique({
    where: { entryId: originalEntryId },
  });

  if (!entry) {
    throw new AppError(404, 'Transaction not found', 'ENTRY_NOT_FOUND');
  }

  if (entry.voidedAt) {
    throw new AppError(400, 'Transaction already voided', 'ALREADY_VOIDED');
  }

  // Check void window
  const daysSinceCreation = Math.floor(
    (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreation > VOID_WINDOW_DAYS) {
    throw new AppError(400, `Cannot void transactions older than ${VOID_WINDOW_DAYS} days`, 'VOID_WINDOW_EXPIRED');
  }

  const balanceField = entry.category === 'HARDWARE' ? 'hardwarePoints' : 'plywoodPoints';
  const voidEntryId = `void-${originalEntryId}`;

  await prisma.$transaction(async (tx) => {
    // Mark original entry as voided
    await tx.pointEntry.update({
      where: { id: entry.id },
      data: {
        voidedAt: new Date(),
        voidedById: staffId,
        pointsRemaining: 0, // If it was a credit, no longer available
      },
    });

    // Create void reversal entry
    await tx.pointEntry.create({
      data: {
        entryId: voidEntryId,
        cardUid: entry.cardUid,
        storeId: entry.storeId,
        staffId,
        category: entry.category,
        transactionType: TransactionType.VOID,
        amount: entry.amount,
        pointsDelta: -entry.pointsDelta, // Reverse the delta
      },
    });

    // Update card balance (reverse the original delta)
    await tx.card.update({
      where: { cardUid: entry.cardUid },
      data: {
        [balanceField]: { decrement: entry.pointsDelta },
      },
    });

    await tx.processedEntry.create({
      data: { entryId: voidEntryId },
    });
  });
}

export async function getExpiringPoints(
  cardUid: string,
  category: PointCategory,
  withinDays: number = 30
): Promise<{ points: number; expiresAt: Date | null }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + withinDays);

  const entries = await prisma.pointEntry.findMany({
    where: {
      cardUid,
      category,
      transactionType: TransactionType.CREDIT,
      pointsRemaining: { gt: 0 },
      expiresAt: { lte: cutoffDate },
      voidedAt: null,
    },
    orderBy: { expiresAt: 'asc' },
  });

  if (entries.length === 0) {
    return { points: 0, expiresAt: null };
  }

  const totalPoints = entries.reduce((sum, e) => sum + (e.pointsRemaining || 0), 0);
  const earliestExpiry = entries[0].expiresAt;

  return { points: totalPoints, expiresAt: earliestExpiry };
}

export async function transferPoints(
  oldCardUid: string,
  newCardUid: string,
  staffId: string,
  storeId: string
): Promise<void> {
  const oldCard = await prisma.card.findUnique({ where: { cardUid: oldCardUid } });
  const newCard = await prisma.card.findUnique({ where: { cardUid: newCardUid } });

  if (!oldCard || !newCard) {
    throw new AppError(404, 'One or both cards not found', 'CARD_NOT_FOUND');
  }

  if (oldCard.franchiseeId !== newCard.franchiseeId) {
    throw new AppError(400, 'Cards must belong to same franchisee', 'FRANCHISE_MISMATCH');
  }

  await prisma.$transaction(async (tx) => {
    const entryIdBase = `transfer-${oldCardUid}-${newCardUid}-${Date.now()}`;

    // Transfer hardware points
    if (oldCard.hardwarePoints > 0) {
      await tx.pointEntry.create({
        data: {
          entryId: `${entryIdBase}-hw-out`,
          cardUid: oldCardUid,
          storeId,
          staffId,
          category: PointCategory.HARDWARE,
          transactionType: TransactionType.TRANSFER,
          amount: 0,
          pointsDelta: -oldCard.hardwarePoints,
        },
      });

      await tx.pointEntry.create({
        data: {
          entryId: `${entryIdBase}-hw-in`,
          cardUid: newCardUid,
          storeId,
          staffId,
          category: PointCategory.HARDWARE,
          transactionType: TransactionType.TRANSFER,
          amount: 0,
          pointsDelta: oldCard.hardwarePoints,
          pointsRemaining: oldCard.hardwarePoints,
          expiresAt: getExpiryDate(), // New expiry for transferred points
        },
      });
    }

    // Transfer plywood points
    if (oldCard.plywoodPoints > 0) {
      await tx.pointEntry.create({
        data: {
          entryId: `${entryIdBase}-ply-out`,
          cardUid: oldCardUid,
          storeId,
          staffId,
          category: PointCategory.PLYWOOD,
          transactionType: TransactionType.TRANSFER,
          amount: 0,
          pointsDelta: -oldCard.plywoodPoints,
        },
      });

      await tx.pointEntry.create({
        data: {
          entryId: `${entryIdBase}-ply-in`,
          cardUid: newCardUid,
          storeId,
          staffId,
          category: PointCategory.PLYWOOD,
          transactionType: TransactionType.TRANSFER,
          amount: 0,
          pointsDelta: oldCard.plywoodPoints,
          pointsRemaining: oldCard.plywoodPoints,
          expiresAt: getExpiryDate(),
        },
      });
    }

    // Update balances
    await tx.card.update({
      where: { cardUid: newCardUid },
      data: {
        hardwarePoints: { increment: oldCard.hardwarePoints },
        plywoodPoints: { increment: oldCard.plywoodPoints },
      },
    });

    await tx.card.update({
      where: { cardUid: oldCardUid },
      data: {
        hardwarePoints: 0,
        plywoodPoints: 0,
        status: 'BLOCKED',
      },
    });
  });
}
