<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { ActivityEvent } from '$lib/services/activity-tracker';
	import PixelIcon from '$lib/components/PixelIcon.svelte';
	import { apiClient } from '$lib/api/client';
	import { apiEventToActivityEvent } from '$lib/utils/event-adapter';
	import { getEnrichedAgentData, preloadAgents } from '$lib/utils/agent-enrichment';

	// Pagination state
	let currentPage = $state(1);
	let pageSize = $state(20);
	let totalEvents = $state(0);
	let totalPages = $derived(Math.ceil(totalEvents / pageSize));

	// Events state
	let events = $state<ActivityEvent[]>([]);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	// Filter state
	type EventFilter = 'all' | 'agents' | 'capabilities' | 'metadata' | 'validation' | 'feedback' | 'payments';
	let activeFilter = $state<EventFilter>('all');

	// Load events from API
	async function loadEvents() {
		loading = true;
		errorMessage = null;

		try {
			const offset = (currentPage - 1) * pageSize;
			const response = await apiClient.getEvents({
				limit: pageSize,
				offset,
				chain_id: 11155111 // Sepolia
			});

			// Convert API events to activity events
			const activityEvents: ActivityEvent[] = response.events
				.map(apiEventToActivityEvent)
				.filter((e): e is ActivityEvent => e !== null);

			// Enrich with SDK data
			await enrichEvents(activityEvents);

			events = activityEvents;
			totalEvents = response.total;

			// Log filtering stats
			const filteredCount = response.events.length - activityEvents.length;
			if (filteredCount > 0) {
				console.log(`⚠️ Filtered out ${filteredCount} events (${activityEvents.length}/${response.events.length} kept)`);
			}
		} catch (error) {
			console.error('Failed to load events:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to load events';
		} finally {
			loading = false;
		}
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

	// Navigate to page
	function goToPage(page: number) {
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		loadEvents();
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Filter events by category
	function setFilter(filter: EventFilter) {
		activeFilter = filter;
		// TODO: Implement server-side filtering with event_type parameter
	}

	// Get event type label
	function getEventTypeLabel(event: ActivityEvent): string {
		switch (event.type) {
			case 'agent_registered':
				return 'AGENT REGISTERED';
			case 'agent_updated':
				return 'AGENT NAME UPDATED';
			case 'capability_added':
				return event.metadata?.capabilityType === 'mcp' ? 'MCP TOOL ADDED' : 'A2A SKILL ADDED';
			case 'status_changed':
				return 'STATUS CHANGED';
			case 'x402_enabled':
				return 'PAYMENT READY';
			case 'metadata_updated':
				return 'METADATA UPDATED';
			case 'validation_request':
				return 'VALIDATION REQUEST';
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
				if (event.enriched?.owner) {
					const shortOwner = `${event.enriched.owner.substring(0, 6)}...${event.enriched.owner.substring(event.enriched.owner.length - 4)}`;
					return `Owner: ${shortOwner}`;
				}
				if (event.agentId.length > 10) {
					return `Agent ID: ${event.agentId.substring(0, 10)}...`;
				}
				return `Agent ID: ${event.agentId}`;

			case 'agent_updated':
				const agentIdShort = event.agentId.length > 10
					? `#${event.agentId.substring(0, 8)}...`
					: `#${event.agentId}`;
				return `${event.agentName} (${agentIdShort})`;

			case 'metadata_updated':
				const parts: string[] = [];

				if (event.agentName && !event.agentName.startsWith('Agent #') && !event.agentName.startsWith('0x')) {
					parts.push(event.agentName);
				}

				if (event.agentId.length > 10) {
					parts.push(`(#${event.agentId.substring(0, 8)}...)`);
				} else {
					parts.push(`(#${event.agentId})`);
				}

				if (event.metadata?.key) {
					parts.push(`• ${event.metadata.key}:`);
				}

				if (event.metadata?.decodedValue) {
					const val = event.metadata.decodedValue;
					const displayVal = val.length > 24 ? `${val.substring(0, 24)}...` : val;
					parts.push(displayVal);
				}

				return parts.length > 0 ? parts.join(' ') : null;

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

	function getEventIcon(event: ActivityEvent): 'robot' | 'lightning' | 'refresh' | 'check' | 'chart' | 'dollar' | 'dot' {
		switch (event.type) {
			case 'agent_registered':
			case 'agent_updated':
				return 'robot';
			case 'capability_added':
				return 'lightning';
			case 'metadata_updated':
			case 'status_changed':
				return 'refresh';
			case 'validation_request':
			case 'validation_response':
				return 'check';
			case 'feedback_received':
				return 'chart';
			case 'x402_enabled':
				return 'dollar';
			default:
				return 'dot';
		}
	}

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - timestamp;

		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 7) {
			// Show full date for events older than 7 days
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
			});
		}

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		if (minutes > 0) return `${minutes}m ago`;
		if (seconds > 0) return `${seconds}s ago`;
		return 'just now';
	}

	// Load events on mount
	onMount(() => {
		loadEvents();
	});
</script>

<svelte:head>
	<title>Activity Feed - 8004.dev</title>
	<meta name="description" content="Real-time blockchain activity feed for ERC-8004 agents on Ethereum" />
</svelte:head>

<div class="activity-page">
	<!-- Header -->
	<div class="page-header">
		<h1 class="page-title">
			<PixelIcon type="chart" size={32} />
			ACTIVITY FEED
		</h1>
		<p class="page-subtitle">
			Real-time blockchain events from the ERC-8004 network on Sepolia
		</p>
	</div>

	<!-- Filters -->
	<div class="filters-section">
		<button
			class="filter-btn"
			class:active={activeFilter === 'all'}
			onclick={() => setFilter('all')}
		>
			ALL
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'agents'}
			onclick={() => setFilter('agents')}
		>
			<PixelIcon type="robot" size={16} />
			AGENTS
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'capabilities'}
			onclick={() => setFilter('capabilities')}
		>
			<PixelIcon type="lightning" size={16} />
			CAPABILITIES
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'metadata'}
			onclick={() => setFilter('metadata')}
		>
			<PixelIcon type="refresh" size={16} />
			METADATA
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'validation'}
			onclick={() => setFilter('validation')}
		>
			<PixelIcon type="check" size={16} />
			VALIDATION
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'feedback'}
			onclick={() => setFilter('feedback')}
		>
			<PixelIcon type="chart" size={16} />
			FEEDBACK
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'payments'}
			onclick={() => setFilter('payments')}
		>
			<PixelIcon type="dollar" size={16} />
			PAYMENTS
		</button>
	</div>

	<!-- Events list -->
	<div class="events-container">
		{#if loading}
			<div class="loading-state">
				<div class="pixel-spinner"></div>
				<p>LOADING EVENTS...</p>
			</div>
		{:else if errorMessage}
			<div class="error-state">
				<PixelIcon type="dot" size={48} />
				<p class="error-message">{errorMessage}</p>
				<button class="retry-btn pixel-button" onclick={loadEvents}>
					<PixelIcon type="refresh" size={16} />
					RETRY
				</button>
			</div>
		{:else if events.length === 0}
			<div class="empty-state">
				<PixelIcon type="chart" size={64} />
				<p>NO EVENTS FOUND</p>
			</div>
		{:else}
			<div class="events-list">
				{#each events as event (event.id)}
					<div class="event-item pixel-card">
						<div class="event-icon">
							<PixelIcon type={getEventIcon(event)} size={24} />
						</div>
						<div class="event-content">
							<div class="event-header">
								<span class="event-type">{getEventTypeLabel(event)}</span>
								<span class="event-time">{formatTimestamp(event.timestamp)}</span>
							</div>
							{#if getEventDetail(event)}
								<div class="event-detail">{getEventDetail(event)}</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if totalPages > 1 && !loading}
		<div class="pagination">
			<button
				class="pagination-btn pixel-button"
				disabled={currentPage === 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				<PixelIcon type="dot" size={16} />
				PREV
			</button>

			<div class="pagination-info">
				Page {currentPage} of {totalPages}
				<span class="total-events">({totalEvents} total events)</span>
			</div>

			<button
				class="pagination-btn pixel-button"
				disabled={currentPage === totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				NEXT
				<PixelIcon type="dot" size={16} />
			</button>
		</div>
	{/if}
</div>

<style>
	.activity-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: calc(var(--spacing-unit) * 4) var(--spacing-unit);
	}

	.page-header {
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 4);
	}

	.page-title {
		font-size: 32px;
		font-weight: bold;
		color: var(--color-text);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) * 2);
		margin-bottom: var(--spacing-unit);
		text-shadow: 3px 3px 0 var(--color-shadow);
	}

	.page-subtitle {
		font-size: 11px;
		color: var(--color-text-secondary);
		letter-spacing: 0.5px;
	}

	.filters-section {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-unit);
		margin-bottom: calc(var(--spacing-unit) * 3);
		justify-content: center;
	}

	.filter-btn {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
		padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
		border: 2px solid var(--color-border);
		background: var(--color-bg);
		color: var(--color-text-secondary);
		font-size: 9px;
		font-weight: bold;
		letter-spacing: 0.5px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-btn:hover {
		background: rgba(0, 255, 65, 0.1);
		border-color: var(--color-text);
		color: var(--color-text);
		transform: translateY(-1px);
	}

	.filter-btn.active {
		background: var(--color-text);
		color: var(--color-bg);
		border-color: var(--color-text);
		box-shadow: 0 0 12px rgba(0, 255, 65, 0.5);
	}

	.events-container {
		min-height: 400px;
		margin-bottom: calc(var(--spacing-unit) * 4);
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: calc(var(--spacing-unit) * 2);
	}

	.event-item {
		display: flex;
		gap: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 2);
		transition: all 0.2s;
	}

	.event-item:hover {
		transform: translateX(4px);
		box-shadow: 0 4px 12px rgba(0, 255, 65, 0.2);
	}

	.event-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border: 2px solid var(--color-border);
		background: linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, transparent 100%);
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
		font-size: 10px;
		font-weight: bold;
		color: var(--color-text);
		letter-spacing: 0.5px;
	}

	.event-time {
		font-size: 8px;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.event-detail {
		font-size: 9px;
		color: var(--color-text-secondary);
		line-height: 1.4;
		word-break: break-word;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 6) var(--spacing-unit);
		text-align: center;
	}

	.loading-state p,
	.empty-state p {
		font-size: 10px;
		color: var(--color-text-secondary);
		letter-spacing: 1px;
	}

	.error-message {
		font-size: 10px;
		color: #ff6b6b;
		max-width: 400px;
	}

	.retry-btn {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
		margin-top: var(--spacing-unit);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) * 3);
		padding: calc(var(--spacing-unit) * 3) 0;
	}

	.pagination-btn {
		display: flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
	}

	.pagination-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pagination-info {
		font-size: 10px;
		color: var(--color-text);
		font-weight: bold;
		letter-spacing: 0.5px;
		text-align: center;
	}

	.total-events {
		display: block;
		font-size: 8px;
		color: var(--color-text-secondary);
		font-weight: normal;
		margin-top: calc(var(--spacing-unit) / 2);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.activity-page {
			padding: calc(var(--spacing-unit) * 2) var(--spacing-unit);
		}

		.page-title {
			font-size: 24px;
			gap: var(--spacing-unit);
		}

		.page-subtitle {
			font-size: 9px;
		}

		.filters-section {
			gap: calc(var(--spacing-unit) / 2);
		}

		.filter-btn {
			padding: var(--spacing-unit) calc(var(--spacing-unit) * 1.5);
			font-size: 8px;
		}

		.event-item {
			padding: var(--spacing-unit);
			gap: var(--spacing-unit);
		}

		.event-icon {
			width: 40px;
			height: 40px;
		}

		.event-type {
			font-size: 9px;
		}

		.event-time {
			font-size: 7px;
		}

		.event-detail {
			font-size: 8px;
		}

		.pagination {
			gap: calc(var(--spacing-unit) * 2);
		}

		.pagination-info {
			font-size: 9px;
		}
	}
</style>
