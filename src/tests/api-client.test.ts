import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '$lib/api/client';

describe('API Client', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock fetch
		fetchMock = vi.fn();
		global.fetch = fetchMock;

		// Mock localStorage
		const localStorageMock = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn(),
			length: 0,
			key: vi.fn(),
		};
		global.localStorage = localStorageMock as any;

		// Clear any existing tokens
		apiClient.clearToken();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Token Management', () => {
		it('should save token to localStorage', () => {
			const token = 'test_token_123';
			const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

			apiClient.setToken(token, expiresAt);

			expect(localStorage.setItem).toHaveBeenCalledWith('api_jwt_token', token);
			expect(localStorage.setItem).toHaveBeenCalledWith('api_jwt_expires_at', expiresAt);
		});

		it('should clear token from localStorage', () => {
			apiClient.clearToken();

			expect(localStorage.removeItem).toHaveBeenCalledWith('api_jwt_token');
			expect(localStorage.removeItem).toHaveBeenCalledWith('api_jwt_expires_at');
		});

		it('should check if token is expired', () => {
			const expiredDate = new Date(Date.now() - 1000).toISOString();
			apiClient.setToken('test_token', expiredDate);

			expect(apiClient.isTokenExpired()).toBe(true);
		});

		it('should check if token is not expired', () => {
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('test_token', futureDate);

			expect(apiClient.isTokenExpired()).toBe(false);
		});

		it('should identify as authenticated with valid token', () => {
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('test_token', futureDate);

			expect(apiClient.isAuthenticated()).toBe(true);
		});

		it('should identify as not authenticated with expired token', () => {
			const expiredDate = new Date(Date.now() - 1000).toISOString();
			apiClient.setToken('test_token', expiredDate);

			expect(apiClient.isAuthenticated()).toBe(false);
		});
	});

	describe('Auto Login', () => {
		it('should auto-login successfully', async () => {
			const mockResponse = {
				token: 'jwt_token_here',
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			} as Response);

			await apiClient.autoLogin();

			expect(fetchMock).toHaveBeenCalledWith(
				'/api/activity/login',
				expect.objectContaining({
					method: 'POST',
				})
			);

			expect(apiClient.isAuthenticated()).toBe(true);
		});

		it('should skip auto-login if already authenticated', async () => {
			// Set valid token
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('existing_token', futureDate);

			await apiClient.autoLogin();

			// Fetch should not be called
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('should handle auto-login failure', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ error: 'Unauthorized' }),
			} as Response);

			await expect(apiClient.autoLogin()).rejects.toThrow();
		});
	});

	describe('Get Events', () => {
		beforeEach(() => {
			// Set valid token for authenticated requests
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('valid_token', futureDate);
		});

		it('should fetch events with default parameters', async () => {
			const mockEvents = {
				events: [
					{
						id: 1,
						block_number: 12345,
						event_type: 'AgentRegistered',
						event_data: {},
					},
				],
				total: 1,
				limit: 10,
				offset: 0,
			};

			// Mock auto-login (skip)
			// Mock events request
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			const result = await apiClient.getEvents();

			expect(result.events).toHaveLength(1);
			expect(result.total).toBe(1);
		});

		it('should fetch events with custom parameters', async () => {
			const mockEvents = {
				events: [],
				total: 0,
				limit: 20,
				offset: 10,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			await apiClient.getEvents({ limit: 20, offset: 10, event_type: 'AgentRegistered' });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('limit=20'),
				expect.any(Object)
			);
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('offset=10'),
				expect.any(Object)
			);
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('event_type=AgentRegistered'),
				expect.any(Object)
			);
		});

		it('should include Authorization header in requests', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ events: [], total: 0, limit: 10, offset: 0 }),
			} as Response);

			await apiClient.getEvents();

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer valid_token',
					}),
				})
			);
		});

		it('should fetch events for a single chain', async () => {
			const mockEvents = {
				events: [],
				total: 0,
				limit: 10,
				offset: 0,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			await apiClient.getEvents({ chain_id: 11155111 });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('chain_id=11155111'),
				expect.any(Object)
			);
		});

		it('should fetch events for multiple chains', async () => {
			const mockEvents = {
				events: [],
				total: 0,
				limit: 10,
				offset: 0,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			await apiClient.getEvents({ chain_id: [11155111, 84532, 80002] });

			// URL encodes comma as %2C
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('chain_id=11155111%2C84532%2C80002'),
				expect.any(Object)
			);
		});

		it('should fetch events for all chains when chain_id is "all"', async () => {
			const mockEvents = {
				events: [],
				total: 0,
				limit: 10,
				offset: 0,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			await apiClient.getEvents({ chain_id: 'all' });

			// Should NOT include chain_id parameter
			expect(fetchMock).toHaveBeenCalledWith(
				expect.not.stringContaining('chain_id'),
				expect.any(Object)
			);
		});

		it('should fetch events for all chains when chain_id is undefined', async () => {
			const mockEvents = {
				events: [],
				total: 0,
				limit: 10,
				offset: 0,
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockEvents,
			} as Response);

			await apiClient.getEvents({ limit: 20 }); // No chain_id provided

			// Should NOT include chain_id parameter
			expect(fetchMock).toHaveBeenCalledWith(
				expect.not.stringContaining('chain_id'),
				expect.any(Object)
			);
		});
	});

	describe('Get Stats', () => {
		beforeEach(() => {
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('valid_token', futureDate);
		});

		it('should fetch stats successfully', async () => {
			const mockStats = {
				last_synced_block: 12345,
				last_synced_at: '2024-01-01T00:00:00Z',
				total_events: 100,
				events_by_type: {
					AgentRegistered: 50,
					CapabilityAdded: 30,
				},
				events_by_contract: {},
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockStats,
			} as Response);

			const result = await apiClient.getStats();

			expect(result.total_events).toBe(100);
			expect(result.last_synced_block).toBe(12345);
		});
	});

	describe('Error Handling', () => {
		it('should clear token on 401 Unauthorized', async () => {
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('invalid_token', futureDate);

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ error: 'Unauthorized' }),
			} as Response);

			await expect(apiClient.getEvents()).rejects.toThrow('Unauthorized');
			expect(apiClient.isAuthenticated()).toBe(false);
		});

		it('should handle network errors', async () => {
			fetchMock.mockRejectedValueOnce(new Error('Network error'));

			await expect(apiClient.autoLogin()).rejects.toThrow('Network error');
		});

		it('should handle malformed JSON responses', async () => {
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			apiClient.setToken('valid_token', futureDate);

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => {
					throw new Error('Invalid JSON');
				},
			} as Response);

			await expect(apiClient.getEvents()).rejects.toThrow();
		});
	});
});
