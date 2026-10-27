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

function linkParagraph(document, href, text, strong) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
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

/**
 * "Have you tried..." rail on game detail pages.
 * Selector: section.alc-hyt (validated in block-context/cards-game/source*.html)
 *   .alc-hyt__container
 *     .hyt-game-image[style="background-image:url(...)"]
 *     .hyt-game-title, [.hyt-game-prize "$0.50 - $5" (instant-win)], .hyt-game-description
 *     .hyt-learn-more a, .hyt-game-cta a (Play now), .hyt-try-demo a (Try Demo)
 * Output: one row per game -> [image, h3 + prize + description + Learn More + **Play now** + Try Demo]
 */
function parseHaveYouTried(element, document) {
  const cells = [];
  element.querySelectorAll('.alc-hyt__container').forEach((card) => {
    const title = clean(card.querySelector('.hyt-game-title') && card.querySelector('.hyt-game-title').textContent);

    const imageCell = [];
    const imgHolder = card.querySelector('.hyt-game-image');
    const imgEl = imgHolder && imgHolder.querySelector('img[src]');
    const src = imgEl ? imgEl.getAttribute('src') : bgUrl(imgHolder);
    if (src) {
      const img = document.createElement('img');
      img.src = absolutize(src);
      img.alt = (imgEl && imgEl.getAttribute('alt')) || title;
      imageCell.push(img);
    }

    const body = [];
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }
    const prize = clean(card.querySelector('.hyt-game-prize') && card.querySelector('.hyt-game-prize').textContent);
    if (prize) {
      const p = document.createElement('p');
      p.textContent = prize;
      body.push(p);
    }
    const desc = clean(card.querySelector('.hyt-game-description') && card.querySelector('.hyt-game-description').textContent);
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc;
      body.push(p);
    }
    const learn = card.querySelector('.hyt-learn-more a[href]');
    if (learn) body.push(linkParagraph(document, learn.getAttribute('href'), clean(learn.textContent) || 'Learn More', false));
    const play = card.querySelector('.hyt-game-cta a[href], a[class*="hyt-play-url"][href]');
    if (play) body.push(linkParagraph(document, play.getAttribute('href'), clean(play.textContent) || 'Play now', true));
    const demo = card.querySelector('.hyt-try-demo a[href], a[class*="hyt-demo-url"][href]');
    if (demo) body.push(linkParagraph(document, demo.getAttribute('href'), clean(demo.textContent) || 'Try Demo', false));

    if (!imageCell.length && !body.length) return;
    cells.push([imageCell.length ? imageCell : '', body.length ? body : '']);
  });
  return cells;
}

/**
 * Landing-page game lobbies (content-page template). Selectors validated on live renders:
 *   .browse-game-list .show-search-result  article.game-tile-nondraw.tile-digital-instants
 *       .game-tile-header[style=bg], p.game-title, p.game-prize:not(.hidden), .description p (+ a Learn More),
 *       .play-now-link a (Play now), a.try-now-link (Try Demo)
 *   section.ko-scratch-list                 article.game-tile-nondraw.tile-scratch-breakopen
 *       .game-tile-header[style=bg], p.scratch-name, p.top-prize-gametile, a.try-now-link (Learn More)
 *   .di-featured-section > .row              section.alc-game-tile .alc-game-tile__container
 *       .game-image[style=bg], .game-title, .game-prize, .game-description, .learn-more a, .game-cta a, .try-demo a
 *   .games-wrapper                           article.lotto-category (our-games/lotto)
 *       .game-logo-en[aria-label], .weekly-time, .lotto-game-description p + a.read-more,
 *       .next-draw, .amounts-container, .lotto-footer .cta a, .see-numbers a
 *   .buy-tickets__wrapper                    .buy-tickets__wrapper__container > a[title] > img logo + "Buy Now"
 *   #casino-games (play-online/casino lobby grid inside #casino-wrapper, rendered client-side)
 *   (any)                                    div.game-tile > .casino-game[style=bg] + .casino-game-title, a.casino-info-button
 * Non-tile content inside the wrapper (lotto `.header h2`, casino `#rewards-banner-container`) is
 * kept as default content before the block (see extraContent).
 * Output: one row per game -> [image, h3 + facts + links (primary CTA bold)]
 */
