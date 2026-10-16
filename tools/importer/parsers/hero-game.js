/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-game. Base: hero.
 * Source: https://www.alc.ca/content/alc/en/play-online/casino/10000-wolves-10k-ways.html
 * Selector: section.alc-game-details-header
 *
 * Source structure (validated in block-context/hero-game/source*.html):
 *   section.alc-game-details-header(--casino|--di)
 *     .cmp-teaser__image img.cmp-image__image          (single desktop banner; no mobile rendition)
 *     .alc-game-details-header__cta-wrapper[data-game-identifier]
 *        .alc-game-details-header__play-now  > button#playCasino | a[href] (instant-win)
 *        .alc-game-details-header__demo      > button#demoCasino | button#demoInstant
 *        .alc-game-details-header__favourite (dropped)
 *     #gameUnavailable[data-gameid][data-game-type][data-game-lobby-url]
 *
 * Play buttons have no href on casino pages: URLs are rebuilt from the game id.
 * Live-casino pages have a single "Browse Games" button (opens a lobby modal) -> live casino lobby.
 *
 * Output: row 1 = banner image; row 2 = **[Play now](...)** + [TRY DEMO](...) (or **[Browse Games](...)**).
 *
 * VLT branch (video-lottery-detail), selector: .cmp-teaser.alc-custom-teaser
 *   div.cmp-teaser.alc-custom-teaser[style="background-image: url(...backgroundImage.img.jpg/...)"]
 *     .cmp-teaser__logo > img[src=...logoImage.img.png/...]
 *   Only one (desktop) background rendition exists in the source.
 *   Output: row 1 = background banner image; row 2 = logo image only (no CTAs). No logo -> row 1 only.
 */
const ORIGIN = 'https://www.alc.ca';
const LIVE_CASINO_LOBBY = '/content/alc/en/play-online/casino.html#live-casino';

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

function bgUrl(el) {
  const style = (el && el.getAttribute('style')) || '';
  const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1] : '';
}

function parseVltTeaser(element, document) {
  const cells = [];
  let bg = bgUrl(element);
  if (!bg) {
    const styled = [...element.querySelectorAll('[style*="background-image"]')].find((el) => bgUrl(el));
    bg = bgUrl(styled);
  }
  const title = element.getAttribute('data-gtm-variant') || '';
  if (bg) {
    const img = document.createElement('img');
    img.src = absolutize(bg);
    img.alt = title;
    cells.push([img]);
  }
  const logoEl = element.querySelector('.cmp-teaser__logo img, .cmp-teaser__content img, img');
  if (logoEl && logoEl.getAttribute('src')) {
    const logo = document.createElement('img');
    logo.src = absolutize(logoEl.getAttribute('src'));
    logo.alt = logoEl.getAttribute('alt') || title;
    cells.push([logo]);
  }
  if (!cells.length) {
    element.remove();
    return;
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-game', cells });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  // VLT banner teaser (video-lottery-detail); online-game-detail uses section.alc-game-details-header
  if (element.classList.contains('alc-custom-teaser')
    && !element.querySelector('.alc-game-details-header__cta-wrapper')) {
    parseVltTeaser(element, document);
    return;
  }

  const cells = [];

  // ---- Row 1: banner image (desktop; the source has no separate mobile rendition)
  const imgEl = element.querySelector('.cmp-teaser__image img, .cmp-image img, img.cmp-image__image');
  if (imgEl && imgEl.getAttribute('src')) {
    const img = document.createElement('img');
    img.src = absolutize(imgEl.getAttribute('src'));
    img.alt = imgEl.getAttribute('alt') || '';
    cells.push([img]);
  }

  // ---- Row 2: CTAs
  const wrapper = element.querySelector('.alc-game-details-header__cta-wrapper');
  const unavailable = element.querySelector('#gameUnavailable, [data-game-type]');
  const gameId = (wrapper && (wrapper.getAttribute('data-game-identifier') || wrapper.getAttribute('data-gtm-id')))
    || (unavailable && unavailable.getAttribute('data-gameid')) || '';
  const gameType = (unavailable && unavailable.getAttribute('data-game-type'))
    || (element.classList.contains('alc-game-details-header--di') ? 'instant' : 'casino');
  const isInstant = gameType === 'instant' || element.classList.contains('alc-game-details-header--di');

  const playEl = element.querySelector('.alc-game-details-header__play-now a, .alc-game-details-header__play-now button');
  const demoEl = element.querySelector('.alc-game-details-header__demo a, .alc-game-details-header__demo button');
  const playText = clean(playEl && playEl.textContent) || (playEl && playEl.getAttribute('title')) || '';

  const ctas = [];
  if (playEl && /browse games/i.test(playText)) {
    // Live casino: the button opens the live-casino lobby modal
    ctas.push(linkParagraph(document, LIVE_CASINO_LOBBY, playText, true));
  } else {
    const base = isInstant
      ? '/content/alc/en/play-online/instant-win-games/game.html'
      : '/en/casino/game.html';
    const modes = isInstant ? ['M', 'D'] : ['real', 'demo'];
    const build = (mode) => `${base}?gameId=${encodeURIComponent(gameId)}&playMode=${mode}`;

    if (playEl) {
      const href = (playEl.tagName === 'A' && playEl.getAttribute('href')) || (gameId ? build(modes[0]) : '');
      if (href) ctas.push(linkParagraph(document, href, playText || 'Play now', true));
    }
    if (demoEl) {
      const demoText = clean(demoEl.textContent) || 'TRY DEMO';
      const href = (demoEl.tagName === 'A' && demoEl.getAttribute('href')) || (gameId ? build(modes[1]) : '');
      if (href) ctas.push(linkParagraph(document, href, demoText, false));
    }
  }
  if (ctas.length) cells.push([ctas]);

  if (!cells.length) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-game', cells });
  element.replaceWith(block);
}
