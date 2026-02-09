import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

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
