/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-thumbnails. Base: carousel.
 * Source: https://www.alc.ca/content/alc/en/play-online/casino/10000-wolves-10k-ways.html
 * Selector: .alc-image-browser .alc-carousel.slideshow-main
 *
 * Source structure (validated in block-context/carousel-thumbnails/source*.html):
 *   div.alc-carousel.slideshow-main > ul.slides > li.slide > img[src][alt]
 *   Live-casino pages render the container empty (no ul.slides).
 *   The thumbnail strip (#slideshow-thumbnails) is built by the block, not authored.
 *
 * Output: one row per unique slide image, single cell with the <img>. No slides -> element removed.
 */
const ORIGIN = 'https://www.alc.ca';

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

export default function parse(element, { document }) {
  const cells = [];
  const seen = new Set();

  let slides = [...element.querySelectorAll('li.slide')];
  if (!slides.length) slides = [...element.querySelectorAll('.slides > li')];

  slides
    .filter((slide) => !slide.classList.contains('clone') && slide.getAttribute('aria-hidden') !== 'true')
    .forEach((slide) => {
      const imgEl = slide.querySelector('img');
      const src = imgEl && (imgEl.getAttribute('src') || imgEl.getAttribute('data-src'));
      if (!src) return;
      const abs = absolutize(src);
      if (seen.has(abs)) return;
      seen.add(abs);
      const img = document.createElement('img');
      img.src = abs;
      img.alt = imgEl.getAttribute('alt') || '';
      cells.push([img]);
    });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-thumbnails', cells });
  element.replaceWith(block);
}
