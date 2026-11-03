// Audits links in migrated content that leave the site for www.alc.ca, plus internal links that only
// resolve through a redirect to alc.ca. Classifies each by what it would take to keep it on-site.
// usage: node alc-link-audit.cjs  -> migration-work/alc-link-audit.json
const fs = require('fs');
const path = require('path');

const seg = (s) => decodeURIComponent(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const toDoc = (pathname) => {
  const p = pathname.replace(/^\/content\/alc/, '').replace(/\/$/, '').replace(/\.html?$/, '');
  if (p === '' || p === '/en') return '/';
  return `/${p.split('/').filter(Boolean).map(seg).join('/')}`;
};
const src = fs.readFileSync('tools/importer/transformers/alc-cleanup.js', 'utf8');
const m = src.match(/const APP_SCREEN_RE = new RegExp\(\[([\s\S]*?)\]\.join/);
// eslint-disable-next-line no-eval
const APP = new RegExp(eval(`[${m[1]}]`).join(''));
const redirects = new Map(JSON.parse(fs.readFileSync('tools/importer/redirects.json', 'utf8')).data.map((r) => [r.Source, r.Destination]));
const shells = new Set(fs.readFileSync('tools/importer/data/empty-shells.txt', 'utf8').split('\n').filter(Boolean).map((s) => `/${s}`));
const sitemap = new Set(JSON.parse(fs.readFileSync('tools/importer/data/urls-all.json', 'utf8'))['analysis-urls-all'].urls
  .map((u) => toDoc(new URL(u.url).pathname)));

const walk = (d, o = []) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'images') walk(p, o); } else if (e.name.endsWith('.plain.html')) o.push(p);
  });
  return o;
};
const files = walk('content');
const docOf = (f) => { const d = `/${path.relative('content', f).replace(/\.plain\.html$/, '')}`; return d === '/index' ? '/' : d; };
const imported = new Set(files.map(docOf).filter((d) => d !== '/en' && !shells.has(d)));

const buckets = {}; // kind -> Map(target -> {refs:Set, example})
const note = (kind, target, ref) => {
  buckets[kind] = buckets[kind] || new Map();
  if (!buckets[kind].has(target)) buckets[kind].set(target, { refs: new Set() });
  buckets[kind].get(target).refs.add(ref);
};
files.forEach((f) => {
  const doc = docOf(f);
  if (doc === '/en' || shells.has(doc)) return;
  [...fs.readFileSync(f, 'utf8').matchAll(/href="([^"]+)"/g)].forEach(([, raw]) => {
    const href = raw.replace(/&amp;/g, '&');
    let url;
    try { url = new URL(href, 'https://site.local'); } catch (e) { return; }
    const external = url.hostname !== 'site.local';
    if (external && !/(^|\.)alc\.ca$/.test(url.hostname)) return; // other sites: out of scope
    if (external) {
      const p = url.pathname;
      if (p.startsWith('/content/dam/') || p.startsWith('/etc.clientlibs')) return note('asset (stays on alc.ca)', p, doc);
      if (/\/game\.html$/.test(p) || APP.test(p)) return note('app screen (stays on alc.ca)', p, doc);
      const d = toDoc(p);
      if (imported.has(d)) return note('ABSOLUTE alc.ca link to an IMPORTED page (fixable now)', `${p} -> ${d}`, doc);
      return note('absolute alc.ca link to a page NOT imported', p, doc);
    }
    const p = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
    if (imported.has(p)) return null; // good
    const dest = redirects.get(p) || '';
    if (/^https:\/\/www\.alc\.ca/.test(dest)) {
      if (APP.test(new URL(dest).pathname)) return note('app screen (stays on alc.ca)', p, doc);
      return note(sitemap.has(p) ? 'internal link -> page NOT imported yet (redirects to alc.ca)' : 'internal link -> not in sitemap (redirects to alc.ca / category)', p, doc);
    }
    if (dest) return null; // redirect to an internal page
    return note('internal link -> 404', p, doc);
  });
});

const out = {};
Object.entries(buckets).forEach(([kind, map]) => {
  out[kind] = [...map].map(([target, v]) => ({ target, refs: v.refs.size, example: [...v.refs][0] }))
    .sort((a, b) => b.refs - a.refs);
});
fs.writeFileSync('migration-work/alc-link-audit.json', JSON.stringify(out, null, 2));
Object.entries(out).forEach(([kind, list]) => {
  console.log(`\n## ${kind}: ${list.length} targets, ${list.reduce((s, x) => s + x.refs, 0)} referring pages`);
  list.slice(0, 12).forEach((x) => console.log(`  ${String(x.refs).padStart(4)}  ${x.target}  (e.g. ${x.example})`));
});
