import type { LoginRequest, LoginResponse, ApiError, Event, EventsResponse, Stats } from '$lib/types/api';

/**
 * API Client for ERC-8004 Activity Feed
 * Uses server-side proxy routes for secure authentication
 */
class ApiClient {
	private baseUrl: string;
	private token: string | null = null;
	private tokenExpiresAt: Date | null = null;
	private loginPromise: Promise<void> | null = null;

	constructor(baseUrl: string = '/api/activity') {
		this.baseUrl = baseUrl;
		// Try to load token from localStorage if in browser
		if (typeof window !== 'undefined') {
			this.loadTokenFromStorage();
		}
	}

	// Load token from localStorage
	private loadTokenFromStorage() {
		try {
			const token = localStorage.getItem('api_jwt_token');
			const expiresAt = localStorage.getItem('api_jwt_expires_at');

			if (token && expiresAt) {
				const expiryDate = new Date(expiresAt);
				// Only use token if it hasn't expired
				if (expiryDate > new Date()) {
					this.token = token;
					this.tokenExpiresAt = expiryDate;
					console.log('Loaded valid JWT token from storage');
				} else {
					// Clear expired token
					this.clearTokenFromStorage();
				}
			}
		} catch (error) {
			console.error('Failed to load token from storage:', error);
		}
	}

	// Save token to localStorage
	private saveTokenToStorage(token: string, expiresAt: string) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('api_jwt_token', token);
				localStorage.setItem('api_jwt_expires_at', expiresAt);
			} catch (error) {
				console.error('Failed to save token to storage:', error);
			}
		}
	}

	// Clear token from localStorage
	private clearTokenFromStorage() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.removeItem('api_jwt_token');
				localStorage.removeItem('api_jwt_expires_at');
			} catch (error) {
				console.error('Failed to clear token from storage:', error);
			}
		}
	}

	// Set token
	setToken(token: string, expiresAt: string) {
		this.token = token;
		this.tokenExpiresAt = new Date(expiresAt);
		this.saveTokenToStorage(token, expiresAt);
	}

	// Clear token
	clearToken() {
		this.token = null;
		this.tokenExpiresAt = null;
		this.clearTokenFromStorage();
	}

	// Get current token
	getToken(): string | null {
		return this.token;
	}

	// Check if token is expired
	isTokenExpired(): boolean {
		if (!this.tokenExpiresAt) return true;
		return this.tokenExpiresAt <= new Date();
	}

	// Check if authenticated
	isAuthenticated(): boolean {
		return this.token !== null && !this.isTokenExpired();
	}

	// Auto-login using server-side credentials (secure)
	// Credentials are stored server-side, never exposed to client
	async autoLogin(): Promise<void> {
		// If already logged in with valid token, skip
		if (this.isAuthenticated()) {
			return;
		}

		// If a login is already in progress, wait for it
		if (this.loginPromise) {
			return this.loginPromise;
		}

		// Start new login
		this.loginPromise = (async () => {
			try {
				// Server-side proxy handles credentials securely
				const response = await this.request<LoginResponse>('/login', {
					method: 'POST',
				});

				this.setToken(response.token, response.expires_at);
				console.log('Auto-login successful (server-side)');
			} catch (error) {
				console.error('Auto-login failed:', error);
				throw error;
			} finally {
				this.loginPromise = null;
			}
		})();

		return this.loginPromise;
	}

	// Make HTTP request
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options.headers as Record<string, string>),
		};

		// Add token if present and not login endpoint
		if (this.token && !endpoint.includes('/login')) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			if (response.status === 401) {
				// Token expired or invalid
				this.clearToken();
				throw new Error('Unauthorized: Token expired or invalid');
			}

			const error: ApiError = await response.json().catch(() => ({
				error: `HTTP ${response.status}: ${response.statusText}`,
			}));
			throw new Error(error.error || 'API request failed');
		}

		return response.json();
	}

	// Login (for manual login - server-side proxy handles credentials)
	async login(credentials?: LoginRequest): Promise<LoginResponse> {
		const response = await this.request<LoginResponse>('/login', {
			method: 'POST',
			body: credentials ? JSON.stringify(credentials) : undefined,
		});

		this.setToken(response.token, response.expires_at);
		return response;
	}

	// Logout
	logout() {
		this.clearToken();
	}

	// Get events with filters
	async getEvents(params?: {
		limit?: number;
		offset?: number;
		contract?: string;
		event_type?: string;
		from_block?: number;
		to_block?: number;
	}): Promise<EventsResponse> {
		// Ensure authenticated before making request
		await this.autoLogin();

		const searchParams = new URLSearchParams();

		if (params?.limit) searchParams.set('limit', params.limit.toString());
		if (params?.offset) searchParams.set('offset', params.offset.toString());
		if (params?.contract) searchParams.set('contract', params.contract);
		if (params?.event_type) searchParams.set('event_type', params.event_type);
		if (params?.from_block) searchParams.set('from_block', params.from_block.toString());
		if (params?.to_block) searchParams.set('to_block', params.to_block.toString());

		const query = searchParams.toString();
		const endpoint = query ? `/events?${query}` : '/events';

		return this.request<EventsResponse>(endpoint);
	}

	// Get statistics
	async getStats(): Promise<Stats> {
		// Ensure authenticated before making request
		await this.autoLogin();
		return this.request<Stats>('/stats');
	}

	// Health check (no auth required)
	async healthCheck(): Promise<{ service: string; status: string }> {
		return this.request('/health');
	}
}

// Export singleton instance (uses local proxy routes)
export const apiClient = new ApiClient();
