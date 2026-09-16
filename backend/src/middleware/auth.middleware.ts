import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check cookie first (preferred)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or deactivated.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

export const requireShopAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  // Admins have access to everything
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const shopId = req.params.shopId || req.body.shopId || req.query.shopId as string;
  if (!shopId) {
    return res.status(400).json({ success: false, error: 'Shop ID required' });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { staff: true },
  });

  if (!shop) {
    return res.status(404).json({ success: false, error: 'Shop not found' });
  }

  const isOwner = shop.ownerId === req.user.id;
  const isStaff = shop.staff.some((s) => s.userId === req.user?.id);

  if (!isOwner && !isStaff) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You are not authorized to manage this shop.',
    });
  }

  next();
};
