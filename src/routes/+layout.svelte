<script lang="ts">
	import '../app.css';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';

	let { children } = $props();

	// Detect Safari Lockdown Mode synchronously (before rendering)
	let isLockdownMode = $state(false);

	// Run detection immediately during script evaluation
	if (typeof window !== 'undefined') {
		try {
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioContextClass) {
				isLockdownMode = true;
			}
		} catch (e) {
			isLockdownMode = true;
		}
	}
</script>

<div class="scanlines"></div>

<div class="layout">
	<header class="header">
		<h1 class="glitch" data-text="8004 SEARCH">
			<a href="/" class="logo-link">8004 SEARCH</a>
		</h1>
		<p class="tagline">// Discover AI Agents on Ethereum • Currently on Sepolia Testnet</p>
	</header>

	<main class="main">
		{@render children()}
	</main>

	<footer class="footer">
		<p>Powered by <a href="https://github.com/agent0lab/agent0-ts" target="_blank" rel="noopener noreferrer">Agent0 SDK</a> • Sepolia Testnet</p>
		<p class="credits">Built by <a href="https://github.com/matteoscurati" target="_blank" rel="noopener noreferrer">Matteo Scurati</a></p>
	</footer>
</div>

<!-- Floating 8-bit Music Player (disabled in Safari Lockdown Mode) -->
{#if !isLockdownMode}
	<MusicPlayer />
{/if}

<style>
	.layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: calc(var(--spacing-unit) * 2);
		max-width: 1400px;
		margin: 0 auto;
	}

	.header {
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 4);
		padding: calc(var(--spacing-unit) * 3) 0;
		border-bottom: 3px solid var(--color-border);
	}

	.header h1 {
		font-size: 32px;
		margin-bottom: calc(var(--spacing-unit) * 2);
		text-shadow: 4px 4px 0 var(--color-shadow);
	}

	.logo-link {
		color: var(--color-text);
		text-decoration: none;
		transition: all 0.2s;
		cursor: pointer;
	}

	.logo-link:hover {
		color: var(--color-primary);
		text-shadow: 0 0 20px var(--color-primary), 4px 4px 0 var(--color-shadow);
	}

	.tagline {
		font-size: 10px;
		color: var(--color-text-secondary);
	}

	.main {
		flex: 1;
	}

	.footer {
		text-align: center;
		padding: calc(var(--spacing-unit) * 3) 0;
		margin-top: calc(var(--spacing-unit) * 4);
		border-top: 3px solid var(--color-border);
		font-size: 8px;
		color: var(--color-text-secondary);
	}

	.footer p {
		margin: calc(var(--spacing-unit) / 2) 0;
	}

	.footer a {
		color: var(--color-primary);
		text-decoration: none;
		transition: all 0.2s;
	}

	.footer a:hover {
		color: var(--color-text);
		text-shadow: 0 0 10px var(--color-primary);
	}

	@media (max-width: 768px) {
		.header h1 {
			font-size: 22px;
		}

		.tagline {
			font-size: 9px;
			line-height: 1.8;
		}

		.layout {
			padding: calc(var(--spacing-unit) * 1.5);
		}

		.header {
			margin-bottom: calc(var(--spacing-unit) * 3);
			padding: calc(var(--spacing-unit) * 2) 0;
		}

		.footer {
			font-size: 9px;
		}
	}

	@media (max-width: 480px) {
		.header h1 {
			font-size: 18px;
			margin-bottom: calc(var(--spacing-unit) * 1.5);
		}

		.tagline {
			font-size: 8px;
		}

		.footer {
			font-size: 8px;
			padding: calc(var(--spacing-unit) * 2) 0;
		}
	}
</style>
