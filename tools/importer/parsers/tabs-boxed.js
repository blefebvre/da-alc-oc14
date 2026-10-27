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

function linkParagraph(document, href, text, strong) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = absolutize(href);
  a.textContent = text;
  if (strong) {
    const s = document.createElement('strong');
    s.append(a);
    p.append(s);
  } else {
    p.append(a);
  }
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

function videoHref(el) {
  const f = el.querySelector('iframe[src]');
  if (f) {
    const m = f.getAttribute('src').match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
    return m ? `https://www.youtube.com/watch?v=${m[1]}` : absolutize(f.getAttribute('src'));
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(el.id || '') && !/^embed-/.test(el.id)) return `https://www.youtube.com/watch?v=${el.id}`;
  return '';
}

/**
 * Flatten AEM core-component panel content (containers, text, title, image, button, teaser,
 * embed, nested accordion) into default content so no block/layout wrapper is nested in a cell.
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
    if (el.matches('script, style, noscript, .separator, .cmp-separator, hr, .cmp-favourite-button')) return;
    if (el.matches('.cmp-text')) {
      [...el.children].forEach((c) => {
        if (!clean(c.textContent) && !c.querySelector('img, table')) return;
        out.push(...(c.tagName === 'P' ? convertBulletParagraph(document, c) : [c]));
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
    if (el.matches('.cmp-image')) {
      const img = imgFrom(document, el.querySelector('img'));
      if (img) out.push(img);
      return;
    }
    if (el.matches('.alc-button, .cmp-button, .dynamic-cta, .cmp-dynamic-cta')) {
      el.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        const text = clean(a.textContent) || a.getAttribute('title');
        if (href && href !== '#' && text) out.push(linkParagraph(document, href, text, true));
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
      if (desc) {
        [...desc.children].forEach((c) => {
          if (!clean(c.textContent) && !c.querySelector('img')) return;
          out.push(...(c.tagName === 'P' ? convertBulletParagraph(document, c) : [c]));
        });
      }
      el.querySelectorAll('.cmp-teaser__action-container a[href]').forEach((a) => {
        const href = a.getAttribute('href');
        if (href && href !== '#' && clean(a.textContent)) out.push(linkParagraph(document, href, clean(a.textContent), false));
      });
      return;
    }
    if (el.matches('.cmp-embed')) {
      const href = videoHref(el);
      if (href) out.push(linkParagraph(document, href, href, false));
      return;
    }
    if (el.matches('.cmp-accordion')) {
      el.querySelectorAll(':scope > .cmp-accordion__item').forEach((item) => {
        const t = clean(item.querySelector('.cmp-accordion__title') && item.querySelector('.cmp-accordion__title').textContent);
        if (t) {
          const h = document.createElement('h4');
          h.textContent = t;
          out.push(h);
        }
        const panel = item.querySelector(':scope > .cmp-accordion__panel');
        if (panel) [...panel.childNodes].forEach(visit);
      });
      return;
    }
    if (el.matches(CONTAINER) || (el.tagName === 'DIV' && el.children.length)) {
      [...el.childNodes].forEach(visit);
      return;
    }
    if (clean(el.textContent) || el.querySelector('img, table') || el.tagName === 'IMG') out.push(el);
  };
  [...root.childNodes].forEach(visit);
  return out;
}

const CORE_CONTENT = '.alc-container, .cmp-container, .aem-Grid, .cmp-text, .cmp-teaser, .cmp-image, .cmp-embed, .cmp-accordion';

export default function parse(element, { document }) {
  const cells = [];

  let tabs = [...element.querySelectorAll(':scope > .cmp-tabs__tablist > .cmp-tabs__tab')];
  if (!tabs.length) tabs = [...element.querySelectorAll('.cmp-tabs__tab')];
  let panels = [...element.querySelectorAll(':scope > .cmp-tabs__tabpanel')];
  if (!panels.length) panels = [...element.querySelectorAll('.cmp-tabs__tabpanel')];

  tabs.forEach((tab, i) => {
    const label = clean(tab.textContent);
    if (!label) return;
    // Core-component panels (content pages) hold nested containers/components: flatten them.
    // Game-detail panels (.cmp-tabs--alc rich text) keep the original paragraph handling.
    const panel = panels[i];
    const content = panel && panel.querySelector(CORE_CONTENT)
      ? flatten(document, panel)
      : buildPanel(document, panel);
    cells.push([label, content.length ? content : '']);
  });

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-boxed', cells });
  element.replaceWith(block);
}
