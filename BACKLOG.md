# SlowBreath — Backlog

Tracking the build. Roughly v1 (ship-able), v2 (next), v3 (after traction), deploy + video at the end as instructed.

## v1 — Ship-able MVP (almost done)

- [x] Scaffold (SvelteKit + Svelte 5 runes + TypeScript + Tailwind v4 + Cloudflare Workers adapter)
- [x] Paraglide v2 with 13 locales (en base + 12 others, URL strategy, same as OnYourFeet)
- [x] Theme toggle (System / Light / Dark) — reused from OnYourFeet
- [x] Language switcher — reused from OnYourFeet
- [x] GitHub link in top-right control cluster (on every page)
- [x] Dark/light mode CSS (class-based custom variant, same pattern as OnYourFeet)
- [x] Hooks for Paraglide URL/locale routing
- [x] CI + release GitHub Actions workflows (copied from OnYourFeet)
- [x] **Breath state machine** (`src/lib/breath.svelte.ts`) — Svelte 5 store, phase machine on requestAnimationFrame, module-level singleton so it survives SvelteKit page navigation (verified by Playwright test)
- [x] **Pacer visualizations — three styles, user-switchable:**
  - [x] `PacerGlow.svelte` — vanilla WebGL2 + fragment shader. Soft radial-bloom orb with subtle noise drift. Default.
  - [x] `PacerBoxTrace.svelte` — SVG. Glowing dot traces a rounded square, one side per phase.
  - [x] `PacerCircle.svelte` — pure CSS. Radial-gradient orb + halo. Lightweight fallback.
- [x] Pacer style picker (`PacerStyleToggle.svelte` + `ui.svelte.ts` store) — cycles through styles, persists in localStorage
- [x] Main page — pacer as hero, Start/Pause/Stop, phase label, cycles counter, total time, idle hint
- [x] Why page — Russo 2017, Schein 2001, Balban/Spiegel 2023 honestly framed, with PubMed links
- [x] English message file
- [x] **All 12 non-English locale files translated** by translation agent (es, pt, fr, de, it, nl, pl, ru, ja, ko, zh, hi)
- [x] i18n parity typecheck file (`src/lib/i18n-typecheck.ts`)
- [x] Static assets — `robots.txt` (with AI-bot allows), `sitemap.xml` (26 URLs with hreflang), `llms.txt`
- [x] **23 Playwright tests** covering idle, breath cycle in dev mode, pause/resume/stop, navigation persistence, pacer style toggle, theme toggle, language switcher, GitHub link, why page, locale routing, color scheme
- [x] Dev mode (`?dev=1`) — phases scaled to ~300 ms so tests can exercise the loop in seconds
- [x] AGPL-3.0 LICENSE file
- [x] README with stack, develop instructions, deploy notes

## v1 — Still to do before first release

- [ ] **og-image.png** — generate a 1200×630 hero shot from the Glow pacer for social previews
- [ ] **favicon** — currently the Svelte default; needs a Slow Breath mark (something simple — maybe a small breathing-orb glyph)
- [ ] **Git init + push to GitHub** as `jtwebman/slowbreath`
- [ ] **Sounds — optional for v1, was promised:**
  - [ ] Phase cue (soft Web Audio tone at each phase change), toggle on/off in a popover
  - [ ] One ambient loop to start (brown noise or generated drone) — single dropdown, single volume slider
  - [ ] Architected so sounds keep playing even when navigated to /why (lives on the breath store, not in the page)

## v2 — Next batch

- [ ] Protocol picker: 4-4-4-4 (default), 4-7-8 (Andrew Weil's), 6 BPM resonance, custom
- [ ] URL-as-spec: `/4-4-4-4`, `/4-7-8`, `/6bpm`, `/custom?inhale=4&hold=7&exhale=8&hold=0` — shareable
- [ ] Wake-lock API (keep screen on during a session) — graceful fallback if denied
- [ ] More ambient loops — rain, forest, ocean, fireplace (royalty-free sources from freesound.org / pixabay)
- [ ] Voice cues — record "breathe in / hold / breathe out / hold"; user-selectable in sound popover

## v3 — After traction signals

- [ ] Cyclic sighing mode (Balban/Spiegel 2023) — physiological-sigh visual pattern
- [ ] Session history (localStorage, no signup) — daily streak count, total minutes
- [ ] PWA install option (only if real demand — jtwebman has rejected PWA-as-app framing before)

## Deferred to the end (per the original ask)

- [ ] Custom domain wiring (slowbreath.app → Cloudflare Worker)
- [ ] Cloudflare API token + GitHub secret for the release workflow
- [ ] Production deploy + smoke test
- [ ] **YouTube video pipeline:** Playwright captures one full breath cycle of the canonical 4-4-4-4 visual at 1080p (probably the Glow shader), FFmpeg `-stream_loop`s it to 4-hour and 12-hour renders with a quiet resonance audio track. Description links back to the web app.

## Out of scope

- Accounts / cloud sync — no, by design.
- Heart-rate sensor integration without explicit demand — too much surface for v1.
- Real-time stress score from a webcam (HRV via PPG) — interesting but research is shaky.
- Multi-tab live sync — no.
