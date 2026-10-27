/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: dynamic section breaks + Section Metadata for template "content-page"
 * (145 alc.ca corporate / PlayWise / legal / promo / landing pages). No-op on every other
 * template and on pages that match a detail-page detector (ticket / VLT / online game).
 *
 * Content pages have no fixed section list (page-templates.json "sections": []), so the
 * sections are derived from the page structure:
 *
 *   newer AEM pages  .root.responsivegrid > .aem-Grid >
 *                      .alc-container.cmp-container--pw-*-hero-padding    title banner (hero-banner)
 *                      .alc-container > #skip-to-main-content > .aem-Grid > .alc-container  (one section each)
 *                      section.experiencefragment.cmp-experiencefragment--gambling-helplines
 *                    Page-wrapper containers (#skip-to-main-content, main/section.alc-container,
 *                    single-child wrappers) are expanded so that their child containers start the
 *                    sections; a run of loose components (title / text / teaser / tabs ...) between
 *                    containers forms one section.
 *   older pages      .online-corporate-detail > .hero + .body-content,
 *                    .corporate-landing > .container-fluid > .row > (.hero | .sponsorship | ...),
 *                    .featured-winners-holder > ..., .scratch-category / section.header / ...:
 *                    single-child wrappers are descended, the resulting siblings are the sections.
 *
 * Style (Section Metadata): from the section's own background (inline background-color on the
 * container or its .cmp-container): bluish tint (#F4F9FD, #E5F5FC) -> "light-blue", neutral grey
 * (#F4F5F6, #F5F5F5, #f6f7f7) -> "light-grey", white / none -> none; the gambling-helplines
 * fragment is light grey via CSS -> "light-grey". "centered" is added when the section's first
 * heading (or, without one, its intro text) is centered on the source. The title banner (hero)
 * section never gets a style.
 *
 * Like alc-sections.js: <hr> breaks are inserted in beforeTransform (parsers replace elements
 * afterwards); styled breaks carry a temporary data-excat-section-id marker and get their Section
 * Metadata block in afterTransform. A styled first section gets a temporary marker <hr> that is
 * removed once its metadata is placed.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const SECTION_STYLES = new WeakMap(); // <main> -> { id: style }

// Never section candidates (removed by alc-cleanup.js; listed so this transformer is
// self-sufficient on an uncleaned DOM)
const IGNORE_SELECTOR = [
  'script', 'noscript', 'style', 'link', 'meta', 'iframe', 'title',
  'header', 'footer', 'nav', '[role="banner"]', 'div.xfpage', '#loginFlow',
  '.logged-in-info-wrapper', '.topnav', '#nav-mobile', '#collapsible-promo',
  'div.experiencefragment', '.cmp-experiencefragment--header', '.cmp-experiencefragment--footer',
  '.common-modals', '.modal-xf', '.cmp-modal', '.alc-modal', '.modal', '.modal-browser-check',
  '.cmp-page__skiptomaincontent', '#ZN_3Eu2u7P45FmpwJ5', 'section[data-bind="if: message"]',
  '.alert-area', '.notification.section', '.cmp-notification',
  'section#page-breadcrumb', '.breadcrumb-container', '.breadcrumb', '.cmp-breadcrumb',
  '.livechat', '.alc-livechat', '#cxone-guide-container', '#stcpDiv',
  '.alc-mobile-banner', 'div.banner.section', '.separator', 'hr',
].join(', ');

const HERO_SELECTOR = '.alc-container.cmp-container--pw-content-hero-padding, '
  + '.alc-container.cmp-container--pw-landing-hero-padding, div.hero';
const XF_SECTION_SELECTOR = 'section.experiencefragment, .cmp-experiencefragment--gambling-helplines';
// Elements that are one section on their own and are never descended into
const LEAF_SELECTOR = [
  HERO_SELECTOR, XF_SECTION_SELECTOR,
  '.online-corporate-detail > .body-content',
  '.text', '.title', '.teaser', '.image', '.tabs', '.accordion', '.embed', '.table',
  '.cmp-tabs', '.cmp-accordion', 'table', 'ul', 'ol', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
].join(', ');

function normText(el) {
  return (el ? el.textContent : '').replace(/[\s ​-‍﻿]+/g, ' ').trim();
}

function isTicketDetailPage(root) {
  return !!root.querySelector('div.game-detail-scratch');
}
function isVideoLotteryPage(root) {
  return !!root.querySelector('div.video-lottery-info-page');
}
function isGameDetailPage(root) {
  return !isVideoLotteryPage(root)
    && !!root.querySelector('section.alc-game-details-header, div.digital-instants-info-page');
}

function isContentPage(root, payload) {
  const template = payload && payload.template;
  if (!template || template.name !== 'content-page') return false;
  return !isTicketDetailPage(root) && !isVideoLotteryPage(root) && !isGameDetailPage(root);
}

function hasMedia(el) {
  return !!el.querySelector('img, picture, video, iframe, table, [style*="url"]')
    || (el.matches && el.matches('img, picture, video, iframe, table'));
}

// Text without the text of ignored (chrome / script) descendants
function contentText(el) {
  let text = normText(el);
  if (!text) return '';
  el.querySelectorAll(IGNORE_SELECTOR).forEach((x) => {
    const t = normText(x);
    if (t) text = text.replace(t, '');
  });
  return text.trim();
}

function isMeaningful(el) {
  if (el.nodeType !== 1 || el.matches(IGNORE_SELECTOR)) return false;
  if (el.matches('.aem-GridColumn--default--hide')) return false;
  return !!contentText(el) || hasMedia(el);
}

function meaningfulChildren(el) {
  return [...el.children].filter(isMeaningful);
}

function isAlcContainer(el) {
  return el.matches('.alc-container');
}

// Inner grid children of an .alc-container (container > .cmp-container > .aem-Grid > items)
function containerItems(el) {
  const inner = el.querySelector(':scope > .cmp-container > .aem-Grid')
    || el.querySelector(':scope > .cmp-container')
    || el;
  return meaningfulChildren(inner);
}

function ownBackground(el) {
  const holders = [el, el.querySelector(':scope > .cmp-container')].filter(Boolean);
  for (const h of holders) {
    const style = h.getAttribute('style') || '';
    const m = style.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i);
    if (m) return m[1];
  }
  return '';
}

function parseColor(value) {
  if (!value) return null;
  let v = value.trim().toLowerCase();
  if (v.startsWith('#')) {
    v = v.slice(1);
    if (v.length === 3 || v.length === 4) v = v.split('').map((c) => c + c).join('');
    const a = v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1;
    return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16), a };
  }
  const m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
}

