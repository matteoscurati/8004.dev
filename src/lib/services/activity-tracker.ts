/**
 * ActivityTracker - Simulated live activity feed
 *
 * Polls the Agent0 network every 30 seconds to detect changes:
 * - New agent registrations
 * - Capability additions (MCP/A2A tools/skills)
 * - Status changes (active/inactive)
 * - x402 support enabled
 *
 * Note: SDK doesn't expose event logs, so we simulate by polling
 */

import { searchAgents, type AgentResult } from '$lib/sdk';
import { ActivityStorage } from '$lib/utils/activity-storage';

export interface ActivityEvent {
	id?: string | number; // Unique event identifier (from API or generated)
	type:
		| 'agent_registered'
		| 'agent_updated'
		| 'capability_added'
		| 'status_changed'
		| 'x402_enabled'
		| 'validation_request'
		| 'validation_response'
		| 'feedback_received'
		| 'metadata_updated';
	agentId: string;
	agentName: string;
	timestamp: number;
	// Blockchain data
	blockNumber?: number;
	txHash?: string;
	metadata?: {
		capability?: string;
		capabilityType?: 'mcp' | 'a2a';
		previousStatus?: boolean;
		currentStatus?: boolean;
		// Metadata events
		key?: string;
		value?: string;
		decodedValue?: string;
		// Validation events
		requestHash?: string;
		requestUri?: string;
		responseUri?: string;
		validatorAddress?: string;
		response?: number;
		// Feedback events
		score?: number;
		feedbackUri?: string;
		client?: string;
	};
	// Enriched data from SDK (loaded asynchronously)
	enriched?: {
		owner?: string;
		operator?: string;
		active?: boolean;
		x402support?: boolean;
		mcpTools?: string[];
		a2aSkills?: string[];
	};
}

interface AgentSnapshot {
	id: string;
	name: string;
	active: boolean;
	x402support: boolean;
	mcpTools: string[];
	a2aSkills: string[];
}

export class ActivityTracker {
	private lastSnapshot: Map<string, AgentSnapshot> = new Map();
	private pollInterval: number | null = null;
	private isPolling = false;
	private listeners: Array<(events: ActivityEvent[]) => void> = [];

	/**
	 * Start polling for activity changes
	 * @param intervalMs - Polling interval in milliseconds (default: 30000ms = 30s)
	 */
	startPolling(intervalMs: number = 30000): void {
		if (this.isPolling) {
			return;
		}

		this.isPolling = true;

		// Initial snapshot (don't emit events on first load)
		this.captureSnapshot().catch(err => {
			console.error('ActivityTracker: Failed to capture initial snapshot:', err);
		});

		// Start polling
		this.pollInterval = window.setInterval(async () => {
			try {
				await this.checkForChanges();
			} catch (error) {
				console.error('ActivityTracker: Polling error:', error);
			}
		}, intervalMs);
	}

	/**
	 * Stop polling
	 */
	stopPolling(): void {
		if (this.pollInterval !== null) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
			this.isPolling = false;
		}
	}

	/**
	 * Subscribe to activity events
	 * @param callback - Function to call when new events are detected
	 * @returns Unsubscribe function
	 */
	subscribe(callback: (events: ActivityEvent[]) => void): () => void {
		this.listeners.push(callback);
		return () => {
			this.listeners = this.listeners.filter(l => l !== callback);
		};
	}

	/**
	 * Capture current network snapshot
	 */
	private async captureSnapshot(): Promise<void> {
		// Fetch all agents (up to 500)
		const result = await searchAgents({}, 500);

		this.lastSnapshot.clear();
		for (const agent of result.items) {
			this.lastSnapshot.set(agent.id, this.toSnapshot(agent));
		}

	}

	/**
	 * Check for changes and emit events
	 */
	private async checkForChanges(): Promise<void> {
		const result = await searchAgents({}, 500);
		const currentAgents = new Map<string, AgentSnapshot>();
		const events: ActivityEvent[] = [];

		// Build current snapshot and detect changes
		for (const agent of result.items) {
			const snapshot = this.toSnapshot(agent);
			currentAgents.set(agent.id, snapshot);

			const previous = this.lastSnapshot.get(agent.id);

			if (!previous) {
				// New agent registered
				events.push({
					type: 'agent_registered',
					agentId: agent.id,
					agentName: agent.name,
					timestamp: Date.now()
				});
			} else {
				// Check for changes in existing agent

				// Status change
				if (previous.active !== snapshot.active) {
					events.push({
						type: 'status_changed',
						agentId: agent.id,
						agentName: agent.name,
						timestamp: Date.now(),
						metadata: {
							previousStatus: previous.active,
							currentStatus: snapshot.active
						}
					});
				}

				// x402 support enabled
				if (!previous.x402support && snapshot.x402support) {
					events.push({
						type: 'x402_enabled',
						agentId: agent.id,
						agentName: agent.name,
						timestamp: Date.now()
					});
				}

				// New MCP tools
				const newMcpTools = snapshot.mcpTools.filter(
					tool => !previous.mcpTools.includes(tool)
				);
				for (const tool of newMcpTools) {
					events.push({
						type: 'capability_added',
						agentId: agent.id,
						agentName: agent.name,
						timestamp: Date.now(),
						metadata: {
							capability: tool,
							capabilityType: 'mcp'
						}
					});
				}

				// New A2A skills
				const newA2aSkills = snapshot.a2aSkills.filter(
					skill => !previous.a2aSkills.includes(skill)
				);
				for (const skill of newA2aSkills) {
					events.push({
						type: 'capability_added',
						agentId: agent.id,
						agentName: agent.name,
						timestamp: Date.now(),
						metadata: {
							capability: skill,
							capabilityType: 'a2a'
						}
					});
				}
			}
		}

		// Update snapshot
		this.lastSnapshot = currentAgents;

		// Emit events if any
		if (events.length > 0) {
			this.notifyListeners(events);
		}
	}

	/**
	 * Convert AgentResult to snapshot
	 */
	private toSnapshot(agent: AgentResult): AgentSnapshot {
		return {
			id: agent.id,
			name: agent.name,
			active: agent.active,
			x402support: agent.x402support,
			mcpTools: agent.mcpTools || [],
			a2aSkills: agent.a2aSkills || []
		};
	}

	/**
	 * Notify all listeners of new events and persist to storage
	 */
	private notifyListeners(events: ActivityEvent[]): void {
		// Persist events to localStorage
		ActivityStorage.saveEvents(events);

		// Notify listeners
		for (const listener of this.listeners) {
			try {
				listener(events);
			} catch (error) {
				console.error('ActivityTracker: Listener error:', error);
			}
		}
	}

	/**
	 * Get current polling status
	 */
	isActive(): boolean {
		return this.isPolling;
	}

	/**
	 * Get number of tracked agents
	 */
	getTrackedCount(): number {
		return this.lastSnapshot.size;
	}
}

// Singleton instance
export const activityTracker = new ActivityTracker();
