#!/usr/bin/env node

/**
 * Test search functionality using our SDK wrapper (not direct SDK)
 */

// Note: This needs to run in a browser environment because our wrapper checks for 'browser'
// For now, let's just verify the code compiles

import { searchAgents } from '../src/lib/sdk.js';

console.log('Testing wrapper search...');
console.log('Note: This would need to run in browser context to actually test.');
console.log('Use the web app to test the search functionality.');
console.log('\nExpected behavior:');
console.log('- Searching for "ciro" should find "Agente Ciro" (ID 770)');
console.log('- Searching for "deep42" should find "Deep42 Agent" (ID 950)');
console.log('\nThe wrapper fetches up to 10 pages (500 agents) when name filter is used.');
