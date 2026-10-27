/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: alc.ca (AEM 6.5 "alc" site) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html unless noted.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const ORIGIN = 'https://www.alc.ca';
const ALC_HOSTS = ['www.alc.ca', 'alc.ca'];

// Make relative image URLs (/content/alc/..., /etc.clientlibs/...) absolute against www.alc.ca.
function absolutizeUrl(value) {
  if (!value) return value;
  const v = value.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function absolutizeSrcset(srcset) {
  return srcset
    .split(',')
    .map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      return [absolutizeUrl(url), ...rest].join(' ');
    })
    .join(', ');
}

function fixImages(element) {
  element.querySelectorAll('img[src], source[srcset], img[srcset]').forEach((el) => {
    const src = el.getAttribute('src');
    if (src && src.startsWith('/')) el.setAttribute('src', absolutizeUrl(src));
    const srcset = el.getAttribute('srcset');
    if (srcset) el.setAttribute('srcset', absolutizeSrcset(srcset));
  });
  // picturefill-background images (e.g. .html-promo banner):
  // <span data-media="(min-width: 320px)" data-src="/content/alc/.../imageM.img.jpg/...">
  element.querySelectorAll('[data-src]').forEach((el) => {
    const dataSrc = el.getAttribute('data-src');
    if (dataSrc && (dataSrc.startsWith('/') || dataSrc.startsWith('//'))) {
      el.setAttribute('data-src', absolutizeUrl(dataSrc));
    }
  });
  // style="background-image:url(/content/alc/...)"
  element.querySelectorAll('[style*="url"]').forEach((el) => {
    const style = el.getAttribute('style');
    const next = style.replace(/url\((['"]?)(\/[^'")]+)\1\)/g, (m, q, u) => `url(${q}${absolutizeUrl(u)}${q})`);
    if (next !== style) el.setAttribute('style', next);
  });
}

// Application screens (account, cart, checkout, ticket configurators, game launchers, search,
// responsible-gaming flows) need the alc.ca backend: they are not migrated and links point to alc.ca.
// Keep in sync with migration-work/scripts/build-redirects.cjs.
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
const isAppScreen = (path) => APP_SCREEN_RE.test(path);

// Internal alc.ca links: strip "/content/alc" prefix and ".html" suffix, drop itm_* / utm_* params.
// e.g. /content/alc/en/winning-numbers.html?itm_source=Homepage -> /en/winning-numbers
function rewriteLink(href) {
  if (!href) return href;
  const raw = href.trim();
  if (raw.startsWith('#') || /^(mailto|tel|javascript):/i.test(raw)) return href;

  let url;
  try {
    url = new URL(raw, ORIGIN);
  } catch (e) {
    return href;
  }
  const isRelative = raw.startsWith('/') && !raw.startsWith('//');
  if (!isRelative && !ALC_HOSTS.includes(url.hostname)) return href; // other domains untouched

  let path = url.pathname;
  // Assets (PDFs, images) and app pages stay on alc.ca: link to them absolutely.
  // App pages = game launchers (game.html?gameId=...) and anything outside /content/alc (e.g. /en/casino/game.html)
  const isAsset = path.startsWith('/content/dam/');
  const isGameLauncher = /\/game\.html$/.test(path) && url.searchParams.has('gameId');
  if (isAsset || isGameLauncher || isAppScreen(path) || !path.startsWith('/content/alc')) {
    if (path.startsWith('/etc.clientlibs')) return href;
    return `${ORIGIN}${path}${url.search}${url.hash || ''}`;
  }
  path = path.replace(/^\/content\/alc/, '') || '/';
  path = path.replace(/\.html$/, '');
  // English homepage is the site root
  if (path === '' || path === '/en' || path === '/en/') path = '/';
  // Match the importer's document paths (WebImporter.FileUtils.sanitizePath):
  // lowercase, strip accents, non-alphanumerics -> '-' per segment
  if (path !== '/') {
    path = path.split('/').map((seg) => {
      if (!seg) return seg;
      let s = seg;
      try { s = decodeURIComponent(s); } catch (e) { /* keep raw */ }
      return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }).join('/');
  }

  const params = new URLSearchParams(url.search);
  [...params.keys()].forEach((key) => {
    if (/^(itm_|utm_)/i.test(key)) params.delete(key);
  });
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}${url.hash || ''}`;
}

/* ------------------------------------------------------------------------------------------
 * Online game detail pages (template "online-game-detail": casino, instant-win, live casino).
 * Every rule below is guarded by isGameDetailPage() and only targets elements that exist on
 * game pages (verified in migration-work/cleaned.html and the instant-win / live variations).
 * ---------------------------------------------------------------------------------------- */

// Global chrome on detail pages (online game + ticket pages). These pages have no
// div.experiencefragment wrapper: the global header is
// <div role="banner"><div class="xfpage page basicpage">...<header>...</header> (plus the
// #loginFlow MFA modal) and the footer is a bare <footer class="main-footer">.
const DETAIL_PAGE_CHROME_SELECTORS = [
  '[role="banner"]',
  'div.xfpage',
  '#loginFlow',
  'header',
  // Header parts that sit outside <header> (siblings of .xfpage in the cleaned snapshot):
  // signed-in dashboard, top nav + off-canvas mobile nav, collapsible header promo.
  '.logged-in-info-wrapper',
  '.topnav',
  '#nav-mobile',
  '#collapsible-promo',
  'footer.main-footer',
  // Browser-upgrade modal (sibling of .common-modals on detail pages)
  '.modal-browser-check',
  // Site-wide alert/notification banners (<section data-bind="if: message"><div class="alert-area">)
  'section[data-bind="if: message"]',
  '.alert-area',
  '.notification.section',
  '.cmp-notification',
];

// Video lottery pages also carry a section.alc-game-details-header(--vlt), so they are
// excluded here and handled by cleanupVideoLotteryPage() instead.
function isGameDetailPage(root) {
  return !isVideoLotteryPage(root)
    && !!root.querySelector('section.alc-game-details-header, div.digital-instants-info-page');
}

function isVideoLotteryPage(root) {
  return !!root.querySelector('div.video-lottery-info-page');
}

// Extra page metadata to merge into the importer's Metadata block, keyed by <main>.
const PENDING_METADATA = new WeakMap();

// The import script calls WebImporter.rules.createMetadata(main, document) after the
// afterTransform hook, and getMetadata() only knows Title/Description/Image. The transformer
// contract has no metadata hook, so we wrap createMetadata (idempotent, per-<main> opt-in via
// PENDING_METADATA) to merge our extra keys into the single Metadata block. Pages that never
// register extras (e.g. the homepage) go through the original function untouched.
function registerPageMetadata(main, extra) {
  const rules = WebImporter && WebImporter.rules;
  if (!rules || typeof rules.createMetadata !== 'function') return;
  if (!rules.createMetadata.alcMetadataWrapped) {
    const original = rules.createMetadata;
    const wrapped = function createMetadataWithExtras(m, doc) {
      const extras = PENDING_METADATA.get(m);
      if (!extras) return original.call(this, m, doc);
      PENDING_METADATA.delete(m);
      const base = (WebImporter.Blocks && typeof WebImporter.Blocks.getMetadata === 'function')
        ? WebImporter.Blocks.getMetadata(doc) : {};
      const meta = { ...base, ...extras };
      m.append(WebImporter.Blocks.createBlock(doc, { name: 'Metadata', cells: meta }));
      return meta;
    };
    wrapped.alcMetadataWrapped = true;
    try {
      rules.createMetadata = wrapped;
    } catch (e) {
      return; // rules object not writable: skip silently rather than emit a 2nd Metadata block
    }
  }
  PENDING_METADATA.set(main, { ...(PENDING_METADATA.get(main) || {}), ...extra });
}

function removeSdiComments(root) {
  const walker = root.ownerDocument.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) {
    if (/SDI include/i.test(walker.currentNode.nodeValue || '')) comments.push(walker.currentNode);
  }
  comments.forEach((c) => c.remove());
}

function renameTag(el, tagName) {
  const next = el.ownerDocument.createElement(tagName);
  next.append(...el.childNodes);
  el.replaceWith(next);
  return next;
}

function cleanupGameDetailPage(element) {
  const doc = element.ownerDocument;

  // Hand-off for the hero-game parser: #gameUnavailable carries data-game-lobby-url /
  // data-gameID / data-game-type (used for the live-casino "Browse Games" link). Copy them onto
  // the header section before the hidden message is removed.
  const header = element.querySelector('section.alc-game-details-header');
  const unavailable = element.querySelector('#gameUnavailable');
  if (header && unavailable) {
    ['data-game-lobby-url', 'data-gameid', 'data-game-type'].forEach((attr) => {
      const v = unavailable.getAttribute(attr);
      if (v && !header.hasAttribute(attr)) header.setAttribute(attr, v);
    });
  }

  // Breadcrumb: <section class=" hidden-xs"><div class="container cmp-breadcrumb--alc"><nav class="cmp-breadcrumb">
  // Auto-generated in EDS (page metadata "Breadcrumbs: true").
  element.querySelectorAll('.cmp-breadcrumb').forEach((bc) => {
    const wrapper = bc.closest('section.hidden-xs') || bc.closest('.cmp-breadcrumb--alc') || bc;
    wrapper.remove();
  });

  WebImporter.DOMUtils.remove(element, [
    ...DETAIL_PAGE_CHROME_SELECTORS,
    // Live-casino lobby launch button + modal popup
    '#live-casino-component',
    '#live-casino-modal',
    // Hidden "Bonus Offer" rewards banner (filled client-side)
    'section.rewards-section',
    // Hidden "Game currently unavailable" message
    '#gameUnavailable',
    // Duplicate thumbnail strip: carousel-thumbnails parser only reads .slideshow-main
    '.alc-carousel.slideshow-thumbnails',
    // Favourite heart (account feature)
    '.alc-game-details-header__favourite',
    // Decorative background image (static/alc-images/background.jpg) and title logo
    'div.digital-instants-info-page > img',
    '.alc-image-browser__heading > img',
  ]);
  const body = element.querySelector('div.digital-instants-info-page');
  if (body && /background/i.test(body.getAttribute('style') || '')) body.removeAttribute('style');

  // H1 game title: <div class="alc-image-browser__heading"><h1><p>Title</p>
  //   [<div class="alc-image-browser__game-prize"><span>$0.10</span> - <span>$20</span></div>]</h1></div>
  // -> <h1>Title</h1>[<p>$0.10 - $20</p>]
  element.querySelectorAll('.alc-image-browser__heading').forEach((heading) => {
    const h1src = heading.querySelector('h1');
    if (!h1src) return;
    const prize = h1src.querySelector('.alc-image-browser__game-prize');
    const prizeText = prize ? prize.textContent.replace(/\s+/g, ' ').trim() : '';
    if (prize) prize.remove();
    const title = h1src.textContent.replace(/\s+/g, ' ').trim();
    const nodes = [];
    if (title) {
      const h1 = doc.createElement('h1');
      h1.textContent = title;
      nodes.push(h1);
    }
    if (prizeText) {
      const p = doc.createElement('p');
      p.textContent = prizeText;
      nodes.push(p);
    }
    heading.replaceWith(...nodes);
  });

  // Game Summary: unwrap panel wrappers -> <h2>Game Summary</h2> + paragraphs; <b> -> <strong>, <i> -> <em>
  element.querySelectorAll('.digital-instants-game-summary').forEach((summary) => {
    const inner = summary.querySelector('#gameSummary') || summary.querySelector('section') || summary;
    inner.querySelectorAll('b').forEach((b) => renameTag(b, 'strong'));
    inner.querySelectorAll('i').forEach((i) => renameTag(i, 'em'));
    const nodes = [...inner.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
    if (!nodes.some((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName))) {
      const h2 = doc.createElement('h2');
      h2.textContent = 'Game Summary';
      nodes.unshift(h2);
    }
    summary.replaceWith(...nodes);
  });

  // "Have you tried..." rail heading: keep the first #haveYouTriedTitle only, as a plain H2.
  // On instant-win pages the card rail itself is <section id="haveYouTriedTitle" class="alc-hyt">
  // (duplicate id) - that is the cards-game block, so only drop its id, never the element.
  let titleSeen = false;
  element.querySelectorAll('[id="haveYouTriedTitle"]').forEach((title) => {
    if (title.matches('.alc-hyt') || title.querySelector('.alc-hyt, .alc-hyt__container')) {
      title.removeAttribute('id');
      return;
    }
    if (titleSeen) {
      title.remove();
      return;
    }
    titleSeen = true;
    const text = (title.querySelector('h1, h2, h3, h4, h5, h6') || title).textContent.replace(/\s+/g, ' ').trim();
    if (!text) {
      title.remove();
      return;
    }
    const h2 = doc.createElement('h2');
    h2.textContent = text;
    title.replaceWith(h2);
  });
}

/* ------------------------------------------------------------------------------------------
 * Ticket detail pages (template "ticket-detail": Scratch 'N Win / Breakopen tickets,
 * e.g. /en/our-games/scratch-n-win/4099). Every rule is guarded by isTicketDetailPage() and
 * only targets elements inside div.game-detail-scratch (verified in migration-work/cleaned.html
 * and the live 4099 / 7115 / 3367 pages).
 * ---------------------------------------------------------------------------------------- */

function isTicketDetailPage(root) {
  return !!root.querySelector('div.game-detail-scratch');
}

function cleanupTicketDetailPage(element) {
  const doc = element.ownerDocument;
  const scratch = element.querySelector('div.game-detail-scratch');

  WebImporter.DOMUtils.remove(element, DETAIL_PAGE_CHROME_SELECTORS);

  // Source breadcrumb (Home / Our Games / Scratch 'N Win / 4099) + its trailing
  // <!-- /.breadcrumb-container --> comment. Auto-generated in EDS ("Breadcrumbs: true").
  scratch.querySelectorAll('div.breadcrumb-container').forEach((bc) => {
    const next = bc.nextSibling && bc.nextSibling.nodeType === 3 ? bc.nextSibling.nextSibling : bc.nextSibling;
    if (next && next.nodeType === 8 && /breadcrumb-container/.test(next.nodeValue || '')) next.remove();
    bc.remove();
  });

  // Decorative images: page background (alc-images/background.jpg) and title-bar
  // background (scratch-game-title-bg.png). Both are supplied by the section style CSS.
  WebImporter.DOMUtils.remove(scratch, [
    'section.body-content > img',
    'div.game-details-info > div.heading > img',
  ]);

  // Empty right rail (<div class="sidebar col-xs-12 col-lg-4"><div class="row"><div class="cmp-container">)
  scratch.querySelectorAll('div.sidebar').forEach((sidebar) => {
    if (!sidebar.textContent.trim() && !sidebar.querySelector('img, picture, video, iframe, a')) sidebar.remove();
  });

  // Title bar: <div class="heading"><div class="col-xs-9"><h1 class="name">Set for Life</h1></div>
  //   <div class="col-xs-3"><h1 class="price">$4</h1></div></div>  ->  <h1>Set for Life</h1><p>$4</p>
  scratch.querySelectorAll('div.game-details-info > div.heading').forEach((heading) => {
    const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const nameEl = heading.querySelector('h1.name') || heading.querySelector('h1:not(.price)');
    const name = text(nameEl);
    const price = text(heading.querySelector('.price'));
    const nodes = [];
    if (name) {
      const h1 = doc.createElement('h1');
      h1.textContent = name;
      nodes.push(h1);
    }
    if (price) {
      const p = doc.createElement('p');
      p.textContent = price;
      nodes.push(p);
    }
    heading.replaceWith(...nodes);
  });
}

/* ------------------------------------------------------------------------------------------
 * Video lottery detail pages (template "video-lottery-detail", /en/our-games/video-lottery/<game>).
 * Every rule is guarded by isVideoLotteryPage() (div.video-lottery-info-page). Verified against
 * migration-work/cleaned.html (cash-spin) and the live American-Original-Canadian-Cash,
 * big-city-5s-keno, Mo-Mummy, blazing-hot-celebrations and 7s-wild-gold pages.
 * The banner .cmp-teaser.alc-custom-teaser keeps its inline background-image style (read by
 * the hero-game parser); only the decorative body background (--bg) is stripped.
 * ---------------------------------------------------------------------------------------- */

const VLT_SUMMARY_HEADING = /^game summary:?$/i;

function normText(el) {
  return (el ? el.textContent : '').replace(/[\s ]+/g, ' ').trim();
}

// No text and no media: layout spacers (empty div.alc-container.section, empty div.cfm.section,
// empty in-cfm header section when the banner lives in a sibling div.teaser.section, ...)
function isEmptyContainer(el) {
  return !normText(el) && !el.querySelector('img, picture, video, iframe, [style*="url"]');
}

function cleanupVideoLotteryPage(element) {
  const doc = element.ownerDocument;

  WebImporter.DOMUtils.remove(element, [
    ...DETAIL_PAGE_CHROME_SELECTORS,
    // Duplicate thumbnail strip: carousel-thumbnails parser only reads .slideshow-main
    '.alc-carousel.slideshow-thumbnails',
    // Empty tracking div
    '.video-lottery-info-page .impress',
    // Decorative background image and title-bar logo
    'div.video-lottery-info-page > img',
    '.alc-image-browser__heading > img',
  ]);

  // Source breadcrumb (Home / Our Games / Video Lottery / <game>): auto-generated in EDS.
  element.querySelectorAll('.cmp-breadcrumb').forEach((bc) => {
    const wrapper = bc.closest('section.hidden-xs') || bc.closest('.cmp-breadcrumb--alc') || bc;
    wrapper.remove();
  });

  // Decorative page background: style="--bg:url(.../alc-images/background.jpg)"
  element.querySelectorAll('div.video-lottery-info-page').forEach((body) => {
    if (/background|--bg/i.test(body.getAttribute('style') || '')) body.removeAttribute('style');
  });

  // Mo-Mummy: div.page-faqs holds a duplicated <head> (meta/link/script/title) and a bare
  // "FAQ" H1 - not visible content. Keep it as default content only if it has real text.
  element.querySelectorAll('div.page-faqs').forEach((faqs) => {
    WebImporter.DOMUtils.remove(faqs, ['meta', 'link', 'script', 'noscript', 'style', 'title']);
    const text = normText(faqs);
    if (!text || /^faqs?$/i.test(text)) {
      faqs.remove();
      return;
    }
    faqs.querySelectorAll('h1').forEach((h) => renameTag(h, 'h2'));
    const nodes = [...faqs.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol')]
      .filter((n) => !n.parentElement.closest('p, ul, ol') && normText(n));
    faqs.replaceWith(...nodes);
  });

  // Empty right rail, empty in-cfm header section (banner in a sibling div.teaser.section),
  // empty div.alc-container.section / div.cfm.section spacers.
  element.querySelectorAll('.video-lottery-info-page aside').forEach((aside) => {
    if (isEmptyContainer(aside)) aside.remove();
  });
  element.querySelectorAll('section.alc-game-details-header--vlt').forEach((header) => {
    if (!header.querySelector('.cmp-teaser') && isEmptyContainer(header)) header.remove();
  });
  element.querySelectorAll('div.alc-container.section, div.cfm.section').forEach((container) => {
    if (isEmptyContainer(container)) container.remove();
  });

  // H1 game title: <div class="alc-image-browser__heading"><h1><p>Cash Spin</p></h1></div> -> <h1>Cash Spin</h1>
  element.querySelectorAll('.video-lottery-info-page .alc-image-browser__heading').forEach((heading) => {
    const title = normText(heading.querySelector('h1'));
    if (!title) {
      heading.remove();
      return;
    }
    const h1 = doc.createElement('h1');
    h1.textContent = title;
    heading.replaceWith(h1);
  });

  // Description card: section.alc-game-details__summary > .video-lottery-game-summary > .panel > #gameSummary
  // -> paragraphs + <h2>Game Summary</h2> (source: <h3>, <p> or <p><b>) ; <b> -> <strong>, <i> -> <em>
  element.querySelectorAll('.video-lottery-game-summary').forEach((summary) => {
    const outer = summary.closest('section.alc-game-details__summary') || summary;
    const inner = summary.querySelector('#gameSummary') || summary.querySelector('section') || summary;
    inner.querySelectorAll('b').forEach((b) => renameTag(b, 'strong'));
    inner.querySelectorAll('i').forEach((i) => renameTag(i, 'em'));
    inner.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p')
      .forEach((el) => {
        if (VLT_SUMMARY_HEADING.test(normText(el))) {
          const h2 = doc.createElement('h2');
          h2.textContent = 'Game Summary';
          el.replaceWith(h2);
        }
      });
    const nodes = [...inner.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
    outer.replaceWith(...nodes);
  });
}

/* ------------------------------------------------------------------------------------------
 * Content pages (template "content-page": 145 corporate / PlayWise / legal / promo / landing
 * pages). Two markup families:
 *   - newer AEM core-component pages: .root.responsivegrid > .aem-Grid > .alc-container ...,
 *     #skip-to-main-content, .cmp-teaser, .cmp-title, .dynamic-cta, .alc-button, .cmp-tabs, ...
 *   - older Bootstrap pages: .online-corporate-detail > .hero + .body-content (.blue-bar,
 *     .container.white-bg), .corporate-landing, .scratch-category, .game-category-page, ...
 * isContentPage() is true only when none of the detail-page detectors match AND the template is
 * "content-page" (or, without a template, the page is not the homepage). Every rule below runs
 * only on those pages, so the homepage / game / ticket / VLT output is unchanged.
 * Selectors verified against migration-work/cleaned.html (player-tools), the 68 bodies in
 * migration-work/census/ and live renders of the representative samples.
 * ---------------------------------------------------------------------------------------- */

const CONTENT_PAGES = new WeakSet();

function isHomepageUrl(url) {
  if (!url) return false;
  try {
    const { pathname } = new URL(url, ORIGIN);
    return /^\/(content\/alc\/en(\.html)?|en(\.html)?)?\/?$/.test(pathname);
  } catch (e) {
    return false;
  }
}

function isContentPage(root, payload) {
  if (isTicketDetailPage(root) || isVideoLotteryPage(root) || isGameDetailPage(root)) return false;
  const template = payload && payload.template;
  if (template && template.name) return template.name === 'content-page';
  const url = (payload && ((payload.params && payload.params.originalURL) || payload.url)) || '';
  return !!url && !isHomepageUrl(url);
}

// Chrome that sits outside the detail-page list on content pages
const CONTENT_PAGE_CHROME_SELECTORS = [
  // Source breadcrumbs (AEM .breadcrumb component in the title banner; legacy
  // section#page-breadcrumb > .breadcrumb-container). Auto-generated in EDS ("Breadcrumbs: true").
  'section#page-breadcrumb',
  '.breadcrumb-container',
  '.breadcrumb',
  '.cmp-breadcrumb',
  // Legacy "Explore: ..." corporate sub-navigation dropdown (div.hero > [id^=corpmenu] > .corp-menu-container)
  '.corp-menu-container',
  '.cq-dd-pages',
  // Live chat (div.livechat > .alc-livechat > #livechat) and the CXone chat launcher
  '.livechat',
  '.alc-livechat',
  '#cxone-guide-container',
  // ShareThis helper
  '#stcpDiv',
  // App-only "Download our App" mobile banners (div.banner.section > .alc-mobile-banner)
  // (the emptied div.banner.section / .digital-instants-intro wrappers go with the empty spacers)
  '.alc-mobile-banner',
  // Alert bars / outage messages / hidden "Bonus Offer" rewards banner / checkout sign-in banner
  'section[id^="alert-"]',
  '#live-casino-outage-message',
  '.rewards-banner',
  '#direct-checkout-banner',
  // Live-casino lobby launcher + its game modal
  '#live-casino-component',
  '#live-casino-modal',
  // Hidden client-side states ("0 results", "Temporarily Unavailable")
  '.winners-error',
  '.jackpot-temp-unavailable.hidden',
  // Mobile-only filter toggles (the filter panels themselves stay with the game lists)
  'a.scratch-mobile-filter-expand',
  'p.filter.visible-xs',
  '.filters-collapse.visible-xs',
  // Homepage-only mobile "Check winning numbers" banner (homepage clones /en/our-games, /en/play-online)
  '.html-promo',
];

// Containers that are the page title banner (hero-banner block source): no CTA/heading rewrites
const CONTENT_HERO_SELECTOR = '.alc-container.cmp-container--pw-content-hero-padding, '
  + '.alc-container.cmp-container--pw-landing-hero-padding, div.hero';

function cleanText(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/[\s ]+/g, ' ').trim();
}

// Keep attributes (parsers select on .cmp-teaser__title) while changing the tag
function renameTagKeepAttrs(el, tagName) {
  const next = el.ownerDocument.createElement(tagName);
  [...el.attributes].forEach((attr) => next.setAttribute(attr.name, attr.value));
  next.append(...el.childNodes);
  el.replaceWith(next);
  return next;
}

// YouTube / Vimeo embed URL -> canonical watch URL
function videoWatchUrl(src) {
  if (!src) return '';
  const abs = absolutizeUrl(src);
  const yt = abs.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/#]+)/i);
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
  const short = abs.match(/youtu\.be\/([^?&/#]+)/i);
  if (short) return `https://www.youtube.com/watch?v=${short[1]}`;
  const vm = abs.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vm) return `https://vimeo.com/${vm[1]}`;
  if (/youtube\.com\/watch|vimeo\.com\/\d+/i.test(abs)) return abs;
  return '';
}

function videoUrlsIn(scope) {
  const urls = [];
  scope.querySelectorAll('iframe[src], iframe[data-src], [data-video-url], [data-embed-url]').forEach((el) => {
    ['src', 'data-src', 'data-video-url', 'data-embed-url'].forEach((attr) => {
      const u = videoWatchUrl(el.getAttribute(attr));
      if (u) urls.push(u);
    });
  });
  return [...new Set(urls)];
}

const TRACKING_SRC_RE = /doubleclick|adsrvr|adservice|adnxs|reddit|facebook\.com\/tr|googletagmanager|evolutionGame/i;

const MODAL_SELECTOR = '.modal-xf, .cmp-modal, .alc-modal, .modal';

// "Watch a video" teaser links are href="#" and open a hidden modal holding a YouTube iframe
// (player-tools: div.modal-xf > .cmp-modal > #playwise-video.alc-modal > ... > .cmp-embed > iframe).
// Point them at the video itself. Runs before modals / iframes are removed.
function fixModalVideoLinks(root) {
  const doc = root.ownerDocument;
  const modals = [...root.querySelectorAll(MODAL_SELECTOR)];
  const allModalVideos = [...new Set(modals.flatMap((m) => videoUrlsIn(m)))];
  root.querySelectorAll('a').forEach((a) => {
    if (a.closest(MODAL_SELECTOR)) return;
    const href = (a.getAttribute('href') || '').trim();
    if (href && href !== '#' && !/^javascript:/i.test(href)) return;
    const target = a.getAttribute('data-target') || a.getAttribute('data-bs-target') || '';
    const opensModal = /modal/i.test(a.getAttribute('data-toggle') || a.getAttribute('data-bs-toggle') || '') || !!target;
    if (!opensModal && !/video|watch/i.test(cleanText(a.textContent))) return;
    let urls = [];
    if (target && target.startsWith('#')) {
      const modal = doc.getElementById(target.slice(1));
      if (modal) urls = videoUrlsIn(modal);
    }
    if (!urls.length) urls = allModalVideos;
    if (urls.length === 1) a.setAttribute('href', urls[0]);
  });
}

// Similar text = same words (mobile/desktop copies of one component)
function similarText(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (!wa.size || !wb.size) return false;
  let common = 0;
  wa.forEach((w) => { if (wb.has(w)) common += 1; });
  return common / Math.max(wa.size, wb.size) >= 0.6;
}

function imageKeys(el) {
  return [...el.querySelectorAll('img[src]')].map((i) => (i.getAttribute('src') || '').split('?')[0].split('/').pop()).filter(Boolean);
}

// Mobile-only copies (.aem-GridColumn--default--hide, Bootstrap .visible-xs) are dropped when a
// desktop-visible equivalent (same component type, similar text or same images) exists, or when
// they are empty. Unique mobile-only content is kept.
const MOBILE_ONLY_SELECTOR = '.aem-GridColumn--default--hide, .visible-xs, .visible-xs-block';

const ALL_BREAKPOINTS_HIDDEN = ['xs', 'sm', 'md', 'default'].map((bp) => `aem-GridColumn--${bp}--hide`);

function removeHiddenDuplicates(root) {
  const hidden = [...root.querySelectorAll(MOBILE_ONLY_SELECTOR)];
  const hiddenSet = new Set(hidden);
  // Hidden copies already kept count as "present" for later copies (mega360: three
  // breakpoint variants of one app promo, none visible on desktop -> keep the first only)
  const kept = new Set();
  const isPresent = (el) => {
    for (let p = el; p && p !== root; p = p.parentElement) {
      if (hiddenSet.has(p) && !kept.has(p)) return false;
    }
    return true;
  };
  hidden.forEach((el) => {
    if (!el.isConnected) return;
    // Hidden at every breakpoint: never rendered
    if (isEmptyContainer(el) || ALL_BREAKPOINTS_HIDDEN.every((c) => el.classList.contains(c))) {
      el.remove();
      return;
    }
    const type = (el.classList[0] || el.tagName).toString();
    const text = cleanText(el.textContent);
    const imgs = imageKeys(el);
    const peers = [...root.getElementsByClassName(type)]
      .filter((p) => p !== el && p.isConnected && !p.contains(el) && !el.contains(p) && isPresent(p));
    // Desktop-only twin in the same grid (gambling-helplines: #text-body xs--hide / #text-body-mobile default--hide)
    const desktopTwin = el.classList.contains('aem-GridColumn--default--hide')
      ? peers.some((p) => p.parentElement === el.parentElement && p.classList.contains('aem-GridColumn--xs--hide'))
      : peers.some((p) => p.parentElement === el.parentElement && p.classList.contains('hidden-xs'));
    const hasEquivalent = desktopTwin || peers.some((p) => {
      const pt = cleanText(p.textContent);
      if (text) return similarText(text, pt);
      const pi = imageKeys(p);
      return imgs.length && imgs.every((k) => pi.includes(k));
    });
    if (hasEquivalent) el.remove();
    else kept.add(el);
  });
}

// <p><strong><a href>text</a></strong></p> (EDS CTA pill)
function ctaParagraph(doc, href, text) {
  const p = doc.createElement('p');
  const strong = doc.createElement('strong');
  const a = doc.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  strong.append(a);
  p.append(strong);
  return p;
}

// Buttons without a URL that open a known app flow
function buttonHref(button) {
  if ((button.getAttribute('data-ga4-event') || '') === 'rewards_join'
    || (button.getAttribute('data-ga4-param-user-flow') || '') === 'join_rewards') {
    return '/content/alc/en/rewards/join-rewards.html';
  }
  const href = (button.getAttribute('href') || '').trim();
  return href && href !== '#' ? href : '';
}

function convertCtas(root) {
  const doc = root.ownerDocument;
  const outsideHero = (el) => !el.closest(CONTENT_HERO_SELECTOR) && !el.closest('.cmp-teaser');

  // Dynamic CTA (Vue): <div class="dynamic-cta"><div class="cmp-dynamic-cta" data-unauth-button-text=...>
  //   <a class="cmp-dynamic-cta__button">Create an Account</a>
  //   <div class="cmp-dynamic-cta__description"><b>Already have an account?</b> <a>Sign in</a> ...</div>
  root.querySelectorAll('.dynamic-cta').forEach((wrapper) => {
    if (!outsideHero(wrapper)) return;
    const cta = wrapper.querySelector('.cmp-dynamic-cta') || wrapper;
    const nodes = [];
    const button = cta.querySelector('a.cmp-dynamic-cta__button');
    const text = cleanText(button ? button.textContent : cta.getAttribute('data-unauth-button-text'));
    const href = (button && button.getAttribute('href')) || cta.getAttribute('data-unauth-button-link') || '';
    if (text && href) nodes.push(ctaParagraph(doc, href, text));
    let desc = cta.querySelector('.cmp-dynamic-cta__description');
    if (!desc && cta.getAttribute('data-unauth-description')) {
      desc = doc.createElement('div');
      desc.innerHTML = cta.getAttribute('data-unauth-description').replace(/&nbsp;/g, ' ');
    }
    if (desc && cleanText(desc.textContent)) {
      desc.querySelectorAll('b').forEach((b) => renameTag(b, 'strong'));
      desc.querySelectorAll('u').forEach((u) => u.replaceWith(...u.childNodes));
      desc.querySelectorAll('br').forEach((br) => br.remove());
      const p = doc.createElement('p');
      p.append(...desc.childNodes);
      nodes.push(p);
    }
    if (nodes.length) wrapper.replaceWith(...nodes);
    else wrapper.remove();
  });

  // Button components: <span|div class="alc-button"><a class="button arrow-button">...</a> | <button>
  // and core buttons <div class="button"><a class="cmp-button"><span class="cmp-button__text">
  const buttons = [
    ...root.querySelectorAll('.alc-button'),
    ...[...root.querySelectorAll('a.cmp-button')].filter((a) => !a.closest('.alc-button')),
  ];
  buttons.forEach((el) => {
    if (!el.isConnected || !outsideHero(el)) return;
    const links = el.matches('a') ? [el] : [...el.querySelectorAll('a[href], button')];
    const nodes = links.map((link) => {
      const text = cleanText(link.textContent);
      const href = link.matches('button') ? buttonHref(link) : (link.getAttribute('href') || '').trim();
      return text && href && href !== '#' ? ctaParagraph(doc, href, text) : null;
    }).filter(Boolean);
    // core button wrapper <div class="button"> around a.cmp-button
    const holder = el.matches('a') && el.parentElement && el.parentElement.matches('div.button')
      && el.parentElement.children.length === 1 ? el.parentElement : el;
    if (nodes.length) holder.replaceWith(...nodes);
    else holder.remove();
  });
}

const EMPTY_SPACER_SELECTOR = [
  '.text', '.title', '.image', '.teaser', '.alc-container', '.cfm', '.responsivegrid',
  '.contributions', '.social-responsibility', 'div.events', 'div.promo', '.promo-holder', '.faq-promo',
  'div.sidebar', 'aside', 'div.banner.section', '.digital-instants-intro',
].join(', ');

// Regions whose hidden items are real content (inactive slides / tabs / panels, game-list tiles)
const KEEP_HIDDEN_SELECTOR = '.cmp-tabs, .cmp-accordion, .panel-group, .alc-carousel, .carousel, .slick-slider, '
  + '.cmp-container--game-tiles, section.alc-hyt, .di-featured-section, .browse-game-list, section.ko-scratch-list, '
  + '.games-wrapper, .buy-tickets__wrapper';

function isEmptyHeading(h) {
  return !normText(h) && !h.querySelector('img, picture');
}

function cleanupContentPage(element, doc) {
  // 0. Old pages have head markup that pushes <title> into <body>: keep document.title, drop the node
  const pageTitle = doc.title;
  element.querySelectorAll('title').forEach((t) => t.remove());
  if (pageTitle && doc.title !== pageTitle) doc.title = pageTitle;

  // 1. href="#" video links -> YouTube URL from the hidden modal (before modals / iframes go)
  fixModalVideoLinks(element);

  // 2. Global chrome (header/footer XF, signed-in dashboard dropdowns, login/MFA modal, alert
  // bars, browser-check modal), page chrome, all hidden modals, inline scripts/styles
  // (old pages carry <script> inside content wrappers, which would count as text below).
  WebImporter.DOMUtils.remove(element, [
    ...DETAIL_PAGE_CHROME_SELECTORS,
    ...CONTENT_PAGE_CHROME_SELECTORS,
    MODAL_SELECTOR,
    'script',
    'noscript',
    'style',
  ]);

  // Client-side hidden states (inline display:none: logged-in-only favourites, empty search
  // results, "More Info" toggles) outside carousels / tabs / accordions / game lists
  element.querySelectorAll('[style*="display: none"], [style*="display:none"]').forEach((el) => {
    if (el.isConnected && !el.closest(KEEP_HIDDEN_SELECTOR)) el.remove();
  });
  // Icon-font ligatures (<span class="material-icons">chevron_right</span>) and share widgets
  WebImporter.DOMUtils.remove(element, ['.material-icons', '.material-icons-outlined', '.material-symbols-outlined']);
  element.querySelectorAll('.social').forEach((el) => {
    if (/^share\b/i.test(normText(el))) el.remove();
  });

  // 3. Separators and stray <hr>: an <hr> is a section break in EDS (breaks come from the sections transformer)
  WebImporter.DOMUtils.remove(element, ['.separator', '.cmp-separator', 'hr']);

  // 4. Mobile-only duplicates
  removeHiddenDuplicates(element);

  // 5. Empty spacers (deepest first so emptied parents go too) and empty paragraphs
  [...element.querySelectorAll(EMPTY_SPACER_SELECTOR)].reverse().forEach((el) => {
    if (el.isConnected && isEmptyContainer(el)) el.remove();
  });
  element.querySelectorAll('p').forEach((p) => {
    if (isEmptyContainer(p)) p.remove();
  });
  element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (isEmptyHeading(h)) h.remove();
  });

  // 6. Card / media teaser titles are <h1 class="cmp-teaser__title"> on the source -> H3
  element.querySelectorAll('h1.cmp-teaser__title').forEach((h) => {
    if (!h.closest(CONTENT_HERO_SELECTOR)) renameTagKeepAttrs(h, 'h3');
  });

  // 7. CTA pills
  convertCtas(element);

  // 8. Slug-like <title> -> og:title, else the page H1 (chrome H1s are gone by now)
  fixSlugTitle(doc, element);
}

