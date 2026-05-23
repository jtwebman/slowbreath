import { browser } from '$app/environment';
import { sounds } from '$lib/sounds.svelte';

export type BreathPhase = 'idle' | 'inhale' | 'hold_full' | 'exhale' | 'hold_empty';

export type Protocol = 'box' | '478' | '6bpm';

export interface ProtocolDurations {
	inhale: number;
	holdFull: number;
	exhale: number;
	holdEmpty: number;
}

export const PROTOCOLS: Record<Protocol, ProtocolDurations> = {
	box: { inhale: 4, holdFull: 4, exhale: 4, holdEmpty: 4 },
	'478': { inhale: 4, holdFull: 7, exhale: 8, holdEmpty: 0 },
	'6bpm': { inhale: 5, holdFull: 0, exhale: 5, holdEmpty: 0 }
};

const PROTOCOL_STORAGE_KEY = 'slowbreath:protocol';
const SESSION_LIMIT_KEY = 'slowbreath:sessionLimit';
const VALID_PROTOCOLS: ReadonlyArray<Protocol> = ['box', '478', '6bpm'];

/** Session-limit options in seconds. `null` means run until the user stops. */
export const SESSION_LIMITS: ReadonlyArray<number | null> = [5 * 60, 10 * 60, 15 * 60, null];

/** Dev-mode runs the entire protocol at ~10× speed so Playwright can exercise cycles in seconds. */
const DEV_SCALE = 0.1;

const NEXT_PHASE: Record<Exclude<BreathPhase, 'idle'>, Exclude<BreathPhase, 'idle'>> = {
	inhale: 'hold_full',
	hold_full: 'exhale',
	exhale: 'hold_empty',
	hold_empty: 'inhale'
};

function isProtocol(v: unknown): v is Protocol {
	return typeof v === 'string' && (VALID_PROTOCOLS as ReadonlyArray<string>).includes(v);
}

class BreathStore {
	phase = $state<BreathPhase>('idle');
	phaseProgress = $state(0);
	phaseSecondsLeft = $state(0);
	totalSeconds = $state(0);
	cyclesCompleted = $state(0);
	isRunning = $state(false);
	isPaused = $state(false);
	isDevMode = $state(false);
	protocol = $state<Protocol>('box');
	/** Auto-stop the session after this many seconds. `null` = no limit. */
	sessionLimitSeconds = $state<number | null>(null);

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
		try {
			const saved = localStorage.getItem(PROTOCOL_STORAGE_KEY);
			if (isProtocol(saved)) this.protocol = saved;
		} catch {
			// ignore
		}
		try {
			const rawLimit = localStorage.getItem(SESSION_LIMIT_KEY);
			if (rawLimit === 'null' || rawLimit === null) {
				this.sessionLimitSeconds = null;
			} else {
				const n = parseInt(rawLimit, 10);
				if (!Number.isNaN(n) && n > 0) this.sessionLimitSeconds = n;
			}
		} catch {
			// ignore
		}
	}

	setSessionLimit(limitSeconds: number | null) {
		if (this.isRunning) return;
		this.sessionLimitSeconds = limitSeconds;
		try {
			localStorage.setItem(SESSION_LIMIT_KEY, limitSeconds === null ? 'null' : String(limitSeconds));
		} catch {
			// ignore
		}
	}

	setProtocol(next: Protocol) {
		if (this.isRunning) return;
		this.protocol = next;
		try {
			localStorage.setItem(PROTOCOL_STORAGE_KEY, next);
		} catch {
			// ignore
		}
	}

	start() {
		if (this.isRunning && !this.isPaused) return;
		const startingFresh = this.phase === 'idle';
		if (startingFresh) {
			this.cyclesCompleted = 0;
			this.totalSeconds = 0;
			this.sessionAccumulated = 0;
			this.phaseAccumulated = 0;
			this.phase = this.firstNonZeroPhase();
		}
		this.phaseStart = performance.now();
		this.sessionStart = performance.now();
		this.isRunning = true;
		this.isPaused = false;
		if (startingFresh) {
			sounds.playPhaseCue(this.phase);
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
		sounds.pauseAmbient();
	}

	resume() {
		if (!this.isPaused) return;
		this.phaseStart = performance.now();
		this.sessionStart = performance.now();
		this.isPaused = false;
		sounds.resumeAmbient();
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

		if (phaseDuration > 0 && elapsedInPhase >= phaseDuration) {
			this.advancePhase(elapsedInPhase - phaseDuration, now);
		} else {
			this.phaseProgress = phaseDuration > 0 ? elapsedInPhase / phaseDuration : 0;
			this.phaseSecondsLeft = Math.max(0, phaseDuration - elapsedInPhase);
		}

		this.totalSeconds = this.sessionAccumulated + (now - this.sessionStart) / 1000;

		// Auto-stop if a session limit is set and we've hit it.
		const limit = this.effectiveSessionLimit();
		if (limit !== null && this.totalSeconds >= limit) {
			this.stop();
			return;
		}

		this.rafId = requestAnimationFrame(this.loop);
	};

	private effectiveSessionLimit(): number | null {
		if (this.sessionLimitSeconds === null) return null;
		return this.isDevMode ? this.sessionLimitSeconds * DEV_SCALE : this.sessionLimitSeconds;
	}

	private phaseDurationFor(phase: BreathPhase): number {
		if (phase === 'idle') return 0;
		const base = PROTOCOLS[this.protocol];
		const raw =
			phase === 'inhale'
				? base.inhale
				: phase === 'hold_full'
					? base.holdFull
					: phase === 'exhale'
						? base.exhale
						: base.holdEmpty;
		return this.isDevMode ? raw * DEV_SCALE : raw;
	}

	private currentPhaseDuration(): number {
		return this.phaseDurationFor(this.phase);
	}

	private firstNonZeroPhase(): Exclude<BreathPhase, 'idle'> {
		const order: Exclude<BreathPhase, 'idle'>[] = ['inhale', 'hold_full', 'exhale', 'hold_empty'];
		for (const p of order) {
			if (this.phaseDurationFor(p) > 0) return p;
		}
		return 'inhale';
	}

	private advancePhase(overshootSeconds: number, now: number) {
		if (this.phase === 'idle') return;
		let next: Exclude<BreathPhase, 'idle'> = NEXT_PHASE[this.phase];
		let cycleCompleted = this.phase === 'hold_empty';
		let safety = 0;
		while (this.phaseDurationFor(next) === 0 && safety < 8) {
			if (next === 'hold_empty') cycleCompleted = true;
			next = NEXT_PHASE[next];
			safety++;
		}
		this.phase = next;
		this.phaseAccumulated = overshootSeconds;
		this.phaseStart = now;
		if (cycleCompleted) this.cyclesCompleted++;
		sounds.playPhaseCue(this.phase);
	}
}

export const breath = new BreathStore();
