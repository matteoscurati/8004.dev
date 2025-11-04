/**
 * 8-bit Chiptune Synthesizer
 * Generates retro-style music using Web Audio API
 *
 * Dedicated to Marco De Rossi (@marcoderossi)
 * Creator of the Agent0 SDK and ERC-8004 standard
 * Thank you for making AI agent discovery permissionless and decentralized!
 */

export interface Track {
	id: number;
	name: string;
	melodyPatterns: number[][];
	bassPatterns: number[][];
	arpeggioPatterns: number[][];
	tempo: number; // BPM
}

export class ChiptuneSynth {
	private audioContext: AudioContext | null = null;
	private mainGain: GainNode | null = null;
	private isPlaying = false;
	private currentPattern = 0;
	private loopInterval: number | null = null;
	private currentTrack = 0;
	private activeOscillators: OscillatorNode[] = []; // Track active oscillators
	private isFirstPattern = true; // Track if this is the first pattern after play
	private nextPatternStartTime = 0; // Track when next pattern should start for gapless playback

	// Musical scale (pentatonic for that retro game feel)
	private readonly notes = [
		261.63, // C4
		293.66, // D4
		329.63, // E4
		392.00, // G4
		440.00, // A4
		523.25, // C5
		587.33, // D5
		659.25  // E5
	];

	// Three different tracks - simplified and more musical
	private readonly tracks: Track[] = [
		{
			id: 0,
			name: "DE ROSSI'S BIT",
			tempo: 140,
			melodyPatterns: [
				[0, 2, 4, 5, 4, 2, 0, -1],  // C D E G E D C rest
				[4, 5, 7, 5, 4, 2, 0, -1],  // E G D5 G E D C rest
				[0, 4, 5, 4, 2, 4, 5, -1],  // C E G E D E G rest
				[5, 4, 2, 4, 5, 7, 5, -1]   // G E D E G D5 G rest
			],
			bassPatterns: [
				[0, -1, 0, -1, 0, -1, 2, -1],  // Simple root notes
				[0, -1, 2, -1, 0, -1, 2, -1]
			],
			arpeggioPatterns: [
				[0, 2, 4, 2],  // C E G E
				[2, 4, 5, 4]   // D E G E
			]
		},
		{
			id: 1,
			name: "AGENT ZERO ANTHEM",
			tempo: 110,
			melodyPatterns: [
				[0, 0, 2, 2, 4, 4, 5, 5],     // Slower, anthem-like
				[5, 5, 4, 4, 2, 2, 0, 0],
				[0, 2, 4, 5, 5, 4, 2, 0],
				[4, 4, 5, 5, 7, 7, 5, 5]
			],
			bassPatterns: [
				[0, -1, 0, -1, 2, -1, 2, -1],
				[0, -1, 0, -1, 2, -1, 0, -1]
			],
			arpeggioPatterns: [
				[0, 2, 4, 5],  // Slower arpeggio
				[2, 4, 5, 4]
			]
		},
		{
			id: 2,
			name: "ERC-8004 GROOVE",
			tempo: 160,
			melodyPatterns: [
				[4, 5, 4, 2, 4, 5, 4, 2],     // Fast and groovy
				[5, 7, 5, 4, 5, 7, 5, 4],
				[2, 4, 2, 0, 2, 4, 2, 0],
				[5, 4, 5, 7, 5, 4, 5, 4]
			],
			bassPatterns: [
				[0, 0, -1, 0, 2, 2, -1, 2],   // More rhythmic
				[0, 0, -1, 2, 0, 0, -1, 2]
			],
			arpeggioPatterns: [
				[0, 4, 5, 4],  // Fast arpeggios
				[2, 5, 4, 2]
			]
		}
	];

	constructor() {
		if (typeof window !== 'undefined') {
			this.audioContext = new AudioContext();
			this.mainGain = this.audioContext.createGain();
			this.mainGain.connect(this.audioContext.destination);
			this.mainGain.gain.value = 0.15; // Master volume
		}
	}

