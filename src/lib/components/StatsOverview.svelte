<script lang="ts" module>
	// Module-level mount guard
	let isStatsOverviewMounted = false;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { searchAgents, type AgentResult } from '$lib/sdk';
	import { agentsCache, hashFilters, cacheLoading } from '$lib/stores/agents-cache';
	import PixelIcon from './PixelIcon.svelte';

	let loading = $state(true);
	let loadingDetails = $state(false); // For progressive loading
	let stats = $state({
		total: 0,
		active: 0,
		withMcp: 0,
		withA2a: 0,
		withX402: 0,
		activeMcp: 0,
		activeA2a: 0,
		activeX402: 0
	});

	onMount(async () => {
		// Prevent multiple mounts
		if (isStatsOverviewMounted) {
			console.warn('StatsOverview already mounted, skipping');
			return;
		}
		isStatsOverviewMounted = true;
		await loadStats();
	});

	onDestroy(() => {
		isStatsOverviewMounted = false;
	});

	async function loadStats() {
		loading = true;
		try {
			const filters = { chains: 'all' as const };
			const filterHash = hashFilters(filters);

			// Step 1: Wait for main page to mount and start countAgents()
			const maxWaitTime = 30000; // 30 seconds max wait
			const startTime = Date.now();

			// Wait for cacheLoading to become true (countAgents started)
			// OR for cache to be populated (countAgents already finished)
			let cachedAgents = agentsCache.getAgents(filterHash);

			while (!cachedAgents && !get(cacheLoading) && (Date.now() - startTime < 5000)) {
				await new Promise(resolve => setTimeout(resolve, 100));
				cachedAgents = agentsCache.getAgents(filterHash);
			}

			// Now wait for cache loading to complete if it started
			while (get(cacheLoading) && (Date.now() - startTime < maxWaitTime)) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			// Check cache after loading completes
			cachedAgents = agentsCache.getAgents(filterHash);

			let allAgents: AgentResult[];

			if (cachedAgents && cachedAgents.length > 0) {
				allAgents = cachedAgents;

				// Progressive loading: show total immediately, calculate details in background
				stats.total = allAgents.length;
				loading = false; // Show total quickly

				// Calculate detailed stats progressively
				loadingDetails = true;
				await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
			} else {

				// Step 2: Fetch ALL agents from all chains if not cached
				allAgents = [];
				let cursor: string | undefined = undefined;
				const pageSize = 100;
				let pagesFetched = 0;
				const maxPages = 20;

				do {
					const result = await searchAgents(filters, pageSize, cursor);
					allAgents = [...allAgents, ...result.items];
					cursor = result.nextCursor;
					pagesFetched++;

					// Progressive: show total as it grows
					stats.total = allAgents.length;

					if (pagesFetched >= maxPages) {
						console.warn('Stats: Reached max pages limit');
						break;
					}
				} while (cursor);

				loading = false; // Show total
			}

			// Calculate detailed stats (common path)
			stats = {
				total: allAgents.length,
				active: allAgents.filter(a => a.active).length,
				withMcp: allAgents.filter(a => a.mcp).length,
				withA2a: allAgents.filter(a => a.a2a).length,
				withX402: allAgents.filter(a => a.x402support).length,
				activeMcp: allAgents.filter(a => a.active && a.mcp).length,
				activeA2a: allAgents.filter(a => a.active && a.a2a).length,
				activeX402: allAgents.filter(a => a.active && a.x402support).length
			};

			loadingDetails = false;
		} catch (error) {
			console.error('Failed to load stats:', error);
		} finally {
			loading = false;
			loadingDetails = false;
		}
	}

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}
</script>

