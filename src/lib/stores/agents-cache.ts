import { writable, get } from 'svelte/store';
import type { AgentResult } from '$lib/sdk';

/**
 * Shared cache for all agents loaded from countAgents()
 * This allows StatsOverview to reuse data instead of fetching again
 */
interface AgentsCache {
	agents: AgentResult[];
	timestamp: number;
	filters: string; // Hash of filters used for this cache
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function createAgentsCacheStore() {
	const { subscribe, set, update } = writable<AgentsCache | null>(null);

	return {
		subscribe,

		/**
		 * Store all agents with timestamp
		 */
		setAgents: (agents: AgentResult[], filterHash: string) => {
			set({
				agents,
				timestamp: Date.now(),
				filters: filterHash
			});
		},

		/**
		 * Get cached agents if still valid (within CACHE_DURATION)
		 */
		getAgents: (filterHash: string): AgentResult[] | null => {
			const cache = get({ subscribe });

			if (!cache) {
				return null;
			}

			// Check if cache is still valid
			const age = Date.now() - cache.timestamp;
			if (age > CACHE_DURATION) {
				return null;
			}

			// Check if filters match
			if (cache.filters !== filterHash) {
				return null;
			}

			return cache.agents;
		},

		/**
		 * Clear the cache
		 */
		clear: () => {
			set(null);
		}
	};
}

export const agentsCache = createAgentsCacheStore();

/**
 * Store to track when cache is being populated
 */
export const cacheLoading = writable<boolean>(false);

/**
 * Generate a simple hash from filters for cache key
 */
export function hashFilters(filters: any): string {
	return JSON.stringify(filters);
}
