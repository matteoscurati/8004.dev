import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { API_USERNAME, API_PASSWORD } from '$env/static/private';

const API_URL = 'https://api-8004-dev.fly.dev';

/**
 * Server-side proxy for authentication
 * Keeps credentials secure on the server
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get credentials from server environment (not exposed to client)

		if (!API_PASSWORD) {
			return json(
				{ error: 'Server configuration error: API_PASSWORD not set' },
				{ status: 500 }
			);
		}

		// Forward login request to Activity API
		const response = await fetch(`${API_URL}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: API_USERNAME,
				password: API_PASSWORD,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			return json(error, { status: response.status });
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Login proxy error:', error);
		return json(
			{ error: 'Failed to authenticate with activity API' },
			{ status: 500 }
		);
	}
};
