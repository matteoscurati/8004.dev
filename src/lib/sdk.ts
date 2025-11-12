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
import { CHAIN_IDS } from '$lib/constants/chains';
import { agentsCache, hashFilters, cacheLoading } from '$lib/stores/agents-cache';

// Keep multiple SDK instances (one per chain)
const sdkInstances: Map<number, SDK> = new Map();

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

/**
 * Get SDK instance for a specific chain
 * Creates and caches SDK instances per chain
 */
export function getSDKForChain(chainId: number): SDK {
    if (!browser) {
        throw new Error('SDK can only be initialized in the browser');
    }

    // Return cached instance if available
    if (sdkInstances.has(chainId)) {
        return sdkInstances.get(chainId)!;
    }

    // Create new SDK instance for this chain
    const config: any = {
        chainId: chainId,
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

    const sdk = new SDK(config);
    sdkInstances.set(chainId, sdk);
    return sdk;
}

/**
 * Get SDK instance for the default chain (backward compatibility)
 */
export function getSDK(): SDK {
    return getSDKForChain(parseInt(PUBLIC_CHAIN_ID));
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
    // Blockchain filters (NEW in SDK v0.2.2)
    owners?: string[];          // Filter by owner wallet address(es)
    operators?: string[];       // Filter by operator wallet address(es)
    // Multi-chain filters (NEW in SDK v0.3.0)
    chains?: number[] | 'all';  // Filter by specific chains or search all
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
    cacheLoading.set(true);

    try {
        // Determine which chains to query
        const chainsToQuery = filters.chains === 'all'
            ? CHAIN_IDS
            : (Array.isArray(filters.chains) ? filters.chains : [parseInt(PUBLIC_CHAIN_ID)]);

        // If no chains selected, return 0
        if (chainsToQuery.length === 0) {
            return 0;
        }

        // IMPORTANT: Array filters and name filter must be handled client-side
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
        delete sdkFilters.chains;

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

        // Multi-chain: count from all chains in parallel and cache all agents
        if (chainsToQuery.length > 1) {
            const chainResults = await Promise.allSettled(
                chainsToQuery.map(async (chainId) => {
                    const sdk = getSDKForChain(chainId);
                    let allAgents: AgentResult[] = [];
                    let cursor: string | undefined = undefined;
                    const pageSize = 100;

                    while (true) {
                        const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);
                        const filteredItems = result.items
                            .map(mapAgent)
                            .filter((agent) => matchesAllFilters(agent, clientFilters));
                        allAgents.push(...filteredItems);

                        if (!result.nextCursor) break;
                        cursor = result.nextCursor;
                    }

                    return allAgents;
                })
            );

            // Aggregate all agents from all chains
            let allAgents: AgentResult[] = [];
            chainResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    allAgents.push(...result.value);
                }
            });

            // Cache all agents for StatsOverview to reuse
            const filterHash = hashFilters(filters);
            agentsCache.setAgents(allAgents, filterHash);

            return allAgents.length;
        }

        // Single chain: accumulate agents and cache
        const sdk = getSDKForChain(chainsToQuery[0]);
        let allAgents: AgentResult[] = [];
        let cursor: string | undefined = undefined;
        const pageSize = 100;

        while (true) {
            const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);
            const filteredItems = result.items
                .map(mapAgent)
                .filter((agent) => matchesAllFilters(agent, clientFilters));
            allAgents.push(...filteredItems);

            if (!result.nextCursor) break;
            cursor = result.nextCursor;
        }

        // Cache all agents for StatsOverview to reuse
        const filterHash = hashFilters(filters);
        agentsCache.setAgents(allAgents, filterHash);

        return allAgents.length;
    } finally {
        cacheLoading.set(false);
    }
}

// Multi-chain cursor format: stores cursor state for each chain
interface MultiChainCursor {
    [chainId: string]: string | null; // null means chain exhausted
}

// Encode multi-chain cursor to base64 string (browser-compatible)
function encodeMultiChainCursor(cursors: MultiChainCursor): string {
    try {
        return btoa(JSON.stringify(cursors));
    } catch (e) {
        console.error('Failed to encode cursor:', e);
        return '';
    }
}

// Decode multi-chain cursor from base64 string (browser-compatible)
function decodeMultiChainCursor(encoded: string): MultiChainCursor {
    try {
        return JSON.parse(atob(encoded));
    } catch {
        return {};
    }
}

/**
 * Multi-chain search: Query multiple chains in parallel and aggregate results with TRUE pagination
 * Fetches pageSize items total, distributed across chains, and maintains cursor state per chain
 */
