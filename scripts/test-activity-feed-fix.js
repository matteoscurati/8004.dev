#!/usr/bin/env node

/**
 * Test Activity Feed Fix - Verify unique event IDs prevent duplicate keys
 */

import { apiEventToActivityEvent } from '../src/lib/utils/event-adapter.js';

// Sample API events with same timestamp (duplicate key scenario)
const mockApiEvents = [
	{
		id: 1001,
		block_number: 12345,
		block_timestamp: '2025-01-06T12:00:00Z',
		transaction_hash: '0xabc123',
		log_index: 0,
		contract_address: '0xagent1',
		event_type: 'Registered',
		event_data: {
			agentId: '0xagent1',
			name: 'Test Agent 1'
		},
		created_at: '2025-01-06T12:00:00Z'
	},
	{
		id: 1002,
		block_number: 12345,
		block_timestamp: '2025-01-06T12:00:00Z', // Same timestamp!
		transaction_hash: '0xabc124',
		log_index: 1,
		contract_address: '0xagent1',
		event_type: 'Registered',
		event_data: {
			agentId: '0xagent1',
			name: 'Test Agent 1 Updated'
		},
		created_at: '2025-01-06T12:00:00Z'
	},
	{
		id: 1003,
		block_number: 12345,
		block_timestamp: '2025-01-06T12:00:00Z', // Same timestamp again!
		transaction_hash: '0xabc125',
		log_index: 2,
		contract_address: '0xagent2',
		event_type: 'CapabilityAdded',
		event_data: {
			agentId: '0xagent2',
			name: 'Test Agent 2',
			capability: 'file-read',
			capabilityType: 'mcp'
		},
		created_at: '2025-01-06T12:00:00Z'
	}
];

console.log('🧪 Testing Activity Feed Duplicate Key Fix\n');
console.log('='.repeat(50));

// Convert API events to ActivityEvents
const activityEvents = mockApiEvents
	.map(apiEventToActivityEvent)
	.filter(event => event !== null);

console.log(`\n✅ Converted ${activityEvents.length} API events to ActivityEvents\n`);

// Check for unique IDs
const ids = activityEvents.map(e => e.id);
const uniqueIds = new Set(ids);

console.log('Event IDs:');
activityEvents.forEach((event, i) => {
	console.log(`  [${i}] id=${event.id}, type=${event.type}, timestamp=${event.timestamp}`);
});

console.log();

// Generate keys (as used in Svelte each block)
const keys = activityEvents.map(event =>
	event.id || `${event.timestamp}-${event.agentId}-${event.type}`
);

const uniqueKeys = new Set(keys);

console.log('Generated Keys:');
keys.forEach((key, i) => {
	console.log(`  [${i}] ${key}`);
});

console.log('\n' + '='.repeat(50));

if (uniqueKeys.size === keys.length) {
	console.log(`\n✅ SUCCESS: All ${keys.length} keys are unique!`);
	console.log(`   No duplicate key errors will occur.\n`);
	process.exit(0);
} else {
	console.log(`\n❌ FAILURE: Found duplicate keys!`);
	console.log(`   Total keys: ${keys.length}`);
	console.log(`   Unique keys: ${uniqueKeys.size}`);
	console.log(`   Duplicates: ${keys.length - uniqueKeys.size}\n`);
	process.exit(1);
}
