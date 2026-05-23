<script lang="ts">
	import { breath, type BreathPhase } from '$lib/breath.svelte';

	// SVG square goes from (10,10) to (90,90) inside a 100x100 viewBox.
	// Each phase traces one side, in clockwise order starting top-left.
	type Position = { x: number; y: number };

	function dotPosition(phase: BreathPhase, p: number): Position {
		switch (phase) {
			case 'inhale':
				return { x: 10 + 80 * p, y: 10 }; // top: L → R
			case 'hold_full':
				return { x: 90, y: 10 + 80 * p }; // right: T → B
			case 'exhale':
				return { x: 90 - 80 * p, y: 90 }; // bottom: R → L
			case 'hold_empty':
				return { x: 10, y: 90 - 80 * p }; // left: B → T
			default:
				return { x: 10, y: 10 };
		}
	}

	const pos = $derived(dotPosition(breath.phase, breath.phaseProgress));
</script>

<div class="relative aspect-square w-full max-w-[440px]">
	<svg viewBox="0 0 100 100" class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
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

		<!-- subtle box outline -->
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

		<!-- dot glow halo -->
		<circle cx={pos.x} cy={pos.y} r="9" fill="url(#dotGlow)" opacity="0.7" />

		<!-- the dot itself -->
		<circle
			data-testid="pacer-box-dot"
			cx={pos.x}
			cy={pos.y}
			r="2.4"
			fill="hsl(195 95% 65%)"
			filter="url(#bloom)"
		/>
	</svg>
</div>
