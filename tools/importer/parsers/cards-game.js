/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-game. Base: cards.
 * Source: https://www.alc.ca/content/alc/en.html
 * Selector: .alc-container.cmp-container--game-tiles
 *
 * Source structure (validated in block-context/cards-game/source.html):
 *   div.game-tile.parbase > article.game-tile
 *     .game-tile-image-container[style="background-image:url(...)"]
 *        [.jackpot-*] > .prize-bar (left amount) + .max-plus-bar (right text, optional)
 *        [.game-flag.new] "[new-en]" badge placeholder
 *     .game-tile-content
 *        h3.game-tile-title
 *        .game-tile-description > p (may contain a.read-more)
 *        div > p.next-jackpot-date, p.next-jackpot-prize | p.prize-info (often empty)
 *        a.button (CTA)
 *
 * Output: one row per tile -> [image (+ jackpot strip paragraph), body]
 */
const ORIGIN = 'https://www.alc.ca';

function absolutize(url) {
  if (!url) return '';
  const v = url.trim();
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/')) return `${ORIGIN}${v}`;
  return v;
}

function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
  return m && m[1] ? m[1] : '';
}

// Collapse whitespace, nbsp and zero-width characters.
function clean(text) {
  return (text || '')
    .replace(/[​-‍﻿]/g, '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function parse(element, { document }) {
  let tiles = [...element.querySelectorAll('article.game-tile')];
  if (!tiles.length) tiles = [...element.querySelectorAll('.game-tile')].filter((t) => !t.querySelector('.game-tile'));

  const cells = [];

  tiles.forEach((tile) => {
    const imageContainer = tile.querySelector('.game-tile-image-container');
    const content = tile.querySelector('.game-tile-content') || tile;

    // ---- Cell 1: image + optional jackpot strip
    const imageCell = [];
    const imgEl = imageContainer && imageContainer.querySelector('img[src]');
    const src = imgEl ? imgEl.getAttribute('src') : bgUrl(imageContainer);
    const titleEl = content.querySelector('h3.game-tile-title, .game-tile-title, h3, h2');
    const title = clean(titleEl && titleEl.textContent);
    if (src) {
      const img = document.createElement('img');
      img.src = absolutize(src);
      img.alt = (imgEl && imgEl.getAttribute('alt')) || title;
      imageCell.push(img);
    }

    const prizeBar = imageContainer && imageContainer.querySelector('.prize-bar');
    const left = clean(prizeBar && prizeBar.textContent);
    if (left) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      // Source renders "est." in a smaller <sub>: "$90,000,000 <sub>est.</sub>"
      const subEl = prizeBar.querySelector('sub');
      const subText = clean(subEl && subEl.textContent);
      if (subText) {
        const amount = clean([...prizeBar.childNodes]
          .filter((n) => n !== subEl)
          .map((n) => n.textContent)
          .join(' '));
        if (amount) strong.append(document.createTextNode(`${amount} `));
        const sub = document.createElement('sub');
        sub.textContent = subText;
        strong.append(sub);
      } else {
        strong.textContent = left;
      }
      p.append(strong);
      const rightEl = imageContainer.querySelector('.max-plus-bar, .gold-ball-bar, .prize-bar-right');
      // Join every child part (spans or bare text, in case spans were unwrapped) with a single
      // space so "+ 90" and "× $100,000" never collapse into "+ 90× $100,000".
      const joinParts = (el) => clean([...el.childNodes].map((n) => n.textContent).join(' '));
      let right = clean(rightEl && [...rightEl.querySelectorAll('span')].map((s) => s.textContent).join(' '));
      if (rightEl && !/^\+/.test(right)) {
        const full = joinParts(rightEl);
        if (/^\+/.test(full) || !right) right = full;
      }
      // Ensure a space before "×" / after the count (e.g. "+ 90×$100,000" -> "+ 90 × $100,000")
      right = clean(right.replace(/\s*×\s*/g, ' × ').replace(/^\+\s*/, '+ '));
      // "+ 90" may be bound late (Knockout/Vue) and missing: recover the count from
      // data attributes or nearby "90 x $100,000" copy on the tile/page.
      if (rightEl && rightEl.classList.contains('max-plus-bar') && right && !/^\+/.test(right)) {
        const attrCount = (rightEl.getAttribute('data-count') || rightEl.getAttribute('data-max-plus')
          || tile.getAttribute('data-max-plus') || '').trim();
        const prizeText = clean(rightEl.querySelector('.prize-text') && rightEl.querySelector('.prize-text').textContent) || right;
        const amountMatch = prizeText.match(/\$[\d,]+/);
        let count = /^\d+$/.test(attrCount) ? attrCount : '';
        if (!count && amountMatch) {
          const re = new RegExp(`(\\d+)\\s*[x×]\\s*\\${amountMatch[0]}`, 'i');
          const scopes = [tile.textContent, (document.body && document.body.textContent) || ''];
          scopes.some((t) => {
            const m = clean(t).match(re);
            if (m) count = m[1];
            return !!m;
          });
        }
        if (count) right = `+ ${count} ${right}`;
      }
      if (right) {
        p.append(document.createTextNode(' '));
        const em = document.createElement('em');
        em.textContent = right;
        p.append(em);
      }
      imageCell.push(p);
    }

    // ---- Cell 2: title, badge, description, draw info, CTA
    const body = [];
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }

    const flag = tile.querySelector('.game-flag.new, .game-flag');
    if (flag && (flag.classList.contains('new') || /new/i.test(flag.textContent))) {
      const p = document.createElement('p');
      p.textContent = 'New';
      body.push(p);
    }

    const descParas = [...content.querySelectorAll('.game-tile-description p')];
    if (descParas.length) {
      descParas.forEach((p) => { if (clean(p.textContent)) body.push(p); });
    } else {
      const desc = content.querySelector('.game-tile-description');
      if (desc && clean(desc.textContent)) {
        const p = document.createElement('p');
        p.append(...desc.childNodes);
        body.push(p);
      }
    }

    // Next-draw info paragraphs (outside description, excluding empty ones)
    [...content.querySelectorAll('p')]
      .filter((p) => !p.closest('.game-tile-description'))
      .forEach((p) => {
        const text = clean(p.textContent);
        if (!text) return;
        const np = document.createElement('p');
        np.textContent = text;
        body.push(np);
      });

    const cta = content.querySelector('a.button, a.arrow-button');
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = clean(cta.textContent) || cta.getAttribute('title') || 'Learn more';
      p.append(a);
      body.push(p);
    }

    if (!imageCell.length && !body.length) return;
    cells.push([imageCell.length ? imageCell : '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-game', cells });
  element.replaceWith(block);
}
