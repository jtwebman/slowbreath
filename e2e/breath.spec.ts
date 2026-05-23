import { expect, test, type Page } from '@playwright/test';

async function gotoApp(page: Page, path: string = '/') {
	await page.goto(path);
	await page.locator('html[data-hydrated="true"]').waitFor();
}

test.describe('idle state', () => {
	test('renders heading, protocol picker, and Start button', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByRole('heading', { name: 'Slow Breath' })).toBeVisible();
		await expect(page.getByTestId('protocol-picker')).toHaveValue('box');
		await expect(page.getByTestId('primary-action')).toHaveText('Start');
	});

	test('dev badge is hidden by default', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByTestId('dev-badge')).toHaveCount(0);
	});

	test('dev badge appears with ?dev=1', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await expect(page.getByTestId('dev-badge')).toBeVisible();
	});

	test('Why link is present', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByText(/Why this exists/)).toBeVisible();
	});
});

test.describe('breath cycle (dev-scaled)', () => {
	test('Start transitions to a phase and shows phase label', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('phase-label')).toBeVisible();
		await expect(page.getByTestId('phase-label')).toHaveText(/Breathe in|Hold|Breathe out/);
	});

	test('completes at least one cycle and shows cycle counter', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click();
		// One full dev-scaled cycle is roughly 1.2s; wait for the counter to tick to 1+
		await expect(page.getByTestId('stats')).toContainText('Cycles: 1', { timeout: 5000 });
	});

	test('Pause halts progression, Stop returns to idle', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('phase-label')).toBeVisible();
		// Pause
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('primary-action')).toHaveText('Resume');
		// Stop
		await page.getByTestId('secondary-action').click();
		await expect(page.getByTestId('primary-action')).toHaveText('Start');
		await expect(page.getByTestId('phase-label')).toHaveCount(0);
	});

	test('Resume after pause restarts the rAF loop', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click(); // Start
		await page.waitForTimeout(400);
		await page.getByTestId('primary-action').click(); // Pause
		await expect(page.getByTestId('primary-action')).toHaveText('Resume');
		await page.getByTestId('primary-action').click(); // Resume
		await expect(page.getByTestId('primary-action')).toHaveText('Pause');
	});
});

test.describe('breath store survives navigation', () => {
	test('navigating to /why and back keeps the breath running', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('phase-label')).toBeVisible();

		await page.getByRole('link', { name: /Why this exists/ }).click();
		await expect(page.getByRole('heading', { name: 'Why this exists' })).toBeVisible();
		await page.waitForTimeout(800);

		await page.getByRole('link', { name: /Back to breathing/ }).click();
		// Phase label still visible — breath state machine kept running on /why
		await expect(page.getByTestId('phase-label')).toBeVisible();
		await expect(page.getByTestId('primary-action')).toHaveText('Pause');
	});
});

test.describe('pacer style toggle', () => {
	test('cycles glow → box → circle → glow and persists', async ({ page }) => {
		await gotoApp(page);
		const toggle = page.getByTestId('pacer-style-toggle');
		await expect(toggle).toHaveAttribute('data-style', 'glow');

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-style', 'box');
		await expect(page.getByTestId('pacer-box-dot')).toBeVisible();

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-style', 'circle');
		await expect(page.getByTestId('pacer-orb')).toBeVisible();

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-style', 'glow');

		// persistence across reload
		await toggle.click(); // box
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('pacer-style-toggle')).toHaveAttribute('data-style', 'box');
	});
});

test.describe('theme toggle', () => {
	test('cycles system → light → dark → system and persists', async ({ page }) => {
		await gotoApp(page);
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toHaveAttribute('data-theme', 'system');

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-theme', 'light');
		await expect(page.locator('html')).not.toHaveClass(/dark/);

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-theme', 'dark');
		await expect(page.locator('html')).toHaveClass(/dark/);

		await toggle.click();
		await expect(toggle).toHaveAttribute('data-theme', 'system');

		// persistence across reload
		await toggle.click();
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-theme', 'light');
	});
});

test.describe('language switcher', () => {
	test('switching to French navigates to /fr/', async ({ page }) => {
		await gotoApp(page, '/en/');
		await page.getByTestId('language-switcher').selectOption('fr');
		await page.waitForURL(/\/fr\/?/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
	});

	test('all 13 locales listed', async ({ page }) => {
		await gotoApp(page);
		const options = await page.getByTestId('language-switcher').locator('option').all();
		expect(options.length).toBe(13);
	});

	test('switching from /why preserves the route', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await page.getByTestId('language-switcher').selectOption('de');
		await page.waitForURL(/\/de\/why\/?$/);
	});
});

