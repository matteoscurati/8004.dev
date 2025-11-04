<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ChiptuneSynth } from '$lib/services/chiptune-synth';

	let synth: ChiptuneSynth | null = null;
	let isPlaying = $state(false);
	let isClosed = $state(false);
	let currentTrackName = $state("DE ROSSI'S BIT");
	let currentTrackId = $state(0);

	// Draggable state
	let isDragging = $state(false);
	let position = $state({ x: 20, y: 20 });
	let dragOffset = { x: 0, y: 0 };

	onMount(() => {
		synth = new ChiptuneSynth();

		// Restore position from localStorage
		const savedPos = localStorage.getItem('musicPlayerPosition');
		if (savedPos) {
			try {
				position = JSON.parse(savedPos);
				// Ensure position is within current viewport
				clampPosition();
			} catch (e) {
			}
		}
	});

	onDestroy(() => {
		if (synth) {
			synth.destroy();
		}
	});

	function togglePlay() {
		if (!synth) return;

		// Update UI immediately for instant feedback
		isPlaying = !isPlaying;

		// Then handle audio
		if (isPlaying) {
			synth.play();
		} else {
			synth.pause();
		}
	}

	function close() {
		if (synth && isPlaying) {
			synth.pause();
			isPlaying = false;
		}
		isClosed = true;
	}

	function clampPosition() {
		// Keep player within current viewport bounds
		position.x = Math.max(0, Math.min(window.innerWidth - 240, position.x));
		position.y = Math.max(0, Math.min(window.innerHeight - 150, position.y));
	}

	function open() {
		isClosed = false;
		// Check position is still valid when reopening
		clampPosition();
	}

	function nextTrack() {
		if (!synth) return;
		synth.nextTrack();
		updateTrackName();
	}

	function previousTrack() {
		if (!synth) return;
		synth.previousTrack();
		updateTrackName();
	}

	function updateTrackName() {
		if (!synth) return;
		const track = synth.getCurrentTrack();
		currentTrackName = track.name;
		currentTrackId = track.id;
	}

	// Drag handlers
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		dragOffset.x = e.clientX - position.x;
		dragOffset.y = e.clientY - position.y;
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;

		position.x = e.clientX - dragOffset.x;
		position.y = e.clientY - dragOffset.y;

		// Keep within viewport
		position.x = Math.max(0, Math.min(window.innerWidth - 200, position.x));
		position.y = Math.max(0, Math.min(window.innerHeight - 100, position.y));
	}

	function handleMouseUp() {
		if (isDragging) {
			isDragging = false;
			// Save position
			localStorage.setItem('musicPlayerPosition', JSON.stringify(position));
		}
	}

	// Global mouse handlers
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);

			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});

	// Handle window resize - keep player in viewport
	$effect(() => {
		if (typeof window !== 'undefined') {
			const handleResize = () => {
				if (!isClosed) {
					clampPosition();
				}
			};

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}
	});
</script>

