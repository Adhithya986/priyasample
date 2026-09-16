# REST API Documentation - Local Pickup

Base URL: `http://localhost:5000/api`

Authentication: Bearer Token in `Authorization: Bearer <token>` header or `token` HTTP-only Cookie.

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`CUSTOMER` or `SHOP_OWNER`) | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `POST` | `/api/auth/logout` | Clears authentication session cookie | Yes |
| `GET` | `/api/auth/me` | Current authenticated user profile | Yes |

---

## 2. Shops & Services (`/api/shops`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/shops` | List approved shops with search & area filter | No |
| `GET` | `/api/shops/:id` | Get shop details, active offerings, and slots | No |
| `POST` | `/api/shops` | Create a new shop | Yes (`SHOP_OWNER`, `ADMIN`) |
| `PATCH` | `/api/shops/:shopId` | Update shop profile & operating hours | Yes (Shop Owner) |
| `GET` | `/api/shops/:shopId/stats` | Operational booking stats for shop dashboard | Yes (Shop Owner) |
| `GET` | `/api/shops/:shopId/offerings` | List services/products offered by shop | No |
| `POST` | `/api/shops/:shopId/offerings` | Add an offering with custom pricing config | Yes (Shop Owner) |

---

## 3. Documents (`/api/documents`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/documents` | Upload PDF file (multipart/form-data, max 25MB) | Yes (`CUSTOMER`) |
| `GET` | `/api/documents/:id` | Get document metadata | Yes (Owner, Shop, Admin) |
| `GET` | `/api/documents/:id/download` | Authorized inline file stream | Yes (Owner, Shop, Admin) |

---

## 4. Scheduling & Slots (`/api/shops/:shopId/pickup-slots`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/shops/:shopId/pickup-slots` | Available pickup slots with remaining capacity | No |

---

## 5. Bookings & Lifecycle (`/api/bookings`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/bookings` | Atomically reserve slot & place booking | Yes (`CUSTOMER`) |
| `GET` | `/api/bookings` | List bookings (filtered for user role) | Yes |
| `GET` | `/api/bookings/:id` | Booking details (with QR code if ready) | Yes (Owner, Shop, Admin) |
| `POST` | `/api/bookings/:id/accept` | Shop accepts incoming booking | Yes (Shop Owner/Staff) |
| `POST` | `/api/bookings/:id/reject` | Shop declines incoming booking | Yes (Shop Owner/Staff) |
| `POST` | `/api/bookings/:id/start-preparing`| Mark printing/preparation started | Yes (Shop Owner/Staff) |
| `POST` | `/api/bookings/:id/ready` | Mark order ready; generates secure pickup token | Yes (Shop Owner/Staff) |
| `POST` | `/api/bookings/:id/cancel` | Customer cancels booking (if still `BOOKED`) | Yes (Customer) |

---

## 6. QR Pickup Verification (`/api/pickup`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/pickup/verify` | Authoritatively verify QR token & mark `COLLECTED` | Yes (Shop Owner/Staff) |

---

## 7. Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/notifications` | List user in-app notifications & unread count | Yes |
| `PATCH` | `/api/notifications/:id/read` | Mark a notification as read | Yes |
| `POST` | `/api/notifications/read-all` | Mark all notifications read | Yes |

---

## 8. Admin Control (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Platform operational metrics | Yes (`ADMIN`) |
| `GET` | `/api/admin/users` | List all registered users | Yes (`ADMIN`) |
| `PATCH` | `/api/admin/users/:id/status` | Enable or disable user account | Yes (`ADMIN`) |
| `GET` | `/api/admin/shops` | All shops with moderation status | Yes (`ADMIN`) |
| `PATCH` | `/api/admin/shops/:id/status` | Approve, reject, or suspend a shop | Yes (`ADMIN`) |
| `GET` | `/api/admin/bookings` | Global bookings audit log | Yes (`ADMIN`) |
