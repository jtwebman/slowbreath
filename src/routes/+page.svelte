<script lang="ts">
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';
	import { breath, type BreathPhase, type Protocol } from '$lib/breath.svelte';
	import { ui } from '$lib/ui.svelte';
	import PacerBoxTrace from '$lib/PacerBoxTrace.svelte';
	import PacerCircle from '$lib/PacerCircle.svelte';
	import PacerGlow from '$lib/PacerGlow.svelte';

	const canonicalUrl = $derived(`https://slowbreath.app/${getLocale()}/`);

	const phaseLabel = $derived(phaseToLabel(breath.phase));

	function phaseToLabel(phase: BreathPhase): string {
		switch (phase) {
			case 'inhale':
				return m.phase_inhale();
			case 'hold_full':
				return m.phase_hold_full();
			case 'exhale':
				return m.phase_exhale();
			case 'hold_empty':
				return m.phase_hold_empty();
			default:
				return '';
		}
	}

	function formatInt(n: number): string {
		return new Intl.NumberFormat(getLocale()).format(n);
	}

	function formatDuration(totalSeconds: number): string {
		const locale = getLocale();
		const total = Math.floor(totalSeconds);
		const min = Math.floor(total / 60);
		const sec = total % 60;
		const minStr = new Intl.NumberFormat(locale, { useGrouping: false }).format(min);
		const secStr = new Intl.NumberFormat(locale, {
			useGrouping: false,
			minimumIntegerDigits: 2
		}).format(sec);
		return `${minStr}:${secStr}`;
	}

	const title = $derived(
		breath.isRunning && !breath.isPaused
			? `${phaseLabel} — ${m.app_name()}`
			: m.app_name()
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={m.meta_description()} />
	<meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={m.app_name()} />
	<meta property="og:title" content={m.app_name()} />
	<meta property="og:description" content={m.meta_description()} />
	<meta property="og:image" content="https://slowbreath.app/og-image.png" />
	<meta property="og:url" content={canonicalUrl} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={m.app_name()} />
	<meta name="twitter:description" content={m.meta_description()} />
	<meta name="twitter:image" content="https://slowbreath.app/og-image.png" />

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<main
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-sky-50 px-6 py-6 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
>
	{#if breath.isDevMode}
		<div
			data-testid="dev-badge"
			class="fixed top-3 left-3 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-300"
		>
			Dev
		</div>
	{/if}

	<a
		href={localizeHref('/why')}
		class="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
	>
		{m.why_title()} →
	</a>

	<div class="flex w-full max-w-xl flex-col items-center gap-6">
		<header class="flex flex-col items-center gap-1 text-center">
			<h1 class="text-2xl font-semibold tracking-tight text-slate-700 dark:text-slate-200">
				{m.app_name()}
			</h1>
			<div class="relative">
				<label class="text-sm text-slate-500 dark:text-slate-400">
					<span class="sr-only">{m.protocol_picker_label()}</span>
					<select
						value={breath.protocol}
						onchange={(e) =>
							breath.setProtocol((e.currentTarget as HTMLSelectElement).value as Protocol)}
						disabled={breath.isRunning}
						data-testid="protocol-picker"
						class="cursor-pointer appearance-none bg-transparent pr-5 text-sm text-slate-500 transition hover:text-slate-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
					>
						<option value="box">{m.protocol_box()}</option>
						<option value="478">{m.protocol_478()}</option>
						<option value="6bpm">{m.protocol_6bpm()}</option>
					</select>
					<svg
						class="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-slate-400"
						xmlns="http://www.w3.org/2000/svg"
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</label>
			</div>
		</header>

		<div class="flex w-full items-center justify-center">
			{#if ui.pacerStyle === 'glow'}
				<PacerGlow onUnsupported={() => ui.fallbackTo('circle')} />
			{:else if ui.pacerStyle === 'box'}
				<PacerBoxTrace />
			{:else}
				<PacerCircle />
			{/if}
		</div>

		<div class="flex h-8 items-center justify-center">
			{#if breath.phase === 'idle'}
				<p class="text-sm text-slate-500 dark:text-slate-400">{m.main_idle_hint()}</p>
			{:else}
				<p
					data-testid="phase-label"
					class="text-xl font-light tracking-wide text-slate-700 tabular-nums dark:text-slate-200"
				>
					{phaseLabel}
				</p>
			{/if}
		</div>

		<div class="flex flex-col items-center gap-3">
			{#if breath.phase === 'idle'}
				<button
					type="button"
					data-testid="primary-action"
					onclick={() => breath.start()}
					class="rounded-2xl bg-sky-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-500"
				>
					{m.main_start()}
				</button>
			{:else if breath.isPaused}
				<div class="flex gap-3">
					<button
						type="button"
						data-testid="primary-action"
						onclick={() => breath.resume()}
						class="rounded-2xl bg-sky-500 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 dark:bg-sky-600 dark:hover:bg-sky-500"
					>
						{m.main_resume()}
					</button>
					<button
						type="button"
						data-testid="secondary-action"
						onclick={() => breath.stop()}
						class="rounded-2xl border border-slate-300 px-8 py-3 font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-300"
					>
						{m.main_stop()}
					</button>
				</div>
			{:else}
				<div class="flex gap-3">
					<button
						type="button"
						data-testid="primary-action"
						onclick={() => breath.pause()}
						class="rounded-2xl border border-slate-300 px-8 py-3 font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-300"
					>
						{m.main_pause()}
					</button>
					<button
						type="button"
						data-testid="secondary-action"
						onclick={() => breath.stop()}
						class="rounded-2xl border border-slate-300 px-8 py-3 font-semibold text-slate-700 transition hover:border-slate-500 dark:border-slate-700 dark:text-slate-300"
					>
						{m.main_stop()}
					</button>
				</div>
			{/if}

			{#if breath.phase !== 'idle' || breath.cyclesCompleted > 0}
				<div
					data-testid="stats"
					class="flex gap-6 text-sm text-slate-500 tabular-nums dark:text-slate-400"
				>
					<span>{m.stat_cycles()}: {formatInt(breath.cyclesCompleted)}</span>
					<span>{m.stat_time()}: {formatDuration(breath.totalSeconds)}</span>
				</div>
			{/if}
		</div>
	</div>
</main>
