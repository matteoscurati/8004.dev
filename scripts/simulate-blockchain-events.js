/**
 * Simulate blockchain events for testing
 *
 * This script simulates historical blockchain events by creating mock events
 * that match the ActivityEvent interface. Useful for testing the UI when
 * there are no recent events on the blockchain.
 */

console.log('🧪 Simulating Blockchain Events for Testing\n');

// Create mock events
const mockEvents = [
	{
		type: 'agent_registered',
		agentId: '971',
		agentName: 'Test Agent #971',
		timestamp: Date.now() - 3600000 // 1 hour ago
	},
	{
		type: 'capability_added',
		agentId: '971',
		agentName: 'Test Agent #971',
		timestamp: Date.now() - 3000000, // 50 minutes ago
		metadata: {
			capability: 'a2a',
			capabilityType: 'a2a'
		}
	},
	{
		type: 'status_changed',
		agentId: '971',
		agentName: 'Test Agent #971',
		timestamp: Date.now() - 2400000, // 40 minutes ago
		metadata: {
			currentStatus: true
		}
	},
	{
		type: 'agent_registered',
		agentId: '972',
		agentName: 'Another Agent #972',
		timestamp: Date.now() - 1800000 // 30 minutes ago
	},
	{
		type: 'capability_added',
		agentId: '972',
		agentName: 'Another Agent #972',
		timestamp: Date.now() - 1200000, // 20 minutes ago
		metadata: {
			capability: 'filesystem',
			capabilityType: 'mcp'
		}
	},
	{
		type: 'x402_enabled',
		agentId: '972',
		agentName: 'Another Agent #972',
		timestamp: Date.now() - 600000 // 10 minutes ago
	},
	{
		type: 'agent_registered',
		agentId: '973',
		agentName: 'New Agent #973',
		timestamp: Date.now() - 300000 // 5 minutes ago
	}
];

console.log(`Created ${mockEvents.length} mock events`);
console.log('\nEvents:');
mockEvents.forEach((event, i) => {
	const age = Math.floor((Date.now() - event.timestamp) / 60000);
	console.log(`  [${i + 1}] ${event.type} - ${event.agentName} (${age}m ago)`);
});

// Note: ActivityStorage is browser-only (uses localStorage)
// So we'll output JSON that can be manually added to localStorage
console.log('\n\n📋 To use these events, add them to localStorage in your browser console:');
console.log('localStorage.setItem(\'activity_feed_events\', JSON.stringify(' + JSON.stringify(mockEvents) + '));');
console.log('\nThen refresh the page.');

console.log('\n✅ Mock events ready for testing!');
