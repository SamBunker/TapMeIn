# TapMeIn Docker - Quick Reference Card

## 🚀 Deploy in 3 Steps

### 1. Portainer Stack
- **Name**: `tapmeinnfc`
- **File**: Upload `docker-compose.portainer.yml`

### 2. Environment Variables (Minimum)
```
MONGO_USERNAME=admin
MONGO_PASSWORD=SecurePassword123!
JWT_SECRET=[openssl rand -base64 64]
JWT_REFRESH_SECRET=[openssl rand -base64 64]
SESSION_SECRET=[openssl rand -base64 64]
BASE_URL=https://tapmeinnfc.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
HOST_PORT=3001
CONTAINER_PORT=3000
```

### 3. Nginx Config
```nginx
location / {
    proxy_pass http://tapmeinnfc-app-prod:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 📂 Files Reference

| File | Use Case |
|------|----------|
| `PORTAINER_QUICK_START.md` | 5-min Portainer setup |
| `NGINX_SETUP.md` | Nginx integration |
| `DEPLOYMENT.md` | Full deployment guide |
| `DOCKER_SUMMARY.md` | Complete overview |
| `.env.portainer.txt` | Copy-paste env vars |

---

## 🔧 Common Commands

### View Logs
```bash
docker logs tapmeinnfc-app-prod -f
```

### Check Health
```bash
curl http://localhost:3001/api/health
```

### Restart Container
```bash
docker restart tapmeinnfc-app-prod
```

### Backup Database
```bash
docker exec tapmeinnfc-mongo-prod mongodump -u admin -p password -d tapmeinnfc -o /tmp/backup
docker cp tapmeinnfc-mongo-prod:/tmp/backup ./backup-$(date +%Y%m%d)
```

### View Container Stats
```bash
docker stats tapmeinnfc-app-prod
```

### Access Container Shell
```bash
docker exec -it tapmeinnfc-app-prod sh
```

---

## 🌐 Default URLs

- **App**: http://localhost:3001
- **Health**: http://localhost:3001/api/health
- **Admin**: http://localhost:3001/admin
- **API Docs**: http://localhost:3001/api

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Container won't start | `docker logs tapmeinnfc-app-prod` |
| Can't reach app | Check `docker ps` shows "healthy" |
| Nginx 502 error | `docker network inspect d-nginx_default` |
| Database error | `docker exec tapmeinnfc-mongo-prod mongosh -u admin -p password` |
| Port in use | Change `HOST_PORT=3002` |

---

## 🔐 Security Essentials

- [ ] Change all default passwords
- [ ] Generate 64-char random secrets
- [ ] Use HTTPS with valid SSL
- [ ] Restrict firewall to 80/443 only
- [ ] Enable automatic backups

---

## 📊 Container Status

```bash
# Quick status check
docker ps | grep tapmeinnfc

# Should show 3 containers:
# - tapmeinnfc-app-prod (healthy)
# - tapmeinnfc-mongo-prod
# - tapmeinnfc-redis-prod
```

---

## 🆘 Quick Fixes

### Reset Everything
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Rebuild App Only
```bash
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate tapmeinnfc
```

### View All Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📱 First Login

1. Navigate to: `https://tapmeinnfc.com`
2. Login with:
   - **Email**: Your `ADMIN_EMAIL`
   - **Password**: Your `ADMIN_PASSWORD`
3. **IMPORTANT**: Change password immediately!

---

## 🔄 Update Stack

**In Portainer**:
1. Stacks → `tapmeinnfc` → Editor
2. ✓ Re-pull image and redeploy
3. Update the stack

**Via CLI**:
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 Performance Tuning

### Check Resource Usage
```bash
docker stats --no-stream tapmeinnfc-app-prod
```

### Increase MongoDB Memory
```yaml
mongodb:
  command: mongod --wiredTigerCacheSizeGB 2
```

### Scale App Instances
```yaml
app:
  deploy:
    replicas: 3
```

---

## 🎯 Key Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST_PORT` | 3001 | Port exposed on host |
| `CONTAINER_PORT` | 3000 | Port inside container |
| `NODE_ENV` | production | Environment mode |
| `BASE_URL` | - | Your domain URL |
| `MONGO_USERNAME` | admin | MongoDB user |
| `JWT_SECRET` | - | JWT signing secret |

---

## 📞 Get Help

1. Check logs: `docker logs tapmeinnfc-app-prod`
2. Test health: `curl http://localhost:3001/api/health`
3. Run test script: `./scripts/test-deployment.sh`
4. Review: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Pro Tip**: Bookmark this file for quick reference during deployments!
