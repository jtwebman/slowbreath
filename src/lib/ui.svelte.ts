import { browser } from '$app/environment';

export type PacerStyle = 'glow' | 'box' | 'circle';

const STORAGE_KEY = 'slowbreath:pacerStyle';
const VALID: ReadonlyArray<PacerStyle> = ['glow', 'box', 'circle'];

function isPacerStyle(value: unknown): value is PacerStyle {
	return typeof value === 'string' && (VALID as ReadonlyArray<string>).includes(value);
}

class UIStore {
	pacerStyle = $state<PacerStyle>('glow');
	private initialized = false;

	init() {
		if (this.initialized || !browser) return;
		this.initialized = true;
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (isPacerStyle(saved)) this.pacerStyle = saved;
		} catch {
			// ignore
		}
	}

	setPacerStyle(next: PacerStyle) {
		this.pacerStyle = next;
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// ignore
		}
	}

	cyclePacerStyle() {
		const idx = VALID.indexOf(this.pacerStyle);
		this.setPacerStyle(VALID[(idx + 1) % VALID.length]);
	}

	/** Force a pacer style without persisting — used when WebGL is unsupported. */
	fallbackTo(style: PacerStyle) {
		this.pacerStyle = style;
	}
}

export const ui = new UIStore();
