// Live 404 check on aem.page: requests every unique internal link target found in migrated content
// (incl. nav/footer), follows redirects, and reports anything whose final status is not 2xx.
// usage: node live-link-check.mjs [base]  -> migration-work/live-link-check.json
import fs from 'fs';
import path from 'path';

const BASE = process.argv[2] || 'https://main--da-alc-oc14--blefebvre.aem.page';
const shells = new Set(fs.existsSync('tools/importer/data/empty-shells.txt')
  ? fs.readFileSync('tools/importer/data/empty-shells.txt', 'utf8').split('\n').filter(Boolean) : []);
const walk = (d, o = []) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'images') walk(p, o); } else if (e.name.endsWith('.plain.html')) o.push(p);
  });
  return o;
};
const targets = new Map();
walk('content').forEach((f) => {
  const doc = path.relative('content', f).replace(/\.plain\.html$/, '');
  if (doc === 'en' || shells.has(doc)) return;
  [...fs.readFileSync(f, 'utf8').matchAll(/href="([^"]+)"/g)].forEach(([, raw]) => {
    const href = raw.replace(/&amp;/g, '&');
    if (!href.startsWith('/') || href.startsWith('//')) return;
    const p = href.split('#')[0] || '/';
    if (!targets.has(p)) targets.set(p, doc);
  });
});
// pages themselves must also resolve
walk('content').forEach((f) => {
  const doc = path.relative('content', f).replace(/\.plain\.html$/, '');
  if (doc === 'en' || shells.has(doc)) return;
  const p = doc === 'index' ? '/' : `/${doc}`;
  if (!targets.has(p)) targets.set(p, '(page)');
});

const list = [...targets.entries()];
const results = [];
let i = 0;
async function worker() {
  while (i < list.length) {
    const [p, ref] = list[i]; i += 1;
    let status = 0; let finalUrl = '';
    for (let attempt = 0; attempt < 3 && !status; attempt += 1) {
      try {
        const r = await fetch(`${BASE}${p}`, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } });
        status = r.status; finalUrl = r.url;
      } catch (e) { await new Promise((res) => { setTimeout(res, 1000); }); }
    }
    results.push({ path: p, ref, status, finalUrl });
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
const bad = results.filter((r) => r.status < 200 || r.status >= 300);
fs.writeFileSync('migration-work/live-link-check.json', JSON.stringify({ checked: results.length, bad }, null, 2));
console.log(`checked=${results.length} bad=${bad.length}`);
bad.slice(0, 30).forEach((b) => console.log(`${b.status} ${b.path} (from ${b.ref}) -> ${b.finalUrl}`));
