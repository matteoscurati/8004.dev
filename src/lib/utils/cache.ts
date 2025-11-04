/**
 * Simple in-memory cache with LRU eviction and TTL
 * Used to cache search results and reduce redundant API calls
 */

interface CacheEntry<T> {
	value: T;
	timestamp: number;
	accessCount: number;
	lastAccess: number;
}

export class LRUCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private maxSize: number;
	private ttl: number; // Time to live in milliseconds

	constructor(maxSize: number = 50, ttlMinutes: number = 5) {
		this.maxSize = maxSize;
		this.ttl = ttlMinutes * 60 * 1000;
	}

	/**
	 * Generate a cache key from an object (filters, params, etc.)
	 */
	static hashKey(obj: any): string {
		// Simple hash function for cache keys
		// Sorts keys to ensure consistent hashing
		const str = JSON.stringify(obj, Object.keys(obj).sort());
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash.toString(36);
	}

	/**
	 * Get value from cache if valid (not expired)
	 */
	get(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		const now = Date.now();
		const age = now - entry.timestamp;

		// Check if entry is expired
		if (age > this.ttl) {
			this.cache.delete(key);
			return null;
		}

		// Update access metadata for LRU
		entry.lastAccess = now;
		entry.accessCount++;

		return entry.value;
	}

	/**
	 * Set value in cache with LRU eviction if needed
	 */
	set(key: string, value: T): void {
		const now = Date.now();

		// If at capacity, evict least recently used entry
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			this.evictLRU();
		}

		this.cache.set(key, {
			value,
			timestamp: now,
			accessCount: 1,
			lastAccess: now
		});
	}

	/**
	 * Evict the least recently used entry
	 */
	private evictLRU(): void {
		let lruKey: string | null = null;
		let lruTime = Infinity;

		// Find entry with oldest lastAccess time
		for (const [key, entry] of this.cache.entries()) {
			if (entry.lastAccess < lruTime) {
				lruTime = entry.lastAccess;
				lruKey = key;
			}
		}

		if (lruKey) {
			this.cache.delete(lruKey);
		}
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Remove expired entries (cleanup)
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.ttl) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			ttl: this.ttl
		};
	}
}
