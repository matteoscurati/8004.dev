import { describe, it, expect } from 'vitest';
import { parseFiltersFromURL, filtersToURLString } from '$lib/utils/url-params';

describe('URL Parameters Utilities', () => {
	describe('parseFiltersFromURL', () => {
		it('should parse empty search params to empty filters', () => {
			const params = new URLSearchParams();
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({});
		});

		it('should parse name parameter', () => {
			const params = new URLSearchParams('name=test-agent');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({ name: 'test-agent' });
		});

		it('should parse mcpTools parameter', () => {
			const params = new URLSearchParams('mcpTools=github,postgres');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				mcpTools: ['github', 'postgres']
			});
		});

		it('should parse mcpTools parameter with spaces', () => {
			const params = new URLSearchParams('mcpTools=github, postgres, slack');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				mcpTools: ['github', 'postgres', 'slack']
			});
		});

		it('should parse a2aSkills parameter', () => {
			const params = new URLSearchParams('a2aSkills=python,data-analysis');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				a2aSkills: ['python', 'data-analysis']
			});
		});

		it('should parse oasfSkills parameter', () => {
			const params = new URLSearchParams('oasfSkills=natural_language_processing/summarization,data_science/data_analysis');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				oasfSkills: ['natural_language_processing/summarization', 'data_science/data_analysis']
			});
		});

		it('should parse oasfSkills parameter with spaces', () => {
			const params = new URLSearchParams('oasfSkills=natural_language_processing/summarization, data_science/data_analysis');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				oasfSkills: ['natural_language_processing/summarization', 'data_science/data_analysis']
			});
		});

		it('should parse oasfDomains parameter', () => {
			const params = new URLSearchParams('oasfDomains=finance_and_business/investment_services,technology/software_development');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				oasfDomains: ['finance_and_business/investment_services', 'technology/software_development']
			});
		});

		it('should parse oasfDomains parameter with spaces', () => {
			const params = new URLSearchParams('oasfDomains=finance_and_business/investment_services, technology/software_development');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				oasfDomains: ['finance_and_business/investment_services', 'technology/software_development']
			});
		});

		it('should parse supportedTrust parameter', () => {
			const params = new URLSearchParams('supportedTrust=reputation,crypto-economic');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				supportedTrust: ['reputation', 'crypto-economic']
			});
		});

		it('should parse supportedTrust parameter with spaces', () => {
			const params = new URLSearchParams('supportedTrust=reputation, crypto-economic, social');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				supportedTrust: ['reputation', 'crypto-economic', 'social']
			});
		});

		it('should parse active parameter', () => {
			const params = new URLSearchParams('active=true');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({ active: true });
		});

		it('should not set active if value is not "true"', () => {
			const params = new URLSearchParams('active=false');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({});
		});

		it('should parse x402 parameter', () => {
			const params = new URLSearchParams('x402=true');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({ x402support: true });
		});

		it('should parse multiple parameters together', () => {
			const params = new URLSearchParams(
				'name=agent&mcpTools=github,postgres&a2aSkills=python&oasfSkills=natural_language_processing/summarization&oasfDomains=finance_and_business/investment_services&supportedTrust=reputation&active=true&x402=true'
			);
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				name: 'agent',
				mcpTools: ['github', 'postgres'],
				a2aSkills: ['python'],
				oasfSkills: ['natural_language_processing/summarization'],
				oasfDomains: ['finance_and_business/investment_services'],
				supportedTrust: ['reputation'],
				active: true,
				x402support: true
			});
		});

		it('should filter out empty strings from comma-separated lists', () => {
			const params = new URLSearchParams('mcpTools=github,,postgres,');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				mcpTools: ['github', 'postgres']
			});
		});

		it('should parse chains parameter as "all"', () => {
			const params = new URLSearchParams('chains=all');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				chains: 'all'
			});
		});

		it('should parse chains parameter as single chain ID', () => {
			const params = new URLSearchParams('chains=11155111');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				chains: [11155111]
			});
		});

		it('should parse chains parameter as multiple chain IDs', () => {
			const params = new URLSearchParams('chains=11155111,84532,80002');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				chains: [11155111, 84532, 80002]
			});
		});

		it('should parse chains parameter with spaces', () => {
			const params = new URLSearchParams('chains=11155111, 84532, 80002');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				chains: [11155111, 84532, 80002]
			});
		});

		it('should ignore invalid chain IDs', () => {
			const params = new URLSearchParams('chains=11155111,invalid,84532');
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				chains: [11155111, 84532]
			});
		});
	});

	describe('filtersToURLString', () => {
		it('should convert empty filters to "/"', () => {
			const urlString = filtersToURLString({});
			expect(urlString).toBe('/');
		});

		it('should convert name filter to URL string', () => {
			const urlString = filtersToURLString({ name: 'test-agent' });
			expect(urlString).toBe('?name=test-agent');
		});

		it('should convert mcpTools filter to URL string', () => {
			const urlString = filtersToURLString({
				mcpTools: ['github', 'postgres']
			});
			expect(urlString).toBe('?mcpTools=github%2Cpostgres');
		});

		it('should convert a2aSkills filter to URL string', () => {
			const urlString = filtersToURLString({
				a2aSkills: ['python', 'data-analysis']
			});
			expect(urlString).toBe('?a2aSkills=python%2Cdata-analysis');
		});

		it('should convert oasfSkills filter to URL string', () => {
			const urlString = filtersToURLString({
				oasfSkills: ['natural_language_processing/summarization', 'data_science/data_analysis']
			});
			expect(urlString).toBe('?oasfSkills=natural_language_processing%2Fsummarization%2Cdata_science%2Fdata_analysis');
		});

		it('should convert oasfDomains filter to URL string', () => {
			const urlString = filtersToURLString({
				oasfDomains: ['finance_and_business/investment_services', 'technology/software_development']
			});
			expect(urlString).toBe('?oasfDomains=finance_and_business%2Finvestment_services%2Ctechnology%2Fsoftware_development');
		});

		it('should convert supportedTrust filter to URL string', () => {
			const urlString = filtersToURLString({
				supportedTrust: ['reputation', 'crypto-economic']
			});
			expect(urlString).toBe('?supportedTrust=reputation%2Ccrypto-economic');
		});

		it('should convert active filter to URL string', () => {
			const urlString = filtersToURLString({ active: true });
			expect(urlString).toBe('?active=true');
		});

		it('should convert x402support filter to URL string', () => {
			const urlString = filtersToURLString({ x402support: true });
			expect(urlString).toBe('?x402=true');
		});

		it('should convert multiple filters to URL string', () => {
			const urlString = filtersToURLString({
				name: 'agent',
				mcpTools: ['github', 'postgres'],
				a2aSkills: ['python'],
				oasfSkills: ['natural_language_processing/summarization'],
				oasfDomains: ['finance_and_business/investment_services'],
				supportedTrust: ['reputation'],
				active: true,
				x402support: true
			});
			expect(urlString).toContain('?');
			expect(urlString).toContain('name=agent');
			expect(urlString).toContain('mcpTools=github%2Cpostgres');
			expect(urlString).toContain('a2aSkills=python');
			expect(urlString).toContain('oasfSkills=natural_language_processing');
			expect(urlString).toContain('oasfDomains=finance_and_business');
			expect(urlString).toContain('supportedTrust=reputation');
			expect(urlString).toContain('active=true');
			expect(urlString).toContain('x402=true');
		});

		it('should not include empty mcpTools array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				mcpTools: []
			});
			expect(urlString).toBe('?name=test');
		});

		it('should not include empty a2aSkills array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				a2aSkills: []
			});
			expect(urlString).toBe('?name=test');
		});

		it('should not include empty oasfSkills array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				oasfSkills: []
			});
			expect(urlString).toBe('?name=test');
		});

		it('should not include empty oasfDomains array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				oasfDomains: []
			});
			expect(urlString).toBe('?name=test');
		});

		it('should not include empty supportedTrust array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				supportedTrust: []
			});
			expect(urlString).toBe('?name=test');
		});

		it('should convert chains filter to URL string with "all"', () => {
			const urlString = filtersToURLString({ chains: 'all' });
			expect(urlString).toBe('?chains=all');
		});

		it('should convert chains filter to URL string with single chain', () => {
			const urlString = filtersToURLString({ chains: [11155111] });
			expect(urlString).toBe('?chains=11155111');
		});

		it('should convert chains filter to URL string with multiple chains', () => {
			const urlString = filtersToURLString({ chains: [11155111, 84532, 80002] });
			expect(urlString).toBe('?chains=11155111%2C84532%2C80002');
		});

		it('should not include empty chains array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				chains: []
			});
			expect(urlString).toBe('?name=test');
		});
	});

	describe('Round-trip conversion', () => {
		it('should maintain filters through URL round-trip', () => {
			const originalFilters = {
				name: 'test-agent',
				mcpTools: ['github', 'postgres'],
				a2aSkills: ['python', 'data-analysis'],
				oasfSkills: ['natural_language_processing/summarization'],
				oasfDomains: ['finance_and_business/investment_services'],
				supportedTrust: ['reputation', 'crypto-economic'],
				active: true,
				x402support: true
			};

			// Convert to URL string and back
			const urlString = filtersToURLString(originalFilters);
			const params = new URLSearchParams(urlString.replace('?', ''));
			const parsedFilters = parseFiltersFromURL(params);

			expect(parsedFilters).toEqual(originalFilters);
		});

		it('should handle empty filters in round-trip', () => {
			const originalFilters = {};

			const urlString = filtersToURLString(originalFilters);
			const params = new URLSearchParams(urlString.replace('?', '').replace('/', ''));
			const parsedFilters = parseFiltersFromURL(params);

			expect(parsedFilters).toEqual(originalFilters);
		});

		it('should handle partial filters in round-trip', () => {
			const originalFilters = {
				name: 'agent',
				active: true
			};

			const urlString = filtersToURLString(originalFilters);
			const params = new URLSearchParams(urlString.replace('?', ''));
			const parsedFilters = parseFiltersFromURL(params);

			expect(parsedFilters).toEqual(originalFilters);
		});

		it('should maintain chains="all" through round-trip', () => {
			const originalFilters = {
				name: 'test',
				chains: 'all' as const
			};

			const urlString = filtersToURLString(originalFilters);
			const params = new URLSearchParams(urlString.replace('?', ''));
			const parsedFilters = parseFiltersFromURL(params);

			expect(parsedFilters).toEqual(originalFilters);
		});

		it('should maintain chains array through round-trip', () => {
			const originalFilters = {
				name: 'test',
				chains: [11155111, 84532, 80002]
			};

			const urlString = filtersToURLString(originalFilters);
			const params = new URLSearchParams(urlString.replace('?', ''));
			const parsedFilters = parseFiltersFromURL(params);

			expect(parsedFilters).toEqual(originalFilters);
		});
	});
});
