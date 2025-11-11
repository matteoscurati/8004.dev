#!/usr/bin/env node

/**
 * Test script to verify chain filter functionality
 * Compares SDK results with expected counts
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

console.log('\n' + BRIGHT + CYAN + '🧪 Testing Chain Filter Functionality' + RESET + '\n');

async function fetchAllAgentsForChain(chainId) {
	const config = {
		chainId: chainId,
		rpcUrl: RPC_URL,
		ipfs: IPFS_PROVIDER
	};

	if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
		config.pinataJwt = PINATA_JWT;
	}

	const sdk = new SDK(config);

	let allAgents = [];
	let cursor = undefined;

	// Fetch all pages
	do {
		const result = await sdk.searchAgents({}, undefined, 100, cursor);
		if (result.items) {
			allAgents.push(...result.items);
		}
		cursor = result.nextCursor;
	} while (cursor);

	return allAgents;
}

async function testMultiChainSearch() {
	console.log(`${BRIGHT}Test 1: Search with chains='all' (default)${RESET}`);

	const config = {
		chainId: 11155111, // Default, but will be overridden by chains parameter
		rpcUrl: RPC_URL,
		ipfs: IPFS_PROVIDER
	};

	if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
		config.pinataJwt = PINATA_JWT;
	}

	const sdk = new SDK(config);

	try {
		// Test 1: Search with 'all' chains (this is what the SDK should do when chains='all')
		console.log(`   Fetching with chains='all'...`);
		let allAgents = [];
		let cursor = undefined;

		do {
			const result = await sdk.searchAgents({}, undefined, 100, cursor, 'all');
			if (result.items) {
				allAgents.push(...result.items);
			}
			cursor = result.nextCursor;
		} while (cursor);

		console.log(`   ${GREEN}✓${RESET} Found ${BRIGHT}${allAgents.length}${RESET} agents`);

		// Count by chain
		const chainCounts = {};
		allAgents.forEach(agent => {
			const chainId = agent.chainId || 'unknown';
			chainCounts[chainId] = (chainCounts[chainId] || 0) + 1;
		});

		console.log(`   Chain breakdown:`);
		Object.entries(chainCounts).forEach(([chainId, count]) => {
			const chainName = chainId === '11155111' ? 'Ethereum Sepolia' :
							  chainId === '84532' ? 'Base Sepolia' :
							  chainId === '80002' ? 'Polygon Amoy' :
							  `Unknown (${chainId})`;
			console.log(`     - ${chainName}: ${count}`);
		});

		return chainCounts;
	} catch (error) {
		console.log(`   ${RED}✗ Error:${RESET} ${error.message}`);
		return null;
	}
}

async function testSingleChainSearch(chainId, chainName) {
	console.log(`\n${BRIGHT}Test: Search specific chain [${chainId}] - ${chainName}${RESET}`);

	const config = {
		chainId: chainId,
		rpcUrl: RPC_URL,
		ipfs: IPFS_PROVIDER
	};

	if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
		config.pinataJwt = PINATA_JWT;
	}

	const sdk = new SDK(config);

	try {
		console.log(`   Fetching with chains=[${chainId}]...`);
		let allAgents = [];
		let cursor = undefined;

		do {
			const result = await sdk.searchAgents({}, undefined, 100, cursor, [chainId]);
			if (result.items) {
				allAgents.push(...result.items);
			}
			cursor = result.nextCursor;
		} while (cursor);

		console.log(`   ${GREEN}✓${RESET} Found ${BRIGHT}${allAgents.length}${RESET} agents`);

		// Verify all agents are from this chain
		const wrongChain = allAgents.filter(a => a.chainId !== chainId);
		if (wrongChain.length > 0) {
			console.log(`   ${RED}✗ WARNING:${RESET} Found ${wrongChain.length} agents from wrong chain!`);
		}

		return allAgents.length;
	} catch (error) {
		console.log(`   ${RED}✗ Error:${RESET} ${error.message}`);
		return 0;
	}
}

async function main() {
	console.log(`${CYAN}📡 RPC URL:${RESET} ${RPC_URL.substring(0, 40)}...`);
	console.log(`${CYAN}🗄️  IPFS Provider:${RESET} ${IPFS_PROVIDER}\n`);
	console.log('═'.repeat(80) + '\n');

	// Expected counts from previous run
	const expectedCounts = {
		'11155111': 595,  // Ethereum Sepolia
		'84532': 248,     // Base Sepolia
		'80002': 0        // Polygon Amoy
	};

	// Test multi-chain search
	const multiChainResults = await testMultiChainSearch();

	console.log('\n' + '─'.repeat(80) + '\n');

	// Test individual chains
	const ethCount = await testSingleChainSearch(11155111, 'Ethereum Sepolia');
	const baseCount = await testSingleChainSearch(84532, 'Base Sepolia');
	const polygonCount = await testSingleChainSearch(80002, 'Polygon Amoy');

	console.log('\n' + '═'.repeat(80) + '\n');
	console.log(`${BRIGHT}📊 RESULTS SUMMARY:${RESET}\n`);

	// Compare results
	const results = {
		'Ethereum Sepolia (11155111)': {
			expected: expectedCounts['11155111'],
			actual: ethCount,
			multiChain: multiChainResults ? (multiChainResults['11155111'] || 0) : 0
		},
		'Base Sepolia (84532)': {
			expected: expectedCounts['84532'],
			actual: baseCount,
			multiChain: multiChainResults ? (multiChainResults['84532'] || 0) : 0
		},
		'Polygon Amoy (80002)': {
			expected: expectedCounts['80002'],
			actual: polygonCount,
			multiChain: multiChainResults ? (multiChainResults['80002'] || 0) : 0
		}
	};

	let allPassed = true;

	Object.entries(results).forEach(([chain, data]) => {
		const singleMatch = data.actual === data.expected;
		const multiMatch = data.multiChain === data.expected;
		const passed = singleMatch && multiMatch;

		if (!passed) allPassed = false;

		const icon = passed ? `${GREEN}✓` : `${RED}✗`;
		console.log(`${icon} ${chain}${RESET}`);
		console.log(`   Expected:     ${data.expected}`);
		console.log(`   Single Chain: ${data.actual} ${singleMatch ? GREEN + '✓' : RED + '✗'}${RESET}`);
		console.log(`   Multi Chain:  ${data.multiChain} ${multiMatch ? GREEN + '✓' : RED + '✗'}${RESET}`);
		console.log('');
	});

	const totalExpected = Object.values(expectedCounts).reduce((a, b) => a + b, 0);
	const totalMultiChain = multiChainResults ? Object.values(multiChainResults)
		.filter(v => typeof v === 'number')
		.reduce((a, b) => a + b, 0) : 0;

	console.log('─'.repeat(80));
	console.log(`${BRIGHT}TOTAL (All Chains):${RESET}`);
	console.log(`   Expected:     ${totalExpected}`);
	console.log(`   Multi Chain:  ${totalMultiChain} ${totalMultiChain === totalExpected ? GREEN + '✓' : RED + '✗'}${RESET}`);
	console.log('═'.repeat(80) + '\n');

	if (allPassed && totalMultiChain === totalExpected) {
		console.log(`${GREEN}${BRIGHT}✓ ALL TESTS PASSED!${RESET}`);
		console.log(`${GREEN}Chain filters are working correctly.${RESET}\n`);
		process.exit(0);
	} else {
		console.log(`${RED}${BRIGHT}✗ SOME TESTS FAILED!${RESET}`);
		console.log(`${YELLOW}Chain filters may not be working as expected.${RESET}\n`);
		process.exit(1);
	}
}

main().catch(error => {
	console.error(`\n${RED}✗ Fatal error:${RESET}`, error);
	process.exit(1);
});
