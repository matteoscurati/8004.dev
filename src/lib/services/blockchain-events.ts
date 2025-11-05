/**
 * Blockchain Event Listener - Placeholder
 *
 * This service is being replaced with an alternative API service.
 * Currently disabled and returns empty data.
 */

import type { ActivityEvent } from './activity-tracker';

export interface BlockchainEventListener {
	start(): Promise<void>;
	stop(): void;
	subscribe(callback: (events: ActivityEvent[]) => void): () => void;
}

export class ERC8004EventListener implements BlockchainEventListener {
	constructor() {}

	async start(): Promise<void> {
		// Disabled - waiting for alternative API service
	}

	stop(): void {
		// Disabled - waiting for alternative API service
	}

	subscribe(callback: (events: ActivityEvent[]) => void): () => void {
		// Return empty unsubscribe function
		return () => {};
	}

	isActive(): boolean {
		return false;
	}
}

// Singleton instance
export const blockchainEventListener = new ERC8004EventListener();
