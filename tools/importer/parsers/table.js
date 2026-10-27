/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table. Base: table.
 * Source: https://www.alc.ca/content/alc/en/our-games/scratch-n-win/top-prizes-remaining.html
 * Selectors (validated against migration-work/census/*.html):
 *   .cmp-text table        (rich-text tables, e.g. promos/scratch/celebrate-share, media-room)
 *   .table.parbase table   (legacy table component, e.g. top-prizes-remaining: <th> header row)
 *   Tables inside accordions / tabs are left to those parsers.
 *
 * Output (block library contract): header row first (from <thead>, a row of <th>, or a first row
 * whose cells are entirely bold), then one row per data row. Every row is padded to the same
 * column count (colspan expanded with empty cells). Tables without a recognisable header row
 * use the "no-header" option.
 */
const ORIGIN = 'https://www.alc.ca';

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

function isBoldOnly(cell) {
  const text = clean(cell.textContent);
  if (!text) return true;
  const bold = [...cell.querySelectorAll('b, strong, h1, h2, h3, h4, h5, h6')].map((b) => clean(b.textContent)).join(' ');
  return clean(bold) === text;
}

// Cell content: inline markup kept, presentational attributes dropped, links/images absolutized
function cellContent(document, cell, isHeader) {
  const frag = document.createElement('div');
  frag.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
  frag.querySelectorAll('[style], [class], [width], [height], [bgcolor], [align]').forEach((el) => {
    ['style', 'class', 'width', 'height', 'bgcolor', 'align'].forEach((a) => el.removeAttribute(a));
  });
  frag.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absolutize(a.getAttribute('href'))));
  frag.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) img.setAttribute('src', absolutize(src));
  });
  if (isHeader) {
    // header text is styled by the block; drop redundant bold wrappers
    frag.querySelectorAll('b, strong').forEach((b) => b.replaceWith(...b.childNodes));
  }
  // drop empty paragraphs / trailing <br>
  frag.querySelectorAll('p').forEach((p) => {
    if (!clean(p.textContent) && !p.querySelector('img, a')) p.remove();
  });
  while (frag.lastChild && (frag.lastChild.nodeName === 'BR' || (frag.lastChild.nodeType === 3 && !frag.lastChild.textContent.trim()))) {
    frag.lastChild.remove();
  }
  if (!clean(frag.textContent) && !frag.querySelector('img')) return '';
  const nodes = [...frag.childNodes];
  // collapse whitespace-only text runs
  nodes.forEach((n) => {
    if (n.nodeType === 3) n.textContent = n.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ');
  });
  return nodes;
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) return;

  const rows = [...table.rows].filter((tr) => tr.closest('table') === table);
  if (!rows.length) {
    element.remove();
    return;
  }

  const headIdx = (() => {
    const first = rows[0];
    const cells = [...first.cells];
    if (first.parentElement && first.parentElement.tagName === 'THEAD') return 0;
    if (cells.length && cells.every((c) => c.tagName === 'TH')) return 0;
    if (rows.length > 1 && cells.length > 1 && cells.every((c) => isBoldOnly(c)) && cells.some((c) => clean(c.textContent))
      && !first.querySelector('img')) return 0;
    return -1;
  })();

  const width = Math.max(...rows.map((tr) => [...tr.cells].reduce((n, c) => n + (parseInt(c.getAttribute('colspan'), 10) || 1), 0)));

  const cells = [];
  rows.forEach((tr, i) => {
    const row = [];
    [...tr.cells].forEach((c) => {
      row.push(cellContent(document, c, i === headIdx));
      const span = parseInt(c.getAttribute('colspan'), 10) || 1;
      for (let s = 1; s < span; s += 1) row.push('');
    });
    while (row.length < width) row.push('');
    if (row.every((c) => c === '')) return;
    cells.push(row);
  });
  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'table',
    variants: headIdx === 0 ? [] : ['no-header'],
    cells,
  });
  element.replaceWith(block);
}
