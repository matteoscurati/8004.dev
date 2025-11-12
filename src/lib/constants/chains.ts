/**
 * Blockchain network configurations for Agent0 SDK
 * Supporting Ethereum, Base, and Polygon testnets
 */

export interface ChainConfig {
	id: number;
	name: string;
	shortName: string;
	color: string; // For UI badges
	icon?: string; // Emoji or icon
	explorerUrl: string;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
	11155111: {
		id: 11155111,
		name: 'Ethereum Sepolia',
		shortName: 'ETH',
		color: '#627EEA',
		icon: '⟠',
		explorerUrl: 'https://sepolia.etherscan.io'
	},
	84532: {
		id: 84532,
		name: 'Base Sepolia',
		shortName: 'BASE',
		color: '#0052FF',
		icon: '🔵',
		explorerUrl: 'https://sepolia.basescan.org'
	},
	80002: {
		id: 80002,
		name: 'Polygon Amoy',
		shortName: 'POL',
		color: '#8247E5',
		icon: '◆',
		explorerUrl: 'https://amoy.polygonscan.com'
	}
};

export const CHAIN_IDS = Object.keys(SUPPORTED_CHAINS).map(Number);

export const DEFAULT_CHAIN_ID = 11155111; // Ethereum Sepolia

/**
 * Get chain configuration by ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
	return SUPPORTED_CHAINS[chainId];
}

/**
 * Get chain name by ID (with fallback)
 */
export function getChainName(chainId: number): string {
	return SUPPORTED_CHAINS[chainId]?.name || `Chain ${chainId}`;
}

/**
 * Get chain short name by ID (with fallback)
 */
export function getChainShortName(chainId: number): string {
	return SUPPORTED_CHAINS[chainId]?.shortName || `${chainId}`;
}

/**
 * Get chain color by ID (with fallback)
 */
export function getChainColor(chainId: number): string {
	return SUPPORTED_CHAINS[chainId]?.color || '#666666';
}

/**
 * Get chain icon by ID (with fallback)
 */
export function getChainIcon(chainId: number): string {
	return SUPPORTED_CHAINS[chainId]?.icon || '⛓️';
}

/**
 * Get explorer URL for an address on a specific chain
 */
export function getExplorerUrl(chainId: number, address: string): string {
	const config = SUPPORTED_CHAINS[chainId];
	if (!config) return '';
	return `${config.explorerUrl}/address/${address}`;
}

/**
 * Get explorer URL for a transaction on a specific chain
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
	const config = SUPPORTED_CHAINS[chainId];
	if (!config) return '';
	return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Check if chainId is supported
 */
export function isSupportedChain(chainId: number): boolean {
	return chainId in SUPPORTED_CHAINS;
}
