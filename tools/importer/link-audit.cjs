// Audits every internal link in content/**/*.plain.html (incl. nav/footer).
// A link resolves if its path is a migrated page (content file) or a redirects-sheet source.
// usage: node link-audit.cjs [redirects.json]  -> writes migration-work/link-audit.json
const fs = require('fs');
const path = require('path');

const redirectsFile = process.argv[2] || 'tools/importer/redirects.json';
const redirects = new Map(JSON.parse(fs.readFileSync(redirectsFile, 'utf8')).data.map((r) => [r.Source, r.Destination]));
const shells = new Set(fs.existsSync('migration-work/empty-shells.txt')
  ? fs.readFileSync('migration-work/empty-shells.txt', 'utf8').split('\n').filter(Boolean) : []);

const walk = (d, o = []) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'images') walk(p, o); } else if (e.name.endsWith('.plain.html')) o.push(p);
  });
  return o;
};
const files = walk('content');
const pages = new Set(files.map((f) => `/${path.relative('content', f).replace(/\.plain\.html$/, '')}`)
  .map((p) => (p === '/index' ? '/' : p)).filter((p) => p !== '/en' && !shells.has(p.slice(1))));

const links = new Map(); // path -> [referring docs]
files.forEach((f) => {
  const doc = `/${path.relative('content', f).replace(/\.plain\.html$/, '')}`;
  if (shells.has(doc.slice(1)) || doc === '/en') return;
  const html = fs.readFileSync(f, 'utf8');
  [...html.matchAll(/href="([^"]+)"/g)].forEach(([, raw]) => {
    const href = raw.replace(/&amp;/g, '&');
    if (!href.startsWith('/') || href.startsWith('//')) return;
    const p = decodeURIComponent(href.split(/[?#]/)[0]).replace(/\/$/, '') || '/';
    if (!links.has(p)) links.set(p, new Set());
    links.get(p).add(doc);
  });
});

const broken = [];
let ok = 0; let viaRedirect = 0;
links.forEach((refs, p) => {
  if (pages.has(p)) ok += 1;
  else if (redirects.has(p)) viaRedirect += 1;
  else broken.push({ path: p, refs: refs.size, example: [...refs][0] });
});
broken.sort((a, b) => b.refs - a.refs);
fs.writeFileSync('migration-work/link-audit.json', JSON.stringify({ pages: pages.size, uniqueLinks: links.size, ok, viaRedirect, broken }, null, 2));
console.log(`pages=${pages.size} uniqueLinks=${links.size} ok=${ok} viaRedirect=${viaRedirect} broken=${broken.length}`);
broken.slice(0, 25).forEach((b) => console.log(`${String(b.refs).padStart(5)}  ${b.path}   (e.g. ${b.example})`));
