# Activity Feed Integration

Real-time activity feed showing ERC-8004 blockchain events using WebSocket connection.

## Overview

The Activity Feed displays live blockchain events from the ERC-8004 indexer API, including:
- Agent registrations
- Capability additions (MCP tools, A2A skills)
- Status changes
- x402 support enablement

## Architecture

```
┌─────────────────┐
│  ActivityFeed   │ (Svelte Component)
└────────┬────────┘
         │
         ├──────> Auth Store (JWT token management)
         │
         ├──────> WebSocket Client (real-time events)
         │
         └──────> API Client (REST API for initial data)
                        │
                        ▼
              ┌──────────────────┐
              │  Activity API    │
              │  (Fly.io)        │
              └──────────────────┘
```

## Setup

### 1. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# ERC-8004 Activity Feed API
PUBLIC_API_URL=https://api-8004-dev.fly.dev
PUBLIC_WS_URL=wss://api-8004-dev.fly.dev/ws

# API Credentials (for auto-login - public vars for client-side)
# NOTE: In production, credentials should be managed server-side
PUBLIC_API_USERNAME=admin
PUBLIC_API_PASSWORD=your_password_here
```

⚠️ **Security Note**: The credentials are stored as public environment variables for development. In production, implement proper server-side authentication.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The Activity Feed will automatically appear on the homepage and attempt to connect to the API.

## Features

### Real-time Updates
- WebSocket connection provides instant event notifications
- Auto-reconnect with exponential backoff on connection loss
- Visual connection status indicator (● LIVE, ○ CONNECTING, ✕ ERROR)

### Event Types
- **Agent Registered**: New agents added to the network
- **Capability Added**: MCP tools or A2A skills added to agents
- **Status Changed**: Agent activation/deactivation
- **x402 Enabled**: Payment support enabled for an agent

### UI Controls
- **Sound Toggle**: Enable/disable 8-bit notification sounds
- **Clear History**: Remove all displayed events
- **Collapse**: Hide/show the feed content

### Error Handling
- Graceful fallback if API is unavailable
- Retry button on connection failures
- Detailed error messages for troubleshooting

## API Endpoints

### Authentication
```bash
POST /login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}

Response:
{
  "token": "jwt_token_here",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Get Events
```bash
GET /events?limit=20&offset=0
Authorization: Bearer <token>

Response:
{
  "events": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### WebSocket Connection
```bash
wss://api-8004-dev.fly.dev/ws?token=<jwt_token>

Receives real-time events in JSON format
```

## Testing

### Test API Connection

Run the test script to verify API connectivity:

```bash
node scripts/test-activity-api.js admin your_password
```

Expected output:
```
=== Activity Feed API Test ===

Testing health check endpoint...
✓ Health check: { service: 'erc8004-indexer', status: 'healthy' }

Testing login...
✓ Login successful
  Token expires at: 2024-12-31T23:59:59Z

Testing events endpoint...
✓ Events endpoint working
  Total events: 1234
  Retrieved: 5 events

  Sample event:
    Type: AgentRegistered
    Block: 7234567
    Time: 2024-12-01T12:34:56Z

Testing stats endpoint...
✓ Stats endpoint working
  Last synced block: 7234567
  Total events: 1234
  Events by type: { ... }

=== All tests completed ===
```

## Files Structure

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # API client with JWT auth
│   │   └── websocket.ts       # WebSocket client
│   ├── stores/
│   │   ├── auth.ts            # Authentication store
│   │   └── events.ts          # Events store
│   ├── types/
│   │   └── api.ts             # TypeScript types for API
│   ├── utils/
│   │   └── event-adapter.ts   # Convert API events to UI format
│   └── components/
│       └── ActivityFeed.svelte # Activity Feed component
└── routes/
    └── +page.svelte           # Homepage with Activity Feed

scripts/
└── test-activity-api.js       # API connectivity test script
```

## Event Data Format

### API Event (from WebSocket/REST)
```typescript
interface Event {
  id: number;
  block_number: number;
  block_timestamp: string;
  transaction_hash: string;
  log_index: number;
  contract_address: string;
  event_type: string;  // 'AgentRegistered', 'CapabilityAdded', etc.
  event_data: Record<string, any>;
  created_at: string;
}
```

### Activity Event (UI format)
```typescript
interface ActivityEvent {
  type: 'agent_registered' | 'capability_added' | 'status_changed' | 'x402_enabled';
  agentId: string;
  agentName: string;
  timestamp: number;
  metadata?: {
    capability?: string;
    capabilityType?: 'mcp' | 'a2a';
    previousStatus?: boolean;
    currentStatus?: boolean;
  };
}
```

## Troubleshooting

### Connection Issues

**Problem**: Activity Feed shows "CONNECTION FAILED"

**Solutions**:
1. Check that API_PASSWORD is set in `.env`
2. Verify API is accessible: `curl https://api-8004-dev.fly.dev/health`
3. Check browser console for detailed error messages
4. Ensure credentials are correct

### WebSocket Issues

**Problem**: Feed shows "○ CONNECTING" or "✕ ERROR"

**Solutions**:
1. Verify WebSocket URL is correct in `.env`
2. Check browser console for WebSocket errors
3. Ensure JWT token is valid (not expired)
4. Try refreshing the page to re-establish connection

### No Events Displayed

**Problem**: Feed is connected but shows "NO RECENT ACTIVITY"

**Solutions**:
1. Check that indexer is syncing: `curl https://api-8004-dev.fly.dev/stats`
2. Verify events exist in the API: `node scripts/test-activity-api.js admin password`
3. Wait for new blockchain events to occur

### Build Errors

**Problem**: TypeScript errors during build

**Solutions**:
1. Ensure all dependencies are installed: `npm install`
2. Run type check: `npm run check`
3. Clear build cache: `rm -rf .svelte-kit` and rebuild

## Future Enhancements

- [ ] Filter events by type in the UI
- [ ] Pagination for historical events
- [ ] Export events as JSON/CSV
- [ ] Notification preferences (which event types to show)
- [ ] Event details modal with full transaction data
- [ ] Server-side authentication (move credentials out of client)
- [ ] Rate limiting handling
- [ ] Offline mode with event queue

## Security Considerations

1. **Credentials in Environment Variables**: Currently using `PUBLIC_*` variables which are exposed to the client. In production:
   - Move authentication to server-side API routes
   - Use HTTP-only cookies for JWT tokens
   - Implement proper session management

2. **WebSocket Security**:
   - JWT tokens are passed as query parameters (visible in logs)
   - Consider using WebSocket subprotocols for token passing
   - Implement token refresh mechanism

3. **CORS Configuration**:
   - API currently allows all origins (`*`)
   - Restrict to specific domains in production

## Support

For issues or questions:
- Check browser console for detailed error messages
- Review API logs on Fly.io
- Run test script for API connectivity verification
- Open an issue on GitHub with error details

---

**Last Updated**: 2025-01-06
**API Version**: 1.0
**SDK Version**: Agent0 SDK v0.2.2
