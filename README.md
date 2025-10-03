# TapMeIn
NFC Card Management System

## Docker Development Environment

### Quick Start
```bash
# Start development environment
docker run -v "D:/Development Projects/TapMeIn/:/app" -w /app -p 3000:3000 node:18-slim bash -c "npm install && node app.js"
```

### Development Setup
1. Ensure Docker Desktop is installed and running
2. Share the D: drive in Docker Desktop settings (Settings → Resources → File Sharing)
3. Use the command above to start the development environment
4. Access the application at http://localhost:3000

### Docker Development Commands

#### Using the Helper Script (Recommended)
```bash
# Start development environment
docker-dev start

# Start persistent development container
docker-dev dev

# Enter interactive shell
docker-dev shell

# Run tests
docker-dev test

# Install dependencies
docker-dev install

# Cleanup containers
docker-dev clean
```

#### Manual Docker Commands
```bash
# Interactive development container
docker run -it -v "D:/Development Projects/TapMeIn/:/app" -w /app -p 3000:3000 node:18-slim bash

# Run tests in container
docker run --rm -v "D:/Development Projects/TapMeIn/:/app" -w /app node:18-slim npm test

# Install dependencies
docker run --rm -v "D:/Development Projects/TapMeIn/:/app" -w /app node:18-slim npm install
```

### Subagent Development
This project uses Claude Code subagents for development. See `docs/subagent-practical-guide.md` for Docker-specific subagent commands and workflows.

### Requirements
- Docker Desktop
- Node.js 18 (provided by container)
