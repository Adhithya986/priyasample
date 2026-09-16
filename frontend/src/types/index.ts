export type UserRole = 'CUSTOMER' | 'SHOP_OWNER' | 'SHOP_STAFF' | 'ADMIN';
export type ShopStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BookingStatus =
  | 'BOOKED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COLLECTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  ownedShops?: { id: string; name: string; slug: string; status: string }[];
}

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Offering {
  id: string;
  shopId: string;
  type: 'SERVICE' | 'PRODUCT';
  name: string;
  description?: string;
  basePrice: number;
  pricingConfig?: string;
  isActive: boolean;
}

export interface PickupSlot {
  id: string;
  shopId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  reservedCount: number;
  isAvailable: boolean;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  area: string;
  phone: string;
  email?: string;
  openingHours: string;
  slotDurationMinutes: number;
  slotCapacity: number;
  status: ShopStatus;
  category?: ShopCategory;
  offerings?: Offering[];
  pickupSlots?: PickupSlot[];
}

export interface PrintDocument {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  isDeleted: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface BookingItem {
  id: string;
  offeringId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  configuration: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  shopId: string;
  slotId?: string;
  status: BookingStatus;
  pickupToken?: string;
  subtotal: number;
  tax: number;
  totalPrice: number;
  notes?: string;
  pickupTime?: string;
  collectedAt?: string;
  createdAt: string;
  customer?: { id: string; name: string; email: string; phone?: string };
  shop?: { id: string; name: string; address: string; area: string; phone: string };
  slot?: PickupSlot;
  items?: BookingItem[];
  documents?: PrintDocument[];
}

export interface Notification {
  id: string;
  userId: string;
  bookingId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}
