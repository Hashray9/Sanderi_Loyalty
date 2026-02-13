import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

export const customersRouter = Router();

customersRouter.use(authMiddleware);

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

