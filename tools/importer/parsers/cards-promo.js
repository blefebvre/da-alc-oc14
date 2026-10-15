/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo. Base: cards.
 * Source: https://www.alc.ca/content/alc/en.html
 * Selector: .alc-container.cmp-container--hide-column-gutters
 *
 * Source structure (validated in block-context/cards-promo/source.html):
 *   .reference.parbase > .cq-dd-paragraph > .cmp-image > div.impress > a[href] > picture
 *     > source[media="(min-width: 1200px)"] (imageD) / 768 (imageT) / 320 (imageM), img[alt]
 *   A sibling .banner (mobile "Download our App" banner) is excluded.
 *
 * Iterates the .cmp-image wrapper (not the anchors) to stay immune to inline-anchor merging.
 * Output: one row per promo -> [image, link]
 */
const ORIGIN = 'https://www.alc.ca';
const GENERIC_ALT = /^(promo(tion)?\s*image|image|banner|promo)?$/i;

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function desktopSrc(picture, img) {
  const sources = [...(picture ? picture.querySelectorAll('source[srcset]') : [])].map((s) => {
    const mw = (s.getAttribute('media') || '').match(/min-width:\s*(\d+)/);
    return { src: s.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0], w: mw ? parseInt(mw[1], 10) : 0 };
  }).sort((a, b) => b.w - a.w);
  if (sources.length && sources[0].src) return sources[0].src;
  return img ? img.getAttribute('src') : '';
}

// e.g. /content/alc/en/corporate/giving-back/sponsorships.html -> "Sponsorships"
function labelFromHref(href) {
  try {
    const url = new URL(href, ORIGIN);
    const seg = url.pathname.split('/').filter(Boolean).pop() || '';
    const name = seg.replace(/\.html$/, '').replace(/^lottomax$/i, 'lotto max').replace(/[-_]+/g, ' ').trim();
    return name ? name.replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  } catch (e) {
    return '';
  }
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.cmp-image')].filter((el) => el.querySelector('picture, img'));
  if (!items.length) {
    // Fallback: any linked picture outside the mobile app banner
    items = [...element.querySelectorAll('a[href] picture')]
      .filter((p) => !p.closest('.banner'))
      .map((p) => p.closest('a').parentElement);
  }

  const seen = new Set();
  const cells = [];

  items.forEach((item) => {
    if (item.closest('.banner')) return;
    const picture = item.querySelector('picture');
    const img = item.querySelector('img');
    const link = item.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : '';
    const src = desktopSrc(picture, img);
    if (!src) return;
    const key = `${href}|${src}`;
    if (seen.has(key)) return;
    seen.add(key);

    const alt = (img && img.getAttribute('alt') || '').trim();
    const gtmName = (item.querySelector('[data-gtm-name]')?.getAttribute('data-gtm-name') || '').trim();
    const label = (!GENERIC_ALT.test(alt) && alt) || labelFromHref(href) || gtmName || alt || 'Learn more';

    const image = document.createElement('img');
    image.src = absolutize(src);
    image.alt = alt && !GENERIC_ALT.test(alt) ? alt : label;

    const linkCell = [];
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      linkCell.push(a);
    }

    cells.push([image, linkCell.length ? linkCell : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
