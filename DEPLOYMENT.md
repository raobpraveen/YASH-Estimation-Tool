# YASH EstPro - Deployment Guide

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- 10GB disk space

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd yash-estipro
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and set a secure JWT_SECRET
   nano .env
   ```

3. **Build and start all services**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - MongoDB: localhost:27017

5. **Create admin user**
   ```bash
   # Register via the UI, or use the API:
   curl -X POST http://localhost/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@company.com","password":"SecurePass123!","name":"Admin User","role":"admin"}'
   ```

### Production Deployment

1. **Update environment variables**
   ```bash
   # .env
   JWT_SECRET=<generate-a-64-char-random-string>
   REACT_APP_BACKEND_URL=https://estipro.yourcompany.com
   ```

2. **Add SSL/TLS (recommended)**
   
   Option A: Use a reverse proxy (Nginx/Traefik) with Let's Encrypt
   
   Option B: Update docker-compose.yml to use Traefik:
   ```yaml
   # Add Traefik labels to frontend service
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.estipro.rule=Host(`estipro.yourcompany.com`)"
     - "traefik.http.routers.estipro.tls.certresolver=letsencrypt"
   ```

3. **Build for production**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

---

## 📁 Directory Structure

```
yash-estipro/
├── backend/
│   ├── Dockerfile
│   ├── server.py
│   ├── requirements.txt
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── src/
│   └── .dockerignore
├── docker-compose.yml
├── mongo-init.js
├── .env.example
└── DEPLOYMENT.md
```

---

## 🔧 Common Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v

# Rebuild a specific service
docker-compose up -d --build backend

# Scale backend (if needed)
docker-compose up -d --scale backend=3
```

---

## 💾 Backup & Restore

### Backup MongoDB
```bash
# Create backup
docker exec estipro-mongodb mongodump --out /data/backup
docker cp estipro-mongodb:/data/backup ./backup-$(date +%Y%m%d)

# Or use mongodump directly
docker exec estipro-mongodb mongodump --archive --gzip > backup-$(date +%Y%m%d).gz
```

### Restore MongoDB
```bash
# Restore from backup
docker cp ./backup estipro-mongodb:/data/backup
docker exec estipro-mongodb mongorestore /data/backup

# Or from archive
docker exec -i estipro-mongodb mongorestore --archive --gzip < backup.gz
```

---

## 🔒 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production
- [ ] Configure MongoDB authentication (if exposed)
- [ ] Set up firewall rules
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

---

## 🆘 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps
```

### MongoDB connection issues
```bash
# Test MongoDB connection
docker exec estipro-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Frontend not loading
```bash
# Rebuild frontend with correct API URL
REACT_APP_BACKEND_URL=https://your-domain.com docker-compose up -d --build frontend
```

---

## 📞 Support

For issues, check:
1. Docker logs: `docker-compose logs`
2. Container health: `docker-compose ps`
3. Network connectivity: `docker network inspect estipro-network`

---

© 2026 YASH Technologies - YASH EstPro
