/**
 * Capabilities Metadata Database
 * Descriptions, categories, icons, and documentation links for MCP Tools and A2A Skills
 */

export interface CapabilityMetadata {
	name: string;
	description: string;
	category: 'filesystem' | 'communication' | 'database' | 'cloud' | 'version-control' | 'api' | 'payment' | 'data' | 'security' | 'other';
	icon: string; // Emoji or simple unicode character
	docUrl?: string; // Optional documentation link
	examples?: string[]; // Usage examples
}

// MCP Tools Metadata
export const mcpToolsMetadata: Record<string, CapabilityMetadata> = {
	// Filesystem
	'filesystem': {
		name: 'Filesystem',
		description: 'Read, write, and manage files on the local filesystem',
		category: 'filesystem',
		icon: '📁',
		docUrl: 'https://modelcontextprotocol.io/docs/tools/filesystem',
		examples: ['Read configuration files', 'Write logs', 'List directory contents']
	},
	'file': {
		name: 'File Operations',
		description: 'Basic file operations like read, write, delete',
		category: 'filesystem',
		icon: '📄',
		examples: ['Read file contents', 'Update files', 'Delete temporary files']
	},

	// Version Control
	'github': {
		name: 'GitHub',
		description: 'Interact with GitHub repositories, issues, and pull requests',
		category: 'version-control',
		icon: '🐙',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
		examples: ['Create issues', 'Review pull requests', 'Manage repositories']
	},
	'git': {
		name: 'Git',
		description: 'Git version control operations',
		category: 'version-control',
		icon: '🌿',
		examples: ['Commit changes', 'Branch management', 'View history']
	},

	// Database
	'postgresql': {
		name: 'PostgreSQL',
		description: 'Query and manage PostgreSQL databases',
		category: 'database',
		icon: '🐘',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
		examples: ['Execute SQL queries', 'Manage tables', 'Database migrations']
	},
	'sqlite': {
		name: 'SQLite',
		description: 'Lightweight embedded database operations',
		category: 'database',
		icon: '💾',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
		examples: ['Query local databases', 'Store structured data']
	},
	'database': {
		name: 'Database',
		description: 'General database operations and queries',
		category: 'database',
		icon: '🗄️',
		examples: ['Query data', 'Update records', 'Manage schemas']
	},

	// Communication
	'slack': {
		name: 'Slack',
		description: 'Send messages and interact with Slack workspaces',
		category: 'communication',
		icon: '💬',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
		examples: ['Send messages', 'Create channels', 'Manage notifications']
	},
	'email': {
		name: 'Email',
		description: 'Send and manage email communications',
		category: 'communication',
		icon: '📧',
		examples: ['Send emails', 'Read inbox', 'Manage contacts']
	},

	// Cloud Storage
	'gdrive': {
		name: 'Google Drive',
		description: 'Access and manage files in Google Drive',
		category: 'cloud',
		icon: '☁️',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
		examples: ['Upload files', 'Share documents', 'Manage folders']
	},
	'google-drive': {
		name: 'Google Drive',
		description: 'Access and manage files in Google Drive',
		category: 'cloud',
		icon: '☁️',
		examples: ['Upload files', 'Share documents', 'Manage folders']
	},

	// API & Web
	'fetch': {
		name: 'HTTP Fetch',
		description: 'Make HTTP requests to external APIs',
		category: 'api',
		icon: '🌐',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
		examples: ['Call REST APIs', 'Fetch web data', 'Webhook integrations']
	},
	'puppeteer': {
		name: 'Puppeteer',
		description: 'Browser automation and web scraping',
		category: 'api',
		icon: '🤖',
		docUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
		examples: ['Automate web tasks', 'Screenshot pages', 'Test web apps']
	},

	// Security
	'sequentialthinking': {
		name: 'Sequential Thinking',
		description: 'Advanced reasoning and problem-solving capabilities',
		category: 'security',
		icon: '🧠',
		examples: ['Complex analysis', 'Multi-step reasoning', 'Strategic planning']
	},

	// Data
	'search': {
		name: 'Search',
		description: 'Search and retrieve information',
		category: 'data',
		icon: '🔍',
		examples: ['Find documents', 'Query data', 'Full-text search']
	}
};

