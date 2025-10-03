# Docker Quick Start Guide

Choose your deployment method:

## 🏠 Local Development

**Just run and code:**

```bash
# Windows
run-local.bat

# Mac/Linux
./run-local.sh
```

**Full stack (App + MongoDB + Redis):**

```bash
# Windows
run-local-full.bat

# Mac/Linux
./run-local-full.sh
```

📖 Full guide: [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

---

## 🚀 Production Deployment (Portainer)

**Quick steps:**

1. Upload [docker-compose.portainer.yml](./docker-compose.portainer.yml) to Portainer
2. Copy environment variables from [.env.portainer.txt](./.env.portainer.txt)
3. Deploy stack
4. Configure Nginx: `proxy_pass http://tapmeinnfc-app-prod:3001;`

📖 Full guide: [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md)

---

## 📚 All Documentation

| File | Purpose |
|------|---------|
| [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) | Local development with Docker |
| [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md) | 5-minute Portainer setup |
| [NGINX_SETUP.md](./NGINX_SETUP.md) | Nginx reverse proxy setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete deployment guide |
| [DOCKER_SUMMARY.md](./DOCKER_SUMMARY.md) | Overview of all Docker files |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Command cheat sheet |

---

## 🔧 Files Overview

### Local Development
- `run-local.bat` / `run-local.sh` - Simple container
- `run-local-full.bat` / `run-local-full.sh` - Full stack
- `docker-compose.local.yml` - Local stack configuration

### Production Deployment
- `Dockerfile` - Production container image
- `docker-compose.prod.yml` - Full production stack
- `docker-compose.portainer.yml` - Portainer-ready stack
- `.env.production.example` - Environment template
- `.env.portainer.txt` - Quick copy-paste env vars

### Testing
- `scripts/test-deployment.sh` - Validate deployment

---

## ❓ Quick Help

**Choose based on your need:**

- 💻 **Coding locally?** → Use `run-local.bat`
- 🧪 **Testing full stack?** → Use `run-local-full.bat`
- 🚀 **Deploying to production?** → Read [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md)
- 🌐 **Setting up Nginx?** → Read [NGINX_SETUP.md](./NGINX_SETUP.md)
- 🆘 **Need help?** → Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

**Get started in seconds!** Just run the appropriate script for your platform.
