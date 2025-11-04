import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityStorage } from '$lib/utils/activity-storage';
import type { ActivityEvent } from '$lib/services/activity-tracker';

/**
 * Test suite for ActivityStorage
 *
 * Tests localStorage persistence for activity events:
 * - Saving and loading events
 * - Deduplication logic
 * - Event age filtering
 * - Event count limiting
 * - Query methods (by type, by agent)
 * - Statistics calculation
 */

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
	value: localStorageMock
});

// Helper to create test events
function createTestEvent(
	partial: Partial<ActivityEvent> & { agentId: string }
): ActivityEvent {
	return {
		type: 'agent_registered',
		agentName: `Agent #${partial.agentId}`,
		timestamp: Date.now(),
		...partial
	} as ActivityEvent;
}

describe('ActivityStorage', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorageMock.clear();
	});

	describe('saveEvents and loadEvents', () => {
		it('should save and load events correctly', () => {
			const events: ActivityEvent[] = [
				createTestEvent({ agentId: '1' }),
				createTestEvent({ agentId: '2' })
			];

			ActivityStorage.saveEvents(events);
			const loaded = ActivityStorage.loadEvents();

			expect(loaded).toHaveLength(2);
			expect(loaded[0].agentId).toBe('1');
			expect(loaded[1].agentId).toBe('2');
		});

		it('should return empty array when no events stored', () => {
			const loaded = ActivityStorage.loadEvents();
			expect(loaded).toEqual([]);
		});

		it('should handle invalid JSON gracefully', () => {
			localStorageMock.setItem('activity_events', 'invalid json');
			const loaded = ActivityStorage.loadEvents();
			expect(loaded).toEqual([]);
		});

		it('should sort events by timestamp (newest first)', () => {
			const now = Date.now();
			const oldEvent = createTestEvent({ agentId: '1', timestamp: now - 1000 });
			const newEvent = createTestEvent({ agentId: '2', timestamp: now });

			ActivityStorage.saveEvents([oldEvent, newEvent]);
			const loaded = ActivityStorage.loadEvents();

			expect(loaded[0].timestamp).toBe(now);
			expect(loaded[1].timestamp).toBe(now - 1000);
		});
	});

	describe('deduplication', () => {
		it('should deduplicate events with same timestamp, agentId, and type', () => {
			const now = Date.now();
			const event1 = createTestEvent({
				agentId: '1',
				timestamp: now,
				type: 'agent_registered'
			});
			const event2 = createTestEvent({
				agentId: '1',
				timestamp: now,
				type: 'agent_registered'
			});

			ActivityStorage.saveEvents([event1, event2]);
			const loaded = ActivityStorage.loadEvents();

			expect(loaded).toHaveLength(1);
		});

		it('should keep events with different types as separate', () => {
			const now = Date.now();
			const event1 = createTestEvent({
				agentId: '1',
				timestamp: now,
				type: 'agent_registered'
			});
			const event2 = createTestEvent({
				agentId: '1',
				timestamp: now,
				type: 'status_changed'
			});

			ActivityStorage.saveEvents([event1, event2]);
			const loaded = ActivityStorage.loadEvents();

			expect(loaded).toHaveLength(2);
		});

		it('should merge new events with existing events', () => {
			const now = Date.now();
			const event1 = createTestEvent({ agentId: '1', timestamp: now - 1000 });
			ActivityStorage.saveEvents([event1]);

			const event2 = createTestEvent({ agentId: '2', timestamp: now });
			ActivityStorage.saveEvents([event2]);

			const loaded = ActivityStorage.loadEvents();
			expect(loaded).toHaveLength(2);
		});
	});

	describe('event validation and cleanup', () => {
		it('should filter out events with missing required fields', () => {
			const validEvent = createTestEvent({ agentId: '1' });
			const invalidEvent = { type: 'agent_registered' } as any;

			localStorageMock.setItem(
				'activity_events',
				JSON.stringify([validEvent, invalidEvent])
			);

			const loaded = ActivityStorage.loadEvents();
			expect(loaded).toHaveLength(1);
			expect(loaded[0].agentId).toBe('1');
		});

		it('should filter out events older than 7 days', () => {
			const recentEvent = createTestEvent({
				agentId: '1',
				timestamp: Date.now()
			});
			const oldEvent = createTestEvent({
				agentId: '2',
				timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 // 8 days ago
			});

			localStorageMock.setItem(
				'activity_events',
				JSON.stringify([recentEvent, oldEvent])
			);

			const loaded = ActivityStorage.loadEvents();
			expect(loaded).toHaveLength(1);
			expect(loaded[0].agentId).toBe('1');
		});
	});

	describe('event count limiting', () => {
		it('should keep only 100 most recent events', () => {
			// Create 150 events
			const events: ActivityEvent[] = [];
			for (let i = 0; i < 150; i++) {
				events.push(
					createTestEvent({
						agentId: `${i}`,
						timestamp: Date.now() + i // Each event 1ms newer
					})
				);
			}

			ActivityStorage.saveEvents(events);
			const loaded = ActivityStorage.loadEvents();

			expect(loaded).toHaveLength(100);
			// Should keep the 100 newest (highest timestamps)
			expect(loaded[0].agentId).toBe('149'); // Newest
			expect(loaded[99].agentId).toBe('50'); // 100th newest
		});
	});

	describe('clearEvents', () => {
		it('should remove all stored events', () => {
			const events = [createTestEvent({ agentId: '1' })];
			ActivityStorage.saveEvents(events);

			ActivityStorage.clearEvents();
			const loaded = ActivityStorage.loadEvents();

			expect(loaded).toEqual([]);
		});
	});

	describe('getEventCount', () => {
		it('should return correct event count', () => {
			expect(ActivityStorage.getEventCount()).toBe(0);

			const events = [
				createTestEvent({ agentId: '1' }),
				createTestEvent({ agentId: '2' })
			];
			ActivityStorage.saveEvents(events);

			expect(ActivityStorage.getEventCount()).toBe(2);
		});
	});

	describe('getEventsByType', () => {
		it('should filter events by type', () => {
			const events: ActivityEvent[] = [
				createTestEvent({ agentId: '1', type: 'agent_registered' }),
				createTestEvent({ agentId: '2', type: 'capability_added' }),
				createTestEvent({ agentId: '3', type: 'agent_registered' })
			];

			ActivityStorage.saveEvents(events);
			const registered = ActivityStorage.getEventsByType('agent_registered');

			expect(registered).toHaveLength(2);
			expect(registered.every(e => e.type === 'agent_registered')).toBe(true);
		});

		it('should return empty array if no events of type exist', () => {
			const events = [createTestEvent({ agentId: '1', type: 'agent_registered' })];
			ActivityStorage.saveEvents(events);

			const x402Events = ActivityStorage.getEventsByType('x402_enabled');
			expect(x402Events).toEqual([]);
		});
	});

	describe('getEventsByAgent', () => {
		it('should filter events by agent ID', () => {
			const events: ActivityEvent[] = [
				createTestEvent({ agentId: '1', type: 'agent_registered' }),
				createTestEvent({ agentId: '2', type: 'agent_registered' }),
				createTestEvent({ agentId: '1', type: 'capability_added' })
			];

			ActivityStorage.saveEvents(events);
			const agent1Events = ActivityStorage.getEventsByAgent('1');

			expect(agent1Events).toHaveLength(2);
			expect(agent1Events.every(e => e.agentId === '1')).toBe(true);
		});

		it('should return empty array if no events for agent exist', () => {
			const events = [createTestEvent({ agentId: '1' })];
			ActivityStorage.saveEvents(events);

			const agent2Events = ActivityStorage.getEventsByAgent('2');
			expect(agent2Events).toEqual([]);
		});
	});

	describe('getStats', () => {
		it('should return correct statistics', () => {
			const now = Date.now();
			const events: ActivityEvent[] = [
				createTestEvent({
					agentId: '1',
					type: 'agent_registered',
					timestamp: now - 3000
				}),
				createTestEvent({
					agentId: '2',
					type: 'agent_registered',
					timestamp: now - 2000
				}),
				createTestEvent({
					agentId: '3',
					type: 'capability_added',
					timestamp: now - 1000
				}),
				createTestEvent({ agentId: '4', type: 'x402_enabled', timestamp: now })
			];

			ActivityStorage.saveEvents(events);
			const stats = ActivityStorage.getStats();

			expect(stats.total).toBe(4);
			expect(stats.byType.agent_registered).toBe(2);
			expect(stats.byType.capability_added).toBe(1);
			expect(stats.byType.x402_enabled).toBe(1);
			expect(stats.byType.status_changed).toBe(0);
			expect(stats.newestTimestamp).toBe(now);
			expect(stats.oldestTimestamp).toBe(now - 3000);
		});

		it('should return null timestamps when no events exist', () => {
			const stats = ActivityStorage.getStats();

			expect(stats.total).toBe(0);
			expect(stats.newestTimestamp).toBeNull();
			expect(stats.oldestTimestamp).toBeNull();
		});
	});

	describe('error handling', () => {
		it('should handle localStorage errors gracefully on save', () => {
			// Mock localStorage.setItem to throw error
			const originalSetItem = localStorageMock.setItem;
			localStorageMock.setItem = vi.fn(() => {
				throw new Error('Storage full');
			});

			const events = [createTestEvent({ agentId: '1' })];

			// Should not throw
			expect(() => ActivityStorage.saveEvents(events)).not.toThrow();

			// Restore
			localStorageMock.setItem = originalSetItem;
		});

		it('should handle localStorage errors gracefully on clear', () => {
			// Mock localStorage.removeItem to throw error
			const originalRemoveItem = localStorageMock.removeItem;
			localStorageMock.removeItem = vi.fn(() => {
				throw new Error('Storage error');
			});

			// Should not throw
			expect(() => ActivityStorage.clearEvents()).not.toThrow();

			// Restore
			localStorageMock.removeItem = originalRemoveItem;
		});
	});
});
