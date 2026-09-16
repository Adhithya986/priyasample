# Deployment Guide - Local Pickup

This guide outlines production deployment strategies for **Local Pickup**:
1. **Option 1: Docker Compose on a Linux VPS** (Fastest, self-hosted: DigitalOcean, Hetzner, Linode, AWS EC2)
2. **Option 2: Cloud PaaS Platforms** (Render / Railway + Neon / Supabase + Vercel)
3. **Option 3: Enterprise AWS Cloud** (RDS PostgreSQL + ECS / App Runner + S3 + CloudFront)

---

## 🚀 Option 1: Single VPS via Docker Compose (Recommended)

This uses the existing `docker-compose.yml` and Dockerfiles in this repository to run PostgreSQL, Backend, and Frontend together behind an Nginx SSL reverse proxy.

### 1. Server Setup (Ubuntu 22.04 / 24.04 LTS)
SSH into your VPS and install Docker & Docker Compose:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone & Configure Environment
```bash
git clone https://github.com/your-username/local-pickup.git
cd local-pickup

# Create production .env
cp .env.example .env
```

Edit `.env` with production secrets:
```ini
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DATABASE_URL="postgresql://postgres:StrongRandomDbPassword123!@postgres:5432/localpickup?schema=public"
JWT_SECRET=use-a-random-32-character-secret-key-here
JWT_EXPIRES_IN=7d
UPLOAD_DIR="/app/uploads"
DOCUMENT_RETENTION_HOURS=24
```

Update `docker-compose.yml` environment password to match:
```yaml
POSTGRES_PASSWORD: StrongRandomDbPassword123!
```

### 3. Build & Run Containers
```bash
docker-compose up --build -d
```

Run database migrations & seed:
```bash
docker-compose exec backend npx prisma db push
docker-compose exec backend npm run db:seed
```

### 4. Setup Nginx Reverse Proxy with HTTPS
Create `/etc/nginx/sites-available/localpickup`:
```nginx
server {
    server_name yourdomain.com api.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API & Uploads
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 30M;
    }
}
```

Enable site & obtain free SSL certificate via Let's Encrypt:
```bash
sudo ln -s /etc/nginx/sites-available/localpickup /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ☁️ Option 2: Managed PaaS (Render / Railway / Vercel)

Ideal if you prefer zero server management.

### Step 1: Managed PostgreSQL Database
- Provision a managed PostgreSQL instance on **[Neon.tech](https://neon.tech)**, **[Supabase](https://supabase.com)**, or **Render**.
- Copy the PostgreSQL connection string `postgresql://user:pass@host/dbname?sslmode=require`.

### Step 2: Backend API (Render or Railway)
- Connect your GitHub repo to **[Render.com](https://render.com)** as a **Web Service**.
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npx prisma db push && npm start`
- **Environment Variables**:
  - `DATABASE_URL`: Your managed database URL
  - `JWT_SECRET`: Random 32+ character string
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: `https://your-frontend.vercel.app`
  - `UPLOAD_DIR`: `./uploads` (or attach a Render Persistent Disk at `/uploads`)

### Step 3: Frontend Web App (Vercel / Cloudflare Pages)
- Connect repo to **[Vercel](https://vercel.com)**.
- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Create `frontend/vercel.json` for client-side routing & proxying:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-backend.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🏢 Option 3: Production Cloud Storage Upgrade (AWS S3)

In development, documents are saved in `./uploads`. For multi-server or serverless setups, plug in AWS S3 or Cloudflare R2:

1. Create a private S3 bucket (Block Public Access: **ON**).
2. Set environment variables:
   ```ini
   STORAGE_DRIVER=s3
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=localpickup-private-documents
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```
3. The existing `backend/src/modules/documents/storage.ts` interface cleanly encapsulates reading/writing/purging files, allowing seamless S3 swap.

---

## 🔒 Production Security Checklist

- [ ] Changed all default passwords from `Password123!` to strong passwords.
- [ ] Configured `JWT_SECRET` with high entropy (e.g. `openssl rand -base64 32`).
- [ ] Enforced HTTPS with valid TLS certificates.
- [ ] Set `secure: true` on cookies in production.
- [ ] Scheduled document expiration cron (`purgeExpiredDocuments`) running periodically.
- [ ] Firewall (UFW) only allows ports `80`, `443`, and `22` (PostgreSQL `5432` closed to the outside world).
