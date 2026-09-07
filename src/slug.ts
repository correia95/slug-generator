// URL-slug generation. Transliterates accents, strips punctuation, joins words.

export interface Options {
  separator: '-' | '_' | '.';
  lower: boolean;
  strict: boolean; // strict: a-z0-9 + separator only. non-strict keeps unicode letters.
  maxLength: number; // 0 = no limit
  collapseStopwords: boolean;
}

export const DEFAULTS: Options = {
  separator: '-',
  lower: true,
  strict: true,
  maxLength: 60,
  collapseStopwords: false,
};

const STOPWORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'is', 'of', 'on', 'or', 'the', 'to', 'with',
]);

// common symbol -> word so "$" doesn't just vanish
const SYMBOLS: Record<string, string> = {
  '&': ' and ',
  '@': ' at ',
  '%': ' percent ',
  '+': ' plus ',
  '=': ' equals ',
  $: ' dollar ',
  '€': ' euro ',
  '£': ' pound ',
  '#': ' number ',
};

export function slugify(input: string, opts: Options = DEFAULTS): string {
  let s = input.normalize('NFKD');

  // expand a few symbols to words
  s = s.replace(/[&@%+=$€£#]/g, (m) => SYMBOLS[m] || ' ');

  // strip diacritics
  s = s.replace(/[̀-ͯ]/g, '');

  // some letters NFKD doesn't split
  s = s
    .replace(/[øØ]/g, 'o')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[þÞ]/g, 'th')
    .replace(/[ßẞ]/g, 'ss')
    .replace(/[œŒ]/g, 'oe')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[łŁ]/g, 'l');

  if (opts.lower) s = s.toLowerCase();

  if (opts.strict) {
    s = s.replace(/[^a-zA-Z0-9]+/g, ' ');
  } else {
    // keep unicode letters and numbers, drop the rest
    s = s.replace(/[^\p{L}\p{N}]+/gu, ' ');
  }

  let words = s.trim().split(/\s+/).filter(Boolean);

  if (opts.collapseStopwords) {
    const kept = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
    if (kept.length) words = kept;
  }

  let slug = words.join(opts.separator);

  if (opts.maxLength > 0 && slug.length > opts.maxLength) {
    slug = slug.slice(0, opts.maxLength);
    // don't end on a partial word
    const cut = slug.lastIndexOf(opts.separator);
    if (cut > opts.maxLength * 0.5) slug = slug.slice(0, cut);
    slug = slug.replace(new RegExp(`\\${opts.separator}+$`), '');
  }

  return slug;
}

// slug for each line of a multi-line input
export function slugifyLines(input: string, opts: Options): { source: string; slug: string }[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ source: line, slug: slugify(line, opts) }));
}
