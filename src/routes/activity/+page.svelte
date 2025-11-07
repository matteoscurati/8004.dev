<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { ActivityEvent } from '$lib/services/activity-tracker';
	import PixelIcon from '$lib/components/PixelIcon.svelte';
	import { apiClient } from '$lib/api/client';
	import { apiEventToActivityEvent } from '$lib/utils/event-adapter';
	import { getEnrichedAgentData, preloadAgents } from '$lib/utils/agent-enrichment';

	// Filter state
	type EventFilter = 'all' | 'agents' | 'capabilities' | 'metadata' | 'validation' | 'feedback' | 'payments';

	// Read initial state from URL query params
	function getInitialPage(): number {
		if (typeof window === 'undefined') return 1;
		const params = new URLSearchParams(window.location.search);
		const page = parseInt(params.get('page') || '1', 10);
		return page > 0 ? page : 1;
	}

	function getInitialFilter(): EventFilter {
		if (typeof window === 'undefined') return 'all';
		const params = new URLSearchParams(window.location.search);
		const filter = params.get('filter');
		const validFilters: EventFilter[] = ['all', 'agents', 'capabilities', 'metadata', 'validation', 'feedback', 'payments'];
		return validFilters.includes(filter as EventFilter) ? (filter as EventFilter) : 'all';
	}

	// Pagination state
	let currentPage = $state(getInitialPage());
	let pageSize = $state(20);
	let totalEvents = $state(0);
	let totalPages = $derived(Math.ceil(totalEvents / pageSize));

	// Events state
	let events = $state<ActivityEvent[]>([]);
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	// Filter state
	let activeFilter = $state<EventFilter>(getInitialFilter());

	// Stats from API
	let stats = $state<{
		all: number;
		agents: number;
		metadata: number;
		validation: number;
		feedback: number;
		capabilities: number;
		payments: number;
	}>({
		all: 0,
		agents: 0,
		metadata: 0,
		validation: 0,
		feedback: 0,
		capabilities: 0,
		payments: 0
	});

	// Load events from API
	async function loadEvents() {
		loading = true;
		errorMessage = null;

		try {
			const offset = (currentPage - 1) * pageSize;
			const response = await apiClient.getEvents({
				limit: pageSize,
				offset,
				chain_id: 11155111, // Sepolia
				category: activeFilter === 'all' ? undefined : activeFilter
			});

			// Convert API events to activity events
			let activityEvents: ActivityEvent[] = response.events
				.map(apiEventToActivityEvent)
				.filter((e): e is ActivityEvent => e !== null);

			// Additional client-side filter if API returned wrong category
			// (Some API implementations return all events when category has 0 results)
			if (activeFilter !== 'all') {
				const filteredByCategory = activityEvents.filter(event => {
					switch (activeFilter) {
						case 'agents':
							return event.type === 'agent_registered' || event.type === 'agent_updated';
						case 'capabilities':
							return event.type === 'capability_added';
						case 'metadata':
							return event.type === 'metadata_updated' || event.type === 'status_changed';
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

				// If we filtered out events, it means API returned wrong data
				if (filteredByCategory.length !== activityEvents.length) {
					console.warn(`⚠️ API returned ${activityEvents.length} events but only ${filteredByCategory.length} match category '${activeFilter}'`);
					activityEvents = filteredByCategory;
				}
			}

			// Enrich with SDK data
			await enrichEvents(activityEvents);

			events = activityEvents;
			totalEvents = activityEvents.length; // Use filtered count instead of API total

			// Save stats if available
			if (response.stats) {
				stats = response.stats;
			}

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

	// Update URL with current filter and page state
	function updateUrl() {
		const params = new URLSearchParams();

		if (activeFilter !== 'all') {
			params.set('filter', activeFilter);
		}

		if (currentPage > 1) {
			params.set('page', currentPage.toString());
		}

		const query = params.toString();
		const newUrl = query ? `/activity?${query}` : '/activity';

		// Update URL without reloading page
		window.history.replaceState({}, '', newUrl);
	}

	// Navigate to page
	function goToPage(page: number) {
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		updateUrl();
		loadEvents();
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Filter events by category (server-side)
	function setFilter(filter: EventFilter) {
		activeFilter = filter;
		currentPage = 1; // Reset to first page when changing filter
		updateUrl();

		// If category has 0 events, don't make API call
		if (filter !== 'all' && stats[filter] === 0) {
			events = [];
			totalEvents = 0;
			return;
		}

		loadEvents();
	}

	// Get event count by category from API stats
	function getEventCountByCategory(filter: EventFilter): number {
		return stats[filter];
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

	// Get detailed information lines for an event
	function getEventDetails(event: ActivityEvent): string[] {
		const details: string[] = [];

		switch (event.type) {
			case 'capability_added':
				if (event.metadata?.capability) {
					const capType = event.metadata.capabilityType === 'mcp' ? 'MCP Tool' : 'A2A Skill';
					details.push(`${capType}: ${event.metadata.capability}`);
				}
				break;

			case 'status_changed':
				const status = event.metadata?.currentStatus ? 'ACTIVE' : 'INACTIVE';
				const prevStatus = event.metadata?.previousStatus ? 'ACTIVE' : 'INACTIVE';
				details.push(`Status: ${prevStatus} → ${status}`);
				break;

			case 'agent_registered':
				const agentId = event.agentId.length > 10
					? `#${event.agentId.substring(0, 8)}...`
					: `#${event.agentId}`;
				details.push(`Agent ID: ${agentId}`);
				break;

			case 'agent_updated':
				const updatedId = event.agentId.length > 10
					? `#${event.agentId.substring(0, 8)}...`
					: `#${event.agentId}`;
				details.push(`New name: ${event.agentName}`);
				details.push(`Agent ID: ${updatedId}`);
				break;

			case 'metadata_updated':
				if (event.metadata?.key) {
					details.push(`Key: ${event.metadata.key}`);
				}
				if (event.metadata?.decodedValue) {
					const val = event.metadata.decodedValue;
					const displayVal = val.length > 40 ? `${val.substring(0, 40)}...` : val;
					details.push(`Value: ${displayVal}`);
				}
				break;

			case 'validation_request':
				if (event.metadata?.validatorAddress) {
					const addr = event.metadata.validatorAddress;
					details.push(`Validator: ${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`);
				}
				break;

			case 'validation_response':
				if (event.metadata?.response !== undefined) {
					details.push(`Validation Score: ${event.metadata.response}/10`);
				}
				if (event.metadata?.tag) {
					details.push(`Tag: ${event.metadata.tag}`);
				}
				break;

			case 'feedback_received':
				if (event.metadata?.score !== undefined) {
					details.push(`Rating: ${event.metadata.score}/100`);
				}
				if (event.metadata?.tag1) {
					details.push(`Tags: ${event.metadata.tag1}${event.metadata.tag2 ? `, ${event.metadata.tag2}` : ''}`);
				}
				if (event.metadata?.client) {
					const client = event.metadata.client;
					details.push(`Client: ${client.substring(0, 6)}...${client.substring(client.length - 4)}`);
				}
				break;

			case 'x402_enabled':
				details.push('Payment support activated');
				break;
		}

		// Add common enriched data
		if (event.enriched) {
			if (event.enriched.owner) {
				const owner = event.enriched.owner;
				details.push(`Owner: ${owner.substring(0, 6)}...${owner.substring(owner.length - 4)}`);
			}
			if (event.enriched.operator && event.enriched.operator !== event.enriched.owner) {
				const operator = event.enriched.operator;
				details.push(`Operator: ${operator.substring(0, 6)}...${operator.substring(operator.length - 4)}`);
			}
			if (event.enriched.mcpTools && event.enriched.mcpTools.length > 0) {
				details.push(`⚡ ${event.enriched.mcpTools.length} MCP Tool${event.enriched.mcpTools.length !== 1 ? 's' : ''}`);
			}
			if (event.enriched.a2aSkills && event.enriched.a2aSkills.length > 0) {
				details.push(`🤖 ${event.enriched.a2aSkills.length} A2A Skill${event.enriched.a2aSkills.length !== 1 ? 's' : ''}`);
			}
		}

		// Add blockchain info
		if (event.blockNumber) {
			details.push(`Block: ${event.blockNumber.toLocaleString()}`);
		}
		// Note: Transaction hash is shown as a link separately in the template

		return details;
	}

	// Get Etherscan URL for transaction
	function getEtherscanUrl(txHash: string, chainId: number = 11155111): string {
		// For now we only support Sepolia, but we can add more chains later
		const explorers: Record<number, string> = {
			1: 'https://etherscan.io',
			11155111: 'https://sepolia.etherscan.io', // Sepolia
			// Add more chains as needed:
			// 137: 'https://polygonscan.com', // Polygon
			// 8453: 'https://basescan.org', // Base
		};

		const explorerUrl = explorers[chainId] || explorers[11155111]; // Default to Sepolia
		return `${explorerUrl}/tx/${txHash}`;
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
			ALL <span class="filter-count">({getEventCountByCategory('all')})</span>
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'agents'}
			onclick={() => setFilter('agents')}
		>
			<PixelIcon type="robot" size={16} />
			AGENTS <span class="filter-count">({getEventCountByCategory('agents')})</span>
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'capabilities'}
			onclick={() => setFilter('capabilities')}
		>
			<PixelIcon type="lightning" size={16} />
			CAPABILITIES <span class="filter-count">({getEventCountByCategory('capabilities')})</span>
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'metadata'}
			onclick={() => setFilter('metadata')}
		>
			<PixelIcon type="refresh" size={16} />
			METADATA <span class="filter-count">({getEventCountByCategory('metadata')})</span>
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'validation'}
			onclick={() => setFilter('validation')}
		>
			<PixelIcon type="check" size={16} />
			VALIDATION <span class="filter-count">({getEventCountByCategory('validation')})</span>
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'feedback'}
			onclick={() => setFilter('feedback')}
		>
			<PixelIcon type="chart" size={16} />
			FEEDBACK <span class="filter-count">({getEventCountByCategory('feedback')})</span>
		</button>
		<button
			class="filter-btn"
			class:active={activeFilter === 'payments'}
			onclick={() => setFilter('payments')}
		>
			<PixelIcon type="dollar" size={16} />
			PAYMENTS <span class="filter-count">({getEventCountByCategory('payments')})</span>
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
				<PixelIcon type="dot" size={64} />
				<p>NO EVENTS IN THIS CATEGORY</p>
				<p class="hint">Try selecting a different filter</p>
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
							<div class="event-agent-name">{event.agentName}</div>
							{#each getEventDetails(event) as detail}
								<div class="event-detail">{detail}</div>
							{/each}
							{#if event.txHash}
								<div class="event-tx">
									<a
										href={getEtherscanUrl(event.txHash)}
										target="_blank"
										rel="noopener noreferrer"
										class="tx-link"
									>
										<span class="tx-label">🔗 View on Block Explorer</span>
										<span class="tx-hash">{event.txHash.substring(0, 10)}...{event.txHash.substring(event.txHash.length - 8)}</span>
									</a>
								</div>
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
		font-size: 20px;
		font-weight: bold;
		color: var(--color-text);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--spacing-unit) * 2);
		margin-bottom: var(--spacing-unit);
		text-shadow: 2px 2px 0 var(--color-shadow);
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
		font-size: 10px;
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

	.filter-count {
		display: inline-block;
		opacity: 0.9;
		font-size: 11px;
		margin-left: 4px;
		font-weight: bold;
		color: var(--color-primary);
	}

	.filter-btn.active .filter-count {
		opacity: 1;
		color: var(--color-bg);
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

	.event-agent-name {
		font-size: 10px;
		color: var(--color-primary);
		font-weight: bold;
		margin-bottom: calc(var(--spacing-unit) / 2);
		word-break: break-word;
	}

	.event-detail {
		font-size: 9px;
		color: var(--color-text-secondary);
		line-height: 1.4;
		word-break: break-word;
	}

	.event-tx {
		margin-top: calc(var(--spacing-unit) * 1);
		padding-top: calc(var(--spacing-unit) / 2);
		border-top: 1px solid rgba(0, 255, 65, 0.2);
	}

	.tx-link {
		color: var(--color-primary);
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 3px;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
		padding: calc(var(--spacing-unit) / 2) 0;
		font-size: 9px;
		font-weight: bold;
		letter-spacing: 0.3px;
		cursor: pointer;
	}

	.tx-label {
		text-transform: uppercase;
	}

	.tx-hash {
		opacity: 0.7;
		font-family: monospace;
	}

	.tx-link:hover {
		color: var(--color-text);
		text-shadow: 0 0 8px var(--color-primary);
		text-decoration-style: solid;
	}

	.tx-link:hover .tx-hash {
		opacity: 1;
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

	.hint {
		font-size: 9px;
		color: var(--color-text-dim);
		opacity: 0.7;
		margin-top: calc(var(--spacing-unit) / 2);
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

		.page-header {
			margin-bottom: calc(var(--spacing-unit) * 3);
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
			font-size: 9px;
		}

		.filter-count {
			font-size: 10px;
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
