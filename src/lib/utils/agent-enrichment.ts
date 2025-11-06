/**
 * Agent Enrichment - Fetches full agent details from SDK
 *
 * When events arrive with minimal agent info, this utility
 * fetches complete agent data from the Agent0 SDK and caches it.
 */

import { searchAgents, type AgentResult } from '$lib/sdk';

interface EnrichedAgentData {
	id: string;
	name: string;
	owner: string;
	operator: string;
	active: boolean;
	x402support: boolean;
	mcpTools: string[];
	a2aSkills: string[];
	fetchedAt: number;
}

// In-memory cache with TTL
const agentCache = new Map<string, EnrichedAgentData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<EnrichedAgentData | null>>();

/**
 * Get enriched agent data from cache or fetch from SDK
 */
export async function getEnrichedAgentData(agentId: string): Promise<EnrichedAgentData | null> {
	// Check cache first
	const cached = agentCache.get(agentId);
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
		return cached;
	}

	// Check if already fetching
	const pending = pendingRequests.get(agentId);
	if (pending) {
		return pending;
	}

	// Fetch from SDK
	const fetchPromise = fetchAgentData(agentId);
	pendingRequests.set(agentId, fetchPromise);

	try {
		const data = await fetchPromise;
		pendingRequests.delete(agentId);
		return data;
	} catch (error) {
		pendingRequests.delete(agentId);
		throw error;
	}
}

/**
 * Fetch agent data from SDK and cache it
 */
async function fetchAgentData(agentId: string): Promise<EnrichedAgentData | null> {
	try {
		console.log(`🔍 Fetching agent data for: ${agentId}`);

		// Search for agent by ID (SDK doesn't have getById)
		const result = await searchAgents({ agentIds: [agentId] }, 1);

		if (!result.items || result.items.length === 0) {
			console.warn(`⚠️  Agent not found: ${agentId}`);
			return null;
		}

		const agent = result.items[0];

		const enrichedData: EnrichedAgentData = {
			id: agent.id,
			name: agent.name || formatAgentId(agentId),
			owner: agent.owner,
			operator: agent.operator,
			active: agent.active,
			x402support: agent.x402support,
			mcpTools: agent.mcpTools || [],
			a2aSkills: agent.a2aSkills || [],
			fetchedAt: Date.now()
		};

		// Cache the data
		agentCache.set(agentId, enrichedData);
		console.log(`✅ Cached agent data: ${enrichedData.name}`);

		return enrichedData;
	} catch (error) {
		console.error(`❌ Failed to fetch agent data for ${agentId}:`, error);
		return null;
	}
}

/**
 * Format agent ID for display (shortened address)
 */
function formatAgentId(agentId: string): string {
	if (agentId.length > 20) {
		return `${agentId.substring(0, 6)}...${agentId.substring(agentId.length - 4)}`;
	}
	return agentId;
}

/**
 * Get agent name from cache (synchronous)
 * Returns formatted ID if not in cache
 */
export function getAgentNameSync(agentId: string): string {
	const cached = agentCache.get(agentId);
	if (cached) {
		return cached.name;
	}
	return formatAgentId(agentId);
}

/**
 * Preload multiple agent IDs (batch enrichment)
 */
export async function preloadAgents(agentIds: string[]): Promise<void> {
	const uncached = agentIds.filter(id => {
		const cached = agentCache.get(id);
		return !cached || Date.now() - cached.fetchedAt >= CACHE_TTL;
	});

	if (uncached.length === 0) return;

	console.log(`🔄 Preloading ${uncached.length} agents...`);

	// Fetch in parallel (max 5 at a time to avoid overwhelming)
	const chunks = [];
	for (let i = 0; i < uncached.length; i += 5) {
		chunks.push(uncached.slice(i, i + 5));
	}

	for (const chunk of chunks) {
		await Promise.allSettled(
			chunk.map(id => getEnrichedAgentData(id))
		);
	}

	console.log(`✅ Preload complete`);
}

/**
 * Clear cache (useful for testing or memory management)
 */
export function clearAgentCache(): void {
	agentCache.clear();
	pendingRequests.clear();
	console.log('🗑️  Agent cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; pending: number } {
	return {
		size: agentCache.size,
		pending: pendingRequests.size
	};
}
