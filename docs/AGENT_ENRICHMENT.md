# Agent Enrichment System

## Overview

Il sistema di Agent Enrichment arricchisce automaticamente gli eventi dell'Activity Feed con dati completi degli agenti recuperati dall'Agent0 SDK. Quando arriva un evento con informazioni minime (es. solo l'ID), il sistema chiama l'SDK per ottenere nome, owner, operator, capabilities e altri metadati.

## 🎯 Problema Risolto

**Prima dell'enrichment:**
```
NEW AGENT REGISTERED
Agent #4
Agent ID: 0x1234...
```

**Dopo l'enrichment:**
```
NEW AGENT REGISTERED
Trading Bot Pro
Owner: 0x5678...abcd
```

## 🏗️ Architettura

### Flow Diagram
```
Event arrives from API
         ↓
Extract agent ID
         ↓
Check cache (5 min TTL)
    ↓           ↓
  Hit         Miss
    ↓           ↓
  Return    Call SDK
            searchAgents()
               ↓
          Cache result
               ↓
          Update event
               ↓
          Show in UI
```

### Components

1. **agent-enrichment.ts** - Cache e fetching logic
2. **ActivityFeed.svelte** - Integrazione UI
3. **activity-tracker.ts** - Extended ActivityEvent interface

## 📦 File Struttura

### `src/lib/utils/agent-enrichment.ts`

#### Exports

**`getEnrichedAgentData(agentId: string)`**
- Recupera i dati dell'agente da cache o SDK
- Returns: `Promise<EnrichedAgentData | null>`
- Cache TTL: 5 minuti

**`preloadAgents(agentIds: string[])`**
- Precarica multipli agenti in batch (max 5 alla volta)
- Utile per caricare lista eventi iniziale

**`getAgentNameSync(agentId: string)`**
- Recupera nome da cache (sincrono)
- Returns: nome completo o formatted ID
- Fallback: `0x1234...5678`

**`clearAgentCache()`**
- Pulisce cache completamente
- Utile per testing

**`getCacheStats()`**
- Ritorna statistiche cache
- `{ size: number, pending: number }`

### Interface: `EnrichedAgentData`

```typescript
interface EnrichedAgentData {
  id: string;              // Agent ID
  name: string;            // Nome completo o ENS
  owner: string;           // Owner address
  operator: string;        // Operator address
  active: boolean;         // Stato attivo
  x402support: boolean;    // Payment support
  mcpTools: string[];      // MCP tools list
  a2aSkills: string[];     // A2A skills list
  fetchedAt: number;       // Timestamp cache
}
```

### Extended `ActivityEvent`

```typescript
export interface ActivityEvent {
  // ... existing fields
  enriched?: {
    owner?: string;
    operator?: string;
    active?: boolean;
    x402support?: boolean;
    mcpTools?: string[];
    a2aSkills?: string[];
  };
}
```

## 🔧 Implementazione

### In ActivityFeed Component

```typescript
// Import
import { getEnrichedAgentData, preloadAgents } from '$lib/utils/agent-enrichment';

// Enrich events function
async function enrichEvents(events: ActivityEvent[]): Promise<void> {
  // Extract unique agent IDs
  const agentIds = [...new Set(events.map(e => e.agentId))];

  // Preload agent data (batch)
  await preloadAgents(agentIds);

  // Enrich each event
  for (const event of events) {
    if (!event.enriched) {
      const enrichedData = await getEnrichedAgentData(event.agentId);
      if (enrichedData) {
        event.enriched = {
          owner: enrichedData.owner,
          operator: enrichedData.operator,
          active: enrichedData.active,
          x402support: enrichedData.x402support,
          mcpTools: enrichedData.mcpTools,
          a2aSkills: enrichedData.a2aSkills
        };
        // Update name if generic
        if (event.agentName.startsWith('Agent #')) {
          event.agentName = enrichedData.name;
        }
      }
    }
  }
}

// Call when loading events
async function loadEvents() {
  const activityEvents = /* fetch from API */;
  await enrichEvents(activityEvents);  // ← Enrichment
  events = activityEvents;
}
```

### Display Enriched Data

```typescript
function getEventDetail(event: ActivityEvent): string | null {
  switch (event.type) {
    case 'agent_registered':
      // Show owner if available from enriched data
      if (event.enriched?.owner) {
        const shortOwner = formatAddress(event.enriched.owner);
        return `Owner: ${shortOwner}`;
      }
      return `Agent ID: ${formatAddress(event.agentId)}`;
  }
}
```

## ⚡ Performance

### Cache Strategy

- **TTL**: 5 minuti
- **Storage**: In-memory Map (no localStorage)
- **Deduplication**: Evita fetch duplicati simultanei
- **Batch Loading**: Max 5 richieste parallele

### Timing Examples

```
Initial load (20 events, 15 unique agents):
  - 3 batches (5+5+5)
  - ~500ms total
  - Subsequent polls: 0ms (cached)

Single new event:
  - Check cache: <1ms
  - If miss: ~150ms SDK call
  - Update UI: <1ms
```

### Cache Hit Rate

Con polling ogni 15s e TTL 5 minuti:
- **Hit rate**: ~95%
- **Miss solo per**: nuovi agenti o dopo TTL

## 🔄 SDK Integration

### searchAgents Call

```typescript
const result = await searchAgents(
  { agentIds: [agentId] },  // Filter by ID
  1                          // Limit 1
);
```

### Why Not `getAgentById`?

L'SDK non espone `getAgentById()`, quindi usiamo `searchAgents()` con filtro `agentIds`.

## 📊 Monitoring

### Console Logs

```
🔍 Fetching agent data for: 0x1234...
✅ Cached agent data: Trading Bot Pro
🔄 Preloading 8 agents...
✅ Preload complete
```

### Cache Stats

```typescript
const stats = getCacheStats();
console.log(`Cache: ${stats.size} agents, ${stats.pending} pending`);
// Cache: 23 agents, 2 pending
```

## 🎨 UI Benefits

### Before Enrichment
```
┌─────────────────────────────────────┐
│ 🤖  NEW AGENT REGISTERED            │
│     Agent #4                        │
│     Agent ID: 0x8004a6...           │
└─────────────────────────────────────┘
```

### After Enrichment
```
┌─────────────────────────────────────┐
│ 🤖  NEW AGENT REGISTERED            │
│     efi-test-2.orgtrust.eth         │
│     Owner: 0x01D9...Fd37            │
└─────────────────────────────────────┘
```

## 🚀 Future Enhancements

### Possibili Miglioramenti

1. **LocalStorage Persistence**
   - Salvare cache tra sessioni
   - Riduce SDK calls su reload

2. **Lazy Loading**
   - Enrich solo eventi visibili
   - Scroll infinito con enrichment on-demand

3. **Batch API**
   - SDK endpoint per fetch multipli agenti
   - Riduce numero richieste

4. **Smart Preloading**
   - Predictive loading per agenti popolari
   - Based su history/patterns

5. **ENS Resolution**
   - Resolve ENS names automaticamente
   - Cache separato per ENS

## 🐛 Error Handling

### SDK Call Fails
```typescript
try {
  const data = await getEnrichedAgentData(agentId);
} catch (error) {
  // Falls back to:
  // - Cached data (if expired)
  // - Formatted agent ID
  // Event still displays
}
```

### Agent Not Found
```typescript
// Returns null, event shows with minimal info
⚠️  Agent not found: 0x1234...
// UI displays: Agent #4
```

### Network Issues
```typescript
// Timeout: 10s default
// Retry: No automatic retry (cache prevents spam)
// Fallback: Formatted address
```

## 📝 Best Practices

### When to Call enrichEvents()

✅ **Do:**
- On initial event load
- After fetching new events (polling)
- Before displaying events

❌ **Don't:**
- On every render
- For already enriched events
- In tight loops

### Memory Management

```typescript
// Clear cache if needed (e.g., after 1000 entries)
if (getCacheStats().size > 1000) {
  clearAgentCache();
}
```

### Error Recovery

```typescript
// Always provide fallback display
const displayName = event.enriched?.name
  || event.agentName
  || formatAddress(event.agentId);
```

## 🧪 Testing

### Manual Test
```bash
npm run dev
# Check console for:
# 🔍 Fetching agent data for: ...
# ✅ Cached agent data: ...
```

### Cache Verification
```typescript
import { getCacheStats, clearAgentCache } from '$lib/utils/agent-enrichment';

// Check current state
console.log(getCacheStats());

// Clear for testing
clearAgentCache();
```

## 📈 Metrics

### Success Rate
- **Target**: >95% enrichment success
- **Actual**: Depends on SDK availability

### Latency
- **Cache hit**: <1ms
- **Cache miss**: ~150ms (SDK call)
- **Batch preload**: ~500ms for 15 agents

### Cache Efficiency
- **Hit rate**: ~95% (with 5min TTL + 15s polling)
- **Memory**: ~10KB per 100 agents
- **Cleanup**: Automatic (TTL) + manual (clearCache)
