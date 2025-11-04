<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { activityTracker, type ActivityEvent } from '$lib/services/activity-tracker';
	import { ActivityStorage } from '$lib/utils/activity-storage';
	import { soundPlayer } from '$lib/utils/sound';

	let events = $state<ActivityEvent[]>([]);
	let unsubscribe: (() => void) | null = null;
	let isTracking = $state(false);
	let soundEnabled = $state(soundPlayer.isEnabled());

	onMount(() => {
		// Load persisted events from storage
		events = ActivityStorage.loadEvents();

		// Subscribe to new events
		unsubscribe = activityTracker.subscribe((newEvents) => {
			// Prepend new events (newest first)
			events = [...newEvents, ...events];

			// Play sound notification for each new event
			for (const event of newEvents) {
				soundPlayer.playEventNotification(event);
			}
		});

		// Start tracking if not already active
		if (!activityTracker.isActive()) {
			activityTracker.startPolling(30000); // 30 seconds
		}
		isTracking = activityTracker.isActive();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	function getEventIcon(type: ActivityEvent['type']): string {
		switch (type) {
			case 'agent_registered':
				return '🤖';
			case 'capability_added':
				return '⚡';
			case 'status_changed':
				return '🔄';
			case 'x402_enabled':
				return '💳';
			default:
				return '•';
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
		if (confirm('Clear all activity history?')) {
			ActivityStorage.clearEvents();
			events = [];
		}
	}

	function toggleSound() {
		soundPlayer.toggle();
		soundEnabled = soundPlayer.isEnabled();
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
				{soundEnabled ? '🔊' : '🔇'}
			</button>
			<button class="clear-button" onclick={clearHistory} title="Clear history">
				✕
			</button>
		</div>
	</div>

	<div class="feed-content">
		{#if events.length === 0}
			<div class="empty-feed">
				<p>NO ACTIVITY YET</p>
				<p class="hint">Activity will appear as agents are added or updated on the network</p>
			</div>
		{:else}
			<div class="event-list">
				{#each events as event (event.timestamp + event.agentId + event.type)}
					<div class="event-item">
						<div class="event-icon">{getEventIcon(event.type)}</div>
						<div class="event-content">
							<div class="event-header">
								<span class="event-type">{getEventLabel(event)}</span>
								<span class="event-time">{formatTimestamp(event.timestamp)}</span>
							</div>
							<div class="event-agent">{event.agentName}</div>
							{#if getEventDetail(event)}
								<div class="event-detail">{getEventDetail(event)}</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="feed-footer">
		<span class="event-count">{events.length} event{events.length !== 1 ? 's' : ''}</span>
	</div>
</div>

<style>
	.activity-feed {
		display: flex;
		flex-direction: column;
		min-height: 300px;
		max-height: 500px;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0.8) 0%,
			rgba(0, 20, 10, 0.8) 100%
		);
	}

	.feed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--spacing-unit) * 2);
		border-bottom: 3px solid var(--color-border);
	}

	.feed-header h3 {
		font-size: 12px;
		color: var(--color-text);
		margin: 0;
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
		background: transparent;
		border: 2px solid var(--color-border);
		color: var(--color-text-secondary);
		font-size: 10px;
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
		cursor: pointer;
		transition: all 0.2s;
	}

	.sound-button:hover {
		border-color: var(--color-text);
		color: var(--color-text);
	}

	.clear-button:hover {
		border-color: #ff4444;
		color: #ff4444;
	}

	.feed-content {
		flex: 1;
		overflow-y: auto;
		padding: calc(var(--spacing-unit) * 2);
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
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
		gap: calc(var(--spacing-unit) * 2);
	}

	.event-item {
		display: flex;
		gap: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 1.5);
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
		font-size: 20px;
		flex-shrink: 0;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
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
		margin-bottom: calc(var(--spacing-unit) / 2);
	}

	.event-type {
		font-size: 9px;
		font-weight: bold;
		color: var(--color-text);
		letter-spacing: 0.5px;
	}

	.event-time {
		font-size: 8px;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.event-agent {
		font-size: 10px;
		color: var(--color-text);
		margin-bottom: calc(var(--spacing-unit) / 2);
		word-break: break-word;
	}

	.event-detail {
		font-size: 8px;
		color: var(--color-accent);
		padding: calc(var(--spacing-unit) / 2) var(--spacing-unit);
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

	/* Mobile responsive */
	@media (max-width: 768px) {
		.activity-feed {
			max-height: 400px;
		}

		.event-icon {
			font-size: 16px;
		}

		.event-type {
			font-size: 8px;
		}
	}
</style>
