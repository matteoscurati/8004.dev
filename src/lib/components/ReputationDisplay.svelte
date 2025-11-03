<script lang="ts">
	import { onMount } from 'svelte';
	import { getAgentReputation, type ReputationSummary } from '$lib/sdk';

	interface Props {
		agentId: string;
	}

	let { agentId }: Props = $props();

	let reputation = $state<ReputationSummary | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			reputation = await getAgentReputation(agentId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load reputation';
			console.error('Error loading reputation:', e);
		} finally {
			loading = false;
		}
	});

	function getScoreColor(score: number): string {
		if (score >= 4) return 'var(--color-text)';
		if (score >= 3) return 'var(--color-text-secondary)';
		if (score >= 2) return 'var(--color-accent)';
		return '#ff4444';
	}

	function renderStars(score: number): string {
		const fullStars = Math.floor(score);
		const hasHalfStar = score % 1 >= 0.5;
		const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

		return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
	}
</script>

<div class="reputation-display">
	{#if loading}
		<div class="loading-reputation">
			<div class="pixel-spinner"></div>
			<span>Loading reputation...</span>
		</div>
	{:else if error}
		<div class="error-reputation">
			<span>⚠ {error}</span>
		</div>
	{:else if reputation}
		<div class="reputation-content">
			<div class="reputation-header">
				<span class="reputation-label">REPUTATION:</span>
				<span class="reputation-score" style="color: {getScoreColor(reputation.averageScore)}">
					{reputation.averageScore.toFixed(1)} / 5.0
				</span>
			</div>

			<div class="reputation-stars" style="color: {getScoreColor(reputation.averageScore)}">
				{renderStars(reputation.averageScore)}
			</div>

			<div class="reputation-stats">
				<span class="stat">
					<span class="stat-label">Total:</span>
					<span class="stat-value">{reputation.totalFeedback}</span>
				</span>
				<span class="stat positive">
					<span class="stat-label">↑</span>
					<span class="stat-value">{reputation.positiveCount}</span>
				</span>
				<span class="stat negative">
					<span class="stat-label">↓</span>
					<span class="stat-value">{reputation.negativeCount}</span>
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.reputation-display {
		border-top: 2px solid var(--color-border);
		padding-top: calc(var(--spacing-unit) * 1.5);
	}

	.loading-reputation {
		display: flex;
		align-items: center;
		gap: var(--spacing-unit);
		font-size: 8px;
		color: var(--color-text-secondary);
	}

	.error-reputation {
		font-size: 8px;
		color: #ff4444;
	}

	.reputation-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-unit);
	}

	.reputation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.reputation-label {
		font-size: 9px;
		color: var(--color-text-secondary);
	}

	.reputation-score {
		font-size: 12px;
		font-weight: bold;
	}

	.reputation-stars {
		font-size: 16px;
		letter-spacing: 2px;
		text-align: center;
	}

	.reputation-stats {
		display: flex;
		gap: calc(var(--spacing-unit) * 1.5);
		justify-content: center;
		font-size: 8px;
	}

	.stat {
		display: flex;
		gap: calc(var(--spacing-unit) / 2);
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid var(--color-border);
		background-color: var(--color-bg);
	}

	.stat.positive {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	.stat.negative {
		border-color: #ff4444;
		color: #ff4444;
	}

	.stat-label {
		opacity: 0.7;
	}

	.stat-value {
		font-weight: bold;
	}
</style>
