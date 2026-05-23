import { browser } from '$app/environment';
import { sounds } from '$lib/sounds.svelte';

export type BreathPhase = 'idle' | 'inhale' | 'hold_full' | 'exhale' | 'hold_empty';

export interface ProtocolDurations {
	inhale: number;
	holdFull: number;
	exhale: number;
	holdEmpty: number;
}

export const BOX_4444: ProtocolDurations = {
	inhale: 4,
	holdFull: 4,
	exhale: 4,
	holdEmpty: 4
};

/** Dev-mode scales every phase down so Playwright can exercise the loop in seconds. */
const DEV_DURATIONS: ProtocolDurations = {
	inhale: 0.35,
	holdFull: 0.25,
	exhale: 0.35,
	holdEmpty: 0.25
};

const NEXT_PHASE: Record<Exclude<BreathPhase, 'idle'>, Exclude<BreathPhase, 'idle'>> = {
	inhale: 'hold_full',
	hold_full: 'exhale',
	exhale: 'hold_empty',
	hold_empty: 'inhale'
};

class BreathStore {
	phase = $state<BreathPhase>('idle');
	/** 0..1 within the current phase (eased target left to the pacer component). */
	phaseProgress = $state(0);
	phaseSecondsLeft = $state(0);
	totalSeconds = $state(0);
	cyclesCompleted = $state(0);
	isRunning = $state(false);
	isPaused = $state(false);
	isDevMode = $state(false);

	private durations: ProtocolDurations = BOX_4444;
	private rafId: number | null = null;
	private phaseStart = 0;
	private phaseAccumulated = 0;
	private sessionStart = 0;
	private sessionAccumulated = 0;
	private initialized = false;

	init(opts: { dev: boolean }) {
		if (this.initialized || !browser) return;
		this.initialized = true;
		this.isDevMode = opts.dev;
		this.durations = opts.dev ? DEV_DURATIONS : BOX_4444;
	}

	start() {
		if (this.isRunning && !this.isPaused) return;
		const startingFresh = this.phase === 'idle';
		if (startingFresh) {
			this.cyclesCompleted = 0;
			this.totalSeconds = 0;
			this.sessionAccumulated = 0;
			this.phaseAccumulated = 0;
			this.phase = 'inhale';
		}
		this.phaseStart = performance.now();
		this.sessionStart = performance.now();
		this.isRunning = true;
		this.isPaused = false;
		if (startingFresh) {
			sounds.playPhaseCue();
			sounds.startAmbient();
		}
		this.loop();
	}

	pause() {
		if (!this.isRunning || this.isPaused) return;
		const now = performance.now();
		this.phaseAccumulated += (now - this.phaseStart) / 1000;
		this.sessionAccumulated += (now - this.sessionStart) / 1000;
		this.isPaused = true;
		if (this.rafId !== null) cancelAnimationFrame(this.rafId);
		this.rafId = null;
	}

	resume() {
		if (!this.isPaused) return;
		this.phaseStart = performance.now();
		this.sessionStart = performance.now();
		this.isPaused = false;
		this.loop();
	}

	stop() {
		if (this.rafId !== null) cancelAnimationFrame(this.rafId);
		this.rafId = null;
		this.isRunning = false;
		this.isPaused = false;
		this.phase = 'idle';
		this.phaseProgress = 0;
		this.phaseSecondsLeft = 0;
		this.cyclesCompleted = 0;
		this.totalSeconds = 0;
		this.phaseAccumulated = 0;
		this.sessionAccumulated = 0;
		sounds.stopAmbient();
	}

	private loop = () => {
		const now = performance.now();
		const liveElapsed = (now - this.phaseStart) / 1000;
		const elapsedInPhase = this.phaseAccumulated + liveElapsed;
		const phaseDuration = this.currentPhaseDuration();

		if (elapsedInPhase >= phaseDuration) {
			this.advancePhase(elapsedInPhase - phaseDuration, now);
		} else {
			this.phaseProgress = phaseDuration > 0 ? elapsedInPhase / phaseDuration : 0;
			this.phaseSecondsLeft = Math.max(0, phaseDuration - elapsedInPhase);
		}

		this.totalSeconds = this.sessionAccumulated + (now - this.sessionStart) / 1000;
		this.rafId = requestAnimationFrame(this.loop);
	};

	private currentPhaseDuration(): number {
		switch (this.phase) {
			case 'inhale':
				return this.durations.inhale;
			case 'hold_full':
				return this.durations.holdFull;
			case 'exhale':
				return this.durations.exhale;
			case 'hold_empty':
				return this.durations.holdEmpty;
			default:
				return 0;
		}
	}

	private advancePhase(overshootSeconds: number, now: number) {
		if (this.phase === 'idle') return;
		const completedFullCycle = this.phase === 'hold_empty';
		const next = NEXT_PHASE[this.phase];
		this.phase = next;
		this.phaseAccumulated = overshootSeconds;
		this.phaseStart = now;
		if (completedFullCycle) this.cyclesCompleted++;
		sounds.playPhaseCue();
	}
}

export const breath = new BreathStore();
