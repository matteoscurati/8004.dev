import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		title: '8004.dev - Discover AI Agents on Ethereum',
		description:
			'Search and discover AI agents on Ethereum using the ERC-8004 standard. Filter by MCP tools, A2A skills, and more. Built with Agent0 SDK.',
		keywords:
			'AI agents, Ethereum, ERC-8004, Agent0, blockchain, web3, smart contracts, MCP, A2A, agent discovery',
		url: 'https://8004.dev',
		image: 'https://8004.dev/og-image.svg'
	};
};