// Decorative background images left on default content after parsing (PlayWise pattern
// PWbg.jpg, provincial map provbg.jpg, static/alc-images/background.jpg, casino lobby
// backdrop casinoWrapper/imageD, "Featured" / "Jackpot" tile ribbons TM-*_en.png). Blocks keep theirs.
const DECORATIVE_BG_RE = /(^|[/_-])(bg|background|pattern|texture)[^/]*\.(jpe?g|png|gif|svg|webp)|[a-z]bg\.(jpe?g|png)|alc-images\/|\/casinoWrapper\/|\/TM-[A-Za-z]+_(en|fr)\.png/i;

function cssUnescapeUrl(value) {
  return value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (m, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

// After parsing: form controls / app buttons, empty links and headings left in default content
function cleanupContentDefaultContent(root) {
  const outside = (el) => !el.closest('table');
  root.querySelectorAll('label').forEach((label) => {
    if (outside(label) && (label.hasAttribute('for') || label.querySelector('input, select, textarea'))) label.remove();
  });
  root.querySelectorAll('select, input, textarea, button').forEach((el) => {
    if (el.isConnected && outside(el)) el.remove();
  });
  root.querySelectorAll('form').forEach((form) => {
    if (outside(form)) form.replaceWith(...form.childNodes);
  });
  // Script-driven pseudo links (href="#"): filter tab lists (casino A-Z / Live Casino / Slots ...)
  // go entirely, other ones keep their text
  const isHashLink = (a) => (a.getAttribute('href') || '').trim() === '#';
  root.querySelectorAll('ul, ol').forEach((list) => {
    if (!outside(list)) return;
    const items = [...list.children];
    if (items.length && items.every((li) => {
      const links = [...li.querySelectorAll('a')];
      return links.length && links.every(isHashLink) && normText(li) === links.map((a) => normText(a)).join(' ').trim();
    })) list.remove();
  });
  root.querySelectorAll('a').forEach((a) => {
    if (!outside(a)) return;
    if (!normText(a) && !a.querySelector('img, picture')) a.remove();
    else if (isHashLink(a)) a.replaceWith(...a.childNodes);
  });
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (outside(h) && isEmptyHeading(h)) h.remove();
  });
}

