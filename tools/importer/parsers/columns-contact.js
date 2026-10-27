/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-contact. Base: columns.
 * Source: https://www.alc.ca/content/alc/en/corporate/playwise/player-tools.html
 * Selector (validated against migration-work/census/*.html and live renders):
 *   .cmp-experiencefragment--gambling-helplines .aem-Grid:has(> .text.cmp-text--desktop-alignment-center)
 *     .title (h2 "Gambling Supports")            -> left in place (default content)
 *     .text #text-body / #text-body-mobile        -> left in place (default content)
 *     .text.cmp-text--desktop-alignment-center    (one per province helpline, a run)
 *        .cmp-text > p > b "Nova Scotia" <br> "1-888-429-8167 (...)"
 *
 * Output: ONE row, one cell per helpline column: bold province label + number line(s).
 */
const ORIGIN = 'https://www.alc.ca';
const ITEM = '.text.cmp-text--desktop-alignment-center';

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
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
  // <hr> here is a section break inserted by the sections transformer: keep it
  if (el.tagName === 'HR' || el.matches('.section-metadata')) return false;
  if (el.matches('.separator, .cmp-separator')) return true;
  if (el.querySelector('img, iframe, table')) return false;
  return !clean(el.textContent);
}

/**
 * Normalise one helpline cell: "<b>Label</b><br>number" -> <p><strong>Label</strong></p><p>number</p>
 * Other markup (links, extra lines) is preserved as paragraphs split on <br>.
 */
function helplineCell(document, item) {
  const text = item.querySelector('.cmp-text') || item;
  const out = [];
  [...text.children].forEach((block) => {
    if (!clean(block.textContent)) return;
    if (block.tagName !== 'P') {
      block.removeAttribute('class');
      block.removeAttribute('style');
      out.push(block);
      return;
    }
    let p = document.createElement('p');
    const flush = () => {
      if (clean(p.textContent) || p.querySelector('img')) out.push(p);
      p = document.createElement('p');
    };
    [...block.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.tagName === 'BR') {
        flush();
        return;
      }
      if (node.nodeType === 1 && /^(B|STRONG)$/.test(node.tagName)) {
        const strong = document.createElement('strong');
        strong.textContent = clean(node.textContent);
        if (strong.textContent) p.append(strong);
        return;
      }
      if (node.nodeType === 1 && node.tagName === 'A') {
        const a = document.createElement('a');
        a.href = absolutize(node.getAttribute('href'));
        a.textContent = clean(node.textContent);
        if (a.textContent) p.append(a);
        return;
      }
      const t = node.textContent.replace(/ /g, ' ');
      if (t.trim()) p.append(document.createTextNode(p.childNodes.length ? t : t.replace(/^\s+/, '')));
    });
    flush();
  });
  return out;
}

export default function parse(element, { document }) {
  const children = [...element.children];
  const items = children.filter((c) => c.matches(ITEM));
  if (!items.length) return;

  const row = items.map((item) => {
    const content = helplineCell(document, item);
    return content.length ? content : '';
  }).filter((c) => c !== '');
  if (!row.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-contact', cells: [row] });

  // Replace the helpline run only; the heading and intro text stay as default content.
  // Separators / empty spacers sitting between helpline columns go with it.
  const start = children.indexOf(items[0]);
  const end = children.indexOf(items[items.length - 1]);
  items[0].before(block);
  children.slice(start, end + 1).forEach((c) => {
    if (c.matches(ITEM) || isSkippable(c)) c.remove();
  });
}