const LOBBY_TILE = 'article.game-tile-nondraw, .alc-game-tile__container, article.lotto-category, '
  + '.buy-tickets__wrapper__container, div.game-tile:has(> .casino-game)';

function textParagraph(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function imageCellFrom(document, holder, alt) {
  if (!holder) return '';
  const imgEl = holder.matches('img') ? holder : holder.querySelector('img[src]:not(.cmp-favourite-button__icon)');
  const src = imgEl ? imgEl.getAttribute('src') : bgUrl(holder);
  if (!src) return '';
  const img = document.createElement('img');
  img.src = absolutize(src);
  img.alt = (imgEl && imgEl.getAttribute('alt')) || alt || '';
  return img;
}

function lobbyTileCells(document, tile) {
  const body = [];
  let image = '';
  let title = '';
  const addLink = (a, fallback, strong) => {
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const text = clean(a.textContent) || a.getAttribute('title') || fallback;
    if (body.some((n) => n.querySelector && n.querySelector(`a[href="${href}"]`))) return;
    body.push(linkParagraph(document, absolutize(href), text, strong));
  };

  if (tile.matches('article.lotto-category')) {
    const logo = tile.querySelector('[class^="game-logo"], [class*=" game-logo"]');
    title = clean((logo && logo.getAttribute('aria-label')) || tile.getAttribute('data-game'));
    image = imageCellFrom(document, tile.querySelector('.lotto-image'), title);
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }
    const draws = clean(tile.querySelector('.description-container .row-left') && tile.querySelector('.description-container .row-left').textContent);
    if (draws) body.push(textParagraph(document, draws));
    tile.querySelectorAll('.lotto-game-description p').forEach((p) => { if (clean(p.textContent)) body.push(textParagraph(document, clean(p.textContent))); });
    const next = clean(tile.querySelector('.next-draw') && tile.querySelector('.next-draw').textContent);
    if (next) body.push(textParagraph(document, next.replace(/\s*:\s*/, ': ')));
    const amountEl = tile.querySelector('.amounts-container .prize-amount');
    if (amountEl && clean(amountEl.textContent)) {
      // digit groups are <span>s on the live page; after cleanup unwraps them only "30000000" is left
      const rawDigits = [...amountEl.querySelectorAll('span')].map((s) => clean(s.textContent)).join(',') || clean(amountEl.textContent);
      const digits = /^\$?\d{4,}$/.test(rawDigits) ? rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : rawDigits;
      const est = clean(tile.querySelector('.amounts-container .est') && tile.querySelector('.amounts-container .est').textContent);
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `$${digits.replace(/^\$/, '')}${est ? ` ${est}` : ''}`;
      // jackpot qualifiers around the amount: "$5M CLASSIC JACKPOT +" / "GOLD BALL JACKPOT" /
      // "OR THE GUARANTEED $1M" / "+ INSTANT WINS" / "+ GUARANTEED PRIZE DRAW"
      const infos = [...tile.querySelectorAll('.amounts-container .info-text')]
        .filter((s) => !s.closest(EXTRA_SKIP) && clean(s.textContent));
      // eslint-disable-next-line no-bitwise
      const isBefore = (s) => !!(s.compareDocumentPosition(amountEl) & 4);
      const before = infos.filter(isBefore).map((s) => clean(s.textContent));
      const after = infos.filter((s) => !isBefore(s)).map((s) => clean(s.textContent));
      if (before.length) p.append(document.createTextNode(`${before.join(' ')} `));
      p.append(strong);
      if (after.length) p.append(document.createTextNode(` ${after.join(' ')}`));
      const extra = clean(tile.querySelector('.amounts-container .additional-prizes') && tile.querySelector('.amounts-container .additional-prizes').textContent);
      if (extra) {
        const em = document.createElement('em');
        em.textContent = extra.replace(/\s*×\s*/g, ' × ').replace(/^\+\s*/, '+ ');
        p.append(document.createTextNode(' '), em);
      }
      body.push(p);
    }
    addLink(tile.querySelector('.lotto-footer .cta a'), 'Get your ticket', true);
    addLink(tile.querySelector('.lotto-game-description a.read-more'), 'Game Details', false);
    addLink(tile.querySelector('.lotto-footer .see-numbers a'), 'See winning numbers & payouts', false);
  } else if (tile.matches('.buy-tickets__wrapper__container')) {
    const a = tile.querySelector('a[href]');
    title = clean(a && a.getAttribute('title'));
    image = imageCellFrom(document, tile.querySelector('img') || tile.querySelector('.buy-tickets__wrapper__container__bg'), title);
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }
    if (a) body.push(linkParagraph(document, absolutize(a.getAttribute('href')), clean(tile.querySelector('.buy-tickets__wrapper__container__purchase') && tile.querySelector('.buy-tickets__wrapper__container__purchase').textContent) || 'Buy Now', true));
  } else if (tile.matches('div.game-tile')) {
    title = clean(tile.querySelector('.casino-game-title') && tile.querySelector('.casino-game-title').textContent);
    image = imageCellFrom(document, tile.querySelector('.casino-game'), title);
    const info = tile.querySelector('a.casino-info-button[href]');
    if (title) {
      const h3 = document.createElement('h3');
      if (info) {
        const a = document.createElement('a');
        a.href = absolutize(info.getAttribute('href'));
        a.textContent = title;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      body.push(h3);
    }
  } else {
    // game-tile-nondraw (instant win / scratch) and alc-game-tile featured containers
    const titleEl = tile.querySelector('.game-title, .scratch-name');
    title = clean(titleEl && titleEl.textContent);
    image = imageCellFrom(document, tile.querySelector('.game-tile-header, .game-image'), title);
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title;
      body.push(h3);
    }
    const prizeEl = tile.querySelector('.game-prize:not(.hidden), .top-prize-gametile');
    const prize = clean(prizeEl && [...prizeEl.childNodes].map((n) => n.textContent).join(' ').replace(/\s*-\s*/g, ' - '));
    // price range from the live lobby: "$0.10 - $3"; collapse "$1 - $1" and drop unresolved "- $NaN"
    const range = prize.replace(/(\$[\d.,]+)\s+(\$[\d.,]+)/, '$1 - $2').replace(/\s*-\s*\$NaN\b/g, '')
      .replace(/^(\$[\d.,]+) - \1$/, '$1');
    if (range) body.push(textParagraph(document, range));
    const descEl = tile.querySelector('.description, .game-description');
    if (descEl) {
      const descClone = descEl.cloneNode(true);
      descClone.querySelectorAll('a').forEach((a) => a.remove());
      const desc = clean(descClone.textContent);
      if (desc) body.push(textParagraph(document, desc));
    }
    addLink(tile.querySelector('.description a[href], .learn-more a[href], .game-tile-content > a.try-now-link[href]'), 'Learn More', false);
    addLink(tile.querySelector('.play-now-link a[href], .game-cta a[href]'), 'Play now', true);
    addLink(tile.querySelector('.try-now-group a.try-now-link[href], .try-demo a[href]'), 'Try Demo', false);
  }

  if (!image && !body.length) return null;
  return { key: title || (image && image.src), row: [image || '', body.length ? body : ''] };
}