	private createOscillator(
		frequency: number,
		type: OscillatorType,
		gain: number,
		startTime: number,
		duration: number
	): void {
		if (!this.audioContext || !this.mainGain) return;

		// Ensure startTime is always in the future
		const now = this.audioContext.currentTime;
		const safeStartTime = Math.max(startTime, now + 0.01);

		const osc = this.audioContext.createOscillator();
		const oscGain = this.audioContext.createGain();

		osc.type = type;
		osc.frequency.value = frequency;

		// ADSR envelope
		oscGain.gain.setValueAtTime(0, safeStartTime);
		oscGain.gain.linearRampToValueAtTime(gain, safeStartTime + 0.01); // Attack
		oscGain.gain.linearRampToValueAtTime(gain * 0.7, safeStartTime + 0.05); // Decay
		oscGain.gain.setValueAtTime(gain * 0.7, safeStartTime + duration - 0.05); // Sustain
		oscGain.gain.linearRampToValueAtTime(0, safeStartTime + duration); // Release

		osc.connect(oscGain);
		oscGain.connect(this.mainGain);

		osc.start(safeStartTime);
		osc.stop(safeStartTime + duration);

		// Track this oscillator
		this.activeOscillators.push(osc);

		// Remove from tracking when it stops
		osc.onended = () => {
			const index = this.activeOscillators.indexOf(osc);
			if (index > -1) {
				this.activeOscillators.splice(index, 1);
			}
		};
	}

	private playNote(noteIndex: number, startTime: number, duration: number, channel: 'melody' | 'bass' | 'arp'): void {
		if (noteIndex === -1) return; // Rest

		const frequency = this.notes[noteIndex % this.notes.length];

		switch (channel) {
			case 'melody':
				// Square wave for melody (classic NES sound)
				this.createOscillator(frequency, 'square', 0.12, startTime, duration);
				break;

			case 'bass':
				// Triangle wave for bass (deeper, rounder)
				this.createOscillator(frequency / 2, 'triangle', 0.15, startTime, duration);
				break;

			case 'arp':
				// Pulse wave for arpeggios (brighter accent)
				this.createOscillator(frequency * 2, 'square', 0.06, startTime, duration * 0.5);
				break;
		}
	}

	private playPattern(): void {
		if (!this.audioContext) return;

		const track = this.tracks[this.currentTrack];

		// Use tracked start time for gapless playback, or schedule slightly ahead if needed
		const now = this.audioContext.currentTime;
		const startTime = Math.max(this.nextPatternStartTime, now + 0.05);

		// Calculate note duration: 60 seconds / tempo / 2 (for 8th notes)
		const noteDuration = 60 / track.tempo / 2;
		const patternLength = 8;

		// Select patterns from current track - all synchronized
		const patternIndex = this.currentPattern % track.melodyPatterns.length;
		const melodyPattern = track.melodyPatterns[patternIndex];
		const bassPattern = track.bassPatterns[patternIndex % track.bassPatterns.length];
		const arpeggioPattern = track.arpeggioPatterns[patternIndex % track.arpeggioPatterns.length];

		// Stagger channel starts ONLY on very first pattern after play/track change
		// After that, all channels play synchronized to avoid interruptions
		const bassOffset = 0;                                           // Bass always starts immediately
		const melodyOffset = this.isFirstPattern ? noteDuration * 0.5 : 0; // Melody staggered only at start
		const arpOffset = this.isFirstPattern ? noteDuration : 0;          // Arpeggios staggered only at start

		// Clear first pattern flag after first use
		if (this.isFirstPattern) {
			this.isFirstPattern = false;
		}

		// Play bass (foundation)
		for (let i = 0; i < patternLength; i++) {
			this.playNote(
				bassPattern[i],
				startTime + i * noteDuration + bassOffset,
				noteDuration * 0.9,
				'bass'
			);
		}

		// Play melody (starts after bass establishes foundation)
		for (let i = 0; i < patternLength; i++) {
			this.playNote(
				melodyPattern[i],
				startTime + i * noteDuration + melodyOffset,
				noteDuration * 0.9,
				'melody'
			);
		}

		// Play arpeggios (starts after melody, 16th notes, 2 per beat)
		for (let i = 0; i < patternLength * 2; i++) {
			this.playNote(
				arpeggioPattern[i % arpeggioPattern.length],
				startTime + i * (noteDuration / 2) + arpOffset,
				noteDuration * 0.4,
				'arp'
			);
		}

		// Update next pattern start time for gapless playback
		this.nextPatternStartTime = startTime + noteDuration * patternLength;

		// Cycle through pattern variations (limit to melody pattern count for consistency)
		this.currentPattern = (this.currentPattern + 1) % track.melodyPatterns.length;
	}

