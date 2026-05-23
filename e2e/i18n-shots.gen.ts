import { test } from '@playwright/test';

test.use({ viewport: { width: 900, height: 800 } });

const LOCALES = ['ja', 'fr', 'es'] as const;

for (const locale of LOCALES) {
	test(`screenshot ${locale}`, async ({ browser }) => {
		const ctx = await browser.newContext({
			colorScheme: 'dark',
			viewport: { width: 900, height: 800 }
		});
		const page = await ctx.newPage();
		await page.goto(`/${locale}/`);
		await page.locator('html[data-hydrated="true"]').waitFor();
		await page.waitForTimeout(300);
		await page.screenshot({ path: `screenshots/locale-${locale}.png` });
		await ctx.close();
	});

	test(`screenshot why ${locale}`, async ({ browser }) => {
		const ctx = await browser.newContext({
			colorScheme: 'light',
			viewport: { width: 900, height: 1100 }
		});
		const page = await ctx.newPage();
		await page.goto(`/${locale}/why`);
		await page.locator('html[data-hydrated="true"]').waitFor();
		await page.waitForTimeout(300);
		await page.screenshot({ path: `screenshots/why-${locale}.png`, fullPage: true });
		await ctx.close();
	});
}
