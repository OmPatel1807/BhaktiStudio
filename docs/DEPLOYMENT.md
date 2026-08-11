# Production Deployment & Handover Guide - Bhakti Studio

This guide provides step-by-step instructions for deploying the **Bhakti Studio Event Production & LED Rental Platform** to production infrastructure using Docker Compose or Cloud providers (Render, Railway, AWS, Vercel).

---

## 1. Quick Docker Compose Deployment

### Prerequisites
- Docker Engine v24.0+ & Docker Compose v2.20+
- Production Domain & SSL Certificates

### Steps:
1. Clone repository to your production server:
   ```bash
   git clone https://github.com/your-org/BhaktiStudio.git
   cd BhaktiStudio
   ```

2. Copy production environment file:
   ```bash
   cp .env.production.example server/.env
   # Edit server/.env with your production database passwords & Google OAuth keys
   ```

3. Launch production containers:
   ```bash
   docker-compose up --build -d
   ```

4. Run production database migrations & seed initial admin account:
   ```bash
   docker-compose exec server npx prisma migrate deploy
   docker-compose exec server node prisma/seed.js
   ```

5. Verify Deployment Health:
   ```bash
   curl http://localhost:5001/api/v1/health
   ```
   *Expected Response:* `{"status":"online","database":{"status":"HEALTHY"}}`

---

## 2. Cloud Platform Deployments

### Option A: Railway / Render (Backend + Database)
1. **Database**: Provision a managed PostgreSQL instance on Railway / Render. Copy the PostgreSQL connection URI.
2. **Backend**: Create a Node.js Web Service from `/server`.
   - Environment Variables: Set `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma db push && node src/server.js`

### Option B: Vercel / Netlify (Frontend)
1. Import `/client` folder as a Single Page Application (SPA).
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable: Set `VITE_GOOGLE_CLIENT_ID` to your production Client ID.

---

## 3. Maintenance & Backup Commands

- **Database Backup**:
  ```bash
  docker-compose exec postgres pg_dump -U postgres bhakti_studio > backup_$(date +%Y%m%d).sql
  ```
- **Database Restore**:
  ```bash
  cat backup.sql | docker-compose exec -T postgres psql -U postgres -d bhakti_studio
  ```
- **Inspect Security Logs**:
  Access `http://localhost:3000/admin/audit-logs` logged in as Admin.
