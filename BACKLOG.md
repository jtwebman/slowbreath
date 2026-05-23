# SlowBreath — Backlog

Status as of v1.0.0 release.

## ✅ Shipped in v1.0.0

- Scaffold (SvelteKit + Svelte 5 runes + TypeScript + Tailwind v4 + Cloudflare Workers adapter)
- Paraglide v2 with 13 locales (en base + 12 fully translated)
- Theme toggle (System / Light / Dark)
- Language switcher with cookie + URL + Accept-Language strategy
- GitHub link in top-right control cluster (every page)
- Dark/light mode CSS with class-based custom variant + no-flash inline script
- Hooks for Paraglide URL/locale routing
- CI + release GitHub Actions workflows (deploy via release on Cloudflare Workers)
- **Breath state machine** (`src/lib/breath.svelte.ts`) — module-level Svelte 5 store on rAF, survives SvelteKit navigation
- **Three pacer visualizations:**
  - **Glow** — vanilla WebGL2 fragment shader (default; soft bloom orb with noise drift)
  - **Box trace** — SVG, **shape adapts to protocol**: square for Box, equilateral triangle for 4-7-8, horizontal line for 6 BPM
  - **Pulsing circle** — pure CSS fallback
- Pacer style picker, persists in localStorage
- Main page: pacer hero, Start/Pause/Stop, phase label, cycles counter, total time, idle hint
- **Three breathing protocols** with picker under the title: Box (4-4-4-4), Relaxing (4-7-8), Resonance 5-5 / 6 BPM
- **Session length picker** above Start: 5/10/15 min + No limit; auto-stops at limit
- Why page with Russo 2017, Schein 2001, Balban/Spiegel 2023 (with PubMed links)
- Static assets: robots.txt (AI-bot allows), sitemap.xml (26 URLs with hreflang), llms.txt, ATTRIBUTION.md for audio
- **Sound system** (`src/lib/sounds.svelte.ts`):
  - Three cue modes: Soft tone (single sine), Distinct per phase (4 phase-specific pitches), My voice (uploaded per-phase audio)
  - Per-phase voice upload (Breathe in / Hold / Breathe out, 500 KB each)
  - Six ambient kinds: Brown / Pink / White noise (generated), Rain / Forest / Ocean (Pixabay-sourced, re-encoded to 4.2 MB total)
  - Ambient pauses with the breath (gain ramp, source keeps playing)
- AGPL-3.0 LICENSE
- 44+ Playwright tests covering all of the above
- Compile-time locale parity guard (`src/lib/i18n-typecheck.ts`)
- Layout fits at 720h, 768h, mobile portrait viewports (Start button always above the fold)
- Pinned Cloudflare account in wrangler.jsonc
- Custom domain `slowbreath.app` live via Cloudflare
- og-image.png + canonical/og/twitter meta tags

## v1.0.x bug fixes

- [x] Sound settings popover overflowed left on mobile viewports — fixed in fix/mobile-popover, now uses `fixed top-14 right-3 max-w-[calc(100vw-1.5rem)]`

## v2 candidates

- [ ] **URL-as-spec** for protocols (`/4-4-4-4`, `/4-7-8`, `/6bpm`, `/custom?inhale=4&hold=7&exhale=8&hold=0`) — shareable links to specific breath patterns
- [ ] **Wake-lock API** — keep the screen on during a session (with graceful fallback if denied)
- [ ] **Cyclic sighing mode** (Balban/Spiegel 2023) — physiological-sigh visual pattern: 2× short inhale → long exhale
- [ ] **Custom protocol input** — user-defined inhale/hold/exhale/hold durations
- [ ] More ambient loops as separate sources allow — fire, rain-without-thunder, white-pink mix, etc.
- [ ] **Pacer color customization** — palette picker (sky/emerald/violet/amber/etc.)

## v3 candidates — only if usage signals demand

- [ ] **Session history** in localStorage (no signup) — daily streak count, total minutes, longest session
- [ ] **Achievement / milestone notifications** — gentle "first 100 cycles" / "first hour" — but watch for cluttering the minimalism
- [ ] **PWA install** option (need to check jturner's "no PWA" rule from OnYourFeet — earlier discussion in OnYourFeet conversation history rejected PWA as positioning; verify before building)
- [ ] **Cross-tab sync** if user opens two tabs (Web BroadcastChannel) — probably not worth it
- [ ] Heart-rate variability sensor integration via Web Bluetooth — interesting but research is shaky and adoption is niche

## Out of scope

- Accounts / cloud sync — no, by design
- Real-time stress score from a webcam (HRV via PPG) — research not credible enough
- Subscription tier — no, by design

## Deferred infra

- [ ] **YouTube 12-hour video pipeline** — Playwright captures one full breath cycle of the Glow pacer at 1080p; FFmpeg `-stream_loop`s it to a 4-hour and 12-hour render with quiet audio. Original intent: SEO via YouTube ambient-music genre. Could also generate per-protocol variants (Box / 4-7-8 / 6 BPM).
- [ ] **Cisco Umbrella / OpenDNS re-categorization request** — submit slowbreath.app at <https://policies.opendns.com/category/uncategorized> so Cisco's threat intel stops false-positive-blocking it for corporate-network users. Usually clears in 1-3 days.
