/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed. Base: embed (video).
 * Source: https://www.alc.ca/content/alc/en/rewards.html
 * Selectors (validated on live renders: rewards, our-games/mega360,
 * corporate/about-atlantic-lottery/career-opportunities):
 *   .cmp-embed (AEM core embed)        > iframe[src="https://www.youtube.com/embed/<id>?origin=..."]
 *   .youtube-holder (legacy component)  > iframe[src="https://www.youtube.com/embed/<id>?rel=0"]
 *   (either may instead carry a Vimeo player iframe or a plain video link)
 *
 * Output (block library contract): one row, one cell = optional poster image + link to the
 * canonical video URL (https://www.youtube.com/watch?v=<id> / https://vimeo.com/<id>).
 */
const ORIGIN = 'https://www.alc.ca';

function clean(text) {
  return (text || '').replace(/[​-‍﻿]/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (/^(https?:|data:)/i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function canonicalVideoUrl(src) {
  const url = absolutize(src);
  const yt = url.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([^?&/#]+)/i)
    || url.match(/youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/i)
    || url.match(/youtu\.be\/([^?&/#]+)/i);
  if (yt) {
    const start = url.match(/[?&](?:start|t)=(\d+)/);
    return `https://www.youtube.com/watch?v=${yt[1]}${start ? `&t=${start[1]}` : ''}`;
  }
  const vm = url.match(/player\.vimeo\.com\/video\/(\d+)(?:\?(?:.*&)?h=([\da-f]+))?/i) || url.match(/vimeo\.com\/(\d+)(?:\/([\da-f]+))?/i);
  if (vm) return `https://vimeo.com/${vm[1]}${vm[2] ? `/${vm[2]}` : ''}`;
  return url;
}

/**
 * Rich text authored on the embed component (.cmp-embed__rte, e.g. promos/proline/fall-multisport
 * "How to Play Spreads and Totals" h2 rendered under each video): kept as default content after
 * the block, in source order. Inline styles/classes are dropped; links absolutized.
 */
function captionContent(element) {
  const out = [];
  element.querySelectorAll('.cmp-embed__rte').forEach((rte) => {
    rte.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absolutize(a.getAttribute('href'))));
    rte.querySelectorAll('[style], [class]').forEach((el) => {
      el.removeAttribute('style');
      el.removeAttribute('class');
    });
    [...rte.children].forEach((child) => {
      if (!clean(child.textContent) && !child.querySelector('img')) return;
      out.push(child);
    });
  });
  return out;
}

export default function parse(element, { document }) {
  const captions = captionContent(element);
  const iframe = element.querySelector('iframe[src], iframe[data-src]');
  let href = '';
  let title = '';
  if (iframe) {
    href = canonicalVideoUrl(iframe.getAttribute('src') || iframe.getAttribute('data-src'));
    title = clean(iframe.getAttribute('title'));
  } else {
    const a = [...element.querySelectorAll('a[href]')].find((l) => /youtu|vimeo/i.test(l.getAttribute('href')));
    if (a) {
      href = canonicalVideoUrl(a.getAttribute('href'));
      title = clean(a.textContent);
    }
  }
  if (!href) {
    element.replaceWith(...captions);
    return;
  }

  const content = [];
  const posterEl = [...element.querySelectorAll('img[src]:not(iframe img)')].find((i) => !i.closest('.cmp-embed__rte'));
  if (posterEl) {
    const img = document.createElement('img');
    img.src = absolutize(posterEl.getAttribute('src'));
    img.alt = posterEl.getAttribute('alt') || '';
    content.push(img);
  }
  const link = document.createElement('a');
  link.href = href;
  // a generic iframe title ("youtube video") adds nothing over the URL
  link.textContent = title && !/^(youtube|vimeo)( video)?$/i.test(title) ? title : href;
  content.push(link);

  const cells = [[content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block, ...captions);
}
