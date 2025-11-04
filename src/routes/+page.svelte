<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StatsOverview from '$lib/components/StatsOverview.svelte';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import AgentCard from '$lib/components/AgentCard.svelte';
	import { searchAgents, countAgents, type SearchFilters as Filters, type AgentResult } from '$lib/sdk';
	import { parseFiltersFromURL, filtersToURLString } from '$lib/utils/url-params';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let agents = $state<AgentResult[]>([]);
	let loading = $state(false);
	let loadingMore = $state(false);
	let loadingCount = $state(false);
	let error = $state<string | null>(null);
	let hasSearched = $state(false);
	let nextCursor = $state<string | undefined>(undefined);
	let totalMatches = $state<number | undefined>(undefined);
	let currentFilters = $state<Filters>({});
	const pageSize = 20;

	// Update URL with current filters
	function updateURL(filters: Filters) {
		const newURL = filtersToURLString(filters);
		goto(newURL, { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function handleSearch(filters: Filters, append: boolean = false) {
		if (append) {
			loadingMore = true;
		} else {
			loading = true;
			agents = [];
			nextCursor = undefined;
			totalMatches = undefined;
			// Update URL with new filters (only for new searches, not for "Load More")
			updateURL(filters);
		}

		error = null;
		hasSearched = true;
		currentFilters = filters;

		try {
			const result = await searchAgents(
				filters,
				pageSize,
				append ? nextCursor : undefined
			);

			if (append) {
				agents = [...agents, ...result.items];
			} else {
				agents = result.items;
				totalMatches = result.totalMatches;

				// If we don't have totalMatches yet and there are more results,
				// fetch total count in background (lazy load)
				if (totalMatches === undefined && result.nextCursor) {
					loadingCount = true;
					countAgents(filters).then(count => {
						totalMatches = count;
						loadingCount = false;
					}).catch(err => {
						console.error('Failed to count agents:', err);
						loadingCount = false;
					});
				}
			}
			nextCursor = result.nextCursor;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to search agents';
			console.error('Search error:', e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	function handleLoadMore() {
		if (nextCursor && !loadingMore) {
			handleSearch(currentFilters, true);
		}
	}

	let initialFilters = $state<Filters>({});

	onMount(() => {
		// Parse filters from URL if present
		const urlFilters = parseFiltersFromURL($page.url.searchParams);
		initialFilters = urlFilters;
		// Initial search with URL filters (or show all agents if no filters)
		handleSearch(urlFilters);
	});
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{data.title}</title>
	<meta name="title" content={data.title} />
	<meta name="description" content={data.description} />
	<meta name="keywords" content={data.keywords} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.url} />
	<meta property="og:title" content={data.title} />
	<meta property="og:description" content={data.description} />
	<meta property="og:image" content={data.image} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={data.url} />
	<meta property="twitter:title" content={data.title} />
	<meta property="twitter:description" content={data.description} />
	<meta property="twitter:image" content={data.image} />

	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="language" content="English" />
	<meta name="author" content="Matteo Scurati" />
	<link rel="canonical" href={data.url} />

	<!-- Structured Data (JSON-LD) -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "WebApplication",
		"name": "8004.dev",
		"url": "${data.url}",
		"description": "${data.description}",
		"applicationCategory": "DeveloperApplication",
		"operatingSystem": "Web",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"author": {
			"@type": "Person",
			"name": "Matteo Scurati",
			"url": "https://github.com/matteoscurati"
		},
		"provider": {
			"@type": "Organization",
			"name": "8004.dev",
			"url": "${data.url}"
		},
		"keywords": "${data.keywords}",
		"browserRequirements": "Requires JavaScript. Requires HTML5.",
		"softwareVersion": "1.0.0",
		"aggregateRating": {
			"@type": "AggregateRating",
			"ratingValue": "5.0",
			"ratingCount": "1"
		},
		"potentialAction": {
			"@type": "SearchAction",
			"target": "${data.url}?name={search_term_string}",
			"query-input": "required name=search_term_string"
		}
	}
	<\/script>`}
</svelte:head>

<div class="search-page">
	<StatsOverview />

	<ActivityFeed />

	<SearchFilters onSearch={handleSearch} {initialFilters} />

	{#if loading}
		<div class="loading-container">
			<div class="pixel-spinner"></div>
			{#if currentFilters.name}
				<p>Searching by name across all agents...</p>
				<p class="loading-hint">This may take a moment</p>
			{:else}
				<p>Searching agents...</p>
			{/if}
		</div>
	{:else if error}
		<div class="error-container pixel-card">
			<h3>⚠ ERROR</h3>
			<p>{error}</p>
			<p class="error-hint">
				Make sure you have configured the .env file with a valid RPC URL.
			</p>
		</div>
	{:else if hasSearched}
		{#if agents.length === 0}
			<div class="no-results pixel-card">
				<h3>[ NO AGENTS FOUND ]</h3>
				<p>Try adjusting your search filters.</p>
			</div>
		{:else}
			<div class="results-header">
				<h2>
					{#if totalMatches !== undefined && totalMatches > agents.length}
						[ SHOWING {agents.length} OF {totalMatches} AGENT{totalMatches !== 1 ? 'S' : ''} ]
					{:else if nextCursor}
						[ SHOWING {agents.length} AGENT{agents.length !== 1 ? 'S' : ''} ]
					{:else}
						[ {agents.length} AGENT{agents.length !== 1 ? 'S' : ''} FOUND ]
					{/if}
				</h2>
				{#if totalMatches !== undefined && totalMatches > agents.length}
					<p class="pagination-info">
						{totalMatches - agents.length} more agent{totalMatches - agents.length !== 1 ? 's' : ''} available - click "Load More" below
					</p>
				{:else if nextCursor}
					<p class="pagination-info">
						{#if loadingCount}
							Counting total agents...
						{:else}
							Click "Load More" to see more agents
						{/if}
					</p>
				{/if}
			</div>

			<div class="agents-grid">
				{#each agents as agent (agent.id)}
					<AgentCard {agent} />
				{/each}
			</div>

			{#if nextCursor}
				<div class="pagination-controls">
					<button
						class="pixel-button load-more-button"
						onclick={handleLoadMore}
						disabled={loadingMore}
					>
						{#if loadingMore}
							&gt; LOADING...
						{:else}
							&gt; LOAD MORE ({pageSize} more)
						{/if}
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.search-page {
		width: 100%;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 8) 0;
		color: var(--color-text-secondary);
	}

	.loading-hint {
		font-size: 8px;
		opacity: 0.7;
	}

	.error-container {
		padding: calc(var(--spacing-unit) * 3);
		text-align: center;
		border-color: #ff4444;
	}

	.error-container h3 {
		color: #ff4444;
		font-size: 16px;
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.error-container p {
		font-size: 10px;
		margin-bottom: calc(var(--spacing-unit));
	}

	.error-hint {
		color: var(--color-text-secondary);
		font-size: 8px;
	}

	.no-results {
		padding: calc(var(--spacing-unit) * 4);
		text-align: center;
	}

	.no-results h3 {
		font-size: 16px;
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.no-results p {
		font-size: 10px;
		color: var(--color-text-secondary);
	}

	.results-header {
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 3);
	}

	.results-header h2 {
		font-size: 16px;
		color: var(--color-text);
		margin-bottom: var(--spacing-unit);
	}

	.pagination-info {
		font-size: 10px;
		color: var(--color-text-secondary);
		margin-top: var(--spacing-unit);
	}

	.pagination-controls {
		display: flex;
		justify-content: center;
		margin-top: calc(var(--spacing-unit) * 4);
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.load-more-button {
		min-width: 200px;
		font-size: 12px;
	}

	.load-more-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.agents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: calc(var(--spacing-unit) * 3);
	}

	@media (max-width: 768px) {
		.agents-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
