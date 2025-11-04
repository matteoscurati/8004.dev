<script lang="ts">
	import { onMount } from 'svelte';
	import type { SearchFilters } from '$lib/sdk';

	interface Props {
		onSearch: (filters: SearchFilters) => void;
		initialFilters?: SearchFilters;
	}

	let { onSearch, initialFilters = {} }: Props = $props();

	let name = $state('');
	let mcpToolsInput = $state('');
	let a2aSkillsInput = $state('');
	let supportedTrustInput = $state('');
	let mcpOnly = $state(false);
	let a2aOnly = $state(false);
	let activeOnly = $state(false);
	let x402Only = $state(false);
	let filtersExpanded = $state(false);

	// Initialize filters from URL parameters
	onMount(() => {
		if (initialFilters.name) name = initialFilters.name;
		if (initialFilters.mcpTools) mcpToolsInput = initialFilters.mcpTools.join(', ');
		if (initialFilters.a2aSkills) a2aSkillsInput = initialFilters.a2aSkills.join(', ');
		if (initialFilters.supportedTrust) supportedTrustInput = initialFilters.supportedTrust.join(', ');
		if (initialFilters.mcp) mcpOnly = true;
		if (initialFilters.a2a) a2aOnly = true;
		if (initialFilters.active) activeOnly = true;
		if (initialFilters.x402support) x402Only = true;

		// Expand filters section if any filter is active
		if (
			initialFilters.mcpTools?.length ||
			initialFilters.a2aSkills?.length ||
			initialFilters.supportedTrust?.length ||
			initialFilters.mcp ||
			initialFilters.a2a ||
			initialFilters.active ||
			initialFilters.x402support
		) {
			filtersExpanded = true;
		}
	});

	function buildFilters(): SearchFilters {
		const filters: SearchFilters = {};

		if (name.trim()) filters.name = name.trim();
		if (mcpToolsInput.trim()) {
			filters.mcpTools = mcpToolsInput.split(',').map((t) => t.trim()).filter(Boolean);
		}
		if (a2aSkillsInput.trim()) {
			filters.a2aSkills = a2aSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
		}
		if (supportedTrustInput.trim()) {
			filters.supportedTrust = supportedTrustInput.split(',').map((t) => t.trim()).filter(Boolean);
		}
		if (mcpOnly) filters.mcp = true;
		if (a2aOnly) filters.a2a = true;
		if (activeOnly) filters.active = true;
		if (x402Only) filters.x402support = true;

		return filters;
	}

	function handleSearch() {
		onSearch(buildFilters());
	}

	function handleApplyFilters() {
		onSearch(buildFilters());
	}

	function hasActiveFilters(): boolean {
		return (
			mcpToolsInput.trim() !== '' ||
			a2aSkillsInput.trim() !== '' ||
			supportedTrustInput.trim() !== '' ||
			mcpOnly ||
			a2aOnly ||
			activeOnly ||
			x402Only
		);
	}

	function handleReset() {
		name = '';
		mcpToolsInput = '';
		a2aSkillsInput = '';
		supportedTrustInput = '';
		mcpOnly = false;
		a2aOnly = false;
		activeOnly = false;
		x402Only = false;
		onSearch({});
	}
</script>

<!-- Search Bar -->
<div class="search-bar pixel-card">
	<h2 class="section-title">[ SEARCH ]</h2>
	<div class="search-input-wrapper">
		<input
			id="name"
			type="text"
			class="pixel-input search-input"
			bind:value={name}
			placeholder="Search by agent name..."
			onkeypress={(e) => e.key === 'Enter' && handleSearch()}
		/>
		<button class="pixel-button search-button" onclick={handleSearch}>
			&gt; SEARCH
		</button>
	</div>
</div>

