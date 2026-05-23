import { test } from '@playwright/test';

test.use({ viewport: { width: 900, height: 800 } });

const STYLES = ['glow', 'box', 'circle'] as const;

for (const scheme of ['light', 'dark'] as const) {
	for (const style of STYLES) {
		test(`${style} idle (${scheme})`, async ({ browser }) => {
			const ctx = await browser.newContext({
				colorScheme: scheme,
				viewport: { width: 900, height: 800 }
			});
			const page = await ctx.newPage();
			await page.addInitScript((s) => {
				window.localStorage.setItem('slowbreath:pacerStyle', s);
			}, style);
			await page.goto('/');
			await page.locator('html[data-hydrated="true"]').waitFor();
			await page.waitForTimeout(400);
			await page.screenshot({ path: `screenshots/${style}-idle-${scheme}.png` });
			await ctx.close();
		});

		test(`${style} mid-inhale (${scheme})`, async ({ browser }) => {
			const ctx = await browser.newContext({
				colorScheme: scheme,
				viewport: { width: 900, height: 800 }
			});
			const page = await ctx.newPage();
			await page.addInitScript((s) => {
				window.localStorage.setItem('slowbreath:pacerStyle', s);
			}, style);
			await page.goto('/?dev=1');
			await page.locator('html[data-hydrated="true"]').waitFor();
			await page.getByTestId('primary-action').click();
			await page.locator('[data-testid="phase-label"]').waitFor();
			await page.waitForTimeout(200);
			await page.screenshot({ path: `screenshots/${style}-breathing-${scheme}.png` });
			await ctx.close();
		});
	}
}
