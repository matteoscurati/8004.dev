<script lang="ts">
	import type { AgentResult } from '$lib/sdk';
	import CapabilityBadge from './CapabilityBadge.svelte';
	// import ReputationDisplay from './ReputationDisplay.svelte';

	interface Props {
		agent: AgentResult;
	}

	let { agent }: Props = $props();
	let imageError = $state(false);

	// Generate deterministic pixel art based on agent ID
	function generatePixelArt(agentId: string): string {
		// Simple hash function for deterministic randomness
		function hashCode(str: string): number {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				hash = ((hash << 5) - hash) + str.charCodeAt(i);
				hash = hash & hash;
			}
			return Math.abs(hash);
		}

		const hash = hashCode(agentId);
		const gridSize = 8;
		const pixelSize = 8;
		const totalSize = gridSize * pixelSize;

		// Generate colors from hash
		const hue = hash % 360;
		const color1 = `hsl(${hue}, 70%, 50%)`;
		const color2 = `hsl(${(hue + 60) % 360}, 70%, 40%)`;
		const bgColor = `hsl(${hue}, 20%, 15%)`;

		// Generate symmetric pattern (mirror horizontally)
		const pattern: boolean[][] = [];
		for (let y = 0; y < gridSize; y++) {
			pattern[y] = [];
			for (let x = 0; x < Math.ceil(gridSize / 2); x++) {
				const index = y * gridSize + x;
				const random = (hash * (index + 1) * 2654435761) % 2147483648;
				pattern[y][x] = random % 2 === 0;
			}
			// Mirror to create symmetric pattern
			for (let x = Math.ceil(gridSize / 2); x < gridSize; x++) {
				pattern[y][x] = pattern[y][gridSize - 1 - x];
			}
		}

		// Generate SVG
		let pixels = '';
		for (let y = 0; y < gridSize; y++) {
			for (let x = 0; x < gridSize; x++) {
				if (pattern[y][x]) {
					// Alternate colors for variety
					const color = ((x + y) % 2 === 0) ? color1 : color2;
					pixels += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
				}
			}
		}

		return `data:image/svg+xml,${encodeURIComponent(`
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
				<rect width="${totalSize}" height="${totalSize}" fill="${bgColor}"/>
				${pixels}
			</svg>
		`)}`;
	}

	function handleImageError() {
		imageError = true;
	}
</script>

