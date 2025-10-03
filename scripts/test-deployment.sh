#!/bin/bash

# TapMeIn Deployment Test Script
# Tests that all containers and services are running correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

HOST="${1:-localhost}"
PORT="${2:-3000}"
BASE_URL="http://${HOST}:${PORT}"

echo "========================================="
echo "  TapMeIn Deployment Test"
echo "========================================="
echo "Testing: ${BASE_URL}"
echo ""

# Function to print test results
pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Check if containers are running
echo "1. Checking Docker containers..."
if docker ps | grep -q "tapmeinnfc-app-prod"; then
    pass "App container is running"
else
    fail "App container is not running"
fi

if docker ps | grep -q "tapmeinnfc-mongo-prod"; then
    pass "MongoDB container is running"
else
    fail "MongoDB container is not running"
fi

if docker ps | grep -q "tapmeinnfc-redis-prod"; then
    pass "Redis container is running"
else
    fail "Redis container is not running"
fi

echo ""

# Test 2: Check container health
echo "2. Checking container health..."
APP_HEALTH=$(docker inspect tapmeinnfc-app-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
if [ "$APP_HEALTH" == "healthy" ]; then
    pass "App container is healthy"
elif [ "$APP_HEALTH" == "none" ]; then
    warn "App container has no health check"
else
    warn "App container health: $APP_HEALTH"
fi

echo ""

# Test 3: Check health endpoint
echo "3. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/api/health" || echo "")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
    pass "Health endpoint returned OK"
    echo "   Response: $HEALTH_RESPONSE"
else
    fail "Health endpoint failed or not accessible"
fi

echo ""

# Test 4: Check if homepage loads
echo "4. Testing homepage..."
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/" || echo "000")
if [ "$HOMEPAGE_STATUS" == "200" ]; then
    pass "Homepage loads successfully (HTTP $HOMEPAGE_STATUS)"
elif [ "$HOMEPAGE_STATUS" == "302" ] || [ "$HOMEPAGE_STATUS" == "301" ]; then
    pass "Homepage redirects (HTTP $HOMEPAGE_STATUS)"
else
    fail "Homepage failed (HTTP $HOMEPAGE_STATUS)"
fi

echo ""

# Test 5: Check MongoDB connectivity
echo "5. Testing MongoDB connectivity..."
MONGO_TEST=$(docker exec tapmeinnfc-mongo-prod mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null || echo "0")
if [ "$MONGO_TEST" == "1" ]; then
    pass "MongoDB is accessible"
else
    fail "MongoDB connection failed"
fi

echo ""

# Test 6: Check Redis connectivity
echo "6. Testing Redis connectivity..."
REDIS_TEST=$(docker exec tapmeinnfc-redis-prod redis-cli ping 2>/dev/null || echo "")
if [ "$REDIS_TEST" == "PONG" ]; then
    pass "Redis is accessible"
else
    fail "Redis connection failed"
fi

echo ""

# Test 7: Check volumes
echo "7. Checking Docker volumes..."
if docker volume ls | grep -q "tapmeinnfc_mongodb_data"; then
    pass "MongoDB volume exists"
else
    warn "MongoDB volume not found"
fi

if docker volume ls | grep -q "tapmeinnfc_uploads_data"; then
    pass "Uploads volume exists"
else
    warn "Uploads volume not found"
fi

echo ""

# Test 8: Check network
echo "8. Checking Docker network..."
if docker network ls | grep -q "tapmeinnfc"; then
    pass "Docker network exists"
else
    fail "Docker network not found"
fi

echo ""

# Test 9: Check environment variables
echo "9. Checking critical environment variables..."
JWT_SECRET=$(docker exec tapmeinnfc-app-prod sh -c 'echo $JWT_SECRET' 2>/dev/null || echo "")
if [ -n "$JWT_SECRET" ]; then
    pass "JWT_SECRET is set"
else
    fail "JWT_SECRET is not set"
fi

MONGODB_URI=$(docker exec tapmeinnfc-app-prod sh -c 'echo $MONGODB_URI' 2>/dev/null || echo "")
if [ -n "$MONGODB_URI" ]; then
    pass "MONGODB_URI is set"
else
    fail "MONGODB_URI is not set"
fi

echo ""

# Test 10: Check logs for errors
echo "10. Checking recent logs for errors..."
ERROR_COUNT=$(docker logs tapmeinnfc-app-prod --tail 100 2>&1 | grep -i error | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    pass "No errors in recent logs"
else
    warn "Found $ERROR_COUNT error(s) in recent logs"
    echo "   Run: docker logs tapmeinnfc-app-prod | grep -i error"
fi

echo ""
echo "========================================="
echo "  Test Summary"
echo "========================================="
echo -e "${GREEN}Deployment appears to be working!${NC}"
echo ""
echo "Access your application at: ${BASE_URL}"
echo "Health check: ${BASE_URL}/api/health"
echo ""
echo "Next steps:"
echo "  1. Configure SSL/HTTPS for production"
echo "  2. Set up reverse proxy (Nginx/Traefik)"
echo "  3. Configure backups"
echo "  4. Set up monitoring/alerts"
echo ""
