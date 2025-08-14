#!/bin/bash

# TapMeIn API Testing Script
BASE_URL="http://localhost:3000"

echo "🧪 Testing TapMeIn API..."
echo "=========================="

# 1. Register a new user
echo -e "\n1️⃣ Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }')

# Extract token using grep and sed (cross-platform)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Registration failed or token not found"
  echo "Response: $REGISTER_RESPONSE"
else
  echo "✅ User registered successfully"
  echo "   Token: ${ACCESS_TOKEN:0:20}..."
fi

# 2. Activate a card
echo -e "\n2️⃣ Activating card with code ACTIVATE1..."
ACTIVATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/cards/activate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "activationCode": "ACTIVATE1"
  }')

echo "Response: $ACTIVATE_RESPONSE"

# 3. Test the tap endpoint
echo -e "\n3️⃣ Testing NFC tap for TEST0001..."
TAP_RESPONSE=$(curl -s $BASE_URL/tap/TEST0001)
echo "Response: $TAP_RESPONSE"

# 4. Get user's cards
echo -e "\n4️⃣ Getting user's cards..."
CARDS_RESPONSE=$(curl -s -X GET $BASE_URL/api/cards \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $CARDS_RESPONSE"

echo -e "\n✅ API testing complete!"