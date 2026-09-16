# Architecture Overview - Local Pickup

> Tagline: “Book before you go. Pick up when you arrive.”

Local Pickup is designed as a **Modular Monolith** optimized for low operational complexity, high transactional integrity, and extensibility across local commerce verticals (printing, stationery, bookstores, bakery).

---

## High-Level Topology

```
+-------------------------------------------------------------------------+
|                              Web Clients                                |
|    +--------------------+  +--------------------+  +----------------+   |
|    | Customer Experience|  |   Shop Workflow    |  | Admin Console  |   |
|    | (React 18 + Vite)  |  |    Kanban Board    |  | (Metrics/Audit)|   |
|    +--------------------+  +--------------------+  +----------------+   |
+------------------------------------+------------------------------------+
                                     |
                          REST API over HTTP (JSON)
                                     |
+------------------------------------v------------------------------------+
|                         Backend Modular Monolith                        |
|                                                                         |
|  [ Auth & RBAC ] ─── [ Shops & Offerings ] ─── [ Scheduling Engine ]    |
|         │                                               │               |
|  [ Documents ] ─────── [ Booking State Machine ] ───────┘               |
|         │                        │                                      |
|  [ Private Vault ]      [ QR Pickup Verification ] ──── [ Notifications]|
+----------------------------------┬─┬------------------------------------+
                                   │ │
              Prisma ORM (Strict) ─┘ └── Private Storage Abstraction
                                   │     (UUID-keyed Filesystem / S3)
                         +---------v---------+
                         |   PostgreSQL 16   |
                         +-------------------+
```

---

## Core Domain Modules

1. **Auth & Identity Module (`src/modules/auth`)**:
   - Manages registration, secure password hashing (`bcryptjs` 12 rounds), JWT generation, and HTTP-only cookie + Bearer authentication.
   - Enforces user roles (`CUSTOMER`, `SHOP_OWNER`, `SHOP_STAFF`, `ADMIN`).

2. **Shops & Offerings (`src/modules/shops`, `src/modules/offerings`)**:
   - Generalized structure: A Shop provides `Offerings` (either `SERVICE` or `PRODUCT`).
   - Store customizable pricing configs in structured JSON (base rates, page prices for A4/A3, color surcharges, binding, lamination) without hardcoding global rules.

3. **Documents Module (`src/modules/documents`)**:
   - Secure private file handling for uploaded PDFs (max 25MB).
   - Randomizes filenames with UUIDs; files are stored strictly outside the public web root.
   - Access-controlled streaming endpoint (`/api/documents/:id/download`) verifies user ownership or assigned shop before serving.
   - Automated expiration cleaner purges documents after the retention window (24 hours after pickup).

4. **Scheduling & Concurrency Engine (`src/modules/scheduling`)**:
   - Configurable pickup slots (e.g. 10-minute slots, capacity 5).
   - Atomic transaction reservations in PostgreSQL prevent double bookings and race conditions when multiple customers book the final slot simultaneously.

5. **Booking State Machine (`src/modules/bookings`)**:
   - Strict transition rules: `BOOKED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COLLECTED`.
   - Alternative terminals: `REJECTED`, `CANCELLED`, `EXPIRED`.
   - Disallows arbitrary frontend status changes.

6. **QR Pickup System (`src/modules/pickup`)**:
   - Generates high-entropy cryptographic token upon order reaching `READY`.
   - QR code encodes only the token reference; **zero customer PII or document data** is stored in the QR.
   - Shop verification validates shop identity, verifies `READY` status, marks `COLLECTED` atomically, and prevents duplicate replay attacks.

7. **Pricing Engine (`src/modules/pricing`)**:
   - Calculates itemized totals at booking time and snapshots the total amount into the booking record, ensuring price changes by the shop later do not affect historical orders.
