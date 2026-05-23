import { browser } from '$app/environment';
import type { BreathPhase } from '$lib/breath.svelte';

export type AmbientKind = 'off' | 'brown' | 'pink' | 'white' | 'rain' | 'forest' | 'ocean';
export type CuesMode = 'soft' | 'distinct' | 'voice';
export type VoiceSlot = 'inhale' | 'hold' | 'exhale';

export const AMBIENT_KINDS: ReadonlyArray<AmbientKind> = [
	'off',
	'brown',
	'pink',
	'white',
	'rain',
	'forest',
	'ocean'
];
export const CUES_MODES: ReadonlyArray<CuesMode> = ['soft', 'distinct', 'voice'];

const FILE_AMBIENTS: ReadonlyArray<AmbientKind> = ['rain', 'forest', 'ocean'];
const AMBIENT_FILE_PATHS: Partial<Record<AmbientKind, string>> = {
	rain: '/sounds/rain.mp3',
	forest: '/sounds/forest.mp3',
	ocean: '/sounds/ocean.mp3'
};

const CUES_KEY = 'slowbreath:soundCues';
const CUES_MODE_KEY = 'slowbreath:cuesMode';
const AMBIENT_KEY = 'slowbreath:ambient';
const AMBIENT_VOLUME_KEY = 'slowbreath:ambientVolume';
const CUES_VOLUME_KEY = 'slowbreath:cuesVolume';
const VOICE_DATA_KEYS: Record<VoiceSlot, string> = {
	inhale: 'slowbreath:voiceInhale',
	hold: 'slowbreath:voiceHold',
	exhale: 'slowbreath:voiceExhale'
};
const VOICE_NAME_KEYS: Record<VoiceSlot, string> = {
	inhale: 'slowbreath:voiceInhaleName',
	hold: 'slowbreath:voiceHoldName',
	exhale: 'slowbreath:voiceExhaleName'
};

export const VOICE_MAX_BYTES = 500_000;

function isAmbient(v: unknown): v is AmbientKind {
	return typeof v === 'string' && (AMBIENT_KINDS as ReadonlyArray<string>).includes(v);
}
function isCuesMode(v: unknown): v is CuesMode {
	return typeof v === 'string' && (CUES_MODES as ReadonlyArray<string>).includes(v);
}

interface VoiceFile {
	dataUrl: string | null;
	name: string | null;
}

/** Maps a breath phase to which voice slot plays — both holds share the "hold" slot. */
function voiceSlotFor(phase: BreathPhase): VoiceSlot | null {
	switch (phase) {
		case 'inhale':
			return 'inhale';
		case 'hold_full':
		case 'hold_empty':
			return 'hold';
		case 'exhale':
			return 'exhale';
		default:
			return null;
	}
}

/** Phase-specific frequencies for the "distinct" cue mode (Hz). */
const DISTINCT_FREQ: Record<Exclude<BreathPhase, 'idle'>, number> = {
	inhale: 523, // C5 — bright, rising in feel
	hold_full: 659, // E5 — peak
	exhale: 392, // G4 — falling, settled
	hold_empty: 330 // E4 — low resting tone
};

class SoundStore {
	cuesEnabled = $state(true);
	cuesMode = $state<CuesMode>('soft');
	ambient = $state<AmbientKind>('off');
	cuesVolume = $state(0.18);
	ambientVolume = $state(0.12);
	voiceInhale = $state<VoiceFile>({ dataUrl: null, name: null });
	voiceHold = $state<VoiceFile>({ dataUrl: null, name: null });
	voiceExhale = $state<VoiceFile>({ dataUrl: null, name: null });

	private ctx: AudioContext | null = null;
	private noiseBuffers: Partial<Record<AmbientKind, AudioBuffer>> = {};
	private ambientSource: AudioBufferSourceNode | null = null;
	private ambientGain: GainNode | null = null;
	private initialized = false;

	init() {
		if (this.initialized || !browser) return;
		this.initialized = true;

		const cues = localStorage.getItem(CUES_KEY);
		if (cues === 'false') this.cuesEnabled = false;

		const mode = localStorage.getItem(CUES_MODE_KEY);
		if (isCuesMode(mode)) this.cuesMode = mode;

		const ambient = localStorage.getItem(AMBIENT_KEY);
		if (isAmbient(ambient)) this.ambient = ambient;

		const av = parseFloat(localStorage.getItem(AMBIENT_VOLUME_KEY) ?? '');
		if (!Number.isNaN(av) && av >= 0 && av <= 1) this.ambientVolume = av;

		const cv = parseFloat(localStorage.getItem(CUES_VOLUME_KEY) ?? '');
		if (!Number.isNaN(cv) && cv >= 0 && cv <= 1) this.cuesVolume = cv;

		for (const slot of ['inhale', 'hold', 'exhale'] as VoiceSlot[]) {
			const data = localStorage.getItem(VOICE_DATA_KEYS[slot]);
			const name = localStorage.getItem(VOICE_NAME_KEYS[slot]);
			if (data) this.voiceFor(slot).dataUrl = data;
			if (name) this.voiceFor(slot).name = name;
		}
	}

	voiceFor(slot: VoiceSlot): VoiceFile {
		return slot === 'inhale'
			? this.voiceInhale
			: slot === 'hold'
				? this.voiceHold
				: this.voiceExhale;
	}

	setCuesEnabled(enabled: boolean) {
		this.cuesEnabled = enabled;
		this.safeWrite(CUES_KEY, enabled ? 'true' : 'false');
	}

	setCuesMode(mode: CuesMode) {
		this.cuesMode = mode;
		this.safeWrite(CUES_MODE_KEY, mode);
	}

