import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as loginPOST } from '../routes/api/activity/login/+server';
import { GET as eventsGET } from '../routes/api/activity/events/+server';
import { GET as statsGET } from '../routes/api/activity/stats/+server';

// Mock environment variables
vi.stubEnv('API_USERNAME', 'test_admin');
vi.stubEnv('API_PASSWORD', 'test_password');

describe('Server Routes', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		global.fetch = fetchMock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('POST /api/activity/login', () => {
		it('should forward login request with server credentials', async () => {
			const mockResponse = {
				token: 'jwt_token_123',
				expires_at: '2024-12-31T00:00:00Z',
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as Response);

			const request = new Request('http://localhost/api/activity/login', {
				method: 'POST',
			});

			const response = await loginPOST({ request } as any);
			const data = await response.json();

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api-8004-dev.fly.dev/login',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						username: 'test_admin',
						password: 'test_password',
					}),
				})
			);

			expect(data.token).toBe('jwt_token_123');
		});

		it('should return 500 if API_PASSWORD not configured', async () => {
			vi.stubEnv('API_PASSWORD', '');

			const request = new Request('http://localhost/api/activity/login', {
				method: 'POST',
			});

			const response = await loginPOST({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toContain('API_PASSWORD not set');

			// Restore
			vi.stubEnv('API_PASSWORD', 'test_password');
		});

		it('should forward API errors', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ error: 'Invalid credentials' }),
			} as Response);

			const request = new Request('http://localhost/api/activity/login', {
				method: 'POST',
			});

			const response = await loginPOST({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Invalid credentials');
		});

		it('should handle network errors', async () => {
			fetchMock.mockRejectedValueOnce(new Error('Network error'));

			const request = new Request('http://localhost/api/activity/login', {
				method: 'POST',
			});

			const response = await loginPOST({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toContain('Failed to authenticate');
		});
	});

	describe('GET /api/activity/events', () => {
		it('should require Authorization header', async () => {
			const request = new Request('http://localhost/api/activity/events');
			const url = new URL('http://localhost/api/activity/events');

			const response = await eventsGET({ request, url } as any);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Authorization header required');
		});

		it('should forward events request with auth', async () => {
			const mockEvents = {
				events: [{ id: 1, event_type: 'AgentRegistered' }],
				total: 1,
				limit: 10,
				offset: 0,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			const request = new Request('http://localhost/api/activity/events', {
				headers: {
					Authorization: 'Bearer test_token_123',
				},
			});
			const url = new URL('http://localhost/api/activity/events');

			const response = await eventsGET({ request, url } as any);
			const data = await response.json();

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api-8004-dev.fly.dev/events',
				expect.objectContaining({
					headers: {
						Authorization: 'Bearer test_token_123',
					},
				})
			);

			expect(data.events).toHaveLength(1);
		});

		it('should forward query parameters', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ events: [], total: 0, limit: 20, offset: 10 }),
			} as Response);

			const request = new Request('http://localhost/api/activity/events?limit=20&offset=10', {
				headers: {
					Authorization: 'Bearer test_token',
				},
			});
			const url = new URL('http://localhost/api/activity/events?limit=20&offset=10');

			await eventsGET({ request, url } as any);

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api-8004-dev.fly.dev/events?limit=20&offset=10',
				expect.any(Object)
			);
		});

		it('should handle API errors', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: 'Server error' }),
			} as Response);

			const request = new Request('http://localhost/api/activity/events', {
				headers: {
					Authorization: 'Bearer test_token',
				},
			});
			const url = new URL('http://localhost/api/activity/events');

			const response = await eventsGET({ request, url } as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Server error');
		});
	});

	describe('GET /api/activity/stats', () => {
		it('should require Authorization header', async () => {
			const request = new Request('http://localhost/api/activity/stats');

			const response = await statsGET({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('Authorization header required');
		});

		it('should forward stats request with auth', async () => {
			const mockStats = {
				last_synced_block: 12345,
				last_synced_at: '2024-01-01T00:00:00Z',
				total_events: 100,
				events_by_type: {},
				events_by_contract: {},
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockStats,
			} as Response);

			const request = new Request('http://localhost/api/activity/stats', {
				headers: {
					Authorization: 'Bearer test_token_123',
				},
			});

			const response = await statsGET({ request } as any);
			const data = await response.json();

			expect(fetchMock).toHaveBeenCalledWith(
				'https://api-8004-dev.fly.dev/stats',
				expect.objectContaining({
					headers: {
						Authorization: 'Bearer test_token_123',
					},
				})
			);

			expect(data.total_events).toBe(100);
		});

		it('should handle network errors', async () => {
			fetchMock.mockRejectedValueOnce(new Error('Network error'));

			const request = new Request('http://localhost/api/activity/stats', {
				headers: {
					Authorization: 'Bearer test_token',
				},
			});

			const response = await statsGET({ request } as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toContain('Failed to fetch stats');
		});
	});
});
