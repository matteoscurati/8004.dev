/**
 * Event Adapter - Converts API events to ActivityEvent format
 */

import type { Event } from '$lib/types/api';
import type { ActivityEvent } from '$lib/services/activity-tracker';

/**
 * Decode hex string to UTF-8 (browser-safe)
 */
function decodeHexValue(hexValue: string): string {
	if (!hexValue || !hexValue.startsWith('0x')) return hexValue;

	try {
		const hex = hexValue.slice(2);
		let str = '';
		for (let i = 0; i < hex.length; i += 2) {
			const charCode = parseInt(hex.substr(i, 2), 16);
			if (charCode) str += String.fromCharCode(charCode);
		}
		return str || hexValue;
	} catch (e) {
		console.warn('Failed to decode hex value:', e);
		return hexValue;
	}
}

/**
 * Convert API Event to ActivityEvent format for the UI
 */
export function apiEventToActivityEvent(apiEvent: Event): ActivityEvent | null {
	const timestamp = new Date(apiEvent.block_timestamp).getTime();
	const eventId = apiEvent.id; // Preserve unique API event ID

	// Extract agent info from event_data
	const { agent, agentId, agent_id, name, owner, token_uri } = apiEvent.event_data;
	const eventAgentId = agentId || agent_id || agent || apiEvent.contract_address;
	const eventAgentName = name || `Agent #${agent_id || 'Unknown'}`;

	// Handle event_type being either string or object
	const eventType = typeof apiEvent.event_type === 'string'
		? apiEvent.event_type
		: (apiEvent.event_type as any)?.type;

	// Map event types from API to ActivityEvent types
	switch (eventType) {
		case 'Registered':
		case 'AgentRegistered':
		case 'agent_registered':
			return {
				id: eventId,
				type: 'agent_registered',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp
			};

		case 'MetadataSet': {
			const key = apiEvent.event_data.key;
			const hexValue = apiEvent.event_data.value;
			const decodedValue = decodeHexValue(hexValue);

			// Special handling for agentName updates
			if (key === 'agentName') {
				return {
					id: eventId,
					type: 'agent_updated',
					agentId: eventAgentId,
					agentName: decodedValue,
					timestamp,
					metadata: {
						key: 'agentName',
						value: hexValue,
						decodedValue
					}
				};
			}

			// Generic metadata update
			return {
				id: eventId,
				type: 'metadata_updated',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp,
				metadata: {
					key,
					value: hexValue,
					decodedValue
				}
			};
		}

		case 'ValidationRequest':
			return {
				id: eventId,
				type: 'validation_request',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp,
				metadata: {
					requestHash: apiEvent.event_data.request_hash,
					requestUri: apiEvent.event_data.request_uri,
					validatorAddress: apiEvent.event_data.validator_address
				}
			};

		case 'ValidationResponse':
			return {
				id: eventId,
				type: 'validation_response',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp,
				metadata: {
					requestHash: apiEvent.event_data.request_hash,
					responseUri: apiEvent.event_data.response_uri,
					validatorAddress: apiEvent.event_data.validator_address,
					response: apiEvent.event_data.response
				}
			};

		case 'NewFeedback':
			return {
				id: eventId,
				type: 'feedback_received',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp,
				metadata: {
					score: apiEvent.event_data.score,
					feedbackUri: apiEvent.event_data.feedback_uri,
					client: apiEvent.event_data.client
				}
			};

		case 'CapabilityAdded':
		case 'capability_added': {
			// Determine capability type from event data
			const capability = apiEvent.event_data.capability || apiEvent.event_data.tool || apiEvent.event_data.skill;
			const capabilityType = apiEvent.event_data.capabilityType ||
				(apiEvent.event_data.tool ? 'mcp' : 'a2a');

			return {
				id: eventId,
				type: 'capability_added',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp,
				metadata: {
					capability,
					capabilityType: capabilityType as 'mcp' | 'a2a'
				}
			};
		}

		case 'StatusChanged':
		case 'status_changed':
			return {
				id: eventId,
				type: 'status_changed',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp,
				metadata: {
					previousStatus: apiEvent.event_data.previousStatus,
					currentStatus: apiEvent.event_data.currentStatus || apiEvent.event_data.active
				}
			};

		case 'X402Enabled':
		case 'x402_enabled':
			return {
				id: eventId,
				type: 'x402_enabled',
				agentId: eventAgentId,
				agentName: eventAgentName,
				timestamp
			};

		default:
			// Unknown event type
			console.warn('Unknown event type:', apiEvent.event_type);
			return null;
	}
}

/**
 * Convert multiple API events to ActivityEvents
 */
export function apiEventsToActivityEvents(apiEvents: Event[]): ActivityEvent[] {
	return apiEvents
		.map(apiEventToActivityEvent)
		.filter((e): e is ActivityEvent => e !== null);
}
