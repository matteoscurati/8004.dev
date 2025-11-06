<script lang="ts" module>
	// Module-level mount guard
	let isActivityFeedMounted = false;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ActivityEvent } from '$lib/services/activity-tracker';
	import PixelIcon from './PixelIcon.svelte';
	import { authStore } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';
	import { apiEventToActivityEvent } from '$lib/utils/event-adapter';
	import { soundPlayer } from '$lib/utils/sound';
	import { getEnrichedAgentData, preloadAgents } from '$lib/utils/agent-enrichment';

	let events = $state<ActivityEvent[]>([]);
	let isTracking = $state(false);
	let soundEnabled = $state(false);
	let collapsed = $state(false);
	let errorMessage = $state<string | null>(null);
	let loadingInitialEvents = $state(false);
	let pollingInterval: ReturnType<typeof setInterval> | null = null;
	let lastEventId: number | string | null = null;

	// Event filtering
	type EventFilter = 'all' | 'agents' | 'capabilities' | 'metadata' | 'validation' | 'feedback' | 'payments';
	let activeFilter = $state<EventFilter>('all');

	// Filtered events based on active filter
	let filteredEvents = $derived(() => {
		if (activeFilter === 'all') return events;

		return events.filter(event => {
			switch (activeFilter) {
				case 'agents':
					return event.type === 'agent_registered' || event.type === 'agent_updated';
				case 'capabilities':
					return event.type === 'capability_added';
				case 'metadata':
					return event.type === 'metadata_updated';
				case 'validation':
					return event.type === 'validation_request' || event.type === 'validation_response';
				case 'feedback':
					return event.type === 'feedback_received';
				case 'payments':
					return event.type === 'x402_enabled';
				default:
					return true;
			}
		});
	});

	function toggleCollapse() {
		collapsed = !collapsed;
	}

	// Enrich events with SDK data
	async function enrichEvents(events: ActivityEvent[]): Promise<void> {
		// Extract unique agent IDs
		const agentIds = [...new Set(events.map(e => e.agentId))];

		// Preload agent data
		await preloadAgents(agentIds);

		// Enrich each event
		for (const event of events) {
			if (!event.enriched) {
				const enrichedData = await getEnrichedAgentData(event.agentId);
				if (enrichedData) {
					event.enriched = {
						owner: enrichedData.owner,
						operator: enrichedData.operator,
						active: enrichedData.active,
						x402support: enrichedData.x402support,
						mcpTools: enrichedData.mcpTools,
						a2aSkills: enrichedData.a2aSkills
					};
					// Update name if it was generic
					if (event.agentName.startsWith('Agent #') || event.agentName.startsWith('0x')) {
						event.agentName = enrichedData.name;
					}
				}
			}
		}
	}

	// Load events from API
	async function loadEvents(silent: boolean = false) {
		if (!silent) {
			loadingInitialEvents = true;
		}
		errorMessage = null;

		try {
			const response = await apiClient.getEvents({ limit: 20 });

			// Convert API events to activity events
			const activityEvents: ActivityEvent[] = response.events
				.map(apiEventToActivityEvent)
				.filter((e): e is ActivityEvent => e !== null);

			// Enrich with SDK data
			await enrichEvents(activityEvents);

			// Check for new events (silent mode)
			if (silent && activityEvents.length > 0) {
				const newestId = activityEvents[0].id;
				if (lastEventId !== null && newestId !== lastEventId) {
					// Find only new events
					const newEvents = activityEvents.filter(e => {
						const eventId = typeof e.id === 'number' ? e.id : parseInt(String(e.id), 10);
						const lastId = typeof lastEventId === 'number' ? lastEventId : parseInt(String(lastEventId), 10);
						return eventId > lastId;
					});

					if (newEvents.length > 0) {
						// Add new events to the front silently
						events = [...newEvents, ...events].slice(0, 50);
						console.log(`🔔 ${newEvents.length} new event(s) added silently`);

						// Play sound for new events
						if (soundEnabled) {
							newEvents.forEach(event => soundPlayer.playEventNotification(event));
						}
					}
				}
				lastEventId = newestId;
			} else {
				// Initial load
				events = activityEvents;
				if (activityEvents.length > 0) {
					lastEventId = activityEvents[0].id || null;
				}
				if (!silent) {
					console.log(`Loaded ${activityEvents.length} events from API`);
				}
			}
		} catch (error) {
			console.error('Failed to load events:', error);
			if (!silent) {
				errorMessage = error instanceof Error ? error.message : 'Failed to load events';
			}
		} finally {
			if (!silent) {
				loadingInitialEvents = false;
			}
		}
	}

	// Start polling
	function startPolling() {
		if (pollingInterval) return;

		console.log('✅ Starting polling mode (refresh every 15s)');
		isTracking = true;

		pollingInterval = setInterval(async () => {
			await loadEvents(true); // Silent polling
		}, 15000); // Poll every 15 seconds
	}

	// Stop polling
	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
		isTracking = false;
	}

	// Initialize
	async function initialize() {
		try {
			// Auto-login via server-side proxy
			console.log('Logging in via server-side proxy...');
			await authStore.autoLogin();

			// Load initial events
			await loadEvents(false);

			// Start polling
			startPolling();
		} catch (error) {
			console.error('Failed to initialize activity feed:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to connect';
			isTracking = false;
		}
	}

	onMount(() => {
		// Prevent multiple mounts
		if (isActivityFeedMounted) {
			console.warn('ActivityFeed already mounted, skipping');
			return;
		}
		isActivityFeedMounted = true;
		console.log('ActivityFeed mounting with polling mode');

		// Initialize
		initialize();
	});

	onDestroy(() => {
		stopPolling();
		isActivityFeedMounted = false;
	});

	function getEventIconType(type: ActivityEvent['type']): 'robot' | 'lightning' | 'refresh' | 'dollar' | 'check' | 'chart' | 'dot' {
		switch (type) {
			case 'agent_registered':
				return 'robot';
			case 'agent_updated':
			case 'metadata_updated':
			case 'status_changed':
				return 'refresh';
			case 'capability_added':
				return 'lightning';
			case 'x402_enabled':
				return 'dollar';
			case 'validation_request':
			case 'validation_response':
				return 'check';
			case 'feedback_received':
				return 'chart';
			default:
				return 'dot';
		}
	}

	function getEventLabel(event: ActivityEvent): string {
		switch (event.type) {
			case 'agent_registered':
				return 'NEW AGENT REGISTERED';
			case 'agent_updated':
				return 'AGENT NAME UPDATED';
			case 'metadata_updated':
				return `METADATA: ${(event.metadata?.key || 'UPDATED').toUpperCase()}`;
			case 'capability_added':
				return event.metadata?.capabilityType === 'mcp'
					? 'MCP TOOL ADDED'
					: 'A2A SKILL ADDED';
			case 'status_changed':
				return event.metadata?.currentStatus ? 'AGENT ACTIVATED' : 'AGENT DEACTIVATED';
			case 'x402_enabled':
				return 'x402 SUPPORT ENABLED';
			case 'validation_request':
				return 'VALIDATION REQUESTED';
			case 'validation_response':
				return 'VALIDATION RESPONSE';
			case 'feedback_received':
				return 'FEEDBACK RECEIVED';
			default:
				return 'ACTIVITY';
		}
	}

	function getEventDetail(event: ActivityEvent): string | null {
		switch (event.type) {
			case 'capability_added':
				if (event.metadata?.capability) {
					const capType = event.metadata.capabilityType === 'mcp' ? 'MCP Tool' : 'A2A Skill';
					return `${capType}: ${event.metadata.capability}`;
				}
				return null;

			case 'status_changed':
				const status = event.metadata?.currentStatus ? 'ACTIVE' : 'INACTIVE';
				const prevStatus = event.metadata?.previousStatus ? 'ACTIVE' : 'INACTIVE';
				return `Status changed: ${prevStatus} → ${status}`;

			case 'agent_registered':
				// Show owner if available from enriched data
				if (event.enriched?.owner) {
					const shortOwner = `${event.enriched.owner.substring(0, 6)}...${event.enriched.owner.substring(event.enriched.owner.length - 4)}`;
					return `Owner: ${shortOwner}`;
				}
				// Fallback: show agent ID (truncate only if longer than 10 chars)
			if (event.agentId.length > 10) {
				return `Agent ID: ${event.agentId.substring(0, 10)}...`;
			}
			return `Agent ID: ${event.agentId}`;

			case 'agent_updated':
				return `New name: ${event.agentName}`;

			case 'metadata_updated':
				if (event.metadata?.decodedValue) {
					const val = event.metadata.decodedValue;
					return val.length > 30 ? `${val.substring(0, 30)}...` : val;
				}
				return event.metadata?.key || null;

			case 'validation_request':
				if (event.metadata?.validatorAddress) {
					const addr = event.metadata.validatorAddress;
					return `Validator: ${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
				}
				return null;

			case 'validation_response':
				if (event.metadata?.response !== undefined) {
					return `Score: ${event.metadata.response}`;
				}
				return null;

			case 'feedback_received':
				if (event.metadata?.score !== undefined) {
					return `Score: ${event.metadata.score}/100`;
				}
				return null;

			case 'x402_enabled':
				return 'Payment support activated';

			default:
				return null;
		}
	}

	// Get event category for filtering
	function getEventCategory(event: ActivityEvent): EventFilter {
		switch (event.type) {
			case 'agent_registered':
			case 'agent_updated':
				return 'agents';
			case 'capability_added':
				return 'capabilities';
			case 'metadata_updated':
				return 'metadata';
			case 'validation_request':
			case 'validation_response':
				return 'validation';
			case 'feedback_received':
				return 'feedback';
			case 'status_changed':
				return 'agents'; // Status changes sono parte degli agent events
			case 'x402_enabled':
				return 'payments';
			default:
				return 'all';
		}
	}

	// Get event category label
	function getCategoryLabel(category: EventFilter): string {
		switch (category) {
			case 'all': return 'ALL';
			case 'agents': return 'AGENTS';
			case 'capabilities': return 'CAPABILITIES';
			case 'metadata': return 'METADATA';
			case 'validation': return 'VALIDATION';
			case 'feedback': return 'FEEDBACK';
			case 'payments': return 'PAYMENTS';
			default: return 'ALL';
		}
	}

	// Get category icon
	function getCategoryIcon(category: EventFilter): 'robot' | 'lightning' | 'refresh' | 'check' | 'chart' | 'dollar' | 'dot' {
		switch (category) {
			case 'agents': return 'robot';
			case 'capabilities': return 'lightning';
			case 'metadata': return 'refresh';
			case 'validation': return 'check';
			case 'feedback': return 'chart';
			case 'payments': return 'dollar';
			default: return 'dot';
		}
	}

	// Get event count by category
	function getEventCountByCategory(category: EventFilter): number {
		if (category === 'all') return events.length;
		return events.filter(e => getEventCategory(e) === category).length;
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
		events = [];
	}

	function toggleSound() {
		soundEnabled = !soundEnabled;
	}
</script>

<div class="activity-feed pixel-card">
	<div class="feed-header">
		<h3><span class="title-full">[ LIVE ACTIVITY FEED ]</span><span class="title-short">[ ACTIVITY ]</span></h3>
		<div class="feed-controls">
			{#if isTracking}
				<span class="tracking-indicator connected">● LIVE</span>
			{:else}
				<span class="tracking-indicator disconnected">○ OFFLINE</span>
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
	<!-- Event Filters -->
	<div class="feed-filters">
		{#each ['all', 'agents', 'capabilities', 'metadata', 'validation', 'feedback', 'payments'] as filter}
			<button
				class="filter-button"
				class:active={activeFilter === filter}
				class:all-filter={filter === 'all'}
				onclick={() => activeFilter = filter as EventFilter}
				title={getCategoryLabel(filter as EventFilter)}
			>
				{#if filter === 'all'}
					<span class="all-text">ALL</span>
				{:else}
					<PixelIcon
						type={getCategoryIcon(filter as EventFilter)}
						size={16}
						color={activeFilter === filter ? 'var(--color-primary)' : 'var(--color-text-dim)'}
					/>
				{/if}
				<span class="filter-label">{getCategoryLabel(filter as EventFilter)}</span>
				<span class="filter-count">({getEventCountByCategory(filter as EventFilter)})</span>
			</button>
		{/each}
	</div>

	<div class="feed-content">
		{#if loadingInitialEvents}
			<div class="loading-feed">
				<div class="pixel-spinner-small"></div>
				<p>LOADING RECENT EVENTS...</p>
			</div>
		{:else if errorMessage}
			<div class="empty-feed">
				<p class="error-text">✕ CONNECTION FAILED</p>
				<p class="hint">{errorMessage}</p>
				<button class="pixel-button-small" onclick={initialize}>RETRY</button>
			</div>
		{:else if events.length === 0}
			<div class="empty-feed">
				<p>NO RECENT ACTIVITY</p>
				<p class="hint">Waiting for new events on the network...</p>
			</div>
		{:else if filteredEvents().length === 0}
			<div class="empty-feed">
				<p>NO EVENTS IN THIS CATEGORY</p>
				<p class="hint">Try selecting a different filter</p>
			</div>
		{:else}
			<div class="event-list">
				{#each filteredEvents() as event (event.id || `${event.timestamp}-${event.agentId}-${event.type}`)}
					<div class="event-item">
						<div class="event-icon">
							<PixelIcon type={getEventIconType(event.type)} size={12} color="var(--color-primary)" />
						</div>
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
		<span class="event-count">
			{#if activeFilter === 'all'}
				{events.length} event{events.length !== 1 ? 's' : ''}
			{:else}
				{filteredEvents().length} of {events.length} event{events.length !== 1 ? 's' : ''}
			{/if}
		</span>
	</div>
	{/if}
</div>

<style>
	.activity-feed {
		display: flex;
		flex-direction: column;
		transition: all 0.3s ease;
	}

	.feed-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0;
		margin-bottom: calc(var(--spacing-unit) * 2);
		border-bottom: 3px solid var(--color-border);
		gap: calc(var(--spacing-unit) * 2);
	}

	.feed-header h3 {
		font-size: 16px;
		color: var(--color-text);
		margin: 0;
		white-space: nowrap;
	}

	.title-short {
		display: none;
	}

	.title-full {
		display: inline;
	}

	/* Event Filters */
	.feed-filters {
		display: flex;
		flex-wrap: nowrap;
		gap: calc(var(--spacing-unit) * 1);
		padding: 0;
		margin-bottom: calc(var(--spacing-unit) * 2);
		border-bottom: 2px solid var(--color-border);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		scrollbar-color: var(--color-primary) transparent;
	}

	.feed-filters::-webkit-scrollbar {
		height: 4px;
	}

	.feed-filters::-webkit-scrollbar-track {
		background: transparent;
	}

	.feed-filters::-webkit-scrollbar-thumb {
		background: var(--color-primary);
		border-radius: 2px;
	}

	.filter-button {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--spacing-unit) * 1);
		padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
		background: rgba(0, 0, 0, 0.5);
		border: 2px solid var(--color-border);
		color: var(--color-text-dim);
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
		line-height: 1;
	}

	.filter-button:hover {
		border-color: var(--color-primary);
		background: rgba(0, 255, 128, 0.1);
		transform: translateY(-1px);
	}

	/* "ALL" text styling */
	.all-text {
		font-size: 9px;
		font-weight: bold;
		letter-spacing: 1px;
		color: inherit;
	}

	.filter-button.active {
		border-color: var(--color-primary);
		background: rgba(0, 255, 128, 0.2);
		color: var(--color-primary);
		box-shadow: 0 0 10px rgba(0, 255, 128, 0.3);
	}

	.filter-label {
		display: inline-block;
	}

	.filter-count {
		display: inline-block;
		opacity: 0.7;
		font-size: 7px;
	}

	.filter-button.active .filter-count {
		opacity: 1;
		color: var(--color-primary);
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
		letter-spacing: 0.5px;
	}

	.tracking-indicator.connected {
		color: var(--color-primary);
		animation: pulse 2s ease-in-out infinite;
	}

	.tracking-indicator.disconnected {
		color: var(--color-text-secondary);
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
		padding: 0;
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

	.empty-feed .error-text {
		color: #ff4444;
		font-size: 10px;
	}

	.empty-feed .hint {
		font-size: 8px;
		opacity: 0.7;
		max-width: 250px;
	}

	.pixel-button-small {
		margin-top: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 1) calc(var(--spacing-unit) * 2);
		background: none;
		border: 2px solid var(--color-border);
		color: var(--color-text);
		font-family: 'Press Start 2P', monospace;
		font-size: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.pixel-button-small:hover {
		background: var(--color-primary);
		color: var(--color-bg);
		border-color: var(--color-primary);
		box-shadow: 0 0 10px var(--color-primary);
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

	/* Mobile responsive */
	@media (max-width: 768px) {
		.activity-feed {
			max-height: none;
		}

		/* Use short title on mobile */
		.title-full {
			display: none;
		}

		.title-short {
			display: inline;
		}

		.feed-header {
			padding: 0;
			margin-bottom: calc(var(--spacing-unit) * 1.5);
			gap: calc(var(--spacing-unit) * 1);
		}

		.feed-header h3 {
			font-size: 12px;
		}

		.tracking-indicator {
			font-size: 8px;
		}

		/* Filters: icon-only mode on mobile */
		.feed-filters {
			padding: 0;
			margin-bottom: calc(var(--spacing-unit) * 1.2);
			gap: calc(var(--spacing-unit) * 0.8);
		}

		.filter-button {
			font-size: 9px;
			padding: 0;
			min-width: 32px;
			width: 32px;
			height: 32px;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
			border: 2px solid var(--color-border);
		}

		/* "ALL" button can be wider on mobile */
		.filter-button.all-filter {
			width: auto;
			min-width: 48px;
			padding: 0 calc(var(--spacing-unit) * 1.5);
		}

		/* Hide labels and counts on mobile (except for ALL which doesn't have an icon) */

		/* Prevent size changes on active state */
		.filter-button.active {
			box-shadow: none;
			background: rgba(0, 255, 128, 0.25);
			border-color: var(--color-primary);
		}

		.filter-button:hover {
			transform: none;
			border-color: var(--color-primary);
			background: rgba(0, 255, 128, 0.15);
		}

		/* Hide labels and counts on mobile - show only icons */
		.filter-label,
		.filter-count {
			display: none;
		}

		.event-type {
			font-size: 9px;
		}

		.event-agent {
			font-size: 10px;
		}

		.event-detail {
			font-size: 8px;
		}

		.event-time {
			font-size: 8px;
		}

		.event-count {
			font-size: 9px;
		}

		.empty-feed p,
		.loading-feed p {
			font-size: 9px;
		}

		.empty-feed .hint {
			font-size: 8px;
		}

		/* Fix feed-content height to prevent button jumping */
		.feed-content {
			height: 180px;
			min-height: 180px;
			max-height: 180px;
			padding: 0;
		}
	}

	@media (max-width: 480px) {
		.feed-header h3 {
			font-size: 11px;
		}

		.tracking-indicator {
			font-size: 7px;
		}

		.feed-filters {
			padding: 0;
			margin-bottom: var(--spacing-unit);
			gap: calc(var(--spacing-unit) * 0.6);
		}

		.filter-button {
			padding: 0;
			width: 28px;
			height: 28px;
			min-width: 28px;
		}

		/* "ALL" button can be wider on small mobile too */
		.filter-button.all-filter {
			width: auto;
			min-width: 44px;
			padding: 0 calc(var(--spacing-unit) * 1.2);
		}

		.event-type {
			font-size: 8px;
		}

		.event-agent {
			font-size: 9px;
		}

		.event-detail {
			font-size: 7px;
		}

		/* Fix feed-content height on small screens */
		.feed-content {
			height: 160px;
			min-height: 160px;
			max-height: 160px;
			padding: 0;
		}
	}
</style>
