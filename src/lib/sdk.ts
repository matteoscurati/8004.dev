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
import { LRUCache } from '$lib/utils/cache';

let sdkInstance: SDK | null = null;

// Cache for search results (max 50 entries, 5 minute TTL)
// IMPORTANT: When returning cached data, always create NEW object references
// for Svelte 5 reactivity to detect changes
const searchCache = new LRUCache<SearchResult>(50, 5);

// Helper to safely clone arrays (handles null, undefined, and empty arrays)
function cloneArray<T>(arr: T[] | null | undefined): T[] | undefined {
    if (!arr || !Array.isArray(arr)) return undefined;
    return [...arr];
}

// Helper to safely clone objects (handles null and undefined)
function cloneObject<T extends Record<string, any>>(obj: T | null | undefined): T | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    return { ...obj };
}

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

    // Generate cache key for initial page requests only (not for pagination)
    // Pagination with cursor should always fetch fresh data
    const cacheKey = !cursor ? LRUCache.hashKey({ filters, pageSize }) : null;

    // Check cache for initial requests (Svelte 5 compatible)
    if (cacheKey) {
        const cached = searchCache.get(cacheKey);
        if (cached !== null) {
            // CRITICAL: Return NEW object references for Svelte 5 reactivity
            // Svelte 5 uses Proxy objects and detects changes via reference equality
            // Deep clone all nested arrays and objects to ensure reactivity works
            return {
                items: cached.items.map(item => ({
                    ...item,
                    mcpTools: cloneArray(item.mcpTools),
                    a2aSkills: cloneArray(item.a2aSkills),
                    mcpPrompts: cloneArray(item.mcpPrompts),
                    mcpResources: cloneArray(item.mcpResources),
                    supportedTrusts: cloneArray(item.supportedTrusts),
                    owners: cloneArray(item.owners),
                    operators: cloneArray(item.operators),
                    extras: cloneObject(item.extras)
                })),
                nextCursor: cached.nextCursor,
                totalMatches: cached.totalMatches
            };
        }
    }

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
        const result = {
            items: allItems,
            nextCursor: undefined,
            totalMatches: allItems.length
        };

        // Cache the result for subsequent searches
        if (cacheKey) {
            searchCache.set(cacheKey, result);
        }

        return result;
    }

    // Normal flow without client-side filters - standard pagination
    const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);
    const items = result.items.map(mapAgent);

    const searchResult = {
        items,
        nextCursor: result.nextCursor
    };

    // Cache the result for initial page requests (not pagination)
    if (cacheKey) {
        searchCache.set(cacheKey, searchResult);
    }

    return searchResult;
}

export async function getAgentReputation(agentId: string): Promise<ReputationSummary> {
    const sdk = getSDK();
    return await sdk.getReputationSummary(agentId);
}
