<script lang="ts">
	import { breath } from '$lib/breath.svelte';

	function easeInOut(t: number): number {
		return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
	}

	const SCALE_MIN = 0.42;
	const SCALE_MAX = 1.0;
	const RANGE = SCALE_MAX - SCALE_MIN;

	const scale = $derived(
		breath.phase === 'inhale'
			? SCALE_MIN + RANGE * easeInOut(breath.phaseProgress)
			: breath.phase === 'hold_full'
				? SCALE_MAX
				: breath.phase === 'exhale'
					? SCALE_MAX - RANGE * easeInOut(breath.phaseProgress)
					: breath.phase === 'hold_empty'
						? SCALE_MIN
						: 0.55
	);

	// Subtle glow opacity tracks the breath — brighter when full, dimmer when empty.
	const glow = $derived((scale - SCALE_MIN) / RANGE); // 0..1
</script>

<div class="pointer-events-none relative aspect-square w-full max-w-[440px]">
	<!-- Outer halo, fades on inhale, settles on exhale -->
	<div
		class="absolute inset-0 rounded-full"
		style:transform="scale({0.8 + scale * 0.4})"
		style:opacity={0.18 + glow * 0.32}
		style:background="radial-gradient(circle, hsl(195 100% 60% / 0.55), hsl(195 100% 60% / 0) 70%)"
		style:filter="blur(40px)"
	></div>

	<!-- Inner orb -->
	<div
		data-testid="pacer-orb"
		class="absolute inset-0 rounded-full"
		style:transform="scale({scale})"
		style:background="radial-gradient(circle at 35% 30%, hsl(195 95% 75%) 0%, hsl(200 88% 55%) 45%, hsl(210 75% 35%) 100%)"
		style:box-shadow="inset 0 -20px 60px hsl(220 60% 25% / 0.5), 0 0 60px hsl(195 100% 65% / {0.25 +
			glow * 0.35})"
	></div>
</div>
