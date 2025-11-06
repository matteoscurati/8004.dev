import { describe, it, expect } from 'vitest';
import { apiEventToActivityEvent, apiEventsToActivityEvents } from '$lib/utils/event-adapter';
import type { Event } from '$lib/types/api';

describe('Event Adapter', () => {
	describe('apiEventToActivityEvent', () => {
		it('should convert AgentRegistered event', () => {
			const apiEvent: Event = {
				id: 1,
				block_number: 12345,
				block_timestamp: '2024-01-01T12:00:00Z',
				transaction_hash: '0x123',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'AgentRegistered',
				event_data: {
					agentId: 'agent_123',
					name: 'Test Agent',
				},
				created_at: '2024-01-01T12:00:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result).toEqual({
				id: 1,
				type: 'agent_registered',
				agentId: 'agent_123',
				agentName: 'Test Agent',
				timestamp: new Date('2024-01-01T12:00:00Z').getTime(),
			});
		});

		it('should convert CapabilityAdded event with MCP tool', () => {
			const apiEvent: Event = {
				id: 2,
				block_number: 12346,
				block_timestamp: '2024-01-01T12:01:00Z',
				transaction_hash: '0x124',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'CapabilityAdded',
				event_data: {
					agentId: 'agent_123',
					name: 'Test Agent',
					tool: 'filesystem',
					capabilityType: 'mcp',
				},
				created_at: '2024-01-01T12:01:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result).toEqual({
				id: 2,
				type: 'capability_added',
				agentId: 'agent_123',
				agentName: 'Test Agent',
				timestamp: new Date('2024-01-01T12:01:00Z').getTime(),
				metadata: {
					capability: 'filesystem',
					capabilityType: 'mcp',
				},
			});
		});

		it('should convert CapabilityAdded event with A2A skill', () => {
			const apiEvent: Event = {
				id: 3,
				block_number: 12347,
				block_timestamp: '2024-01-01T12:02:00Z',
				transaction_hash: '0x125',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'CapabilityAdded',
				event_data: {
					agentId: 'agent_123',
					name: 'Test Agent',
					skill: 'translate',
					capabilityType: 'a2a',
				},
				created_at: '2024-01-01T12:02:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result?.metadata?.capabilityType).toBe('a2a');
			expect(result?.metadata?.capability).toBe('translate');
		});

		it('should convert StatusChanged event', () => {
			const apiEvent: Event = {
				id: 4,
				block_number: 12348,
				block_timestamp: '2024-01-01T12:03:00Z',
				transaction_hash: '0x126',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'StatusChanged',
				event_data: {
					agentId: 'agent_123',
					name: 'Test Agent',
					previousStatus: false,
					currentStatus: true,
				},
				created_at: '2024-01-01T12:03:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result).toEqual({
				id: 4,
				type: 'status_changed',
				agentId: 'agent_123',
				agentName: 'Test Agent',
				timestamp: new Date('2024-01-01T12:03:00Z').getTime(),
				metadata: {
					previousStatus: false,
					currentStatus: true,
				},
			});
		});

		it('should convert X402Enabled event', () => {
			const apiEvent: Event = {
				id: 5,
				block_number: 12349,
				block_timestamp: '2024-01-01T12:04:00Z',
				transaction_hash: '0x127',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'X402Enabled',
				event_data: {
					agentId: 'agent_123',
					name: 'Test Agent',
				},
				created_at: '2024-01-01T12:04:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result).toEqual({
				id: 5,
				type: 'x402_enabled',
				agentId: 'agent_123',
				agentName: 'Test Agent',
				timestamp: new Date('2024-01-01T12:04:00Z').getTime(),
			});
		});

		it('should handle event with missing agent name', () => {
			const apiEvent: Event = {
				id: 6,
				block_number: 12350,
				block_timestamp: '2024-01-01T12:05:00Z',
				transaction_hash: '0x128',
				log_index: 0,
				contract_address: '0xabcdef123456',
				event_type: 'AgentRegistered',
				event_data: {
					agentId: 'agent_456',
					agent_id: '123'
				},
				created_at: '2024-01-01T12:05:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			// Should generate fallback name with agent_id
			expect(result?.agentName).toBe('Agent #123');
		});

		it('should handle event with alternative field names', () => {
			const apiEvent: Event = {
				id: 7,
				block_number: 12351,
				block_timestamp: '2024-01-01T12:06:00Z',
				transaction_hash: '0x129',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'agent_registered', // lowercase
				event_data: {
					agent: 'agent_789', // alternative field
					name: 'Another Agent',
				},
				created_at: '2024-01-01T12:06:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result?.type).toBe('agent_registered');
			expect(result?.agentId).toBe('agent_789');
		});

		it('should return null for unknown event type', () => {
			const apiEvent: Event = {
				id: 8,
				block_number: 12352,
				block_timestamp: '2024-01-01T12:07:00Z',
				transaction_hash: '0x130',
				log_index: 0,
				contract_address: '0xabc',
				event_type: 'UnknownEvent',
				event_data: {},
				created_at: '2024-01-01T12:07:00Z',
			};

			const result = apiEventToActivityEvent(apiEvent);

			expect(result).toBeNull();
		});
	});

	describe('apiEventsToActivityEvents', () => {
		it('should convert multiple events', () => {
			const apiEvents: Event[] = [
				{
					id: 1,
					block_number: 12345,
					block_timestamp: '2024-01-01T12:00:00Z',
					transaction_hash: '0x123',
					log_index: 0,
					contract_address: '0xabc',
					event_type: 'AgentRegistered',
					event_data: { agentId: 'agent_1', name: 'Agent 1' },
					created_at: '2024-01-01T12:00:00Z',
				},
				{
					id: 2,
					block_number: 12346,
					block_timestamp: '2024-01-01T12:01:00Z',
					transaction_hash: '0x124',
					log_index: 0,
					contract_address: '0xabc',
					event_type: 'X402Enabled',
					event_data: { agentId: 'agent_1', name: 'Agent 1' },
					created_at: '2024-01-01T12:01:00Z',
				},
			];

			const result = apiEventsToActivityEvents(apiEvents);

			expect(result).toHaveLength(2);
			expect(result[0].type).toBe('agent_registered');
			expect(result[1].type).toBe('x402_enabled');
		});

		it('should filter out null values (unknown events)', () => {
			const apiEvents: Event[] = [
				{
					id: 1,
					block_number: 12345,
					block_timestamp: '2024-01-01T12:00:00Z',
					transaction_hash: '0x123',
					log_index: 0,
					contract_address: '0xabc',
					event_type: 'AgentRegistered',
					event_data: { agentId: 'agent_1', name: 'Agent 1' },
					created_at: '2024-01-01T12:00:00Z',
				},
				{
					id: 2,
					block_number: 12346,
					block_timestamp: '2024-01-01T12:01:00Z',
					transaction_hash: '0x124',
					log_index: 0,
					contract_address: '0xabc',
					event_type: 'UnknownEvent',
					event_data: {},
					created_at: '2024-01-01T12:01:00Z',
				},
			];

			const result = apiEventsToActivityEvents(apiEvents);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('agent_registered');
		});

		it('should handle empty array', () => {
			const result = apiEventsToActivityEvents([]);

			expect(result).toHaveLength(0);
		});
	});
});
