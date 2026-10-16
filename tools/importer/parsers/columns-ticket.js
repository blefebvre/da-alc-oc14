/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-ticket. Base: columns.
 * Source: https://www.alc.ca/content/alc/en/our-games/scratch-n-win/4099.html
 * Selector: div.game-details-info > div.details
 *
 * Source structure (validated in block-context/columns-ticket/source*.html):
 *   div.details
 *     div.ticket-image
 *       .game-number                      "Game #4099"
 *       img[src]                          single rendition (no srcset)
 *     div.game-details
 *       p.top-prize  > span(label) + value   (value may be empty -> skipped)
 *       p.prizes     > span(label) + value
 *       p.chances    > span(label) + value
 *       div.top-prizes-remaining > a      (optional)
 *
 * Output: one row, two cells.
 *   Cell 1: <p>Game #n</p> + ticket image
 *   Cell 2: <p><strong>Label:</strong> value</p> per info line + optional link paragraph
 */
const ORIGIN = 'https://www.alc.ca';

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Pick the largest rendition from srcset if present, else src. */
function bestSrc(img) {
  const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
  if (srcset) {
    let best = '';
    let bestW = -1;
    srcset.split(',').forEach((part) => {
      const [u, d] = part.trim().split(/\s+/);
      const w = d ? parseFloat(d) : 0;
      if (u && w > bestW) { best = u; bestW = w; }
    });
    if (best) return best;
  }
  return img.getAttribute('src') || img.getAttribute('data-src') || '';
}

export default function parse(element, { document }) {
  // ---- Cell 1: game number label + ticket image
  const mediaCell = [];
  const numEl = element.querySelector('.game-number');
  const gameNum = clean(numEl && numEl.textContent);
  if (gameNum) {
    const p = document.createElement('p');
    p.textContent = gameNum;
    mediaCell.push(p);
  }
  const srcImg = element.querySelector('.ticket-image img') || element.querySelector('img');
  if (srcImg) {
    const src = absolutize(bestSrc(srcImg));
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = srcImg.getAttribute('alt') || (gameNum ? `Ticket ${gameNum}` : '');
      mediaCell.push(img);
    }
  }

  // ---- Cell 2: info lines
  const infoCell = [];
  const details = element.querySelector('.game-details') || element;
  [...details.querySelectorAll(':scope > p')].forEach((srcP) => {
    const labelEl = srcP.querySelector('span, strong, b');
    const full = clean(srcP.textContent);
    // the importer may strip the label <span> before parsing: fall back to "Label: value" text
    const textMatch = full.match(/^([^:]{2,60}:)\s*(.*)$/);
    const label = clean(labelEl && labelEl.textContent) || (textMatch ? textMatch[1] : '');
    const value = label ? clean(full.slice(full.indexOf(label) + label.length)) : full;
    if (!value && !label) return; // keep labelled lines even without a value (source shows them)
    const p = document.createElement('p');
    if (label) {
      const strong = document.createElement('strong');
      strong.textContent = label;
      p.append(strong, document.createTextNode(` ${value}`));
    } else {
      p.textContent = value;
    }
    infoCell.push(p);
  });

  const linkEl = details.querySelector('.top-prizes-remaining a[href]');
  if (linkEl) {
    const text = clean(linkEl.textContent);
    if (text) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = linkEl.getAttribute('href');
      a.textContent = text;
      p.append(a);
      infoCell.push(p);
    }
  }

  if (!mediaCell.length && !infoCell.length) {
    element.remove();
    return;
  }

  const cells = [[mediaCell, infoCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-ticket', cells });
  element.replaceWith(block);
}
