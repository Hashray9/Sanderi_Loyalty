import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { getExpiringPoints, transferPoints } from '../services/pointService.js';
import { CardStatus, BlockReason } from '@prisma/client';

export const cardsRouter = Router();

// All card routes require authentication
cardsRouter.use(authMiddleware);

// Get card status
cardsRouter.get('/:cardUid/status', async (req, res, next) => {
  try {
    const { cardUid } = req.params;

    const card = await prisma.card.findUnique({
      where: { cardUid },
      include: {
        cardHolder: true,
        franchisee: true,
      },
    });

    if (!card) {
      throw new AppError(404, 'Card not found', 'CARD_NOT_FOUND');
    }

    // Verify card belongs to staff's franchisee
    if (card.franchiseeId !== req.auth!.franchiseeId) {
      throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    // Get expiring points info
    const [hardwareExpiring, plywoodExpiring] = await Promise.all([
      getExpiringPoints(cardUid, 'HARDWARE', 30),
      getExpiringPoints(cardUid, 'PLYWOOD', 30),
    ]);

    res.json({
      cardUid: card.cardUid,
      status: card.status,
      hardwarePoints: card.hardwarePoints,
      plywoodPoints: card.plywoodPoints,
      holder: card.cardHolder
        ? {
            name: card.cardHolder.name,
            mobileNumber: card.cardHolder.mobileNumber,
          }
        : null,
      expiringPoints: {
        hardware: hardwareExpiring,
        plywood: plywoodExpiring,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Enroll new card
const enrollSchema = z.object({
  body: z.object({
    cardUid: z.string().min(1),
    customerName: z.string().min(1),
    customerAadhaar: z.string().length(12, 'Aadhaar number must be 12 digits'),
    customerMobile: z.string().min(10).max(15),
  }),
});

cardsRouter.post('/enroll', validate(enrollSchema), async (req, res, next) => {
  try {
    const { cardUid, customerName, customerAadhaar, customerMobile } = req.body;
    const { staffId, franchiseeId } = req.auth!;

    // Check if card exists
    let card = await prisma.card.findUnique({
      where: { cardUid },
    });

    if (card) {
      if (card.status !== CardStatus.UNASSIGNED) {
        throw new AppError(400, 'Card is already enrolled', 'CARD_ALREADY_ENROLLED');
      }
      if (card.franchiseeId !== franchiseeId) {
        throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
      }
    }

    // Check if Aadhaar number already has a card
    const existingAadhaar = await prisma.cardHolder.findUnique({
      where: { aadhaarNumber: customerAadhaar },
    });

    if (existingAadhaar) {
      throw new AppError(400, 'Aadhaar number already registered to another card', 'AADHAAR_ALREADY_REGISTERED');
    }

    // Check if mobile number already has a card
    const existingHolder = await prisma.cardHolder.findUnique({
      where: { mobileNumber: customerMobile },
    });

    if (existingHolder) {
      throw new AppError(400, 'Mobile number already registered to another card', 'MOBILE_ALREADY_REGISTERED');
    }

    await prisma.$transaction(async (tx) => {
      // Create card if it doesn't exist
      if (!card) {
        card = await tx.card.create({
          data: {
            cardUid,
            franchiseeId,
            status: CardStatus.ACTIVE,
            issuedById: staffId,
          },
        });
      } else {
        // Update existing unassigned card
        card = await tx.card.update({
          where: { cardUid },
          data: {
            status: CardStatus.ACTIVE,
            issuedById: staffId,
          },
        });
      }

      // Create card holder
      await tx.cardHolder.create({
        data: {
          cardUid,
          name: customerName,
          aadhaarNumber: customerAadhaar,
          mobileNumber: customerMobile,
        },
      });
    });

    res.status(201).json({
      cardUid,
      status: CardStatus.ACTIVE,
      holder: {
        name: customerName,
        aadhaarNumber: customerAadhaar,
        mobileNumber: customerMobile,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Block card
const blockSchema = z.object({
  body: z.object({
    reason: z.enum(['LOST', 'STOLEN', 'FRAUD', 'OTHER']),
  }),
});

cardsRouter.post('/:cardUid/block', validate(blockSchema), async (req, res, next) => {
  try {
    const { cardUid } = req.params;
    const { reason } = req.body;
    const { staffId, franchiseeId } = req.auth!;

    const card = await prisma.card.findUnique({
      where: { cardUid },
    });

    if (!card) {
      throw new AppError(404, 'Card not found', 'CARD_NOT_FOUND');
    }

    if (card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    if (card.status === CardStatus.BLOCKED) {
      throw new AppError(400, 'Card is already blocked', 'CARD_ALREADY_BLOCKED');
    }

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { cardUid },
        data: { status: CardStatus.BLOCKED },
      });

      await tx.cardBlock.create({
        data: {
          cardUid,
          reason: reason as BlockReason,
          blockedBy: staffId,
        },
      });
    });

    res.json({
      cardUid,
      status: CardStatus.BLOCKED,
      message: 'Card blocked successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Reissue card (transfer points to new card)
const reissueSchema = z.object({
  body: z.object({
    oldCardUid: z.string().min(1),
    newCardUid: z.string().min(1),
  }),
});

cardsRouter.post('/reissue', validate(reissueSchema), async (req, res, next) => {
  try {
    const { oldCardUid, newCardUid } = req.body;
    const { staffId, storeId, franchiseeId } = req.auth!;

    // Verify old card
    const oldCard = await prisma.card.findUnique({
      where: { cardUid: oldCardUid },
      include: { cardHolder: true },
    });

    if (!oldCard) {
      throw new AppError(404, 'Original card not found', 'CARD_NOT_FOUND');
    }

    if (oldCard.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    // Verify new card doesn't already have a holder
    const newCard = await prisma.card.findUnique({
      where: { cardUid: newCardUid },
      include: { cardHolder: true },
    });

    if (newCard && newCard.cardHolder) {
      throw new AppError(400, 'New card already has a holder', 'CARD_HAS_HOLDER');
    }

    await prisma.$transaction(async (tx) => {
      // Create new card if needed
      if (!newCard) {
        await tx.card.create({
          data: {
            cardUid: newCardUid,
            franchiseeId,
            status: CardStatus.ACTIVE,
            issuedById: staffId,
          },
        });
      } else {
        await tx.card.update({
          where: { cardUid: newCardUid },
          data: {
            status: CardStatus.ACTIVE,
            issuedById: staffId,
          },
        });
      }

      // Transfer holder info if exists
      if (oldCard.cardHolder) {
        await tx.cardHolder.update({
          where: { cardUid: oldCardUid },
          data: { cardUid: newCardUid },
        });
      }
    });

    // Transfer points (handles blocking old card)
    await transferPoints(oldCardUid, newCardUid, staffId, storeId);

    res.json({
      oldCardUid,
      newCardUid,
      message: 'Card reissued successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get card transaction history
const historySchema = z.object({
  query: z.object({
    limit: z.string().optional().transform(val => parseInt(val || '20', 10)),
    offset: z.string().optional().transform(val => parseInt(val || '0', 10)),
    category: z.enum(['HARDWARE', 'PLYWOOD']).optional(),
  }),
});

cardsRouter.get('/:cardUid/history', validate(historySchema), async (req, res, next) => {
  try {
    const { cardUid } = req.params;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);
    const category = req.query.category as string | undefined;
    const { franchiseeId } = req.auth!;

    const card = await prisma.card.findUnique({
      where: { cardUid },
    });

    if (!card) {
      throw new AppError(404, 'Card not found', 'CARD_NOT_FOUND');
    }

    if (card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Card belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    const whereClause: Record<string, unknown> = {
      cardUid,
      voidedAt: null,
    };

    if (category) {
      whereClause.category = category;
    }

    const [entries, total] = await Promise.all([
      prisma.pointEntry.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          store: { select: { name: true } },
          staff: { select: { name: true } },
        },
      }),
      prisma.pointEntry.count({ where: whereClause }),
    ]);

    res.json({
      entries: entries.map(e => ({
        id: e.id,
        entryId: e.entryId,
        category: e.category,
        transactionType: e.transactionType,
        pointsDelta: e.pointsDelta,
        storeName: e.store.name,
        staffName: e.staff.name,
        createdAt: e.createdAt,
        expiresAt: e.expiresAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + entries.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
});