async function searchAgentsMultiChain(
    filters: SearchFilters,
    pageSize: number,
    chainsToQuery: number[],
    cursor?: string
): Promise<SearchResult> {
    // Parse multi-chain cursor (if provided)
    const chainCursors: MultiChainCursor = cursor ? decodeMultiChainCursor(cursor) : {};

    // Extract client-side filters
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
    delete sdkFilters.chains;

    // Helper to map SDK agent format
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

    // Calculate items to fetch per chain
    // When client-side filters are present (name, mcpTools, etc.), fetch MORE items from each chain
    // because many results will be filtered out.
    // For name filters specifically, fetch ALL items since SDK doesn't support server-side name filtering
    const hasClientFilters = hasClientSideFilters(clientFilters);
    const hasNameFilter = clientFilters.name !== undefined;

    let itemsPerChain: number;
    if (hasNameFilter) {
        // Name search: fetch ALL items from each chain (SDK doesn't support server-side name filtering)
        // Agent names can be at any position, so we must fetch everything
        itemsPerChain = 9999; // Large number to fetch all items
    } else if (hasClientFilters) {
        // Other filters: fetch 2x pageSize from each chain
        itemsPerChain = Math.min(pageSize * 2, 200);
    } else {
        // No filters: distribute pageSize across chains
        itemsPerChain = Math.ceil(pageSize / chainsToQuery.length);
    }

    // Fetch from each chain in parallel
    const chainResults = await Promise.allSettled(
        chainsToQuery.map(async (chainId) => {
            const chainIdStr = chainId.toString();

            // Skip if this chain is exhausted (cursor is explicitly null)
            if (chainCursors[chainIdStr] === null) {
                return { items: [], nextCursor: null };
            }

            const sdk = getSDKForChain(chainId);
            let currentCursor = chainCursors[chainIdStr];

            // For name searches, fetch ALL pages from this chain
            if (hasNameFilter) {
                let allFilteredItems: AgentResult[] = [];
                const fetchPageSize = 100;

                while (true) {
                    const result = await sdk.searchAgents(
                        sdkFilters,
                        undefined,
                        fetchPageSize,
                        currentCursor
                    );

                    const mappedItems = result.items.map(mapAgent);
                    const filtered = mappedItems.filter((agent) =>
                        matchesAllFilters(agent, clientFilters)
                    );

                    allFilteredItems.push(...filtered);

                    if (!result.nextCursor) break;
                    currentCursor = result.nextCursor;
                }

                // Return only pageSize items for display, but mark as having more if we got more
                return {
                    items: allFilteredItems.slice(0, pageSize),
                    nextCursor: allFilteredItems.length > pageSize ? 'has-more' : null
                };
            }

            // Normal search (not name): fetch one page
            const result = await sdk.searchAgents(
                sdkFilters,
                undefined,
                itemsPerChain,
                currentCursor
            );

            const mappedItems = result.items.map(mapAgent);

            // Apply client-side filters
            const filtered = mappedItems.filter((agent) =>
                matchesAllFilters(agent, clientFilters)
            );

            return {
                items: filtered,
                nextCursor: result.nextCursor || null // null means no more pages
            };
        })
    );

    // Aggregate results and update cursors
    let allAgents: AgentResult[] = [];
    const newChainCursors: MultiChainCursor = {};
    let hasMorePages = false;

    chainResults.forEach((result, index) => {
        const chainId = chainsToQuery[index].toString();

        if (result.status === 'fulfilled') {
            allAgents.push(...result.value.items);
            newChainCursors[chainId] = result.value.nextCursor;

            // Check if any chain has more pages
            if (result.value.nextCursor !== null) {
                hasMorePages = true;
            }
        }
    });

    // Sort by name for consistent ordering
    allAgents.sort((a, b) => a.name.localeCompare(b.name));

    // Return only pageSize items
    const items = allAgents.slice(0, pageSize);

    // Generate next cursor if any chain has more pages
    const nextCursor = hasMorePages ? encodeMultiChainCursor(newChainCursors) : undefined;

    return {
        items,
        nextCursor,
        totalMatches: undefined // Will be fetched separately with countAgents
    };
}

export async function searchAgents(
    filters: SearchFilters,
    pageSize: number = 50,
    cursor?: string
): Promise<SearchResult> {
    // Determine which chains to query
    const chainsToQuery = filters.chains === 'all'
        ? CHAIN_IDS
        : (Array.isArray(filters.chains) ? filters.chains : [parseInt(PUBLIC_CHAIN_ID)]);

    // If no chains selected, return empty result
    if (chainsToQuery.length === 0) {
        return {
            items: [],
            nextCursor: undefined,
            totalMatches: 0
        };
    }

    // Multi-chain search: query all chains and aggregate results
    if (chainsToQuery.length > 1 || (chainsToQuery.length === 1 && filters.chains === 'all')) {
        return searchAgentsMultiChain(filters, pageSize, chainsToQuery, cursor);
    }

    // Single chain search (original logic)
    const chainId = chainsToQuery[0];
    const sdk = getSDKForChain(chainId);

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
