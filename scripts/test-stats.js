#!/usr/bin/env node

/**
 * Test Statistics Dashboard - verify stats calculation
 */

import { SDK } from 'agent0-sdk';

const sdk = new SDK({
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org'
});

console.log('🧪 Testing Statistics Dashboard\n');

try {
    console.log('📊 Fetching agents for statistics...');
    const result = await sdk.searchAgents({}, undefined, 500);

    const agents = result.items;
    console.log(`✅ Fetched ${agents.length} agents\n`);

    // Calculate same stats as StatsOverview component
    const stats = {
        total: agents.length,
        active: agents.filter(a => a.active).length,
        withMcp: agents.filter(a => a.mcp).length,
        withA2a: agents.filter(a => a.a2a).length,
        withX402: agents.filter(a => a.x402support).length
    };

    console.log('📈 Calculated Statistics:');
    console.log(`   📊 Total Agents:    ${stats.total}`);
    console.log(`   ✅ Active:          ${stats.active} (${((stats.active/stats.total)*100).toFixed(1)}%)`);
    console.log(`   🔧 MCP Protocol:    ${stats.withMcp} (${((stats.withMcp/stats.total)*100).toFixed(1)}%)`);
    console.log(`   🤝 A2A Protocol:    ${stats.withA2a} (${((stats.withA2a/stats.total)*100).toFixed(1)}%)`);
    console.log(`   💳 Payment Ready:   ${stats.withX402} (${((stats.withX402/stats.total)*100).toFixed(1)}%)`);

    // Validation checks
    console.log('\n🔍 Validation:');

    if (stats.total === 0) {
        console.log('   ⚠️  WARNING: No agents found in network');
    } else {
        console.log('   ✅ Total agents > 0');
    }

    if (stats.active === 0) {
        console.log('   ⚠️  WARNING: No active agents found');
    } else {
        console.log(`   ✅ ${stats.active} active agents found`);
    }

    if (stats.withMcp === 0 && stats.withA2a === 0) {
        console.log('   ⚠️  WARNING: No agents with protocols (MCP or A2A)');
    } else {
        console.log('   ✅ Protocol-enabled agents found');
    }

    // Sample agent details
    if (agents.length > 0) {
        console.log('\n📦 Sample Agent:');
        const sample = agents[0];
        console.log(`   Name:         ${sample.name}`);
        console.log(`   ID:           ${sample.agentId}`);
        console.log(`   Active:       ${sample.active ? '✅' : '❌'}`);
        console.log(`   MCP:          ${sample.mcp ? '✅' : '❌'}`);
        console.log(`   A2A:          ${sample.a2a ? '✅' : '❌'}`);
        console.log(`   x402:         ${sample.x402support ? '✅' : '❌'}`);
    }

    console.log('\n✅ Statistics test completed successfully!');

} catch (error) {
    console.error('❌ Error testing statistics:', error.message);
    process.exit(1);
}
