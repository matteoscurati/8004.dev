/**
 * Test Activity Feed API Connection
 *
 * Quick script to verify API is reachable and working
 */

const API_URL = 'https://api-8004-dev.fly.dev';

async function testHealthCheck() {
	console.log('Testing health check endpoint...');
	try {
		const response = await fetch(`${API_URL}/health`);
		const data = await response.json();
		console.log('✓ Health check:', data);
		return true;
	} catch (error) {
		console.error('✕ Health check failed:', error.message);
		return false;
	}
}

async function testLogin(username, password) {
	console.log('\nTesting login...');
	try {
		const response = await fetch(`${API_URL}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('✕ Login failed:', error);
			return null;
		}

		const data = await response.json();
		console.log('✓ Login successful');
		console.log('  Token expires at:', data.expires_at);
		return data.token;
	} catch (error) {
		console.error('✕ Login failed:', error.message);
		return null;
	}
}

async function testEventsEndpoint(token) {
	console.log('\nTesting events endpoint...');
	try {
		const response = await fetch(`${API_URL}/events?limit=5`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('✕ Events request failed:', error);
			return false;
		}

		const data = await response.json();
		console.log('✓ Events endpoint working');
		console.log(`  Total events: ${data.total}`);
		console.log(`  Retrieved: ${data.events.length} events`);

		if (data.events.length > 0) {
			console.log('\n  Sample event:');
			const event = data.events[0];
			console.log(`    Type: ${event.event_type}`);
			console.log(`    Block: ${event.block_number}`);
			console.log(`    Time: ${event.block_timestamp}`);
		}

		return true;
	} catch (error) {
		console.error('✕ Events request failed:', error.message);
		return false;
	}
}

async function testStatsEndpoint(token) {
	console.log('\nTesting stats endpoint...');
	try {
		const response = await fetch(`${API_URL}/stats`, {
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('✕ Stats request failed:', error);
			return false;
		}

		const data = await response.json();
		console.log('✓ Stats endpoint working');
		console.log(`  Last synced block: ${data.last_synced_block}`);
		console.log(`  Total events: ${data.total_events}`);
		console.log(`  Events by type:`, data.events_by_type);

		return true;
	} catch (error) {
		console.error('✕ Stats request failed:', error.message);
		return false;
	}
}

async function main() {
	console.log('=== Activity Feed API Test ===\n');
	console.log(`API URL: ${API_URL}\n`);

	// Get credentials from command line or use defaults
	const username = process.argv[2] || 'admin';
	const password = process.argv[3];

	if (!password) {
		console.error('Error: Password required');
		console.log('\nUsage: node scripts/test-activity-api.js <username> <password>');
		process.exit(1);
	}

	// Run tests
	const healthOk = await testHealthCheck();
	if (!healthOk) {
		console.log('\n❌ API is not reachable. Tests aborted.');
		process.exit(1);
	}

	const token = await testLogin(username, password);
	if (!token) {
		console.log('\n❌ Authentication failed. Tests aborted.');
		process.exit(1);
	}

	await testEventsEndpoint(token);
	await testStatsEndpoint(token);

	console.log('\n=== All tests completed ===\n');
}

main();