	setAmbient(kind: AmbientKind) {
		this.ambient = kind;
		this.safeWrite(AMBIENT_KEY, kind);
		if (kind === 'off') {
			this.stopAmbient();
		} else if (this.ambientSource) {
			this.stopAmbient();
			this.startAmbient();
		}
	}

	setCuesVolume(v: number) {
		this.cuesVolume = Math.max(0, Math.min(1, v));
		this.safeWrite(CUES_VOLUME_KEY, String(this.cuesVolume));
	}

	setAmbientVolume(v: number) {
		this.ambientVolume = Math.max(0, Math.min(1, v));
		this.safeWrite(AMBIENT_VOLUME_KEY, String(this.ambientVolume));
		if (this.ambientGain && this.ctx) {
			this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.05);
		}
	}

	uploadVoice(slot: VoiceSlot, dataUrl: string, name: string) {
		this.voiceFor(slot).dataUrl = dataUrl;
		this.voiceFor(slot).name = name;
		this.safeWrite(VOICE_DATA_KEYS[slot], dataUrl);
		this.safeWrite(VOICE_NAME_KEYS[slot], name);
	}

	clearVoice(slot: VoiceSlot) {
		this.voiceFor(slot).dataUrl = null;
		this.voiceFor(slot).name = null;
		this.safeRemove(VOICE_DATA_KEYS[slot]);
		this.safeRemove(VOICE_NAME_KEYS[slot]);
	}

	playPhaseCue(phase: BreathPhase) {
		if (!this.cuesEnabled || !browser || phase === 'idle') return;
		switch (this.cuesMode) {
			case 'soft':
				this.playSineTone(528);
				break;
			case 'distinct':
				this.playSineTone(DISTINCT_FREQ[phase]);
				break;
			case 'voice':
				this.playVoice(phase);
				break;
		}
	}

	async startAmbient() {
		if (!browser || this.ambient === 'off') return;
		const ctx = this.getCtx();
		if (!ctx) return;
		if (this.ambientSource) return;
		const kind = this.ambient;
		const buffer = await this.getOrLoadBuffer(ctx, kind);
		// Bail if the user switched ambient (or stopped) during the async load.
		if (!buffer || this.ambient !== kind || this.ambientSource) return;
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
		const src = this.ambientSource;
		setTimeout(() => {
			try {
				src.stop();
			} catch {
				// already stopped
			}
		}, 800);
		this.ambientSource = null;
		this.ambientGain = null;
	}

	/** Smoothly fades ambient to silence while keeping the source playing — call when the breath pauses. */
	pauseAmbient() {
		if (!this.ambientGain || !this.ctx) return;
		this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
	}

	/** Smoothly fades ambient back up — call when the breath resumes. */
	resumeAmbient() {
		if (!this.ambientGain || !this.ctx) return;
		this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.4);
	}

	private playSineTone(freq: number) {
		const ctx = this.getCtx();
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.value = freq;
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

	private playVoice(phase: BreathPhase) {
		const slot = voiceSlotFor(phase);
		if (!slot) return;
		const file = this.voiceFor(slot);
		if (!file.dataUrl) {
			// No voice uploaded for this phase — fall back to a soft tone so the user still gets a cue.
			this.playSineTone(528);
			return;
		}
		try {
			const audio = new Audio(file.dataUrl);
			audio.volume = Math.max(0, Math.min(1, this.cuesVolume * 3.5));
			audio.play().catch(() => {
				// Autoplay or decode error — fall back.
				this.playSineTone(528);
			});
		} catch {
			this.playSineTone(528);
		}
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

	private async getOrLoadBuffer(
		ctx: AudioContext,
		kind: AmbientKind
	): Promise<AudioBuffer | null> {
		if (kind === 'off') return null;
		const cached = this.noiseBuffers[kind];
		if (cached) return cached;

		if (FILE_AMBIENTS.includes(kind)) {
			const path = AMBIENT_FILE_PATHS[kind];
			if (!path) return null;
			try {
				const response = await fetch(path);
				if (!response.ok) return null;
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
				this.noiseBuffers[kind] = audioBuffer;
				return audioBuffer;
			} catch {
				return null;
			}
		}

		// Generated: brown / pink / white
		const duration = 5;
		const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
		const data = buffer.getChannelData(0);

		if (kind === 'white') {
			for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
		} else if (kind === 'brown') {
			let lastOut = 0;
			for (let i = 0; i < data.length; i++) {
				const white = Math.random() * 2 - 1;
				lastOut = (lastOut + 0.02 * white) / 1.02;
				data[i] = lastOut * 3.5;
			}
		} else if (kind === 'pink') {
			// Voss-McCartney pink noise approximation
			const b = [0, 0, 0, 0, 0, 0, 0];
			for (let i = 0; i < data.length; i++) {
				const white = Math.random() * 2 - 1;
				b[0] = 0.99886 * b[0] + white * 0.0555179;
				b[1] = 0.99332 * b[1] + white * 0.0750759;
				b[2] = 0.969 * b[2] + white * 0.153852;
				b[3] = 0.8665 * b[3] + white * 0.3104856;
				b[4] = 0.55 * b[4] + white * 0.5329522;
				b[5] = -0.7616 * b[5] - white * 0.016898;
				const out = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362;
				data[i] = out * 0.11;
				b[6] = white * 0.115926;
			}
		}

		this.noiseBuffers[kind] = buffer;
		return buffer;
	}

	private safeWrite(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			// ignore
		}
	}

	private safeRemove(key: string) {
		try {
			localStorage.removeItem(key);
		} catch {
			// ignore
		}
	}
}

export const sounds = new SoundStore();
