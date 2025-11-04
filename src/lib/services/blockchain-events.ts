/**
 * Blockchain Event Listener
 *
 * Reads events directly from the ERC-8004 Identity Registry smart contract:
 * - Registered: New agent registrations
 * - MetadataSet: Capability additions, status changes, x402 updates
 *
 * Fetches historical events and listens for new ones in real-time.
 */

import { ethers } from 'ethers';
import { getSDK } from '$lib/sdk';
import type { ActivityEvent } from './activity-tracker';

export interface BlockchainEventListener {
	start(): Promise<void>;
	stop(): void;
	subscribe(callback: (events: ActivityEvent[]) => void): () => void;
	fetchHistoricalEvents(fromBlock?: number, toBlock?: number | 'latest'): Promise<ActivityEvent[]>;
}

export class ERC8004EventListener implements BlockchainEventListener {
	private provider: ethers.Provider | null = null;
	private contract: ethers.Contract | null = null;
	private listeners: Array<(events: ActivityEvent[]) => void> = [];
	private isListening = false;
	private eventListeners: Array<() => void> = [];

	constructor() {}

	/**
	 * Initialize provider and contract
	 */
	private async initialize(): Promise<void> {
		if (this.provider && this.contract) return;

		const sdk = getSDK();
		this.provider = sdk.web3Client.provider;
		this.contract = sdk.getIdentityRegistry();

		console.log('🔗 Blockchain Event Listener initialized');
	}

	/**
	 * Start listening for new events
	 */
	async start(): Promise<void> {
		if (this.isListening) {
			console.warn('Already listening to blockchain events');
			return;
		}

		await this.initialize();
		if (!this.contract) throw new Error('Contract not initialized');

		this.isListening = true;
		console.log('👂 Started listening to blockchain events');

		// Listen for Registered events
		const onRegistered = async (agentId: bigint, tokenURI: string, owner: string, event: ethers.EventLog) => {
			console.log('📡 Registered event:', { agentId: agentId.toString(), owner });

			try {
				const block = await event.getBlock();
				const agentName = await this.getAgentName(agentId.toString());

				const activityEvent: ActivityEvent = {
					type: 'agent_registered',
					agentId: agentId.toString(),
					agentName,
					timestamp: block.timestamp * 1000 // Convert to milliseconds
				};

				this.notifyListeners([activityEvent]);
			} catch (error) {
				console.error('Error processing Registered event:', error);
			}
		};

		// Listen for MetadataSet events
		const onMetadataSet = async (agentId: bigint, indexedKey: string, key: string, value: string, event: ethers.EventLog) => {
			console.log('📡 MetadataSet event:', { agentId: agentId.toString(), key });

			try {
				const block = await event.getBlock();
				const agentName = await this.getAgentName(agentId.toString());
				const activityEvents = await this.parseMetadataEvent(
					agentId.toString(),
					agentName,
					key,
					value,
					block.timestamp * 1000
				);

				if (activityEvents.length > 0) {
					this.notifyListeners(activityEvents);
				}
			} catch (error) {
				console.error('Error processing MetadataSet event:', error);
			}
		};

		// Attach listeners
		this.contract.on('Registered', onRegistered);
		this.contract.on('MetadataSet', onMetadataSet);

		// Store cleanup functions
		this.eventListeners.push(() => this.contract?.off('Registered', onRegistered));
		this.eventListeners.push(() => this.contract?.off('MetadataSet', onMetadataSet));
	}

	/**
	 * Stop listening for events
	 */
	stop(): void {
		if (!this.isListening) return;

		// Remove all event listeners
		for (const cleanup of this.eventListeners) {
			cleanup();
		}
		this.eventListeners = [];
		this.isListening = false;

		console.log('🛑 Stopped listening to blockchain events');
	}

	/**
	 * Subscribe to activity events
	 */
	subscribe(callback: (events: ActivityEvent[]) => void): () => void {
		this.listeners.push(callback);
		return () => {
			this.listeners = this.listeners.filter(l => l !== callback);
		};
	}

