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
  if (!path.startsWith('/content/alc')) {
    // alc.ca link outside /content/alc (e.g. /etc.clientlibs): only make absolute-relative consistent
    return isRelative ? href : href;
  }
  path = path.replace(/^\/content\/alc/, '') || '/';
  path = path.replace(/\.html$/, '');
  // English homepage is the site root
  if (path === '' || path === '/en' || path === '/en/') path = '/';

  const params = new URLSearchParams(url.search);
  [...params.keys()].forEach((key) => {
    if (/^(itm_|utm_)/i.test(key)) params.delete(key);
  });
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}${url.hash || ''}`;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
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
