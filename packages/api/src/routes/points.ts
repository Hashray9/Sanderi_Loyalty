import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { creditPoints, debitPointsFIFO, voidTransaction } from '../services/pointService.js';
import { CardStatus, PointCategory } from '@prisma/client';

export const pointsRouter = Router();

pointsRouter.use(authMiddleware);

// Credit points
const creditSchema = z.object({
  body: z.object({
    entryId: z.string().uuid(),
    cardUid: z.string().min(1),
    category: z.enum(['HARDWARE', 'PLYWOOD']),
    amount: z.number().positive(),
  }),
});

pointsRouter.post('/credit', validate(creditSchema), async (req, res, next) => {
  try {
    const { entryId, cardUid, category, amount } = req.body;
    const { staffId, storeId, franchiseeId } = req.auth!;

    // Get card and verify
    const card = await prisma.card.findUnique({ where: { cardUid } });

    if (!card) {
      throw new AppError(404, 'Card not found', 'CARD_NOT_FOUND');
    }

    if (card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    if (card.status !== CardStatus.ACTIVE) {
      throw new AppError(400, `Card is ${card.status.toLowerCase()}`, 'CARD_NOT_ACTIVE');
    }

    // Get conversion rate from store
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError(500, 'Store not found', 'STORE_NOT_FOUND');
    }

    const conversionRate = category === 'HARDWARE'
      ? store.hardwareConversionRate
      : store.plywoodConversionRate;

    const result = await creditPoints({
      entryId,
      cardUid,
      storeId,
      staffId,
      category: category as PointCategory,
      amount,
      conversionRate,
    });

    res.json({
      success: true,
      pointsAdded: result.pointsDelta,
      newBalance: result.newBalance,
      category,
    });
  } catch (error) {
    next(error);
  }
});

// Debit points
const debitSchema = z.object({
  body: z.object({
    entryId: z.string().uuid(),
    cardUid: z.string().min(1),
    category: z.enum(['HARDWARE', 'PLYWOOD']),
    points: z.number().positive().int(),
  }),
});

pointsRouter.post('/debit', validate(debitSchema), async (req, res, next) => {
  try {
    const { entryId, cardUid, category, points } = req.body;
    const { staffId, storeId, franchiseeId } = req.auth!;

    // Get card and verify
    const card = await prisma.card.findUnique({ where: { cardUid } });

    if (!card) {
      throw new AppError(404, 'Card not found', 'CARD_NOT_FOUND');
    }

    if (card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    if (card.status !== CardStatus.ACTIVE) {
      throw new AppError(400, `Card is ${card.status.toLowerCase()}`, 'CARD_NOT_ACTIVE');
    }

    const result = await debitPointsFIFO({
      entryId,
      cardUid,
      storeId,
      staffId,
      category: category as PointCategory,
      pointsToDebit: points,
    });

    res.json({
      success: true,
      pointsDeducted: Math.abs(result.pointsDelta),
      newBalance: result.newBalance,
      category,
    });
  } catch (error) {
    next(error);
  }
});

// Void transaction
const voidSchema = z.object({
  params: z.object({
    entryId: z.string().min(1),
  }),
});

pointsRouter.post('/:entryId/void', validate(voidSchema), async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { staffId, franchiseeId } = req.auth!;

    // Verify the entry exists and belongs to the same franchisee
    const entry = await prisma.pointEntry.findUnique({
      where: { entryId },
      include: { card: true },
    });

    if (!entry) {
      throw new AppError(404, 'Transaction not found', 'ENTRY_NOT_FOUND');
    }

    if (entry.card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Transaction belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    await voidTransaction(entryId, staffId);

    res.json({
      success: true,
      message: 'Transaction voided successfully',
    });
  } catch (error) {
    next(error);
  }
});
