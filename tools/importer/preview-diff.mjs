// Lists content pages whose aem.page preview is missing or differs from the local .plain.html
// (compares visible text + link targets; DA's markup normalisation is ignored).
// usage: node preview-diff.mjs <out-paths-file> [base]
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2];
const BASE = process.argv[3] || 'https://main--da-alc-oc14--blefebvre.aem.page';
const shells = new Set(fs.readFileSync('tools/importer/data/empty-shells.txt', 'utf8').split('\n').filter(Boolean));
const walk = (d, o = []) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'images') walk(p, o); } else if (e.name.endsWith('.plain.html')) o.push(p);
  });
  return o;
};
const docs = walk('content').map((f) => path.relative('content', f).replace(/\.plain\.html$/, ''))
  .filter((d) => d !== 'en' && !shells.has(d) && !d.startsWith('library/'));

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
  .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in NAMED ? NAMED[n.toLowerCase()] : m));
// aem.page consumes the Metadata / Section Metadata blocks, so drop them before comparing
const dropBlocks = (html) => {
  let out = html;
  ['metadata', 'section-metadata'].forEach((name) => {
    let at = out.indexOf(`<div class="${name}">`);
    while (at >= 0) {
      const re = /<\/?div\b[^>]*>/g;
      re.lastIndex = at;
      let depth = 0; let end = -1; let m;
      while ((m = re.exec(out))) {
        depth += m[0][1] === '/' ? -1 : 1;
        if (depth === 0) { end = re.lastIndex; break; }
      }
      if (end < 0) break;
      out = out.slice(0, at) + out.slice(end);
      at = out.indexOf(`<div class="${name}">`);
    }
  });
  return out;
};
const sig = (raw) => {
  const html = dropBlocks(raw);
  const text = decode(html.replace(/<[^>]+>/g, ' ')).replace(/[\s ]+/g, '');
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => decode(m[1])).sort().join('|');
  return `${text}\n${links}`;
};

const todo = [];
let i = 0;
async function worker() {
  while (i < docs.length) {
    const d = docs[i]; i += 1;
    const local = sig(fs.readFileSync(`content/${d}.plain.html`, 'utf8'));
    let remote = null;
    for (let a = 0; a < 3 && remote === null; a += 1) {
      try {
        const r = await fetch(`${BASE}/${d}.plain.html`, { redirect: 'manual' });
        if (r.status === 200) remote = sig(await r.text());
        else if (r.status === 404 || (r.status >= 300 && r.status < 400)) remote = '';
        else await new Promise((res) => { setTimeout(res, 1500); });
      } catch (e) { await new Promise((res) => { setTimeout(res, 1500); }); }
    }
    if (remote !== local) todo.push({ d, why: remote ? 'differs' : 'missing' });
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
fs.writeFileSync(OUT, todo.map((t) => t.d).sort().join('\n') + (todo.length ? '\n' : ''));
const missing = todo.filter((t) => t.why === 'missing').length;
console.log(`checked=${docs.length} missing=${missing} differs=${todo.length - missing}`);
todo.slice(0, 15).forEach((t) => console.log(t.why, t.d));
