# Local Development with Docker

Quick start guide for running TapMeIn locally using Docker.

## 🚀 Quick Start Options

### Option 1: Simple Container (Just the App)

**Windows**:
```bash
run-local.bat
```

**Mac/Linux**:
```bash
chmod +x run-local.sh
./run-local.sh
```

This runs:
- Just the Node.js app in a container
- Connects to MongoDB/Redis on your host (localhost)
- Uses your `.env` file
- Hot reload with nodemon
- Port: `http://localhost:3000`

### Option 2: Full Stack (App + MongoDB + Redis)

**Windows**:
```bash
run-local-full.bat
```

**Mac/Linux**:
```bash
chmod +x run-local-full.sh
./run-local-full.sh
```

Or directly:
```bash
docker-compose -f docker-compose.local.yml up
```

This runs:
- Node.js app container
- MongoDB container
- Redis container
- All connected via Docker network
- Hot reload with nodemon
- Port: `http://localhost:3000`

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **`.env` file** in project root (copy from `.env` example if needed)

## 🔧 Configuration

### Environment File

The scripts use your existing `.env` file. Ensure these are set:

```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:password123@localhost:27017/tapmeinnfc_dev?authSource=admin
JWT_SECRET=dev-secret-here
JWT_REFRESH_SECRET=dev-refresh-secret-here
SESSION_SECRET=dev-session-secret-here
BASE_URL=http://localhost:3000
```

### Port Customization

To change the port, edit the respective file:

**`run-local.bat`**:
```batch
-p 3001:3001 ^
```

**`docker-compose.local.yml`**:
```yaml
ports:
  - "3001:3001"
environment:
  PORT: 3001
```

## 🔄 Hot Reload

All local development scripts use `npm run dev` which runs **nodemon** for automatic restarts when you edit files.

**What triggers reload**:
- Changes to `.js` files
- Changes to route files
- Changes to middleware
- Changes to models

**What doesn't trigger reload**:
- Changes to `.env` (requires manual restart)
- Changes to `package.json` (requires rebuild)
- Changes to views (Handlebars hot reloads automatically)

## 📂 File Structure

```
TapMeIn/
├── run-local.bat              # Simple Windows launcher
├── run-local.sh               # Simple Mac/Linux launcher
├── run-local-full.bat         # Full stack Windows launcher
├── run-local-full.sh          # Full stack Mac/Linux launcher
├── docker-compose.local.yml   # Full local stack config
├── .env                       # Your local environment variables
└── LOCAL_DEVELOPMENT.md       # This file
```

## 🛠️ Common Tasks

### View Logs

**Simple Container**:
```bash
# Logs are shown in the terminal by default
# Press Ctrl+C to stop
```

**Full Stack**:
```bash
# View all logs
docker-compose -f docker-compose.local.yml logs -f

# View app logs only
docker-compose -f docker-compose.local.yml logs -f app

# View MongoDB logs
docker-compose -f docker-compose.local.yml logs -f mongodb
```

### Stop Containers

**Simple Container**:
```bash
# Press Ctrl+C in the terminal
# Container auto-removes (--rm flag)
```

**Full Stack**:
```bash
# Stop and remove containers
docker-compose -f docker-compose.local.yml down

# Stop and remove containers + volumes (deletes database!)
docker-compose -f docker-compose.local.yml down -v
```

### Restart

**Simple Container**:
```bash
# Just run the script again
run-local.bat
```

**Full Stack**:
```bash
# Restart all services
docker-compose -f docker-compose.local.yml restart

# Restart just the app
docker-compose -f docker-compose.local.yml restart app
```

### Access Container Shell

**Simple Container**:
```bash
docker exec -it tapmeinnfc-local bash
```

**Full Stack**:
```bash
# App container
docker exec -it tapmeinnfc-app-local bash

# MongoDB container
docker exec -it tapmeinnfc-mongo-local mongosh -u admin -p password123

# Redis container
docker exec -it tapmeinnfc-redis-local redis-cli
```

### Install New Packages

**Option 1: Let it auto-install**
```bash
# Add to package.json, then restart container
# It will run npm install automatically
```

