# Docker Files Index

Complete reference for all Docker-related files in this project.

## 📂 File Organization

```
TapMeIn/
├── 🐳 Docker Configuration
│   ├── Dockerfile                      # Production container image
│   ├── .dockerignore                   # Build exclusions
│   ├── docker-compose.yml              # Original dev stack
│   ├── docker-compose.prod.yml         # Production stack
│   ├── docker-compose.portainer.yml    # Portainer deployment
│   └── docker-compose.local.yml        # Local development stack
│
├── 🚀 Quick Launch Scripts
│   ├── run-local.bat                   # Windows: Simple container
│   ├── run-local.sh                    # Linux/Mac: Simple container
│   ├── run-local-full.bat              # Windows: Full stack
│   └── run-local-full.sh               # Linux/Mac: Full stack
│
├── ⚙️ Environment Configuration
│   ├── .env                            # Your local environment (gitignored)
│   ├── .env.production.example         # Production template
│   └── .env.portainer.txt              # Quick copy-paste for Portainer
│
├── 📖 Documentation
│   ├── README.DOCKER.quick.md          # Quick start guide (START HERE!)
│   ├── LOCAL_DEVELOPMENT.md            # Local Docker development
│   ├── PORTAINER_QUICK_START.md        # 5-min Portainer deployment
│   ├── NGINX_SETUP.md                  # Nginx reverse proxy setup
│   ├── DEPLOYMENT.md                   # Complete deployment guide
│   ├── DOCKER_SUMMARY.md               # Overview of Docker setup
│   ├── QUICK_REFERENCE.md              # Command cheat sheet
│   └── DOCKER_FILES_INDEX.md           # This file
│
└── 🧪 Testing & Utilities
    └── scripts/test-deployment.sh      # Deployment validation script
```

---

## 🎯 Quick Navigation

### I want to...

| Goal | File to Use |
|------|-------------|
| **Run app locally (Windows)** | [run-local.bat](./run-local.bat) |
| **Run app locally (Mac/Linux)** | [run-local.sh](./run-local.sh) |
| **Run full stack locally** | [run-local-full.bat](./run-local-full.bat) or [.sh](./run-local-full.sh) |
| **Deploy to Portainer** | [docker-compose.portainer.yml](./docker-compose.portainer.yml) |
| **Deploy via Docker Compose** | [docker-compose.prod.yml](./docker-compose.prod.yml) |
| **Configure Nginx** | [NGINX_SETUP.md](./NGINX_SETUP.md) |
| **Set up environment** | [.env.portainer.txt](./.env.portainer.txt) |
| **Learn about ports** | [NGINX_SETUP.md](./NGINX_SETUP.md#port-configuration) |
| **Test deployment** | [scripts/test-deployment.sh](./scripts/test-deployment.sh) |
| **Troubleshoot** | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-troubleshooting) |

---

## 📋 File Details

### Docker Configuration Files

#### `Dockerfile`
**Purpose**: Production-optimized Node.js container image

**Key features**:
- Based on `node:18-slim`
- Includes build dependencies for bcrypt
- Health check on `/api/health`
- Production npm install
- Runs `node app.js`

**When to use**: Building production images

---

#### `docker-compose.yml`
**Purpose**: Original development stack

**Includes**:
- MongoDB (port 27017)
- Redis (port 6379)
- App with volume mounting for hot reload

**When to use**: Original dev setup (use `docker-compose.local.yml` instead)

---

#### `docker-compose.prod.yml`
**Purpose**: Full production deployment stack

**Includes**:
- MongoDB with health checks
- Redis with health checks
- TapMeIn app built from Dockerfile
- External `d-nginx_default` network
- Persistent volumes
- Configurable `HOST_PORT` and `CONTAINER_PORT`

**When to use**: Production deployment via Docker Compose CLI

**Command**: `docker-compose -f docker-compose.prod.yml up -d`

---

#### `docker-compose.portainer.yml`
**Purpose**: Simplified stack for Portainer

**Same as prod but**:
- Optimized for Portainer UI
- Cleaner format
- Can build from GitHub repo or local

**When to use**: Deploying via Portainer Stacks

**How**: Upload to Portainer → Configure env vars → Deploy

---

#### `docker-compose.local.yml`
**Purpose**: Local development with full stack

**Includes**:
- MongoDB (dev credentials)
- Redis
- App with nodemon for hot reload
- Named volume for node_modules (faster on Windows)

**When to use**: Local development with isolated database

**Command**: `docker-compose -f docker-compose.local.yml up`

---

### Launch Scripts

#### `run-local.bat` / `run-local.sh`
**Purpose**: Quick single-container development

**What it does**:
- Stops existing container
- Starts fresh Node.js container
- Mounts your code for hot reload
- Uses your local `.env` file
- Connects to MongoDB/Redis on host
- Port: 3000

**When to use**: Quick coding sessions with existing MongoDB

**Command**:
- Windows: `run-local.bat`
- Mac/Linux: `./run-local.sh`

---

#### `run-local-full.bat` / `run-local-full.sh`
**Purpose**: Full local stack launcher

**What it does**:
- Runs `docker-compose -f docker-compose.local.yml up`
- Starts MongoDB, Redis, and app
- Isolated from host databases

**When to use**: Need MongoDB/Redis in containers

**Command**:
- Windows: `run-local-full.bat`
- Mac/Linux: `./run-local-full.sh`

---

### Environment Files

#### `.env`
**Purpose**: Your local environment variables

**Status**: Gitignored (not committed)

**Used by**:
- `run-local.bat`
- `run-local.sh`
- Local Node.js development

---

