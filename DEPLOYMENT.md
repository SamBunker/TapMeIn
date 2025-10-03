# TapMeIn Docker Deployment Guide

This guide covers deploying TapMeIn to production using Docker and Portainer.

## Prerequisites

- Docker and Docker Compose installed on your server
- Portainer (optional, but recommended for easy management)
- Domain name pointed to your server (for production)
- SSL certificate (recommended for production)

## Quick Start - Portainer Deployment

### Option 1: Deploy via Portainer Stack

1. **Access Portainer** and navigate to **Stacks** → **Add Stack**

2. **Name your stack**: `tapmeinnfc`

3. **Upload or paste** the contents of `docker-compose.prod.yml`

4. **Add Environment Variables** in the Portainer UI or create `.env.production`:
   ```bash
   # Copy the example file
   cp .env.production.example .env.production

   # Edit with your actual values
   nano .env.production
   ```

5. **Deploy the stack**

### Option 2: Deploy via Docker Compose CLI

```bash
# Clone or upload your project to the server
cd /path/to/TapMeIn

# Copy and configure environment variables
cp .env.production.example .env.production
nano .env.production

# Build and start the containers
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Environment Configuration

### Required Environment Variables

**CRITICAL**: You must set these before deployment:

```bash
# Generate secure secrets (use these commands):
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET
openssl rand -base64 64  # For SESSION_SECRET

# MongoDB credentials
MONGO_USERNAME=admin
MONGO_PASSWORD=your-secure-password-here

# Application secrets
JWT_SECRET=generated-secret-from-above
JWT_REFRESH_SECRET=generated-secret-from-above
SESSION_SECRET=generated-secret-from-above

# Domain
BASE_URL=https://your-domain.com
```

### Optional Third-Party Services

Configure these for full functionality:

- **Stripe** (payment processing)
- **SendGrid** (email notifications)
- **Twilio** (SMS notifications)
- **IPInfo** (geolocation)
- **OpenAI** (AI features)

See `.env.production.example` for all available options.

## Container Architecture

The deployment includes three containers:

1. **tapmeinnfc-app-prod**: Node.js application
2. **tapmeinnfc-mongo-prod**: MongoDB database
3. **tapmeinnfc-redis-prod**: Redis cache

## Post-Deployment Steps

### 1. Verify Deployment

```bash
# Check container health
docker ps

# View application logs
docker logs tapmeinnfc-app-prod -f

# Test health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-03T...",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Create Admin User

The admin user will be created automatically on first startup using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

Alternatively, access the container and create manually:

```bash
docker exec -it tapmeinnfc-app-prod node scripts/create-admin.js
```

### 3. Configure Reverse Proxy (Recommended)

For production, use Nginx or Traefik as a reverse proxy with SSL:

#### Nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Traefik Labels (for docker-compose.prod.yml)

Add to the `tapmeinnfc` service:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tapmeinnfc.rule=Host(`your-domain.com`)"
  - "traefik.http.routers.tapmeinnfc.entrypoints=websecure"
  - "traefik.http.routers.tapmeinnfc.tls.certresolver=letsencrypt"
  - "traefik.http.services.tapmeinnfc.loadbalancer.server.port=3000"
```

## Updating the Application

### Method 1: Via Portainer

1. Navigate to your stack
2. Click **Editor**
3. Make changes if needed
4. Click **Update the stack**
5. Enable "Re-pull image and redeploy"

### Method 2: Via Docker Compose

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Or restart specific service
docker-compose -f docker-compose.prod.yml restart tapmeinnfc
```

## Backup and Restore

### Backup MongoDB

```bash
# Create backup
docker exec tapmeinnfc-mongo-prod mongodump \
  -u admin \
  -p your-password \
  --authenticationDatabase admin \
  -d tapmeinnfc \
  --out /tmp/backup

# Copy backup to host
docker cp tapmeinnfc-mongo-prod:/tmp/backup ./backup-$(date +%Y%m%d)
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./backup-20251003 tapmeinnfc-mongo-prod:/tmp/restore

# Restore
docker exec tapmeinnfc-mongo-prod mongorestore \
  -u admin \
  -p your-password \
  --authenticationDatabase admin \
  -d tapmeinnfc \
  /tmp/restore/tapmeinnfc
```

### Backup Volumes

```bash
# Backup all volumes
docker run --rm \
  -v tapmeinnfc_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup-$(date +%Y%m%d).tar.gz -C /data .

docker run --rm \
  -v tapmeinnfc_uploads_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## Monitoring

### Check Container Status

```bash
# View running containers
docker ps

# View container stats
docker stats

# Check health status
docker inspect tapmeinnfc-app-prod | grep -A 10 Health
```

### View Logs

```bash
# Application logs
docker logs tapmeinnfc-app-prod -f

# MongoDB logs
docker logs tapmeinnfc-mongo-prod -f

# Redis logs
docker logs tapmeinnfc-redis-prod -f

# All containers
docker-compose -f docker-compose.prod.yml logs -f
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs tapmeinnfc-app-prod

# Check environment variables
docker exec tapmeinnfc-app-prod env

# Verify MongoDB connection
docker exec tapmeinnfc-app-prod node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Database Connection Issues

```bash
# Verify MongoDB is running
docker exec tapmeinnfc-mongo-prod mongosh -u admin -p your-password --eval "db.adminCommand('ping')"

# Check network
docker network inspect tapmeinnfc-network
```

### Reset Everything (DANGER - Deletes all data!)

```bash
# Stop and remove containers
docker-compose -f docker-compose.prod.yml down

# Remove volumes (THIS DELETES ALL DATA!)
docker volume rm tapmeinnfc_mongodb_data tapmeinnfc_redis_data tapmeinnfc_uploads_data

# Start fresh
docker-compose -f docker-compose.prod.yml up -d
```

## Performance Tuning

### Increase MongoDB Memory (for large datasets)

Edit `docker-compose.prod.yml`:

```yaml
mongodb:
  command: mongod --wiredTigerCacheSizeGB 2
```

### Scale Redis for High Traffic

```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Security Recommendations

1. **Change default passwords** immediately after deployment
2. **Use strong secrets** - minimum 32 characters
3. **Enable firewall** - only expose necessary ports (80, 443)
4. **Regular updates** - keep Docker images updated
5. **SSL/TLS** - always use HTTPS in production
6. **Backups** - automate daily backups
7. **Monitoring** - set up alerts for container failures

## Support

For issues:
1. Check logs: `docker logs tapmeinnfc-app-prod`
2. Review health endpoint: `curl http://localhost:3000/api/health`
3. Consult application logs in `/var/log` (if configured)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Portainer Documentation](https://docs.portainer.io/)
- [MongoDB in Docker](https://hub.docker.com/_/mongo)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
