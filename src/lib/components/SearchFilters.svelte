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
	let ownersInput = $state('');
	let operatorsInput = $state('');
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
		if (initialFilters.owners) ownersInput = initialFilters.owners.join(', ');
		if (initialFilters.operators) operatorsInput = initialFilters.operators.join(', ');
		if (initialFilters.mcp) mcpOnly = true;
		if (initialFilters.a2a) a2aOnly = true;
		if (initialFilters.active) activeOnly = true;
		if (initialFilters.x402support) x402Only = true;

		// Expand filters section if any filter is active
		if (
			initialFilters.mcpTools?.length ||
			initialFilters.a2aSkills?.length ||
			initialFilters.supportedTrust?.length ||
			initialFilters.owners?.length ||
			initialFilters.operators?.length ||
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
		if (ownersInput.trim()) {
			filters.owners = ownersInput.split(',').map((o) => o.trim()).filter(Boolean);
		}
		if (operatorsInput.trim()) {
			filters.operators = operatorsInput.split(',').map((o) => o.trim()).filter(Boolean);
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
			ownersInput.trim() !== '' ||
			operatorsInput.trim() !== '' ||
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
		ownersInput = '';
		operatorsInput = '';
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
		<div class="filters-title-wrapper">
			<h2 class="section-title">[ FILTERS ]</h2>
			{#if hasActiveFilters() && !filtersExpanded}
				<span class="active-indicator">ACTIVE</span>
			{/if}
		</div>
		<button class="toggle-button" onclick={() => (filtersExpanded = !filtersExpanded)}>
			<span class="toggle-icon">{filtersExpanded ? '▼' : '▶'}</span>
			<span class="toggle-text">{filtersExpanded ? 'HIDE' : 'SHOW'}</span>
		</button>
	</div>

	{#if filtersExpanded}
		<div class="filter-grid">
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

		<div class="filter-group">
			<label for="owners">Owner Addresses:</label>
			<input
				id="owners"
				type="text"
				class="pixel-input"
				bind:value={ownersInput}
				placeholder="e.g. 0x123..., 0xabc..."
				onkeypress={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<span class="help-text">Comma-separated. Filter agents by owner wallet address</span>
		</div>

		<div class="filter-group">
			<label for="operators">Operator Addresses:</label>
			<input
				id="operators"
				type="text"
				class="pixel-input"
				bind:value={operatorsInput}
				placeholder="e.g. 0x456..., 0xdef..."
				onkeypress={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<span class="help-text">Comma-separated. Filter agents by operator wallet address</span>
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

	.filters-title-wrapper {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) * 2);
	}

	.active-indicator {
		font-size: 8px;
		color: var(--color-text);
		background-color: var(--color-primary);
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid var(--color-primary);
		animation: pulse 2s infinite;
		box-shadow: 0 0 10px var(--color-primary);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			box-shadow: 0 0 10px var(--color-primary);
		}
		50% {
			opacity: 0.8;
			box-shadow: 0 0 5px var(--color-primary);
		}
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
		flex-shrink: 0;
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
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.section-title {
			font-size: 12px;
		}

		.search-input-wrapper {
			flex-direction: column;
			gap: calc(var(--spacing-unit) * 1.5);
		}

		.search-button {
			width: 100%;
		}

		.toggle-button {
			font-size: 9px;
		}

		.checkbox-label {
			font-size: 10px;
		}

		.help-text {
			font-size: 9px;
		}

		.filter-actions {
			flex-direction: column;
			gap: calc(var(--spacing-unit) * 1.5);
		}

		.filter-actions button {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.section-title {
			font-size: 11px;
		}

		.toggle-button {
			font-size: 8px;
		}

		.checkbox-label {
			font-size: 9px;
		}
	}
</style>
