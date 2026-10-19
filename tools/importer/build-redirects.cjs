// Builds the DA "redirects" sheet: old alc.ca paths (/content/alc/en/...) -> migrated paths (/en/...).
// usage: node build-redirects.cjs <out.json>
// Source URLs come from catalog/urls-all.json (all discovered English pages).
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
  '|^/content/alc/en/(long-term-return-to-play|short-term-return-to-play|registration|game-configurator)(/.*)?\\.html$',
  '|^/content/alc/en/rewards/(existing-account-confirmation|join-rewards|points-details)\\.html$',
  '|^/content/alc/en/play-online/(casino|instant-win-games)/game\\.html$',
  '|^/content/alc/en/play-online/lottomax\\.html$',
  '|^/content/alc/en/corporate/about-atlantic-lottery/contact-us/send-a-message\\.html$',
  '|^/content/alc/en/referenced-content/',
].join(''));

const urls = JSON.parse(fs.readFileSync('catalog/urls-all.json', 'utf8'))['analysis-urls-all'].urls.map((u) => u.url);
// links already in migrated content (nav/footer and imported pages) that point at app screens
const extraAppPaths = ['/content/alc/en/referenced-content/external/help-redirect.html', '/content/alc/en/cart.html',
  '/content/alc/en/registration/register-account.html'];
const rows = new Map();
const add = (source, destination) => { if (source !== destination && !rows.has(source)) rows.set(source, destination); };
add('/content/alc/en', '/');
add('/content/alc/en.html', '/');
add('/en', '/');
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
  add(pathname, dest);
  add(pathname.replace(/\.html?$/, ''), dest);
  // migrated links that kept the source casing (e.g. /en/legal/HealthyPlayPolicy)
  add(pathname.replace(/^\/content\/alc/, '').replace(/\.html?$/, ''), dest);
});
console.log(`app screens: ${app}`);

const data = [...rows].map(([Source, Destination]) => ({ Source, Destination }));
const sheet = {
  total: data.length, limit: data.length, offset: 0, data, ':type': 'sheet', ':colWidths': [480, 360],
};
fs.writeFileSync(process.argv[2], JSON.stringify(sheet, null, 2));
console.log(`${data.length} redirects`, JSON.stringify(data.slice(0, 4)));
