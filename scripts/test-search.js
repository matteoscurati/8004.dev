#!/usr/bin/env node

/**
 * Test search functionality
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

async function testSearch() {
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

        const searchTerms = [
            'Agente Ciro',    // Exact match with correct case
            'agente ciro',    // Exact match lowercase
            'ciro',           // Partial match
            'Ciro',           // Partial match with capital
            'Agente',         // Partial match
            'agente-ciro',    // With dash
            'deep42',         // Another agent
            'sdk-erc'         // Common prefix
        ];

        for (const term of searchTerms) {
            console.log(`\n🔍 Searching for: "${term}"`);
            console.log('─'.repeat(60));

            const result = await sdk.searchAgents({ name: term });

            if (result.items.length === 0) {
                console.log('   ❌ No results found');
            } else {
                console.log(`   ✅ Found ${result.items.length} result(s):`);
                result.items.forEach((agent, idx) => {
                    console.log(`      ${idx + 1}. ${agent.name} (ID: ${agent.agentId})`);
                });
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

testSearch();