/**
 * Non-tile content inside a lobby wrapper (e.g. our-games/lotto `.games-wrapper > .header h2`,
 * play-online/casino `#casino-games > #rewards-banner-container`): rebuilt as plain default
 * content (headings, paragraphs with inline links) so it survives the block replacement.
 * Filters, search forms, hidden states and icon ligatures are skipped.
 */
const EXTRA_SKIP = 'form, select, input, button, label, link, script, style, noscript, .browse-search, .filter, '
  + '.filters, .material-icons, .hidden, [hidden], [aria-hidden="true"], [style*="display: none"], [style*="display:none"]';
const INLINE_TAGS = /^(A|B|STRONG|EM|I|U|SPAN|SMALL|SUP|SUB|BR)$/;

function inlineClone(document, node) {
  if (node.nodeType === 3) return document.createTextNode(node.textContent.replace(/ /g, ' '));
  if (node.nodeType !== 1 || node.matches(EXTRA_SKIP)) return null;
  if (node.tagName === 'BR') return document.createElement('br');
  let out;
  if (node.tagName === 'A') {
    const href = node.getAttribute('href');
    if (!href || href === '#' || !clean(node.textContent)) return document.createTextNode(clean(node.textContent));
    out = document.createElement('a');
    out.href = absolutize(href);
  } else if (/^(B|STRONG)$/.test(node.tagName)) {
    out = document.createElement('strong');
  } else if (/^(EM|I)$/.test(node.tagName)) {
    out = document.createElement('em');
  } else {
    out = document.createDocumentFragment();
  }
  [...node.childNodes].forEach((c) => {
    const n = inlineClone(document, c);
    if (n) out.append(n);
  });
  return out;
}

