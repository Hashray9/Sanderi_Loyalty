import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { creditPoints, debitPointsFIFO, voidTransaction } from '../services/pointService.js';
import { CardStatus, PointCategory, BlockReason } from '@prisma/client';

export const syncRouter = Router();

syncRouter.use(authMiddleware);

const MAX_OFFLINE_QUEUE = parseInt(process.env.MAX_OFFLINE_QUEUE || '50', 10);

const offlineActionSchema = z.discriminatedUnion('actionType', [
  z.object({
    actionType: z.literal('ENROLL'),
    entryId: z.string().uuid(),
    cardUid: z.string().min(1),
    customerName: z.string().min(1),
    customerMobile: z.string().min(10).max(15),
    createdAt: z.string().datetime(),
  }),
  z.object({
    actionType: z.literal('CREDIT'),
    entryId: z.string().uuid(),
    cardUid: z.string().min(1),
    category: z.enum(['HARDWARE', 'PLYWOOD']),
    amount: z.number().positive(),
    createdAt: z.string().datetime(),
  }),
  z.object({
    actionType: z.literal('DEBIT'),
    entryId: z.string().uuid(),
    cardUid: z.string().min(1),
    category: z.enum(['HARDWARE', 'PLYWOOD']),
    points: z.number().positive().int(),
    createdAt: z.string().datetime(),
  }),
  z.object({
    actionType: z.literal('BLOCK'),
    entryId: z.string().uuid(),
    cardUid: z.string().min(1),
    reason: z.enum(['LOST', 'STOLEN', 'FRAUD', 'OTHER']),
    createdAt: z.string().datetime(),
  }),
  z.object({
    actionType: z.literal('VOID'),
    entryId: z.string().uuid(),
    originalEntryId: z.string().uuid(),
    createdAt: z.string().datetime(),
  }),
]);

const syncSchema = z.object({
  body: z.object({
    actions: z.array(offlineActionSchema).max(MAX_OFFLINE_QUEUE),
  }),
});

interface SyncResult {
  entryId: string;
  success: boolean;
  error?: string;
  code?: string;
}