test.describe('GitHub link', () => {
	test('appears on the timer page', async ({ page }) => {
		await gotoApp(page);
		const link = page.getByTestId('github-link');
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('href', /github\.com\/jtwebman\/slowbreath/);
		await expect(link).toHaveAttribute('target', '_blank');
	});

	test('appears on the why page too', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await expect(page.getByTestId('github-link')).toBeVisible();
	});
});

test.describe('why page', () => {
	test('renders headings and citation list', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await expect(page.getByRole('heading', { name: 'Why this exists' })).toBeVisible();
		await expect(page.getByText('Russo MA')).toBeVisible();
		await expect(page.getByText('Schein MH')).toBeVisible();
		await expect(page.getByText('Balban MY')).toBeVisible();
	});

	test('English why page does not show the translation notice', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await expect(page.getByTestId('translation-notice')).toHaveCount(0);
	});

	test('Back to breathing link returns to the timer', async ({ page }) => {
		await gotoApp(page, '/en/why');
		await page.getByRole('link', { name: /Back to breathing/ }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});
});

test.describe('i18n', () => {
	test('/ redirects to /en/ by default', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.url()).toMatch(/\/en\/?$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	test('/es/ sets lang attribute', async ({ page }) => {
		await gotoApp(page, '/es/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'es');
	});
});

test.describe('session limit picker', () => {
	test('all four options are visible in idle', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByTestId('session-limit-5min')).toBeVisible();
		await expect(page.getByTestId('session-limit-10min')).toBeVisible();
		await expect(page.getByTestId('session-limit-15min')).toBeVisible();
		await expect(page.getByTestId('session-limit-forever')).toBeVisible();
	});

	test('default is "No limit" (forever)', async ({ page }) => {
		await gotoApp(page);
		await expect(page.getByTestId('session-limit-forever')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('selection persists across reload', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('session-limit-10min').click();
		const stored = await page.evaluate(() => localStorage.getItem('slowbreath:sessionLimit'));
		expect(stored).toBe(String(10 * 60));

		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('session-limit-10min')).toHaveAttribute('aria-pressed', 'true');
	});

	test('picker is hidden once a session starts', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('phase-label')).toBeVisible();
		await expect(page.getByTestId('session-limit-picker')).toHaveCount(0);
	});

	test('session auto-stops when limit is reached (dev-scaled 5 min ≈ 30s wall)', async ({
		page
	}) => {
		await gotoApp(page, '/?dev=1');
		// Pre-seed a much shorter limit so the test runs quickly.
		await page.evaluate(() => localStorage.setItem('slowbreath:sessionLimit', String(20)));
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		// Dev mode scales by 10×, so 20s "wall time" limit → ~2s real time
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('phase-label')).toBeVisible();
		// After ~2s of dev-mode wall time, breath should auto-stop and return to idle
		await expect(page.getByTestId('primary-action')).toHaveText('Start', { timeout: 5000 });
	});
});

test.describe('box-trace pacer adapts to protocol', () => {
	test('Box protocol renders a square outline', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem('slowbreath:pacerStyle', 'box');
			window.localStorage.setItem('slowbreath:protocol', 'box');
		});
		await gotoApp(page);
		const svg = page.getByTestId('pacer-trace-svg');
		await expect(svg.locator('rect')).toBeVisible();
		await expect(svg.locator('polygon')).toHaveCount(0);
		await expect(svg.locator('line')).toHaveCount(0);
	});

	test('4-7-8 protocol renders a triangle outline', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem('slowbreath:pacerStyle', 'box');
			window.localStorage.setItem('slowbreath:protocol', '478');
		});
		await gotoApp(page);
		const svg = page.getByTestId('pacer-trace-svg');
		await expect(svg.locator('polygon')).toBeVisible();
		await expect(svg.locator('rect')).toHaveCount(0);
	});

	test('6 BPM protocol renders a horizontal line outline', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem('slowbreath:pacerStyle', 'box');
			window.localStorage.setItem('slowbreath:protocol', '6bpm');
		});
		await gotoApp(page);
		const svg = page.getByTestId('pacer-trace-svg');
		await expect(svg).toHaveAttribute('data-shape', 'line');
		await expect(svg.locator('line')).toHaveCount(1);
		await expect(svg.locator('rect')).toHaveCount(0);
		await expect(svg.locator('polygon')).toHaveCount(0);
	});
});

test.describe('protocol picker', () => {
	test('switching to 4-7-8 persists and survives reload', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('protocol-picker').selectOption('478');
		const stored = await page.evaluate(() => localStorage.getItem('slowbreath:protocol'));
		expect(stored).toBe('478');

		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();
		await expect(page.getByTestId('protocol-picker')).toHaveValue('478');
	});

	test('picker is disabled while a session is running', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('primary-action').click();
		await expect(page.getByTestId('phase-label')).toBeVisible();
		await expect(page.getByTestId('protocol-picker')).toBeDisabled();
	});

	test('switching to 6 BPM completes cycles (no zero-duration phases stall)', async ({ page }) => {
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('protocol-picker').selectOption('6bpm');
		await page.getByTestId('primary-action').click();
		// 6bpm has no holds; cycle is just inhale + exhale
		await expect(page.getByTestId('stats')).toContainText('Cycles: 1', { timeout: 5000 });
	});
});

