#!/usr/bin/env node

/**
 * Inspect a specific agent in detail
 */

import { SDK } from 'agent0-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const RPC_URL = process.env.PUBLIC_RPC_URL;
const CHAIN_ID = parseInt(process.env.PUBLIC_CHAIN_ID || '11155111');
const IPFS_PROVIDER = process.env.PUBLIC_IPFS_PROVIDER || 'pinata';
const PINATA_JWT = process.env.PUBLIC_PINATA_JWT;

async function inspectAgent(agentId) {
    try {
        const config = {
            chainId: CHAIN_ID,
            rpcUrl: RPC_URL,
            ipfs: IPFS_PROVIDER
        };

        if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
            config.pinataJwt = PINATA_JWT;
        }

        const sdk = new SDK(config);

        console.log(`\n🔍 Inspecting Agent: ${agentId}\n`);
        console.log('═'.repeat(80));

        const agent = await sdk.getAgent(agentId);

        if (!agent) {
            console.log('❌ Agent not found');
            return;
        }

        console.log('\n📊 FULL AGENT DATA:');
        console.log(JSON.stringify(agent, null, 2));

        console.log('\n═'.repeat(80));
        console.log('\n📋 SUMMARY:');
        console.log(`  Name:         ${agent.name}`);
        console.log(`  Description:  ${agent.description}`);
        console.log(`  Active:       ${agent.active}`);
        console.log(`  x402 Support: ${agent.x402support}`);

        console.log('\n🔧 CAPABILITIES:');
        console.log(`  MCP Enabled:  ${agent.mcp}`);
        console.log(`  A2A Enabled:  ${agent.a2a}`);

        if (agent.mcpTools && agent.mcpTools.length > 0) {
            console.log(`\n  MCP Tools (${agent.mcpTools.length}):`);
            agent.mcpTools.forEach(tool => console.log(`    - ${tool}`));
        } else {
            console.log(`\n  MCP Tools: None (array length: ${agent.mcpTools?.length || 0})`);
        }

        if (agent.mcpPrompts && agent.mcpPrompts.length > 0) {
            console.log(`\n  MCP Prompts (${agent.mcpPrompts.length}):`);
            agent.mcpPrompts.forEach(prompt => console.log(`    - ${prompt}`));
        }

        if (agent.mcpResources && agent.mcpResources.length > 0) {
            console.log(`\n  MCP Resources (${agent.mcpResources.length}):`);
            agent.mcpResources.forEach(resource => console.log(`    - ${resource}`));
        }

        if (agent.a2aSkills && agent.a2aSkills.length > 0) {
            console.log(`\n  A2A Skills (${agent.a2aSkills.length}):`);
            agent.a2aSkills.forEach(skill => console.log(`    - ${skill}`));
        } else {
            console.log(`\n  A2A Skills: None (array length: ${agent.a2aSkills?.length || 0})`);
        }

        console.log('\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

const agentId = process.argv[2] || '11155111:770'; // Default to Agente Ciro (active version)

inspectAgent(agentId);
