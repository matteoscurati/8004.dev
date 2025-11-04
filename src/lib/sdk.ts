import { SDK } from 'agent0-sdk';
import { browser } from '$app/environment';
import {
    PUBLIC_RPC_URL,
    PUBLIC_CHAIN_ID,
    PUBLIC_IPFS_PROVIDER,
    PUBLIC_IPFS_NODE_URL,
    PUBLIC_PINATA_JWT
} from '$env/static/public';

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
    totalMatches?: number; // Total number of matches (for client-side filtering)
}

// Count total agents matching filters (lightweight, returns only count)
export async function countAgents(filters: SearchFilters): Promise<number> {
    const sdk = getSDK();

    // Remove name filter as it requires client-side filtering
    const sdkFilters = { ...filters };
    delete sdkFilters.name;

    let count = 0;
    let cursor: string | undefined = undefined;
    const pageSize = 100; // Larger pages for faster counting

    // Fetch all pages to count total
    while (true) {
        const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);
        count += result.items.length;

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

    // Extract name filter for client-side filtering
    const nameFilter = filters.name?.toLowerCase();
    const sdkFilters = { ...filters };
    delete sdkFilters.name; // Remove name from SDK filters as it doesn't work well

    // If searching by name and no cursor, fetch multiple pages to ensure good results
    if (nameFilter && !cursor) {
        let allItems: any[] = [];
        let nextCursor: string | undefined = undefined;
        let pagesFetched = 0;
        const maxPages = 10; // Fetch up to 10 pages (500 agents) for name search

        // Keep fetching until we have enough matches or run out of pages
        while (pagesFetched < maxPages) {
            const result = await sdk.searchAgents(sdkFilters, undefined, 50, nextCursor);

            const mappedItems = result.items.map((agent: any) => ({
                id: agent.agentId,
                name: agent.name,
                description: agent.description,
                imageUrl: agent.image,
                // Capabilities
                mcp: agent.mcp,
                a2a: agent.a2a,
                mcpTools: agent.mcpTools,
                a2aSkills: agent.a2aSkills,
                mcpPrompts: agent.mcpPrompts,
                mcpResources: agent.mcpResources,
                // Status
                active: agent.active,
                x402support: agent.x402support,
                // Trust & Governance
                supportedTrusts: agent.supportedTrusts,
                owners: agent.owners,
                operators: agent.operators,
                // Blockchain
                chainId: agent.chainId,
                walletAddress: agent.walletAddress,
                // Metadata
                extras: agent.extras
            }));

            allItems.push(...mappedItems);
            nextCursor = result.nextCursor;
            pagesFetched++;

            // Stop if no more pages or we have enough matches
            if (!nextCursor) break;
        }

        // Filter by name (case-insensitive substring match)
        const filteredItems = allItems.filter(agent =>
            agent.name?.toLowerCase().includes(nameFilter)
        );

        // For name search, return all results (no pagination)
        // This is simpler and provides better UX for text search
        return {
            items: filteredItems,
            nextCursor: undefined, // No pagination for name search
            totalMatches: filteredItems.length
        };
    }

    // Normal flow without name filtering
    const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);

    const items = result.items.map((agent: any) => ({
        id: agent.agentId,
        name: agent.name,
        description: agent.description,
        imageUrl: agent.image,
        // Capabilities
        mcp: agent.mcp,
        a2a: agent.a2a,
        mcpTools: agent.mcpTools,
        a2aSkills: agent.a2aSkills,
        mcpPrompts: agent.mcpPrompts,
        mcpResources: agent.mcpResources,
        // Status
        active: agent.active,
        x402support: agent.x402support,
        // Trust & Governance
        supportedTrusts: agent.supportedTrusts,
        owners: agent.owners,
        operators: agent.operators,
        // Blockchain
        chainId: agent.chainId,
        walletAddress: agent.walletAddress,
        // Metadata
        extras: agent.extras
    }));

    return {
        items,
        nextCursor: result.nextCursor
    };
}

export async function getAgentReputation(agentId: string): Promise<ReputationSummary> {
    const sdk = getSDK();
    return await sdk.getReputationSummary(agentId);
}
