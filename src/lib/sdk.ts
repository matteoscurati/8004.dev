import { SDK } from 'agent0-sdk';
import { browser } from '$app/environment';
import {
    PUBLIC_RPC_URL,
    PUBLIC_CHAIN_ID,
    PUBLIC_IPFS_PROVIDER,
    PUBLIC_IPFS_NODE_URL,
    PUBLIC_PINATA_JWT
} from '$env/static/public';
import { matchesAllFilters, hasClientSideFilters } from '$lib/utils/filters';

let sdkInstance: SDK | null = null;

export function getSDK(): SDK {
    if (!browser) {
        throw new Error('SDK can only be initialized in the browser');
    }

    if (!sdkInstance) {
        const config: any = {
            chainId: parseInt(PUBLIC_CHAIN_ID),
            rpcUrl: PUBLIC_RPC_URL,
            ipfs: PUBLIC_IPFS_PROVIDER as 'node' | 'filecoinPin' | 'pinata'
        };

        // Add optional IPFS configuration based on provider
        if (PUBLIC_IPFS_PROVIDER === 'pinata' && PUBLIC_PINATA_JWT?.trim()) {
            config.pinataJwt = PUBLIC_PINATA_JWT;
        }
        if (PUBLIC_IPFS_PROVIDER === 'node' && PUBLIC_IPFS_NODE_URL?.trim()) {
            config.ipfsNodeUrl = PUBLIC_IPFS_NODE_URL;
        }

        sdkInstance = new SDK(config);
    }

    return sdkInstance;
}

export interface SearchFilters {
    name?: string;
    // Protocol filters
    mcp?: boolean;              // Filter for MCP-enabled agents
    a2a?: boolean;              // Filter for A2A-enabled agents
    mcpTools?: string[];
    a2aSkills?: string[];
    // Status filters
    active?: boolean;
    x402support?: boolean;
    // Trust filters
    supportedTrust?: string[];  // e.g., ["reputation"]
}

export interface AgentResult {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    // Capabilities
    mcp?: boolean;              // MCP protocol enabled
    a2a?: boolean;              // A2A protocol enabled
    mcpTools?: string[];
    a2aSkills?: string[];
    mcpPrompts?: string[];
    mcpResources?: string[];
    // Status
    active?: boolean;
    x402support?: boolean;
    // Trust & Governance
    supportedTrusts?: string[];  // e.g., ["reputation", "crypto-economic"]
    owners?: string[];
    operators?: string[];
    // Blockchain
    chainId?: number;
    walletAddress?: string;
    // Metadata
    extras?: Record<string, any>;
}

export interface ReputationSummary {
    count: number;
    averageScore: number;
}

export interface SearchResult {
    items: AgentResult[];
    nextCursor?: string;
    totalMatches?: number;
}

// Count total agents matching filters (lightweight, returns only count)
export async function countAgents(filters: SearchFilters): Promise<number> {
    const sdk = getSDK();

    // IMPORTANT: Array filters and name filter must be handled client-side:
    // - Subgraph doesn't support name filtering at query level
    // - SDK uses exact matching for arrays (e.g., "crypto" won't match "crypto-economic")
    // - SDK applies filters client-side but only on pageSize results
    const clientFilters = {
        name: filters.name,
        mcpTools: filters.mcpTools,
        a2aSkills: filters.a2aSkills,
        supportedTrust: filters.supportedTrust
    };

    const sdkFilters = { ...filters };
    delete sdkFilters.name;
    delete sdkFilters.mcpTools;
    delete sdkFilters.a2aSkills;
    delete sdkFilters.supportedTrust;

    // Helper to map SDK agent format to our AgentResult
    const mapAgent = (agent: any): AgentResult => ({
        id: agent.agentId,
        name: agent.name,
        description: agent.description,
        imageUrl: agent.image,
        mcp: agent.mcp,
        a2a: agent.a2a,
        mcpTools: agent.mcpTools,
        a2aSkills: agent.a2aSkills,
        mcpPrompts: agent.mcpPrompts,
        mcpResources: agent.mcpResources,
        active: agent.active,
        x402support: agent.x402support,
        supportedTrusts: agent.supportedTrusts,
        owners: agent.owners,
        operators: agent.operators,
        chainId: agent.chainId,
        walletAddress: agent.walletAddress,
        extras: agent.extras
    });

    let count = 0;
    let cursor: string | undefined = undefined;
    const pageSize = 100; // Larger pages for faster counting

    // Fetch all pages to count total
    while (true) {
        const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);

        // Apply client-side filters with partial matching
        const filteredItems = result.items
            .map(mapAgent)
            .filter((agent) => matchesAllFilters(agent, clientFilters));
        count += filteredItems.length;

        if (!result.nextCursor) break;
        cursor = result.nextCursor;
    }

    return count;
}

