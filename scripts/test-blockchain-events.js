/**
 * Test script for blockchain event fetching
 *
 * This script tests the blockchain event listener to verify:
 * - Connection to the smart contract
 * - Fetching historical events (Registered and MetadataSet)
 * - Parsing and formatting events correctly
 */

import { SDK } from 'agent0-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const PUBLIC_RPC_URL = process.env.PUBLIC_RPC_URL;
const PUBLIC_CHAIN_ID = parseInt(process.env.PUBLIC_CHAIN_ID || '11155111');

console.log('🧪 Testing Blockchain Event Fetching\n');
console.log(`Chain ID: ${PUBLIC_CHAIN_ID}`);
console.log(`RPC URL: ${PUBLIC_RPC_URL}\n`);

async function testEventFetching() {
	try {
		// Initialize SDK
		const sdk = new SDK({
			chainId: PUBLIC_CHAIN_ID,
			rpcUrl: PUBLIC_RPC_URL
		});

		console.log('✅ SDK initialized\n');

		// Get contract and provider
		const contract = sdk.getIdentityRegistry();
		const provider = sdk.web3Client.provider;

		console.log(`📝 Contract address: ${await contract.getAddress()}\n`);

		// Get latest block
		const latestBlock = await provider.getBlockNumber();
		console.log(`📦 Latest block: ${latestBlock}\n`);

		// Calculate fromBlock (last ~1000 blocks, roughly 3-4 hours)
		// Reduced to avoid free tier RPC limits
		const fromBlock = Math.max(0, latestBlock - 1000);
		console.log(`📚 Fetching events from block ${fromBlock} to ${latestBlock}\n`);

		// Batch fetching to avoid RPC limits (10 blocks per batch)
		const BATCH_SIZE = 10;
		const batches = [];
		for (let start = fromBlock; start <= latestBlock; start += BATCH_SIZE) {
			const end = Math.min(start + BATCH_SIZE - 1, latestBlock);
			batches.push([start, end]);
		}

		console.log(`   Using ${batches.length} batches of ${BATCH_SIZE} blocks each\n`);

		// Fetch Registered events
		console.log('🔍 Fetching Registered events...');
		const registeredFilter = contract.filters.Registered();
		let registeredEvents = [];

		for (const [start, end] of batches) {
			const batchEvents = await contract.queryFilter(registeredFilter, start, end);
			registeredEvents.push(...batchEvents);
		}

		console.log(`   Found ${registeredEvents.length} Registered events\n`);

		// Display first 5 Registered events
		if (registeredEvents.length > 0) {
			console.log('📋 Sample Registered Events (first 5):');
			for (let i = 0; i < Math.min(5, registeredEvents.length); i++) {
				const event = registeredEvents[i];
				if (event instanceof ethers.EventLog) {
					const [agentId, tokenURI, owner] = event.args;
					const block = await event.getBlock();
					const timestamp = new Date(block.timestamp * 1000).toISOString();

					console.log(`   [${i + 1}] Agent #${agentId.toString()}`);
					console.log(`       Owner: ${owner}`);
					console.log(`       Timestamp: ${timestamp}`);
					console.log(`       Block: ${event.blockNumber}`);
					console.log(`       TokenURI: ${tokenURI.substring(0, 60)}...`);
					console.log();
				}
			}
		}

		// Fetch MetadataSet events
		console.log('🔍 Fetching MetadataSet events...');
		const metadataFilter = contract.filters.MetadataSet();
		let metadataEvents = [];

		for (const [start, end] of batches) {
			const batchEvents = await contract.queryFilter(metadataFilter, start, end);
			metadataEvents.push(...batchEvents);
		}

		console.log(`   Found ${metadataEvents.length} MetadataSet events\n`);

		// Display first 10 MetadataSet events
		if (metadataEvents.length > 0) {
			console.log('📋 Sample MetadataSet Events (first 10):');
			for (let i = 0; i < Math.min(10, metadataEvents.length); i++) {
				const event = metadataEvents[i];
				if (event instanceof ethers.EventLog) {
					const [agentId, indexedKey, key, value] = event.args;
					const block = await event.getBlock();
					const timestamp = new Date(block.timestamp * 1000).toISOString();

					console.log(`   [${i + 1}] Agent #${agentId.toString()}`);
					console.log(`       Key: ${key}`);
					console.log(`       Value: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
					console.log(`       Timestamp: ${timestamp}`);
					console.log(`       Block: ${event.blockNumber}`);
					console.log();
				}
			}
		}

		// Summary
		console.log('📊 Summary:');
		console.log(`   Total Registered events: ${registeredEvents.length}`);
		console.log(`   Total MetadataSet events: ${metadataEvents.length}`);
		console.log(`   Total events: ${registeredEvents.length + metadataEvents.length}`);
		console.log();

		// Analyze MetadataSet event types
		const metadataKeys = {};
		for (const event of metadataEvents) {
			if (event instanceof ethers.EventLog) {
				const [, , key] = event.args;
				metadataKeys[key] = (metadataKeys[key] || 0) + 1;
			}
		}

		console.log('📊 MetadataSet Event Types:');
		for (const [key, count] of Object.entries(metadataKeys)) {
			console.log(`   ${key}: ${count}`);
		}

		console.log('\n✅ Test completed successfully!');

	} catch (error) {
		console.error('❌ Error:', error.message);
		if (error.stack) {
			console.error('\nStack trace:');
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run test
testEventFetching();
