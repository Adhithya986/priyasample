const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<{ user: any }>('/auth/me'),

  // Shops
  listShops: (params?: { search?: string; area?: string; category?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ shops: any[] }>(`/shops${query ? `?${query}` : ''}`);
  },
  getShop: (id: string) => request<{ shop: any }>(`/shops/${id}`),
  createShop: (data: any) => request<{ shop: any }>('/shops', { method: 'POST', body: JSON.stringify(data) }),
  updateShop: (id: string, data: any) => request<{ shop: any }>(`/shops/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getShopStats: (shopId: string) => request<{ stats: any }>(`/shops/${shopId}/stats`),

  // Offerings
  listOfferings: (shopId: string) => request<{ offerings: any[] }>(`/shops/${shopId}/offerings`),
  createOffering: (shopId: string, data: any) => request<{ offering: any }>(`/shops/${shopId}/offerings`, { method: 'POST', body: JSON.stringify(data) }),
  updateOffering: (id: string, data: any) => request<{ offering: any }>(`/offerings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Documents
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ document: any }>('/documents', {
      method: 'POST',
      body: formData,
    });
  },
  getDocument: (id: string) => request<{ document: any }>(`/documents/${id}`),
  getDocumentDownloadUrl: (id: string) => `${BASE_URL}/documents/${id}/download`,

  // Scheduling
  getPickupSlots: (shopId: string, date?: string) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return request<{ slots: any[] }>(`/shops/${shopId}/pickup-slots${query}`);
  },

  // Bookings
  createBooking: (data: any) => request<{ booking: any }>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  listBookings: (params?: { shopId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ bookings: any[] }>(`/bookings${query ? `?${query}` : ''}`);
  },
  getBooking: (id: string) => request<{ booking: any; qrCodeDataUrl?: string }>(`/bookings/${id}`),
  cancelBooking: (id: string) => request<{ booking: any }>(`/bookings/${id}/cancel`, { method: 'POST' }),

  // Shop lifecycle transitions
  acceptBooking: (id: string) => request<{ booking: any }>(`/bookings/${id}/accept`, { method: 'POST' }),
  rejectBooking: (id: string, reason?: string) => request<{ booking: any }>(`/bookings/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  startPreparingBooking: (id: string) => request<{ booking: any }>(`/bookings/${id}/start-preparing`, { method: 'POST' }),
  markBookingReady: (id: string) => request<{ booking: any }>(`/bookings/${id}/ready`, { method: 'POST' }),

  // Pickup Verification
  verifyPickup: (token: string, shopId: string) =>
    request<any>('/pickup/verify', {
      method: 'POST',
      body: JSON.stringify({ token, shopId }),
    }),

  // Notifications
  listNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Admin
  getAdminStats: () => request<{ stats: any }>('/admin/stats'),
  listAdminUsers: () => request<{ users: any[] }>('/admin/users'),
  toggleUserStatus: (id: string, isActive: boolean) => request<any>(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  listAdminShops: () => request<{ shops: any[] }>('/admin/shops'),
  updateShopApproval: (id: string, status: string) => request<any>(`/admin/shops/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  listAdminBookings: () => request<{ bookings: any[] }>('/admin/bookings'),
  listAdminCategories: () => request<{ categories: any[] }>('/admin/categories'),
  createAdminCategory: (data: any) => request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
};