export async function searchAgents(
    filters: SearchFilters,
    pageSize: number = 50,
    cursor?: string
): Promise<SearchResult> {
    const sdk = getSDK();

    // IMPORTANT: Array filters (mcpTools, a2aSkills, supportedTrust) and name filter require special handling:
    // - The subgraph doesn't support name filtering at GraphQL query level
    // - SDK applies exact matching for array filters (e.g., "crypto" won't match "crypto-economic")
    // - SDK applies filters client-side but only on pageSize results
    // Solution: Extract these filters, fetch multiple pages, apply partial matching client-side
    const clientFilters = {
        name: filters.name,
        mcpTools: filters.mcpTools,
        a2aSkills: filters.a2aSkills,
        supportedTrust: filters.supportedTrust
    };

    const sdkFilters = { ...filters };
    delete sdkFilters.name;
    delete sdkFilters.mcpTools;
    delete sdkFilters.a2aSkills;
    delete sdkFilters.supportedTrust;

    // Helper function to map SDK agent to our AgentResult interface
    const mapAgent = (agent: any): AgentResult => ({
        id: agent.agentId,
        name: agent.name,
        description: agent.description,
        imageUrl: agent.image,
        mcp: agent.mcp,
        a2a: agent.a2a,
        mcpTools: agent.mcpTools,
        a2aSkills: agent.a2aSkills,
        mcpPrompts: agent.mcpPrompts,
        mcpResources: agent.mcpResources,
        active: agent.active,
        x402support: agent.x402support,
        supportedTrusts: agent.supportedTrusts,
        owners: agent.owners,
        operators: agent.operators,
        chainId: agent.chainId,
        walletAddress: agent.walletAddress,
        extras: agent.extras
    });

    // Determine if we need to fetch multiple pages for client-side filtering
    const needsMultiPageFetch = !cursor && hasClientSideFilters(clientFilters);

    // If we have filters requiring client-side partial matching, fetch multiple pages
    if (needsMultiPageFetch) {
        let allItems: AgentResult[] = [];
        let nextCursor: string | undefined = undefined;
        let pagesFetched = 0;
        const maxPages = 10; // Fetch up to 10 pages (500 agents)

        while (pagesFetched < maxPages) {
            const result = await sdk.searchAgents(sdkFilters, undefined, 50, nextCursor);
            const mappedItems = result.items.map(mapAgent);

            // Apply all client-side filters with partial matching
            const filtered = mappedItems.filter((agent) =>
                matchesAllFilters(agent, clientFilters)
            );

            allItems.push(...filtered);
            nextCursor = result.nextCursor;
            pagesFetched++;

            if (!nextCursor) break;
        }

        // Return all results without pagination
        return {
            items: allItems,
            nextCursor: undefined,
            totalMatches: allItems.length
        };
    }

    // Normal flow without client-side filters - standard pagination
    const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);
    const items = result.items.map(mapAgent);

    return {
        items,
        nextCursor: result.nextCursor
    };
}

export async function getAgentReputation(agentId: string): Promise<ReputationSummary> {
    const sdk = getSDK();
    return await sdk.getReputationSummary(agentId);
}
