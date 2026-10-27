/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards.
 * Source: https://www.alc.ca/content/alc/en/corporate/playwise/player-tools.html
 * Selector: the AEM layout grid that directly holds the card teasers, e.g.
 *   .aem-Grid:has(> .teaser.cmp-teaser--tile, > .teaser.cmp-teaser--vertical-wide, ...)
 *
 * Source structure (validated in migration-work/census + live renders):
 *   .aem-Grid
 *     [.title / .text / .separator ...]               (other grid children, left in place)
 *     .teaser.cmp-teaser--{tile|vertical-wide|vertical-square|card|tile-button|icon-left} (run)
 *       .cmp-teaser > [a.cmp-teaser__link >] .cmp-teaser__content
 *          .cmp-teaser__pretitle, .cmp-teaser__title (h1/h2), .cmp-teaser__description (p...),
 *          .cmp-teaser__action-container a.cmp-teaser__action-link
 *        .cmp-teaser__image img
 *     .information-card > .alc-information-card       (contact-us)
 *        __image-wrapper img, h3__title, p__description, __text-box p, a__button
 *
 * Each run of consecutive card items (empty separators / empty text between them are skipped)
 * becomes ONE cards-feature block: one row per card, [image | H3 + text + link].
 * When the run is the only content of the grid, the grid itself is replaced.
 */
const ORIGIN = 'https://www.alc.ca';
const ITEM = '.teaser.cmp-teaser--tile, .teaser.cmp-teaser--vertical-wide, .teaser.cmp-teaser--vertical-square, '
  + '.teaser.cmp-teaser--card, .teaser.cmp-teaser--tile-button, .teaser.cmp-teaser--icon-left, .information-card';
// Generic teasers (default / list / list-icon) laid out in a multi-column grid row are cards too,
// but only when at least two sit side by side; horizontal teasers belong to columns-media.
const GENERIC = '.teaser[class*="aem-GridColumn--default--"]:not(.aem-GridColumn--default--12, '
  + '.cmp-teaser--horizontal-left, .cmp-teaser--horizontal-right, .cmp-teaser--quiz, .cmp-teaser--rewards)';
const ANY_ITEM = `${ITEM}, ${GENERIC}`;

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (/^(https?:|mailto:|tel:|data:)/i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function isSkippable(el) {
  // <hr> here is a section break inserted by the sections transformer: it ends a run
  if (el.tagName === 'HR' || el.matches('.section-metadata')) return false;
  if (el.matches('.separator, .cmp-separator')) return true;
  if (el.querySelector('img, iframe, video, picture')) return false;
  return !clean(el.textContent);
}

// Runs of consecutive item children of the grid
function findRuns(grid, itemSelector) {
  const runs = [];
  let current = null;
  let pending = [];
  [...grid.children].forEach((child) => {
    if (child.matches(itemSelector)) {
      if (!current) {
        current = { items: [], nodes: [] };
        runs.push(current);
      } else {
        current.nodes.push(...pending);
      }
      pending = [];
      current.items.push(child);
      current.nodes.push(child);
    } else if (current && isSkippable(child)) {
      pending.push(child);
    } else {
      current = null;
      pending = [];
    }
  });
  return runs;
}

// The single YouTube/Vimeo video in an on-page modal, for "#" CTAs that open it
function modalVideoUrl(document) {
  const frames = [...document.querySelectorAll('.alc-modal iframe[src], .modal iframe[src]')]
    .map((f) => f.getAttribute('src'))
    .filter((s) => /youtube|youtu\.be|vimeo/i.test(s || ''));
  const unique = [...new Set(frames)];
  if (unique.length !== 1) return '';
  const src = absolutize(unique[0]);
  const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/i);
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
  const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vm) return `https://vimeo.com/${vm[1]}`;
  return src.split('?')[0];
}

