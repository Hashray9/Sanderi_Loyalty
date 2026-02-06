import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';

export interface AuthPayload {
  staffId: string;
  storeId: string;
  franchiseeId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid authorization header', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError(500, 'JWT secret not configured', 'CONFIG_ERROR');
    }

    const payload = jwt.verify(token, secret) as AuthPayload;

    // Verify staff still exists and is active
    const staff = await prisma.staff.findUnique({
      where: { id: payload.staffId },
      include: { store: true },
    });

    if (!staff) {
      throw new AppError(401, 'Staff account not found', 'UNAUTHORIZED');
    }

    req.auth = {
      staffId: staff.id,
      storeId: staff.storeId,
      franchiseeId: staff.store.franchiseeId,
      role: staff.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired', 'TOKEN_EXPIRED'));
      return;
    }

    next(error);
  }
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.auth?.role !== 'ADMIN') {
    next(new AppError(403, 'Admin access required', 'FORBIDDEN'));
    return;
  }
  next();
}
