<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { ui } from '$lib/ui.svelte';

	const label = $derived(
		ui.pacerStyle === 'glow'
			? m.pacer_glow()
			: ui.pacerStyle === 'box'
				? m.pacer_box()
				: m.pacer_circle()
	);
	const tooltip = $derived(`${m.pacer_style_label()}: ${label}`);
</script>

<button
	type="button"
	onclick={() => ui.cyclePacerStyle()}
	aria-label={tooltip}
	title={tooltip}
	data-testid="pacer-style-toggle"
	data-style={ui.pacerStyle}
	class="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
>
	{#if ui.pacerStyle === 'glow'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<circle cx="12" cy="12" r="8" stroke-dasharray="2 3" opacity="0.6" />
		</svg>
	{:else if ui.pacerStyle === 'box'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<rect x="4" y="4" width="16" height="16" rx="2" />
			<circle cx="20" cy="4" r="1.6" fill="currentColor" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="6" />
		</svg>
	{/if}
</button>
