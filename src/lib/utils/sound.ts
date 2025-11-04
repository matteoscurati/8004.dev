/**
 * Sound Utility - 8-bit style notifications using Web Audio API
 *
 * Generates retro beep sounds for activity events without external audio files
 */

import type { ActivityEvent } from '$lib/services/activity-tracker';

export class SoundPlayer {
	private audioContext: AudioContext | null = null;
	private enabled = true;

	constructor() {
		// Initialize AudioContext lazily (after user interaction)
		if (typeof window !== 'undefined') {
			// Load sound preference from localStorage
			const stored = localStorage.getItem('sound_enabled');
			this.enabled = stored === null ? true : stored === 'true';
		}
	}

	/**
	 * Initialize AudioContext (must be called after user interaction)
	 */
	private initAudio(): void {
		if (!this.audioContext && typeof window !== 'undefined') {
			try {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			} catch (error) {
				console.error('SoundPlayer: Failed to create AudioContext:', error);
			}
		}
	}

	/**
	 * Play 8-bit beep sound
	 * @param frequency - Sound frequency in Hz (higher = higher pitch)
	 * @param duration - Sound duration in seconds
	 * @param volume - Volume (0-1)
	 */
	private beep(frequency: number, duration: number, volume: number = 0.3): void {
		if (!this.enabled || !this.audioContext) return;

		try {
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();

			oscillator.type = 'square'; // 8-bit square wave
			oscillator.frequency.value = frequency;

			gainNode.gain.value = volume;

			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);

			const now = this.audioContext.currentTime;
			oscillator.start(now);
			oscillator.stop(now + duration);
		} catch (error) {
			console.error('SoundPlayer: Failed to play beep:', error);
		}
	}

	/**
	 * Play notification for activity event
	 */
	playEventNotification(event: ActivityEvent): void {
		this.initAudio();

		switch (event.type) {
			case 'agent_registered':
				// New agent: ascending notes (C5 -> E5 -> G5)
				this.beep(523.25, 0.1, 0.2); // C5
				setTimeout(() => this.beep(659.25, 0.1, 0.2), 100); // E5
				setTimeout(() => this.beep(783.99, 0.15, 0.2), 200); // G5
				break;

			case 'capability_added':
				// Capability: short high beep
				this.beep(880.0, 0.1, 0.2); // A5
				break;

			case 'status_changed':
				// Status change: two-tone
				this.beep(440.0, 0.1, 0.15); // A4
				setTimeout(() => this.beep(554.37, 0.1, 0.15), 100); // C#5
				break;

			case 'x402_enabled':
				// Payment: special ascending sequence
				this.beep(659.25, 0.08, 0.2); // E5
				setTimeout(() => this.beep(783.99, 0.08, 0.2), 80); // G5
				setTimeout(() => this.beep(1046.5, 0.12, 0.2), 160); // C6
				break;

			default:
				// Generic notification
				this.beep(440.0, 0.1, 0.2); // A4
		}
	}

	/**
	 * Toggle sound on/off
	 */
	toggle(): void {
		this.enabled = !this.enabled;
		if (typeof window !== 'undefined') {
			localStorage.setItem('sound_enabled', String(this.enabled));
		}

		// Play confirmation beep
		if (this.enabled) {
			this.initAudio();
			this.beep(523.25, 0.1, 0.2);
		}
	}

	/**
	 * Check if sound is enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Set sound enabled state
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		if (typeof window !== 'undefined') {
			localStorage.setItem('sound_enabled', String(enabled));
		}
	}
}

// Singleton instance
export const soundPlayer = new SoundPlayer();
