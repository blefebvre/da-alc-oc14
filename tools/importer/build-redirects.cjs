// Builds the DA "redirects" sheet: old alc.ca paths (/content/alc/en/...) -> migrated paths (/en/...).
// usage: node build-redirects.cjs <out.json>
// Source URLs come from tools/importer/data/urls-all.json (all discovered English pages).
const fs = require('fs');

const seg = (s) => decodeURIComponent(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const target = (pathname) => {
  const p = pathname.replace(/^\/content\/alc/, '').replace(/\/$/, '').replace(/\.html?$/, '');
  if (p === '' || p === '/en') return '/';
  return `/${p.split('/').filter(Boolean).map(seg).join('/')}`;
};

// Application screens stay on alc.ca (keep in sync with tools/importer/transformers/alc-cleanup.js)
const APP_SCREEN_RE = new RegExp([
  '^/content/alc/en/(cart|checkout|confirmation|login|search-results|payment-authorization-failed',
  '|email-communications|interact-redirect|2chance-history-redirect|short-break-confirmation',
  '|long-break-confirmation)\\.html$',
  '|^/content/alc/en/(long-term-return-to-play|short-term-return-to-play|registration|game-configurator|my-account)(/.*)?\\.html$',
  '|^/content/alc/en/rewards/(existing-account-confirmation|join-rewards|points-details)\\.html$',
  '|^/content/alc/en/play-online/(casino|instant-win-games)/game\\.html$',
  '|^/content/alc/en/play-online/lottomax\\.html$',
  '|^/content/alc/en/corporate/about-atlantic-lottery/contact-us/send-a-message\\.html$',
  '|^/content/alc/en/referenced-content/',
].join(''));

const urls = JSON.parse(fs.readFileSync('tools/importer/data/urls-all.json', 'utf8'))['analysis-urls-all'].urls.map((u) => u.url);
// links already in migrated content (nav/footer and imported pages) that point at app screens
const extraAppPaths = ['/content/alc/en/referenced-content/external/help-redirect.html', '/content/alc/en/cart.html',
  '/content/alc/en/registration/register-account.html'];
// migrated pages = content files (doc path with leading slash; index -> /)
const path = require('path');

const walk = (d, o = []) => {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'images') walk(p, o); } else if (e.name.endsWith('.plain.html')) o.push(p);
  });
  return o;
};
const shells = new Set((fs.existsSync('tools/importer/data/empty-shells.txt')
  ? fs.readFileSync('tools/importer/data/empty-shells.txt', 'utf8').split('\n').filter(Boolean) : []).map((s) => `/${s}`));
const migrated = new Set(walk('content').map((f) => `/${path.relative('content', f).replace(/\.plain\.html$/, '')}`)
  .map((p) => (p === '/index' ? '/' : p)).filter((p) => p !== '/en' && !shells.has(p)));
