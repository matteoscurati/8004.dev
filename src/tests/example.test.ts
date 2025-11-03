import { describe, it, expect } from 'vitest';

/**
 * Example test to verify Vitest configuration works correctly.
 *
 * TODO: Add comprehensive test suite when @testing-library/svelte
 * adds full Svelte 5 runes support.
 *
 * See TEST_STRATEGY.md for full testing plan.
 */

describe('Vitest Configuration', () => {
	it('should run tests successfully', () => {
		expect(true).toBe(true);
	});

	it('should handle basic assertions', () => {
		const value = 42;
		expect(value).toBe(42);
		expect(value).toBeGreaterThan(40);
		expect(value).toBeLessThan(50);
	});

	it('should work with async tests', async () => {
		const promise = Promise.resolve('hello');
		await expect(promise).resolves.toBe('hello');
	});

	it('should handle arrays', () => {
		const arr = [1, 2, 3];
		expect(arr).toHaveLength(3);
		expect(arr).toContain(2);
	});

	it('should handle objects', () => {
		const obj = { name: 'test', count: 5 };
		expect(obj).toHaveProperty('name');
		expect(obj.count).toBe(5);
	});
});

describe('String Utilities (Example)', () => {
	function generateHash(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash;
		}
		return Math.abs(hash);
	}

	it('should generate consistent hash for same input', () => {
		const hash1 = generateHash('test');
		const hash2 = generateHash('test');
		expect(hash1).toBe(hash2);
	});

	it('should generate different hashes for different inputs', () => {
		const hash1 = generateHash('test1');
		const hash2 = generateHash('test2');
		expect(hash1).not.toBe(hash2);
	});

	it('should always return positive numbers', () => {
		const hash = generateHash('any string');
		expect(hash).toBeGreaterThanOrEqual(0);
	});
});
