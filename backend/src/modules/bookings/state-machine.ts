import { BookingStatus, UserRole } from '@prisma/client';

export interface TransitionContext {
  role: UserRole;
  isOwnerOrStaff: boolean;
  isCustomer: boolean;
  isTokenVerified?: boolean;
}

export interface TransitionRule {
  from: BookingStatus[];
  to: BookingStatus;
  allowedRoles: UserRole[];
  requiresOwnerOrStaff?: boolean;
  requiresCustomer?: boolean;
  requiresTokenVerification?: boolean;
}

export const STATE_TRANSITIONS: Record<string, TransitionRule> = {
  ACCEPT: {
    from: [BookingStatus.BOOKED],
    to: BookingStatus.ACCEPTED,
    allowedRoles: [UserRole.SHOP_OWNER, UserRole.SHOP_STAFF, UserRole.ADMIN],
    requiresOwnerOrStaff: true,
  },
  REJECT: {
    from: [BookingStatus.BOOKED],
    to: BookingStatus.REJECTED,
    allowedRoles: [UserRole.SHOP_OWNER, UserRole.SHOP_STAFF, UserRole.ADMIN],
    requiresOwnerOrStaff: true,
  },
  START_PREPARING: {
    from: [BookingStatus.ACCEPTED],
    to: BookingStatus.PREPARING,
    allowedRoles: [UserRole.SHOP_OWNER, UserRole.SHOP_STAFF, UserRole.ADMIN],
    requiresOwnerOrStaff: true,
  },
  MARK_READY: {
    from: [BookingStatus.PREPARING],
    to: BookingStatus.READY,
    allowedRoles: [UserRole.SHOP_OWNER, UserRole.SHOP_STAFF, UserRole.ADMIN],
    requiresOwnerOrStaff: true,
  },
  VERIFY_PICKUP_COLLECTED: {
    from: [BookingStatus.READY],
    to: BookingStatus.COLLECTED,
    allowedRoles: [UserRole.SHOP_OWNER, UserRole.SHOP_STAFF, UserRole.ADMIN],
    requiresOwnerOrStaff: true,
    requiresTokenVerification: true,
  },
  CUSTOMER_CANCEL: {
    from: [BookingStatus.BOOKED],
    to: BookingStatus.CANCELLED,
    allowedRoles: [UserRole.CUSTOMER, UserRole.ADMIN],
    requiresCustomer: true,
  },
  EXPIRE: {
    from: [BookingStatus.BOOKED, BookingStatus.READY],
    to: BookingStatus.EXPIRED,
    allowedRoles: [UserRole.ADMIN, UserRole.SHOP_OWNER],
  }
};

/**
 * Validates whether a state transition is legal for the given actor context.
 */
export const validateTransition = (
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  context: TransitionContext
): { allowed: boolean; reason?: string } => {
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: `Booking is already in ${currentStatus} status.` };
  }

  // Find matching rule
  const rule = Object.values(STATE_TRANSITIONS).find(
    (r) => r.to === targetStatus && r.from.includes(currentStatus)
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Illegal state transition from ${currentStatus} to ${targetStatus}.`,
    };
  }

  // Role check
  if (!rule.allowedRoles.includes(context.role)) {
    return {
      allowed: false,
      reason: `Role ${context.role} is not permitted to perform transition to ${targetStatus}.`,
    };
  }

  // Shop owner/staff check
  if (rule.requiresOwnerOrStaff && !context.isOwnerOrStaff && context.role !== UserRole.ADMIN) {
    return {
      allowed: false,
      reason: 'Only authorized shop staff can execute this transition.',
    };
  }

  // Customer ownership check
  if (rule.requiresCustomer && !context.isCustomer && context.role !== UserRole.ADMIN) {
    return {
      allowed: false,
      reason: 'Only the customer who placed this booking can cancel it.',
    };
  }

  // Token check
  if (rule.requiresTokenVerification && !context.isTokenVerified) {
    return {
      allowed: false,
      reason: 'Pickup verification token must be validated before marking order collected.',
    };
  }

  return { allowed: true };
};
