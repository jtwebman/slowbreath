import { test } from '@playwright/test';

test.use({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark' });

test('og image', async ({ page }) => {
	await page.addInitScript(() => {
		window.localStorage.setItem('slowbreath:pacerStyle', 'glow');
	});
	// No ?dev=1 so the DEV badge stays hidden
	await page.goto('/');
	await page.locator('html[data-hydrated="true"]').waitFor();
	await page.waitForTimeout(400);
	await page.screenshot({ path: 'static/og-image.png' });
});