test.describe('sound settings', () => {
	test('panel opens with all controls visible', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await expect(page.getByTestId('sound-settings-panel')).toBeVisible();
		await expect(page.getByTestId('sound-cues-toggle')).toBeVisible();
		await expect(page.getByTestId('sound-cues-mode')).toBeVisible();
		await expect(page.getByTestId('sound-ambient-select')).toBeVisible();
	});

	test('cue mode "voice" reveals upload slots', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('sound-cues-mode').selectOption('voice');
		await expect(page.getByTestId('voice-uploads')).toBeVisible();
		await expect(page.getByTestId('voice-slot-inhale')).toBeVisible();
		await expect(page.getByTestId('voice-slot-hold')).toBeVisible();
		await expect(page.getByTestId('voice-slot-exhale')).toBeVisible();
	});

	test('ambient dropdown lists all seven kinds (3 generated + 3 nature + off)', async ({
		page
	}) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		const opts = await page.getByTestId('sound-ambient-select').locator('option').all();
		expect(opts.length).toBe(7);
	});

	test('ambient pauses when breath pauses, resumes on resume', async ({ page }) => {
		// We can't easily observe Web Audio gain values directly from Playwright,
		// but we can at least verify the breath store calls into the sound store
		// without errors and the UI state is consistent.
		await gotoApp(page, '/?dev=1');
		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('sound-ambient-select').selectOption('brown');
		// Close the popover by pressing Escape
		await page.keyboard.press('Escape');
		await page.getByTestId('primary-action').click(); // Start
		await expect(page.getByTestId('phase-label')).toBeVisible();
		await page.getByTestId('primary-action').click(); // Pause
		await expect(page.getByTestId('primary-action')).toHaveText('Resume');
		await page.getByTestId('primary-action').click(); // Resume
		await expect(page.getByTestId('primary-action')).toHaveText('Pause');
	});

	test('uploading a voice file persists in localStorage', async ({ page }) => {
		await gotoApp(page);
		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('sound-cues-mode').selectOption('voice');
		await page.getByTestId('voice-upload-inhale').click();
		await page.getByTestId('voice-file-input').setInputFiles({
			name: 'breathe-in.mp3',
			mimeType: 'audio/mpeg',
			buffer: Buffer.from([0xff, 0xfb, 0x90, 0x44])
		});
		await expect(page.getByTestId('voice-name-inhale')).toHaveText('breathe-in.mp3');
		const stored = await page.evaluate(() => localStorage.getItem('slowbreath:voiceInhaleName'));
		expect(stored).toBe('breathe-in.mp3');
	});

	test('clear removes the voice file from storage', async ({ page }) => {
		await gotoApp(page);
		// Pre-seed a voice file
		await page.evaluate(() => {
			localStorage.setItem('slowbreath:voiceHold', 'data:audio/wav;base64,UklGRg==');
			localStorage.setItem('slowbreath:voiceHoldName', 'hold.wav');
			localStorage.setItem('slowbreath:cuesMode', 'voice');
		});
		await page.reload();
		await page.locator('html[data-hydrated="true"]').waitFor();

		await page.getByTestId('sound-settings-button').click();
		await page.getByTestId('voice-clear-hold').click();

		const data = await page.evaluate(() => localStorage.getItem('slowbreath:voiceHold'));
		expect(data).toBeNull();
	});
});

test.describe('layout: Start button fits above the fold', () => {
	for (const [w, h] of [
		[1280, 720],
		[1366, 768],
		[375, 667],
		[390, 844]
	]) {
		test(`visible at ${w}x${h}`, async ({ browser }) => {
			const ctx = await browser.newContext({ viewport: { width: w, height: h } });
			const page = await ctx.newPage();
			await page.goto('/');
			await page.locator('html[data-hydrated="true"]').waitFor();
			const box = await page.getByTestId('primary-action').boundingBox();
			expect(box).not.toBeNull();
			expect(box!.y + box!.height).toBeLessThanOrEqual(h);
			await ctx.close();
		});
	}
});

test.describe('color scheme', () => {
	test('applies dark variant class when prefers-color-scheme is dark', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await gotoApp(page);
		await expect(page.locator('main')).toHaveClass(/dark:from-slate-950/);
	});

	test('applies light classes when prefers-color-scheme is light', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await gotoApp(page);
		await expect(page.locator('main')).toHaveClass(/from-slate-50/);
	});
});
