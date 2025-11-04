<script lang="ts">
	import { getCapabilityMetadata, getCategoryColor } from '$lib/data/capabilities-metadata';
	import type { CapabilityMetadata } from '$lib/data/capabilities-metadata';

	interface Props {
		capability: string;
		type: 'mcp' | 'a2a';
	}

	let { capability, type }: Props = $props();

	const metadata: CapabilityMetadata = getCapabilityMetadata(capability, type);
	const categoryColor = getCategoryColor(metadata.category);
</script>

<div class="capability-badge" style="--category-color: {categoryColor}">
	<span class="badge-icon">{metadata.icon}</span>
	<span class="badge-text">{capability}</span>

	<!-- Tooltip -->
	<div class="tooltip pixel-card">
		<div class="tooltip-header">
			<span class="tooltip-icon">{metadata.icon}</span>
			<strong>{metadata.name}</strong>
		</div>

		<div class="tooltip-section">
			<div class="tooltip-label">DESCRIPTION</div>
			<p>{metadata.description}</p>
		</div>

		{#if metadata.examples && metadata.examples.length > 0}
			<div class="tooltip-section">
				<div class="tooltip-label">EXAMPLES</div>
				<ul>
					{#each metadata.examples as example}
						<li>{example}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="tooltip-section">
			<div class="tooltip-label">CATEGORY</div>
			<span class="category-tag" style="color: {categoryColor}; border-color: {categoryColor}">
				{metadata.category.toUpperCase()}
			</span>
		</div>

		{#if metadata.docUrl}
			<div class="tooltip-section">
				<a href={metadata.docUrl} target="_blank" rel="noopener noreferrer" class="doc-link">
					📖 View Documentation →
				</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.capability-badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
		font-size: 8px;
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid var(--category-color);
		background-color: var(--color-bg);
		color: var(--category-color);
		cursor: help;
		transition: all 0.2s;
		user-select: none;
	}

	.capability-badge:hover {
		background-color: rgba(255, 255, 255, 0.05);
		box-shadow: 0 0 8px var(--category-color);
		transform: translateY(-1px);
	}

	.badge-icon {
		font-size: 10px;
		line-height: 1;
		filter: grayscale(0.3);
	}

	.badge-text {
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Tooltip */
	.tooltip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		width: 280px;
		padding: calc(var(--spacing-unit) * 2);
		background-color: var(--color-bg);
		border: 3px solid var(--category-color);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
		z-index: 1000;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.2s, visibility 0.2s;
		pointer-events: none;
		font-size: 9px;
		line-height: 1.4;
	}

	.capability-badge:hover .tooltip {
		opacity: 1;
		visibility: visible;
	}

	/* Arrow */
	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: var(--category-color);
	}

	.tooltip-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-unit);
		margin-bottom: calc(var(--spacing-unit) * 1.5);
		font-size: 10px;
		color: var(--color-text);
		border-bottom: 2px solid var(--category-color);
		padding-bottom: var(--spacing-unit);
	}

	.tooltip-icon {
		font-size: 16px;
		filter: none;
	}

	.tooltip-section {
		margin-bottom: calc(var(--spacing-unit) * 1.5);
	}

	.tooltip-section:last-child {
		margin-bottom: 0;
	}

	.tooltip-label {
		font-size: 7px;
		font-weight: bold;
		color: var(--category-color);
		margin-bottom: calc(var(--spacing-unit) / 2);
		letter-spacing: 1px;
	}

	.tooltip-section p {
		margin: 0;
		color: var(--color-text-secondary);
	}

	.tooltip-section ul {
		margin: 0;
		padding-left: calc(var(--spacing-unit) * 2);
		color: var(--color-text-secondary);
	}

	.tooltip-section li {
		margin-bottom: calc(var(--spacing-unit) / 2);
	}

	.category-tag {
		display: inline-block;
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid;
		font-size: 7px;
		font-weight: bold;
		letter-spacing: 0.5px;
	}

	.doc-link {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
		color: var(--category-color);
		text-decoration: none;
		font-size: 8px;
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid var(--category-color);
		transition: all 0.2s;
	}

	.doc-link:hover {
		background-color: var(--category-color);
		color: var(--color-bg);
	}

	/* Responsive positioning for tooltips near edges */
	@media (max-width: 768px) {
		.tooltip {
			width: 240px;
			font-size: 8px;
		}
	}

	/* If tooltip would overflow left/right edge, adjust */
	.capability-badge:first-child .tooltip {
		left: 0;
		transform: translateX(0);
	}

	.capability-badge:last-child .tooltip {
		left: auto;
		right: 0;
		transform: translateX(0);
	}
</style>
