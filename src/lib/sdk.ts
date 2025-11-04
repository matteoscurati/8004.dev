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

    let count = 0;
    let cursor: string | undefined = undefined;
    const pageSize = 100; // Larger pages for faster counting

    // Fetch all pages to count total
    while (true) {
        const result = await sdk.searchAgents(filters, undefined, pageSize, cursor);
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

    // Pass all filters directly to SDK (including name filter)
    const result = await sdk.searchAgents(filters, undefined, pageSize, cursor);

    // Map SDK response to our AgentResult interface
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
