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

export default function parse(element, { document }) {
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
