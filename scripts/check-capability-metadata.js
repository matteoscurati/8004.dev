#!/usr/bin/env node

/**
 * Check if SDK returns version/endpoint info for capabilities
 */

import { SDK } from 'agent0-sdk';

const sdk = new SDK({
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org'
});

console.log('🔍 Checking for capability metadata in SDK response...\n');

try {
    const result = await sdk.searchAgents({}, undefined, 5);

    if (result.items.length > 0) {
        const agent = result.items[0];

        console.log('📦 Sample Agent:');
        console.log(`   Name: ${agent.name}`);
        console.log(`   ID: ${agent.agentId}\n`);

        console.log('🔍 Available fields:');
        console.log('   ', Object.keys(agent).join(', '));

        console.log('\n📋 Capability-related fields:');
        if (agent.mcpVersion !== undefined) console.log(`   ✓ mcpVersion: ${agent.mcpVersion}`);
        if (agent.mcpEndpoint !== undefined) console.log(`   ✓ mcpEndpoint: ${agent.mcpEndpoint}`);
        if (agent.a2aVersion !== undefined) console.log(`   ✓ a2aVersion: ${agent.a2aVersion}`);
        if (agent.a2aEndpoint !== undefined) console.log(`   ✓ a2aEndpoint: ${agent.a2aEndpoint}`);

        if (!agent.mcpVersion && !agent.mcpEndpoint && !agent.a2aVersion && !agent.a2aEndpoint) {
            console.log('   ❌ No version/endpoint metadata found in SDK response');
        }

        console.log('\n📝 Full agent object:');
        console.log(JSON.stringify(agent, null, 2));
    }
} catch (error) {
    console.error('❌ Error:', error.message);
}
