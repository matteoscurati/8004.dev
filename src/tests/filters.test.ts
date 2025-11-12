import { describe, it, expect } from 'vitest';
import {
	matchesNameFilter,
	matchesMcpToolsFilter,
	matchesA2aSkillsFilter,
	matchesOasfSkillsFilter,
	matchesOasfDomainsFilter,
	matchesSupportedTrustFilter,
	matchesAllFilters,
	hasClientSideFilters
} from '$lib/utils/filters';
import type { AgentResult } from '$lib/sdk';

/**
 * Filter Functions Tests
 *
 * Tests for pure filter functions that implement partial matching logic.
 * These are extracted from sdk.ts for better testability.
 */

// Helper to create mock agent
function createMockAgent(overrides: Partial<AgentResult> = {}): AgentResult {
	return {
		id: '11155111:770',
		name: 'Test Agent',
		description: 'Test description',
		imageUrl: 'https://test.com/image.png',
		mcp: false,
		a2a: false,
		mcpTools: [],
		a2aSkills: [],
		mcpPrompts: [],
		mcpResources: [],
		oasfSkills: [],
		oasfDomains: [],
		active: true,
		x402support: false,
		supportedTrusts: [],
		owners: [],
		operators: [],
		chainId: 11155111,
		walletAddress: '0x0',
		extras: {},
		...overrides
	};
}