function makeLink(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

function resolveHref(document, a) {
  const raw = (a.getAttribute('href') || '').trim();
  if (!raw || raw === '#' || /^javascript:/i.test(raw)) return modalVideoUrl(document);
  return absolutize(raw);
}

function imageFrom(document, el, fallbackAlt) {
  const imgEl = [...el.querySelectorAll('img')].find((i) => (i.getAttribute('src') || '').trim() && !i.closest('.cmp-favourite-button'));
  if (!imgEl) return null;
  const img = document.createElement('img');
  img.src = absolutize(imgEl.getAttribute('src'));
  img.alt = imgEl.getAttribute('alt') || fallbackAlt || '';
  const w = imgEl.getAttribute('width');
  const h = imgEl.getAttribute('height');
  if (w) img.setAttribute('width', w);
  if (h) img.setAttribute('height', h);
  return img;
}

// Drop <br> that only pad the start/end of a paragraph or bold run ("<b><br>$200,000<br>Name</b>")
function trimBreaks(root) {
  root.querySelectorAll('p, b, strong, span, em, i, u').forEach((el) => {
    const edge = (first) => {
      let n = first ? el.firstChild : el.lastChild;
      while (n && n.nodeType === 3 && !n.textContent.replace(/ /g, ' ').trim()) n = first ? n.nextSibling : n.previousSibling;
      return n;
    };
    let n = edge(true);
    while (n && n.nodeName === 'BR') { n.remove(); n = edge(true); }
    n = edge(false);
    while (n && n.nodeName === 'BR') { n.remove(); n = edge(false); }
  });
}

function richParagraphs(container) {
  const out = [];
  if (!container) return out;
  container.querySelectorAll('a').forEach((a) => {
    if (!clean(a.textContent) && !a.querySelector('img')) {
      a.remove();
      return;
    }
    const href = a.getAttribute('href');
    if (href) a.setAttribute('href', resolveHref(container.ownerDocument, a) || href);
  });
  trimBreaks(container);
  [...container.children].forEach((child) => {
    if (!clean(child.textContent) && !child.querySelector('img')) return;
    child.removeAttribute('class');
    child.removeAttribute('style');
    out.push(child);
  });
  if (!out.length && clean(container.textContent)) {
    const p = container.ownerDocument.createElement('p');
    p.textContent = clean(container.textContent);
    out.push(p);
  }
  return bulletize(container.ownerDocument, out);
}

// "• item" paragraphs (or "• a<br>• b" lines in one paragraph) -> <ul><li>; consecutive ones merge
const BULLET_RE = /^[\s ]*[·•▪◦‣∙●]\s*/;
function bulletize(document, nodes) {
  const out = [];
  let ul = null;
  // first non-blank text node of a line (the one carrying the bullet glyph)
  const firstText = (lineNodes) => {
    for (const n of lineNodes) {
      if (n.nodeType === 3 && n.textContent.trim()) return n;
      if (n.nodeType === 1) {
        const walker = document.createTreeWalker(n, 4);
        for (let t = walker.nextNode(); t; t = walker.nextNode()) if (t.textContent.trim()) return t;
      }
    }
    return null;
  };
  const addLine = (lineNodes) => {
    const text = lineNodes.map((n) => n.textContent).join('');
    if (!clean(text) && !lineNodes.some((n) => n.nodeType === 1 && (n.matches('img') || n.querySelector('img')))) return;
    if (BULLET_RE.test(text)) {
      const t = firstText(lineNodes);
      if (t) t.textContent = t.textContent.replace(BULLET_RE, '');
      if (!ul) {
        ul = document.createElement('ul');
        out.push(ul);
      }
      const li = document.createElement('li');
      li.append(...lineNodes);
      ul.append(li);
    } else {
      ul = null;
      const p = document.createElement('p');
      p.append(...lineNodes);
      out.push(p);
    }
  };
  nodes.forEach((node) => {
    const hasBullet = node.tagName === 'P'
      && (BULLET_RE.test(node.textContent) || /<br[^>]*>\s*[·•▪◦‣∙●]/.test(node.innerHTML));
    if (!hasBullet) {
      ul = null;
      out.push(node);
      return;
    }
    let line = [];
    [...node.childNodes].forEach((n) => {
      if (n.nodeName === 'BR') {
        addLine(line);
        line = [];
      } else {
        line.push(n);
      }
    });
    addLine(line);
  });
  return out;
}

function parseTeaser(document, item) {
  const teaser = item.querySelector('.cmp-teaser') || item;
  const wrapLink = teaser.querySelector('a.cmp-teaser__link[href]');
  const titleEl = teaser.querySelector('.cmp-teaser__title');
  const title = clean(titleEl && titleEl.textContent);
  const image = imageFrom(document, teaser.querySelector('.cmp-teaser__image') || teaser, title);

  const body = [];
  const pretitle = clean(teaser.querySelector('.cmp-teaser__pretitle') && teaser.querySelector('.cmp-teaser__pretitle').textContent);
  if (pretitle) {
    const p = document.createElement('p');
    p.textContent = pretitle;
    body.push(p);
  }
  if (title) {
    const h3 = document.createElement('h3');
    const titleLink = (titleEl.querySelector('a[href]')) || wrapLink;
    const href = titleLink ? resolveHref(document, titleLink) : '';
    if (href) h3.append(makeLink(document, href, title));
    else h3.textContent = title;
    body.push(h3);
  }
  body.push(...richParagraphs(teaser.querySelector('.cmp-teaser__description')));
  teaser.querySelectorAll('.cmp-teaser__action-container a[href]').forEach((a) => {
    const text = clean(a.textContent);
    const href = resolveHref(document, a);
    if (!text || !href) return;
    if (body.some((n) => n.querySelector && n.querySelector(`a[href="${href}"]`) && clean(n.textContent) === text)) return;
    const p = document.createElement('p');
    p.append(makeLink(document, href, text));
    body.push(p);
  });
  // whole-card link without a title: keep it as a link paragraph
  if (!title && wrapLink) {
    const href = resolveHref(document, wrapLink);
    const text = clean(wrapLink.textContent);
    if (href && text) {
      const p = document.createElement('p');
      p.append(makeLink(document, href, text));
      body.push(p);
    }
  }
  return { image, body };
}

function parseInformationCard(document, item) {
  const card = item.querySelector('.alc-information-card') || item;
  const titleEl = card.querySelector('.alc-information-card__title');
  const title = clean(titleEl && titleEl.textContent);
  const image = imageFrom(document, card.querySelector('.alc-information-card__image-wrapper') || card, title);
  const body = [];
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title;
    body.push(h3);
  }
  card.querySelectorAll('.alc-information-card__description, .alc-information-card__text-box p').forEach((p) => {
    const text = clean(p.textContent);
    if (!text) return;
    const np = document.createElement('p');
    np.append(...p.childNodes);
    body.push(np);
  });
  card.querySelectorAll('a.alc-information-card__button, .alc-information-card__button-wrapper a').forEach((a) => {
    const text = clean(a.textContent);
    const href = resolveHref(document, a);
    if (!text || !href) return;
    if (body.some((n) => clean(n.textContent) === text)) return;
    const p = document.createElement('p');
    p.append(makeLink(document, href, text));
    body.push(p);
  });
  return { image, body };
}

function buildCells(document, items) {
  const cells = [];
  items.forEach((item) => {
    const { image, body } = item.querySelector('.alc-information-card') || item.matches('.alc-information-card')
      ? parseInformationCard(document, item)
      : parseTeaser(document, item);
    if (!image && !body.length) return;
    cells.push([image || '', body.length ? body : '']);
  });
  return cells;
}

export default function parse(element, { document }) {
  // Selector may point at a single item instead of its grid
  const runs = (element.matches(ANY_ITEM)
    ? [{ items: [element], nodes: [element] }]
    : findRuns(element, ANY_ITEM))
    // a lone generic teaser is a one-off promo, not a card set: leave it as default content
    .filter((run) => run.items.length > 1 || run.items.some((i) => i.matches(ITEM)));
  if (!runs.length) return;

  const meaningful = [...element.children].filter((c) => !isSkippable(c));
  const runCovers = runs.length === 1 && meaningful.every((c) => runs[0].nodes.includes(c));

  runs.forEach((run) => {
    const cells = buildCells(document, run.items);
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
    if (runCovers || element.matches(ANY_ITEM)) {
      element.replaceWith(block);
    } else {
      run.nodes[0].before(block);
      run.nodes.forEach((n) => n.remove());
    }
  });
}