function extraContent(document, root, out = []) {
  let line = [];
  const flush = () => {
    const p = document.createElement('p');
    line.forEach((n) => { const c = inlineClone(document, n); if (c) p.append(c); });
    line = [];
    if (clean(p.textContent)) {
      p.normalize();
      if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
      if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
      out.push(p);
    }
  };
  [...root.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      if (clean(child.textContent)) line.push(child);
      return;
    }
    if (child.nodeType !== 1 || child.matches(EXTRA_SKIP) || child.matches(LOBBY_TILE)) return;
    if (INLINE_TAGS.test(child.tagName) && !child.querySelector(LOBBY_TILE)) {
      line.push(child);
      return;
    }
    flush();
    if (/^H[1-6]$/.test(child.tagName)) {
      if (clean(child.textContent)) {
        const h = document.createElement(child.tagName.toLowerCase());
        h.textContent = clean(child.textContent);
        out.push(h);
      }
      return;
    }
    if (!clean(child.textContent)) return;
    extraContent(document, child, out);
  });
  flush();
  return out;
}

function parseLobby(element, document) {
  const tiles = [...element.querySelectorAll(LOBBY_TILE)].filter((t) => !t.parentElement.closest(LOBBY_TILE));
  const seen = new Set();
  const cells = [];
  tiles.forEach((tile) => {
    const r = lobbyTileCells(document, tile);
    if (!r) return;
    if (r.key && seen.has(r.key)) return;
    seen.add(r.key);
    cells.push(r.row);
  });
  return cells;
}

export default function parse(element, { document }) {
  if (!element.querySelector('article.game-tile') && element.querySelector(LOBBY_TILE)) {
    const lobbyCells = parseLobby(element, document);
    if (!lobbyCells.length) {
      element.remove();
      return;
    }
    const extras = extraContent(document, element);
    const lobbyBlock = WebImporter.Blocks.createBlock(document, { name: 'cards-game', cells: lobbyCells });
    element.replaceWith(...extras, lobbyBlock);
    return;
  }

  if (element.matches('.alc-hyt') || (!element.querySelector('.game-tile') && element.querySelector('.alc-hyt__container'))) {
    const hytCells = parseHaveYouTried(element, document);
    if (!hytCells.length) {
      element.remove();
      return;
    }
    const hytBlock = WebImporter.Blocks.createBlock(document, { name: 'cards-game', cells: hytCells });
    element.replaceWith(hytBlock);
    return;
  }

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
