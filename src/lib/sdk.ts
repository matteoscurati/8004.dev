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
    totalMatches?: number;
}

// Count total agents matching filters (lightweight, returns only count)
export async function countAgents(filters: SearchFilters): Promise<number> {
    const sdk = getSDK();

    // IMPORTANT: Array filters and name filter must be handled client-side:
    // - Subgraph doesn't support name filtering at query level
    // - SDK uses exact matching for arrays (e.g., "crypto" won't match "crypto-economic")
    // - SDK applies filters client-side but only on pageSize results
    const nameFilter = filters.name?.toLowerCase();
    const mcpToolsFilter = filters.mcpTools?.map(t => t.toLowerCase());
    const a2aSkillsFilter = filters.a2aSkills?.map(s => s.toLowerCase());
    const supportedTrustFilter = filters.supportedTrust?.map(t => t.toLowerCase());

    const sdkFilters = { ...filters };
    delete sdkFilters.name;
    delete sdkFilters.mcpTools;
    delete sdkFilters.a2aSkills;
    delete sdkFilters.supportedTrust;

    // Helper function to check if agent matches client-side filters
    const matchesFilters = (agent: any): boolean => {
        if (nameFilter && !agent.name?.toLowerCase().includes(nameFilter)) {
            return false;
        }

        if (mcpToolsFilter && mcpToolsFilter.length > 0) {
            const hasAllTools = mcpToolsFilter.every(searchTool =>
                agent.mcpTools?.some((agentTool: string) =>
                    agentTool.toLowerCase().includes(searchTool)
                )
            );
            if (!hasAllTools) return false;
        }

        if (a2aSkillsFilter && a2aSkillsFilter.length > 0) {
            const hasAllSkills = a2aSkillsFilter.every(searchSkill =>
                agent.a2aSkills?.some((agentSkill: string) =>
                    agentSkill.toLowerCase().includes(searchSkill)
                )
            );
            if (!hasAllSkills) return false;
        }

        if (supportedTrustFilter && supportedTrustFilter.length > 0) {
            const hasAllTrusts = supportedTrustFilter.every(searchTrust =>
                agent.supportedTrusts?.some((agentTrust: string) =>
                    agentTrust.toLowerCase().includes(searchTrust)
                )
            );
            if (!hasAllTrusts) return false;
        }

        return true;
    };

    let count = 0;
    let cursor: string | undefined = undefined;
    const pageSize = 100; // Larger pages for faster counting

    // Fetch all pages to count total
    while (true) {
        const result = await sdk.searchAgents(sdkFilters, undefined, pageSize, cursor);

        // Apply client-side filters with partial matching
        const filteredItems = result.items.filter(matchesFilters);
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
    const nameFilter = filters.name?.toLowerCase();
    const mcpToolsFilter = filters.mcpTools?.map(t => t.toLowerCase());
    const a2aSkillsFilter = filters.a2aSkills?.map(s => s.toLowerCase());
    const supportedTrustFilter = filters.supportedTrust?.map(t => t.toLowerCase());

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

    // Helper function to apply client-side filters with partial matching
    const matchesFilters = (agent: AgentResult): boolean => {
        // Name filter (case-insensitive substring match)
        if (nameFilter && !agent.name?.toLowerCase().includes(nameFilter)) {
            return false;
        }

        // MCP Tools filter (partial match - e.g., "git" matches "github")
        if (mcpToolsFilter && mcpToolsFilter.length > 0) {
            const hasAllTools = mcpToolsFilter.every(searchTool =>
                agent.mcpTools?.some(agentTool =>
                    agentTool.toLowerCase().includes(searchTool)
                )
            );
            if (!hasAllTools) return false;
        }

        // A2A Skills filter (partial match)
        if (a2aSkillsFilter && a2aSkillsFilter.length > 0) {
            const hasAllSkills = a2aSkillsFilter.every(searchSkill =>
                agent.a2aSkills?.some(agentSkill =>
                    agentSkill.toLowerCase().includes(searchSkill)
                )
            );
            if (!hasAllSkills) return false;
        }

        // Supported Trust filter (partial match - e.g., "crypto" matches "crypto-economic")
        if (supportedTrustFilter && supportedTrustFilter.length > 0) {
            const hasAllTrusts = supportedTrustFilter.every(searchTrust =>
                agent.supportedTrusts?.some(agentTrust =>
                    agentTrust.toLowerCase().includes(searchTrust)
                )
            );
            if (!hasAllTrusts) return false;
        }

        return true;
    };

    // Determine if we need to fetch multiple pages for client-side filtering
    const needsMultiPageFetch = !cursor && (
        nameFilter ||
        (mcpToolsFilter && mcpToolsFilter.length > 0) ||
        (a2aSkillsFilter && a2aSkillsFilter.length > 0) ||
        (supportedTrustFilter && supportedTrustFilter.length > 0)
    );

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
            const filtered = mappedItems.filter(matchesFilters);

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
