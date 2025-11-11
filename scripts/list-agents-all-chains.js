#!/usr/bin/env node

/**
 * Script to list all agents from ALL supported chains
 * This script queries each chain separately and shows the distribution
 *
 * Usage:
 *   node scripts/list-agents-all-chains.js              # Summary only
 *   node scripts/list-agents-all-chains.js --detailed   # Show all agents
 *   node scripts/list-agents-all-chains.js --chain 11155111  # Single chain
 */

import { SDK } from 'agent0-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

const RPC_URL = process.env.PUBLIC_RPC_URL;
const IPFS_PROVIDER = process.env.PUBLIC_IPFS_PROVIDER || 'pinata';
const PINATA_JWT = process.env.PUBLIC_PINATA_JWT;
const IPFS_NODE_URL = process.env.PUBLIC_IPFS_NODE_URL;

// Supported chains (from SDK v0.3.0)
const SUPPORTED_CHAINS = {
	11155111: {
		name: 'Ethereum Sepolia',
		shortName: 'ETH',
		icon: '⟠',
		color: '\x1b[36m' // Cyan
	},
	84532: {
		name: 'Base Sepolia',
		shortName: 'BASE',
		icon: '🔵',
		color: '\x1b[34m' // Blue
	},
	80002: {
		name: 'Polygon Amoy',
		shortName: 'POL',
		icon: '◆',
		color: '\x1b[35m' // Magenta
	}
};

// Parse command line arguments
const args = process.argv.slice(2);
const showDetailed = args.includes('--detailed');
const chainIdArg = args.indexOf('--chain');
const specificChain = chainIdArg !== -1 ? parseInt(args[chainIdArg + 1]) : null;

// ANSI color codes
const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

console.log('\n' + BRIGHT + CYAN + '╔══════════════════════════════════════════════════════════════╗' + RESET);
console.log(BRIGHT + CYAN + '║     Agent0 - Multi-Chain Agent Discovery (SDK v0.3.0)       ║' + RESET);
console.log(BRIGHT + CYAN + '╚══════════════════════════════════════════════════════════════╝' + RESET + '\n');

async function fetchAgentsForChain(chainId, chainConfig) {
	const config = {
		chainId: chainId,
		rpcUrl: RPC_URL,
		ipfs: IPFS_PROVIDER
	};

	if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
		config.pinataJwt = PINATA_JWT;
	}
	if (IPFS_PROVIDER === 'node' && IPFS_NODE_URL) {
		config.ipfsNodeUrl = IPFS_NODE_URL;
	}

	try {
		const sdk = new SDK(config);

		console.log(`${chainConfig.color}${chainConfig.icon} Fetching agents from ${chainConfig.name}...${RESET}`);

		let allAgents = [];
		let cursor = undefined;
		let pageCount = 0;

		// Fetch all pages
		do {
			pageCount++;
			const result = await sdk.searchAgents({}, undefined, 100, cursor);

			if (result.items && result.items.length > 0) {
				allAgents.push(...result.items);
			}

			cursor = result.nextCursor;

			// Safety limit
			if (pageCount > 100) {
				console.log(`${YELLOW}⚠️  Safety limit reached (100 pages), stopping pagination${RESET}`);
				break;
			}
		} while (cursor);

		return {
			chainId,
			chainConfig,
			agents: allAgents,
			success: true
		};

	} catch (error) {
		console.error(`${RED}✗ Error fetching from ${chainConfig.name}:${RESET}`, error.message);
		return {
			chainId,
			chainConfig,
			agents: [],
			success: false,
			error: error.message
		};
	}
}

