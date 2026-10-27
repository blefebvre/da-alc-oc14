/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://www.alc.ca/content/alc/en/corporate/playwise/player-tools.html
 * Selectors (validated against migration-work/census/*.html and live renders):
 *   .alc-container.cmp-container--pw-content-hero-padding   (PlayWise / legal content pages)
 *     > .cmp-container[style="background-image:url(\2f content\2f dam...)"]
 *       .breadcrumb (dropped), .title h1
 *   .alc-container.cmp-container--pw-landing-hero-padding   (PlayWise landing)
 *     > .cmp-container[style="background-color:..."]
 *       .breadcrumb (dropped), .image img (logo), .title h1, .text p
 *   div.hero:has(.hero-row)                                  (legacy .online-corporate-detail hero
 *       and core-page hero component)
 *     .corp-menu-container (dropped), .hero-row > .hero-image[style="background-image:url(...)"]
 *       .text-area > h1.light-text, p.light-text, a.button
 *
 * Output (block library contract): row 1 = background image (optional),
 * row 2 = H1 + optional subtitle paragraph(s) + optional CTA link (optional).
 */
const ORIGIN = 'https://www.alc.ca';

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (/^(https?:|data:)/i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

// Decode CSS escapes such as "\2f content\2f dam" -> "/content/dam"
function cssUnescape(value) {
  return value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');
}

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
  return m && m[1] ? cssUnescape(m[1]).trim() : '';
}

function makeImg(document, src, alt) {
  const img = document.createElement('img');
  img.src = absolutize(src);
  img.alt = alt || '';
  return img;
}

export default function parse(element, { document }) {
  const isLegacy = element.matches('.hero') || !!element.querySelector('.hero-row');

  // ---- Row 1: background image
  let image = null;
  if (isLegacy) {
    const holder = element.querySelector('.hero-row .hero-image') || element.querySelector('.hero-image');
    const src = bgUrl(holder)
      || (holder && holder.querySelector('[data-media*="1200"][data-src]') && holder.querySelector('[data-media*="1200"][data-src]').getAttribute('data-src'))
      || (holder && holder.querySelector('[data-src]') && holder.querySelector('[data-src]').getAttribute('data-src'));
    if (src) image = makeImg(document, src, '');
  } else {
    const styled = [element, ...element.querySelectorAll('[style*="background"]')].find((el) => bgUrl(el));
    if (styled) {
      image = makeImg(document, bgUrl(styled), '');
    } else {
      const imgEl = [...element.querySelectorAll('.image img, .cmp-image img, img')]
        .find((i) => !i.closest('.cmp-breadcrumb') && (i.getAttribute('src') || '').trim());
      if (imgEl) image = makeImg(document, imgEl.getAttribute('src'), imgEl.getAttribute('alt') || '');
    }
  }

  // ---- Row 2: H1 + subtitle + CTA
  const content = [];
  const scope = isLegacy ? (element.querySelector('.hero-row .text-area') || element.querySelector('.text-area')) : element;
  if (scope) {
    const h = [...scope.querySelectorAll('h1, h2')].find((el) => !el.closest('.cmp-breadcrumb, .corp-menu-container') && clean(el.textContent));
    if (h) {
      const h1 = document.createElement('h1');
      h1.textContent = clean(h.textContent);
      content.push(h1);
    }
    const paras = isLegacy
      ? [...scope.querySelectorAll('p')]
      : [...scope.querySelectorAll('.text .cmp-text > p, .text .cmp-text > ul, .text .cmp-text > ol')];
    paras.forEach((p) => {
      if (!clean(p.textContent)) return;
      if (p.closest('.cmp-breadcrumb, .corp-menu-container')) return;
      p.removeAttribute('class');
      p.removeAttribute('style');
      content.push(p);
    });
    const ctas = [...scope.querySelectorAll('a.button, a.arrow-button, .cmp-button, .alc-button a')]
      .filter((a) => a.getAttribute('href') && clean(a.textContent));
    ctas.forEach((a) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const link = document.createElement('a');
      link.href = absolutize(a.getAttribute('href'));
      link.textContent = clean(a.textContent);
      strong.append(link);
      p.append(strong);
      content.push(p);
    });
  }

  if (!image && !content.length) {
    element.remove();
    return;
  }

  const cells = [];
  if (image) cells.push([image]);
  if (content.length) cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