	play(): void {
		if (this.isPlaying) return;

		if (this.audioContext?.state === 'suspended') {
			this.audioContext.resume();
		}

		this.isPlaying = true;
		this.isFirstPattern = true; // Mark this as first pattern

		// Initialize next pattern start time for gapless playback
		if (this.audioContext) {
			this.nextPatternStartTime = this.audioContext.currentTime + 0.05;
		}

		// Quick fade in ONLY for the very first pattern
		if (this.mainGain && this.audioContext) {
			const now = this.audioContext.currentTime;
			this.mainGain.gain.setValueAtTime(0, now);
			this.mainGain.gain.linearRampToValueAtTime(0.15, now + 0.03); // 30ms fade-in
		}

		// Calculate pattern duration: 8 notes * note duration (in ms)
		const track = this.tracks[this.currentTrack];
		const noteDuration = 60 / track.tempo / 2; // seconds per note
		const patternDuration = noteDuration * 8 * 1000; // 8 notes in milliseconds

		this.playPattern(); // Start immediately

		this.loopInterval = window.setInterval(() => {
			if (this.isPlaying) {
				this.playPattern();
			}
		}, patternDuration);
	}

	pause(): void {
		this.isPlaying = false;
		if (this.loopInterval !== null) {
			clearInterval(this.loopInterval);
			this.loopInterval = null;
		}
		// Don't stop oscillators on pause - let them finish naturally
	}

	stop(): void {
		this.pause();
		this.stopAllOscillators(); // Stop all sound immediately
		this.currentPattern = 0;
		this.nextPatternStartTime = 0; // Reset timing
	}

	setVolume(volume: number): void {
		if (this.mainGain) {
			this.mainGain.gain.value = Math.max(0, Math.min(1, volume));
		}
	}

	getIsPlaying(): boolean {
		return this.isPlaying;
	}

	// Track management
	setTrack(trackId: number): void {
		if (trackId < 0 || trackId >= this.tracks.length) return;

		const wasPlaying = this.isPlaying;

		// Stop current playback
		if (wasPlaying) {
			this.pause();
		}

		// Stop all active oscillators immediately
		this.stopAllOscillators();

		// Switch track
		this.currentTrack = trackId;
		this.currentPattern = 0; // Reset pattern
		this.isFirstPattern = true; // Mark next play as first pattern
		this.nextPatternStartTime = 0; // Reset timing

		// Resume if was playing (with small delay to let oscillators clean up)
		if (wasPlaying) {
			setTimeout(() => {
				this.play();
			}, 100); // Reduced to 100ms since we're stopping oscillators manually
		}
	}

	private stopAllOscillators(): void {
		// Stop all active oscillators immediately
		const now = this.audioContext?.currentTime || 0;
		this.activeOscillators.forEach(osc => {
			try {
				osc.stop(now);
			} catch (e) {
				// Oscillator might already be stopped, ignore error
			}
		});
		this.activeOscillators = [];
	}

	getCurrentTrack(): Track {
		return this.tracks[this.currentTrack];
	}

	getAllTracks(): Track[] {
		return this.tracks;
	}

	nextTrack(): void {
		const nextId = (this.currentTrack + 1) % this.tracks.length;
		this.setTrack(nextId);
	}

	previousTrack(): void {
		const prevId = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
		this.setTrack(prevId);
	}

	destroy(): void {
		this.stop();
		this.stopAllOscillators();
		if (this.audioContext) {
			this.audioContext.close();
		}
	}
}
