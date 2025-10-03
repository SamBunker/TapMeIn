# Nginx Integration Guide

This guide covers integrating TapMeIn with your existing Nginx reverse proxy setup.

## Network Configuration

TapMeIn is configured to connect to the external `d-nginx_default` network, allowing Nginx to proxy traffic to the application.

### Docker Compose Configuration

The docker-compose files are already configured with:

```yaml
networks:
  tapmeinnfc:
    driver: bridge
  d-nginx_default:
    external: true
```

This connects the app to both:
- **tapmeinnfc**: Internal network for MongoDB and Redis
- **d-nginx_default**: External network for Nginx proxy

## Port Configuration

By default, TapMeIn exposes:
- **Host Port**: 3001 (configurable via `HOST_PORT`)
- **Container Port**: 3000 (configurable via `CONTAINER_PORT`)

### In Portainer

Set these environment variables:

```
HOST_PORT=3001
CONTAINER_PORT=3000
```

This maps `localhost:3001` → `container:3000`

## Nginx Configuration Examples

### Basic Proxy Configuration

```nginx
server {
    listen 80;
    server_name tapmeinnfc.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tapmeinnfc.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to TapMeIn container
    location / {
        # Use container name instead of localhost if on same network
        proxy_pass http://tapmeinnfc-app-prod:3000;

        # OR use host port
        # proxy_pass http://host.docker.internal:3001;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://tapmeinnfc-app-prod:3000/api/health;
        access_log off;
    }
}
```

### With Nginx Proxy Manager

If using Nginx Proxy Manager (recommended for Portainer users):

1. **Add Proxy Host**:
   - **Domain**: `tapmeinnfc.yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `tapmeinnfc-app-prod`
   - **Forward Port**: `3000`
   - **Cache Assets**: ✓ Enabled
   - **Block Common Exploits**: ✓ Enabled
   - **Websockets Support**: ✓ Enabled

2. **SSL Tab**:
   - **SSL Certificate**: Request new Let's Encrypt certificate
   - **Force SSL**: ✓ Enabled
   - **HTTP/2 Support**: ✓ Enabled

3. **Advanced Tab** (optional):
   ```nginx
   # Custom headers
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;

   # Increase timeouts for large uploads
   client_max_body_size 10M;
   proxy_connect_timeout 60s;
   proxy_send_timeout 60s;
   proxy_read_timeout 60s;
   ```

### With Subdirectory

To serve TapMeIn from a subdirectory (e.g., `yourdomain.com/tapmeinnfc`):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration...

    location /tapmeinnfc/ {
        proxy_pass http://tapmeinnfc-app-prod:3000/;

        # Rewrite location header
        proxy_redirect / /tapmeinnfc/;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /tapmeinnfc;
    }
}
```

**Note**: You'll also need to update `BASE_URL` in environment variables:
```
BASE_URL=https://yourdomain.com/tapmeinnfc
```

## Nginx in Docker (Same Network)

If your Nginx is also running in Docker on the `d-nginx_default` network:

```yaml
# In your nginx docker-compose
services:
  nginx:
    image: nginx:alpine
    networks:
      - d-nginx_default
    # ... rest of config
```

Then use the container name directly:

```nginx
location / {
    proxy_pass http://tapmeinnfc-app-prod:3000;
}
```

## Environment Variables for Nginx Setup

In Portainer, ensure these are set:

```
# Base URL should match your Nginx domain
BASE_URL=https://tapmeinnfc.yourdomain.com

# Ports (defaults shown)
HOST_PORT=3001
CONTAINER_PORT=3000

# Trust proxy for correct IP detection
NODE_ENV=production
```

## Verify Network Connection

After deploying, verify the networks are connected:

```bash
# List networks
docker network ls

# Inspect d-nginx_default network
docker network inspect d-nginx_default

# You should see tapmeinnfc-app-prod in the containers list
```

## Testing the Setup

### 1. Test Container Directly

```bash
# From host
curl http://localhost:3001/api/health

# Expected response:
# {"status":"OK","timestamp":"...","environment":"production"}
```

### 2. Test from Nginx Container

```bash
# Access nginx container
docker exec -it nginx-container-name sh

# Test connection to TapMeIn
wget -O- http://tapmeinnfc-app-prod:3000/api/health

# Or with curl
curl http://tapmeinnfc-app-prod:3000/api/health
```

### 3. Test Through Nginx Proxy

```bash
curl https://tapmeinnfc.yourdomain.com/api/health
```

## Troubleshooting

### Nginx Can't Connect to Container

**Error**: `502 Bad Gateway` or `host not found`

**Solutions**:

1. Verify both containers are on the same network:
   ```bash
   docker network inspect d-nginx_default
   ```

2. Check container name is correct:
   ```bash
   docker ps | grep tapmeinnfc
   ```

3. Test connection from Nginx container:
   ```bash
   docker exec nginx-container ping tapmeinnfc-app-prod
   ```

4. Verify container is running:
   ```bash
   docker ps | grep tapmeinnfc-app-prod
   ```

### Invalid Response from Container

**Error**: Nginx receives invalid response

**Solution**: Check container logs:
```bash
docker logs tapmeinnfc-app-prod -f
```

### SSL/HTTPS Issues

If you're getting SSL errors, ensure:

1. `BASE_URL` uses `https://`:
   ```
   BASE_URL=https://tapmeinnfc.yourdomain.com
   ```

2. Nginx SSL certificates are valid

3. `X-Forwarded-Proto` header is set in Nginx:
   ```nginx
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

### Port Already in Use

If port 3001 is already in use:

1. Change `HOST_PORT` in Portainer:
   ```
   HOST_PORT=3002
   ```

2. Or don't expose the port at all (if using container name):
   ```yaml
   # In docker-compose, comment out or remove:
   # ports:
   #   - "${HOST_PORT:-3001}:${CONTAINER_PORT:-3000}"
   ```

## Advanced: Multiple Instances

To run multiple TapMeIn instances behind Nginx:

```nginx
upstream tapmeinnfc_backend {
    server tapmeinnfc-app-prod-1:3000;
    server tapmeinnfc-app-prod-2:3000;
    server tapmeinnfc-app-prod-3:3000;
}

server {
    # ... SSL config ...

    location / {
        proxy_pass http://tapmeinnfc_backend;
        # ... headers ...
    }
}
```

## Rate Limiting with Nginx

Add rate limiting at Nginx level:

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=tapmeinnfc:10m rate=10r/s;

server {
    # ... config ...

    location / {
        limit_req zone=tapmeinnfc burst=20 nodelay;
        proxy_pass http://tapmeinnfc-app-prod:3000;
        # ... rest ...
    }
}
```

## Security Headers

Add additional security headers in Nginx:

```nginx
location / {
    proxy_pass http://tapmeinnfc-app-prod:3000;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ... rest of config ...
}
```

## Complete Example for Portainer

**Portainer Stack Environment Variables**:
```
MONGO_USERNAME=admin
MONGO_PASSWORD=SecurePass123!
JWT_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-64-char-refresh-secret
SESSION_SECRET=your-64-char-session-secret
BASE_URL=https://tapmeinnfc.yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ChangeMe123!
NODE_ENV=production
HOST_PORT=3001
CONTAINER_PORT=3000
```

**Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name tapmeinnfc.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/tapmeinnfc.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tapmeinnfc.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://tapmeinnfc-app-prod:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

**Ready to deploy!** Your TapMeIn instance will now be accessible through Nginx with SSL.
