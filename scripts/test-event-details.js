/**
 * Test script to inspect actual event data from Activity API
 * This helps us understand what metadata is available for displaying details
 */

const API_URL = 'https://api-8004-dev.fly.dev';

// Test credentials (from .env)
const USERNAME = 'admin';
const PASSWORD = '42zyw7pqmXDStKsLEs3OkY57TVf8Pf7JTg9OvXBh8YwKL0fEur1KKjITrLuk+WEH';

async function login() {
	const response = await fetch(`${API_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username: USERNAME, password: PASSWORD })
	});

	if (!response.ok) {
		throw new Error(`Login failed: ${response.status}`);
	}

	const data = await response.json();
	return data.token;
}

async function fetchEvents(token) {
	const response = await fetch(`${API_URL}/events?limit=50&offset=0`, {
		headers: { 'Authorization': `Bearer ${token}` }
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch events: ${response.status}`);
	}

	return response.json();
}

async function main() {
	try {
		console.log('🔐 Logging in...');
		const token = await login();
		console.log('✅ Login successful\n');

		console.log('📡 Fetching events...');
		const data = await fetchEvents(token);
		console.log(`✅ Fetched ${data.events.length} events\n`);

		// Group events by type
		const eventsByType = {};
		for (const event of data.events) {
			const type = typeof event.event_type === 'string'
				? event.event_type
				: event.event_type?.type;

			if (!eventsByType[type]) {
				eventsByType[type] = [];
			}
			eventsByType[type].push(event);
		}

		console.log('📊 Events by type:');
		for (const [type, events] of Object.entries(eventsByType)) {
			console.log(`  ${type}: ${events.length} events`);
		}
		console.log('');

		// Show detailed examples for each event type
		console.log('🔍 DETAILED EVENT EXAMPLES:\n');
		console.log('='.repeat(80));

		for (const [type, events] of Object.entries(eventsByType)) {
			console.log(`\n### ${type.toUpperCase()} ###`);
			console.log(`Total: ${events.length} events\n`);

			// Show first 2 examples
			const examples = events.slice(0, 2);
			for (let i = 0; i < examples.length; i++) {
				const event = examples[i];
				console.log(`Example ${i + 1}:`);
				console.log(JSON.stringify(event, null, 2));
				console.log('');
			}
			console.log('-'.repeat(80));
		}

		// Special focus on MetadataSet events to see if we have before/after
		console.log('\n🎯 METADATA UPDATE ANALYSIS:\n');
		console.log('='.repeat(80));
		const metadataEvents = eventsByType['MetadataSet'] || [];
		if (metadataEvents.length > 0) {
			console.log(`Found ${metadataEvents.length} MetadataSet events\n`);

			for (const event of metadataEvents.slice(0, 5)) {
				console.log(`Agent: ${event.event_data.agent || event.contract_address}`);
				console.log(`Key: ${event.event_data.key}`);
				console.log(`Value (hex): ${event.event_data.value}`);

				// Try to decode hex value
				if (event.event_data.value && event.event_data.value.startsWith('0x')) {
					try {
						const hex = event.event_data.value.slice(2);
						let str = '';
						for (let i = 0; i < hex.length; i += 2) {
							const charCode = parseInt(hex.substr(i, 2), 16);
							if (charCode) str += String.fromCharCode(charCode);
						}
						console.log(`Value (decoded): ${str || '(empty)'}`);
					} catch (e) {
						console.log(`Value (decoded): (decode failed)`);
					}
				}

				console.log(`Transaction: ${event.transaction_hash}`);
				console.log(`Block: ${event.block_number}`);
				console.log(`Timestamp: ${event.block_timestamp}`);

				// Check if event_data has previous value
				console.log(`Has 'previousValue': ${!!event.event_data.previousValue}`);
				console.log(`Has 'oldValue': ${!!event.event_data.oldValue}`);
				console.log(`Has 'before': ${!!event.event_data.before}`);

				console.log(`\nAll event_data keys: ${Object.keys(event.event_data).join(', ')}`);
				console.log('');
				console.log('-'.repeat(40));
			}
		} else {
			console.log('❌ No MetadataSet events found');
		}

		// Check StatusChanged events
		console.log('\n🎯 STATUS CHANGE ANALYSIS:\n');
		console.log('='.repeat(80));
		const statusEvents = eventsByType['StatusChanged'] || eventsByType['status_changed'] || [];
		if (statusEvents.length > 0) {
			console.log(`Found ${statusEvents.length} StatusChanged events\n`);

			for (const event of statusEvents.slice(0, 3)) {
				console.log(`Agent: ${event.event_data.agent || event.contract_address}`);
				console.log(`Current Status: ${event.event_data.currentStatus || event.event_data.active}`);
				console.log(`Previous Status: ${event.event_data.previousStatus || 'N/A'}`);
				console.log(`All event_data keys: ${Object.keys(event.event_data).join(', ')}`);
				console.log('');
				console.log('-'.repeat(40));
			}
		} else {
			console.log('❌ No StatusChanged events found');
		}

	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

main();
