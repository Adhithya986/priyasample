import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'SHOP_OWNER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const { user, token } = await AuthService.register(validated as any);
      setAuthCookie(res, token);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const { user, token } = await AuthService.login(validated.email, validated.password);
      setAuthCookie(res, token);
      res.json({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const user = await AuthService.getMe(req.user.id);
      res.json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}
