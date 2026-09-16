# Automated & Integration Testing Guide

Local Pickup includes automated test suites covering all core business logic, role-based access controls, document privacy, state machines, and concurrency protection.

---

## Running Automated Tests

Run the test suite using Vitest:

```bash
npm test
# Or directly inside backend/
cd backend && npm test
```

---

## Test Suites Overview (`backend/tests/localpickup.test.ts`)

1. **Authentication & Session Security**:
   - Rejection of invalid passwords with 401 Unauthorized.
   - Protection of unauthenticated private endpoints.
   - Token payload parsing and user profile retrieval.

2. **Document Upload & Storage Security**:
   - Whitelisting of PDF MIME types and extensions (rejecting non-PDF files).
   - Storage of files with randomized UUID storage keys.
   - Customer document ownership verification.
   - **Cross-Customer Isolation**: Verifies that Customer 2 receives `403 Forbidden` when attempting to inspect or download Customer 1's document.

3. **Booking Engine & Pricing Calculation**:
   - Calculation of itemized printing prices based on shop-configured rates (pages × copies × page rate + color surcharge + binding addon).
   - Atomic pickup slot reservation.
   - **Cross-Shop Isolation**: Verifies that Shop 2 owner receives `Access denied` when attempting to access bookings belonging to Shop 1.

4. **Booking State Machine**:
   - Rejection of invalid status skips (e.g. attempting to jump from `BOOKED` directly to `READY`).
   - Order progression: `BOOKED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY`.
   - Automatic generation of secure random pickup token upon entering `READY` state.

5. **QR Pickup Verification & Anti-Replay**:
   - Rejection of token scans performed by the wrong shop.
   - Rejection of invalid or forged tokens.
   - Successful verification and atomic transition to `COLLECTED`.
   - **Anti-Replay Attack**: Immediate rejection of second scan attempts on already collected orders.

6. **Scheduling Capacity & Concurrency Protection**:
   - Slot capacity enforcement: Rejection of bookings when slot reserved count equals slot capacity.
