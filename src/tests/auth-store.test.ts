import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth';
import { apiClient } from '$lib/api/client';

// Mock apiClient
vi.mock('$lib/api/client', () => ({
	apiClient: {
		login: vi.fn(),
		autoLogin: vi.fn(),
		logout: vi.fn(),
		isAuthenticated: vi.fn(),
	},
}));

describe('Auth Store', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Initial State', () => {
		it('should have correct initial state', () => {
			const state = get(authStore);

			// apiClient.isAuthenticated is mocked and returns undefined initially
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
			// isAuthenticated depends on mocked apiClient
		});
	});

	describe('Login', () => {
		it('should set loading state during login', async () => {
			const loginPromise = new Promise((resolve) => setTimeout(resolve, 100));
			vi.mocked(apiClient.login).mockReturnValue(loginPromise as any);

			const loginAttempt = authStore.login({ username: 'admin', password: 'test' });

			// Check loading state immediately
			const stateWhileLoading = get(authStore);
			expect(stateWhileLoading.isLoading).toBe(true);
			expect(stateWhileLoading.error).toBeNull();

			await loginAttempt;
		});

		it('should set authenticated on successful login', async () => {
			vi.mocked(apiClient.login).mockResolvedValue({
				token: 'test_token',
				expires_at: '2024-12-31T00:00:00Z',
			});

			await authStore.login({ username: 'admin', password: 'test' });

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(true);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});

		it('should set error on failed login', async () => {
			vi.mocked(apiClient.login).mockRejectedValue(new Error('Invalid credentials'));

			await expect(authStore.login({ username: 'admin', password: 'wrong' })).rejects.toThrow();

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBe('Invalid credentials');
		});

		it('should handle non-Error objects in catch', async () => {
			vi.mocked(apiClient.login).mockRejectedValue('String error');

			await expect(authStore.login({ username: 'admin', password: 'test' })).rejects.toThrow();

			const state = get(authStore);
			expect(state.error).toBe('Login failed');
		});
	});

	describe('Auto Login', () => {
		it('should authenticate silently without loading state', async () => {
			vi.mocked(apiClient.autoLogin).mockResolvedValue();

			await authStore.autoLogin();

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(true);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});

		it('should handle auto-login failure', async () => {
			vi.mocked(apiClient.autoLogin).mockRejectedValue(new Error('Auto-login failed'));

			await expect(authStore.autoLogin()).rejects.toThrow();

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
			expect(state.error).toBe('Auto-login failed');
		});
	});

	describe('Logout', () => {
		it('should clear authentication state', () => {
			authStore.logout();

			expect(apiClient.logout).toHaveBeenCalled();

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
			expect(state.isLoading).toBe(false);
			expect(state.error).toBeNull();
		});
	});

	describe('Clear Error', () => {
		it('should clear error without affecting other state', async () => {
			// Set error state
			vi.mocked(apiClient.login).mockRejectedValue(new Error('Test error'));
			await expect(authStore.login({ username: 'admin', password: 'test' })).rejects.toThrow();

			const stateWithError = get(authStore);
			expect(stateWithError.error).toBe('Test error');

			// Clear error
			authStore.clearError();

			const stateAfterClear = get(authStore);
			expect(stateAfterClear.error).toBeNull();
			expect(stateAfterClear.isAuthenticated).toBe(false); // Other state unchanged
		});
	});

	describe('Check Auth', () => {
		it('should update state based on apiClient authentication status', () => {
			vi.mocked(apiClient.isAuthenticated).mockReturnValue(true);

			const result = authStore.checkAuth();

			expect(result).toBe(true);

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(true);
		});

		it('should return false when not authenticated', () => {
			vi.mocked(apiClient.isAuthenticated).mockReturnValue(false);

			const result = authStore.checkAuth();

			expect(result).toBe(false);

			const state = get(authStore);
			expect(state.isAuthenticated).toBe(false);
		});
	});
});
