/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-boxed. Base: tabs.
 * Source: https://www.alc.ca/content/alc/en/play-online/casino/10000-wolves-10k-ways.html
 * Selector: .cmp-tabs.cmp-tabs--alc
 *
 * Source structure (validated in block-context/tabs-boxed/source*.html):
 *   div.cmp-tabs
 *     ol.cmp-tabs__tablist > li.cmp-tabs__tab   ("How to Play", "Prizes & Odds")
 *     div.cmp-tabs__tabpanel (same order)       rich text: <p>, links to PDFs, <br>-separated lines
 *   Instant-win "How to Play" panels are one <p> with <br> lines, many starting with "·" / "•".
 *
 * Output: one row per tab: [label, panel content]. Bullet lines become <ul><li>,
 * empty (&nbsp;) paragraphs and empty links are dropped. Every tab is kept, even if its panel is empty.
 */
const BULLET_RE = /^\s*[·•▪◦‣∙●]\s*/;

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyNode(node) {
  if (node.nodeType === 3) return !clean(node.textContent);
  if (node.nodeType !== 1) return true;
  if (node.tagName === 'BR') return true;
  if (node.querySelector && node.querySelector('img, picture, video, iframe')) return false;
  if (node.tagName === 'IMG') return false;
  return !clean(node.textContent);
}

// Split a block element's children into lines on <br>.
function splitLines(el) {
  const lines = [[]];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'BR') lines.push([]);
    else lines[lines.length - 1].push(node);
  });
  return lines.filter((nodes) => nodes.some((n) => !isEmptyNode(n)));
}

function stripBullet(nodes) {
  const first = nodes.find((n) => !isEmptyNode(n));
  if (!first) return;
  if (first.nodeType === 3) {
    first.textContent = first.textContent.replace(BULLET_RE, '');
  } else {
    const walker = first.ownerDocument.createTreeWalker(first, 4);
    const t = walker.nextNode();
    if (t) t.textContent = t.textContent.replace(BULLET_RE, '');
  }
}

function lineStartsWithBullet(nodes) {
  const text = nodes.map((n) => n.textContent).join('');
  return BULLET_RE.test(text.replace(/^[\s ]+/, ''));
}

// Convert a <p> containing "· item<br>· item" lines into p/ul sequence.
function convertBulletParagraph(document, p) {
  const lines = splitLines(p);
  if (!lines.some(lineStartsWithBullet)) return [p];
  const out = [];
  let ul = null;
  lines.forEach((nodes) => {
    // Drop the newline left after each <br>
    if (nodes[0] && nodes[0].nodeType === 3) nodes[0].textContent = nodes[0].textContent.replace(/^\s+/, '');
    if (lineStartsWithBullet(nodes)) {
      stripBullet(nodes);
      if (!ul) {
        ul = document.createElement('ul');
        out.push(ul);
      }
      const li = document.createElement('li');
      li.append(...nodes);
      ul.append(li);
    } else {
      ul = null;
      const np = document.createElement('p');
      np.append(...nodes);
      out.push(np);
    }
  });
  return out;
}

function buildPanel(document, panel) {
  if (!panel) return [];
  // Drop empty links (e.g. <a href="..."><br> </a>) and empty paragraphs
  panel.querySelectorAll('a').forEach((a) => {
    if (!clean(a.textContent) && !a.querySelector('img')) a.remove();
  });
  const content = [];
  [...panel.children].forEach((child) => {
    if (isEmptyNode(child)) return;
    // Trim trailing <br> inside paragraphs
    if (child.tagName === 'P') {
      while (child.lastChild && isEmptyNode(child.lastChild)) child.lastChild.remove();
      content.push(...convertBulletParagraph(document, child));
    } else {
      content.push(child);
    }
  });
  // Loose text directly inside the panel (no wrapping <p>)
  if (!content.length && clean(panel.textContent)) {
    const p = document.createElement('p');
    p.append(...panel.childNodes);
    content.push(p);
  }
  return content;
}

export default function parse(element, { document }) {
  const cells = [];

  let tabs = [...element.querySelectorAll(':scope > .cmp-tabs__tablist > .cmp-tabs__tab')];
  if (!tabs.length) tabs = [...element.querySelectorAll('.cmp-tabs__tab')];
  let panels = [...element.querySelectorAll(':scope > .cmp-tabs__tabpanel')];
  if (!panels.length) panels = [...element.querySelectorAll('.cmp-tabs__tabpanel')];

  tabs.forEach((tab, i) => {
    const label = clean(tab.textContent);
    if (!label) return;
    const content = buildPanel(document, panels[i]);
    cells.push([label, content.length ? content : '']);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-boxed', cells });
  element.replaceWith(block);
}
