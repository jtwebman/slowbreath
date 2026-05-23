<script lang="ts">
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';
	import { breath, type BreathPhase } from '$lib/breath.svelte';
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
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-sky-50 px-6 py-12 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
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

	<div class="flex w-full max-w-xl flex-col items-center gap-10">
		<header class="flex flex-col items-center gap-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight text-slate-700 dark:text-slate-200">
				{m.app_name()}
			</h1>
			<p class="text-sm text-slate-500 dark:text-slate-400">
				{m.main_protocol_label()}
			</p>
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

		<div class="flex h-10 items-center justify-center">
			{#if breath.phase === 'idle'}
				<p class="text-sm text-slate-500 dark:text-slate-400">{m.main_idle_hint()}</p>
			{:else}
				<p
					data-testid="phase-label"
					class="text-2xl font-light tracking-wide text-slate-700 tabular-nums dark:text-slate-200"
				>
					{phaseLabel}
				</p>
			{/if}
		</div>

		<div class="flex flex-col items-center gap-4">
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
