# Local Development & Setup Guide

This guide describes how to run **Local Pickup** on any standard laptop or workstation.

---

## Prerequisites

- **Node.js**: v18+ (tested on Node v20/v24)
- **npm**: v9+ (or npm 12+)
- **PostgreSQL 16**: (Local service, portable cluster, or Docker)

---

## Option A: Quick Local Laptop Setup (Recommended)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url> local-pickup
cd local-pickup
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local PostgreSQL instance:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/localpickup?schema=public"
```

### 3. Generate Prisma Client & Sync Database
```bash
npm run db:generate
npm run db:push
```

### 4. Seed Development Accounts & Sample Shops
```bash
npm run db:seed
```
This populates 3 sample printing shops, admin account, demo customer, pricing configs, and upcoming pickup slots.

### 5. Start Development Servers
```bash
# Start both backend (port 5000) and frontend (port 5173) concurrently:
npm run dev

# Or start independently:
npm run backend:dev
npm run frontend:dev
```

Open `http://localhost:5173` in your browser.

---

## Option B: Docker Compose Setup

If you prefer running everything in containers:

```bash
docker-compose up --build -d
```

- Web App: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## Seed Credentials

All accounts use the password: `Password123!`

| Role | Email | Name / Organization |
|---|---|---|
| **Admin** | `admin@localpickup.test` | Platform Administrator |
| **Customer** | `customer@localpickup.test` | Alex Johnson |
| **Shop Owner 1** | `campus@localpickup.test` | Campus Print Hub (University Campus) |
| **Shop Owner 2** | `quickcopy@localpickup.test` | QuickCopy Center (Business Bay) |
| **Shop Owner 3** | `citydoc@localpickup.test` | City Document Point (Central Metro) |
