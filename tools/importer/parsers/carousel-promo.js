/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-promo. Base: carousel.
 * Source: https://www.alc.ca/content/alc/en.html
 * Selector: .carousel.list.parbase.hero
 *
 * Source structure (validated in block-context/carousel-promo/source.html):
 *   ul.slides > li.slide > div.fca-carousel-slide-promo > article.fca-carousel-slide-promo
 *     > a[href] > div.slide-content.picturefill-background (style="background-image:url(...imageT...)")
 *         > span[data-media][data-src]  (imageM / imageT / imageD -> mobile/tablet/desktop)
 *         > div.container > div.next-draw-timer (skipped)
 *
 * Output: one row per slide -> [desktop image + mobile image (imageM), link]
 */
const ORIGIN = 'https://www.alc.ca';

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function bgUrl(el) {
  const style = el?.getAttribute('style') || '';
  const m = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i)
    || style.match(/url\((?:&quot;|['"])?(.*?)(?:&quot;|['"])?\)/i);
  if (!m) return '';
  // url('') must yield '' (not the quote character captured by the first group)
  const value = (m.length > 2 ? m[2] : m[1]) || '';
  return value.replace(/&quot;/g, '').replace(/^['"]+|['"]+$/g, '').trim();
}

// Prefer the largest (desktop) source: span with the highest min-width, then <picture> sources, then bg.
function desktopImageUrl(slide) {
  const spans = [...slide.querySelectorAll('span[data-src]')];
  if (spans.length) {
    const ranked = spans.map((s) => {
      const mw = (s.getAttribute('data-media') || '').match(/min-width:\s*(\d+)/);
      return { src: s.getAttribute('data-src'), w: mw ? parseInt(mw[1], 10) : 0 };
    }).sort((a, b) => b.w - a.w);
    if (ranked[0].src) return ranked[0].src;
  }
  const sources = [...slide.querySelectorAll('picture source[srcset]')];
  if (sources.length) {
    const ranked = sources.map((s) => {
      const mw = (s.getAttribute('media') || '').match(/min-width:\s*(\d+)/);
      return { src: s.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0], w: mw ? parseInt(mw[1], 10) : 0 };
    }).sort((a, b) => b.w - a.w);
    if (ranked[0].src) return ranked[0].src;
  }
  const img = slide.querySelector('img[src]');
  if (img) return img.getAttribute('src');
  const bgEl = slide.querySelector('[style*="background-image"]');
  return bgUrl(bgEl);
}

// Mobile (imageM, min-width:320px) source: imageM by name, else smallest min-width span / <picture> source.
function mobileImageUrl(slide) {
  const candidates = [
    ...[...slide.querySelectorAll('span[data-src]')].map((s) => ({
      src: s.getAttribute('data-src'), media: s.getAttribute('data-media') || '',
    })),
    ...[...slide.querySelectorAll('picture source[srcset]')].map((s) => ({
      src: s.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0], media: s.getAttribute('media') || '',
    })),
  ].filter((c) => c.src);
  if (!candidates.length) return '';
  const byName = candidates.find((c) => /\/imageM\./.test(c.src));
  if (byName) return byName.src;
  const ranked = candidates.map((c) => {
    const mw = c.media.match(/min-width:\s*(\d+)/);
    return { src: c.src, w: mw ? parseInt(mw[1], 10) : 0 };
  }).sort((a, b) => a.w - b.w);
  return ranked[0].src;
}

// Derive a short descriptive label from the destination path, e.g.
// /content/alc/en/play-online/instant-win-games/carnival-curse.html -> "Carnival Curse"
function labelFromHref(href) {
  try {
    const url = new URL(href, ORIGIN);
    const seg = url.pathname.split('/').filter(Boolean).pop() || '';
    const name = seg.replace(/\.html$/, '').replace(/^lottomax$/i, 'lotto max').replace(/[-_]+/g, ' ').trim();
    if (!name) return '';
    return name.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch (e) {
    return '';
  }
}

export default function parse(element, { document }) {
  // Real slides only: li.slide in the slides list (carousel does not clone, but dedupe by id/href anyway)
  let slides = [...element.querySelectorAll('article.fca-carousel-slide-promo')];
  if (!slides.length) slides = [...element.querySelectorAll('li.slide, .slide')];

  const seen = new Set();
  const cells = [];

  slides.forEach((slide) => {
    if (slide.closest('.slick-cloned, .cloned, [aria-hidden="true"].clone')) return;
    const link = slide.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : '';
    const src = desktopImageUrl(slide);
    const key = slide.id || `${href}|${src}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (!src && !href) return;

    const existingImg = slide.querySelector('img[alt]');
    const label = (existingImg && existingImg.getAttribute('alt').trim())
      || labelFromHref(href)
      || 'Learn more';

    const imgCell = [];
    if (src) {
      const img = document.createElement('img');
      img.src = absolutize(src);
      img.alt = label;
      imgCell.push(img);
      // Second image: mobile crop (imageM) with the text arranged for small screens
      // span[data-src] may be stripped in the import pipeline: derive imageM from the
      // desktop/tablet rendition URL (AEM serves it regardless of the timestamp suffix).
      let mobileSrc = absolutize(mobileImageUrl(slide));
      if (!/\/imageM\.img\./.test(mobileSrc)) {
        const derived = img.src.replace(/\/image[DT]\.img\./, '/imageM.img.');
        if (derived !== img.src) mobileSrc = derived;
      }
      if (mobileSrc && mobileSrc !== img.src) {
        const mImg = document.createElement('img');
        mImg.src = mobileSrc;
        mImg.alt = label;
        imgCell.push(mImg);
      }
    }

    const linkCell = [];
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      linkCell.push(a);
    }

    cells.push([imgCell.length ? imgCell : '', linkCell.length ? linkCell : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-promo', cells });
  element.replaceWith(block);
}
