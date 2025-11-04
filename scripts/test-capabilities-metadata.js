#!/usr/bin/env node

/**
 * Test script for capabilities metadata
 * Verifies that common MCP tools and A2A skills are properly mapped
 */

import { getCapabilityMetadata, getCategoryColor } from '../src/lib/data/capabilities-metadata.js';

console.log('🧪 Testing Capabilities Metadata\n');

// Test common MCP tools
const mcpTools = ['github', 'slack', 'postgresql', 'filesystem', 'fetch', 'unknown-tool'];

console.log('📦 MCP Tools:');
console.log('─'.repeat(60));
mcpTools.forEach(tool => {
	const metadata = getCapabilityMetadata(tool, 'mcp');
	const color = getCategoryColor(metadata.category);
	console.log(`\n${metadata.icon} ${metadata.name}`);
	console.log(`  Category: ${metadata.category} (${color})`);
	console.log(`  Description: ${metadata.description}`);
	if (metadata.docUrl) {
		console.log(`  Docs: ${metadata.docUrl}`);
	}
	if (metadata.examples) {
		console.log(`  Examples: ${metadata.examples.join(', ')}`);
	}
});

// Test common A2A skills
const a2aSkills = ['payment', 'data-retrieval', 'authentication', 'unknown-skill'];

console.log('\n\n⚡ A2A Skills:');
console.log('─'.repeat(60));
a2aSkills.forEach(skill => {
	const metadata = getCapabilityMetadata(skill, 'a2a');
	const color = getCategoryColor(metadata.category);
	console.log(`\n${metadata.icon} ${metadata.name}`);
	console.log(`  Category: ${metadata.category} (${color})`);
	console.log(`  Description: ${metadata.description}`);
	if (metadata.docUrl) {
		console.log(`  Docs: ${metadata.docUrl}`);
	}
	if (metadata.examples) {
		console.log(`  Examples: ${metadata.examples.join(', ')}`);
	}
});

console.log('\n\n✅ Metadata test complete!');
