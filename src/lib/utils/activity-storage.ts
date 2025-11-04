/**
 * ActivityStorage - LocalStorage persistence for activity events
 *
 * Stores activity events in browser localStorage with:
 * - Maximum event history (default: 100 most recent events)
 * - Automatic cleanup of old events
 * - Type-safe serialization/deserialization
 */

import type { ActivityEvent } from '$lib/services/activity-tracker';

const STORAGE_KEY = 'activity_events';
const MAX_EVENTS = 100; // Keep last 100 events
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class ActivityStorage {
	/**
	 * Save events to localStorage
	 * @param events - Events to save (will be merged with existing)
	 */
	static saveEvents(events: ActivityEvent[]): void {
		try {
			// Get existing events
			const existing = this.loadEvents();

			// Merge with new events (deduplicate by timestamp + agentId)
			const merged = [...existing, ...events];
			const uniqueEvents = this.deduplicateEvents(merged);

			// Sort by timestamp (newest first)
			uniqueEvents.sort((a, b) => b.timestamp - a.timestamp);

			// Keep only MAX_EVENTS most recent
			const trimmed = uniqueEvents.slice(0, MAX_EVENTS);

			// Save to localStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
		} catch (error) {
			console.error('ActivityStorage: Failed to save events:', error);
		}
	}

	/**
	 * Load events from localStorage
	 * @returns Array of stored events (cleaned and validated)
	 */
	static loadEvents(): ActivityEvent[] {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return [];

			const events = JSON.parse(stored) as ActivityEvent[];

			// Validate and clean events
			const now = Date.now();
			const validEvents = events.filter(event => {
				// Check event structure
				if (!event.type || !event.agentId || !event.agentName || !event.timestamp) {
					return false;
				}

				// Remove events older than MAX_AGE_MS
				if (now - event.timestamp > MAX_AGE_MS) {
					return false;
				}

				return true;
			});

			return validEvents;
		} catch (error) {
			console.error('ActivityStorage: Failed to load events:', error);
			return [];
		}
	}

	/**
	 * Clear all stored events
	 */
	static clearEvents(): void {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error('ActivityStorage: Failed to clear events:', error);
		}
	}

	/**
	 * Get total number of stored events
	 */
	static getEventCount(): number {
		return this.loadEvents().length;
	}

	/**
	 * Deduplicate events based on timestamp + agentId
	 */
	private static deduplicateEvents(events: ActivityEvent[]): ActivityEvent[] {
		const seen = new Set<string>();
		const unique: ActivityEvent[] = [];

		for (const event of events) {
			// Create unique key: timestamp + agentId + type
			const key = `${event.timestamp}_${event.agentId}_${event.type}`;

			if (!seen.has(key)) {
				seen.add(key);
				unique.push(event);
			}
		}

		return unique;
	}

	/**
	 * Get events filtered by type
	 */
	static getEventsByType(type: ActivityEvent['type']): ActivityEvent[] {
		const events = this.loadEvents();
		return events.filter(event => event.type === type);
	}

	/**
	 * Get events for specific agent
	 */
	static getEventsByAgent(agentId: string): ActivityEvent[] {
		const events = this.loadEvents();
		return events.filter(event => event.agentId === agentId);
	}

	/**
	 * Get statistics about stored events
	 */
	static getStats(): {
		total: number;
		byType: Record<ActivityEvent['type'], number>;
		oldestTimestamp: number | null;
		newestTimestamp: number | null;
	} {
		const events = this.loadEvents();

		const stats = {
			total: events.length,
			byType: {
				agent_registered: 0,
				capability_added: 0,
				status_changed: 0,
				x402_enabled: 0
			} as Record<ActivityEvent['type'], number>,
			oldestTimestamp: events.length > 0 ? events[events.length - 1].timestamp : null,
			newestTimestamp: events.length > 0 ? events[0].timestamp : null
		};

		for (const event of events) {
			stats.byType[event.type]++;
		}

		return stats;
	}
}
