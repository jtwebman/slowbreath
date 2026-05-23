# Slow Breath

A simple, full-screen pacer for slow breathing — 4-4-4-4 box breathing by default. Backed by research on blood pressure, anxiety, and focus. No accounts, no tracking, no upsell.

**Live (once deployed):** <https://slowbreath.app>

## Why this exists

There's real evidence that slow paced breathing — anywhere from about 3 to 6 breaths per minute — lowers blood pressure and reduces anxiety. The peer-reviewed shape of it:

- **Russo MA et al. (2017, _Breathe_)** — physiological-effects review summarising the slow-breathing literature. <https://pubmed.ncbi.nlm.nih.gov/29209423/>
- **Schein MH et al. (2001, _Journal of Human Hypertension_)** — randomized device-paced breathing trial showing systolic and diastolic BP reduction. <https://pubmed.ncbi.nlm.nih.gov/11319675/>
- **Balban MY, Spiegel D et al. (2023, _Cell Reports Medicine_)** — Stanford RCT comparing four breathing protocols against mindfulness; cyclic sighing won for anxiety but box breathing also worked. <https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(22)00474-8>

Most "calm" apps are subscription mazes that don't operationalize any specific protocol well. Slow Breath does one thing.

## Stack

- [SvelteKit](https://svelte.dev/) (Svelte 5 runes) + TypeScript
- [Tailwind v4](https://tailwindcss.com/) with class-based dark mode
- [Paraglide v2](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) for i18n (13 languages)
- [Cloudflare Workers](https://workers.cloudflare.com/) via `@sveltejs/adapter-cloudflare`
- [Playwright](https://playwright.dev/) for end-to-end tests
- Vanilla WebGL2 fragment shader for the default "Glow" pacer (with SVG and CSS fallbacks)

## Three pacer styles

Click the small pacer icon in the top-right to cycle:

- **Glow** — WebGL2 fragment shader. Soft radial bloom that expands and contracts with the breath. Default on capable devices.
- **Box trace** — SVG. A glowing dot traces the perimeter of a rounded square, one side per phase. Literal to "box breathing" — the way many people already visualize it.
- **Pulsing circle** — Pure CSS. Lightweight fallback / minimal aesthetic.

Selection persists in `localStorage`.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run test:e2e     # full Playwright suite (23 tests)
npm run check        # typecheck + paraglide compile + svelte-check
npm run build        # production build
```

**Dev mode** — append `?dev=1` to scale every phase down to ~300 ms so the full cycle takes about a second. Used by the Playwright suite to exercise the breath loop in real-time.

## Internationalization

Supported locales: `en` (base), `es`, `pt`, `fr`, `de`, `it`, `nl`, `pl`, `ru`, `ja`, `ko`, `zh`, `hi`.

URL strategy: every route lives at `/<locale>/...`. Visiting `/` redirects to the locale matched by your `Accept-Language` header, with manual override via the language picker.

A TypeScript compile-time check (`src/lib/i18n-typecheck.ts`) ensures every non-English locale has every key in `en.json`. Missing keys fail `npm run check` and block CI before merge.

The 12 non-English files were initially machine-generated. **Native-speaker PRs are very welcome** — especially for the medical-research prose on the Why page.

## Tests

23 Playwright tests covering: idle state, breath cycle progression in dev mode, pause/resume/stop, navigation persistence (the breath store keeps running on `/why`), pacer style toggle, theme toggle, language switcher, GitHub link, Why page rendering, locale routing, and color-scheme classes.

`e2e/screenshot.gen.ts` is a one-off generator that captures images per pacer × theme — excluded from the regular test run.

## Deploying (deferred to the end per the project's BACKLOG)

The release workflow at `.github/workflows/release.yml` triggers on a published GitHub release, runs the full suite, then deploys to Cloudflare Workers via `cloudflare/wrangler-action@v3`. Requires:

- A `CLOUDFLARE_API_TOKEN` repo secret with `Workers Scripts: Edit` + `Workers Routes: Edit`.
- The `account_id` field in `wrangler.jsonc` set to your Cloudflare account.

To deploy your own copy:

1. Replace `account_id` with yours.
2. Pick a unique Worker name in `wrangler.jsonc`.
3. `npm run build && npx wrangler deploy`.

## Companion project

Slow Breath is a sibling to **OnYourFeet** (<https://onyourfeet.app>, [source](https://github.com/jtwebman/onyourfeet)) — a stand-up reminder for desk workers. Both follow the same recipe: a single evidence-backed practice, a minimal UI, transparent citations, AGPL source.

## License

[AGPL-3.0-or-later](./LICENSE).

If you modify the code and run it as a network service that other people use, you must publish your modifications under the same license. Personal use of the public site at `slowbreath.app` doesn't require anything from you.
