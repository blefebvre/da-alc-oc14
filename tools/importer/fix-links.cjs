// Post-import link fixes over content/**/*.plain.html (incl. nav / footer):
//  - internal links whose target is a redirect to another on-site page -> link the final page directly
//  - links to app screens without a page here (e.g. /en/my-account/...) -> the alc.ca screen
//  - https://www.alc.ca/en/casino/<game>.html short game URLs -> the migrated game page
//  - https://www.alc.ca/ -> /, https://www.alc.ca/name@alc.ca -> mailto:
// usage: node fix-links.cjs [--dry]   (run after build-redirects.cjs)  -> prints changed files
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const redirects = new Map(JSON.parse(fs.readFileSync('tools/importer/redirects.json', 'utf8')).data
  .map((r) => [r.Source, r.Destination]));
const walk = (d, o = []) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'images') walk(p, o); } else if (e.name.endsWith('.plain.html')) o.push(p);
  });
  return o;
};
const files = walk('content');
const pages = new Set(files.map((f) => `/${path.relative('content', f).replace(/\.plain\.html$/, '')}`)
  .map((p) => (p === '/index' ? '/' : p)).map((p) => (p === '/fr/index' ? '/fr/' : p)));
const APP_ONLY = /^\/en\/my-account(\/|$)/;

const resolve = (p) => {
  // follow on-site redirect chains (max 5 hops)
  let cur = p;
  for (let i = 0; i < 5; i += 1) {
    const next = redirects.get(cur);
    if (!next || next === cur) break;
    cur = next;
    if (/^https?:/.test(cur)) break;
  }
  return cur;
};

const fix = (href, fromFr) => {
  const amp = href.replace(/&amp;/g, '&');
  let m = amp.match(/^https?:\/\/www\.alc\.ca\/([^/@?#]+@[a-z0-9.-]+)$/i);
  if (m) return `mailto:${m[1]}`;
  if (/^https?:\/\/www\.alc\.ca\/?$/i.test(amp)) return '/';
  m = amp.match(/^https?:\/\/www\.alc\.ca\/(en|fr)\/(casino|instant-win-games)\/([a-z0-9-]+)\.html$/i);
  if (m && m[3] !== 'game') {
    const p = `/${m[1]}/play-online/${m[2]}/${m[3].toLowerCase()}`;
    return pages.has(p) ? p : href;
  }
  // relative app-screen links on alc.ca (e.g. "mobile/fr/my-account/my-limits")
  m = amp.match(/^(?:mobile\/)?(en|fr)\/(my-account\/[^?#]*)(.*)$/);
  if (m) return `https://www.alc.ca/content/alc/${m[1]}/${m[2]}.html${m[3]}`.replace(/&/g, '&amp;');
  if (!amp.startsWith('/') || amp.startsWith('//')) return href;
  const [, p, rest] = amp.match(/^([^?#]*)(.*)$/);
  // French pages linking to an English page (alc.ca does this, e.g. the homepage mobile banner):
  // use the French page when it exists
  // (a bare "/" is the English toggle in the French nav: kept)
  if (fromFr && p.startsWith('/en/')) {
    const frPath = `/fr/${p.slice(4)}`;
    if (pages.has(frPath)) return fix(`${frPath}${rest}`.replace(/&/g, '&amp;'), fromFr);
  }
  // (empty-shell pages have a content file but redirect to their category page)
  if ((pages.has(p) && !redirects.has(p)) || p === '/') return href;
  // ".htm" links that the importer turned into a "-htm" segment
  if (/-html?$/.test(p) && pages.has(p.replace(/-html?$/, ''))) return `${p.replace(/-html?$/, '')}${rest}`;
  if (APP_ONLY.test(p)) return `https://www.alc.ca/content/alc${p}.html${rest}`;
  const dest = resolve(p);
  if (dest === p) return href;
  // internal destination: link it directly; alc.ca destinations stay internal (the sheet redirects them)
  // so a later migration of the page needs no content change
  if (dest.startsWith('/')) return `${dest}${rest}`.replace(/&/g, '&amp;');
  return href;
};

let changed = 0;
files.forEach((f) => {
  const src = fs.readFileSync(f, 'utf8');
  const fromFr = path.relative('content', f).startsWith('fr/');
  const out = src.replace(/href="([^"]+)"/g, (all, h) => {
    const n = fix(h, fromFr);
    return n === h ? all : `href="${n}"`;
  });
  if (out !== src) {
    changed += 1;
    const diff = [...src.matchAll(/href="([^"]+)"/g)].map((x) => x[1]).filter((h) => fix(h, fromFr) !== h);
    console.log(f, [...new Set(diff)].map((h) => `${h} -> ${fix(h, fromFr)}`).join(' | ').slice(0, 300));
    if (!DRY) fs.writeFileSync(f, out);
  }
});
console.log(`${DRY ? '[dry] ' : ''}files changed: ${changed}`);