#### `.env.production.example`
**Purpose**: Template for production environment

**Contents**:
- All available environment variables
- Comments explaining each
- Instructions for generating secrets

**How to use**:
```bash
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

---

#### `.env.portainer.txt`
**Purpose**: Quick copy-paste for Portainer UI

**Contents**:
- Minimal required variables
- Ready to paste into Portainer
- Includes comments

**How to use**:
1. Open file
2. Replace placeholder values
3. Copy all lines
4. Paste into Portainer environment variables

---

### Documentation

#### `README.DOCKER.quick.md` ⭐ START HERE
**Purpose**: Quick navigation to all Docker docs

**Who it's for**: Everyone

**What's inside**:
- Quick links to all guides
- Decision tree (which file to use)
- Overview of all files

---

#### `LOCAL_DEVELOPMENT.md`
**Purpose**: Complete local development guide

**Topics**:
- How to run locally
- Port configuration
- Hot reload
- Troubleshooting
- Performance tips

**Who it's for**: Developers coding locally

---

#### `PORTAINER_QUICK_START.md`
**Purpose**: 5-minute Portainer deployment

**Topics**:
- Step-by-step Portainer setup
- Environment variables
- SSL configuration
- Troubleshooting

**Who it's for**: Deploying to Portainer

---

#### `NGINX_SETUP.md`
**Purpose**: Nginx reverse proxy integration

**Topics**:
- Network configuration
- Port explanation (HOST_PORT vs CONTAINER_PORT)
- Nginx config examples
- Nginx Proxy Manager setup
- Troubleshooting

**Who it's for**: Setting up Nginx proxy

---

#### `DEPLOYMENT.md`
**Purpose**: Comprehensive deployment guide

**Topics**:
- All deployment methods
- Environment configuration
- Backup and restore
- Monitoring
- Security
- Troubleshooting

**Who it's for**: Production deployment

---

#### `DOCKER_SUMMARY.md`
**Purpose**: High-level overview

**Topics**:
- Architecture diagram
- File purposes
- Quick reference
- Security checklist

**Who it's for**: Understanding the complete setup

---

#### `QUICK_REFERENCE.md`
**Purpose**: Command cheat sheet

**Topics**:
- Common commands
- Quick troubleshooting
- Environment variables
- URLs

**Who it's for**: Quick lookups during deployment/development

---

### Testing & Utilities

#### `scripts/test-deployment.sh`
**Purpose**: Automated deployment validation

**What it tests**:
- Container status
- Health checks
- Network connectivity
- Database connectivity
- Environment variables
- Logs for errors

**How to use**:
```bash
./scripts/test-deployment.sh localhost 3001
```

---

## 🎨 Color Coding

When viewing this project:

- 🐳 **Blue** = Docker config files
- 🚀 **Red** = Launch scripts
- ⚙️ **Yellow** = Environment/config
- 📖 **Green** = Documentation
- 🧪 **Purple** = Testing/utilities

---

## 🔄 Workflow Examples

### Scenario 1: Local Development

```
1. run-local.bat
2. Edit code
3. Auto-reload happens
4. Test at http://localhost:3000
5. Ctrl+C to stop
```

**Files used**: `run-local.bat`, `.env`

---

### Scenario 2: Test Full Stack Locally

```
1. run-local-full.bat
2. App, MongoDB, Redis all start
3. Test complete functionality
4. Ctrl+C to stop
5. docker-compose -f docker-compose.local.yml down
```

**Files used**: `run-local-full.bat`, `docker-compose.local.yml`, `.env`

---

### Scenario 3: Deploy to Portainer

```
1. Read PORTAINER_QUICK_START.md
2. Copy docker-compose.portainer.yml to Portainer
3. Copy env vars from .env.portainer.txt
4. Customize secrets
5. Deploy
6. Configure Nginx using NGINX_SETUP.md
```

**Files used**: `docker-compose.portainer.yml`, `.env.portainer.txt`, `PORTAINER_QUICK_START.md`, `NGINX_SETUP.md`

---

### Scenario 4: Deploy via CLI

```
1. cp .env.production.example .env.production
2. Edit .env.production
3. docker-compose -f docker-compose.prod.yml up -d
4. ./scripts/test-deployment.sh
5. Configure Nginx
```

**Files used**: `docker-compose.prod.yml`, `.env.production.example`, `scripts/test-deployment.sh`

---

## 📊 File Relationships

```
run-local.bat → .env → (Your host MongoDB/Redis)
     ↓
  Uses: Single Node.js container

run-local-full.bat → docker-compose.local.yml → .env
     ↓
  Uses: App + MongoDB + Redis containers

docker-compose.prod.yml → .env.production
     ↓
  Builds: Dockerfile
  Uses: d-nginx_default network

docker-compose.portainer.yml → (Portainer UI env vars)
     ↓
  Builds: Dockerfile
  Uses: d-nginx_default network
```

---

## 🆘 Getting Help

**Can't find what you need?**

1. Check [README.DOCKER.quick.md](./README.DOCKER.quick.md)
2. Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. Read the relevant detailed guide
4. Check troubleshooting sections

**Still stuck?**

- Check container logs: `docker logs tapmeinnfc-app-prod -f`
- Test health: `curl http://localhost:3001/api/health`
- Run test script: `./scripts/test-deployment.sh`

---

## 📝 Notes

- All `.sh` scripts are executable (`chmod +x`)
- All `.bat` scripts work on Windows
- All `docker-compose` files use version 3.8
- All containers use `unless-stopped` restart policy
- All production containers have health checks

---

**Need a quick start?** Go to [README.DOCKER.quick.md](./README.DOCKER.quick.md)!
