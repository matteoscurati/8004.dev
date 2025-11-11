<script lang="ts">
	import '../app.css';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';
	import { page } from '$app/stores';

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

	// Check if we're on activity page (using store subscription in Svelte 5)
	let currentPath = $state('');

	$effect(() => {
		currentPath = $page.url.pathname;
	});

	let isActivityPage = $derived(currentPath.startsWith('/activity'));
</script>

<div class="scanlines"></div>

<div class="layout">
	<header class="header">
		{#if isActivityPage}
			<a href="/" class="back-btn pixel-button">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M10 2L4 8L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>
				</svg>
				BACK
			</a>
		{/if}
		<h1 class="glitch" data-text="8004 SEARCH">
			<a href="/" class="logo-link">8004 SEARCH</a>
		</h1>
		<p class="tagline">// Discover AI Agents Across Multiple Chains • Ethereum, Base & Polygon</p>
	</header>

	<main class="main">
		{@render children()}
	</main>

	<footer class="footer">
		<p>Powered by <a href="https://github.com/agent0lab/agent0-ts" target="_blank" rel="noopener noreferrer">Agent0 SDK</a> • Multi-Chain Support (Ethereum, Base, Polygon)</p>
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
		position: relative;
		text-align: center;
		margin-bottom: calc(var(--spacing-unit) * 4);
		padding: calc(var(--spacing-unit) * 3) 0;
		border-bottom: 3px solid var(--color-border);
	}

	.back-btn {
		position: absolute;
		left: 0;
		top: calc(var(--spacing-unit) * 3);
		display: inline-flex;
		align-items: center;
		gap: calc(var(--spacing-unit) / 2);
		font-size: 9px;
		padding: calc(var(--spacing-unit) * 1.5) calc(var(--spacing-unit) * 2);
		text-decoration: none;
		transition: all 0.2s;
		z-index: 10;
		cursor: pointer;
		pointer-events: auto;
	}

	.back-btn svg {
		display: block;
		pointer-events: none;
	}

	.back-btn:hover {
		transform: translateX(-2px);
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
		.back-btn {
			font-size: 8px;
			padding: var(--spacing-unit) calc(var(--spacing-unit) * 1.5);
			top: calc(var(--spacing-unit) * 2);
		}

		.back-btn svg {
			width: 14px;
			height: 14px;
		}

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
