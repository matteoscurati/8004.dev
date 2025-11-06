#!/bin/bash

# Test local Activity Feed API endpoints

echo "🧪 Testing Local Activity Feed API"
echo "=================================="
echo ""

BASE_URL="http://localhost:5174"

# Test 1: Login
echo "1️⃣  Testing POST /api/activity/login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/activity/login")
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi

echo "✅ Login successful! Token received."
echo ""

# Test 2: Get Events
echo "2️⃣  Testing GET /api/activity/events (with auth)..."
EVENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/activity/events?limit=5")
echo "$EVENTS_RESPONSE" | jq . 2>/dev/null || echo "$EVENTS_RESPONSE"
echo ""

# Test 3: Get Stats
echo "3️⃣  Testing GET /api/activity/stats (with auth)..."
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/activity/stats")
echo "$STATS_RESPONSE" | jq . 2>/dev/null || echo "$STATS_RESPONSE"
echo ""

echo "=================================="
echo "✅ All API tests completed!"
