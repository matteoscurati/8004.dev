<script lang="ts">
	/**
	 * Maps capability emoji icons to pixel-art SVG icons
	 * Provides fallback for unsupported emojis in Atlas browser
	 */

	let { emoji, size = 12 }: {
		emoji: string;
		size?: number;
	} = $props();

	// Emoji to icon type mapping
	const emojiMap: Record<string, { icon: string; colors: string[] }> = {
		// Filesystem
		'📁': { icon: 'folder', colors: ['#ffa726', '#ff9800', '#f57c00'] },
		'📄': { icon: 'file', colors: ['#42a5f5', '#2196f3', '#1976d2'] },

		// Version Control
		'🐙': { icon: 'github', colors: ['#9c27b0', '#7b1fa2', '#4a148c'] },
		'🌿': { icon: 'branch', colors: ['#66bb6a', '#4caf50', '#388e3c'] },

		// Database
		'🐘': { icon: 'database', colors: ['#42a5f5', '#2196f3', '#1976d2'] },
		'💾': { icon: 'disk', colors: ['#78909c', '#607d8b', '#455a64'] },
		'🗄️': { icon: 'server', colors: ['#616161', '#424242', '#212121'] },

		// Communication
		'💬': { icon: 'chat', colors: ['#ab47bc', '#9c27b0', '#7b1fa2'] },
		'📧': { icon: 'email', colors: ['#ef5350', '#f44336', '#d32f2f'] },

		// Cloud
		'☁️': { icon: 'cloud', colors: ['#64b5f6', '#42a5f5', '#2196f3'] },

		// Crypto/Finance
		'₿': { icon: 'bitcoin', colors: ['#ff9800', '#f57c00', '#e65100'] },
		'💰': { icon: 'money', colors: ['#66bb6a', '#4caf50', '#388e3c'] },
		'💱': { icon: 'exchange', colors: ['#26a69a', '#009688', '#00796b'] },
		'🏦': { icon: 'bank', colors: ['#5c6bc0', '#3f51b5', '#303f9f'] },
		'💎': { icon: 'diamond', colors: ['#29b6f6', '#03a9f4', '#0288d1'] },

		// Analytics
		'📊': { icon: 'chart', colors: ['#ba68c8', '#ab47bc', '#8e24aa'] },
		'📈': { icon: 'trend', colors: ['#66bb6a', '#4caf50', '#388e3c'] },

		// General
		'🔍': { icon: 'search', colors: ['#ffa726', '#ff9800', '#f57c00'] },
		'🔌': { icon: 'plugin', colors: ['#ffca28', '#ffc107', '#ffa000'] },
		'⚙️': { icon: 'settings', colors: ['#78909c', '#607d8b', '#455a64'] },
		'🔐': { icon: 'lock', colors: ['#ef5350', '#f44336', '#d32f2f'] },
		'🌐': { icon: 'web', colors: ['#42a5f5', '#2196f3', '#1976d2'] },
		'🤖': { icon: 'robot', colors: ['#2196f3', '#1976d2', '#1565c0'] },
		'🧠': { icon: 'brain', colors: ['#ec407a', '#e91e63', '#c2185b'] },

		// Tools
		'🔧': { icon: 'wrench', colors: ['#ff9800', '#f57c00', '#e65100'] },
		'⚡': { icon: 'bolt', colors: ['#ffeb3b', '#ffc107', '#ff9800'] }
	};

	const iconData = emojiMap[emoji];
</script>

