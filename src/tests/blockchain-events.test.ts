import { describe, it, expect } from 'vitest';
import type { ActivityEvent } from '$lib/services/activity-tracker';

/**
 * Test suite for Blockchain Event Parsing
 *
 * Tests the parsing logic for ERC-8004 blockchain events:
 * - Hex value decoding
 * - MetadataSet event parsing
 * - Event type detection
 * - Array value parsing
 */

// Helper functions extracted from blockchain-events.ts for testing
function decodeMetadataValue(value: string): string {
	// If value starts with 0x, it's hex-encoded bytes
	if (value.startsWith('0x')) {
		try {
			// Remove 0x prefix and convert hex to string
			const hex = value.slice(2);
			let str = '';
			for (let i = 0; i < hex.length; i += 2) {
				const charCode = parseInt(hex.substr(i, 2), 16);
				if (charCode > 0) {
					// Skip null bytes
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

function parseArrayValue(value: string): string[] {
	try {
		// Try JSON parse first
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [parsed];
	} catch {
		// Fallback to CSV split
		return value
			.split(',')
			.map((v) => v.trim())
			.filter((v) => v.length > 0);
	}
}

async function parseMetadataEvent(
	agentId: string,
	agentName: string,
	key: string,
	value: string,
	timestamp: number
): Promise<ActivityEvent[]> {
	const events: ActivityEvent[] = [];

	// Decode the value from bytes/hex if needed
	const decodedValue = decodeMetadataValue(value);

	// Parse based on key
	switch (key) {
		case 'active':
		case 'status':
			// Status change event
			try {
				const isActive =
					decodedValue.toLowerCase() === 'true' || decodedValue === '1';
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
				const isEnabled =
					decodedValue.toLowerCase() === 'true' || decodedValue === '1';
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
				const tools = parseArrayValue(decodedValue);
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
				const skills = parseArrayValue(decodedValue);
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
			// Ignore other metadata keys
			break;
	}

	return events;
}

describe('Blockchain Event Parsing', () => {
	describe('decodeMetadataValue', () => {
		it('should decode hex-encoded string values', () => {
			// "true" in hex
			const hexValue = '0x74727565';
			const decoded = decodeMetadataValue(hexValue);
			expect(decoded).toBe('true');
		});

		it('should decode hex-encoded JSON array', () => {
			// '["filesystem","github"]' in hex
			const hexValue =
				'0x5b2266696c6573797374656d222c22676974687562225d';
			const decoded = decodeMetadataValue(hexValue);
			expect(decoded).toBe('["filesystem","github"]');
		});

		it('should handle plain string values without 0x prefix', () => {
			const plainValue = 'true';
			const decoded = decodeMetadataValue(plainValue);
			expect(decoded).toBe('true');
		});

		it('should skip null bytes in hex values', () => {
			// "hi" with null bytes: h=68, i=69, null=00
			const hexValue = '0x68690000';
			const decoded = decodeMetadataValue(hexValue);
			expect(decoded).toBe('hi');
		});

		it('should return empty string if hex decoding produces invalid characters', () => {
			const invalidHex = '0xZZZZ';
			const decoded = decodeMetadataValue(invalidHex);
			// parseInt with invalid hex returns NaN, which results in empty string
			expect(decoded).toBe('');
		});
	});

	describe('parseArrayValue', () => {
		it('should parse JSON array', () => {
			const jsonArray = '["tool1", "tool2", "tool3"]';
			const parsed = parseArrayValue(jsonArray);
			expect(parsed).toEqual(['tool1', 'tool2', 'tool3']);
		});

		it('should parse CSV string', () => {
			const csvString = 'tool1, tool2, tool3';
			const parsed = parseArrayValue(csvString);
			expect(parsed).toEqual(['tool1', 'tool2', 'tool3']);
		});

		it('should handle single value as array', () => {
			const singleValue = '"tool1"';
			const parsed = parseArrayValue(singleValue);
			expect(parsed).toEqual(['tool1']);
		});

		it('should filter out empty values', () => {
			const csvWithEmpty = 'tool1, , tool3, ';
			const parsed = parseArrayValue(csvWithEmpty);
			expect(parsed).toEqual(['tool1', 'tool3']);
		});

		it('should trim whitespace from CSV values', () => {
			const csvWithSpaces = '  tool1  ,  tool2  ,  tool3  ';
			const parsed = parseArrayValue(csvWithSpaces);
			expect(parsed).toEqual(['tool1', 'tool2', 'tool3']);
		});
	});

	describe('parseMetadataEvent', () => {
		const testAgentId = '123';
		const testAgentName = 'Test Agent';
		const testTimestamp = Date.now();

		describe('status events', () => {
			it('should parse active=true as status_changed', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'active',
					'true',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('status_changed');
				expect(events[0].metadata?.currentStatus).toBe(true);
			});

			it('should parse active=false as status_changed', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'active',
					'false',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('status_changed');
				expect(events[0].metadata?.currentStatus).toBe(false);
			});

			it('should parse active=1 as status_changed (active)', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'active',
					'1',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].metadata?.currentStatus).toBe(true);
			});

			it('should parse status key same as active', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'status',
					'true',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('status_changed');
			});
		});

		describe('x402 events', () => {
			it('should parse x402support=true as x402_enabled', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'x402support',
					'true',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('x402_enabled');
			});

			it('should not create event if x402support=false', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'x402support',
					'false',
					testTimestamp
				);

				expect(events).toHaveLength(0);
			});

			it('should parse x402 key same as x402support', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'x402',
					'true',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('x402_enabled');
			});
		});

		describe('MCP tool events', () => {
			it('should parse single MCP tool', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'mcpTools',
					'["filesystem"]',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('capability_added');
				expect(events[0].metadata?.capability).toBe('filesystem');
				expect(events[0].metadata?.capabilityType).toBe('mcp');
			});

			it('should parse multiple MCP tools', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'mcpTools',
					'["filesystem","github","postgres"]',
					testTimestamp
				);

				expect(events).toHaveLength(3);
				expect(events[0].metadata?.capability).toBe('filesystem');
				expect(events[1].metadata?.capability).toBe('github');
				expect(events[2].metadata?.capability).toBe('postgres');
				expect(events.every((e) => e.metadata?.capabilityType === 'mcp')).toBe(
					true
				);
			});

			it('should parse mcp key same as mcpTools', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'mcp',
					'["filesystem"]',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('capability_added');
			});
		});

		describe('A2A skill events', () => {
			it('should parse single A2A skill', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'a2aSkills',
					'["python"]',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('capability_added');
				expect(events[0].metadata?.capability).toBe('python');
				expect(events[0].metadata?.capabilityType).toBe('a2a');
			});

			it('should parse multiple A2A skills', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'a2aSkills',
					'["python","javascript","rust"]',
					testTimestamp
				);

				expect(events).toHaveLength(3);
				expect(events.every((e) => e.metadata?.capabilityType === 'a2a')).toBe(
					true
				);
			});

			it('should parse a2a key same as a2aSkills', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'a2a',
					'["python"]',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('capability_added');
			});

			it('should parse communicationProtocol key same as a2aSkills', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'communicationProtocol',
					'["python"]',
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('capability_added');
			});
		});

		describe('unknown metadata keys', () => {
			it('should ignore unknown metadata keys', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'unknownKey',
					'someValue',
					testTimestamp
				);

				expect(events).toHaveLength(0);
			});

			it('should ignore name metadata', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'name',
					'Agent Name',
					testTimestamp
				);

				expect(events).toHaveLength(0);
			});

			it('should ignore description metadata', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'description',
					'Agent description',
					testTimestamp
				);

				expect(events).toHaveLength(0);
			});
		});

		describe('hex-encoded metadata values', () => {
			it('should decode hex-encoded status value', async () => {
				// "true" in hex
				const hexValue = '0x74727565';
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'active',
					hexValue,
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].type).toBe('status_changed');
				expect(events[0].metadata?.currentStatus).toBe(true);
			});

			it('should decode hex-encoded MCP tools', async () => {
				// '["filesystem"]' in hex
				const hexValue = '0x5b2266696c6573797374656d225d';
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'mcpTools',
					hexValue,
					testTimestamp
				);

				expect(events).toHaveLength(1);
				expect(events[0].metadata?.capability).toBe('filesystem');
			});
		});

		describe('event structure', () => {
			it('should include correct agent information', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'active',
					'true',
					testTimestamp
				);

				expect(events[0].agentId).toBe(testAgentId);
				expect(events[0].agentName).toBe(testAgentName);
				expect(events[0].timestamp).toBe(testTimestamp);
			});

			it('should preserve timestamp for all events', async () => {
				const events = await parseMetadataEvent(
					testAgentId,
					testAgentName,
					'mcpTools',
					'["tool1","tool2"]',
					testTimestamp
				);

				expect(events.every((e) => e.timestamp === testTimestamp)).toBe(true);
			});
		});
	});
});
