/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselPromoParser from './parsers/carousel-promo.js';
import carouselWinnersParser from './parsers/carousel-winners.js';
import cardsGameParser from './parsers/cards-game.js';
import cardsPromoParser from './parsers/cards-promo.js';

// TRANSFORMER IMPORTS
import alcCleanupTransformer from './transformers/alc-cleanup.js';
import alcSectionsTransformer from './transformers/alc-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-promo': carouselPromoParser,
  'carousel-winners': carouselWinnersParser,
  'cards-game': cardsGameParser,
  'cards-promo': cardsPromoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'ALC English homepage',
  urls: [
    'https://www.alc.ca/content/alc/en.html',
  ],
  blocks: [
    { name: 'carousel-promo', instances: ['.carousel.list.parbase.hero'] },
    { name: 'carousel-winners', instances: ['.winners-carousel.carousel.panelcontainer'] },
    { name: 'cards-game', instances: ['.alc-container.cmp-container--game-tiles'] },
    { name: 'cards-promo', instances: ['.alc-container.cmp-container--hide-column-gutters'] },
  ],
  sections: [
    {
      id: '1',
      name: 'hero-carousel',
      selector: ['.carousel.list.parbase.hero'],
      style: null,
      blocks: ['carousel-promo'],
      defaultContent: [],
    },
    {
      id: '2',
      name: 'recent-winners',
      selector: ['.section-header.cmp-section-header--alc-blue'],
      style: 'winners',
      blocks: ['carousel-winners'],
      defaultContent: ['.cmp-section-header--alc-blue .cmp-section-header__title'],
    },
    {
      id: '3',
      name: 'featured-games',
      selector: ['.section-header.cmp-section-header--alc-green'],
      style: 'featured, sidebar',
      blocks: ['cards-game', 'cards-promo'],
      defaultContent: ['.cmp-section-header--alc-green .cmp-section-header__title'],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections
const transformers = [
  alcCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [alcSectionsTransformer] : []),
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