function stripDecorativeBackgrounds(root) {
  root.querySelectorAll('[style*="url"]').forEach((el) => {
    if (el.closest('table')) return;
    const style = el.getAttribute('style') || '';
    const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
    if (!m || !DECORATIVE_BG_RE.test(cssUnescapeUrl(m[2]))) return;
    const next = style.replace(/background(?:-image)?\s*:[^;]*url\([^)]*\)[^;]*;?/gi, '').trim();
    if (next) el.setAttribute('style', next);
    else el.removeAttribute('style');
  });
}

// Many alc.ca pages use the URL slug (or, on ticket pages, the numeric game id) as <title>.
// Prefer og:title when the title is slug-like. With h1Root (ticket pages only), fall back to
// the ticket-name H1 when og:title is missing or is just the id/slug again.
// anyCase (video lottery pages only): also treat mixed-case slugs ("Mo-Mummy",
// "American-Original-Canadian-Cash") as slug-like.
function fixSlugTitle(doc, h1Root, anyCase) {
  const title = (doc.title || '').trim();
  const slugRe = anyCase ? /^[a-z0-9]+(-[a-z0-9]+)*$/i : /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRe.test(title)) return;
  const ogTitle = doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
  const og = ogTitle ? (ogTitle.content || '').trim() : '';
  const ogIsReal = og && og !== title && !/^\d+$/.test(og);
  if (h1Root && !ogIsReal) {
    const h1 = h1Root.querySelector('div.game-details-info h1.name') || h1Root.querySelector('h1');
    const h1Text = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
    if (h1Text) {
      doc.title = h1Text;
      // getMetadata() emits a separate "og:title" row when it differs from the title; the
      // id-only og:title ("4099") is not a real title, so align it with the H1.
      if (ogTitle) ogTitle.setAttribute('content', h1Text);
      return;
    }
  }
  // Original behaviour (homepage / game pages): og:title wins over a slug-like title
  if (og) doc.title = og;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const doc = (payload && payload.document) || document;
    // Ticket detail pages: title from H1 must be read before the header chrome (which has
    // no H1 on these pages) is removed and before the heading is rewritten.
    if (isTicketDetailPage(element)) {
      fixSlugTitle(doc, element.querySelector('div.game-detail-scratch'));
      cleanupTicketDetailPage(element);
      registerPageMetadata(element, { Breadcrumbs: 'true' });
    } else if (isVideoLotteryPage(element)) {
      fixSlugTitle(doc, null, true);
      cleanupVideoLotteryPage(element);
      registerPageMetadata(element, { Breadcrumbs: 'true' });
    } else if (isContentPage(element, payload)) {
      CONTENT_PAGES.add(element);
      cleanupContentPage(element, doc);
      registerPageMetadata(element, { Breadcrumbs: 'true' });
    } else {
      fixSlugTitle(doc, null);
    }
    const contentPage = CONTENT_PAGES.has(element);
    // Online game detail pages (guarded; no-op on the homepage)
    if (isGameDetailPage(element)) {
      cleanupGameDetailPage(element);
      registerPageMetadata(element, { Breadcrumbs: 'true' });
    }
    // Server-side include markers are never authorable
    removeSdiComments(element);

    WebImporter.DOMUtils.remove(element, [
      // Global header experience fragment (contains nav, login/MFA modals, session timer) - migrated as nav fragment
      'div.experiencefragment',
      '.cmp-experiencefragment--header',
      // Global footer experience fragment - migrated as footer fragment
      'footer.experiencefragment',
      '.cmp-experiencefragment--footer',
      // Site-wide modals (jackpot modal, browser-upgrade modal)
      '.common-modals',
      // NOTE: .html-promo (mobile-only "Check winning numbers" banner) is real content and is
      // converted by the cards-promo parser - do not remove it or strip its attributes here.
      // Skip-to-main-content link
      '.cmp-page__skiptomaincontent',
      // Qualtrics intercept container (<div id="ZN_3Eu2u7P45FmpwJ5">)
      '#ZN_3Eu2u7P45FmpwJ5',
      // Countdown timers inside hero carousel slides
      '.next-draw-timer',
      // Tracking iframes (doubleclick, adsrvr "TTD Universal Pixel"). Content pages keep their
      // video / embed iframes for the embed, accordion-bar and tabs-boxed parsers (see below).
      ...(contentPage ? [] : ['iframe']),
    ]);
    if (contentPage) {
      element.querySelectorAll('iframe').forEach((frame) => {
        const src = frame.getAttribute('src') || frame.getAttribute('data-src') || '';
        const isEmbed = frame.closest('.cmp-embed, .embed') || videoWatchUrl(src);
        if (!isEmbed || TRACKING_SRC_RE.test(src)) frame.remove();
      });
    }

    // Make image URLs absolute before parsers copy <img> into block cells
    fixImages(element);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'noscript',
      'script',
      'link',
      'style',
      // Tracking pixels present on the live page (adservice / reddit / adnxs)
      'img[src*="adservice"]',
      'img[src*="reddit"]',
      'img[src*="adnxs"]',
      'img[src*="adsrvr"]',
      'img[src*="doubleclick"]',
    ]);

    // Section header components -> plain H2 default content
    // <div class="section-header ..."><section class="cmp-section-header"><div class="container">
    //   <h2 class="cmp-section-header__title">Recent winners</h2>
    element.querySelectorAll('.section-header').forEach((header) => {
      const title = header.querySelector('.cmp-section-header__title');
      if (!title) return;
      const h2 = document.createElement('h2');
      h2.textContent = title.textContent.trim();
      header.replaceWith(h2);
    });

    // Unwrap drag-and-drop reference paragraph wrappers (<div class="cq-dd-paragraph">)
    element.querySelectorAll('.cq-dd-paragraph').forEach((wrapper) => {
      wrapper.replaceWith(...wrapper.childNodes);
    });

    // Content pages: decorative background images on the remaining default content
    if (CONTENT_PAGES.has(element)) {
      stripDecorativeBackgrounds(element);
      cleanupContentDefaultContent(element);
    }

    // Absolute image URLs (in case parsers created new <img> from attributes)
    fixImages(element);

    // Rewrite internal links
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const next = rewriteLink(href);
      if (next !== href) a.setAttribute('href', next);
    });
  }
}