syncRouter.post('/offline-actions', validate(syncSchema), async (req, res, next) => {
  try {
    const { actions } = req.body;
    const { staffId, storeId, franchiseeId } = req.auth!;

    // Get store for conversion rates
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new AppError(500, 'Store not found', 'STORE_NOT_FOUND');
    }

    const results: SyncResult[] = [];

    // Process each action sequentially to maintain order
    for (const action of actions) {
      try {
        // Check if already processed (idempotency)
        const existing = await prisma.processedEntry.findUnique({
          where: { entryId: action.entryId },
        });

        if (existing) {
          results.push({ entryId: action.entryId, success: true });
          continue;
        }

        switch (action.actionType) {
          case 'ENROLL': {
            const existingHolder = await prisma.cardHolder.findUnique({
              where: { mobileNumber: action.customerMobile },
            });

            if (existingHolder) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: 'Mobile number already registered',
                code: 'MOBILE_ALREADY_REGISTERED',
              });
              continue;
            }

            let card = await prisma.card.findUnique({ where: { cardUid: action.cardUid } });

            await prisma.$transaction(async (tx) => {
              if (!card) {
                card = await tx.card.create({
                  data: {
                    cardUid: action.cardUid,
                    franchiseeId,
                    status: CardStatus.ACTIVE,
                    issuedById: staffId,
                  },
                });
              } else {
                if (card.status !== CardStatus.UNASSIGNED) {
                  throw new AppError(400, 'Card already enrolled', 'CARD_ALREADY_ENROLLED');
                }
                await tx.card.update({
                  where: { cardUid: action.cardUid },
                  data: { status: CardStatus.ACTIVE, issuedById: staffId },
                });
              }

              await tx.cardHolder.create({
                data: {
                  cardUid: action.cardUid,
                  name: action.customerName,
                  mobileNumber: action.customerMobile,
                },
              });

              await tx.processedEntry.create({ data: { entryId: action.entryId } });
            });

            results.push({ entryId: action.entryId, success: true });
            break;
          }

          case 'CREDIT': {
            const card = await prisma.card.findUnique({ where: { cardUid: action.cardUid } });

            if (!card) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: 'Card not found',
                code: 'CARD_NOT_FOUND',
              });
              continue;
            }

            if (card.status !== CardStatus.ACTIVE) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: `Card is ${card.status.toLowerCase()}`,
                code: 'CARD_NOT_ACTIVE',
              });
              continue;
            }

            const conversionRate = action.category === 'HARDWARE'
              ? store.hardwareConversionRate
              : store.plywoodConversionRate;

            await creditPoints({
              entryId: action.entryId,
              cardUid: action.cardUid,
              storeId,
              staffId,
              category: action.category as PointCategory,
              amount: action.amount,
              conversionRate,
            });

            results.push({ entryId: action.entryId, success: true });
            break;
          }

          case 'DEBIT': {
            const card = await prisma.card.findUnique({ where: { cardUid: action.cardUid } });

            if (!card) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: 'Card not found',
                code: 'CARD_NOT_FOUND',
              });
              continue;
            }

            if (card.status !== CardStatus.ACTIVE) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: `Card is ${card.status.toLowerCase()}`,
                code: 'CARD_NOT_ACTIVE',
              });
              continue;
            }

            const balance = action.category === 'HARDWARE' ? card.hardwarePoints : card.plywoodPoints;
            if (balance < action.points) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: 'Insufficient balance',
                code: 'INSUFFICIENT_BALANCE',
              });
              continue;
            }

            await debitPointsFIFO({
              entryId: action.entryId,
              cardUid: action.cardUid,
              storeId,
              staffId,
              category: action.category as PointCategory,
              pointsToDebit: action.points,
            });

            results.push({ entryId: action.entryId, success: true });
            break;
          }

          case 'BLOCK': {
            const card = await prisma.card.findUnique({ where: { cardUid: action.cardUid } });

            if (!card) {
              results.push({
                entryId: action.entryId,
                success: false,
                error: 'Card not found',
                code: 'CARD_NOT_FOUND',
              });
              continue;
            }

            if (card.status === CardStatus.BLOCKED) {
              // Already blocked, consider success
              await prisma.processedEntry.create({ data: { entryId: action.entryId } });
              results.push({ entryId: action.entryId, success: true });
              continue;
            }

            await prisma.$transaction(async (tx) => {
              await tx.card.update({
                where: { cardUid: action.cardUid },
                data: { status: CardStatus.BLOCKED },
              });

              await tx.cardBlock.create({
                data: {
                  cardUid: action.cardUid,
                  reason: action.reason as BlockReason,
                  blockedBy: staffId,
                },
              });

              await tx.processedEntry.create({ data: { entryId: action.entryId } });
            });

            results.push({ entryId: action.entryId, success: true });
            break;
          }

          case 'VOID': {
            try {
              await voidTransaction(action.originalEntryId, staffId);
              await prisma.processedEntry.create({ data: { entryId: action.entryId } });
              results.push({ entryId: action.entryId, success: true });
            } catch (error) {
              if (error instanceof AppError) {
                results.push({
                  entryId: action.entryId,
                  success: false,
                  error: error.message,
                  code: error.code,
                });
              } else {
                throw error;
              }
            }
            break;
          }
        }
      } catch (error) {
        if (error instanceof AppError) {
          results.push({
            entryId: action.entryId,
            success: false,
            error: error.message,
            code: error.code,
          });
        } else {
          console.error(`Failed to process action ${action.entryId}:`, error);
          results.push({
            entryId: action.entryId,
            success: false,
            error: 'Internal error',
            code: 'INTERNAL_ERROR',
          });
        }
      }
    }

    res.json({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    next(error);
  }
});
