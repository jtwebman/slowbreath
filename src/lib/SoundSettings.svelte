<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import {
		sounds,
		VOICE_MAX_BYTES,
		type AmbientKind,
		type CuesMode,
		type VoiceSlot
	} from '$lib/sounds.svelte';

	let isOpen = $state(false);
	let errorMessage = $state<string | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let pendingSlot = $state<VoiceSlot | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

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
		errorMessage = null;
	}

	function startUpload(slot: VoiceSlot) {
		errorMessage = null;
		pendingSlot = slot;
		fileInput?.click();
	}

	function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		const slot = pendingSlot;
		pendingSlot = null;
		if (!file || !slot) return;
		if (file.size > VOICE_MAX_BYTES) {
			errorMessage = m.sound_voice_too_large();
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result;
			if (typeof dataUrl !== 'string') return;
			try {
				sounds.uploadVoice(slot, dataUrl, file.name);
			} catch {
				errorMessage = m.sound_voice_storage_error();
			}
		};
		reader.onerror = () => {
			errorMessage = m.sound_voice_storage_error();
		};
		reader.readAsDataURL(file);
	}

	function slotLabel(slot: VoiceSlot): string {
		return slot === 'inhale'
			? m.sound_voice_slot_inhale()
			: slot === 'hold'
				? m.sound_voice_slot_hold()
				: m.sound_voice_slot_exhale();
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
			class="absolute top-full right-0 z-50 mt-2 max-h-[80vh] w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl dark:border-slate-800 dark:bg-slate-900"
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
					<div>
						<span class="text-xs font-medium text-slate-600 dark:text-slate-300">
							{m.sound_cues_mode_label()}
						</span>
						<select
							value={sounds.cuesMode}
							onchange={(e) => sounds.setCuesMode((e.currentTarget as HTMLSelectElement).value as CuesMode)}
							data-testid="sound-cues-mode"
							class="mt-1 w-full cursor-pointer rounded-md border border-slate-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
						>
							<option value="soft">{m.sound_cues_mode_soft()}</option>
							<option value="distinct">{m.sound_cues_mode_distinct()}</option>
							<option value="voice">{m.sound_cues_mode_voice()}</option>
						</select>
					</div>

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

					{#if sounds.cuesMode === 'voice'}
						<div
							data-testid="voice-uploads"
							class="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
						>
							<div class="text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-300">
								{m.sound_voice_label()}
							</div>
							<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
								{m.sound_voice_hint()}
							</p>
							<div class="mt-3 space-y-3">
								{#each ['inhale', 'hold', 'exhale'] as slot (slot)}
									{@const file = sounds.voiceFor(slot as VoiceSlot)}
									<div
										data-testid={`voice-slot-${slot}`}
										class="rounded border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
									>
										<div class="flex items-center justify-between gap-2">
											<span class="text-xs font-medium text-slate-700 dark:text-slate-200">
												{slotLabel(slot as VoiceSlot)}
											</span>
											{#if file.dataUrl}
												<div class="flex gap-2">
													<button
														type="button"
														onclick={() => startUpload(slot as VoiceSlot)}
														data-testid={`voice-replace-${slot}`}
														class="text-xs text-sky-600 underline hover:no-underline dark:text-sky-400"
													>
														{m.sound_voice_replace()}
													</button>
													<button
														type="button"
														onclick={() => sounds.clearVoice(slot as VoiceSlot)}
														data-testid={`voice-clear-${slot}`}
														class="text-xs text-slate-500 underline hover:text-slate-700 hover:no-underline dark:hover:text-slate-300"
													>
														{m.sound_voice_clear()}
													</button>
												</div>
											{:else}
												<button
													type="button"
													onclick={() => startUpload(slot as VoiceSlot)}
													data-testid={`voice-upload-${slot}`}
													class="text-xs text-sky-600 underline hover:no-underline dark:text-sky-400"
												>
													{m.sound_voice_upload()}
												</button>
											{/if}
										</div>
										{#if file.name}
											<div
												data-testid={`voice-name-${slot}`}
												class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400"
												title={file.name}
											>
												{file.name}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<input
							type="file"
							accept="audio/*"
							class="hidden"
							bind:this={fileInput}
							onchange={onFileChange}
							data-testid="voice-file-input"
						/>
					{/if}
				{/if}

				<div>
					<span class="text-xs font-medium text-slate-600 dark:text-slate-300">
						{m.sound_ambient_label()}
					</span>
					<select
						value={sounds.ambient}
						onchange={(e) => sounds.setAmbient((e.currentTarget as HTMLSelectElement).value as AmbientKind)}
						data-testid="sound-ambient-select"
						class="mt-1 w-full cursor-pointer rounded-md border border-slate-300 bg-transparent py-1.5 pr-7 pl-3 text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
					>
						<option value="off">{m.sound_ambient_off()}</option>
						<optgroup label="Generated">
							<option value="brown">{m.sound_ambient_brown()}</option>
							<option value="pink">{m.sound_ambient_pink()}</option>
							<option value="white">{m.sound_ambient_white()}</option>
						</optgroup>
						<optgroup label="Nature">
							<option value="rain">{m.sound_ambient_rain()}</option>
							<option value="forest">{m.sound_ambient_forest()}</option>
							<option value="ocean">{m.sound_ambient_ocean()}</option>
						</optgroup>
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

				{#if errorMessage}
					<p data-testid="sound-error" class="text-xs text-red-600 dark:text-red-400">
						{errorMessage}
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
