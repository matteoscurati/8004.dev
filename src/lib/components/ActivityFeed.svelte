<script lang="ts" module>
	// Module-level mount guard
	let isActivityFeedMounted = false;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { ActivityEvent } from '$lib/services/activity-tracker';
	import PixelIcon from './PixelIcon.svelte';

	let events = $state<ActivityEvent[]>([]);
	let isTracking = $state(false);
	let soundEnabled = $state(false);
	let collapsed = $state(false);

	function toggleCollapse() {
		collapsed = !collapsed;
	}

	onMount(() => {
		// Prevent multiple mounts
		if (isActivityFeedMounted) {
			console.warn('ActivityFeed already mounted, skipping');
			return;
		}
		isActivityFeedMounted = true;
		console.log('ActivityFeed mounting - waiting for new API service');
	});

	function getEventIconType(type: ActivityEvent['type']): 'robot' | 'lightning' | 'refresh' | 'dollar' | 'dot' {
		switch (type) {
			case 'agent_registered':
				return 'robot';
			case 'capability_added':
				return 'lightning';
			case 'status_changed':
				return 'refresh';
			case 'x402_enabled':
				return 'dollar';
			default:
				return 'dot';
		}
	}

	function getEventLabel(event: ActivityEvent): string {
		switch (event.type) {
			case 'agent_registered':
				return 'NEW AGENT REGISTERED';
			case 'capability_added':
				return event.metadata?.capabilityType === 'mcp'
					? 'MCP TOOL ADDED'
					: 'A2A SKILL ADDED';
			case 'status_changed':
				return event.metadata?.currentStatus ? 'AGENT ACTIVATED' : 'AGENT DEACTIVATED';
			case 'x402_enabled':
				return 'x402 SUPPORT ENABLED';
			default:
				return 'ACTIVITY';
		}
	}

	function getEventDetail(event: ActivityEvent): string | null {
		if (event.type === 'capability_added' && event.metadata?.capability) {
			return event.metadata.capability;
		}
		return null;
	}

	function formatTimestamp(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;

		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		if (seconds > 0) return `${seconds}s ago`;
		return 'just now';
	}

	function clearHistory() {
		// Disabled - waiting for new API service
	}

	function toggleSound() {
		// Disabled - waiting for new API service
	}
</script>

<div class="activity-feed pixel-card">
	<div class="feed-header">
		<h3>[ LIVE ACTIVITY FEED ]</h3>
		<div class="feed-controls">
			{#if isTracking}
				<span class="tracking-indicator">● TRACKING</span>
			{/if}
			<button
				class="sound-button"
				onclick={toggleSound}
				title={soundEnabled ? 'Disable sound' : 'Enable sound'}
			>
				<PixelIcon type={soundEnabled ? 'speaker' : 'mute'} size={12} />
			</button>
			<button class="clear-button" onclick={clearHistory} title="Clear history">
				✕
			</button>
			<button class="toggle-button" onclick={toggleCollapse}>
				<span class="toggle-icon">{collapsed ? '▶' : '▼'}</span>
				<span class="toggle-text">{collapsed ? 'SHOW' : 'HIDE'}</span>
			</button>
		</div>
	</div>

	{#if !collapsed}
	<div class="feed-content">
		<div class="empty-feed">
			<p>ACTIVITY FEED TEMPORARILY DISABLED</p>
			<p class="hint">Building alternative API service for activity tracking</p>
		</div>
	</div>

	<div class="feed-footer">
		<span class="event-count">0 events</span>
	</div>
	{/if}
</div>

<style>
	.activity-feed {
		display: flex;
		flex-direction: column;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.8) 0%,
			rgba(0, 20, 10, 0.8) 100%
		);
		transition: all 0.3s ease;
	}

	.feed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--spacing-unit) * 2);
		border-bottom: 3px solid var(--color-border);
		gap: calc(var(--spacing-unit) * 2);
	}

	.feed-header h3 {
		font-size: 12px;
		color: var(--color-text);
		margin: 0;
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

	.feed-controls {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) * 2);
	}

	.tracking-indicator {
		font-size: 8px;
		color: var(--color-text);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.sound-button,
	.clear-button {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: 10px;
		padding: var(--spacing-unit);
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sound-button:hover {
		color: var(--color-text);
		text-shadow: 0 0 10px var(--color-text);
	}

	.clear-button:hover {
		color: #ff4444;
		text-shadow: 0 0 10px #ff4444;
	}

	.feed-content {
		flex: 1;
		overflow-y: auto;
		padding: calc(var(--spacing-unit) * 2);
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
		min-height: 200px;
		max-height: 300px;
	}

	.feed-content::-webkit-scrollbar {
		width: 8px;
	}

	.feed-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.feed-content::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border: 2px solid transparent;
	}

	.feed-content::-webkit-scrollbar-thumb:hover {
		background: var(--color-text);
	}

	.loading-feed {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		gap: calc(var(--spacing-unit) * 2);
	}

	.loading-feed p {
		color: var(--color-text);
		font-size: 10px;
		margin: 0;
		animation: pulse 2s ease-in-out infinite;
	}

	.pixel-spinner-small {
		width: 24px;
		height: 24px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-text);
		border-radius: 0;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.empty-feed {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		gap: calc(var(--spacing-unit) * 2);
	}

	.empty-feed p {
		color: var(--color-text-secondary);
		font-size: 10px;
		margin: 0;
	}

	.empty-feed .hint {
		font-size: 8px;
		opacity: 0.7;
		max-width: 250px;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-unit);
	}

	.event-item {
		display: flex;
		gap: var(--spacing-unit);
		padding: var(--spacing-unit);
		border: 2px solid var(--color-border);
		background: rgba(0, 0, 0, 0.3);
		transition: all 0.2s;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.event-item:hover {
		background: rgba(0, 255, 65, 0.05);
		border-color: var(--color-text);
	}

	.event-icon {
		flex-shrink: 0;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.event-content {
		flex: 1;
		min-width: 0;
	}

	.event-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-unit);
		margin-bottom: calc(var(--spacing-unit) / 4);
	}

	.event-type {
		font-size: 8px;
		font-weight: bold;
		color: var(--color-text);
		letter-spacing: 0.3px;
	}

	.event-time {
		font-size: 7px;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.event-agent {
		font-size: 9px;
		color: var(--color-text);
		margin-bottom: calc(var(--spacing-unit) / 4);
		word-break: break-word;
	}

	.event-detail {
		font-size: 7px;
		color: var(--color-accent);
		padding: calc(var(--spacing-unit) / 4) calc(var(--spacing-unit) / 2);
		border: 1px solid var(--color-accent);
		display: inline-block;
		background: rgba(255, 0, 255, 0.05);
	}

	.feed-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--spacing-unit) * 1.5);
		border-top: 3px solid var(--color-border);
	}

	.event-count {
		font-size: 8px;
		color: var(--color-text-secondary);
		letter-spacing: 0.5px;
	}

	.loading-more {
		font-size: 7px;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
	}

	.dot-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.activity-feed {
			max-height: 400px;
		}


		.event-type {
			font-size: 8px;
		}
	}
</style>
