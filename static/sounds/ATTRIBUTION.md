# Audio attribution

The three nature ambient loops shipped with Slow Breath were sourced from [Pixabay](https://pixabay.com/sound-effects/) under their royalty-free [Content License](https://pixabay.com/service/license-summary/), which permits use in commercial and non-commercial projects without attribution. Credit is provided here as good practice.

| File | Source on Pixabay | Original duration | Shipped duration | Encoding |
|---|---|---|---|---|
| `rain.mp3` | [Nature rain and distant thunder](https://pixabay.com/sound-effects/nature-rain-and-distant-thunder-60230/) | 34:16 | 3:00 (trimmed) | 96 kbps stereo MP3 |
| `forest.mp3` | [Nature wind, forest ambience, morning sound (mks0127)](https://pixabay.com/sound-effects/nature-wind-forest-ambienceb-morning-sound-mks0127-378540/) | 1:57 | 1:57 | 96 kbps stereo MP3 |
| `ocean.mp3` | [Nature ocean waves](https://pixabay.com/sound-effects/nature-ocean-waves-250310/) | 1:11 | 1:11 | 96 kbps stereo MP3 |

All three were re-encoded to 96 kbps stereo MP3 to reduce bandwidth (the rain track was 41 MB at 160 kbps and 34 minutes long — trimmed and re-encoded down to ~2 MB).

If you'd like to swap in your own ambient loops, drop a `<kind>.mp3` into this directory and add the kind to `AMBIENT_KINDS` + `AMBIENT_FILE_PATHS` in `src/lib/sounds.svelte.ts` and a label in `messages/en.json`.
