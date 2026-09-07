# slug-generator

Turn a title into a clean URL slug: lowercase, hyphenated, accents flattened
(`café` → `cafe`, `Łódź` → `lodz`), a few symbols spelled out (`&` → `and`,
`%` → `percent`), everything else stripped. Options: separator (- _ .), max
length (trims to a whole word), keep-case, ASCII-only, drop stop words. Paste
multiple lines for a bulk table with Copy all.

**Live:** https://slug-generator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Engine

[`src/slug.ts`](src/slug.ts): `slugify(text, options)` — NFKD normalise, expand
symbols, strip diacritics, transliterate ø/ð/þ/ß/œ/æ/ł (both cases), lowercase,
reduce to `a-z0-9` (strict) or unicode letters/numbers (loose), join, trim to a
whole word. `slugifyLines` for bulk.

Verified in Node: `Crème brûlée & café — déjà vu` → `creme-brulee-and-cafe-deja-vu`;
`Æther, Øystein and Þór` → `aether-oystein-and-thor`; symbol expansion; stop-word
drop; max-length whole-word trim; non-Latin kept only in loose mode.

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```