{#if isClosed}
	<!-- Floating button to reopen -->
	<button class="reopen-button pixel-card" onclick={open} title="Open Music Player">
		♪
	</button>
{:else}
	<!-- Draggable player -->
	<div
		class="music-player pixel-card"
		class:dragging={isDragging}
		style="left: {position.x}px; top: {position.y}px;"
	>
		<!-- Drag handle -->
		<div class="player-header" onmousedown={handleMouseDown} role="toolbar" aria-label="Music Player Header">
			<span class="player-title">♪ 8004.PLAYER</span>
			<button class="close-btn" onclick={close} title="Close">×</button>
		</div>

		<!-- Controls -->
		<div class="player-controls">
			<button
				class="control-btn"
				class:playing={isPlaying}
				onclick={togglePlay}
				title={isPlaying ? 'Pause' : 'Play'}
			>
				{isPlaying ? '❚❚' : '▶'}
			</button>

			<div class="track-info">
				<div class="track-name">{currentTrackName}</div>
				<div class="visualizer">
					{#if isPlaying}
						<span class="bar"></span>
						<span class="bar"></span>
						<span class="bar"></span>
						<span class="bar"></span>
						<span class="bar"></span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Track Navigation -->
		<div class="track-nav">
			<button class="nav-btn" onclick={previousTrack} title="Previous Track">◀</button>
			<span class="track-indicator">TRACK {currentTrackId + 1}/3</span>
			<button class="nav-btn" onclick={nextTrack} title="Next Track">▶</button>
		</div>

		<!-- Scanline effect -->
		<div class="scanline"></div>
	</div>
{/if}

<style>
	.music-player {
		position: fixed;
		width: 240px;
		padding: 0;
		background-color: var(--color-bg);
		border: 3px solid var(--color-border);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
		z-index: 9999;
		cursor: move;
		user-select: none;
		overflow: hidden;
	}

	.music-player.dragging {
		opacity: 0.9;
		cursor: grabbing;
	}

	.player-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(var(--spacing-unit) * 1.5);
		background: linear-gradient(180deg, rgba(0, 255, 65, 0.15) 0%, transparent 100%);
		border-bottom: 2px solid var(--color-border);
		cursor: grab;
	}

	.player-header:active {
		cursor: grabbing;
	}

	.player-title {
		font-size: 10px;
		font-weight: bold;
		color: var(--color-text);
		letter-spacing: 1px;
	}

	.close-btn {
		background: none;
		border: 2px solid var(--color-border);
		color: var(--color-text);
		font-size: 16px;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background-color: var(--color-text);
		color: var(--color-bg);
	}

	.player-controls {
		display: flex;
		gap: calc(var(--spacing-unit) * 2);
		padding: calc(var(--spacing-unit) * 2);
		align-items: center;
	}

	.control-btn {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		background-color: var(--color-bg);
		color: var(--color-text);
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.1s; /* Faster transition */
		flex-shrink: 0;
	}

	.control-btn:active {
		transform: scale(0.95);
		transition: transform 0.05s; /* Instant click feedback */
	}

	.control-btn:hover {
		background-color: rgba(0, 255, 65, 0.2);
		box-shadow: 0 0 8px rgba(0, 255, 65, 0.5);
		transform: scale(1.05);
	}

	.control-btn.playing {
		background-color: rgba(0, 255, 65, 0.1);
		border-color: var(--color-text);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			box-shadow: 0 0 4px rgba(0, 255, 65, 0.5);
		}
		50% {
			box-shadow: 0 0 12px rgba(0, 255, 65, 0.8);
		}
	}

	.track-info {
		flex: 1;
		min-width: 0;
	}

	.track-name {
		font-size: 9px;
		color: var(--color-text);
		margin-bottom: calc(var(--spacing-unit) / 2);
		font-weight: bold;
		letter-spacing: 0.5px;
	}

	.visualizer {
		display: flex;
		gap: 3px;
		height: 20px;
		align-items: flex-end;
	}

	.bar {
		width: 4px;
		background: linear-gradient(180deg, var(--color-text) 0%, var(--color-accent) 100%);
		border: 1px solid var(--color-border);
		animation: bounce 0.6s ease-in-out infinite;
	}

	.bar:nth-child(1) {
		animation-delay: 0s;
		height: 60%;
	}

	.bar:nth-child(2) {
		animation-delay: 0.1s;
		height: 80%;
	}

	.bar:nth-child(3) {
		animation-delay: 0.2s;
		height: 100%;
	}

	.bar:nth-child(4) {
		animation-delay: 0.3s;
		height: 70%;
	}

	.bar:nth-child(5) {
		animation-delay: 0.4s;
		height: 50%;
	}

	@keyframes bounce {
		0%, 100% {
			transform: scaleY(1);
		}
		50% {
			transform: scaleY(0.4);
		}
	}

	.track-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-unit) calc(var(--spacing-unit) * 2);
		border-top: 2px solid var(--color-border);
		background: linear-gradient(180deg, transparent 0%, rgba(0, 255, 65, 0.05) 100%);
	}

	.nav-btn {
		width: 28px;
		height: 28px;
		border: 2px solid var(--color-border);
		background-color: var(--color-bg);
		color: var(--color-text);
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.nav-btn:hover {
		background-color: rgba(0, 255, 65, 0.2);
		box-shadow: 0 0 8px rgba(0, 255, 65, 0.5);
	}

	.track-indicator {
		font-size: 7px;
		color: var(--color-text-secondary);
		letter-spacing: 0.5px;
	}

	.scanline {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			transparent 50%,
			rgba(0, 0, 0, 0.1) 50%
		);
		background-size: 100% 4px;
		pointer-events: none;
		opacity: 0.3;
	}

	/* Reopen button */
	.reopen-button {
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 48px;
		height: 48px;
		border: 3px solid var(--color-border);
		background-color: var(--color-bg);
		color: var(--color-text);
		font-size: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 9998;
		transition: all 0.2s;
	}

	.reopen-button:hover {
		background-color: rgba(0, 255, 65, 0.2);
		box-shadow: 0 0 16px rgba(0, 255, 65, 0.5);
		transform: scale(1.1);
	}
</style>
