<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { sounds } from '$lib/sounds.svelte';

	let isOpen = $state(false);
	let panelEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!isOpen) return;
		function onDocClick(e: MouseEvent) {
			if (panelEl && !panelEl.contains(e.target as Node)) isOpen = false;
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') isOpen = false;
		}
		document.addEventListener('mousedown', onDocClick, true);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDocClick, true);
			document.removeEventListener('keydown', onKey);
		};
	});

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="relative">
	<button
		type="button"
		onclick={toggle}
		aria-label={m.sound_settings_label()}
		aria-expanded={isOpen}
		title={m.sound_settings_label()}
		data-testid="sound-settings-button"
		class="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
	>
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
			<path d="M11 5 6 9H2v6h4l5 4z" />
			<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
		</svg>
	</button>

	{#if isOpen}
		<div
			bind:this={panelEl}
			data-testid="sound-settings-panel"
			class="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl dark:border-slate-800 dark:bg-slate-900"
		>
			<div class="space-y-5">
				<label class="flex items-start gap-3 text-sm">
					<input
						type="checkbox"
						checked={sounds.cuesEnabled}
						onchange={(e) => sounds.setCuesEnabled((e.currentTarget as HTMLInputElement).checked)}
						data-testid="sound-cues-toggle"
						class="mt-0.5 h-4 w-4 cursor-pointer accent-sky-500"
					/>
					<span class="flex flex-col">
						<span class="font-medium text-slate-800 dark:text-slate-100">
							{m.sound_cues_toggle()}
						</span>
						<span class="text-xs text-slate-500 dark:text-slate-400">{m.sound_cues_hint()}</span>
					</span>
				</label>

				{#if sounds.cuesEnabled}
					<label class="block text-xs text-slate-500 dark:text-slate-400">
						{m.sound_volume_cues()}
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={sounds.cuesVolume}
							oninput={(e) =>
								sounds.setCuesVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
							data-testid="sound-cues-volume"
							class="mt-1 block w-full accent-sky-500"
						/>
					</label>
				{/if}

				<div>
					<span class="text-xs font-medium text-slate-600 dark:text-slate-300">
						{m.sound_ambient_label()}
					</span>
					<select
						value={sounds.ambient}
						onchange={(e) =>
							sounds.setAmbient(
								(e.currentTarget as HTMLSelectElement).value as 'off' | 'brown'
							)}
						data-testid="sound-ambient-select"
						class="mt-1 w-full cursor-pointer rounded-md border border-slate-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
					>
						<option value="off">{m.sound_ambient_off()}</option>
						<option value="brown">{m.sound_ambient_brown()}</option>
					</select>
				</div>

				{#if sounds.ambient !== 'off'}
					<label class="block text-xs text-slate-500 dark:text-slate-400">
						{m.sound_volume_ambient()}
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={sounds.ambientVolume}
							oninput={(e) =>
								sounds.setAmbientVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
							data-testid="sound-ambient-volume"
							class="mt-1 block w-full accent-sky-500"
						/>
					</label>
				{/if}
			</div>
		</div>
	{/if}
</div>
