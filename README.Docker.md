# Docker Deployment for TapMeIn

Production-ready Docker setup for deploying TapMeIn NFC Card Management System.

## 📦 What's Included

- **Dockerfile** - Production-optimized Node.js container
- **docker-compose.prod.yml** - Full production stack (App + MongoDB + Redis)
- **docker-compose.portainer.yml** - Simplified for Portainer Stack deployment
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **PORTAINER_QUICK_START.md** - 5-minute Portainer setup guide

## 🚀 Quick Deploy

### Option 1: Portainer (Recommended for beginners)

```bash
# Read the quick start guide
cat PORTAINER_QUICK_START.md
```

1. Upload `docker-compose.portainer.yml` to Portainer
2. Configure environment variables
3. Deploy stack
4. Access at `http://your-server:3000`

**Full guide**: [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md)

### Option 2: Docker Compose

```bash
# 1. Copy environment template
cp .env.production.example .env.production

# 2. Edit environment variables (IMPORTANT!)
nano .env.production

# 3. Deploy
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 4. Check status
docker-compose -f docker-compose.prod.yml ps
docker logs tapmeinnfc-app-prod -f
```

**Full guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🏗️ Architecture

```
┌─────────────────┐
│  Nginx/Traefik  │ ← SSL/TLS Termination
│  (Reverse Proxy)│
└────────┬────────┘
         │
    ┌────▼─────────────┐
    │   TapMeIn App    │ ← Node.js Application
    │  (Port 3000)     │
    └────┬─────────────┘
         │
    ┌────▼────┬────────┐
    │         │        │
┌───▼───┐ ┌──▼──┐ ┌──▼────┐
│MongoDB│ │Redis│ │Uploads│
│  DB   │ │Cache│ │Volume │
└───────┘ └─────┘ └───────┘
```

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 10GB+ disk space

## 🔒 Security First

Before deploying, **you must**:

1. Generate secure secrets:
   ```bash
   openssl rand -base64 64  # JWT_SECRET
   openssl rand -base64 64  # JWT_REFRESH_SECRET
   openssl rand -base64 64  # SESSION_SECRET
   ```

2. Change MongoDB password from default

3. Configure SSL/HTTPS (production)

4. Set strong admin password

## 📊 Container Health Checks

All containers include health monitoring:

- **App**: HTTP check on `/api/health`
- **MongoDB**: Database ping
- **Redis**: Redis CLI ping

View health status:
```bash
docker ps  # Shows health status
docker inspect tapmeinnfc-app-prod | grep -A 10 Health
```

## 🔧 Management Commands

### View Logs
```bash
# All containers
docker-compose -f docker-compose.prod.yml logs -f

# Specific container
docker logs tapmeinnfc-app-prod -f
```

### Restart Services
```bash
# Restart app only
docker-compose -f docker-compose.prod.yml restart app

# Restart all
docker-compose -f docker-compose.prod.yml restart
```

### Update Application
```bash
# Pull latest code and rebuild
docker-compose -f docker-compose.prod.yml up -d --build

# Force recreation
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### Backup Database
```bash
# Quick backup
docker exec tapmeinnfc-mongo-prod mongodump \
  -u admin -p your-password \
  --authenticationDatabase admin \
  -d tapmeinnfc \
  --out /tmp/backup

# Copy to host
docker cp tapmeinnfc-mongo-prod:/tmp/backup ./backup-$(date +%Y%m%d)
```

## 🌐 Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Secrets generated (64+ character random strings)
- [ ] MongoDB password changed from default
- [ ] Admin credentials set
- [ ] SSL/TLS certificate configured
- [ ] Reverse proxy configured (Nginx/Traefik)
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring/alerts configured
- [ ] Domain DNS pointed to server

## 📖 Documentation

- **[PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md)** - Quick 5-minute setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full deployment guide
- **[.env.production.example](./.env.production.example)** - Environment variable reference
- **[CLAUDE.md](./CLAUDE.md)** - Development and architecture guide

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs tapmeinnfc-app-prod

# Check environment
docker exec tapmeinnfc-app-prod env
```

### Can't connect to database
```bash
# Test MongoDB
docker exec tapmeinnfc-mongo-prod mongosh \
  -u admin -p your-password \
  --eval "db.adminCommand('ping')"

# Check network
docker network inspect tapmeinnfc-network
```

### Application errors
```bash
# View real-time logs
docker logs tapmeinnfc-app-prod -f

# Check health endpoint
curl http://localhost:3000/api/health
```

## 📈 Scaling

### Horizontal Scaling (Multiple App Instances)

```yaml
# In docker-compose.prod.yml
app:
  deploy:
    replicas: 3
```

### Resource Limits

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

## 🔄 Migration from Development

Already running the development setup? Migrate easily:

```bash
# 1. Stop development containers
docker-compose down

# 2. Backup data
docker cp tapmeinnfc-mongo:/data/db ./mongodb-backup

# 3. Configure production
cp .env.production.example .env.production
nano .env.production

# 4. Deploy production
docker-compose -f docker-compose.prod.yml up -d

# 5. Restore data if needed
docker cp ./mongodb-backup tapmeinnfc-mongo-prod:/tmp/restore
```

## 🆘 Support

1. Check container logs
2. Review health endpoint: `/api/health`
3. Consult [DEPLOYMENT.md](./DEPLOYMENT.md)
4. Check application logs

## 📝 License

See main [README.md](./README.md)

---

**Ready to deploy?** Start with [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)
