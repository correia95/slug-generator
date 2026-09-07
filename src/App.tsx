import { useEffect, useMemo, useState } from 'react';
import { DEFAULTS, Options, slugify, slugifyLines } from './slug';

const LS = 'slug-generator:opts';

function readOpts(): Options {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}
function readText(): string {
  try {
    const p = new URLSearchParams(window.location.search).get('t');
    if (p) return decodeURIComponent(escape(atob(p.replace(/-/g, '+').replace(/_/g, '/'))));
  } catch {
    /* ignore */
  }
  return 'My First Blog Post: 10 Things I Learned';
}

export default function App() {
  const [text, setText] = useState(readText);
  const [opts, setOpts] = useState<Options>(readOpts);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(opts));
    } catch {
      /* ignore */
    }
  }, [opts]);

  const lines = useMemo(() => text.split('\n').filter((l) => l.trim()), [text]);
  const multi = lines.length > 1;

  const single = useMemo(() => (lines[0] ? slugify(lines[0], opts) : ''), [lines, opts]);
  const batch = useMemo(() => (multi ? slugifyLines(text, opts) : []), [text, opts, multi]);

  const copy = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  const shareLink = async () => {
    try {
      const b64 = btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_');
      const u = new URL(window.location.href);
      u.search = '';
      u.searchParams.set('t', b64);
      if (u.toString().length > 8000) return;
      await navigator.clipboard.writeText(u.toString());
      setCopied('link');
      setTimeout(() => setCopied(null), 1400);
    } catch {
      /* ignore */
    }
  };

  const set = <K extends keyof Options>(k: K, v: Options[K]) => setOpts((o) => ({ ...o, [k]: v }));

  return (
    <div className="app">
      <header>
        <h1>URL Slug Generator</h1>
        <p className="tag">
          Turn a title into a clean URL slug — lowercase, hyphenated, accents flattened, punctuation
          removed. Paste several lines to slugify them all at once.
        </p>
      </header>

      <textarea
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder="Type or paste a title (or one per line)…"
        aria-label="Text to slugify"
      />

      <div className="opts">
        <label className="o">
          <span>Separator</span>
          <select value={opts.separator} onChange={(e) => set('separator', e.target.value as Options['separator'])}>
            <option value="-">hyphen -</option>
            <option value="_">underscore _</option>
            <option value=".">dot .</option>
          </select>
        </label>
        <label className="o">
          <span>Max length</span>
          <input type="text" inputMode="numeric" value={opts.maxLength || ''} placeholder="none"
            onChange={(e) => set('maxLength', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} />
        </label>
        <label className="chk"><input type="checkbox" checked={opts.lower} onChange={(e) => set('lower', e.target.checked)} /> lowercase</label>
        <label className="chk"><input type="checkbox" checked={opts.strict} onChange={(e) => set('strict', e.target.checked)} /> ASCII only</label>
        <label className="chk"><input type="checkbox" checked={opts.collapseStopwords} onChange={(e) => set('collapseStopwords', e.target.checked)} /> drop small words (a, the, of…)</label>
      </div>

      {multi ? (
        <div className="table">
          <div className="thead">
            <span>{batch.length} slugs</span>
            <button onClick={() => copy(batch.map((b) => b.slug).join('\n'), 'all')}>{copied === 'all' ? 'Copied' : 'Copy all'}</button>
          </div>
          {batch.map((b, i) => (
            <button key={i} className="trow" onClick={() => copy(b.slug, `r${i}`)}>
              <span className="src">{b.source}</span>
              <code>{b.slug || '—'}</code>
              <i>{copied === `r${i}` ? '✓' : ''}</i>
            </button>
          ))}
        </div>
      ) : (
        <div className="single">
          <code className="slug">{single || 'slug appears here'}</code>
          <div className="sacts">
            <button className="primary" onClick={() => copy(single, 'one')} disabled={!single}>
              {copied === 'one' ? 'Copied' : 'Copy slug'}
            </button>
            <span className="len">{single.length} chars</span>
          </div>
        </div>
      )}

      <button className="link" onClick={shareLink}>{copied === 'link' ? 'Link copied' : 'Copy a link to this'}</button>

      <section className="explainer">
        <h2>What makes a good slug</h2>
        <p>
          A slug is the human-readable part of a URL — the <code>my-first-post</code> in
          <code>/blog/my-first-post</code>. Keep it short, lowercase, and made of real words
          separated by hyphens. Hyphens, not underscores: search engines treat a hyphen as a word
          break and an underscore as a joiner, so <code>red-shoes</code> reads as two words and
          <code>red_shoes</code> as one.
        </p>
        <h3>What this does</h3>
        <p>
          Lowercases the text, converts accented letters to their plain form
          (<code>café</code> → <code>cafe</code>), turns a handful of symbols into words
          (<code>&amp;</code> → <code>and</code>, <code>%</code> → <code>percent</code>), removes
          everything else, and joins the words with your chosen separator. "ASCII only" drops
          non-Latin scripts entirely; turn it off to keep them. "Max length" trims to a whole word.
        </p>
        <h3>Should I drop small words?</h3>
        <p>
          Removing "a", "the", "of" and so on makes slugs tighter and is common practice, but it's
          optional here — sometimes a stop word carries meaning ("state of the art"). It won't strip
          them if that would leave the slug empty.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. It all runs in your browser. "Copy a link to this" packs the text into the URL for short inputs.</p>
        <footer>URL Slug Generator · no sign-up · works offline once loaded</footer>
      </section>
    </div>
  );
}
