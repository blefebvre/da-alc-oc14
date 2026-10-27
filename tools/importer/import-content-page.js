/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import columnsMediaParser from './parsers/columns-media.js';
import columnsContactParser from './parsers/columns-contact.js';
import accordionBarParser from './parsers/accordion-bar.js';
import tabsBoxedParser from './parsers/tabs-boxed.js';
import cardsGameParser from './parsers/cards-game.js';
import embedParser from './parsers/embed.js';
import tableParser from './parsers/table.js';
import carouselPromoParser from './parsers/carousel-promo.js';

// TRANSFORMER IMPORTS
import alcCleanupTransformer from './transformers/alc-cleanup.js';
import alcContentSectionsTransformer from './transformers/alc-content-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-feature': cardsFeatureParser,
  'columns-media': columnsMediaParser,
  'columns-contact': columnsContactParser,
  'accordion-bar': accordionBarParser,
  'tabs-boxed': tabsBoxedParser,
  'cards-game': cardsGameParser,
  'embed': embedParser,
  'table': tableParser,
  'carousel-promo': carouselPromoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "content-page",
  "description": "General alc.ca content page (corporate, PlayWise, legal, landing, promos): title banner, section headings, feature cards, image+text rows, CTAs, accordions, tabs, game tiles",
  "urls": [
    "(see tools/importer/urls-content-page.txt)"
  ],
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".alc-container.cmp-container--pw-content-hero-padding",
        ".alc-container.cmp-container--pw-landing-hero-padding",
        "div.hero:not(.carousel):has(.hero-row)"
      ]
    },
    {
      "name": "cards-feature",
      "instances": [
        ".aem-Grid:not(.cmp-tabs *, .cmp-accordion *, .alc-modal *, .modal *):has(> .teaser.cmp-teaser--tile, > .teaser.cmp-teaser--vertical-wide, > .teaser.cmp-teaser--vertical-square, > .teaser.cmp-teaser--card, > .teaser.cmp-teaser--tile-button, > .teaser.cmp-teaser--icon-left, > .information-card, > .teaser[class*=\"aem-GridColumn--default--\"]:not(.aem-GridColumn--default--12, .cmp-teaser--horizontal-left, .cmp-teaser--horizontal-right, .cmp-teaser--quiz, .cmp-teaser--rewards) + .teaser[class*=\"aem-GridColumn--default--\"]:not(.aem-GridColumn--default--12, .cmp-teaser--horizontal-left, .cmp-teaser--horizontal-right, .cmp-teaser--quiz, .cmp-teaser--rewards))"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".aem-Grid:not(.cmp-tabs *, .cmp-accordion *, .alc-modal *):has(> .teaser.cmp-teaser--horizontal-left, > .teaser.cmp-teaser--horizontal-right)",
        "div:not(.cmp-tabs *, .cmp-accordion *, .panel-group *):has(> .textimage)"
      ]
    },
    {
      "name": "columns-contact",
      "instances": [
        ".cmp-experiencefragment--gambling-helplines .aem-Grid:has(> .text.cmp-text--desktop-alignment-center)"
      ]
    },
    {
      "name": "accordion-bar",
      "instances": [
        ".accordion.parbase > div > .panel-group:not(#footer-mobile, .main-nav-mobile)",
        ".cmp-accordion:not(.cmp-tabs *)"
      ]
    },
    {
      "name": "tabs-boxed",
      "instances": [
        ".cmp-tabs"
      ]
    },
    {
      "name": "cards-game",
      "instances": [
        ".cmp-container--game-tiles",
        "section.alc-hyt",
        ".di-featured-section > .row",
        ".browse-game-list .show-search-result",
        "section.ko-scratch-list",
        ".games-wrapper",
        ".buy-tickets__wrapper",
        "#casino-games"
      ]
    },
    {
      "name": "embed",
      "instances": [
        ".cmp-embed:not(.alc-modal *, .modal *, .cmp-tabs *, .cmp-accordion *)",
        ".youtube-holder:has(iframe):not(.tabs *, .cmp-tabs *, .panel-group *, .modal *)"
      ]
    },
    {
      "name": "table",
      "instances": [
        ".cmp-text table:not(.cmp-accordion *, .panel-group *, .cmp-tabs *, table *)",
        ".table.parbase table:not(.cmp-accordion *, .panel-group *, .cmp-tabs *, table *)"
      ]
    },
    {
      "name": "carousel-promo",
      "instances": [
        ".carousel.list.parbase",
        "section.hero > .alc-carousel"
      ]
    }
  ],
  "sections": []
};

// TRANSFORMER REGISTRY - cleanup first, then sections
// content pages have a variable number of sections: alc-content-sections derives them per page
const transformers = [
  alcCleanupTransformer,
  alcContentSectionsTransformer,
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * Map a source URL to a document path.
 * /content/alc/en.html -> /index ; /content/alc/en/foo/bar.html -> /en/foo/bar
 */
function toDocumentPath(originalURL) {
  const rawPath = new URL(originalURL).pathname
    .replace(/^\/content\/alc/, '')
    .replace(/\/$/, '')
    .replace(/\.html?$/, '');
  // English homepage is the site root
  if (rawPath === '' || rawPath === '/en') return '/index';
  return WebImporter.FileUtils.sanitizePath(rawPath);
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup, section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup, section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Path
    const path = toDocumentPath(params.originalURL);

    const report = {
      title: document.title,
      template: PAGE_TEMPLATE.name,
      blocks: pageBlocks.map((b) => b.name),
    };
    return [{ element: main, path, report }];
  },
};
