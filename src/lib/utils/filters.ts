/**
 * Pure filter functions for agent search
 *
 * These functions implement partial matching logic for array filters
 * and name filtering. Extracted for testability and reusability.
 */

import type { AgentResult } from '$lib/sdk';

/**
 * Check if agent name matches search filter (case-insensitive substring)
 */
export function matchesNameFilter(name: string | undefined, filter: string): boolean {
	if (!name) return false;
	return name.toLowerCase().includes(filter.toLowerCase());
}

/**
 * Check if agent has all specified MCP tools (partial matching)
 * @param agentTools - Array of tools the agent has (e.g., ["github", "postgres"])
 * @param searchTools - Array of tool search terms (e.g., ["git", "post"])
 * @returns true if agent has all search terms (partial match)
 *
 * @example
 * matchesMcpToolsFilter(["github", "postgres"], ["git"]) // true
 * matchesMcpToolsFilter(["github"], ["git", "post"]) // false
 */
export function matchesMcpToolsFilter(
	agentTools: string[] | undefined,
	searchTools: string[]
): boolean {
	if (!agentTools || agentTools.length === 0) return false;
	if (!searchTools || searchTools.length === 0) return true;

	return searchTools.every((searchTool) =>
		agentTools.some((agentTool) => agentTool.toLowerCase().includes(searchTool.toLowerCase()))
	);
}

/**
 * Check if agent has all specified A2A skills (partial matching)
 */
export function matchesA2aSkillsFilter(
	agentSkills: string[] | undefined,
	searchSkills: string[]
): boolean {
	if (!agentSkills || agentSkills.length === 0) return false;
	if (!searchSkills || searchSkills.length === 0) return true;

	return searchSkills.every((searchSkill) =>
		agentSkills.some((agentSkill) => agentSkill.toLowerCase().includes(searchSkill.toLowerCase()))
	);
}

/**
 * Check if agent supports all specified trust models (partial matching)
 */
export function matchesSupportedTrustFilter(
	agentTrusts: string[] | undefined,
	searchTrusts: string[]
): boolean {
	if (!agentTrusts || agentTrusts.length === 0) return false;
	if (!searchTrusts || searchTrusts.length === 0) return true;

	return searchTrusts.every((searchTrust) =>
		agentTrusts.some((agentTrust) => agentTrust.toLowerCase().includes(searchTrust.toLowerCase()))
	);
}

/**
 * Check if agent matches all specified filters
 * Combines all filter checks with AND logic
 */
export function matchesAllFilters(
	agent: AgentResult,
	filters: {
		name?: string;
		mcpTools?: string[];
		a2aSkills?: string[];
		supportedTrust?: string[];
	}
): boolean {
	// Name filter
	if (filters.name && !matchesNameFilter(agent.name, filters.name)) {
		return false;
	}

	// MCP Tools filter
	if (filters.mcpTools && filters.mcpTools.length > 0) {
		if (!matchesMcpToolsFilter(agent.mcpTools, filters.mcpTools)) {
			return false;
		}
	}

	// A2A Skills filter
	if (filters.a2aSkills && filters.a2aSkills.length > 0) {
		if (!matchesA2aSkillsFilter(agent.a2aSkills, filters.a2aSkills)) {
			return false;
		}
	}

	// Supported Trust filter
	if (filters.supportedTrust && filters.supportedTrust.length > 0) {
		if (!matchesSupportedTrustFilter(agent.supportedTrusts, filters.supportedTrust)) {
			return false;
		}
	}

	return true;
}

/**
 * Check if any client-side filters are present
 * Used to determine if multi-page fetching is needed
 */
export function hasClientSideFilters(filters: {
	name?: string;
	mcpTools?: string[];
	a2aSkills?: string[];
	supportedTrust?: string[];
}): boolean {
	return !!(
		filters.name ||
		(filters.mcpTools && filters.mcpTools.length > 0) ||
		(filters.a2aSkills && filters.a2aSkills.length > 0) ||
		(filters.supportedTrust && filters.supportedTrust.length > 0)
	);
}
