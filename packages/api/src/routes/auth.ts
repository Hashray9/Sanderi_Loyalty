import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  body: z.object({
    mobileNumber: z.string().min(10).max(15),
    password: z.string().min(1),
  }),
});

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { mobileNumber, password } = req.body;

    const staff = await prisma.staff.findUnique({
      where: { mobileNumber },
      include: {
        store: {
          include: { franchisee: true },
        },
      },
    });

    if (!staff) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const validPassword = await bcrypt.compare(password, staff.passwordHash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError(500, 'JWT secret not configured', 'CONFIG_ERROR');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        staffId: staff.id,
        storeId: staff.storeId,
        franchiseeId: staff.store.franchiseeId,
        role: staff.role,
      },
      secret,
      { expiresIn: expiresIn as any }
    );

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        mobileNumber: staff.mobileNumber,
        role: staff.role,
      },
      store: {
        id: staff.store.id,
        name: staff.store.name,
        hardwareConversionRate: staff.store.hardwareConversionRate,
        plywoodConversionRate: staff.store.plywoodConversionRate,
      },
      franchisee: {
        id: staff.store.franchisee.id,
        name: staff.store.franchisee.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    mobileNumber: z.string().min(10).max(15),
    password: z.string().min(6),
    inviteCode: z.string().min(1),
  }),
});

authRouter.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { name, mobileNumber, password, inviteCode } = req.body;

    const store = await prisma.store.findFirst({
      where: { inviteCode },
      include: { franchisee: true },
    });
    if (!store) {
      throw new AppError(403, 'Invalid invite code', 'INVALID_INVITE_CODE');
    }

    const existing = await prisma.staff.findUnique({ where: { mobileNumber } });
    if (existing) {
      throw new AppError(409, 'Mobile number already registered', 'MOBILE_ALREADY_REGISTERED');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        storeId: store.id,
        name,
        mobileNumber,
        passwordHash,
        role: 'EMPLOYEE',
      },
      include: {
        store: {
          include: { franchisee: true },
        },
      },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError(500, 'JWT secret not configured', 'CONFIG_ERROR');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        staffId: staff.id,
        storeId: staff.storeId,
        franchiseeId: staff.store.franchiseeId,
        role: staff.role,
      },
      secret,
      { expiresIn: expiresIn as any }
    );

    res.status(201).json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        mobileNumber: staff.mobileNumber,
        role: staff.role,
      },
      store: {
        id: staff.store.id,
        name: staff.store.name,
        hardwareConversionRate: staff.store.hardwareConversionRate,
        plywoodConversionRate: staff.store.plywoodConversionRate,
      },
      franchisee: {
        id: staff.store.franchisee.id,
        name: staff.store.franchisee.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/invite-code — Admin only
authRouter.get('/invite-code', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const store = await prisma.store.findFirst({
      where: { id: req.auth!.storeId },
      select: { inviteCode: true },
    });
    if (!store) {
      throw new AppError(500, 'Store not found', 'CONFIG_ERROR');
    }
    res.json({ inviteCode: store.inviteCode });
  } catch (error) {
    next(error);
  }
});

const updateInviteCodeSchema = z.object({
  body: z.object({
    inviteCode: z.string().min(1).max(50),
  }),
});

// PUT /auth/invite-code — Admin only
authRouter.put('/invite-code', authMiddleware, requireAdmin, validate(updateInviteCodeSchema), async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    // Check if another store already uses this invite code
    const existing = await prisma.store.findFirst({
      where: { inviteCode, id: { not: req.auth!.storeId } },
    });
    if (existing) {
      throw new AppError(409, 'Invite code already in use by another store', 'INVITE_CODE_TAKEN');
    }

    const store = await prisma.store.update({
      where: { id: req.auth!.storeId },
      data: { inviteCode },
      select: { inviteCode: true },
    });

    res.json({ inviteCode: store.inviteCode });
  } catch (error) {
    next(error);
  }
});
