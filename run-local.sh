#!/bin/bash

echo "========================================"
echo "TapMeIn - Local Development Environment"
echo "========================================"
echo ""
echo "Stopping any existing containers..."
docker stop tapmeinnfc-local 2>/dev/null
docker rm tapmeinnfc-local 2>/dev/null
echo ""
echo "Starting fresh container..."
docker run --rm \
  --name tapmeinnfc-local \
  -v "$(pwd):/app" \
  -w /app \
  -p 3000:3000 \
  --env-file .env \
  node:18-slim bash -c "npm install && npm run dev"

echo ""
echo "Container stopped."
