<script lang="ts">
	import { SUPPORTED_CHAINS, CHAIN_IDS } from '$lib/constants/chains';
	import type { AgentResult } from '$lib/sdk';

	interface Props {
		allAgents: AgentResult[]; // All agents (unfiltered) for counting
		selectedChains: number[] | 'all';
		onSelectionChange: (chains: number[] | 'all') => void;
		loading?: boolean; // Optional loading state
	}

	let { allAgents, selectedChains, onSelectionChange, loading = false }: Props = $props();

	// Calculate total agents count (sum of all chains)
	let totalAgentsCount = $derived(allAgents.length);

	// Calculate chain counts from ALL agents (not filtered)
	let chainCounts = $derived.by(() => {
		const counts: Record<number, number> = {};
		CHAIN_IDS.forEach(id => counts[id] = 0);

		allAgents.forEach(agent => {
			if (agent.chainId && counts[agent.chainId] !== undefined) {
				counts[agent.chainId]++;
			}
		});

		return counts;
	});

	// Check if a chain is selected
	function isChainSelected(chainId: number | 'all'): boolean {
		if (chainId === 'all') {
			// ALL badge is selected ONLY when selectedChains is 'all'
			// (not when all chains are individually selected)
			return selectedChains === 'all';
		}
		// Individual chain badges are selected ONLY when in array mode
		// (not when selectedChains is 'all')
		return Array.isArray(selectedChains) && selectedChains.includes(chainId);
	}

	// Handle badge click
	function handleBadgeClick(chainId: number | 'all') {
		if (chainId === 'all') {
			onSelectionChange('all');
		} else {
			// Toggle individual chain
			if (selectedChains === 'all') {
				// If "all" was selected, select only this chain
				onSelectionChange([chainId]);
			} else if (Array.isArray(selectedChains)) {
				const isSelected = selectedChains.includes(chainId);

				if (isSelected) {
					// Deselect this chain
					const newSelection = selectedChains.filter(id => id !== chainId);
					if (newSelection.length === 0) {
						// If no chains selected, select all
						onSelectionChange('all');
					} else {
						onSelectionChange(newSelection);
					}
				} else {
					// Select this chain
					const newSelection = [...selectedChains, chainId];
					if (newSelection.length === CHAIN_IDS.length) {
						// If all chains selected, switch to "all"
						onSelectionChange('all');
					} else {
						onSelectionChange(newSelection);
					}
				}
			}
		}
	}
</script>

<div class="chain-badge-filters">
	<!-- All Chains Badge -->
	<button
		class="chain-badge"
		class:selected={isChainSelected('all')}
		onclick={() => handleBadgeClick('all')}
		style="--chain-color: #FFFFFF"
	>
		<span class="chain-icon">◉</span>
		<span class="chain-name">ALL</span>
		<span class="chain-count">{loading ? '...' : totalAgentsCount}</span>
	</button>

	<!-- Individual Chain Badges -->
	{#each CHAIN_IDS as chainId}
		{@const config = SUPPORTED_CHAINS[chainId]}
		{@const count = chainCounts[chainId] || 0}
		<button
			class="chain-badge"
			class:selected={isChainSelected(chainId)}
			onclick={() => handleBadgeClick(chainId)}
			style="--chain-color: {config.color}"
		>
			<span class="chain-icon">{config.icon}</span>
			<span class="chain-name">{config.shortName}</span>
			<span class="chain-count">{loading ? '...' : count}</span>
		</button>
	{/each}
</div>

<style>
	.chain-badge-filters {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--spacing-unit) * 1.5);
		margin-top: calc(var(--spacing-unit) * 2);
		margin-bottom: calc(var(--spacing-unit) * 2);
		justify-content: center;
	}

	.chain-badge {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) * 1);
		padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2.5);
		background-color: rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(128, 128, 128, 0.3);
		color: var(--color-text);
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		opacity: 0.5;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.chain-badge:hover {
		opacity: 0.8;
		box-shadow: 0 0 10px var(--chain-color);
		transform: translateY(-2px);
		border-color: var(--chain-color);
	}

	.chain-badge.selected {
		opacity: 1 !important;
		background-color: rgba(0, 0, 0, 0.7) !important;
		box-shadow:
			0 0 5px var(--chain-color),
			0 2px 4px rgba(0, 0, 0, 0.5) !important;
		border: 3px solid var(--chain-color) !important;
		transform: scale(1.05) translateY(-1px) !important;
	}

	.chain-badge.selected .chain-name,
	.chain-badge.selected .chain-count {
		color: var(--chain-color) !important;
		text-shadow: 0 0 3px var(--chain-color);
		font-weight: bold;
	}

	.chain-badge.selected .chain-icon {
		filter: drop-shadow(0 0 2px var(--chain-color));
	}

	.chain-icon {
		font-size: 12px;
		flex-shrink: 0;
		line-height: 12px;
		height: 12px;
		display: flex;
		align-items: center;
	}

	.chain-name {
		font-size: 9px;
		color: var(--color-text);
		flex-shrink: 0;
		line-height: 12px;
		height: 12px;
		display: flex;
		align-items: center;
	}

	.chain-count {
		font-size: 9px;
		color: var(--chain-color);
		font-weight: bold;
		margin-left: calc(var(--spacing-unit) * 0.5);
		line-height: 12px;
		height: 12px;
		display: flex;
		align-items: center;
	}

	/* Hover effects */
	.chain-badge::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, transparent 0%, var(--chain-color) 100%);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.chain-badge:hover::before {
		opacity: 0.1;
	}

	.chain-badge.selected::before {
		opacity: 0.15;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.chain-badge-filters {
			gap: var(--spacing-unit);
		}

		.chain-badge {
			padding: calc(var(--spacing-unit) * 0.8) calc(var(--spacing-unit) * 1.5);
			font-size: 7px;
		}

		.chain-name {
			font-size: 8px;
		}

		.chain-count {
			font-size: 8px;
		}

		.chain-icon {
			font-size: 10px;
			line-height: 10px;
			height: 10px;
		}

		.chain-name,
		.chain-count {
			line-height: 10px;
			height: 10px;
		}
	}
</style>