describe('Filter Functions', () => {
	describe('matchesNameFilter', () => {
		it('should match exact name (case-insensitive)', () => {
			expect(matchesNameFilter('Agente Ciro', 'agente ciro')).toBe(true);
			expect(matchesNameFilter('AGENTE CIRO', 'agente ciro')).toBe(true);
		});

		it('should match substring (case-insensitive)', () => {
			expect(matchesNameFilter('Agente Ciro', 'ciro')).toBe(true);
			expect(matchesNameFilter('Agente Ciro', 'CIRO')).toBe(true);
			expect(matchesNameFilter('Agente Ciro', 'agent')).toBe(true);
		});

		it('should not match different name', () => {
			expect(matchesNameFilter('Agente Ciro', 'deep42')).toBe(false);
		});

		it('should handle undefined name', () => {
			expect(matchesNameFilter(undefined, 'test')).toBe(false);
		});

		it('should match anywhere in string', () => {
			expect(matchesNameFilter('My Agent Ciro Bot', 'ciro')).toBe(true);
		});
	});

	describe('matchesMcpToolsFilter', () => {
		it('should match exact tool name', () => {
			expect(matchesMcpToolsFilter(['github'], ['github'])).toBe(true);
		});

		it('should match partial tool name (substring)', () => {
			expect(matchesMcpToolsFilter(['github'], ['git'])).toBe(true);
			expect(matchesMcpToolsFilter(['github'], ['hub'])).toBe(true);
		});

		it('should match case-insensitive', () => {
			expect(matchesMcpToolsFilter(['GitHub'], ['github'])).toBe(true);
			expect(matchesMcpToolsFilter(['github'], ['GITHUB'])).toBe(true);
		});

		it('should match all specified tools (AND logic)', () => {
			expect(matchesMcpToolsFilter(['github', 'postgres'], ['git', 'post'])).toBe(true);
		});

		it('should not match if missing one tool', () => {
			expect(matchesMcpToolsFilter(['github'], ['git', 'post'])).toBe(false);
		});

		it('should not match if no tools', () => {
			expect(matchesMcpToolsFilter([], ['git'])).toBe(false);
			expect(matchesMcpToolsFilter(undefined, ['git'])).toBe(false);
		});

		it('should match if no search terms (empty filter)', () => {
			expect(matchesMcpToolsFilter(['github'], [])).toBe(true);
		});

		it('should handle multiple partial matches', () => {
			expect(matchesMcpToolsFilter(['github', 'gitlab', 'postgres'], ['git'])).toBe(true);
		});
	});

	describe('matchesA2aSkillsFilter', () => {
		it('should match exact skill name', () => {
			expect(matchesA2aSkillsFilter(['python-coding'], ['python-coding'])).toBe(true);
		});

		it('should match partial skill name', () => {
			expect(matchesA2aSkillsFilter(['data-analysis'], ['data'])).toBe(true);
			expect(matchesA2aSkillsFilter(['data-analysis'], ['analysis'])).toBe(true);
		});

		it('should match case-insensitive', () => {
			expect(matchesA2aSkillsFilter(['Python-Coding'], ['python'])).toBe(true);
		});

		it('should match all specified skills (AND logic)', () => {
			expect(
				matchesA2aSkillsFilter(['python-coding', 'data-analysis'], ['python', 'data'])
			).toBe(true);
		});

		it('should not match if missing one skill', () => {
			expect(matchesA2aSkillsFilter(['python-coding'], ['python', 'data'])).toBe(false);
		});

		it('should not match if no skills', () => {
			expect(matchesA2aSkillsFilter([], ['python'])).toBe(false);
			expect(matchesA2aSkillsFilter(undefined, ['python'])).toBe(false);
		});

		it('should match if no search terms', () => {
			expect(matchesA2aSkillsFilter(['python-coding'], [])).toBe(true);
		});
	});

	describe('matchesOasfSkillsFilter', () => {
		it('should match exact OASF skill', () => {
			expect(
				matchesOasfSkillsFilter(
					['natural_language_processing/summarization'],
					['natural_language_processing/summarization']
				)
			).toBe(true);
		});

		it('should match partial OASF skill', () => {
			expect(
				matchesOasfSkillsFilter(['natural_language_processing/summarization'], ['summarization'])
			).toBe(true);
			expect(
				matchesOasfSkillsFilter(['natural_language_processing/summarization'], ['language_processing'])
			).toBe(true);
		});

		it('should match case-insensitive', () => {
			expect(
				matchesOasfSkillsFilter(
					['Natural_Language_Processing/Summarization'],
					['natural_language_processing']
				)
			).toBe(true);
		});

		it('should match all specified skills (AND logic)', () => {
			expect(
				matchesOasfSkillsFilter(
					['natural_language_processing/summarization', 'data_science/data_analysis'],
					['summarization', 'data_analysis']
				)
			).toBe(true);
		});

		it('should not match if missing one skill', () => {
			expect(
				matchesOasfSkillsFilter(['natural_language_processing/summarization'], ['summarization', 'translation'])
			).toBe(false);
		});

		it('should not match if no skills', () => {
			expect(matchesOasfSkillsFilter([], ['summarization'])).toBe(false);
			expect(matchesOasfSkillsFilter(undefined, ['summarization'])).toBe(false);
		});

		it('should match if no search terms', () => {
			expect(matchesOasfSkillsFilter(['natural_language_processing/summarization'], [])).toBe(true);
		});

		it('should match category part of skill path', () => {
			expect(
				matchesOasfSkillsFilter(
					['natural_language_processing/summarization'],
					['natural_language']
				)
			).toBe(true);
		});
	});

	describe('matchesOasfDomainsFilter', () => {
		it('should match exact OASF domain', () => {
			expect(
				matchesOasfDomainsFilter(
					['finance_and_business/investment_services'],
					['finance_and_business/investment_services']
				)
			).toBe(true);
		});

		it('should match partial OASF domain', () => {
			expect(
				matchesOasfDomainsFilter(['finance_and_business/investment_services'], ['investment'])
			).toBe(true);
			expect(
				matchesOasfDomainsFilter(['finance_and_business/investment_services'], ['finance'])
			).toBe(true);
		});

		it('should match case-insensitive', () => {
			expect(
				matchesOasfDomainsFilter(
					['Finance_And_Business/Investment_Services'],
					['finance_and_business']
				)
			).toBe(true);
		});

		it('should match all specified domains (AND logic)', () => {
			expect(
				matchesOasfDomainsFilter(
					['finance_and_business/investment_services', 'technology/software_development'],
					['investment', 'software']
				)
			).toBe(true);
		});

		it('should not match if missing one domain', () => {
			expect(
				matchesOasfDomainsFilter(['finance_and_business/investment_services'], ['investment', 'healthcare'])
			).toBe(false);
		});

		it('should not match if no domains', () => {
			expect(matchesOasfDomainsFilter([], ['investment'])).toBe(false);
			expect(matchesOasfDomainsFilter(undefined, ['investment'])).toBe(false);
		});

		it('should match if no search terms', () => {
			expect(matchesOasfDomainsFilter(['finance_and_business/investment_services'], [])).toBe(true);
		});

		it('should match category part of domain path', () => {
			expect(
				matchesOasfDomainsFilter(
					['finance_and_business/investment_services'],
					['finance_and']
				)
			).toBe(true);
		});
	});

	describe('matchesSupportedTrustFilter', () => {
		it('should match exact trust model', () => {
			expect(matchesSupportedTrustFilter(['reputation'], ['reputation'])).toBe(true);
		});

		it('should match partial trust model name', () => {
			expect(matchesSupportedTrustFilter(['crypto-economic'], ['crypto'])).toBe(true);
			expect(matchesSupportedTrustFilter(['crypto-economic'], ['economic'])).toBe(true);
		});

		it('should match case-insensitive', () => {
			expect(matchesSupportedTrustFilter(['Crypto-Economic'], ['crypto'])).toBe(true);
		});

		it('should match all specified trust models (AND logic)', () => {
			expect(
				matchesSupportedTrustFilter(['crypto-economic', 'reputation-based'], ['crypto', 'reputation'])
			).toBe(true);
		});

		it('should not match if missing one trust model', () => {
			expect(matchesSupportedTrustFilter(['crypto-economic'], ['crypto', 'reputation'])).toBe(
				false
			);
		});

		it('should not match if no trust models', () => {
			expect(matchesSupportedTrustFilter([], ['crypto'])).toBe(false);
			expect(matchesSupportedTrustFilter(undefined, ['crypto'])).toBe(false);
		});

		it('should match if no search terms', () => {
			expect(matchesSupportedTrustFilter(['crypto-economic'], [])).toBe(true);
		});
	});

	describe('matchesAllFilters', () => {
		it('should match agent with name filter', () => {
			const agent = createMockAgent({ name: 'Agente Ciro' });
			expect(matchesAllFilters(agent, { name: 'ciro' })).toBe(true);
		});

		it('should match agent with tools filter', () => {
			const agent = createMockAgent({ mcpTools: ['github', 'postgres'] });
			expect(matchesAllFilters(agent, { mcpTools: ['git'] })).toBe(true);
		});

		it('should match agent with skills filter', () => {
			const agent = createMockAgent({ a2aSkills: ['python-coding'] });
			expect(matchesAllFilters(agent, { a2aSkills: ['python'] })).toBe(true);
		});

		it('should match agent with trust filter', () => {
			const agent = createMockAgent({ supportedTrusts: ['crypto-economic'] });
			expect(matchesAllFilters(agent, { supportedTrust: ['crypto'] })).toBe(true);
		});

		it('should match agent with OASF skills filter', () => {
			const agent = createMockAgent({
				oasfSkills: ['natural_language_processing/summarization']
			});
			expect(matchesAllFilters(agent, { oasfSkills: ['summarization'] })).toBe(true);
		});

		it('should match agent with OASF domains filter', () => {
			const agent = createMockAgent({
				oasfDomains: ['finance_and_business/investment_services']
			});
			expect(matchesAllFilters(agent, { oasfDomains: ['investment'] })).toBe(true);
		});

		it('should match agent with combined filters (AND logic)', () => {
			const agent = createMockAgent({
				name: 'Agente Ciro',
				mcpTools: ['github'],
				a2aSkills: ['data-analysis'],
				oasfSkills: ['natural_language_processing/summarization'],
				oasfDomains: ['finance_and_business/investment_services'],
				supportedTrusts: ['crypto-economic']
			});
			expect(
				matchesAllFilters(agent, {
					name: 'ciro',
					mcpTools: ['git'],
					a2aSkills: ['data'],
					oasfSkills: ['summarization'],
					oasfDomains: ['investment'],
					supportedTrust: ['crypto']
				})
			).toBe(true);
		});

		it('should not match if one filter fails', () => {
			const agent = createMockAgent({
				name: 'Agente Ciro',
				mcpTools: ['github']
			});
			expect(
				matchesAllFilters(agent, {
					name: 'ciro',
					mcpTools: ['postgres'] // Does not have
				})
			).toBe(false);
		});

		it('should match if no filters specified', () => {
			const agent = createMockAgent();
			expect(matchesAllFilters(agent, {})).toBe(true);
		});

		it('should handle empty arrays in filters', () => {
			const agent = createMockAgent();
			expect(
				matchesAllFilters(agent, {
					mcpTools: [],
					a2aSkills: [],
					supportedTrust: []
				})
			).toBe(true);
		});
	});

	describe('hasClientSideFilters', () => {
		it('should return true if name filter present', () => {
			expect(hasClientSideFilters({ name: 'test' })).toBe(true);
		});

		it('should return true if mcpTools filter present', () => {
			expect(hasClientSideFilters({ mcpTools: ['git'] })).toBe(true);
		});

		it('should return true if a2aSkills filter present', () => {
			expect(hasClientSideFilters({ a2aSkills: ['python'] })).toBe(true);
		});

		it('should return true if supportedTrust filter present', () => {
			expect(hasClientSideFilters({ supportedTrust: ['crypto'] })).toBe(true);
		});

		it('should return true if oasfSkills filter present', () => {
			expect(hasClientSideFilters({ oasfSkills: ['summarization'] })).toBe(true);
		});

		it('should return true if oasfDomains filter present', () => {
			expect(hasClientSideFilters({ oasfDomains: ['investment'] })).toBe(true);
		});

		it('should return true if multiple filters present', () => {
			expect(
				hasClientSideFilters({
					name: 'test',
					mcpTools: ['git'],
					a2aSkills: ['python']
				})
			).toBe(true);
		});

		it('should return false if no filters present', () => {
			expect(hasClientSideFilters({})).toBe(false);
		});

		it('should return false if all filters are empty', () => {
			expect(
				hasClientSideFilters({
					mcpTools: [],
					a2aSkills: [],
					oasfSkills: [],
					oasfDomains: [],
					supportedTrust: []
				})
			).toBe(false);
		});

		it('should return false if filters are undefined', () => {
			expect(
				hasClientSideFilters({
					name: undefined,
					mcpTools: undefined
				})
			).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle special characters in names', () => {
			expect(matchesNameFilter('Agent-123_test', 'agent-123')).toBe(true);
		});

		it('should handle Unicode characters', () => {
			expect(matchesNameFilter('Agente Número 1', 'número')).toBe(true);
		});

		it('should handle very long filter strings', () => {
			const longName = 'a'.repeat(1000);
			expect(matchesNameFilter(longName, 'aaa')).toBe(true);
		});

		it('should handle empty filter string', () => {
			expect(matchesNameFilter('Test', '')).toBe(true);
		});

		it('should handle array with duplicates', () => {
			expect(matchesMcpToolsFilter(['github', 'github'], ['git'])).toBe(true);
		});
	});
});