**Option 2: Manual install**
```bash
# Access container
docker exec -it tapmeinnfc-local bash

# Install package
npm install package-name

# Exit
exit
```

**Option 3: Install on host**
```bash
# Install on host machine
npm install package-name

# Restart container to pick up changes
```

## 🐛 Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**: Stop the conflicting service or change port
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <process-id> /F

# Or change port in script
-p 3001:3001
```

### MongoDB Connection Failed

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution 1**: Using simple container
```bash
# Ensure MongoDB is running on host
# Check MONGODB_URI in .env points to localhost or host.docker.internal
```

**Solution 2**: Using full stack
```bash
# Use the full stack version instead
run-local-full.bat
```

### Node Modules Issues

**Error**: Module not found or version mismatch

**Solution**: Clear node_modules volume
```bash
# Full stack
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up

# Simple container (auto-clears on restart)
run-local.bat
```

### Changes Not Reflecting

**Solution 1**: Check nodemon is running
```bash
# Look for this in logs:
# [nodemon] watching path(s): *.*
# [nodemon] watching extensions: js,mjs,json
```

**Solution 2**: Force restart
```bash
# Press 'rs' + Enter in the terminal running the container
rs
```

**Solution 3**: Rebuild container
```bash
docker-compose -f docker-compose.local.yml up --build
```

## 🔒 Database Persistence

### Simple Container (`run-local.bat`)
- Uses MongoDB on your **host machine**
- Data persists between runs
- Shares database with non-Docker development

### Full Stack (`run-local-full.bat`)
- Uses MongoDB in **Docker volume**
- Data persists between runs
- Separate from host MongoDB
- Delete with: `docker-compose -f docker-compose.local.yml down -v`

## 📊 Performance

### Windows Performance Tips

1. **Use named volumes** for node_modules (already configured in `docker-compose.local.yml`)
2. **Enable WSL 2** for better Docker performance
3. **Exclude from antivirus**: Add Docker volumes to exclusions

### Speed Comparison

| Setup | Startup Time | Hot Reload |
|-------|--------------|------------|
| Native (no Docker) | ~5s | Instant |
| Simple Container | ~10s | ~1-2s |
| Full Stack | ~15s | ~1-2s |

## 🎯 Which Option to Use?

### Use Simple Container (`run-local.bat`) when:
- ✅ You already have MongoDB/Redis installed locally
- ✅ You want faster startup
- ✅ You want to share database with native development
- ✅ You're making quick changes

### Use Full Stack (`run-local-full.bat`) when:
- ✅ You don't have MongoDB/Redis installed
- ✅ You want isolated database for testing
- ✅ You want the exact production environment
- ✅ You're testing database migrations
- ✅ Multiple developers need identical setup

## 📝 Example Workflow

### Typical Development Session

```bash
# 1. Start development environment
run-local-full.bat

# 2. Access the app
# Open browser: http://localhost:3000

# 3. Make changes to code
# Files auto-reload via nodemon

# 4. View logs in terminal
# Watch for errors or debug output

# 5. Stop when done
# Press Ctrl+C

# 6. Cleanup (optional)
docker-compose -f docker-compose.local.yml down
```

### Testing Database Changes

```bash
# 1. Start with fresh database
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up

# 2. Run migrations or seed data
docker exec -it tapmeinnfc-app-local npm run seed

# 3. Test your changes

# 4. Cleanup
docker-compose -f docker-compose.local.yml down -v
```

## 🆚 Comparison with Existing Scripts

Your existing `package.json` scripts vs Docker:

| package.json | Docker Equivalent | Notes |
|--------------|-------------------|-------|
| `npm run dev` | `run-local.bat` | Runs in container |
| `npm start` | (See production Dockerfile) | Production mode |
| `npm test` | `docker exec -it tapmeinnfc-local npm test` | Run tests in container |

## 🔗 Related Documentation

- **Production Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Portainer Setup**: See [PORTAINER_QUICK_START.md](./PORTAINER_QUICK_START.md)
- **Docker Overview**: See [README.Docker.md](./README.Docker.md)

---

**Happy coding!** 🚀 Your local development environment is ready to go.