async function main() {
	if (!RPC_URL) {
		console.error(`${RED}✗ Error: PUBLIC_RPC_URL is not set in .env file${RESET}`);
		process.exit(1);
	}

	console.log(`${CYAN}📡 RPC URL:${RESET} ${RPC_URL.substring(0, 40)}...`);
	console.log(`${CYAN}🗄️  IPFS Provider:${RESET} ${IPFS_PROVIDER}\n`);

	// Determine which chains to query
	const chainsToQuery = specificChain
		? { [specificChain]: SUPPORTED_CHAINS[specificChain] }
		: SUPPORTED_CHAINS;

	if (specificChain && !SUPPORTED_CHAINS[specificChain]) {
		console.error(`${RED}✗ Error: Chain ${specificChain} is not supported${RESET}`);
		console.log(`${YELLOW}Supported chains:${RESET}`);
		Object.entries(SUPPORTED_CHAINS).forEach(([id, config]) => {
			console.log(`  ${config.icon} ${id}: ${config.name}`);
		});
		process.exit(1);
	}

	// Fetch agents from all chains in parallel
	console.log(`${BRIGHT}🔍 Querying ${Object.keys(chainsToQuery).length} chain(s)...${RESET}\n`);

	const startTime = Date.now();
	const results = await Promise.all(
		Object.entries(chainsToQuery).map(([chainId, config]) =>
			fetchAgentsForChain(parseInt(chainId), config)
		)
	);
	const endTime = Date.now();

	console.log('\n' + '═'.repeat(80));
	console.log(BRIGHT + GREEN + '✓ QUERY COMPLETE' + RESET + ` (took ${((endTime - startTime) / 1000).toFixed(2)}s)`);
	console.log('═'.repeat(80) + '\n');

	// Calculate totals
	let grandTotal = 0;
	let activeTotal = 0;
	let mcpTotal = 0;
	let a2aTotal = 0;
	let x402Total = 0;

	// Display summary for each chain
	console.log(BRIGHT + '📊 CHAIN SUMMARY:' + RESET + '\n');

	results.forEach(result => {
		const { chainId, chainConfig, agents, success, error } = result;

		if (!success) {
			console.log(`${chainConfig.color}${chainConfig.icon} ${chainConfig.name}${RESET}`);
			console.log(`   ${RED}✗ Failed: ${error}${RESET}\n`);
			return;
		}

		const active = agents.filter(a => a.active).length;
		const withMcp = agents.filter(a => a.mcp).length;
		const withA2a = agents.filter(a => a.a2a).length;
		const withX402 = agents.filter(a => a.x402support).length;

		grandTotal += agents.length;
		activeTotal += active;
		mcpTotal += withMcp;
		a2aTotal += withA2a;
		x402Total += withX402;

		console.log(`${chainConfig.color}${BRIGHT}${chainConfig.icon} ${chainConfig.name} (Chain ID: ${chainId})${RESET}`);
		console.log(`   Total Agents:     ${BRIGHT}${agents.length}${RESET}`);
		console.log(`   Active:           ${GREEN}${active}${RESET} (${agents.length > 0 ? ((active/agents.length)*100).toFixed(1) : 0}%)`);
		console.log(`   MCP Protocol:     ${CYAN}${withMcp}${RESET} (${agents.length > 0 ? ((withMcp/agents.length)*100).toFixed(1) : 0}%)`);
		console.log(`   A2A Protocol:     ${YELLOW}${withA2a}${RESET} (${agents.length > 0 ? ((withA2a/agents.length)*100).toFixed(1) : 0}%)`);
		console.log(`   Payment Ready:    ${GREEN}${withX402}${RESET} (${agents.length > 0 ? ((withX402/agents.length)*100).toFixed(1) : 0}%)`);
		console.log('');
	});

	// Display grand totals
	console.log('─'.repeat(80));
	console.log(BRIGHT + '🌐 GRAND TOTAL (All Chains):' + RESET);
	console.log(`   Total Agents:     ${BRIGHT}${grandTotal}${RESET}`);
	console.log(`   Active:           ${GREEN}${activeTotal}${RESET} (${grandTotal > 0 ? ((activeTotal/grandTotal)*100).toFixed(1) : 0}%)`);
	console.log(`   MCP Protocol:     ${CYAN}${mcpTotal}${RESET} (${grandTotal > 0 ? ((mcpTotal/grandTotal)*100).toFixed(1) : 0}%)`);
	console.log(`   A2A Protocol:     ${YELLOW}${a2aTotal}${RESET} (${grandTotal > 0 ? ((a2aTotal/grandTotal)*100).toFixed(1) : 0}%)`);
	console.log(`   Payment Ready:    ${GREEN}${x402Total}${RESET} (${grandTotal > 0 ? ((x402Total/grandTotal)*100).toFixed(1) : 0}%)`);
	console.log('═'.repeat(80) + '\n');

	// Show detailed agent list if requested
	if (showDetailed && grandTotal > 0) {
		console.log(BRIGHT + '📋 DETAILED AGENT LIST:' + RESET + '\n');

		results.forEach(result => {
			const { chainConfig, agents, success } = result;

			if (!success || agents.length === 0) return;

			console.log(`${chainConfig.color}${BRIGHT}═══ ${chainConfig.icon} ${chainConfig.name} (${agents.length} agents) ═══${RESET}\n`);

			agents.forEach((agent, index) => {
				console.log(`${index + 1}. ${BRIGHT}${agent.name}${RESET}`);
				console.log(`   ID:          ${agent.agentId}`);
				console.log(`   Active:      ${agent.active ? GREEN + '✓' : RED + '✗'}${RESET}`);
				console.log(`   MCP:         ${agent.mcp ? CYAN + '✓' : '✗'}${RESET}`);
				console.log(`   A2A:         ${agent.a2a ? YELLOW + '✓' : '✗'}${RESET}`);
				console.log(`   x402:        ${agent.x402support ? GREEN + '✓' : '✗'}${RESET}`);

				if (agent.mcpTools && agent.mcpTools.length > 0) {
					console.log(`   MCP Tools:   ${agent.mcpTools.join(', ')}`);
				}
				if (agent.a2aSkills && agent.a2aSkills.length > 0) {
					console.log(`   A2A Skills:  ${agent.a2aSkills.join(', ')}`);
				}
				console.log('');
			});
		});
	}

	// Show usage hints
	if (!showDetailed && grandTotal > 0) {
		console.log(`${CYAN}💡 Tip: Use --detailed to see full agent list${RESET}`);
	}
	if (!specificChain) {
		console.log(`${CYAN}💡 Tip: Use --chain <chainId> to query a specific chain only${RESET}`);
	}
	console.log('');
}

// Run the script
main().catch(error => {
	console.error(`\n${RED}✗ Fatal error:${RESET}`, error);
	process.exit(1);
});
