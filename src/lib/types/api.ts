/**
 * API Types for ERC-8004 Activity Feed
 */

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	expires_at: string;
}

export interface Event {
	id: number;
	block_number: number;
	block_timestamp: string;
	transaction_hash: string;
	log_index: number;
	contract_address: string;
	event_type: string;
	event_data: Record<string, any>;
	created_at: string;
}

export interface EventsResponse {
	events: Event[];
	total: number;
	limit: number;
	offset: number;
	stats?: {
		all: number;
		agents: number;
		metadata: number;
		validation: number;
		feedback: number;
		capabilities: number;
		payments: number;
	};
}

export interface Stats {
	last_synced_block: number;
	last_synced_at: string;
	total_events: number;
	events_by_type: Record<string, number>;
	events_by_contract: Record<string, number>;
}

export interface ApiError {
	error: string;
	details?: string;
}
