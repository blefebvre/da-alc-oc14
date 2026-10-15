/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-winners. Base: carousel.
 * Source: https://www.alc.ca/content/alc/en.html
 * Selector: .winners-carousel.carousel.panelcontainer
 *
 * Source structure (validated in block-context/carousel-winners/source.html):
 *   .winners-carousel-slides (slick) > .slick-list > .slick-track > div.slick-slide[.slick-cloned]
 *     > div > div.slide > .container > .row
 *        .winner-image[style="background-image:url('...')"]
 *        .winner-info > h3, span.h2 (location), a.all-winners
 *        .prize-details > p.game-title > img.winning-game-logo, span.winning-game-ribbon
 *                       > p.prize-amount > span x N (digit groups)
 *
 * Slick clones slides; iterate the stable inner wrapper div.slide, skip any inside .slick-cloned,
 * and dedupe by winner name (works before/after slick initialisation).
 *
 * Output: one row per winner -> [photo, content]
 */
const ORIGIN = 'https://www.alc.ca';

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${encodeURI(decodeURI(v))}`;
  return v;
}

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
  if (m && m[1]) return m[1];
  return el.getAttribute('data-src') || el.getAttribute('data-bg') || el.getAttribute('data-background') || '';
}

function formatPrize(prizeEl) {
  if (!prizeEl) return '';
  const groups = [...prizeEl.querySelectorAll('span')]
    .map((s) => s.textContent.replace(/[^\d.]/g, ''))
    .filter(Boolean);
  if (groups.length) return `$${groups.join(',')}`;
  const raw = prizeEl.textContent.replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `$${Number(digits).toLocaleString('en-US')}` : raw;
}

export default function parse(element, { document }) {
  let slides = [...element.querySelectorAll('div.slide')];
  if (!slides.length) slides = [...element.querySelectorAll('.slick-slide')];

  const seen = new Set();
  const cells = [];

  slides.forEach((slide) => {
    if (slide.closest('.slick-cloned')) return;
    const nameEl = slide.querySelector('.winner-info h3, .winner-info h2, .winner-info h4, h3');
    const name = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const photoSrc = bgUrl(slide.querySelector('.winner-image'));
    const key = name || photoSrc;
    if (!key || seen.has(key)) return;
    seen.add(key);

    // Cell 1: winner photo
    const photoCell = [];
    if (photoSrc) {
      const img = document.createElement('img');
      img.src = absolutize(photoSrc);
      img.alt = name;
      photoCell.push(img);
    }

    // Cell 2: name, location, CTA, game logo, ribbon, prize
    const content = [];
    if (name) {
      const h3 = document.createElement('h3');
      h3.textContent = name;
      content.push(h3);
    }

    const locEl = slide.querySelector('.winner-info span.h2, .winner-info .location, .winner-info span');
    const location = locEl ? locEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (location) {
      const p = document.createElement('p');
      p.textContent = location;
      content.push(p);
    }

    const cta = slide.querySelector('a.all-winners, .winner-info a[href]');
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      // Source authoring bug: ".../winners.html.html" -> ".../winners.html"
      a.href = cta.getAttribute('href').replace(/(\.html)+(?=$|[?#])/, '.html');
      a.textContent = cta.textContent.replace(/\s+/g, ' ').trim() || 'See all winners';
      p.append(a);
      content.push(p);
    }

    const logo = slide.querySelector('img.winning-game-logo, .game-title img');
    if (logo && logo.getAttribute('src')) {
      const p = document.createElement('p');
      const img = document.createElement('img');
      img.src = absolutize(logo.getAttribute('src'));
      img.alt = logo.getAttribute('alt') || 'game logo';
      p.append(img);
      content.push(p);
    }

    const ribbon = slide.querySelector('.winning-game-ribbon');
    const ribbonText = ribbon ? ribbon.textContent.replace(/\s+/g, ' ').trim() : '';
    if (ribbonText) {
      const p = document.createElement('p');
      p.textContent = ribbonText;
      content.push(p);
    }

    const prize = formatPrize(slide.querySelector('.prize-amount'));
    if (prize) {
      const p = document.createElement('p');
      p.textContent = prize;
      content.push(p);
    }

    cells.push([photoCell.length ? photoCell : '', content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-winners', cells });
  element.replaceWith(block);
}