<div class="stats-overview">
	{#if loading}
		<div class="loading">
			<div class="pixel-spinner"></div>
			<p>LOADING NETWORK STATS...</p>
		</div>
	{:else}
		<div class="stats-header">
			<h3 class="stats-title">NETWORK OVERVIEW</h3>
			<p class="stats-subtitle">Global statistics across all supported chains</p>
		</div>
		<div class="stats-grid">
			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="chart" size={24} /></div>
				<div class="stat-value">{formatNumber(stats.total)}</div>
				<div class="stat-label">TOTAL AGENTS</div>
			</div>

			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="check" size={24} /></div>
				<div class="stat-value">{formatNumber(stats.active)}</div>
				<div class="stat-label">ACTIVE</div>
			</div>

			<div class="stat-card pixel-card hide-mobile">
				<div class="stat-icon"><PixelIcon type="tool" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.activeMcp)}</div>
				<div class="stat-label">ACTIVE MCP PROTOCOL</div>
				<div class="stat-total">({formatNumber(stats.withMcp)} total)</div>
			</div>

			<div class="stat-card pixel-card hide-mobile">
				<div class="stat-icon"><PixelIcon type="handshake" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.activeA2a)}</div>
				<div class="stat-label">ACTIVE A2A PROTOCOL</div>
				<div class="stat-total">({formatNumber(stats.withA2a)} total)</div>
			</div>

			<div class="stat-card pixel-card hide-mobile">
				<div class="stat-icon"><PixelIcon type="dollar" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.activeX402)}</div>
				<div class="stat-label">ACTIVE PAYMENT READY</div>
				<div class="stat-total">({formatNumber(stats.withX402)} total)</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stats-overview {
		width: 100%;
		margin-bottom: calc(var(--spacing-unit) * 4);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 4);
	}

	.loading p {
		font-size: 10px;
		color: var(--color-text-secondary);
		letter-spacing: 1px;
	}

	.stats-header {
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.stats-title {
		font-size: 12px;
		color: var(--color-text);
		margin-bottom: calc(var(--spacing-unit) / 2);
		letter-spacing: 1px;
	}

	.stats-subtitle {
		font-size: 8px;
		color: var(--color-text-secondary);
		opacity: 0.7;
		margin: 0;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: calc(var(--spacing-unit) * 2);
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: calc(var(--spacing-unit) * 3);
		text-align: center;
		transition: all 0.2s;
		background: linear-gradient(
			135deg,
			rgba(0, 255, 65, 0.05) 0%,
			transparent 100%
		);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
		background: linear-gradient(
			135deg,
			rgba(0, 255, 65, 0.1) 0%,
			transparent 100%
		);
	}

	.stat-icon {
		margin-bottom: calc(var(--spacing-unit));
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-value {
		font-size: 28px;
		font-weight: bold;
		color: var(--color-text);
		margin-bottom: calc(var(--spacing-unit) / 2);
		text-shadow: 2px 2px 0 var(--color-shadow);
		animation: countUp 0.5s ease-out;
	}

	@keyframes countUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.stat-label {
		font-size: 9px;
		color: var(--color-text-secondary);
		letter-spacing: 1px;
		font-weight: bold;
	}

	.stat-total {
		font-size: 8px;
		color: var(--color-text-secondary);
		margin-top: calc(var(--spacing-unit) / 2);
		opacity: 1;
	}

	/* Mobile responsive - show only 2 main stats */
	@media (max-width: 768px) {
		.stats-overview {
			margin-bottom: calc(var(--spacing-unit) * 1.5);
		}

		.stats-header {
			margin-bottom: var(--spacing-unit);
		}

		.stats-title {
			font-size: 10px;
		}

		.stats-subtitle {
			font-size: 7px;
		}

		/* Hide extra stats on mobile */
		.hide-mobile {
			display: none;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: var(--spacing-unit);
		}

		.stat-card {
			padding: var(--spacing-unit);
		}

		.stat-icon {
			margin-bottom: 0;
		}

		.stat-value {
			font-size: 16px;
			margin-bottom: 0;
		}

		.stat-label {
			font-size: 7px;
			line-height: 1.3;
		}

		.loading {
			padding: calc(var(--spacing-unit) * 2);
		}

		.loading p {
			font-size: 8px;
		}
	}

	@media (max-width: 480px) {
		.stats-overview {
			margin-bottom: var(--spacing-unit);
		}

		.stats-grid {
			gap: calc(var(--spacing-unit) / 2);
		}

		.stat-card {
			padding: calc(var(--spacing-unit) * 0.8);
		}

		.stat-value {
			font-size: 14px;
		}

		.stat-label {
			font-size: 6px;
		}
	}
</style>