<div class="agent-card pixel-card">
	<div class="agent-header">
		{#if agent.imageUrl && !imageError}
			<img
				src={agent.imageUrl}
				alt={agent.name}
				class="agent-image"
				loading="lazy"
				onerror={handleImageError}
			/>
		{:else}
			<img
				src={generatePixelArt(agent.id)}
				alt={`${agent.name} generated avatar`}
				class="agent-image pixel-avatar"
				loading="lazy"
			/>
		{/if}
		<div class="agent-info">
			<h3 class="agent-name">{agent.name}</h3>
			<p class="agent-id">ID: {agent.id}</p>
		</div>
	</div>

	{#if agent.description}
		<p class="agent-description">{agent.description}</p>
	{/if}

	<div class="agent-capabilities">
		{#if agent.mcpTools && agent.mcpTools.length > 0}
			<div class="capability-section">
				<h4>MCP Tools:</h4>
				<div class="tags">
					{#each agent.mcpTools as tool}
						<CapabilityBadge capability={tool} type="mcp" />
					{/each}
				</div>
			</div>
		{/if}

		{#if agent.a2aSkills && agent.a2aSkills.length > 0}
			<div class="capability-section">
				<h4>A2A Skills:</h4>
				<div class="tags">
					{#each agent.a2aSkills as skill}
						<CapabilityBadge capability={skill} type="a2a" />
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="agent-status">
		<span class="status-badge {agent.active ? 'active' : 'inactive'}">
			{agent.active ? '● ACTIVE' : '○ INACTIVE'}
		</span>
		{#if agent.mcp}
			<span class="status-badge protocol-mcp">MCP</span>
		{/if}
		{#if agent.a2a}
			<span class="status-badge protocol-a2a">A2A</span>
		{/if}
		{#if agent.x402support}
			<span class="status-badge x402">x402</span>
		{/if}
	</div>

	{#if agent.supportedTrusts && agent.supportedTrusts.length > 0}
		<div class="trust-section">
			<h4>Trust Models:</h4>
			<div class="tags">
				{#each agent.supportedTrusts as trust}
					<span class="tag trust-tag">{trust}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Blockchain information (NEW in SDK v0.2.2) -->
	{#if agent.owners && agent.owners.length > 0}
		<div class="blockchain-section">
			<h4>Owner{agent.owners.length > 1 ? 's' : ''}:</h4>
			<div class="addresses">
				{#each agent.owners as owner}
					<code class="address">{owner}</code>
				{/each}
			</div>
		</div>
	{/if}

	{#if agent.operators && agent.operators.length > 0}
		<div class="blockchain-section">
			<h4>Operator{agent.operators.length > 1 ? 's' : ''}:</h4>
			<div class="addresses">
				{#each agent.operators as operator}
					<code class="address">{operator}</code>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Reputation temporarily disabled - SDK contract method not available on Sepolia -->
	<!-- <ReputationDisplay agentId={agent.id} /> -->
</div>

<style>
	.agent-card {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-unit) * 2);
		transition: all 0.2s;
	}

	.agent-header {
		display: flex;
		gap: calc(var(--spacing-unit) * 2);
		align-items: flex-start;
	}

	.agent-image {
		width: 64px;
		height: 64px;
		border: 3px solid var(--color-border);
		image-rendering: pixelated;
		flex-shrink: 0;
		object-fit: cover;
		background: linear-gradient(
			90deg,
			rgba(0, 255, 65, 0.05) 0%,
			rgba(0, 255, 65, 0.1) 50%,
			rgba(0, 255, 65, 0.05) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -100% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	.agent-image.pixel-avatar {
		image-rendering: pixelated;
		background-color: transparent;
		animation: none;
	}

	.agent-info {
		flex: 1;
		min-width: 0;
	}

	.agent-name {
		font-size: 14px;
		margin-bottom: calc(var(--spacing-unit));
		word-break: break-word;
	}

	.agent-id {
		font-size: 8px;
		color: var(--color-text-secondary);
		word-break: break-all;
	}

	.agent-description {
		font-size: 9px;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.capability-section {
		margin-bottom: calc(var(--spacing-unit));
	}

	.capability-section h4 {
		font-size: 9px;
		margin-bottom: calc(var(--spacing-unit) / 2);
		color: var(--color-text);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--spacing-unit) / 2);
	}

	.tag {
		font-size: 8px;
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid;
		background-color: var(--color-bg);
	}

	.agent-status {
		display: flex;
		gap: var(--spacing-unit);
		flex-wrap: wrap;
		margin-top: auto;
	}

	.status-badge {
		font-size: 8px;
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 2px solid;
	}

	.status-badge.active {
		border-color: var(--color-text);
		color: var(--color-text);
		background-color: rgba(0, 255, 65, 0.1);
	}

	.status-badge.inactive {
		border-color: var(--color-text-secondary);
		color: var(--color-text-secondary);
		opacity: 0.5;
	}

	.status-badge.x402 {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background-color: rgba(255, 0, 255, 0.1);
	}

	.status-badge.protocol-mcp {
		border-color: #00d4ff;
		color: #00d4ff;
		background-color: rgba(0, 212, 255, 0.1);
	}

	.status-badge.protocol-a2a {
		border-color: #ff9500;
		color: #ff9500;
		background-color: rgba(255, 149, 0, 0.1);
	}

	.trust-section {
		margin-top: calc(var(--spacing-unit));
	}

	.trust-section h4 {
		font-size: 9px;
		margin-bottom: calc(var(--spacing-unit) / 2);
		color: var(--color-text);
	}

	.trust-tag {
		border-color: #ffdd00;
		color: #ffdd00;
	}

	.blockchain-section {
		margin-top: calc(var(--spacing-unit));
		padding-top: calc(var(--spacing-unit));
		border-top: 1px solid var(--color-border);
	}

	.blockchain-section h4 {
		font-size: 9px;
		margin-bottom: calc(var(--spacing-unit) / 2);
		color: var(--color-text-secondary);
	}

	.addresses {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-unit) / 2);
	}

	.address {
		font-size: 7px;
		font-family: 'Courier New', monospace;
		color: var(--color-text-secondary);
		background-color: rgba(0, 0, 0, 0.3);
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		border: 1px solid var(--color-border);
		word-break: break-all;
		display: block;
	}
</style>