const EXTRA = 'tools/importer/data/link-extra-check.txt';
// category page for a game/ticket path, e.g. /en/play-online/casino/x -> casino landing on alc.ca
// (nearest migrated ancestor; the homepage when there is none)
const categoryOf = (p) => {
  let parent = p.split('/').slice(0, -1).join('/');
  while (parent && parent !== '/en' && !migrated.has(parent)) parent = parent.split('/').slice(0, -1).join('/');
  return parent && parent !== '/en' ? parent : '/';
};
let notMigrated = 0;
const rows = new Map();
const add = (source, destination) => { if (source !== destination && !rows.has(source)) rows.set(source, destination); };
add('/content/alc/en', '/');
add('/content/alc/en.html', '/');
add('/en', '/');
// French is out of scope for now: the language toggle goes to the live French site
add('/fr', 'https://www.alc.ca/content/alc/fr.html');
// pages that alc.ca itself redirects (302) to another page: mirror them on-site
const SOURCE_REDIRECTS = {
  '/en/play-online': '/',
  '/en/our-games': '/',
  '/en/play-online/lotto': '/en/play-online/lotto-games',
  '/en/our-games/casino': '/en/play-online/casino',
  '/en/our-games/instant-win-games': '/en/play-online/instant-win-games',
  '/en/our-games/mobile': '/en/our-games/app',
  '/en/play-online/app': '/en/our-games/app',
  '/en/corporate': '/en/corporate/about-atlantic-lottery',
  '/en/legal/privacy-policy': '/en/referenced/privacypolicy',
  '/en/legal/healthyplaypolicy': '/en/referenced/healthyplaypolicy',
  '/en/legal/HealthyPlayPolicy': '/en/referenced/healthyplaypolicy',
  '/en/our-games/contests-and-promotions': '/en/our-games/contests',
  '/en/play-online/subscriptions': '/en/our-games/lotto/subscription',
  // dead links in migrated content (404 on alc.ca too): closest live page
  '/en/our-games/app-old': '/en/our-games/app',
  '/en/corporate/about-atlantic-lottery/corporate-releases/2024-03-28': '/en/corporate/about-atlantic-lottery/corporate-releases',
  '/en/promos/coasters/coasters-grand-reopening': '/en/our-games/coasters',
  '/en/play-online/ibingo': '/en/our-games/lotto/salsa-bingo',
  '/en/promos/proline/proline-fall-multisport': '/en/promos/proline/fall-multisport',
  '/en/promos/funding': '/en/promos/funding2',
};
if (fs.existsSync('tools/importer/data/unmigrated-status.txt')) {
  // "<code> <final url> <requested url>" lines from checking alc.ca
  fs.readFileSync('tools/importer/data/unmigrated-status.txt', 'utf8').split('\n').filter(Boolean).forEach((l) => {
    const [code, to, from] = l.split(/\s+/);
    if (code !== '302' || !from || !/^https:\/\/www\.alc\.ca\/content\/alc\/en[./]/.test(from)) return;
    if (!/^https:\/\/www\.alc\.ca\/content\/alc\/en[./]/.test(to)) return;
    const f = target(new URL(from).pathname);
    if (!SOURCE_REDIRECTS[f] && !migrated.has(f)) SOURCE_REDIRECTS[f] = target(new URL(to).pathname);
  });
}
// pages that are broken on alc.ca itself (404 / 500): send visitors to the nearest category page
if (fs.existsSync('tools/importer/data/unmigrated-status.txt')) {
  fs.readFileSync('tools/importer/data/unmigrated-status.txt', 'utf8').split('\n').filter(Boolean).forEach((l) => {
    const [code, url] = l.split(/\s+/);
    if (!/^(404|500)$/.test(code) || !/^https:\/\/www\.alc\.ca\/content\/alc\/en\//.test(url || '')) return;
    const { pathname } = new URL(url);
    const dest = categoryOf(target(pathname));
    [target(pathname), pathname, pathname.replace(/\.html?$/, '')].forEach((s2) => add(s2, dest));
  });
}
Object.entries(SOURCE_REDIRECTS).forEach(([from, to]) => {
  const dest = (to === '/' || migrated.has(to)) ? to : `https://www.alc.ca/content/alc${to}.html`;
  const old = `/content/alc${from}`;
  [from, old, `${old}.html`].forEach((s) => add(s, dest));
});
let app = 0;
[...urls.map((u) => new URL(u).pathname), ...extraAppPaths].forEach((pathname) => {
  if (APP_SCREEN_RE.test(pathname)) {
    // both the old path and the path the migrated links use go to the live alc.ca screen
    const live = `https://www.alc.ca${pathname}`;
    add(target(pathname), live);
    add(pathname, live);
    add(pathname.replace(/\.html?$/, ''), live);
    app += 1;
    return;
  }
  const dest = target(pathname);
  // not migrated (yet), or an empty shell on alc.ca: send visitors to alc.ca / the category page.
  // NOTE: EDS applies redirects before content, so a page only stops redirecting once it is migrated
  // and this sheet is regenerated.
  let finalDest = dest;
  if (shells.has(dest)) finalDest = categoryOf(dest);
  else if (!migrated.has(dest)) { finalDest = `https://www.alc.ca${pathname}`; notMigrated += 1; }
  if (finalDest !== dest) add(dest, finalDest);
  add(pathname, finalDest);
  add(pathname.replace(/\.html?$/, ''), finalDest);
  // migrated links that kept the source casing (e.g. /en/legal/HealthyPlayPolicy)
  add(pathname.replace(/^\/content\/alc/, '').replace(/\.html?$/, ''), finalDest);
});

// links found in migrated content that are not in the sitemap (checked against alc.ca by
// link-extra-check.sh): live -> alc.ca page, dead -> category page
if (fs.existsSync(EXTRA)) {
  fs.readFileSync(EXTRA, 'utf8').split('\n').filter(Boolean).forEach((line) => {
    const [code, p] = line.split(' ');
    if (migrated.has(p) || rows.has(p)) return;
    add(p, code === '200' ? `https://www.alc.ca/content/alc${p}.html` : categoryOf(p));
  });
}
console.log(`app screens: ${app}, not yet migrated -> alc.ca: ${notMigrated}`);

const data = [...rows].map(([Source, Destination]) => ({ Source, Destination }));
const sheet = {
  total: data.length, limit: data.length, offset: 0, data, ':type': 'sheet', ':colWidths': [480, 360],
};
fs.writeFileSync(process.argv[2], JSON.stringify(sheet, null, 2));
console.log(`${data.length} redirects`, JSON.stringify(data.slice(0, 4)));
