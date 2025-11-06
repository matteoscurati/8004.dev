import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_URL = 'https://api-8004-dev.fly.dev';

/**
 * Server-side proxy for stats endpoint
 * Forwards authenticated requests to Activity API
 */
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Get Authorization header from client request
		const authHeader = request.headers.get('Authorization');

		if (!authHeader) {
			return json(
				{ error: 'Authorization header required' },
				{ status: 401 }
			);
		}

		// Forward request to Activity API with auth
		const response = await fetch(`${API_URL}/stats`, {
			headers: {
				'Authorization': authHeader,
			},
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({
				error: `API request failed: ${response.status}`,
			}));
			return json(error, { status: response.status });
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Stats proxy error:', error);
		return json(
			{ error: 'Failed to fetch stats from activity API' },
			{ status: 500 }
		);
	}
};
