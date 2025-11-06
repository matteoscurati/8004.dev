import { writable, derived } from 'svelte/store';
import { apiClient } from '$lib/api/client';
import type { LoginRequest } from '$lib/types/api';

interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isAuthenticated: apiClient.isAuthenticated(),
		isLoading: false,
		error: null,
	});

	return {
		subscribe,

		login: async (credentials: LoginRequest) => {
			update(state => ({ ...state, isLoading: true, error: null }));

			try {
				await apiClient.login(credentials);
				set({ isAuthenticated: true, isLoading: false, error: null });
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Login failed';
				set({ isAuthenticated: false, isLoading: false, error: message });
				throw error;
			}
		},

		autoLogin: async () => {
			// Don't show loading state for auto-login
			// Credentials handled securely server-side
			try {
				await apiClient.autoLogin();
				set({ isAuthenticated: true, isLoading: false, error: null });
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Auto-login failed';
				set({ isAuthenticated: false, isLoading: false, error: message });
				throw error;
			}
		},

		logout: () => {
			apiClient.logout();
			set({ isAuthenticated: false, isLoading: false, error: null });
		},

		clearError: () => {
			update(state => ({ ...state, error: null }));
		},

		// Check current authentication status
		checkAuth: () => {
			const isAuth = apiClient.isAuthenticated();
			update(state => ({ ...state, isAuthenticated: isAuth }));
			return isAuth;
		}
	};
}

export const authStore = createAuthStore();
export const isAuthenticated = derived(authStore, $auth => $auth.isAuthenticated);
