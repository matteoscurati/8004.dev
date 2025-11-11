#!/usr/bin/env node

/**
 * Test script to verify frontend multi-chain implementation
 * Tests that searchAgents() correctly aggregates results from all chains
 */

import { SDK } from 'agent0-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const RPC_URL = process.env.PUBLIC_RPC_URL;
const IPFS_PROVIDER = process.env.PUBLIC_IPFS_PROVIDER || 'pinata';
const PINATA_JWT = process.env.PUBLIC_PINATA_JWT;

// ANSI colors
const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

console.log('\n' + BRIGHT + CYAN + '🧪 Testing Frontend Multi-Chain Implementation' + RESET + '\n');

// SDK instances per chain
const sdkInstances = new Map();

function getSDKForChain(chainId) {
	if (sdkInstances.has(chainId)) {
		return sdkInstances.get(chainId);
	}

	const config = {
		chainId: chainId,
		rpcUrl: RPC_URL,
		ipfs: IPFS_PROVIDER
	};

	if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
		config.pinataJwt = PINATA_JWT;
	}

	const sdk = new SDK(config);
	sdkInstances.set(chainId, sdk);
	return sdk;
}

async function countAgentsOnChain(chainId) {
	const sdk = getSDKForChain(chainId);
	let count = 0;
	let cursor = undefined;

	while (true) {
		const result = await sdk.searchAgents({}, undefined, 100, cursor);
		count += result.items.length;
		if (!result.nextCursor) break;
		cursor = result.nextCursor;
	}

	return count;
}

async function main() {
	console.log(`${CYAN}📡 RPC URL:${RESET} ${RPC_URL.substring(0, 40)}...`);
	console.log(`${CYAN}🗄️  IPFS Provider:${RESET} ${IPFS_PROVIDER}\n`);
	console.log('═'.repeat(80) + '\n');

	// Expected counts from previous tests
	const expectedCounts = {
		11155111: 595,  // Ethereum Sepolia
		84532: 248,     // Base Sepolia
		80002: 0        // Polygon Amoy
	};
	const expectedTotal = 843;

	console.log(`${BRIGHT}Test 1: Individual Chain Queries${RESET}\n`);

	const chains = [
		{ id: 11155111, name: 'Ethereum Sepolia' },
		{ id: 84532, name: 'Base Sepolia' },
		{ id: 80002, name: 'Polygon Amoy' }
	];

	let actualTotal = 0;
	const results = {};

	for (const chain of chains) {
		process.stdout.write(`   Querying ${chain.name}... `);
		const count = await countAgentsOnChain(chain.id);
		results[chain.id] = count;
		actualTotal += count;

		const match = count === expectedCounts[chain.id];
		const icon = match ? `${GREEN}✓` : `${RED}✗`;
		console.log(`${icon} ${count} agents${RESET} (expected: ${expectedCounts[chain.id]})`);
	}

	console.log('');
	console.log('─'.repeat(80));
	console.log(`${BRIGHT}Total from individual queries:${RESET} ${actualTotal} agents`);
	console.log(`${BRIGHT}Expected total:${RESET} ${expectedTotal} agents`);

	if (actualTotal === expectedTotal) {
		console.log(`${GREEN}✓ Individual chain queries: PASS${RESET}`);
	} else {
		console.log(`${RED}✗ Individual chain queries: FAIL${RESET}`);
	}

	console.log('═'.repeat(80) + '\n');

	console.log(`${BRIGHT}Test 2: Multi-Chain Aggregation (Simulated Frontend)${RESET}\n`);

	// Simulate what the frontend does with Promise.allSettled
	console.log('   Querying all chains in parallel...\n');

	const chainResults = await Promise.allSettled(
		chains.map(async (chain) => {
			const sdk = getSDKForChain(chain.id);
			let allItems = [];
			let cursor = undefined;
			let pagesFetched = 0;
			const maxPages = 10;

			while (pagesFetched < maxPages) {
				const result = await sdk.searchAgents({}, undefined, 100, cursor);
				if (result.items) {
					allItems.push(...result.items);
				}
				cursor = result.nextCursor;
				pagesFetched++;
				if (!cursor) break;
			}

			console.log(`   ${chain.name}: ${allItems.length} agents`);
			return allItems;
		})
	);

	let aggregatedTotal = 0;
	chainResults.forEach((result) => {
		if (result.status === 'fulfilled') {
			aggregatedTotal += result.value.length;
		}
	});

	console.log('');
	console.log('─'.repeat(80));
	console.log(`${BRIGHT}Total from aggregation:${RESET} ${aggregatedTotal} agents`);
	console.log(`${BRIGHT}Expected total:${RESET} ${expectedTotal} agents`);

	if (aggregatedTotal === expectedTotal) {
		console.log(`${GREEN}✓ Multi-chain aggregation: PASS${RESET}`);
	} else {
		console.log(`${RED}✗ Multi-chain aggregation: FAIL${RESET}`);
	}

	console.log('═'.repeat(80) + '\n');

	// Final summary
	const allTestsPassed = actualTotal === expectedTotal && aggregatedTotal === expectedTotal;

	if (allTestsPassed) {
		console.log(`${GREEN}${BRIGHT}✓ ALL TESTS PASSED!${RESET}`);
		console.log(`${GREEN}Frontend multi-chain implementation is working correctly.${RESET}\n`);
		process.exit(0);
	} else {
		console.log(`${RED}${BRIGHT}✗ SOME TESTS FAILED!${RESET}`);
		console.log(`${YELLOW}Expected: ${expectedTotal}, Got: ${aggregatedTotal}${RESET}\n`);
		process.exit(1);
	}
}

main().catch(error => {
	console.error(`\n${RED}✗ Fatal error:${RESET}`, error);
	process.exit(1);
});