	/**
	 * Fetch historical events from the blockchain
	 * @param fromBlock - Starting block number (default: deployment block or latest - 1000)
	 * @param toBlock - Ending block number (default: 'latest')
	 * @param onProgress - Callback for progressive updates
	 */
	async fetchHistoricalEvents(
		fromBlock?: number,
		toBlock: number | 'latest' = 'latest',
		onProgress?: (events: ActivityEvent[]) => void
	): Promise<ActivityEvent[]> {
		await this.initialize();
		if (!this.contract || !this.provider) throw new Error('Contract not initialized');

		const latestBlock = await this.provider.getBlockNumber();
		const resolvedToBlock = toBlock === 'latest' ? latestBlock : toBlock;

		// If no fromBlock specified, fetch last ~2000 blocks (roughly 6-7 hours on Sepolia)
		// Balanced to capture recent activity while respecting free tier RPC limits
		if (!fromBlock) {
			fromBlock = Math.max(0, latestBlock - 2000);
		}

		console.log(`📚 Fetching historical events from block ${fromBlock} to ${resolvedToBlock}`);

		const events: ActivityEvent[] = [];

		try {
			// Free tier RPC providers (like Alchemy) have limits on block range
			// Split into batches of 10 blocks to avoid rate limits
			const BATCH_SIZE = 10;
			const batches: Array<[number, number]> = [];

			for (let start = fromBlock; start <= resolvedToBlock; start += BATCH_SIZE) {
				const end = Math.min(start + BATCH_SIZE - 1, resolvedToBlock);
				batches.push([start, end]);
			}

			console.log(`   Fetching in ${batches.length} batches of ${BATCH_SIZE} blocks each`);

			// Fetch events in batches
			for (let i = 0; i < batches.length; i++) {
				const [start, end] = batches[i];

				// Fetch Registered events for this batch
				const registeredFilter = this.contract.filters.Registered();
				const registeredEvents = await this.contract.queryFilter(registeredFilter, start, end);

				for (const event of registeredEvents) {
					if (event instanceof ethers.EventLog) {
						const [agentId, tokenURI, owner] = event.args as unknown as [bigint, string, string];
						const block = await event.getBlock();
						const agentName = await this.getAgentName(agentId.toString());

						const newEvent = {
							type: 'agent_registered' as const,
							agentId: agentId.toString(),
							agentName,
							timestamp: block.timestamp * 1000
						};

						events.push(newEvent);

						// Send immediate update for each event found
						if (onProgress) {
							const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
							onProgress(sortedEvents);
						}
					}
				}

				// Fetch MetadataSet events for this batch
				const metadataFilter = this.contract.filters.MetadataSet();
				const metadataEvents = await this.contract.queryFilter(metadataFilter, start, end);

				for (const event of metadataEvents) {
					if (event instanceof ethers.EventLog) {
						const [agentId, indexedKey, key, value] = event.args as unknown as [bigint, string, string, string];
						const block = await event.getBlock();
						const agentName = await this.getAgentName(agentId.toString());

						const activityEvents = await this.parseMetadataEvent(
							agentId.toString(),
							agentName,
							key,
							value,
							block.timestamp * 1000
						);

						events.push(...activityEvents);

						// Send immediate update for each metadata event found
						if (onProgress && activityEvents.length > 0) {
							const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
							onProgress(sortedEvents);
						}
					}
				}

				// Progress indicator
				if ((i + 1) % 10 === 0 || i === batches.length - 1) {
					console.log(`   Progress: ${i + 1}/${batches.length} batches (${events.length} events so far)`);
				}
			}

			// Sort by timestamp (newest first)
			events.sort((a, b) => b.timestamp - a.timestamp);

			console.log(`✅ Fetched ${events.length} historical events`);
		} catch (error) {
			console.error('Error fetching historical events:', error);
			throw error;
		}

		return events;
	}

