# Searchable Capabilities - A2A Skills & MCP Tools

## Current Status on Sepolia

**Important**: After analyzing all agents on Sepolia Testnet, **no agents currently have A2A Skills or MCP Tools populated**. All agents show:
```
MCP Tools:    None
A2A Skills:   None
```

This is likely because:
1. Most registered agents are demos/tests
2. Capability extraction is not yet widely implemented
3. The ecosystem is still in early alpha (v0.2.1)

## What Are These Capabilities?

### A2A (Agent-to-Agent) Skills

A2A Skills represent capabilities that enable agents to communicate and work together using standardized protocols.

**Potential Examples** (based on Agent0 ecosystem):
- `payment-processing` - Handle cryptocurrency transactions
- `data-retrieval` - Fetch and provide structured data
- `task-delegation` - Accept and execute delegated tasks
- `reputation-sharing` - Share and verify reputation data
- `content-generation` - Create text, images, or other content
- `translation` - Language translation services
- `sentiment-analysis` - Analyze text sentiment
- `price-oracle` - Provide market price data
- `identity-verification` - Verify credentials and identity

**Search Example**:
```
A2A Skills: payment-processing, data-retrieval
```
This would find agents that can handle payments AND retrieve data.

### MCP (Model Context Protocol) Tools

MCP Tools are standardized interfaces that allow AI models to interact with external systems and data sources.

**Common MCP Tool Examples**:
- `filesystem` - Read/write files
- `git` - Git operations
- `postgres` - Database queries
- `puppeteer` - Web scraping
- `slack` - Slack integration
- `github` - GitHub API access
- `web-search` - Internet search
- `calculator` - Mathematical operations
- `weather` - Weather data
- `calendar` - Calendar management
- `email` - Email sending/reading
- `browser` - Web browsing

**Search Example**:
```
MCP Tools: github, postgres, slack
```
This would find agents with GitHub, database, and Slack capabilities.

## How Search Works

### Current Implementation

The search is **comma-separated** with **exact matching**:

```typescript
// In SearchFilters component:
if (mcpToolsInput.trim()) {
    filters.mcpTools = mcpToolsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}
```

### Search Behavior

**AND Logic**: When you enter multiple items, agents must have ALL of them:
```
Input: "github, postgres"
Result: Only agents with BOTH github AND postgres tools
```

**Case Sensitive**: The search respects case as stored in the blockchain:
```
"Github" ≠ "github"
```

**Exact Match**: Must match exactly:
```
"github-api" ≠ "github"
```

## When Will This Be Useful?

As the Agent0 ecosystem grows, agents will start advertising capabilities:

### Example Future Agent Profiles

#### 1. DeFi Trading Agent
```yaml
Name: "DeFi Trader Pro"
A2A Skills:
  - swap-execution
  - price-oracle
  - liquidity-provision
MCP Tools:
  - uniswap
  - aave
  - chainlink
```

#### 2. Content Creation Agent
```yaml
Name: "Content Creator AI"
A2A Skills:
  - content-generation
  - image-generation
  - seo-optimization
MCP Tools:
  - dalle
  - stable-diffusion
  - web-search
```

#### 3. Data Analysis Agent
```yaml
Name: "Data Analyst"
A2A Skills:
  - data-analysis
  - visualization
  - report-generation
MCP Tools:
  - postgres
  - python
  - jupyter
```

#### 4. Customer Support Agent
```yaml
Name: "Support Bot"
A2A Skills:
  - customer-support
  - ticket-management
  - knowledge-retrieval
MCP Tools:
  - zendesk
  - slack
  - email
```

## How to Search (When Data Exists)

### Search by Single Capability
```
MCP Tools: github
→ Finds all agents with GitHub integration
```

### Search by Multiple Capabilities
```
A2A Skills: payment-processing, data-retrieval
→ Finds agents that can handle payments AND retrieve data
```

### Combine Filters
```
MCP Tools: postgres, slack
A2A Skills: customer-support
Active Agents Only: ✓
→ Finds active customer support agents with database and Slack access
```

## Testing Search Functionality

Since no agents currently have capabilities, you can test the filter UI by:

1. **Expanding Filters**: Click "▶ SHOW"
2. **Enter Test Values**:
   - MCP Tools: `github, postgres`
   - A2A Skills: `data-retrieval, analysis`
3. **Click "APPLY FILTERS"**
4. **Expected Result**: "NO AGENTS FOUND" (because no agents have these yet)

## For Agent Developers

If you're registering an agent, include capabilities:

### Registration Example (Conceptual)
```typescript
const agent = {
    name: "My Agent",
    description: "Does cool stuff",
    endpoints: [
        {
            type: "a2a",
            value: "https://myagent.com/a2a",
            meta: {
                skills: ["payment-processing", "data-retrieval"]
            }
        },
        {
            type: "mcp",
            value: "https://myagent.com/mcp",
            meta: {
                tools: ["github", "postgres", "slack"]
            }
        }
    ]
};

await sdk.registerAgent(agent);
```

## Related Filters

### Other Search Options

Besides capabilities, you can also filter by:

- **Agent Name**: Text search (case-insensitive)
- **Network**: Currently Sepolia only
- **Active Status**: Only show active agents
- **x402 Support**: Agents with payment support

### Search Combinations

```
Search: "trading"
A2A Skills: swap-execution
Active Only: ✓
→ Find active trading agents with swap capabilities
```

## Resources

- **Agent0 SDK Docs**: https://sdk.ag0.xyz
- **MCP Protocol**: https://modelcontextprotocol.io
- **ERC-8004 Standard**: Agent identity and discovery
- **GitHub Repository**: https://github.com/agent0lab/agent0-ts

## Summary

- ✅ **Search UI is ready** - Filters work correctly
- ⚠️ **No data yet** - Sepolia agents don't have capabilities populated
- 🔮 **Future ready** - As ecosystem grows, this will be very useful
- 📝 **Comma-separated** - Use commas to search multiple items
- 🔍 **Exact match** - Must match capability names exactly

The search infrastructure is in place and ready for when the Agent0 ecosystem matures and agents start advertising their real capabilities!
