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
			// ALL badge is selected if:
			// 1. selectedChains is 'all', OR
			// 2. All individual chains are selected
			if (selectedChains === 'all') return true;
			if (Array.isArray(selectedChains) && selectedChains.length === CHAIN_IDS.length) {
				return CHAIN_IDS.every(id => selectedChains.includes(id));
			}
			return false;
		}
		return selectedChains === 'all' || (Array.isArray(selectedChains) && selectedChains.includes(chainId));
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
					} else if (newSelection.length === CHAIN_IDS.length) {
						// If all chains selected, switch to "all"
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
		style="--chain-color: var(--color-primary)"
	>
		<span class="chain-icon">🌐</span>
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
		padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
		background-color: var(--color-bg);
		border: 2px solid var(--chain-color);
		color: var(--color-text);
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		opacity: 0.6;
	}

	.chain-badge:hover {
		opacity: 1;
		box-shadow: 0 0 10px var(--chain-color);
		transform: translateY(-2px);
	}

	.chain-badge.selected {
		opacity: 1;
		background-color: rgba(var(--chain-color-rgb, 98, 126, 234), 0.2);
		box-shadow: 0 0 15px var(--chain-color);
		border-width: 3px;
	}

	.chain-icon {
		font-size: 12px;
		flex-shrink: 0;
	}

	.chain-name {
		font-size: 9px;
		color: var(--color-text);
		flex-shrink: 0;
	}

	.chain-count {
		font-size: 9px;
		color: var(--chain-color);
		font-weight: bold;
		margin-left: calc(var(--spacing-unit) * 0.5);
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
		}
	}
</style>