{#if iconData}
	{#if iconData.icon === 'folder'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="1" y="4" width="14" height="10" fill={iconData.colors[0]}/>
			<rect x="2" y="5" width="12" height="8" fill={iconData.colors[1]}/>
			<rect x="1" y="2" width="6" height="2" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'file'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="3" y="1" width="10" height="14" fill={iconData.colors[0]}/>
			<rect x="4" y="2" width="8" height="12" fill={iconData.colors[1]}/>
			<rect x="5" y="4" width="6" height="1" fill={iconData.colors[2]}/>
			<rect x="5" y="6" width="6" height="1" fill={iconData.colors[2]}/>
			<rect x="5" y="8" width="4" height="1" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'github'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="6" y="2" width="4" height="4" fill={iconData.colors[0]}/>
			<rect x="4" y="4" width="2" height="2" fill={iconData.colors[0]}/>
			<rect x="10" y="4" width="2" height="2" fill={iconData.colors[0]}/>
			<rect x="3" y="6" width="10" height="4" fill={iconData.colors[1]}/>
			<rect x="5" y="10" width="2" height="4" fill={iconData.colors[0]}/>
			<rect x="9" y="10" width="2" height="4" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'branch'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="3" y="2" width="2" height="2" fill={iconData.colors[0]}/>
			<rect x="3" y="4" width="2" height="8" fill={iconData.colors[1]}/>
			<rect x="5" y="6" width="6" height="2" fill={iconData.colors[1]}/>
			<rect x="11" y="4" width="2" height="4" fill={iconData.colors[1]}/>
			<rect x="11" y="2" width="2" height="2" fill={iconData.colors[0]}/>
			<rect x="3" y="12" width="2" height="2" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'database'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<ellipse cx="8" cy="4" rx="6" ry="2" fill={iconData.colors[0]}/>
			<rect x="2" y="4" width="12" height="8" fill={iconData.colors[1]}/>
			<ellipse cx="8" cy="12" rx="6" ry="2" fill={iconData.colors[2]}/>
			<ellipse cx="8" cy="8" rx="6" ry="1" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'disk'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="2" width="12" height="12" fill={iconData.colors[0]}/>
			<rect x="3" y="3" width="10" height="10" fill={iconData.colors[1]}/>
			<rect x="6" y="6" width="4" height="4" fill={iconData.colors[2]}/>
			<circle cx="8" cy="8" r="1" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'server'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="1" y="2" width="14" height="3" fill={iconData.colors[0]}/>
			<rect x="1" y="6" width="14" height="3" fill={iconData.colors[1]}/>
			<rect x="1" y="10" width="14" height="3" fill={iconData.colors[2]}/>
			<circle cx="3" cy="3.5" r="0.5" fill="#4caf50"/>
			<circle cx="3" cy="7.5" r="0.5" fill="#4caf50"/>
			<circle cx="3" cy="11.5" r="0.5" fill="#4caf50"/>
		</svg>
	{:else if iconData.icon === 'chat'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="2" width="12" height="9" fill={iconData.colors[0]}/>
			<rect x="3" y="3" width="10" height="7" fill={iconData.colors[1]}/>
			<rect x="5" y="11" width="2" height="3" fill={iconData.colors[0]}/>
			<rect x="5" y="5" width="6" height="1" fill={iconData.colors[2]}/>
			<rect x="5" y="7" width="4" height="1" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'email'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="1" y="3" width="14" height="10" fill={iconData.colors[0]}/>
			<rect x="2" y="4" width="12" height="8" fill={iconData.colors[1]}/>
			<path d="M 2 4 L 8 8 L 14 4" stroke={iconData.colors[2]} stroke-width="2" fill="none"/>
		</svg>
	{:else if iconData.icon === 'cloud'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="4" y="6" width="8" height="4" fill={iconData.colors[0]}/>
			<rect x="2" y="8" width="12" height="4" fill={iconData.colors[1]}/>
			<rect x="5" y="4" width="6" height="2" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'bitcoin'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="8" cy="8" r="6" fill={iconData.colors[0]}/>
			<rect x="6" y="4" width="2" height="8" fill={iconData.colors[2]}/>
			<rect x="8" y="5" width="3" height="2" fill={iconData.colors[2]}/>
			<rect x="8" y="9" width="3" height="2" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'money'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="5" width="12" height="6" fill={iconData.colors[0]}/>
			<circle cx="8" cy="8" r="2" fill={iconData.colors[2]}/>
			<rect x="7" y="6" width="2" height="4" fill={iconData.colors[1]}/>
		</svg>
	{:else if iconData.icon === 'exchange'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="4" width="10" height="2" fill={iconData.colors[0]}/>
			<rect x="4" y="10" width="10" height="2" fill={iconData.colors[1]}/>
			<rect x="12" y="2" width="2" height="4" fill={iconData.colors[0]}/>
			<rect x="2" y="10" width="2" height="4" fill={iconData.colors[1]}/>
		</svg>
	{:else if iconData.icon === 'bank'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M 8 2 L 2 6 L 14 6 Z" fill={iconData.colors[0]}/>
			<rect x="3" y="7" width="2" height="6" fill={iconData.colors[1]}/>
			<rect x="7" y="7" width="2" height="6" fill={iconData.colors[1]}/>
			<rect x="11" y="7" width="2" height="6" fill={iconData.colors[1]}/>
			<rect x="2" y="13" width="12" height="2" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'diamond'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M 8 2 L 14 8 L 8 14 L 2 8 Z" fill={iconData.colors[0]}/>
			<path d="M 8 2 L 12 8 L 8 14 L 4 8 Z" fill={iconData.colors[1]}/>
		</svg>
	{:else if iconData.icon === 'chart'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="8" width="3" height="6" fill={iconData.colors[0]}/>
			<rect x="6" y="5" width="3" height="9" fill={iconData.colors[1]}/>
			<rect x="10" y="2" width="3" height="12" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'trend'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M 2 12 L 5 9 L 8 10 L 12 4 L 14 6" stroke={iconData.colors[0]} stroke-width="2" fill="none"/>
			<rect x="10" y="2" width="4" height="2" fill={iconData.colors[1]}/>
			<rect x="12" y="2" width="2" height="6" fill={iconData.colors[1]}/>
		</svg>
	{:else if iconData.icon === 'search'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="7" cy="7" r="4" stroke={iconData.colors[0]} stroke-width="2" fill="none"/>
			<rect x="10" y="10" width="2" height="4" fill={iconData.colors[1]} transform="rotate(45 11 12)"/>
		</svg>
	{:else if iconData.icon === 'plugin'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="4" y="6" width="3" height="6" fill={iconData.colors[0]}/>
			<rect x="9" y="6" width="3" height="6" fill={iconData.colors[0]}/>
			<rect x="5" y="2" width="1" height="4" fill={iconData.colors[1]}/>
			<rect x="10" y="2" width="1" height="4" fill={iconData.colors[1]}/>
			<rect x="3" y="12" width="10" height="2" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'settings'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="8" cy="8" r="3" fill={iconData.colors[1]}/>
			<rect x="7" y="2" width="2" height="3" fill={iconData.colors[0]}/>
			<rect x="7" y="11" width="2" height="3" fill={iconData.colors[0]}/>
			<rect x="2" y="7" width="3" height="2" fill={iconData.colors[0]}/>
			<rect x="11" y="7" width="3" height="2" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'lock'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="4" y="7" width="8" height="7" fill={iconData.colors[0]}/>
			<rect x="5" y="8" width="6" height="5" fill={iconData.colors[1]}/>
			<rect x="6" y="3" width="4" height="4" fill="none" stroke={iconData.colors[0]} stroke-width="2"/>
			<circle cx="8" cy="11" r="1" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'web'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="8" cy="8" r="6" stroke={iconData.colors[0]} stroke-width="2" fill="none"/>
			<ellipse cx="8" cy="8" rx="3" ry="6" stroke={iconData.colors[1]} stroke-width="1" fill="none"/>
			<line x1="2" y1="8" x2="14" y2="8" stroke={iconData.colors[1]} stroke-width="1"/>
		</svg>
	{:else if iconData.icon === 'robot'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="4" y="3" width="8" height="6" fill={iconData.colors[0]}/>
			<rect x="5" y="4" width="2" height="2" fill={iconData.colors[2]}/>
			<rect x="9" y="4" width="2" height="2" fill={iconData.colors[2]}/>
			<rect x="2" y="10" width="12" height="4" fill={iconData.colors[1]}/>
			<rect x="7" y="1" width="2" height="2" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'brain'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<ellipse cx="5" cy="8" rx="3" ry="5" fill={iconData.colors[0]}/>
			<ellipse cx="11" cy="8" rx="3" ry="5" fill={iconData.colors[1]}/>
			<circle cx="8" cy="6" r="2" fill={iconData.colors[2]}/>
		</svg>
	{:else if iconData.icon === 'wrench'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="2" y="2" width="6" height="2" fill={iconData.colors[0]}/>
			<rect x="2" y="4" width="2" height="4" fill={iconData.colors[1]}/>
			<rect x="6" y="4" width="2" height="10" fill={iconData.colors[0]}/>
			<rect x="8" y="6" width="6" height="2" fill={iconData.colors[1]}/>
			<rect x="12" y="8" width="2" height="6" fill={iconData.colors[0]}/>
		</svg>
	{:else if iconData.icon === 'bolt'}
		<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="8" y="0" width="2" height="2" fill={iconData.colors[0]}/>
			<rect x="6" y="2" width="2" height="2" fill={iconData.colors[0]}/>
			<rect x="4" y="4" width="2" height="2" fill={iconData.colors[1]}/>
			<rect x="2" y="6" width="6" height="2" fill={iconData.colors[1]}/>
			<rect x="6" y="8" width="2" height="2" fill={iconData.colors[2]}/>
			<rect x="8" y="10" width="2" height="2" fill={iconData.colors[2]}/>
			<rect x="10" y="12" width="2" height="4" fill={iconData.colors[2]}/>
		</svg>
	{/if}
{:else}
	<!-- Fallback: show emoji as-is -->
	<span style="font-size: {size}px">{emoji}</span>
{/if}

<style>
	svg {
		display: inline-block;
		vertical-align: middle;
	}

	span {
		display: inline-block;
		line-height: 1;
	}
</style>
