import { SDK } from 'agent0-sdk';

const chainIds = [11155111, 84532, 80002]; // Sepolia, Base Sepolia, Polygon Amoy

async function checkOASFData() {
    console.log('🔍 Checking for OASF data in agents...\n');

    for (const chainId of chainIds) {
        console.log(`\n📡 Chain ${chainId}:`);
        const sdk = new SDK({ chainId });

        try {
            // Fetch first 50 agents to check for OASF data
            const result = await sdk.searchAgents({}, undefined, 50);

            console.log(`   Found ${result.items.length} agents`);

            // Check each agent for OASF endpoints
            let oasfCount = 0;
            const oasfAgents = [];

            for (const agent of result.items) {
                // Check if agent has OASF endpoint
                const oasfEndpoint = agent.endpoints?.find(
                    (ep) => ep.type === 'OASF' || ep.type === 'oasf'
                );

                if (oasfEndpoint) {
                    oasfCount++;
                    oasfAgents.push({
                        name: agent.name,
                        agentId: agent.agentId,
                        endpoint: oasfEndpoint
                    });
                }
            }

            console.log(`   Agents with OASF endpoint: ${oasfCount}`);

            if (oasfAgents.length > 0) {
                console.log('\n   📋 OASF Agents:');
                for (const agent of oasfAgents.slice(0, 3)) {
                    console.log(`   - ${agent.name}`);
                    console.log(`     Agent ID: ${agent.agentId}`);
                    console.log(
                        `     Endpoint: ${JSON.stringify(agent.endpoint, null, 2)
                            .split('\n')
                            .join('\n     ')}`
                    );
                }

                if (oasfAgents.length > 3) {
                    console.log(`   ... and ${oasfAgents.length - 3} more`);
                }
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
}

checkOASFData();
