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
  if (isAsset || isGameLauncher || !path.startsWith('/content/alc')) {
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

function isGameDetailPage(root) {
  return !!root.querySelector('section.alc-game-details-header, div.digital-instants-info-page');
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
    // Game pages have no div.experiencefragment wrapper: the global header is
    // <div role="banner"><div class="xfpage page basicpage">...<header>...</header> (plus the
    // #loginFlow MFA modal) and the footer is a bare <footer class="main-footer">.
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
    // Browser-upgrade modal (sibling of .common-modals on game pages)
    '.modal-browser-check',
    // Site-wide alert/notification banners (<section data-bind="if: message"><div class="alert-area">)
    'section[data-bind="if: message"]',
    '.alert-area',
    '.notification.section',
    '.cmp-notification',
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

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Many alc.ca pages use the URL slug as <title>; prefer og:title when the title is slug-like
    const doc = (payload && payload.document) || document;
    const ogTitle = doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
    if (ogTitle && /^[a-z0-9]+(-[a-z0-9]+)*$/.test((doc.title || '').trim()) && ogTitle.content.trim()) {
      doc.title = ogTitle.content.trim();
    }
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
      // Tracking iframes (doubleclick, adsrvr "TTD Universal Pixel")
      'iframe',
    ]);

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