<!-- Filters -->
<div class="filters-section pixel-card">
	<div class="filters-header">
		<h2 class="section-title">
			[ FILTERS ]
			{#if hasActiveFilters() && !filtersExpanded}
				<span class="active-badge">●</span>
			{/if}
		</h2>
		<button class="toggle-button" onclick={() => (filtersExpanded = !filtersExpanded)}>
			<span class="toggle-icon">{filtersExpanded ? '▼' : '▶'}</span>
			<span class="toggle-text">{filtersExpanded ? 'HIDE' : 'SHOW'}</span>
		</button>
	</div>

	{#if filtersExpanded}
		<div class="filter-grid">
		<div class="filter-group">
			<label for="network">Network:</label>
			<div class="network-selector">
				<input
					id="network"
					type="text"
					class="pixel-input"
					value="Sepolia Testnet"
					disabled
					readonly
				/>
				<span class="network-note">More networks coming soon</span>
			</div>
		</div>
		<div class="filter-group">
			<label for="mcpTools">MCP Tools:</label>
			<input
				id="mcpTools"
				type="text"
				class="pixel-input"
				bind:value={mcpToolsInput}
				placeholder="e.g. github, postgres, slack..."
				onkeypress={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<span class="help-text">Comma-separated. Examples: github, postgres, puppeteer</span>
		</div>

		<div class="filter-group">
			<label for="a2aSkills">A2A Skills:</label>
			<input
				id="a2aSkills"
				type="text"
				class="pixel-input"
				bind:value={a2aSkillsInput}
				placeholder="e.g. data-analysis, payment-processing..."
				onkeypress={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<span class="help-text">Comma-separated. Examples: python, code-generation, data-analysis</span>
		</div>

		<div class="filter-group">
			<label for="supportedTrust">Trust Models:</label>
			<input
				id="supportedTrust"
				type="text"
				class="pixel-input"
				bind:value={supportedTrustInput}
				placeholder="e.g. reputation, crypto-economic..."
				onkeypress={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<span class="help-text">Comma-separated. Examples: reputation, crypto-economic</span>
		</div>

		<div class="filter-checkboxes">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={mcpOnly} />
				<span class="checkbox-custom"></span>
				<span>MCP Enabled Only</span>
			</label>

			<label class="checkbox-label">
				<input type="checkbox" bind:checked={a2aOnly} />
				<span class="checkbox-custom"></span>
				<span>A2A Enabled Only</span>
			</label>

			<label class="checkbox-label">
				<input type="checkbox" bind:checked={activeOnly} />
				<span class="checkbox-custom"></span>
				<span>Active Agents Only</span>
			</label>

			<label class="checkbox-label">
				<input type="checkbox" bind:checked={x402Only} />
				<span class="checkbox-custom"></span>
				<span>x402 Support Only</span>
			</label>
		</div>
		</div>

		<div class="filter-actions">
			<button class="pixel-button" onclick={handleApplyFilters}>
				&gt; APPLY FILTERS
			</button>
			<button class="pixel-button reset-button" onclick={handleReset}>
				&gt; RESET ALL
			</button>
		</div>
	{/if}
</div>

<style>
	.search-bar {
		margin-bottom: calc(var(--spacing-unit) * 3);
	}

	.filters-section {
		margin-bottom: calc(var(--spacing-unit) * 3);
	}

	.section-title {
		font-size: 16px;
		margin: 0;
		color: var(--color-text);
	}

	.filters-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.toggle-button {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		cursor: pointer;
		padding: var(--spacing-unit);
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) / 2);
		line-height: 1;
		vertical-align: middle;
	}

	.toggle-button:hover {
		color: var(--color-text);
		text-shadow: 0 0 10px var(--color-text);
	}

	.toggle-icon {
		display: inline-block;
		transform: translateY(-1px);
	}

	.toggle-text {
		display: inline-block;
	}

	.active-badge {
		color: var(--color-primary);
		margin-left: calc(var(--spacing-unit) * 2);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.search-input-wrapper {
		display: flex;
		gap: calc(var(--spacing-unit) * 2);
		align-items: stretch;
	}

	.search-input {
		flex: 1;
		font-size: 12px;
	}

	.search-button {
		flex-shrink: 0;
		min-width: 120px;
	}

	.filter-grid {
		display: grid;
		gap: calc(var(--spacing-unit) * 2);
		margin-bottom: calc(var(--spacing-unit) * 2);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-unit);
	}

	.filter-group label {
		font-size: 10px;
		color: var(--color-text-secondary);
	}

	.network-selector {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-unit) / 2);
	}

	.network-selector input:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		color: var(--color-text-secondary);
		border-color: var(--color-text-secondary);
	}

	.network-note {
		font-size: 7px;
		color: var(--color-text-secondary);
		opacity: 0.7;
		font-style: italic;
	}

	.help-text {
		font-size: 8px;
		color: var(--color-text-secondary);
		opacity: 0.7;
	}

	.filter-checkboxes {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-unit) * 1.5);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--spacing-unit);
		cursor: pointer;
		font-size: 10px;
		position: relative;
	}

	.checkbox-label input[type='checkbox'] {
		position: absolute;
		opacity: 0;
		cursor: pointer;
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 3px solid var(--color-border);
		background-color: var(--color-bg);
		position: relative;
		flex-shrink: 0;
	}

	.checkbox-label input[type='checkbox']:checked + .checkbox-custom::after {
		content: 'X';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: var(--color-text);
		font-size: 14px;
	}

	.checkbox-label:hover .checkbox-custom {
		box-shadow: 0 0 10px var(--color-text);
	}

	.filter-actions {
		display: flex;
		gap: calc(var(--spacing-unit) * 2);
		justify-content: center;
	}

	.reset-button {
		background-color: var(--color-bg);
		border-color: var(--color-text-secondary);
		color: var(--color-text-secondary);
	}

	.reset-button:hover {
		background-color: var(--color-text-secondary);
		color: var(--color-bg);
	}

	@media (min-width: 768px) {
		.filter-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.filter-checkboxes {
			grid-column: span 2;
			flex-direction: row;
			gap: calc(var(--spacing-unit) * 3);
		}

		.filter-group:first-child {
			grid-column: span 2;
		}
	}
</style>
