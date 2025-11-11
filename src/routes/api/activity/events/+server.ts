import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_URL = 'https://api-8004-dev.fly.dev';

/**
 * Server-side proxy for events endpoint
 * Forwards authenticated requests to Activity API
 */
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Get Authorization header from client request
		const authHeader = request.headers.get('Authorization');

		if (!authHeader) {
			return json(
				{ error: 'Authorization header required' },
				{ status: 401 }
			);
		}

		// Forward query parameters
		const queryParams = url.searchParams.toString();
		const apiUrl = queryParams
			? `${API_URL}/events?${queryParams}`
			: `${API_URL}/events`;

		// Forward request to Activity API with auth
		const response = await fetch(apiUrl, {
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
		console.error('Events proxy error:', error);
		return json(
			{ error: 'Failed to fetch events from activity API' },
			{ status: 500 }
		);
	}
};
