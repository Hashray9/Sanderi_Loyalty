import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

export const customersRouter = Router();

customersRouter.use(authMiddleware);

const MOBILE_LOOKUPS_PER_MONTH = parseInt(process.env.MOBILE_LOOKUPS_PER_MONTH || '2', 10);

function getCurrentMonth(): number {
  const now = new Date();
  return now.getFullYear() * 100 + (now.getMonth() + 1); // YYYYMM format
}

// Search customer by mobile number
const searchSchema = z.object({
  query: z.object({
    mobile: z.string().min(10).max(15),
  }),
});

customersRouter.get('/search', validate(searchSchema), async (req, res, next) => {
  try {
    const { mobile } = req.query;
    const { franchiseeId } = req.auth!;

    const cardHolder = await prisma.cardHolder.findUnique({
      where: { mobileNumber: mobile as string },
      include: {
        card: {
          include: { franchisee: true },
        },
      },
    });

    if (!cardHolder) {
      res.json({ found: false, customer: null });
      return;
    }

    // Verify same franchisee
    if (cardHolder.card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Customer belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    res.json({
      found: true,
      customer: {
        cardUid: cardHolder.cardUid,
        name: cardHolder.name,
        mobileNumber: cardHolder.mobileNumber,
        cardStatus: cardHolder.card.status,
        hardwarePoints: cardHolder.card.hardwarePoints,
        plywoodPoints: cardHolder.card.plywoodPoints,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get remaining mobile lookups for this month
customersRouter.get('/:mobile/lookup-remaining', async (req, res, next) => {
  try {
    const { mobile } = req.params;
    const { franchiseeId } = req.auth!;

    const cardHolder = await prisma.cardHolder.findUnique({
      where: { mobileNumber: mobile },
      include: { card: true },
    });

    if (!cardHolder) {
      throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    if (cardHolder.card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Customer belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    const currentMonth = getCurrentMonth();

    const lookupsThisMonth = await prisma.mobileLookup.count({
      where: {
        cardUid: cardHolder.cardUid,
        month: currentMonth,
      },
    });

    res.json({
      used: lookupsThisMonth,
      remaining: Math.max(0, MOBILE_LOOKUPS_PER_MONTH - lookupsThisMonth),
      limit: MOBILE_LOOKUPS_PER_MONTH,
    });
  } catch (error) {
    next(error);
  }
});

// Record a mobile lookup usage
customersRouter.post('/:mobile/record-lookup', async (req, res, next) => {
  try {
    const { mobile } = req.params;
    const { staffId, franchiseeId } = req.auth!;

    const cardHolder = await prisma.cardHolder.findUnique({
      where: { mobileNumber: mobile },
      include: { card: true },
    });

    if (!cardHolder) {
      throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    if (cardHolder.card.franchiseeId !== franchiseeId) {
      throw new AppError(403, 'Customer belongs to different franchisee', 'FRANCHISE_MISMATCH');
    }

    const currentMonth = getCurrentMonth();

    const lookupsThisMonth = await prisma.mobileLookup.count({
      where: {
        cardUid: cardHolder.cardUid,
        month: currentMonth,
      },
    });

    if (lookupsThisMonth >= MOBILE_LOOKUPS_PER_MONTH) {
      throw new AppError(400, 'Monthly lookup limit reached', 'LOOKUP_LIMIT_REACHED');
    }

    await prisma.mobileLookup.create({
      data: {
        cardUid: cardHolder.cardUid,
        staffId,
        month: currentMonth,
      },
    });

    res.json({
      success: true,
      remaining: MOBILE_LOOKUPS_PER_MONTH - lookupsThisMonth - 1,
    });
  } catch (error) {
    next(error);
  }
});
