# TapMeIn Docker Deployment - Summary

Complete Docker setup for deploying TapMeIn to production via Portainer with Nginx reverse proxy.

## 📦 Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Production-optimized container image |
| `docker-compose.prod.yml` | Full production stack with health checks |
| `docker-compose.portainer.yml` | Simplified stack for Portainer deployment |
| `.env.production.example` | Environment variable template |
| `.env.portainer.txt` | Quick copy-paste env vars for Portainer |
| `.dockerignore` | Files to exclude from Docker build |
| `DEPLOYMENT.md` | Comprehensive deployment guide |
| `PORTAINER_QUICK_START.md` | 5-minute quick start guide |
| `NGINX_SETUP.md` | Nginx integration guide |
| `README.Docker.md` | Docker documentation overview |
| `scripts/test-deployment.sh` | Deployment validation script |

## 🚀 Quick Deploy to Portainer

### Step 1: Upload Stack

1. Access Portainer → **Stacks** → **Add Stack**
2. **Name**: `tapmeinnfc`
3. **Upload** `docker-compose.portainer.yml`

### Step 2: Configure Environment Variables

Copy from [.env.portainer.txt](./.env.portainer.txt) and customize:

**Required**:
```
MONGO_USERNAME=admin
MONGO_PASSWORD=SecurePass123!
JWT_SECRET=[generate 64-char random]
JWT_REFRESH_SECRET=[generate 64-char random]
SESSION_SECRET=[generate 64-char random]
BASE_URL=https://tapmeinnfc.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
HOST_PORT=3001
CONTAINER_PORT=3000
```

**Generate Secrets**:
```bash
openssl rand -base64 64
```

### Step 3: Deploy

Click **Deploy the stack** and wait ~2 minutes.

### Step 4: Configure Nginx

Use container name in Nginx config:
```nginx
proxy_pass http://tapmeinnfc-app-prod:3000;
```

Full guide: [NGINX_SETUP.md](./NGINX_SETUP.md)

## 🏗️ Architecture

```
Internet → Nginx (SSL) → TapMeIn App → MongoDB + Redis
                ↓                        ↓
         d-nginx_default           tapmeinnfc
           (external)              (internal)
```

**Networks**:
- `d-nginx_default`: External network for Nginx proxy (port 3001)
- `tapmeinnfc`: Internal network for database services

**Ports**:
- `HOST_PORT=3001`: Exposed to host (configurable)
- `CONTAINER_PORT=3000`: Internal app port (default)

## 🔧 Key Features

✅ **Production-ready**: Optimized Dockerfile with multi-stage security
✅ **Health checks**: Automatic container health monitoring
✅ **External network**: Pre-configured for `d-nginx_default`
✅ **Configurable ports**: Flexible `HOST_PORT` and `CONTAINER_PORT`
✅ **Persistent data**: Volumes for MongoDB, Redis, and uploads
✅ **Auto-restart**: Containers restart on failure
✅ **Environment-based**: All config via environment variables

## 📋 Container Details

| Container | Image | Port | Network |
|-----------|-------|------|---------|
| `tapmeinnfc-app-prod` | Built from Dockerfile | 3001→3000 | Both |
| `tapmeinnfc-mongo-prod` | `mongo:7.0` | 27017 | Internal |
| `tapmeinnfc-redis-prod` | `redis:7.2-alpine` | 6379 | Internal |

## 🔍 Verify Deployment

```bash
# Check containers
docker ps

# Check health
curl http://localhost:3001/api/health

# View logs
docker logs tapmeinnfc-app-prod -f

# Run test script
./scripts/test-deployment.sh localhost 3001
```

## 📖 Documentation Guide

**For Quick Deploy**: Read [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md)
**For Nginx Setup**: Read [NGINX_SETUP.md](./NGINX_SETUP.md)
**For Full Details**: Read [DEPLOYMENT.md](./DEPLOYMENT.md)
**For Docker Info**: Read [README.Docker.md](./README.Docker.md)

## 🔒 Security Checklist

- [ ] Generated strong secrets (64+ characters)
- [ ] Changed MongoDB password from default
- [ ] Set strong admin password
- [ ] Configured SSL/TLS in Nginx
- [ ] Updated `BASE_URL` to HTTPS domain
- [ ] Firewall configured (only necessary ports)
- [ ] Reviewed environment variables
- [ ] Backup strategy in place

## 🆘 Common Issues

### Container Won't Start
```bash
docker logs tapmeinnfc-app-prod
```

### Can't Connect to Database
```bash
docker exec tapmeinnfc-mongo-prod mongosh -u admin -p your-password --eval "db.adminCommand('ping')"
```

### Nginx 502 Bad Gateway
1. Verify networks: `docker network inspect d-nginx_default`
2. Check container name: `docker ps | grep tapmeinnfc`
3. Test from Nginx: `docker exec nginx-container curl http://tapmeinnfc-app-prod:3000/api/health`

### Port Already in Use
Change `HOST_PORT` in Portainer:
```
HOST_PORT=3002
```

## 🔄 Update Application

In Portainer:
1. **Stacks** → `tapmeinnfc` → **Editor**
2. Enable "**Re-pull image and redeploy**"
3. Click **Update the stack**

## 💾 Backup

```bash
# Backup MongoDB
docker exec tapmeinnfc-mongo-prod mongodump \
  -u admin -p password \
  --authenticationDatabase admin \
  -d tapmeinnfc \
  --out /tmp/backup

# Copy to host
docker cp tapmeinnfc-mongo-prod:/tmp/backup ./backup-$(date +%Y%m%d)
```

## 🌐 Access Points

After deployment:

- **Application**: `https://tapmeinnfc.com` (via Nginx)
- **Direct Access**: `http://localhost:3001` (for testing)
- **Health Check**: `http://localhost:3001/api/health`
- **Admin Panel**: `https://tapmeinnfc.com/admin`

## 📊 Monitoring

```bash
# Container stats
docker stats tapmeinnfc-app-prod

# Real-time logs
docker logs tapmeinnfc-app-prod -f

# Health status
docker inspect tapmeinnfc-app-prod | grep Health -A 10
```

## 🚨 Production Recommendations

1. **SSL/TLS**: Always use HTTPS in production
2. **Secrets**: Use strong, randomly generated secrets
3. **Backups**: Automate daily MongoDB backups
4. **Monitoring**: Set up health check alerts
5. **Updates**: Keep Docker images updated
6. **Logs**: Implement log aggregation (ELK, Graylog)
7. **Firewall**: Restrict access to necessary ports only

## 📈 Scaling

### Horizontal Scaling

```yaml
# In docker-compose.portainer.yml
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
```

## 🎯 Next Steps

1. ✅ Deploy stack in Portainer
2. ✅ Configure Nginx reverse proxy
3. ✅ Set up SSL certificate (Let's Encrypt)
4. ✅ Configure third-party services (Stripe, SendGrid)
5. ✅ Test all functionality
6. ✅ Set up automated backups
7. ✅ Configure monitoring/alerts
8. ✅ Review security settings

## 📞 Support

- **Logs**: `docker logs tapmeinnfc-app-prod -f`
- **Health**: `curl http://localhost:3001/api/health`
- **Test**: `./scripts/test-deployment.sh`
- **Network**: `docker network inspect d-nginx_default`

---

**Ready to deploy!** Start with [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md) for the fastest path to production.
