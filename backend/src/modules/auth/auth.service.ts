import bcrypt from 'bcryptjs';
import { prisma } from '../../utils/prisma';
import { signToken } from '../../utils/jwt';
import { UserRole } from '@prisma/client';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestError('An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const role = data.role && [UserRole.CUSTOMER, UserRole.SHOP_OWNER].includes(data.role)
      ? data.role
      : UserRole.CUSTOMER;

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        ownedShops: {
          select: { id: true, name: true, slug: true, status: true },
        },
        staffShops: {
          include: {
            shop: { select: { id: true, name: true, slug: true, status: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  }
}
