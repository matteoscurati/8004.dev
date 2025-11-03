#!/usr/bin/env node

/**
 * Script to list all agents registered on Sepolia testnet
 * Usage:
 *   node scripts/list-agents.js              # Show first page (50 agents)
 *   node scripts/list-agents.js --all        # Show all agents (all pages)
 *   node scripts/list-agents.js --pages 3    # Show first 3 pages
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
const CHAIN_ID = parseInt(process.env.PUBLIC_CHAIN_ID || '11155111');
const IPFS_PROVIDER = process.env.PUBLIC_IPFS_PROVIDER || 'pinata';
const PINATA_JWT = process.env.PUBLIC_PINATA_JWT;
const IPFS_NODE_URL = process.env.PUBLIC_IPFS_NODE_URL;

// Parse command line arguments
const args = process.argv.slice(2);
const showAll = args.includes('--all');
const pagesIndex = args.indexOf('--pages');
const maxPages = pagesIndex !== -1 ? parseInt(args[pagesIndex + 1]) : (showAll ? Infinity : 1);

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         Agent0 - List All Agents on Sepolia Testnet         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

async function listAllAgents() {
    try {
        // Validate required env vars
        if (!RPC_URL) {
            throw new Error('PUBLIC_RPC_URL is not set in .env file');
        }

        console.log('🔗 Connecting to Sepolia...');
        console.log(`   RPC: ${RPC_URL.substring(0, 40)}...`);
        console.log(`   Chain ID: ${CHAIN_ID}`);
        console.log(`   IPFS Provider: ${IPFS_PROVIDER}\n`);

        // Initialize SDK
        const config = {
            chainId: CHAIN_ID,
            rpcUrl: RPC_URL,
            ipfs: IPFS_PROVIDER
        };

        if (IPFS_PROVIDER === 'pinata' && PINATA_JWT) {
            config.pinataJwt = PINATA_JWT;
        }
        if (IPFS_PROVIDER === 'node' && IPFS_NODE_URL) {
            config.ipfsNodeUrl = IPFS_NODE_URL;
        }

        const sdk = new SDK(config);

        console.log('🔍 Searching for agents...\n');

        // Pagination variables
        let allAgents = [];
        let cursor = undefined;
        let currentPage = 0;

        // Fetch agents with pagination
        do {
            currentPage++;
            console.log(`📄 Fetching page ${currentPage}...`);

            const result = await sdk.searchAgents(undefined, undefined, 50, cursor);

            if (!result.items || result.items.length === 0) {
                if (currentPage === 1) {
                    console.log('❌ No agents found on Sepolia testnet.\n');
                    console.log('This could mean:');
                    console.log('  • No agents have been registered yet');
                    console.log('  • The subgraph is not synced');
                    console.log('  • There is a connection issue\n');
                    return;
                }
                break;
            }

            allAgents.push(...result.items);
            cursor = result.nextCursor;

            // Stop if we've reached the max pages
            if (currentPage >= maxPages) {
                break;
            }

        } while (cursor);

        console.log(`\n✅ Found ${allAgents.length} agent(s) across ${currentPage} page(s)\n`);
        console.log('═'.repeat(80));

        allAgents.forEach((agent, index) => {
            console.log(`\n📦 Agent ${index + 1}/${allAgents.length}`);
            console.log('─'.repeat(80));
            console.log(`  Agent ID:     ${agent.agentId}`);
            console.log(`  Name:         ${agent.name}`);
            console.log(`  Description:  ${agent.description || 'N/A'}`);
            console.log(`  Active:       ${agent.active ? '✓' : '✗'}`);
            console.log(`  x402 Support: ${agent.x402support ? '✓' : '✗'}`);

            if (agent.image) {
                console.log(`  Image:        ${agent.image}`);
            }

            if (agent.owners && agent.owners.length > 0) {
                console.log(`  Owners:       ${agent.owners.join(', ')}`);
            }

            if (agent.operators && agent.operators.length > 0) {
                console.log(`  Operators:    ${agent.operators.join(', ')}`);
            }

            // MCP Tools
            if (agent.mcpTools && agent.mcpTools.length > 0) {
                console.log(`  MCP Tools:    ${agent.mcpTools.join(', ')}`);
            } else {
                console.log(`  MCP Tools:    None`);
            }

            // A2A Skills
            if (agent.a2aSkills && agent.a2aSkills.length > 0) {
                console.log(`  A2A Skills:   ${agent.a2aSkills.join(', ')}`);
            } else {
                console.log(`  A2A Skills:   None`);
            }

            // Endpoints
            if (agent.mcp) console.log(`  Has MCP:      ✓`);
            if (agent.a2a) console.log(`  Has A2A:      ✓`);

            if (agent.walletAddress) {
                console.log(`  Wallet:       ${agent.walletAddress}`);
            }

            if (agent.ens) {
                console.log(`  ENS:          ${agent.ens}`);
            }

            if (agent.did) {
                console.log(`  DID:          ${agent.did}`);
            }
        });

        console.log('\n' + '═'.repeat(80));

        if (cursor && currentPage >= maxPages) {
            console.log(`\n⚠️  More agents available!`);
            if (maxPages === 1) {
                console.log('   Use --all to fetch all agents, or --pages N to fetch N pages.\n');
            } else {
                console.log('   Use --all to fetch all remaining agents.\n');
            }
        } else if (!cursor) {
            console.log('\n✅ All agents retrieved!\n');
        }

        console.log('\n✅ Done!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the script
listAllAgents();
