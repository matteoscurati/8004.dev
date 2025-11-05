<script lang="ts">
	/**
	 * Pixel-art style SVG icons for retro 8-bit aesthetic
	 * Rich, colorful icons compatible with all browsers including Atlas
	 */

	type IconType =
		| 'robot'       // 🤖 Agent
		| 'lightning'   // ⚡ Capability
		| 'refresh'     // 🔄 Status
		| 'dollar'      // 💳 Payment
		| 'chart'       // 📊 Stats
		| 'check'       // ✅ Active
		| 'tool'        // 🔧 MCP Tool
		| 'handshake'   // 🤝 A2A
		| 'music'       // ♪ Music
		| 'speaker'     // 🔊 Sound on
		| 'mute'        // 🔇 Sound off
		| 'warning'     // ⚠ Warning
		| 'dot'         // • Dot
		| 'book';       // 📖 Documentation

	let { type, size = 16, color }: {
		type: IconType;
		size?: number;
		color?: string;
	} = $props();

	// Default color if not provided
	const iconColor = color || 'currentColor';
</script>

{#if type === 'robot'}
	<!-- Colorful robot with blue body, cyan eyes, yellow antenna -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<!-- Antenna -->
		<rect x="7" y="0" width="2" height="2" fill="#ffeb3b"/>
		<circle cx="8" cy="0.5" r="1" fill="#ff9800"/>
		<!-- Head -->
		<rect x="4" y="2" width="8" height="6" fill="#2196f3"/>
		<rect x="3" y="3" width="10" height="4" fill="#42a5f5"/>
		<!-- Eyes -->
		<rect x="5" y="4" width="2" height="2" fill="#00e5ff"/>
		<rect x="9" y="4" width="2" height="2" fill="#00e5ff"/>
		<!-- Mouth -->
		<rect x="6" y="7" width="4" height="1" fill="#1976d2"/>
		<!-- Body -->
		<rect x="2" y="9" width="12" height="5" fill="#1976d2"/>
		<rect x="3" y="10" width="10" height="3" fill="#2196f3"/>
		<!-- Details -->
		<rect x="7" y="11" width="2" height="1" fill="#00e5ff"/>
	</svg>
{:else if type === 'lightning'}
	<!-- Yellow/orange lightning bolt -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="8" y="0" width="2" height="2" fill="#ffeb3b"/>
		<rect x="6" y="2" width="2" height="2" fill="#ffeb3b"/>
		<rect x="4" y="4" width="2" height="2" fill="#ffc107"/>
		<rect x="2" y="6" width="6" height="2" fill="#ffc107"/>
		<rect x="6" y="8" width="2" height="2" fill="#ff9800"/>
		<rect x="8" y="10" width="2" height="2" fill="#ff9800"/>
		<rect x="10" y="12" width="2" height="4" fill="#ff5722"/>
	</svg>
{:else if type === 'refresh'}
	<!-- Cyan circular arrows -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="4" y="2" width="8" height="2" fill="#00bcd4"/>
		<rect x="2" y="4" width="2" height="8" fill="#00bcd4"/>
		<rect x="12" y="4" width="2" height="8" fill="#00bcd4"/>
		<rect x="4" y="12" width="8" height="2" fill="#00bcd4"/>
		<!-- Arrows -->
		<rect x="10" y="0" width="4" height="2" fill="#00e5ff"/>
		<rect x="14" y="2" width="2" height="2" fill="#00e5ff"/>
		<rect x="0" y="12" width="2" height="2" fill="#00e5ff"/>
		<rect x="2" y="14" width="4" height="2" fill="#00e5ff"/>
	</svg>
{:else if type === 'dollar'}
	<!-- Green dollar sign with highlights -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="7" y="0" width="2" height="16" fill="#4caf50"/>
		<rect x="3" y="3" width="10" height="2" fill="#66bb6a"/>
		<rect x="3" y="7" width="8" height="2" fill="#66bb6a"/>
		<rect x="5" y="11" width="8" height="2" fill="#66bb6a"/>
		<rect x="3" y="5" width="2" height="2" fill="#4caf50"/>
		<rect x="11" y="9" width="2" height="2" fill="#4caf50"/>
		<!-- Highlight -->
		<rect x="8" y="1" width="1" height="2" fill="#81c784"/>
	</svg>
{:else if type === 'chart'}
	<!-- Purple/pink gradient bars -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="2" y="8" width="3" height="6" fill="#9c27b0"/>
		<rect x="6" y="5" width="3" height="9" fill="#ab47bc"/>
		<rect x="10" y="2" width="3" height="12" fill="#ba68c8"/>
		<rect x="1" y="14" width="14" height="2" fill="#7b1fa2"/>
		<!-- Highlights -->
		<rect x="2" y="8" width="1" height="2" fill="#ce93d8"/>
		<rect x="6" y="5" width="1" height="2" fill="#ce93d8"/>
		<rect x="10" y="2" width="1" height="2" fill="#ce93d8"/>
	</svg>
{:else if type === 'check'}
	<!-- Green checkmark -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="12" y="2" width="2" height="2" fill="#4caf50"/>
		<rect x="10" y="4" width="2" height="2" fill="#66bb6a"/>
		<rect x="8" y="6" width="2" height="2" fill="#66bb6a"/>
		<rect x="6" y="8" width="2" height="2" fill="#81c784"/>
		<rect x="4" y="6" width="2" height="2" fill="#66bb6a"/>
		<rect x="2" y="4" width="2" height="2" fill="#4caf50"/>
	</svg>
{:else if type === 'tool'}
	<!-- Orange/amber wrench -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="2" y="2" width="6" height="2" fill="#ff9800"/>
		<rect x="2" y="4" width="2" height="4" fill="#f57c00"/>
		<rect x="6" y="4" width="2" height="10" fill="#ff9800"/>
		<rect x="8" y="6" width="6" height="2" fill="#ffa726"/>
		<rect x="12" y="8" width="2" height="6" fill="#f57c00"/>
		<rect x="8" y="12" width="4" height="2" fill="#ff9800"/>
		<!-- Highlight -->
		<rect x="3" y="2" width="1" height="1" fill="#ffb74d"/>
		<rect x="7" y="5" width="1" height="3" fill="#ffb74d"/>
	</svg>
{:else if type === 'handshake'}
	<!-- Pink/purple handshake -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="0" y="6" width="4" height="6" fill="#e91e63"/>
		<rect x="4" y="8" width="2" height="4" fill="#ec407a"/>
		<rect x="6" y="6" width="4" height="2" fill="#f06292"/>
		<rect x="10" y="8" width="2" height="4" fill="#ec407a"/>
		<rect x="12" y="6" width="4" height="6" fill="#e91e63"/>
		<rect x="6" y="10" width="4" height="2" fill="#f48fb1"/>
		<!-- Highlights -->
		<rect x="1" y="7" width="1" height="2" fill="#f48fb1"/>
		<rect x="14" y="7" width="1" height="2" fill="#f48fb1"/>
	</svg>
{:else if type === 'music'}
	<!-- Retro cassette tape -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<!-- Cassette body -->
		<rect x="1" y="3" width="14" height="10" fill="#9c27b0"/>
		<rect x="2" y="4" width="12" height="8" fill="#ba68c8"/>
		<!-- Reels -->
		<circle cx="5" cy="8" r="2" fill="#424242"/>
		<circle cx="11" cy="8" r="2" fill="#424242"/>
		<circle cx="5" cy="8" r="1" fill="#616161"/>
		<circle cx="11" cy="8" r="1" fill="#616161"/>
		<!-- Tape -->
		<rect x="5" y="7" width="6" height="2" fill="#212121"/>
		<!-- Label -->
		<rect x="3" y="5" width="10" height="2" fill="#ce93d8"/>
		<!-- Screws -->
		<circle cx="3" cy="5" r="0.5" fill="#757575"/>
		<circle cx="13" cy="5" r="0.5" fill="#757575"/>
		<circle cx="3" cy="11" r="0.5" fill="#757575"/>
		<circle cx="13" cy="11" r="0.5" fill="#757575"/>
	</svg>
{:else if type === 'speaker'}
	<!-- Blue speaker with sound waves -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="2" y="6" width="2" height="4" fill="#2196f3"/>
		<rect x="4" y="4" width="2" height="8" fill="#42a5f5"/>
		<rect x="6" y="2" width="2" height="12" fill="#64b5f6"/>
		<!-- Sound waves -->
		<rect x="10" y="4" width="2" height="2" fill="#00e5ff"/>
		<rect x="10" y="10" width="2" height="2" fill="#00e5ff"/>
		<rect x="12" y="2" width="2" height="2" fill="#80d8ff"/>
		<rect x="12" y="6" width="2" height="4" fill="#40c4ff"/>
		<rect x="12" y="12" width="2" height="2" fill="#80d8ff"/>
	</svg>
{:else if type === 'mute'}
	<!-- Red muted speaker with X -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="2" y="6" width="2" height="4" fill="#f44336"/>
		<rect x="4" y="4" width="2" height="8" fill="#e57373"/>
		<rect x="6" y="2" width="2" height="12" fill="#ef5350"/>
		<!-- X mark -->
		<rect x="10" y="4" width="2" height="2" fill="#d32f2f"/>
		<rect x="12" y="6" width="2" height="2" fill="#d32f2f"/>
		<rect x="14" y="8" width="2" height="2" fill="#d32f2f"/>
		<rect x="12" y="10" width="2" height="2" fill="#d32f2f"/>
		<rect x="10" y="12" width="2" height="2" fill="#d32f2f"/>
		<line x1="10" y1="4" x2="15" y2="13" stroke="#b71c1c" stroke-width="2"/>
	</svg>
{:else if type === 'warning'}
	<!-- Orange/yellow warning triangle -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="7" y="0" width="2" height="2" fill="#ffc107"/>
		<rect x="5" y="2" width="6" height="2" fill="#ffb300"/>
		<rect x="3" y="4" width="10" height="2" fill="#ffa000"/>
		<rect x="1" y="6" width="14" height="8" fill="#ff8f00"/>
		<!-- Warning sign -->
		<rect x="7" y="8" width="2" height="4" fill="#000"/>
		<rect x="7" y="13" width="2" height="1" fill="#000"/>
		<!-- Highlights -->
		<rect x="2" y="7" width="2" height="1" fill="#ffd54f"/>
		<rect x="8" y="1" width="1" height="1" fill="#ffe082"/>
	</svg>
{:else if type === 'dot'}
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="6" y="6" width="4" height="4" fill={iconColor}/>
	</svg>
{:else if type === 'book'}
	<!-- Open book icon for documentation -->
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="1" y="3" width="6" height="10" fill="#03a9f4"/>
		<rect x="9" y="3" width="6" height="10" fill="#4fc3f7"/>
		<rect x="2" y="4" width="4" height="1" fill="#81d4fa"/>
		<rect x="2" y="6" width="4" height="1" fill="#81d4fa"/>
		<rect x="2" y="8" width="4" height="1" fill="#81d4fa"/>
		<rect x="10" y="4" width="4" height="1" fill="#b3e5fc"/>
		<rect x="10" y="6" width="4" height="1" fill="#b3e5fc"/>
		<rect x="10" y="8" width="4" height="1" fill="#b3e5fc"/>
		<!-- Binding -->
		<rect x="7" y="2" width="2" height="12" fill="#0288d1"/>
	</svg>
{/if}

<style>
	svg {
		display: inline-block;
		vertical-align: middle;
	}
</style>