// #F4F9FD-like -> light-blue, #F4F5F6-like -> light-grey, white / transparent / other -> ''
function backgroundStyle(value) {
  const c = parseColor(value);
  if (!c || c.a < 0.6) return '';
  const min = Math.min(c.r, c.g, c.b);
  const max = Math.max(c.r, c.g, c.b);
  if (min < 0xd8 || min >= 0xfd) return ''; // dark / saturated (handled by blocks) or white
  if (c.b - c.r >= 6 && c.b >= c.g) return 'light-blue';
  if (max - min <= 5) return 'light-grey';
  return '';
}

function isWrapperContainer(el) {
  return isAlcContainer(el) && !el.matches(HERO_SELECTOR) && !backgroundStyle(ownBackground(el))
    && !ownBackground(el);
}

// Page-level wrapper containers whose child containers are the real sections
function shouldExpand(el, siblings) {
  if (!isWrapperContainer(el)) return false;
  if (el.querySelector(':scope > #skip-to-main-content')) return true;
  const items = containerItems(el);
  if (!items.length) return false;
  if (siblings === 1) return true; // the page's only content container (section/main.alc-container)
  return el.matches('main, section') && items.some((i) => isAlcContainer(i) || i.matches(HERO_SELECTOR));
}

function expand(items) {
  const out = [];
  items.forEach((item) => {
    if (shouldExpand(item, items.length)) {
      out.push(...expand(containerItems(item)));
    } else {
      out.push(item);
    }
  });
  return out;
}

// Top-level content items of the page
function topLevelItems(main) {
  // AEM pages: the page grid (body > .root.responsivegrid > .aem-Grid) holds every section, even
  // when tracking / loader nodes are body siblings (uncleaned DOM)
  const aemRoot = main.querySelector(':scope > .root.responsivegrid > .aem-Grid');
  let items = aemRoot ? meaningfulChildren(aemRoot) : meaningfulChildren(main);
  // Descend single-child wrappers (body > .root.responsivegrid > .aem-Grid, body > .online-corporate-detail, ...)
  let guard = 0;
  while (items.length === 1 && guard < 12 && !items[0].matches(LEAF_SELECTOR)) {
    const el = items[0];
    const next = isAlcContainer(el) ? containerItems(el) : meaningfulChildren(el);
    if (!next.length || (isAlcContainer(el) && !shouldExpand(el, 1))) break;
    items = next;
    guard += 1;
  }
  return expand(items);
}

function isSectionStarter(el) {
  return isAlcContainer(el) || el.matches(HERO_SELECTOR) || el.matches(XF_SECTION_SELECTOR)
    || (!el.matches('.text, .title, .teaser, .image, .tabs, .accordion, .embed, .table, .alc-button, .button, .dynamic-cta, .reference, .html-promo')
      && !el.matches('[class*="aem-GridColumn"]'));
}

