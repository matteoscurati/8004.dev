import { writable } from 'svelte/store';
import { apiClient } from '$lib/api/client';
import type { Event, Stats } from '$lib/types/api';

interface EventsState {
	events: Event[];
	stats: Stats | null;
	isLoading: boolean;
	error: string | null;
	total: number;
	hasMore: boolean;
}

function createEventsStore() {
	const { subscribe, set, update } = writable<EventsState>({
		events: [],
		stats: null,
		isLoading: false,
		error: null,
		total: 0,
		hasMore: true,
	});

	return {
		subscribe,

		// Load events
		loadEvents: async (params?: {
			limit?: number;
			offset?: number;
			contract?: string;
			event_type?: string;
		}) => {
			update(state => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await apiClient.getEvents(params);
				update(state => ({
					...state,
					events: params?.offset ? [...state.events, ...response.events] : response.events,
					total: response.total,
					hasMore: response.events.length === (params?.limit || 10),
					isLoading: false,
				}));
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to load events';
				update(state => ({ ...state, error: message, isLoading: false }));
			}
		},

		// Load statistics
		loadStats: async () => {
			try {
				const stats = await apiClient.getStats();
				update(state => ({ ...state, stats }));
			} catch (error) {
				console.error('Failed to load stats:', error);
			}
		},

		// Add a single event (for real-time updates)
		addEvent: (event: Event) => {
			update(state => ({
				...state,
				events: [event, ...state.events],
				total: state.total + 1,
			}));
		},

		// Reset
		reset: () => {
			set({
				events: [],
				stats: null,
				isLoading: false,
				error: null,
				total: 0,
				hasMore: true,
			});
		},
	};
}

export const eventsStore = createEventsStore();
