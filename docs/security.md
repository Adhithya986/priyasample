# Security Architecture & Data Protection

Because Local Pickup handles proprietary customer documents and financial records, security is built as a first-class citizen.

---

## 1. Principles of Least Privilege & Data Minimization

> “Collect less. Keep it for less time. Give access only to those who need it.”

- **No Sensitive Data in QR Codes**:
  - The QR code contains strictly a random cryptographic token (`PK-<32-hex-chars>`).
  - It does **NOT** contain customer name, phone number, email address, payment details, or document filenames.
- **Short-Lived Document Retention**:
  - Uploaded documents have a strict expiration window (default 24 hours after completion).
  - A background sweep routine actively unlinks files from the private storage directory and marks the database record deleted.

---

## 2. Document & File Security

- **Private Storage**: Uploads are saved into an internal server directory (`uploads/`) outside the public web root.
- **Randomized Storage Keys**: Files are saved with cryptographically random UUID keys (`uuidv4().pdf`), preventing directory enumeration or filename guessing attacks.
- **MIME & Extension Whitelisting**: Multer middleware inspects both extension and MIME type, strictly rejecting executable or non-PDF files.
- **Object-Level Access Control**:
  - Files can only be streamed via `GET /api/documents/:id/download`.
  - The endpoint verifies:
    1. Is the requester the customer who uploaded it?
    2. OR is the requester the verified owner/staff of the shop fulfilling the order?
    3. OR is the requester a platform administrator?
  - Any other requester receives `403 Forbidden`.

---

## 3. QR Pickup & Replay Attack Defense

- **Backend Authoritative**: The frontend scanner never decides whether a pickup is valid; it sends the scanned token to the backend `/api/pickup/verify`.
- **Shop Verification**: Verifies that the order belongs to the specific shop currently scanning it. If a customer presents their QR at the wrong shop, the scan is rejected with a clear message showing the intended shop name.
- **Atomic Single-Use**:
  - Valid scan atomically moves status from `READY` to `COLLECTED` and records `collectedAt`.
  - Subsequent scans on the same token are immediately rejected with `400 Bad Request: Already Collected on [Timestamp]`.

---

## 4. Concurrency & Race Conditions

- **Atomic Slot Reservation**:
  - When reserving a slot with capacity limits (e.g. 5 concurrent bookings per 10 minutes), the reservation query executes inside a `prisma.$transaction`.
  - If two customers attempt to book the final available slot simultaneously, the transaction verifies capacity and rejects the second with a safe message: *"This pickup slot was just filled by another customer. Please choose an alternative time."*
