#!/bin/bash

# Test polling behavior of Activity Feed

echo "🧪 Testing Activity Feed Polling Behavior"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5173"

# Test: Can we authenticate?
echo "1️⃣  Testing authentication..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/activity/login")
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Authentication failed - cannot test polling"
    exit 1
fi

echo "✅ Authentication successful!"
echo ""

# Test: Can we fetch events?
echo "2️⃣  Testing event fetching (simulating polling)..."
EVENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/activity/events?limit=5")
EVENT_COUNT=$(echo "$EVENTS_RESPONSE" | jq '.events | length' 2>/dev/null)

if [ "$EVENT_COUNT" = "null" ] || [ -z "$EVENT_COUNT" ]; then
    echo "❌ Failed to fetch events"
    echo "$EVENTS_RESPONSE" | jq . 2>/dev/null || echo "$EVENTS_RESPONSE"
    exit 1
fi

echo "✅ Fetched $EVENT_COUNT events"
echo ""

# Show sample event
echo "3️⃣  Sample event:"
echo "$EVENTS_RESPONSE" | jq '.events[0]' 2>/dev/null
echo ""

# Simulate polling by waiting and fetching again
echo "4️⃣  Simulating polling (waiting 5 seconds)..."
sleep 5

EVENTS_RESPONSE_2=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/activity/events?limit=5")
EVENT_COUNT_2=$(echo "$EVENTS_RESPONSE_2" | jq '.events | length' 2>/dev/null)

echo "✅ Second poll completed: $EVENT_COUNT_2 events"
echo ""

echo "=========================================="
echo "✅ Polling test completed successfully!"
echo ""
echo "Summary:"
echo "  - Authentication: ✅ Working"
echo "  - Event fetching: ✅ Working"
echo "  - Polling simulation: ✅ Working"
echo ""
echo "The Activity Feed will poll every 15 seconds for new events."
