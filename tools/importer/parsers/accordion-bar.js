/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-bar. Base: accordion.
 * Source: https://www.alc.ca/content/alc/en/our-games/scratch-n-win/4099.html
 * Selector: div.panel-group#accordion
 *
 * Source structure (validated in block-context/accordion-bar/source*.html):
 *   div.panel-group#accordion
 *     div.panel (repeating)
 *       .panel-heading .panel-title a     "How to play this card"
 *       .panel-collapse .panel-body       rich text (p, b, br, lists)
 *
 * Output: one row per panel: cell 1 = title text, cell 2 = body content.
 */
function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

const ORIGIN = 'https://www.alc.ca';
const CONTAINER = '.alc-container, .cmp-container, .aem-Grid, .responsivegrid, .container, .xf-content-height, '
  + '.experiencefragment, .cmp-experiencefragment';

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function strongLinkParagraph(document, a) {
  const href = a.getAttribute('href');
  const text = clean(a.textContent) || a.getAttribute('title') || '';
  if (!href || href === '#' || !text) return null;
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const link = document.createElement('a');
  link.href = absolutize(href);
  link.textContent = text;
  strong.append(link);
  p.append(strong);
  return p;
}

function imgFrom(document, imgEl) {
  const src = imgEl && (imgEl.getAttribute('src') || '').trim();
  if (!src) return null;
  const img = document.createElement('img');
  img.src = absolutize(src);
  img.alt = imgEl.getAttribute('alt') || '';
  return img;
}

/**
 * Flatten AEM core-component content (containers, text, title, image, button, teaser, embed)
 * into plain default content so no block or layout wrapper ends up nested in a cell.
 */
function flatten(document, root) {
  const out = [];
  // empty links (an icon <a> whose image was dropped, <a><br></a>) would import as "[](url)"
  root.querySelectorAll('a').forEach((a) => {
    if (!clean(a.textContent) && !a.querySelector('img')) a.remove();
  });
  const visit = (el) => {
    if (el.nodeType === 3) {
      if (clean(el.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(el.textContent);
        out.push(p);
      }
      return;
    }
    if (el.nodeType !== 1) return;
    if (el.matches('script, style, noscript, .separator, .cmp-separator, hr')) return;
    if (el.matches('.cmp-text, .text-area')) {
      [...el.children].forEach((c) => {
        if (!clean(c.textContent) && !c.querySelector('img, table')) return;
        out.push(c);
      });
      return;
    }
    if (el.matches('.cmp-title')) {
      const h = el.querySelector('h1, h2, h3, h4, h5, h6');
      if (h && clean(h.textContent)) {
        const nh = document.createElement(/^H[12]$/.test(h.tagName) ? 'h3' : h.tagName.toLowerCase());
        nh.textContent = clean(h.textContent);
        out.push(nh);
      }
      return;
    }
    if (el.matches('.cmp-image, .image')) {
      const img = imgFrom(document, el.querySelector('img'));
      if (img) out.push(img);
      return;
    }
    if (el.matches('.alc-button, .cmp-button, .dynamic-cta, .cmp-dynamic-cta')) {
      el.querySelectorAll('a[href]').forEach((a) => {
        const p = strongLinkParagraph(document, a);
        if (p) out.push(p);
      });
      return;
    }
    if (el.matches('.cmp-teaser')) {
      const img = imgFrom(document, el.querySelector('.cmp-teaser__image img'));
      if (img) out.push(img);
      const title = clean(el.querySelector('.cmp-teaser__title') && el.querySelector('.cmp-teaser__title').textContent);
      if (title) {
        const h = document.createElement('h4');
        h.textContent = title;
        out.push(h);
      }
      const desc = el.querySelector('.cmp-teaser__description');
      if (desc) [...desc.children].forEach((c) => { if (clean(c.textContent)) out.push(c); });
      el.querySelectorAll('.cmp-teaser__action-container a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || href === '#' || !clean(a.textContent)) return;
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = absolutize(href);
        link.textContent = clean(a.textContent);
        p.append(link);
        out.push(p);
      });
      return;
    }
    if (el.matches('.cmp-embed')) {
      const f = el.querySelector('iframe[src]');
      const m = f && f.getAttribute('src').match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
      const href = m ? `https://www.youtube.com/watch?v=${m[1]}` : (f ? absolutize(f.getAttribute('src')) : '');
      if (href) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = href;
        a.textContent = href;
        p.append(a);
        out.push(p);
      }
      return;
    }
    if (el.matches(CONTAINER) || (el.tagName === 'DIV' && el.children.length && !el.matches('p'))) {
      [...el.childNodes].forEach(visit);
      return;
    }
    if (clean(el.textContent) || el.querySelector('img, table') || el.tagName === 'IMG') out.push(el);
  };
  [...root.childNodes].forEach(visit);
  return out;
}

// AEM core accordion: .cmp-accordion > .cmp-accordion__item > (h3 .cmp-accordion__title, .cmp-accordion__panel)
function parseCoreAccordion(element, document) {
  const cells = [];
  [...element.querySelectorAll(':scope > .cmp-accordion__item')].forEach((item) => {
    const titleEl = item.querySelector(':scope > .cmp-accordion__header .cmp-accordion__title')
      || item.querySelector('.cmp-accordion__title, .cmp-accordion__button');
    const title = clean(titleEl && titleEl.textContent);
    if (!title) return;
    const panel = item.querySelector(':scope > .cmp-accordion__panel') || item.querySelector('.cmp-accordion__panel');
    const body = panel ? flatten(document, panel) : [];
    cells.push([title, body.length ? body : '']);
  });
  return cells;
}

export default function parse(element, { document }) {
  if (element.matches('.cmp-accordion')) {
    const coreCells = parseCoreAccordion(element, document);
    if (!coreCells.length) {
      element.remove();
      return;
    }
    const coreBlock = WebImporter.Blocks.createBlock(document, { name: 'accordion-bar', cells: coreCells });
    element.replaceWith(coreBlock);
    return;
  }

  const cells = [];

  const panels = [...element.querySelectorAll(':scope > .panel')];
  panels.forEach((panel) => {
    const titleEl = panel.querySelector('.panel-title') || panel.querySelector('.panel-heading');
    const title = clean(titleEl && titleEl.textContent);
    if (!title) return;

    const bodyEl = panel.querySelector('.panel-body') || panel.querySelector('.panel-collapse');
    const body = [];
    if (bodyEl) {
      [...bodyEl.children].forEach((child) => {
        if (!clean(child.textContent) && !child.querySelector('img')) return;
        body.push(child);
      });
      // Body with bare text and no element children: wrap in a paragraph
      if (!body.length && clean(bodyEl.textContent)) {
        const p = document.createElement('p');
        p.textContent = clean(bodyEl.textContent);
        body.push(p);
      }
    }

    cells.push([title, body]);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-bar', cells });
  element.replaceWith(block);
}