function isLooseHeadingOnly(group) {
  return group.items.every((i) => i.matches('.title, .text') && !i.querySelector('img, table, ul, ol'));
}

// Group items into sections
function buildSections(items) {
  const sections = [];
  let current = null;
  items.forEach((item) => {
    const starter = isSectionStarter(item);
    const hero = item.matches(HERO_SELECTOR);
    const styled = !!backgroundStyle(ownBackground(item)) || item.matches(XF_SECTION_SELECTOR);
    if (!starter) {
      if (!current || current.closed) {
        current = { items: [], start: item, loose: true };
        sections.push(current);
      }
      current.items.push(item);
      return;
    }
    // An unstyled container joins a preceding heading/intro-only run (heading + its content)
    if (!hero && !styled && current && !current.closed && current.loose && isLooseHeadingOnly(current)) {
      current.items.push(item);
      current.closed = true;
      return;
    }
    current = { items: [item], start: item, closed: true, hero };
    sections.push(current);
  });
  return sections;
}

function isCentered(el) {
  if (!el) return false;
  for (let p = el; p; p = p.parentElement) {
    const cls = (p.getAttribute && p.getAttribute('class')) || '';
    const style = (p.getAttribute && p.getAttribute('style')) || '';
    if (/text-align\s*:\s*center/i.test(style)) return true;
    if (/(^|\s)(cmp-title--text-center|text-center|alc-txt-center|center-block|cmp-text--desktop-alignment-center|cmp-container--desktop-align-center|cmp-teaser--text-center)(\s|$)/.test(cls)) return true;
    if (/(^|\s)(cmp-title--text-left|text-left|alc-txt-left)(\s|$)/.test(cls)) return false;
    if (p.matches && p.matches('.alc-container, section, body')) break;
  }
  return false;
}

function sectionStyle(section) {
  if (section.hero) return '';
  const styles = [];
  const first = section.items[0];
  const bg = first.matches(XF_SECTION_SELECTOR) ? 'light-grey' : backgroundStyle(ownBackground(first));
  if (bg) styles.push(bg);
  // First heading, else first intro paragraph, of the section (outside nested blocks' cards)
  const headingSel = 'h1, h2, h3, h4, h5, h6';
  let heading = null;
  let intro = null;
  for (const item of section.items) {
    const candidates = item.matches(headingSel) ? [item] : [...item.querySelectorAll(headingSel)];
    heading = candidates.find((h) => normText(h) && !h.closest('.cmp-teaser, .cmp-tabs, .cmp-accordion, .panel-group, table'));
    if (heading) break;
  }
  if (!heading) {
    for (const item of section.items) {
      const candidates = item.matches('p') ? [item] : [...item.querySelectorAll('p')];
      intro = candidates.find((p) => normText(p) && !p.closest('.cmp-teaser, .cmp-tabs, .cmp-accordion, .panel-group, table'));
      if (intro) break;
    }
  }
  const probe = heading || intro;
  if (probe) {
    // .cmp-title / .text wrappers carry the alignment class; the text itself may carry the style
    const holder = probe.closest('.title, .text') || probe;
    if (isCentered(probe) || isCentered(holder)) styles.push('centered');
  }
  return styles.join(', ');
}

export default function transform(hookName, element, payload) {
  if (!isContentPage(element, payload) && !SECTION_STYLES.has(element)) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    const sections = buildSections(topLevelItems(element));
    const styles = {};
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const style = sectionStyle(section);
      if (i === 0 && !style) continue;
      const hr = doc.createElement('hr');
      if (style) {
        const id = `content-${i}`;
        hr.setAttribute(SECTION_MARKER_ATTR, id);
        styles[id] = { style, first: i === 0 };
      }
      section.start.before(hr);
    }
    SECTION_STYLES.set(element, styles);
  }

  if (hookName === 'afterTransform') {
    const styles = SECTION_STYLES.get(element) || {};
    SECTION_STYLES.delete(element);
    element.querySelectorAll(`hr[${SECTION_MARKER_ATTR}]`).forEach((marker) => {
      const id = marker.getAttribute(SECTION_MARKER_ATTR);
      const entry = styles[id];
      marker.removeAttribute(SECTION_MARKER_ATTR);
      if (!entry) return;
      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: entry.style },
      });
      // Section Metadata may live anywhere within its section; place it right after the break.
      marker.after(metadataBlock);
      if (entry.first) marker.remove();
    });

    // Guard: never open the page with an empty section, never leave two breaks in a row
    let first = element.firstElementChild;
    while (first && first.tagName !== 'HR' && !first.textContent.trim()
      && !first.querySelector('img, picture, table, hr')) {
      first = first.nextElementSibling;
    }
    if (first && first.tagName === 'HR') first.remove();
  }
}
