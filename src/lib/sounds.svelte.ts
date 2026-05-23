import { browser } from '$app/environment';

export type AmbientKind = 'off' | 'brown';

const CUES_KEY = 'slowbreath:soundCues';
const AMBIENT_KEY = 'slowbreath:ambient';
const AMBIENT_VOLUME_KEY = 'slowbreath:ambientVolume';
const CUES_VOLUME_KEY = 'slowbreath:cuesVolume';

class SoundStore {
	cuesEnabled = $state(true);
	ambient = $state<AmbientKind>('off');
	cuesVolume = $state(0.18); // 0..1
	ambientVolume = $state(0.12); // 0..1

	private ctx: AudioContext | null = null;
	private brownBuffer: AudioBuffer | null = null;
	private ambientSource: AudioBufferSourceNode | null = null;
	private ambientGain: GainNode | null = null;
	private initialized = false;

	init() {
		if (this.initialized || !browser) return;
		this.initialized = true;

		const cues = localStorage.getItem(CUES_KEY);
		if (cues === 'false') this.cuesEnabled = false;

		const ambient = localStorage.getItem(AMBIENT_KEY);
		if (ambient === 'brown') this.ambient = 'brown';

		const av = parseFloat(localStorage.getItem(AMBIENT_VOLUME_KEY) ?? '');
		if (!Number.isNaN(av) && av >= 0 && av <= 1) this.ambientVolume = av;

		const cv = parseFloat(localStorage.getItem(CUES_VOLUME_KEY) ?? '');
		if (!Number.isNaN(cv) && cv >= 0 && cv <= 1) this.cuesVolume = cv;
	}

	setCuesEnabled(enabled: boolean) {
		this.cuesEnabled = enabled;
		try {
			localStorage.setItem(CUES_KEY, enabled ? 'true' : 'false');
		} catch {
			// ignore
		}
	}

	setAmbient(kind: AmbientKind) {
		this.ambient = kind;
		try {
			localStorage.setItem(AMBIENT_KEY, kind);
		} catch {
			// ignore
		}
		// If a session is currently running, swap or stop ambient live.
		if (kind === 'off') {
			this.stopAmbient();
		} else if (this.ambientSource) {
			// Already playing something — restart with new kind.
			this.stopAmbient();
			this.startAmbient();
		}
	}

	setCuesVolume(v: number) {
		this.cuesVolume = Math.max(0, Math.min(1, v));
		try {
			localStorage.setItem(CUES_VOLUME_KEY, String(this.cuesVolume));
		} catch {
			// ignore
		}
	}

	setAmbientVolume(v: number) {
		this.ambientVolume = Math.max(0, Math.min(1, v));
		try {
			localStorage.setItem(AMBIENT_VOLUME_KEY, String(this.ambientVolume));
		} catch {
			// ignore
		}
		if (this.ambientGain && this.ctx) {
			this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.05);
		}
	}

	/** Called by breath store on each phase transition. */
	playPhaseCue() {
		if (!this.cuesEnabled || !browser) return;
		const ctx = this.getCtx();
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = 528; // a calm midrange pitch
		osc.connect(gain).connect(ctx.destination);
		const now = ctx.currentTime;
		const peak = this.cuesVolume;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(peak, now + 0.04);
		gain.gain.setValueAtTime(peak, now + 0.18);
		gain.gain.linearRampToValueAtTime(0, now + 0.45);
		osc.start(now);
		osc.stop(now + 0.5);
	}

	/** Called by breath store when a session starts (or on settings change while running). */
	startAmbient() {
		if (!browser || this.ambient === 'off') return;
		const ctx = this.getCtx();
		if (!ctx) return;
		if (this.ambientSource) return; // already playing
		const buffer = this.getOrBuildBrownBuffer(ctx);
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;
		const gain = ctx.createGain();
		gain.gain.value = 0;
		gain.gain.setTargetAtTime(this.ambientVolume, ctx.currentTime, 0.4);
		source.connect(gain).connect(ctx.destination);
		source.start();
		this.ambientSource = source;
		this.ambientGain = gain;
	}

	stopAmbient() {
		if (!this.ambientSource || !this.ctx || !this.ambientGain) return;
		const now = this.ctx.currentTime;
		this.ambientGain.gain.setTargetAtTime(0, now, 0.3);
		const sourceToStop = this.ambientSource;
		setTimeout(() => {
			try {
				sourceToStop.stop();
			} catch {
				// ignore — already stopped
			}
		}, 800);
		this.ambientSource = null;
		this.ambientGain = null;
	}

	private getCtx(): AudioContext | null {
		if (this.ctx) return this.ctx;
		try {
			const Ctx =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (!Ctx) return null;
			this.ctx = new Ctx();
		} catch {
			return null;
		}
		return this.ctx;
	}

	private getOrBuildBrownBuffer(ctx: AudioContext): AudioBuffer {
		if (this.brownBuffer) return this.brownBuffer;
		// 5 seconds of brown noise; we'll loop it.
		const duration = 5;
		const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		let lastOut = 0;
		for (let i = 0; i < data.length; i++) {
			const white = Math.random() * 2 - 1;
			lastOut = (lastOut + 0.02 * white) / 1.02;
			data[i] = lastOut * 3.5;
		}
		this.brownBuffer = buffer;
		return buffer;
	}
}

export const sounds = new SoundStore();
