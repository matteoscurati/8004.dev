# 8004.dev - Agent0 Discovery Platform

A retro pixel-art web application for discovering and exploring AI agents registered on the blockchain using the [Agent0 SDK](https://github.com/agent0lab/agent0-ts).

Built with SvelteKit 5 and the ERC-8004 standard for on-chain agent identity and discovery.

## ✨ Features

### Current Features

- **🔍 Agent Search**: Browse all agents registered on Sepolia testnet
  - Search by agent name (client-side filtering with up to 500 agents)
  - Real-time results with smart pagination
- **🎛️ Advanced Filters**: Collapsible filter panel with:
  - MCP (Model Context Protocol) Tools filtering
  - A2A (Agent-to-Agent) Skills filtering
  - Active agents only
  - x402 payment support filtering
- **🎮 Pixel-Art UI**: Retro lo-fi aesthetic
  - Custom 8-bit font (Press Start 2P)
  - Scanline effects and CRT monitor style
  - Glitch text animations
  - Generated pixel-art avatars for agents without images
- **📊 Lazy Loading**: Smart pagination with background total count
- **🌐 Network Badge**: Visual indicator for current network (Sepolia)
- **📱 Responsive Design**: Works on desktop and mobile

### Temporarily Disabled

- ⚠️ **Reputation Display**: Disabled due to SDK bug (see [Known Issues](#known-issues))

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5 with TypeScript (Svelte 5 runes)
- **Blockchain**: Ethereum Sepolia Testnet (Chain ID: 11155111)
- **SDK**: Agent0 SDK v0.2.1
- **Storage**: IPFS via Pinata
- **Styling**: Custom CSS with pixel-art design system
- **Build Tool**: Vite

## 📋 Prerequisites

- **Node.js** 18+ (recommended: use `.nvmrc` with `nvm use`)
- **npm** or yarn
- **Ethereum RPC** endpoint (Alchemy, Infura, or similar)
- **Pinata JWT** token for IPFS access (free at [pinata.cloud](https://pinata.cloud))

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/8004.dev.git
cd 8004.dev
```

### 2. Install Node version

```bash
nvm use  # Uses Node version from .nvmrc
```

### 3. Install dependencies

```bash
npm install
```

**Note**: A postinstall script automatically fixes Agent0 SDK import issues (see [Technical Details](#technical-details)).

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Ethereum RPC (required)
PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PUBLIC_CHAIN_ID=11155111

# IPFS Configuration (required)
PUBLIC_IPFS_PROVIDER=pinata
PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional for other IPFS providers
PUBLIC_IPFS_NODE_URL=
```

**Get your API keys:**
- Alchemy RPC: [alchemy.com](https://www.alchemy.com) (free tier available)
- Pinata JWT: [pinata.cloud](https://pinata.cloud) (free tier available)

### 5. Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

## 🧪 Testing

The project uses Vitest for testing with a goal of 100% code coverage.

### Run Tests

```bash
# Run tests in watch mode
npm run test

# Run all tests once
npm run test:run

# Run with coverage report
npm run test:coverage

# Open test UI in browser
npm run test:ui
```

### Current Status

✅ **Test Framework**: Vitest configured and working
⏳ **Component Tests**: Waiting for @testing-library/svelte Svelte 5 runes support
📝 **Documentation**: See `TEST_STRATEGY.md` for full testing strategy

### Test Files

- `src/tests/example.test.ts` - Example tests (passing ✓)
- Comprehensive test suite planned once Svelte 5 support is available

### Coverage

Coverage reports are generated in `coverage/` directory:
- `coverage/html/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI/CD

## 📦 Build & Deploy

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Deploy

The app is a standard SvelteKit application and can be deployed to:
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- Any Node.js hosting

## 🎯 Usage

### Searching Agents

1. **Quick Search**: Use the search bar at the top to find agents by name
2. **Filter Panel**: Click "▶ SHOW" to expand advanced filters
   - **MCP Tools**: Enter comma-separated tools (e.g., `github, postgres`)
   - **A2A Skills**: Enter comma-separated skills (e.g., `data-analysis, python`)
   - **Checkboxes**: Filter by active status or x402 payment support

### Understanding Agent Cards

Each agent card displays:
- **Avatar**: Agent image or generated pixel-art avatar (if missing/error)
- **Name & ID**: Agent name and blockchain identifier
- **Description**: Agent purpose and capabilities
- **Status Badges**:
  - `● ACTIVE` or `○ INACTIVE`
  - `x402 ENABLED` if payment support is available
- **Capabilities**: MCP Tools and A2A Skills (when available)

### Pagination

- Results load 20 agents at a time
- Total count loads in background (non-blocking)
- Click "LOAD MORE" to fetch additional results

## 🔧 Available Scripts

Located in `./scripts/`:

### List Agents
```bash
npm run list-agents              # First page (50 agents)
node scripts/list-agents.js --all        # All agents
node scripts/list-agents.js --pages 3    # First 3 pages
```

### Inspect Agent
```bash
node scripts/inspect-agent.js <agentId>
# Example: node scripts/inspect-agent.js 11155111:770
```

### Test Search
```bash
node scripts/test-search.js
node scripts/test-wrapper-search.js
```

### Fix SDK Imports (runs automatically on postinstall)
```bash
node scripts/fix-agent0-sdk.js
```

## 📚 Project Structure

```
8004.dev/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── AgentCard.svelte          # Agent display card with generated avatars
│   │   │   ├── ReputationDisplay.svelte  # Reputation (currently disabled)
│   │   │   └── SearchFilters.svelte      # Search bar + collapsible filters
│   │   ├── assets/
│   │   │   └── favicon.svg
│   │   ├── sdk.ts                        # Agent0 SDK wrapper
│   │   └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte                # Main layout with header/footer
│   │   └── +page.svelte                  # Search page with results
│   ├── app.html                          # HTML template
│   ├── app.css                           # Global pixel-art styles
│   └── app.d.ts                          # TypeScript declarations
├── scripts/                              # CLI utilities
│   ├── fix-agent0-sdk.js                 # Auto-fixes SDK imports
│   ├── list-agents.js                    # List all agents
│   ├── inspect-agent.js                  # Inspect single agent
│   ├── test-search.js                    # Test SDK search
│   └── README.md
├── static/                               # Static assets
│   └── robots.txt
├── docs/                                 # Technical documentation
│   ├── SEARCH_FIX.md                     # Client-side search workaround
│   ├── REPUTATION_ISSUE.md               # SDK reputation bug details
│   ├── RESULTS_DISPLAY.md                # Pagination implementation
│   ├── NETWORK_SUPPORT.md                # Multi-network guide
│   ├── UI_CHANGES.md                     # UI architecture decisions
│   └── SEARCHABLE_CAPABILITIES.md        # MCP/A2A capabilities guide
├── .env.example                          # Environment template
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🐛 Known Issues

### 1. Reputation Display Disabled

**Status**: Temporarily disabled

**Issue**: The SDK's `getReputationSummary()` method calls `getClients()` on the ReputationRegistry contract, but this method doesn't exist in the contract ABI.

**Impact**: Agent cards don't show reputation scores.

**Workaround**: Feature disabled until SDK is updated.

**Documentation**: See `REPUTATION_ISSUE.md` for detailed analysis.

### 2. Name Search is Client-Side Only

**Status**: Working, but with limitations

**Issue**: The SDK's `name` filter parameter only supports exact matches, not substring or fuzzy matching.

**Workaround**: When searching by name:
- App fetches up to 10 pages (500 agents)
- Filters results client-side with case-insensitive substring matching
- Returns all matches without pagination

**Impact**:
- Slower for name searches
- Limited to first 500 agents if more exist

**Documentation**: See `SEARCH_FIX.md` for implementation details.

### 3. No Agents Have Capabilities Populated

**Status**: Ecosystem limitation (not a bug)

**Issue**: Currently, no agents on Sepolia have MCP Tools or A2A Skills populated. All agents show empty arrays.

**Reason**:
- Agent0 ecosystem is in early alpha (v0.2.1)
- Most registered agents are demos/tests
- Capability extraction not widely implemented yet

**Impact**: MCP Tools and A2A Skills filters won't return results.

**Documentation**: See `SEARCHABLE_CAPABILITIES.md` for detailed explanation and future examples.

### 4. Sepolia Network Only

**Status**: By design for now

**Issue**: Only Sepolia testnet is supported.

**Reason**: Agent0 contracts are primarily deployed on testnets during alpha phase.

**Future**: Multi-network support planned (see TODO).

**Documentation**: See `NETWORK_SUPPORT.md` for multi-network implementation guide.

## 🎨 Styling & Design

The app uses a **retro pixel-art aesthetic** inspired by 8-bit gaming and cyberpunk:

### Design System

- **Font**: Press Start 2P (Google Fonts) - authentic 8-bit gaming font
- **Colors**:
  - Primary: `#00ff41` (Matrix green)
  - Accent: `#ff00ff` (Neon magenta)
  - Background: `#0a0a0a` (Deep black)
  - Border: `#00ff41` (Glowing green)
- **Effects**:
  - Scanline overlay (CRT monitor effect)
  - Text shadow and glow
  - Image rendering: pixelated
  - Pixel-perfect 3px borders

### Generated Avatars

When an agent has no image or the image fails to load, the app generates a unique pixel-art avatar:
- **8x8 grid** of colored pixels
- **Deterministic**: Same agent ID = same avatar
- **Symmetric**: Mirrored horizontally for aesthetic appeal
- **Unique colors**: Derived from agent ID hash
- **SVG-based**: Sharp rendering at any size

## 🔍 Technical Details

### SDK Import Fix

The Agent0 SDK (v0.2.1) has ES module import issues when used in Node.js:
- Directory imports like `from './models'` fail with `ERR_UNSUPPORTED_DIR_IMPORT`
- Missing `.js` extensions in import statements

**Solution**: `scripts/fix-agent0-sdk.js` automatically runs on `postinstall` to add `.js` extensions to all imports.

### Client-Side Name Filtering

The SDK's search doesn't support partial name matching, so we:
1. Fetch up to 500 agents (10 pages)
2. Filter client-side with case-insensitive substring matching
3. Return all matches

This provides a better UX but is slower than server-side search would be.

### Lazy Total Count

To avoid blocking the UI:
1. First page loads immediately (20 results)
2. Header shows "SHOWING X AGENTS"
3. Background task counts total agents
4. Header updates to "SHOWING X OF Y AGENTS" when count completes

## 🚧 TODO / Roadmap

### High Priority

- [ ] **Complete Test Suite for Svelte 5**
  - Wait for @testing-library/svelte to add full Svelte 5 runes support
  - Complete component tests (AgentCard, SearchFilters, Pages)
  - Achieve 100% test coverage
  - Add E2E tests with Playwright
  - See `TEST_STRATEGY.md` for details

- [ ] **Fix Reputation Display**
  - Wait for SDK update with correct contract method
  - Re-enable ReputationDisplay component
  - Test with live data

- [ ] **Server-Side Name Search**
  - Implement when SDK supports substring/fuzzy matching
  - Remove client-side filtering workaround
  - Improve performance for large agent lists

- [ ] **Agent Detail Pages**
  - Create `/agent/[id]` route
  - Show full agent details, endpoints, owners, operators
  - Display complete reputation history
  - Show transaction/interaction history

### Medium Priority

- [ ] **Multi-Network Support**
  - Add network selector in UI
  - Support mainnet when contracts are deployed
  - Support other L2s/sidechains (Polygon, Base, Arbitrum)
  - Show agent counts per network

- [ ] **Enhanced Search**
  - Add sorting options (by name, reputation, registration date)
  - Implement filter presets ("Most Reputable", "Recently Active", etc.)
  - Add search history/saved searches
  - Full-text search across descriptions

- [ ] **Improve Capabilities Display**
  - Add tooltips explaining MCP tools and A2A skills
  - Link to MCP tool documentation
  - Show capability metadata when available
  - Visual icons for common tools/skills

### Low Priority / Nice to Have

- [ ] **Agent Comparison**
  - Side-by-side comparison of 2-3 agents
  - Highlight differences in capabilities
  - Compare reputation scores

- [ ] **Advanced Filtering**
  - Filter by owner address
  - Filter by registration date range
  - Filter by reputation score range
  - Combine filters with AND/OR logic

- [ ] **Performance Optimizations**
  - Implement virtual scrolling for very long lists
  - Cache search results client-side
  - Optimize bundle size
  - Add service worker for offline support

- [ ] **Analytics Dashboard**
  - Total agents registered over time
  - Most popular MCP tools/A2A skills
  - Network activity charts
  - Reputation trends

- [ ] **Developer Tools**
  - API endpoint for programmatic access
  - Export search results to JSON/CSV
  - Agent registration wizard
  - Test agent functionality

## 📖 Documentation

Additional technical documentation is available in the repository:

- **[SEARCH_FIX.md](./SEARCH_FIX.md)** - Client-side name filtering implementation
- **[REPUTATION_ISSUE.md](./REPUTATION_ISSUE.md)** - SDK reputation bug analysis
- **[RESULTS_DISPLAY.md](./RESULTS_DISPLAY.md)** - Smart pagination and count display
- **[NETWORK_SUPPORT.md](./NETWORK_SUPPORT.md)** - Multi-network implementation guide
- **[UI_CHANGES.md](./UI_CHANGES.md)** - UI architecture and separation of concerns
- **[SEARCHABLE_CAPABILITIES.md](./SEARCHABLE_CAPABILITIES.md)** - MCP Tools and A2A Skills reference

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style (TypeScript, SvelteKit conventions)
4. Write descriptive commit messages
5. Test your changes thoroughly
6. Submit a pull request

### Code Style

- Use **TypeScript** for all code
- Use **Svelte 5 runes** (`$state`, `$derived`, `$effect`)
- Follow **SvelteKit** conventions for file structure
- Use **functional components** where possible
- Add **comments** for complex logic
- Keep **pixel-art aesthetic** consistent

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Agent0 SDK**: [github.com/agent0lab/agent0-ts](https://github.com/agent0lab/agent0-ts)
- **SDK Documentation**: [sdk.ag0.xyz](https://sdk.ag0.xyz)
- **SvelteKit**: [kit.svelte.dev](https://kit.svelte.dev)
- **ERC-8004 Standard**: Agent identity and discovery standard
- **Sepolia Testnet**: [sepolia.etherscan.io](https://sepolia.etherscan.io)

## 💬 Support

For issues and questions:
- **GitHub Issues**: Create an issue in this repository
- **Agent0 Discord**: Join the Agent0 community
- **SDK Docs**: Check [sdk.ag0.xyz](https://sdk.ag0.xyz) for SDK questions

## 🎮 Easter Eggs

This is a pixel-art themed app... there might be some hidden retro gaming references. See if you can spot them! 👾

---

Built with 💚 using Agent0 SDK and SvelteKit
