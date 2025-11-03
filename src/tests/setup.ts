import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock $app/environment for SvelteKit
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

// Mock environment variables
vi.stubEnv('PUBLIC_RPC_URL', 'https://eth-sepolia.example.com/v2/test');
vi.stubEnv('PUBLIC_CHAIN_ID', '11155111');
vi.stubEnv('PUBLIC_IPFS_PROVIDER', 'pinata');
vi.stubEnv('PUBLIC_PINATA_JWT', 'test_jwt_token');
vi.stubEnv('PUBLIC_IPFS_NODE_URL', '');
