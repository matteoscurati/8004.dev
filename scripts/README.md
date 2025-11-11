# Scripts

This directory contains utility scripts for the Agent0 search application.

## Available Scripts

### `list-agents.js`

Lists all agents registered on the Sepolia testnet with pagination support.

**Usage:**
```bash
npm run list-agents              # Show first page (50 agents)
node scripts/list-agents.js --all        # Show all agents (all pages)
node scripts/list-agents.js --pages 3    # Show first 3 pages
```

**Output:**
- Total number of agents found across all pages fetched
- Detailed information for each agent including:
  - Agent ID
  - Name and description
  - Active status
  - x402 support
  - MCP tools and A2A skills
  - Owners and operators
  - ENS names, DIDs, etc.

**Pagination:**
- Each page contains up to 50 agents
- Use `--all` to fetch all available agents
- Use `--pages N` to fetch N pages
- By default, only the first page is shown

**Configuration:**
The script reads configuration from `.env` file:
- `PUBLIC_RPC_URL` - Ethereum RPC endpoint
- `PUBLIC_CHAIN_ID` - Chain ID (11155111 for Sepolia)
- `PUBLIC_IPFS_PROVIDER` - IPFS provider (node, filecoinPin, or pinata)
- `PUBLIC_PINATA_JWT` - Pinata JWT token (if using pinata)
- `PUBLIC_IPFS_NODE_URL` - IPFS node URL (if using node)

---

### `list-agents-all-chains.js`

**NEW in SDK v0.3.0** - Multi-chain agent discovery across all supported chains.

**Usage:**
```bash
# Query all chains (summary)
npm run list-agents:all

# Query all chains with detailed agent info
npm run list-agents:detailed

# Query specific chains
npm run list-agents:eth       # Ethereum Sepolia only
npm run list-agents:base      # Base Sepolia only
npm run list-agents:polygon   # Polygon Amoy only

# Advanced usage
node scripts/list-agents-all-chains.js --chain 11155111
node scripts/list-agents-all-chains.js --detailed
node scripts/list-agents-all-chains.js --chain 84532 --detailed
```

**Supported Chains:**
- ⟠ **Ethereum Sepolia** (11155111)
- 🔵 **Base Sepolia** (84532)
- ◆ **Polygon Amoy** (80002)

**Features:**
- ✅ Queries all chains in parallel for fast results
- ✅ Color-coded output by chain
- ✅ Detailed statistics per chain and globally:
  - Total agents
  - Active agents (%)
  - MCP Protocol adoption (%)
  - A2A Protocol adoption (%)
  - Payment Ready / x402 support (%)
- ✅ Optional detailed agent listings with `--detailed`
- ✅ Single chain mode with `--chain <chainId>`

**Example Output:**
```
📊 CHAIN SUMMARY:

🔵 Base Sepolia (Chain ID: 84532)
   Total Agents:     248
   Active:           192 (77.4%)
   MCP Protocol:     0 (0.0%)
   A2A Protocol:     103 (41.5%)
   Payment Ready:    85 (34.3%)

⟠ Ethereum Sepolia (Chain ID: 11155111)
   Total Agents:     595
   Active:           187 (31.4%)
   MCP Protocol:     135 (22.7%)
   A2A Protocol:     305 (51.3%)
   Payment Ready:    95 (16.0%)

🌐 GRAND TOTAL (All Chains):
   Total Agents:     843
   Active:           379 (45.0%)
   MCP Protocol:     135 (16.0%)
   A2A Protocol:     408 (48.4%)
   Payment Ready:    180 (21.4%)
```

**Performance:**
- Queries all chains in parallel (typically 2-3 seconds)
- Automatic pagination handling
- Safety limit of 100 pages per chain

---

### `fix-agent0-sdk.js`

Fixes ES module imports in the `agent0-sdk` package by adding `.js` extensions.

This script is automatically run after `npm install` via the `postinstall` hook.

**Usage:**
```bash
node scripts/fix-agent0-sdk.js
```

**What it does:**
- Scans all JavaScript files in `node_modules/agent0-sdk/dist/`
- Adds `.js` extensions to relative imports
- Required for Node.js ES module compatibility

**Why it's needed:**
The `agent0-sdk` package is compiled without `.js` extensions in imports, which causes `ERR_UNSUPPORTED_DIR_IMPORT` errors when running in Node.js with ES modules.

---

## Development

To add new scripts:
1. Create a new `.js` file in this directory
2. Add the shebang: `#!/usr/bin/env node`
3. Make it executable: `chmod +x scripts/your-script.js`
4. Add an npm script in `package.json`:
   ```json
   "your-script": "node scripts/your-script.js"
   ```

## Notes

- All scripts use ES modules (`import`/`export`)
- Scripts automatically load environment variables from `.env` using `dotenv`
- The fix-agent0-sdk script runs automatically after npm install
