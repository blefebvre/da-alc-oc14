/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: alc.ca section breaks + Section Metadata.
 * Section boundaries come from payload.template.sections (page-templates.json):
 *   0: .html-promo                                      (style "mobile-banner")
 *   1: .carousel.list.parbase.hero                      (no style)
 *   2: .section-header.cmp-section-header--alc-blue     (style "winners")
 *   3: .section-header.cmp-section-header--alc-green    (style "featured, sidebar")
 * .html-promo is a top-level grid sibling preceding the hero's container; the hero and the
 * winners header share the same AEM container (#container-8dc56c521a), so the <hr> is
 * inserted directly before each section-start element rather than per container.
 *
 * Template "online-game-detail" (731 casino / instant-win / live-casino pages):
 *   1: section.alc-game-details-header                  (no style -> no leading <hr>)
 *   2: div.digital-instants-info-page.body-content      (style "game-detail")
 * Result: hero-game | <hr> | Section Metadata(game-detail), H1, [cost p], carousel-thumbnails,
 * Game Summary H2 + paragraphs, tabs-boxed, H2 "Have you tried...", cards-game. No template-
 * specific code is needed here; the H1 / summary / rail-heading normalisation lives in
 * alc-cleanup.js.
 *
 * Breaks are inserted in beforeTransform (before parsers replace elements); metadata is
 * anchored to marker <hr>s in afterTransform. The cleanup transformer replaces
 * .section-header with a plain H2 in afterTransform, so the marker is the reliable anchor.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue;
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue;

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      // Section Metadata may live anywhere within its section; place it right after the break.
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }

    // Guard: never open the page with an empty section (e.g. first section missing on a page).
    let first = element.firstElementChild;
    while (first && first.tagName !== 'HR' && !first.textContent.trim()
      && !first.querySelector('img, picture, table, hr')) {
      first = first.nextElementSibling;
    }
    if (first && first.tagName === 'HR') first.remove();
  }
}
