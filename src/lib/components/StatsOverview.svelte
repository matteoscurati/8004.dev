<script lang="ts" module>
	// Module-level mount guard
	let isStatsOverviewMounted = false;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { searchAgents, type AgentResult } from '$lib/sdk';
	import PixelIcon from './PixelIcon.svelte';

	let loading = $state(true);
	let stats = $state({
		total: 0,
		active: 0,
		withMcp: 0,
		withA2a: 0,
		withX402: 0
	});

	onMount(async () => {
		// Prevent multiple mounts
		if (isStatsOverviewMounted) {
			console.warn('StatsOverview already mounted, skipping');
			return;
		}
		isStatsOverviewMounted = true;
		console.log('StatsOverview mounting for the first time');
		await loadStats();
	});

	async function loadStats() {
		loading = true;
		try {
			// Fetch large sample of agents (up to 500) for statistics
			// This will use cache if available
			const result = await searchAgents({}, 500);

			const agents = result.items;

			stats = {
				total: agents.length,
				active: agents.filter(a => a.active).length,
				withMcp: agents.filter(a => a.mcp).length,
				withA2a: agents.filter(a => a.a2a).length,
				withX402: agents.filter(a => a.x402support).length
			};
		} catch (error) {
			console.error('Failed to load stats:', error);
		} finally {
			loading = false;
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
		<div class="stats-grid">
			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="chart" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.total)}</div>
				<div class="stat-label">TOTAL AGENTS</div>
			</div>

			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="check" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.active)}</div>
				<div class="stat-label">ACTIVE</div>
			</div>

			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="tool" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.withMcp)}</div>
				<div class="stat-label">MCP PROTOCOL</div>
			</div>

			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="handshake" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.withA2a)}</div>
				<div class="stat-label">A2A PROTOCOL</div>
			</div>

			<div class="stat-card pixel-card">
				<div class="stat-icon"><PixelIcon type="dollar" size={32} /></div>
				<div class="stat-value">{formatNumber(stats.withX402)}</div>
				<div class="stat-label">PAYMENT READY</div>
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

	/* Mobile responsive */
	@media (max-width: 768px) {
		.stats-overview {
			margin-bottom: calc(var(--spacing-unit) * 3);
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: calc(var(--spacing-unit) * 1.5);
		}

		.stat-card {
			padding: calc(var(--spacing-unit) * 2);
		}

		.stat-value {
			font-size: 22px;
		}

		.stat-label {
			font-size: 9px;
		}

		.loading p {
			font-size: 9px;
		}
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-unit);
		}

		.stat-card {
			padding: calc(var(--spacing-unit) * 1.5);
		}

		.stat-icon {
			margin-bottom: calc(var(--spacing-unit) / 2);
		}

		.stat-value {
			font-size: 20px;
		}

		.stat-label {
			font-size: 8px;
		}
	}
</style>
