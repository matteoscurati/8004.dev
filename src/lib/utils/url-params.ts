import type { SearchFilters } from '$lib/sdk';

/**
 * Parse search filters from URL search parameters
 * @param searchParams - URLSearchParams object from the current page URL
 * @returns SearchFilters object with parsed values
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): SearchFilters {
	const filters: SearchFilters = {};

	const name = searchParams.get('name');
	if (name) filters.name = name;

	const mcpTools = searchParams.get('mcpTools');
	if (mcpTools) {
		filters.mcpTools = mcpTools
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
	}

	const a2aSkills = searchParams.get('a2aSkills');
	if (a2aSkills) {
		filters.a2aSkills = a2aSkills
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	if (searchParams.get('active') === 'true') filters.active = true;
	if (searchParams.get('x402') === 'true') filters.x402support = true;

	return filters;
}

/**
 * Convert search filters to URL search parameters string
 * @param filters - SearchFilters object
 * @returns URL search string (e.g., "?name=test&active=true") or "/" if no filters
 */
export function filtersToURLString(filters: SearchFilters): string {
	const params = new URLSearchParams();

	if (filters.name) params.set('name', filters.name);
	if (filters.mcpTools && filters.mcpTools.length > 0) {
		params.set('mcpTools', filters.mcpTools.join(','));
	}
	if (filters.a2aSkills && filters.a2aSkills.length > 0) {
		params.set('a2aSkills', filters.a2aSkills.join(','));
	}
	if (filters.active) params.set('active', 'true');
	if (filters.x402support) params.set('x402', 'true');

	return params.toString() ? `?${params.toString()}` : '/';
}
