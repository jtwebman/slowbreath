<script lang="ts">
	import { baseLocale, getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';

	const locale = $derived(getLocale());
	const isTranslated = $derived(locale !== baseLocale);
	const canonicalUrl = $derived(`https://slowbreath.app/${locale}/why`);
</script>

<svelte:head>
	<title>{m.why_title()} — {m.app_name()}</title>
	<meta name="description" content={m.why_meta_description()} />

	<meta property="og:type" content="article" />
	<meta property="og:site_name" content={m.app_name()} />
	<meta property="og:title" content={`${m.why_title()} — ${m.app_name()}`} />
	<meta property="og:description" content={m.why_meta_description()} />
	<meta property="og:image" content="https://slowbreath.app/og-image.png" />
	<meta property="og:url" content={canonicalUrl} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${m.why_title()} — ${m.app_name()}`} />
	<meta name="twitter:description" content={m.why_meta_description()} />
	<meta name="twitter:image" content="https://slowbreath.app/og-image.png" />

	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100"
>
	<header class="mx-auto flex max-w-2xl items-center justify-between px-6 pt-6">
		<a
			href={localizeHref('/')}
			class="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
		>
			{m.why_back_to_breathing()}
		</a>
		<span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{m.app_name()}</span>
	</header>

	<main class="mx-auto max-w-2xl px-6 py-12">
		{#if isTranslated}
			<div
				data-testid="translation-notice"
				class="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
			>
				{m.why_translation_notice()}<a
					href="/en/why"
					data-sveltekit-reload
					class="font-semibold underline hover:no-underline">{m.why_translation_notice_link()}</a
				>.
			</div>
		{/if}

		<h1 class="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">{m.why_title()}</h1>

		<p class="mb-6 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
			{m.why_intro()}
		</p>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_bp()}</h2>
			<p class="leading-relaxed text-slate-700 dark:text-slate-300">
				{m.why_bp_p1()}<a
					href="#cite-russo"
					class="text-sky-600 hover:underline dark:text-sky-400">[1]</a
				>
			</p>
			<p class="leading-relaxed text-slate-700 dark:text-slate-300">
				{m.why_bp_p2()}<a
					href="#cite-schein"
					class="text-sky-600 hover:underline dark:text-sky-400">[2]</a
				>
			</p>
		</section>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_anxiety()}</h2>
			<p class="leading-relaxed text-slate-700 dark:text-slate-300">
				{m.why_anxiety_p1()}<a
					href="#cite-balban"
					class="text-sky-600 hover:underline dark:text-sky-400">[3]</a
				>
			</p>
			<p class="leading-relaxed text-slate-700 dark:text-slate-300">{m.why_anxiety_p2()}</p>
		</section>

		<section class="mt-12 space-y-4">
			<h2 class="text-2xl font-semibold tracking-tight">{m.why_section_app()}</h2>
			<p class="leading-relaxed text-slate-700 dark:text-slate-300">{m.why_app_p1()}</p>
			<p class="leading-relaxed text-slate-700 dark:text-slate-300">{m.why_app_p2()}</p>
		</section>

		<section class="mt-16 border-t border-slate-200 pt-8 dark:border-slate-800">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
				{m.why_references()}
			</h2>
			<ol class="space-y-4 text-sm text-slate-600 dark:text-slate-400">
				<li id="cite-russo">
					<span class="font-semibold text-slate-700 dark:text-slate-300">[1]</span>
					{m.why_ref_russo()}
					<a
						href="https://pubmed.ncbi.nlm.nih.gov/29209423/"
						target="_blank"
						rel="noopener"
						class="text-sky-600 hover:underline dark:text-sky-400">PubMed</a
					>
				</li>
				<li id="cite-schein">
					<span class="font-semibold text-slate-700 dark:text-slate-300">[2]</span>
					{m.why_ref_schein()}
					<a
						href="https://pubmed.ncbi.nlm.nih.gov/11319675/"
						target="_blank"
						rel="noopener"
						class="text-sky-600 hover:underline dark:text-sky-400">PubMed</a
					>
				</li>
				<li id="cite-balban">
					<span class="font-semibold text-slate-700 dark:text-slate-300">[3]</span>
					{m.why_ref_balban()}
					<a
						href="https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(22)00474-8"
						target="_blank"
						rel="noopener"
						class="text-sky-600 hover:underline dark:text-sky-400">Cell Reports Medicine</a
					>
				</li>
			</ol>
		</section>
	</main>
</div>