	/**
	 * Parse MetadataSet event to determine activity type
	 */
	private async parseMetadataEvent(
		agentId: string,
		agentName: string,
		key: string,
		value: string,
		timestamp: number
	): Promise<ActivityEvent[]> {
		const events: ActivityEvent[] = [];

		// Decode the value from bytes/hex if needed
		const decodedValue = this.decodeMetadataValue(value);

		console.log(`🔍 Parsing metadata: key="${key}", value="${decodedValue.substring(0, 100)}${decodedValue.length > 100 ? '...' : ''}"`);

		// Parse based on key
		switch (key) {
			case 'active':
			case 'status':
				// Status change event
				try {
					const isActive = decodedValue.toLowerCase() === 'true' || decodedValue === '1';
					events.push({
						type: 'status_changed',
						agentId,
						agentName,
						timestamp,
						metadata: {
							currentStatus: isActive
						}
					});
				} catch (error) {
					console.warn('Failed to parse status value:', decodedValue);
				}
				break;

			case 'x402support':
			case 'x402':
				// x402 support enabled
				try {
					const isEnabled = decodedValue.toLowerCase() === 'true' || decodedValue === '1';
					if (isEnabled) {
						events.push({
							type: 'x402_enabled',
							agentId,
							agentName,
							timestamp
						});
					}
				} catch (error) {
					console.warn('Failed to parse x402 value:', decodedValue);
				}
				break;

			case 'mcpTools':
			case 'mcp':
				// MCP tool added
				try {
					// Value might be JSON array or single tool name
					const tools = this.parseArrayValue(decodedValue);
					for (const tool of tools) {
						events.push({
							type: 'capability_added',
							agentId,
							agentName,
							timestamp,
							metadata: {
								capability: tool,
								capabilityType: 'mcp'
							}
						});
					}
				} catch (error) {
					console.warn('Failed to parse MCP tools:', decodedValue);
				}
				break;

			case 'a2aSkills':
			case 'a2a':
			case 'communicationProtocol':
				// A2A skill added
				try {
					const skills = this.parseArrayValue(decodedValue);
					for (const skill of skills) {
						events.push({
							type: 'capability_added',
							agentId,
							agentName,
							timestamp,
							metadata: {
								capability: skill,
								capabilityType: 'a2a'
							}
						});
					}
				} catch (error) {
					console.warn('Failed to parse A2A skills:', decodedValue);
				}
				break;

			default:
				// Log but ignore other metadata keys
				console.log(`   → Skipping metadata key: ${key}`);
				break;
		}

		return events;
	}

	/**
	 * Decode metadata value from bytes/hex to string
	 */
	private decodeMetadataValue(value: string): string {
		// If value starts with 0x, it's hex-encoded bytes
		if (value.startsWith('0x')) {
			try {
				// Remove 0x prefix and convert hex to string
				const hex = value.slice(2);
				let str = '';
				for (let i = 0; i < hex.length; i += 2) {
					const charCode = parseInt(hex.substr(i, 2), 16);
					if (charCode > 0) { // Skip null bytes
						str += String.fromCharCode(charCode);
					}
				}
				return str;
			} catch (error) {
				console.warn('Failed to decode hex value:', value);
				return value;
			}
		}
		return value;
	}

	/**
	 * Parse array value from metadata (could be JSON or CSV)
	 */
	private parseArrayValue(value: string): string[] {
		try {
			// Try JSON parse first
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [parsed];
		} catch {
			// Fallback to CSV split
			return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
		}
	}

	/**
	 * Get agent name from SDK
	 */
	private async getAgentName(agentId: string): Promise<string> {
		try {
			const sdk = getSDK();
			const agent = await sdk.getAgent(agentId);
			return agent?.name || `Agent #${agentId}`;
		} catch (error) {
			console.warn(`Failed to fetch agent name for ${agentId}:`, error);
			return `Agent #${agentId}`;
		}
	}

	/**
	 * Notify all listeners
	 */
	private notifyListeners(events: ActivityEvent[]): void {
		for (const listener of this.listeners) {
			try {
				listener(events);
			} catch (error) {
				console.error('Error in event listener:', error);
			}
		}
	}

	/**
	 * Check if currently listening
	 */
	isActive(): boolean {
		return this.isListening;
	}
}

// Singleton instance
export const blockchainEventListener = new ERC8004EventListener();
