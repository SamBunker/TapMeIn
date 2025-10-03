# Port Configuration Guide

This document explains all port mappings used by TapMeIn containers.

## 🔌 Port Overview

| Service | Internal Port | Host Port (Default) | Configurable? | Purpose |
|---------|---------------|---------------------|---------------|---------|
| **TapMeIn App** | 3000 | 3001 | ✅ Yes (`HOST_PORT`) | Application access |
| **MongoDB** | 27017 | 27018 | ✅ Yes (`MONGO_PORT`) | Database access |
| **Redis** | 6379 | 6380 | ✅ Yes (`REDIS_PORT`) | Cache access |

## 📊 Port Mapping Explained

### Format: `HOST_PORT:CONTAINER_PORT`

**Example**: `27018:27017`
- **27018** = Port on your host machine (what you connect to from outside)
- **27017** = Port inside the container (what MongoDB listens on internally)

## 🎯 Default Ports

### Production (`docker-compose.prod.yml` & `docker-compose.portainer.yml`)

```yaml
App:      3001:3000  (or custom via HOST_PORT)
MongoDB:  27018:27017 (or custom via MONGO_PORT)
Redis:    6380:6379  (or custom via REDIS_PORT)
```

### Local Development (`docker-compose.local.yml`)

```yaml
App:      3000:3000  (fixed for local dev)
MongoDB:  27019:27017 (fixed, different from prod)
Redis:    6381:6379  (fixed, different from prod)
```

## 🔧 Why Different Ports?

### Problem
Your host machine already has MongoDB running on port **27017**. If we try to use the same port, Docker will fail with:
```
Error: port is already allocated
```

### Solution
We map to **different host ports**:
- **Production MongoDB**: 27018 (instead of 27017)
- **Local Dev MongoDB**: 27019 (so you can run both at once!)
- **Production Redis**: 6380 (instead of 6379)
- **Local Dev Redis**: 6381 (so you can run both at once!)

## 🌐 Network Access

### From Nginx (Recommended - Uses Container Names)
```nginx
# App container (via Docker network)
proxy_pass http://tapmeinnfc-app-prod:3000;
```

**Note**: Nginx connects directly to the **container port (3000)** via Docker network. No host port needed!

### From Your Computer (Direct Access)
```bash
# App
curl http://localhost:3001

# MongoDB (if you need direct access)
mongosh mongodb://admin:password@localhost:27018/tapmeinnfc

# Redis (if you need direct access)
redis-cli -h localhost -p 6380
```

### From Inside Containers (Inter-container Communication)
Containers use **service names** and **internal ports**:
```bash
# App connects to MongoDB
mongodb://admin:password@mongodb:27017/tapmeinnfc

# App connects to Redis
redis://redis:6379
```

## ⚙️ Customizing Ports

### In Portainer

Add these environment variables:

```bash
# Application port (exposed to host/Nginx)
HOST_PORT=3001          # Change if needed
CONTAINER_PORT=3000     # Don't change unless you know why

# MongoDB port (exposed to host)
MONGO_PORT=27018        # Change if port conflict

# Redis port (exposed to host)
REDIS_PORT=6380         # Change if port conflict
```

### In Docker Compose

```bash
# Start with custom ports
docker-compose -f docker-compose.prod.yml up -d

# Environment variables will be read from .env.production
```

### In `.env.production`

```bash
HOST_PORT=3001
CONTAINER_PORT=3000
MONGO_PORT=27018
REDIS_PORT=6380
```

## 🔍 Check What's Using a Port

### Windows
```cmd
# Check who's using port 27017
netstat -ano | findstr :27017

# Kill the process (if needed)
taskkill /PID <process-id> /F
```

### Linux/Mac
```bash
# Check who's using port 27017
lsof -i :27017

# Kill the process (if needed)
kill -9 <process-id>
```

## 🐛 Troubleshooting

### Error: "port is already allocated"

**Cause**: Another service is using that port

**Solutions**:

1. **Change the port** in environment variables:
   ```bash
   MONGO_PORT=27020  # Use a different port
   ```

2. **Stop the conflicting service**:
   ```bash
   # Find what's using it
   netstat -ano | findstr :27017

   # Stop it
   docker stop <container-name>
   # or
   taskkill /PID <process-id> /F
   ```

3. **Don't expose the port** (if you don't need external access):
   ```yaml
   # Remove the ports section entirely
   # mongodb:
   #   ports:
   #     - "27018:27017"  # Remove this
   ```

### Can't Connect to MongoDB

**From host machine**:
```bash
# Use the HOST port
mongosh mongodb://admin:password@localhost:27018/tapmeinnfc
```

**From app container**:
```bash
# Use the container name and INTERNAL port
mongodb://admin:password@mongodb:27017/tapmeinnfc
```

### Nginx Can't Reach App

**Wrong** (uses host port):
```nginx
proxy_pass http://tapmeinnfc-app-prod:3001;  # ❌ Wrong!
```

**Correct** (uses container port):
```nginx
proxy_pass http://tapmeinnfc-app-prod:3000;  # ✅ Correct!
```

Or use the host port via localhost:
```nginx
proxy_pass http://localhost:3001;  # ✅ Also works
```

## 📋 Port Reference by Environment

### Development (Local)
```
Application:    http://localhost:3000
MongoDB:        mongodb://localhost:27019
Redis:          redis://localhost:6381
```

### Production (Portainer)
```
Application:    http://localhost:3001 (or via Nginx)
MongoDB:        mongodb://localhost:27018 (direct access)
Redis:          redis://localhost:6380 (direct access)
```

### Inside Containers (All environments)
```
Application:    http://app:3000
MongoDB:        mongodb://mongodb:27017
Redis:          redis://redis:6379
```

## 🎨 Visual Port Mapping

```
┌─────────────────────────────────────────────────┐
│              Your Host Machine                   │
│                                                  │
│  Port 3000  → TapMeIn (local dev)               │
│  Port 3001  → TapMeIn (production) ←── Nginx    │
│  Port 27017 → Your existing MongoDB             │
│  Port 27018 → TapMeIn MongoDB (prod)            │
│  Port 27019 → TapMeIn MongoDB (local)           │
│  Port 6379  → Your existing Redis (maybe)       │
│  Port 6380  → TapMeIn Redis (prod)              │
│  Port 6381  → TapMeIn Redis (local)             │
│                                                  │
└─────────────────────────────────────────────────┘
         ↓ Docker Network (d-nginx_default)
┌─────────────────────────────────────────────────┐
│           Inside Docker Containers               │
│                                                  │
│  tapmeinnfc-app-prod:3000   ← App listens here  │
│  mongodb:27017              ← MongoDB listens   │
│  redis:6379                 ← Redis listens     │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 🔐 Security Note

**External ports** (27018, 6380) expose your database to the network. In production:

1. **Firewall these ports** - only allow local access
2. **Use strong passwords** - especially for MongoDB
3. **Consider removing port mappings** if you don't need direct access:
   ```yaml
   # Instead of:
   ports:
     - "27018:27017"

   # Just remove it - containers can still talk via Docker network
   ```

## ✅ Summary

- **App Port**: 3001 (customizable via `HOST_PORT`)
- **MongoDB Port**: 27018 (customizable via `MONGO_PORT`)
- **Redis Port**: 6380 (customizable via `REDIS_PORT`)
- **Local Dev Uses**: Different ports (3000, 27019, 6381)
- **Nginx Connects To**: Container port 3000 (not host port!)
- **All Customizable**: Via environment variables

---

**Need to change ports?** Update environment variables in Portainer or `.env.production` file.
