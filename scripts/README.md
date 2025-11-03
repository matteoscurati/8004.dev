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
