// Builds the DA "redirects" sheet: old alc.ca paths (/content/alc/en|fr/...) -> migrated paths (/en|fr/...).
// usage: node build-redirects.cjs <out.json>
// Source URLs: tools/importer/data/urls-all.json (site catalog) + the alc.ca EN / FR sitemaps
// (data/urls-en-sitemap.txt, data/urls-fr-sitemap.txt).
const fs = require('fs');

const seg = (s) => decodeURIComponent(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const target = (pathname) => {
  const p = pathname.replace(/^\/content\/alc/, '').replace(/\/$/, '').replace(/\.html?$/, '');
  if (p === '' || p === '/en') return '/';
  if (p === '/fr') return '/fr/';
  return `/${p.split('/').filter(Boolean).map(seg).join('/')}`;
};

// Application screens stay on alc.ca (keep in sync with tools/importer/transformers/alc-cleanup.js)
const APP_SCREEN_RE = new RegExp([
  '^/content/alc/(?:en|fr)/(cart|checkout|confirmation|login|search-results|payment-authorization-failed',
  '|email-communications|interact-redirect|2chance-history-redirect|short-break-confirmation',
  '|long-break-confirmation)\\.html$',
  '|^/content/alc/(?:en|fr)/(long-term-return-to-play|short-term-return-to-play|registration|game-configurator|my-account)(/.*)?\\.html$',
  '|^/content/alc/(?:en|fr)/rewards/(existing-account-confirmation|join-rewards|points-details)\\.html$',
  '|^/content/alc/(?:en|fr)/play-online/(casino|instant-win-games)/game\\.html$',
  '|^/content/alc/(?:en|fr)/play-online/lottomax\\.html$',
  '|^/content/alc/(?:en|fr)/corporate/about-atlantic-lottery/contact-us/send-a-message\\.html$',
  '|^/content/alc/(?:en|fr)/referenced-content/',
].join(''));

const readList = (f) => (fs.existsSync(f)
  ? fs.readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean) : []);
const urls = [...new Set([
  ...JSON.parse(fs.readFileSync('tools/importer/data/urls-all.json', 'utf8'))['analysis-urls-all'].urls.map((u) => u.url),
  ...readList('tools/importer/data/urls-en-sitemap.txt'),
  ...readList('tools/importer/data/urls-fr-sitemap.txt'),
])];
// links already in migrated content (nav/footer and imported pages) that point at app screens
const extraAppPaths = ['en', 'fr'].flatMap((l) => [`/content/alc/${l}/referenced-content/external/help-redirect.html`,
  `/content/alc/${l}/cart.html`, `/content/alc/${l}/registration/register-account.html`]);
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
  .map((p) => (p === '/index' ? '/' : p)).map((p) => (p === '/fr/index' ? '/fr/' : p))
  .filter((p) => p !== '/en' && !shells.has(p)));
const EXTRA = 'tools/importer/data/link-extra-check.txt';
// category page for a game/ticket path, e.g. /en/play-online/casino/x -> casino landing on alc.ca
// (nearest migrated ancestor; the homepage when there is none)
const categoryOf = (p) => {
  const fr = p.startsWith('/fr/');
  const root = fr ? '/fr' : '/en';
  let parent = p.split('/').slice(0, -1).join('/');
  while (parent && parent !== root && !migrated.has(parent)) parent = parent.split('/').slice(0, -1).join('/');
  if (parent && parent !== root) return parent;
  return fr ? '/fr/' : '/';
};
let notMigrated = 0;
const rows = new Map();
const add = (source, destination) => { if (source !== destination && !rows.has(source)) rows.set(source, destination); };
add('/content/alc/en', '/');
add('/content/alc/en.html', '/');
add('/en', '/');
add('/content/alc/fr', '/fr/');
add('/content/alc/fr.html', '/fr/');
add('/fr', '/fr/');
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
// the same alc.ca redirects exist for the French pages
const toFr = (p) => (p === '/' ? '/fr/' : p.replace(/^\/en\//, '/fr/'));
Object.entries(SOURCE_REDIRECTS).forEach(([from, to]) => {
  if (!SOURCE_REDIRECTS[toFr(from)]) SOURCE_REDIRECTS[toFr(from)] = toFr(to);
});
// "<code> <final url> <requested url>" lines from checking alc.ca
const STATUS = ['tools/importer/data/unmigrated-status.txt', 'tools/importer/data/unmigrated-status-fr.txt']
  .flatMap(readList).map((l) => l.split(/\s+/));
const ALC_PAGE = /^https:\/\/www\.alc\.ca\/content\/alc\/(en|fr)[./]/;
STATUS.forEach(([code, to, from]) => {
  if (code !== '302' || !from || !ALC_PAGE.test(from) || !ALC_PAGE.test(to)) return;
  const f = target(new URL(from).pathname);
  if (!SOURCE_REDIRECTS[f] && !migrated.has(f)) SOURCE_REDIRECTS[f] = target(new URL(to).pathname);
});
// pages that are broken on alc.ca itself (404 / 500): send visitors to the nearest category page
STATUS.forEach(([code, url]) => {
  if (!/^(404|500)$/.test(code) || !ALC_PAGE.test(url || '')) return;
  const { pathname } = new URL(url);
  const dest = categoryOf(target(pathname));
  [target(pathname), pathname, pathname.replace(/\.html?$/, '')].forEach((s2) => add(s2, dest));
});
Object.entries(SOURCE_REDIRECTS).forEach(([from, to]) => {
  const alc = to === '/fr/' ? 'https://www.alc.ca/content/alc/fr.html' : `https://www.alc.ca/content/alc${to}.html`;
  const dest = (to === '/' || migrated.has(to)) ? to : alc;
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
