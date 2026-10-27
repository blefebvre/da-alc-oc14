/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns.
 * Source: https://www.alc.ca/content/alc/en/corporate/playwise/player-tools.html
 * Selectors (validated against migration-work/census/*.html and live renders):
 *   .aem-Grid:has(> .teaser.cmp-teaser--horizontal-left, > .teaser.cmp-teaser--horizontal-right)
 *     .teaser.cmp-teaser--horizontal-{left|right} > .cmp-teaser
 *        .cmp-teaser__content > .cmp-teaser__pretitle, .cmp-teaser__title (h2/h3),
 *          .cmp-teaser__description (p...), .cmp-teaser__action-container a
 *        .cmp-teaser__image img
 *   div:has(> .textimage)   (legacy text-image component, e.g. legal/terms-and-conditions)
 *     .textimage > .textimage-{left|right} img + .textimage-text p...
 *
 * Each run of consecutive items (separators / empty text between them are skipped) becomes
 * ONE columns-media block; one row per item with two cells, in visual order:
 *   horizontal-left / textimage-left   -> [image | text]   (image renders left)
 *   horizontal-right / textimage-right -> [text | image]   (image renders right)
 * Other grid children (titles, text, other teasers) are left in place for other parsers.
 */
const ORIGIN = 'https://www.alc.ca';
const ITEM = '.teaser.cmp-teaser--horizontal-left, .teaser.cmp-teaser--horizontal-right, .textimage';

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function isSkippable(el) {
  // <hr> here is a section break inserted by the sections transformer: it ends a run
  if (el.tagName === 'HR' || el.matches('.section-metadata')) return false;
  if (el.matches('.separator, .cmp-separator')) return true;
  if (el.querySelector('img, iframe, video, picture, table')) return false;
  return !clean(el.textContent);
}

function findRuns(parent) {
  const runs = [];
  let current = null;
  let pending = [];
  [...parent.children].forEach((child) => {
    if (child.matches(ITEM)) {
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

function imgSrc(imgEl) {
  let src = (imgEl.getAttribute('src') || '').trim();
  if (!src || src.startsWith('data:')) {
    const cmp = imgEl.closest('[data-cmp-src]');
    if (cmp) src = cmp.getAttribute('data-cmp-src').replace('{.width}', '');
  }
  if (!src || src.startsWith('data:')) {
    const set = (imgEl.getAttribute('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
    if (set.length) src = set[set.length - 1];
  }
  return src;
}

function imageFrom(document, root, fallbackAlt) {
  if (!root) return null;
  const imgEl = [...root.querySelectorAll('img')].find((i) => imgSrc(i));
  if (!imgEl) return null;
  const img = document.createElement('img');
  img.src = absolutize(imgSrc(imgEl));
  img.alt = imgEl.getAttribute('alt') || fallbackAlt || '';
  return img;
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

function resolveHref(document, a) {
  const raw = (a.getAttribute('href') || '').trim();
  if (!raw || raw === '#' || /^javascript:/i.test(raw)) return modalVideoUrl(document);
  return absolutize(raw);
}

function makeLink(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

// Rich-text children; links absolutized, empty spacer paragraphs and empty links dropped
function richChildren(document, container) {
  const out = [];
  if (!container) return out;
  container.querySelectorAll('a').forEach((a) => {
    if (!clean(a.textContent) && !a.querySelector('img')) {
      a.remove();
      return;
    }
    const href = a.getAttribute('href');
    if (href) a.setAttribute('href', resolveHref(document, a) || href);
  });
  [...container.children].forEach((child) => {
    if (!clean(child.textContent) && !child.querySelector('img')) return;
    child.removeAttribute('class');
    child.removeAttribute('style');
    out.push(child);
  });
  if (!out.length && clean(container.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(container.textContent);
    out.push(p);
  }
  return out;
}

function parseTeaser(document, item) {
  const teaser = item.querySelector('.cmp-teaser') || item;
  const wrapLink = teaser.querySelector('a.cmp-teaser__link[href]');
  const titleEl = teaser.querySelector('.cmp-teaser__title');
  const title = clean(titleEl && titleEl.textContent);
  const image = imageFrom(document, teaser.querySelector('.cmp-teaser__image'), title);

  const text = [];
  const pretitleEl = teaser.querySelector('.cmp-teaser__pretitle');
  if (pretitleEl && clean(pretitleEl.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(pretitleEl.textContent);
    text.push(p);
  }
  if (title) {
    const level = titleEl && /^H[2-4]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : 'h3';
    const h = document.createElement(level);
    const titleLink = (titleEl.querySelector('a[href]')) || wrapLink;
    const href = titleLink ? resolveHref(document, titleLink) : '';
    if (href) h.append(makeLink(document, href, title));
    else h.textContent = title;
    text.push(h);
  }
  text.push(...richChildren(document, teaser.querySelector('.cmp-teaser__description')));
  teaser.querySelectorAll('.cmp-teaser__action-container a[href]').forEach((a) => {
    const label = clean(a.textContent);
    const href = resolveHref(document, a);
    if (!label || !href) return;
    const p = document.createElement('p');
    p.append(makeLink(document, href, label));
    text.push(p);
  });
  const imageFirst = item.matches('.cmp-teaser--horizontal-left');
  return { image, text, imageFirst };
}

function parseTextImage(document, item) {
  const left = item.querySelector('.textimage-left');
  const right = item.querySelector('.textimage-right');
  const image = imageFrom(document, left || right || item, '');
  const text = richChildren(document, item.querySelector('.textimage-text'));
  return { image, text, imageFirst: !right };
}

function buildCells(document, items) {
  const cells = [];
  items.forEach((item) => {
    const { image, text, imageFirst } = item.matches('.textimage') ? parseTextImage(document, item) : parseTeaser(document, item);
    if (!image && !text.length) return;
    const textCell = text.length ? text : '';
    const imageCell = image || '';
    cells.push(imageFirst ? [imageCell, textCell] : [textCell, imageCell]);
  });
  return cells;
}

export default function parse(element, { document }) {
  const runs = element.matches(ITEM)
    ? [{ items: [element], nodes: [element] }]
    : findRuns(element);
  if (!runs.length) return;

  const meaningful = [...element.children].filter((c) => !isSkippable(c));
  const runCovers = runs.length === 1 && meaningful.every((c) => runs[0].nodes.includes(c));

  runs.forEach((run) => {
    const cells = buildCells(document, run.items);
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
    if (runCovers || element.matches(ITEM)) {
      element.replaceWith(block);
    } else {
      run.nodes[0].before(block);
      run.nodes.forEach((n) => n.remove());
    }
  });
}