// A2A Skills Metadata
export const a2aSkillsMetadata: Record<string, CapabilityMetadata> = {
	// Payment & Finance
	'payment': {
		name: 'Payment Processing',
		description: 'Handle cryptocurrency and fiat payment transactions',
		category: 'payment',
		icon: '💰',
		docUrl: 'https://sdk.ag0.xyz',
		examples: ['Process payments', 'Verify transactions', 'Handle refunds']
	},
	'crypto-payment': {
		name: 'Crypto Payment',
		description: 'Process cryptocurrency payments on various chains',
		category: 'payment',
		icon: '₿',
		examples: ['Accept ETH', 'Process tokens', 'Multi-chain payments']
	},
	'cryptocurrency': {
		name: 'Cryptocurrency',
		description: 'Advanced cryptocurrency operations and trading capabilities',
		category: 'payment',
		icon: '💱',
		examples: ['Price tracking', 'Trading execution', 'Wallet management']
	},
	'defi': {
		name: 'DeFi',
		description: 'Decentralized finance protocols and operations',
		category: 'payment',
		icon: '🏦',
		examples: ['Lending protocols', 'DEX trading', 'Yield farming', 'Liquidity provision']
	},

	// Blockchain & Data
	'blockchain': {
		name: 'Blockchain',
		description: 'Interact with blockchain networks and smart contracts',
		category: 'data',
		icon: '💎',
		examples: ['Query blockchain data', 'Smart contract calls', 'Transaction monitoring']
	},
	'data-retrieval': {
		name: 'Data Retrieval',
		description: 'Fetch and aggregate data from various sources',
		category: 'data',
		icon: '📊',
		examples: ['Query databases', 'API integration', 'Data aggregation']
	},
	'data-processing': {
		name: 'Data Processing',
		description: 'Transform and analyze data',
		category: 'data',
		icon: '⚙️',
		examples: ['Data transformation', 'Analytics', 'ETL operations']
	},
	'market-research': {
		name: 'Market Research',
		description: 'Analyze market trends, trading volumes, and price movements',
		category: 'data',
		icon: '📈',
		examples: ['Market analysis', 'Trend identification', 'Volume tracking', 'Price predictions']
	},
	'alpha-detection': {
		name: 'Alpha Detection',
		description: 'Identify trading opportunities and market inefficiencies',
		category: 'data',
		icon: '🔍',
		examples: ['Signal detection', 'Arbitrage opportunities', 'Market anomalies', 'Alpha signals']
	},
	'social-sentiment': {
		name: 'Social Sentiment',
		description: 'Analyze social media sentiment and community discussions',
		category: 'data',
		icon: '💬',
		examples: ['Twitter sentiment', 'Reddit analysis', 'Community mood tracking', 'Trend detection']
	},

	// Multi-domain & Integration
	'multi-domain': {
		name: 'Multi-Domain',
		description: 'Capabilities spanning multiple domains and protocols',
		category: 'other',
		icon: '🌐',
		examples: ['Cross-protocol integration', 'Multi-chain operations', 'Unified interfaces']
	},
	'github': {
		name: 'GitHub',
		description: 'Interact with GitHub repositories and development workflows',
		category: 'version-control',
		icon: '🐙',
		examples: ['Repository management', 'Code analysis', 'CI/CD integration']
	},

	// Security
	'authentication': {
		name: 'Authentication',
		description: 'Verify identity and manage access control',
		category: 'security',
		icon: '🔐',
		examples: ['User login', 'Token verification', 'OAuth integration']
	},

	// Communication
	'messaging': {
		name: 'Messaging',
		description: 'Send and receive messages across platforms',
		category: 'communication',
		icon: '💬',
		examples: ['Send notifications', 'Chat integration', 'Message routing']
	},

	// API
	'api-integration': {
		name: 'API Integration',
		description: 'Connect with external services and APIs',
		category: 'api',
		icon: '🔌',
		examples: ['REST API calls', 'GraphQL queries', 'Webhook handling']
	}
};

/**
 * Get metadata for a capability (MCP tool or A2A skill)
 * Returns default metadata if capability is not found
 */
export function getCapabilityMetadata(
	capability: string,
	type: 'mcp' | 'a2a' | 'oasf-skill' | 'oasf-domain'
): CapabilityMetadata {
	const normalizedName = capability.toLowerCase().trim();

	// Handle OASF types with generic metadata
	if (type === 'oasf-skill') {
		// Extract category from skill path (e.g., "natural_language_processing/summarization" -> "natural_language_processing")
		const category = capability.split('/')[0]?.replace(/_/g, ' ') || 'OASF Skill';
		return {
			name: capability.split('/').pop()?.replace(/_/g, ' ') || capability,
			description: `OASF skill from the ${category} category`,
			category: 'other',
			icon: '🎯',
			docUrl: 'https://github.com/agntcy/oasf/',
			examples: [`Standardized skill from OASF taxonomy`]
		};
	}

	if (type === 'oasf-domain') {
		// Extract category from domain path (e.g., "finance_and_business/investment_services" -> "finance_and_business")
		const category = capability.split('/')[0]?.replace(/_/g, ' ') || 'OASF Domain';
		return {
			name: capability.split('/').pop()?.replace(/_/g, ' ') || capability,
			description: `OASF domain from the ${category} category`,
			category: 'other',
			icon: '🏢',
			docUrl: 'https://github.com/agntcy/oasf/',
			examples: [`Standardized domain from OASF taxonomy`]
		};
	}

	const database = type === 'mcp' ? mcpToolsMetadata : a2aSkillsMetadata;

	// Try exact match first
	if (database[normalizedName]) {
		return database[normalizedName];
	}

	// Try partial match (e.g., "github-api" matches "github")
	for (const [key, metadata] of Object.entries(database)) {
		if (normalizedName.includes(key) || key.includes(normalizedName)) {
			return metadata;
		}
	}

	// Return default metadata for unknown capabilities
	return {
		name: capability,
		description: type === 'mcp'
			? 'Custom MCP tool - no documentation available'
			: 'Custom A2A skill - no documentation available',
		category: 'other',
		icon: type === 'mcp' ? '🔧' : '⚡',
		examples: ['Usage information not available']
	};
}

/**
 * Get color for capability category (matches pixel art theme)
 */
export function getCategoryColor(category: CapabilityMetadata['category']): string {
	const colors = {
		filesystem: '#00ff41',      // Matrix green
		communication: '#00d4ff',   // Cyan
		database: '#ff00ff',        // Magenta
		cloud: '#00aaff',          // Sky blue
		'version-control': '#ffdd00', // Yellow
		api: '#ff9500',            // Orange
		payment: '#00ff88',        // Mint
		data: '#aa00ff',           // Purple
		security: '#ff0055',       // Red
		other: '#888888'           // Gray
	};
	return colors[category] || colors.other;
}
