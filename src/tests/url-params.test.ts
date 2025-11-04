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
				'name=agent&mcpTools=github,postgres&a2aSkills=python&supportedTrust=reputation&active=true&x402=true'
			);
			const filters = parseFiltersFromURL(params);
			expect(filters).toEqual({
				name: 'agent',
				mcpTools: ['github', 'postgres'],
				a2aSkills: ['python'],
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
				supportedTrust: ['reputation'],
				active: true,
				x402support: true
			});
			expect(urlString).toContain('?');
			expect(urlString).toContain('name=agent');
			expect(urlString).toContain('mcpTools=github%2Cpostgres');
			expect(urlString).toContain('a2aSkills=python');
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

		it('should not include empty supportedTrust array', () => {
			const urlString = filtersToURLString({
				name: 'test',
				supportedTrust: []
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
	});
});
