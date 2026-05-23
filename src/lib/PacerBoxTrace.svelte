<script lang="ts">
	import { breath, type BreathPhase, PROTOCOLS, type Protocol } from '$lib/breath.svelte';

	type Point = { x: number; y: number };
	type Side = { phase: BreathPhase; from: Point; to: Point };
	type Shape = { sides: Side[]; outlineKind: 'square' | 'triangle' | 'line' };

	/**
	 * For a given protocol, build the polygon whose sides correspond 1:1 to the
	 * non-zero phases. 4 phases → square, 3 → triangle, 2 → horizontal line.
	 */
	function shapeFor(protocol: Protocol): Shape {
		const dur = PROTOCOLS[protocol];
		const ordered: { phase: Exclude<BreathPhase, 'idle'>; duration: number }[] = [
			{ phase: 'inhale', duration: dur.inhale },
			{ phase: 'hold_full', duration: dur.holdFull },
			{ phase: 'exhale', duration: dur.exhale },
			{ phase: 'hold_empty', duration: dur.holdEmpty }
		];
		const active = ordered.filter((p) => p.duration > 0).map((p) => p.phase);
		const n = active.length;

		// Pick vertices so the FIRST active phase starts at the visually-lowest
		// point and the breath "rises" on inhale.
		let vertices: Point[];
		let outlineKind: Shape['outlineKind'];

		if (n >= 4) {
			vertices = [
				{ x: 10, y: 10 }, // top-left  — start of inhale
				{ x: 90, y: 10 }, // top-right — start of hold_full
				{ x: 90, y: 90 }, // bottom-right — start of exhale
				{ x: 10, y: 90 } // bottom-left  — start of hold_empty
			];
			outlineKind = 'square';
		} else if (n === 3) {
			// Equilateral-ish triangle. Inhale goes from bottom-left up to apex.
			vertices = [
				{ x: 12, y: 80 }, // bottom-left — start of inhale (going up)
				{ x: 50, y: 12 }, // top vertex — start of hold_full
				{ x: 88, y: 80 } //  bottom-right — start of exhale (going home)
			];
			outlineKind = 'triangle';
		} else if (n === 2) {
			// Horizontal line — dot moves left→right on inhale, right→left on exhale
			vertices = [
				{ x: 15, y: 50 }, // left — start of inhale
				{ x: 85, y: 50 } //  right — start of exhale
			];
			outlineKind = 'line';
		} else {
			vertices = [{ x: 50, y: 50 }];
			outlineKind = 'square';
		}

		const sides: Side[] = active.map((phase, i) => ({
			phase,
			from: vertices[i % vertices.length],
			to: vertices[(i + 1) % vertices.length]
		}));

		return { sides, outlineKind };
	}

	const shape = $derived(shapeFor(breath.protocol));

	const dot = $derived.by(() => {
		const side = shape.sides.find((s) => s.phase === breath.phase);
		if (!side) {
			const first = shape.sides[0];
			return first ? first.from : { x: 50, y: 50 };
		}
		const p = breath.phaseProgress;
		return {
			x: side.from.x + (side.to.x - side.from.x) * p,
			y: side.from.y + (side.to.y - side.from.y) * p
		};
	});
</script>

<div class="relative aspect-square w-full max-w-[min(360px,55vh)]">
	<svg
		data-testid="pacer-trace-svg"
		data-shape={shape.outlineKind}
		viewBox="0 0 100 100"
		class="h-full w-full"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="hsl(195 100% 70%)" stop-opacity="0.95" />
				<stop offset="100%" stop-color="hsl(195 100% 70%)" stop-opacity="0" />
			</radialGradient>
			<filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="1.4" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		{#if shape.outlineKind === 'square'}
			<rect
				x="10"
				y="10"
				width="80"
				height="80"
				rx="6"
				ry="6"
				fill="none"
				class="stroke-slate-300 dark:stroke-slate-700"
				stroke-width="0.5"
			/>
		{:else if shape.outlineKind === 'triangle'}
			<polygon
				points="12,80 50,12 88,80"
				fill="none"
				class="stroke-slate-300 dark:stroke-slate-700"
				stroke-width="0.5"
				stroke-linejoin="round"
			/>
		{:else}
			<line
				x1="15"
				y1="50"
				x2="85"
				y2="50"
				class="stroke-slate-300 dark:stroke-slate-700"
				stroke-width="0.5"
				stroke-linecap="round"
			/>
		{/if}

		<!-- dot glow halo -->
		<circle cx={dot.x} cy={dot.y} r="9" fill="url(#dotGlow)" opacity="0.7" />

		<!-- the dot itself -->
		<circle
			data-testid="pacer-box-dot"
			cx={dot.x}
			cy={dot.y}
			r="2.4"
			fill="hsl(195 95% 65%)"
			filter="url(#bloom)"
		/>
	</svg>
</div>
