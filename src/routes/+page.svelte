<script lang="ts" module>
	// Module-level mount guard (survives component re-renders)
	let isPageMounted = false;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import StatsOverview from '$lib/components/StatsOverview.svelte';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import AgentCard from '$lib/components/AgentCard.svelte';
	import PixelIcon from '$lib/components/PixelIcon.svelte';
	import ChainBadgeFilters from '$lib/components/ChainBadgeFilters.svelte';
	import { searchAgents, countAgents, type SearchFilters as Filters, type AgentResult } from '$lib/sdk';
	import { parseFiltersFromURL, filtersToURLString } from '$lib/utils/url-params';
	import { getChainConfig } from '$lib/constants/chains';
	import { agentsCache, hashFilters } from '$lib/stores/agents-cache';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let agents = $state<AgentResult[]>([]);
	let allAgents = $state<AgentResult[]>([]); // All agents (unfiltered) for chain counts
	let allAgentsLoaded = $state(false); // Flag to show badges once loaded
	let allAgentsLoading = $state(false); // Flag to show loading state in badges
	let loading = $state(false);
	let loadingMore = $state(false);
	let loadingCount = $state(false);
	let error = $state<string | null>(null);
	let hasSearched = $state(false);
	let nextCursor = $state<string | undefined>(undefined);
	let totalMatches = $state<number | undefined>(undefined);
	let currentFilters = $state<Filters>({});
	const pageSize = 20;

	// Calculate chain breakdown for results
	let chainBreakdown = $derived.by(() => {
		if (!agents || agents.length === 0) return {};
		const breakdown: Record<number, number> = {};
		agents.forEach(agent => {
			if (agent.chainId) {
				breakdown[agent.chainId] = (breakdown[agent.chainId] || 0) + 1;
			}
		});
		return breakdown;
	});

	// Throttle URL updates to prevent Safari Lockdown Mode rate limiting
	let lastURLUpdate = 0;
	const URL_UPDATE_THROTTLE = 200; // ms

	// Update URL with current filters
	function updateURL(filters: Filters) {
		const now = Date.now();
		if (now - lastURLUpdate < URL_UPDATE_THROTTLE) {
			return; // Skip update if too soon
		}
		lastURLUpdate = now;

		try {
			const newURL = filtersToURLString(filters);
			goto(newURL, { replaceState: true, noScroll: true, keepFocus: true });
		} catch (error) {
			// Safari Lockdown Mode may block replaceState after 100 calls
			console.error('Failed to update URL:', error);
		}
	}

	// Handle chain selection change from badge filters
	function handleChainSelectionChange(chains: number[] | 'all') {
		const newFilters = { ...currentFilters, chains };
		handleSearch(newFilters);
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

		// If allAgents is empty, try to load from cache (for chain badge counts)
		if (allAgents.length === 0 && !allAgentsLoaded) {
			const allAgentsFilter = hashFilters({ chains: 'all' });
			const cachedAllAgents = agentsCache.getAgents(allAgentsFilter);
			if (cachedAllAgents && cachedAllAgents.length > 0) {
				allAgents = cachedAllAgents;
				allAgentsLoaded = true;
				allAgentsLoading = false;
			} else if (!append) {
				// If cache is empty, force load all agents for badge counts
				// Set flags immediately so badges show while loading
				allAgentsLoaded = true;
				allAgentsLoading = true;
				countAgents({ chains: 'all' }).then(() => {
					const allAgentsFilter = hashFilters({ chains: 'all' });
					const cachedAllAgents = agentsCache.getAgents(allAgentsFilter);
					if (cachedAllAgents && cachedAllAgents.length > 0) {
						allAgents = cachedAllAgents;
					}
					allAgentsLoading = false;
				}).catch(err => {
					console.error('Failed to load all agents for badges:', err);
					allAgentsLoading = false;
				});
			}
		}

		try {
			// For initial multi-chain searches, fetch count first
			const isMultiChain = filters.chains === 'all' ||
				(Array.isArray(filters.chains) && filters.chains.length > 1);

			if (!append && isMultiChain) {
				// Start counting in parallel with search
				loadingCount = true;

				// If counting all chains and allAgents not loaded yet, set loading state
				if (filters.chains === 'all' && !allAgentsLoaded) {
					allAgentsLoaded = true;
					allAgentsLoading = true;
				}

				countAgents(filters).then(count => {
					totalMatches = count;
					loadingCount = false;

					// Update allAgents from cache after counting (if chains='all')
					if (filters.chains === 'all') {
						const allAgentsFilter = hashFilters({ chains: 'all' });
						const cachedAllAgents = agentsCache.getAgents(allAgentsFilter);
						if (cachedAllAgents && cachedAllAgents.length > 0) {
							allAgents = cachedAllAgents;
							allAgentsLoaded = true;
							allAgentsLoading = false;
						}
					}
				}).catch(err => {
					console.error('Failed to count agents:', err);
					loadingCount = false;
					allAgentsLoading = false;
				});
			}

			const result = await searchAgents(
				filters,
				pageSize,
				append ? nextCursor : undefined
			);

			if (append) {
				agents = [...agents, ...result.items];
			} else {
				agents = result.items;
				// Use result totalMatches if available (single chain)
				if (result.totalMatches !== undefined) {
					totalMatches = result.totalMatches;
				}
			}

			nextCursor = result.nextCursor;
		} catch (e) {
			// Detect specific error types for better user feedback
			const errorMessage = e instanceof Error ? e.message : 'Failed to search agents';

			if (errorMessage.includes('bad indexers') || errorMessage.includes('indexer not available')) {
				error = 'The Graph indexer is temporarily unavailable. This is a temporary infrastructure issue. Please try again in a few minutes.';
			} else if (errorMessage.includes('subgraph')) {
				error = 'Unable to connect to the agent registry. Please check your internet connection and try again.';
			} else {
				error = errorMessage;
			}

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

	// Initial filters state for SearchFilters component
	let initialFilters = $state<Filters>({});

	// Detect Safari Lockdown Mode by checking if RPC calls fail
	let isLockdownMode = $state(false);

	onMount(async () => {
		// Prevent multiple mounts (Safari Lockdown Mode bug)
		if (isPageMounted) {
			console.warn('Page already mounted, skipping onMount');
			return;
		}
		isPageMounted = true;

		// Detect Lockdown Mode by trying to access AudioContext
		try {
			if (typeof window !== 'undefined') {
				const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
				if (!AudioContextClass) {
					isLockdownMode = true;
					console.log('Safari Lockdown Mode detected - disabling blockchain features');
				}
			}
		} catch (e) {
			isLockdownMode = true;
		}

		// Try to load all agents from cache for chain counts
		const allAgentsFilter = hashFilters({ chains: 'all' });
		const cachedAllAgents = agentsCache.getAgents(allAgentsFilter);
		if (cachedAllAgents && cachedAllAgents.length > 0) {
			allAgents = cachedAllAgents;
			allAgentsLoaded = true;
			allAgentsLoading = false;
		} else {
			// Cache is empty, badges will load asynchronously
			allAgentsLoaded = true;
			allAgentsLoading = true;
		}

		// Parse filters from URL now that we're on the client
		const urlFilters = parseFiltersFromURL($page.url.searchParams);
		if (!urlFilters.chains) {
			urlFilters.chains = 'all';
		}
		initialFilters = urlFilters;

		// Run initial search with URL filters
		await handleSearch(urlFilters);
	});

	onDestroy(() => {
		isPageMounted = false;
	});
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{data?.title || '8004.dev - ERC-8004 Agent Discovery'}</title>
	<meta name="title" content={data?.title || '8004.dev - ERC-8004 Agent Discovery'} />
	<meta name="description" content={data?.description || 'Discover AI agents on Ethereum'} />
	{#if data?.keywords}
		<meta name="keywords" content={data.keywords} />
	{/if}

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	{#if data?.url}
		<meta property="og:url" content={data.url} />
	{/if}
	<meta property="og:title" content={data?.title || '8004.dev'} />
	<meta property="og:description" content={data?.description || 'Discover AI agents on Ethereum'} />
	{#if data?.image}
		<meta property="og:image" content={data.image} />
	{/if}

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	{#if data?.url}
		<meta property="twitter:url" content={data.url} />
	{/if}
	<meta property="twitter:title" content={data?.title || '8004.dev'} />
	<meta property="twitter:description" content={data?.description || 'Discover AI agents on Ethereum'} />
	{#if data?.image}
		<meta property="twitter:image" content={data.image} />
	{/if}

	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="language" content="English" />
	<meta name="author" content="Matteo Scurati" />
	{#if data?.url}
		<link rel="canonical" href={data.url} />
	{/if}

	<!-- Structured Data (JSON-LD) -->
	{#if data?.url && data?.description && data?.keywords}
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
	{/if}
</svelte:head>

<div class="search-page">
	{#if !isLockdownMode}
		<StatsOverview />

		<div class="activity-feed-wrapper">
			<ActivityFeed selectedChains={currentFilters.chains} />
		</div>
	{:else}
		<div class="lockdown-notice pixel-card">
			<h3><PixelIcon type="warning" size={16} color="#ffaa00" /> Limited Mode</h3>
			<p>Safari Lockdown Mode detected. Blockchain features are disabled.</p>
			<p>Search functionality is still available below.</p>
		</div>
	{/if}

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
			<h3><PixelIcon type="warning" size={16} color="#ff4444" /> ERROR</h3>
			<p class="error-message">{error}</p>
			{#if error.includes('indexer')}
				<div class="error-details">
					<p class="error-hint">
						<strong>What does this mean?</strong><br/>
						The Graph Network uses decentralized indexers to provide data. Sometimes an indexer may be temporarily unavailable.
					</p>
					<p class="error-hint">
						<strong>What can you do?</strong><br/>
						• Wait a few minutes and try again<br/>
						• Refresh the page to potentially connect to a different indexer<br/>
						• Check <a href="https://status.thegraph.com/" target="_blank" rel="noopener">The Graph status</a> for known issues
					</p>
				</div>
			{:else if error.includes('agent registry') || error.includes('subgraph')}
				<p class="error-hint">
					Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.
				</p>
			{:else}
				<p class="error-hint">
					Make sure you have configured the .env file with a valid RPC URL.
				</p>
			{/if}
			<button class="pixel-button retry-button" onclick={() => handleSearch(currentFilters)}>
				&gt; RETRY
			</button>
		</div>
	{:else if hasSearched}
		<!-- Chain Badge Filters - show once loading starts (even if no results) -->
		{#if allAgentsLoaded}
			<div class="chain-badges-container">
				<ChainBadgeFilters
					allAgents={allAgents}
					selectedChains={currentFilters.chains || 'all'}
					onSelectionChange={handleChainSelectionChange}
					loading={allAgentsLoading}
				/>
			</div>
		{/if}

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

	.lockdown-notice {
		padding: calc(var(--spacing-unit) * 3);
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 4);
		border-color: #ffaa00;
		background-color: rgba(255, 170, 0, 0.1);
	}

	.lockdown-notice h3 {
		color: #ffaa00;
		font-size: 14px;
		margin-bottom: calc(var(--spacing-unit) * 2);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit));
	}

	.lockdown-notice p {
		font-size: 10px;
		margin: var(--spacing-unit) 0;
		color: var(--color-text-secondary);
	}

	.activity-feed-wrapper {
		margin-bottom: calc(var(--spacing-unit) * 4);
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
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) * 2);
	}

	.error-message {
		font-size: 11px;
		margin-bottom: calc(var(--spacing-unit) * 2);
		color: var(--color-text);
		line-height: 1.6;
	}

	.error-details {
		margin-top: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 2);
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid var(--color-border);
		text-align: left;
	}

	.error-hint {
		color: var(--color-text-secondary);
		font-size: 9px;
		line-height: 1.6;
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.error-hint:last-child {
		margin-bottom: 0;
	}

	.error-hint strong {
		color: var(--color-text);
		display: block;
		margin-bottom: calc(var(--spacing-unit) / 2);
	}

	.error-hint a {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.error-hint a:hover {
		color: var(--color-text);
	}

	.retry-button {
		margin-top: calc(var(--spacing-unit) * 3);
		min-width: 150px;
	}

	.chain-badges-container {
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 3);
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
			gap: calc(var(--spacing-unit) * 2);
		}

		.results-header h2 {
			font-size: 14px;
		}

		.pagination-info {
			font-size: 9px;
		}

		.error-container h3 {
			font-size: 14px;
		}

		.error-message {
			font-size: 10px;
		}

		.error-hint {
			font-size: 9px;
		}

		.loading-container p {
			font-size: 10px;
		}

		.no-results h3 {
			font-size: 14px;
		}

		.no-results p {
			font-size: 9px;
		}
	}

	@media (max-width: 480px) {
		.results-header h2 {
			font-size: 12px;
		}

		.pagination-info {
			font-size: 8px;
		}

		.load-more-button {
			min-width: 160px;
			font-size: 10px;
		}
	}
</style>
