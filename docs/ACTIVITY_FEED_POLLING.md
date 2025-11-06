# Activity Feed - Polling Implementation

## Overview

The Activity Feed uses a simple **polling mechanism** to fetch new events from the ERC-8004 Activity API every 15 seconds. This approach is reliable, easy to maintain, and works without WebSocket infrastructure.

## How It Works

### 1. Authentication
- On mount, the component authenticates via server-side proxy (`/api/activity/login`)
- Server-side proxy keeps API credentials secure (never exposed to client)
- JWT token is stored in memory for subsequent requests

### 2. Initial Load
- Fetches the 20 most recent events from `/api/activity/events`
- Converts API events to UI-compatible `ActivityEvent` format
- Displays events in the feed

### 3. Polling Loop
- Every **15 seconds**, silently polls `/api/activity/events`
- Compares the newest event ID with the last known event ID
- If new events are found:
  - Adds them to the top of the feed **without reloading the component**
  - Optionally plays a notification sound
  - Logs to console: `🔔 X new event(s) added silently`

### 4. Silent Updates
The key feature is **silent updates**:
- The component does NOT reload or re-render when new events arrive
- New events are simply prepended to the existing array
- Svelte's reactivity automatically updates the UI
- Users see new events appear smoothly at the top

## Configuration

### Polling Interval
Change the polling frequency in `ActivityFeed.svelte`:

```typescript
pollingInterval = setInterval(async () => {
    await loadEvents(true); // Silent polling
}, 15000); // 15 seconds (15000ms)
```

### Event Limit
Change the number of events fetched per poll:

```typescript
const response = await apiClient.getEvents({ limit: 20 }); // 20 events
```

### Maximum Stored Events
Limit the total number of events kept in memory:

```typescript
events = [...newEvents, ...events].slice(0, 50); // Keep last 50
```

## API Endpoints

All endpoints are proxied through server-side routes to keep credentials secure:

### POST /api/activity/login
- Authenticates with the Activity API
- Returns JWT token and expiration time
- Credentials are server-side only (`API_USERNAME`, `API_PASSWORD`)

### GET /api/activity/events
- Fetches recent events
- Query params: `?limit=20&offset=0`
- Requires `Authorization: Bearer <token>` header

### GET /api/activity/stats
- Fetches activity statistics
- Requires `Authorization: Bearer <token>` header

## Event Flow

```
┌─────────────────────┐
│  ActivityFeed.svelte │
└──────────┬───────────┘
           │
           │ 1. Mount
           ▼
┌─────────────────────┐
│  Auto-login via     │
│  /api/activity/login│
└──────────┬───────────┘
           │
           │ 2. Initial fetch
           ▼
┌─────────────────────┐
│  Fetch events via   │
│  /api/activity/events│
└──────────┬───────────┘
           │
           │ 3. Start polling
           ▼
┌─────────────────────┐
│  Poll every 15s     │
│  (silent mode)      │
└──────────┬───────────┘
           │
           │ 4. New events?
           ▼
┌─────────────────────┐
│  Prepend to feed    │
│  (no reload)        │
└─────────────────────┘
```

## Testing

### Manual Test
1. Start dev server: `npm run dev`
2. Open browser console
3. Look for logs:
   - `"Logging in via server-side proxy..."`
   - `"Loaded X events from API"`
   - `"✅ Starting polling mode (refresh every 15s)"`
   - `"🔔 X new event(s) added silently"` (if new events appear)

### Automated Test
Run the polling test script:

```bash
./scripts/test-polling.sh
```

This verifies:
- ✅ Authentication works
- ✅ Event fetching works
- ✅ Polling simulation works

## Advantages Over WebSocket

1. **Simplicity**: No WebSocket server infrastructure needed
2. **Reliability**: HTTP is more reliable than WebSocket connections
3. **Firewall-friendly**: Works in restrictive network environments
4. **Easier debugging**: Standard HTTP requests in Network tab
5. **No reconnection logic**: No need to handle WebSocket disconnects

## Trade-offs

- **Latency**: New events appear with up to 15 seconds delay (vs. instant with WebSocket)
- **Network overhead**: Regular polling uses more bandwidth than idle WebSocket
- **Server load**: More frequent API requests compared to push-based WebSocket

For the Activity Feed use case, these trade-offs are acceptable given the simplicity and reliability gains.

## Environment Variables

Required in `.env`:

```bash
# API Credentials (SERVER-SIDE ONLY)
API_USERNAME=admin
API_PASSWORD=your_password_here
```

**Important**: These are server-side only and never exposed to the client. The server-side proxy routes handle authentication securely.
