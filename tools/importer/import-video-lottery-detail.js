/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroGameParser from './parsers/hero-game.js';
import carouselThumbnailsParser from './parsers/carousel-thumbnails.js';

// TRANSFORMER IMPORTS
import alcCleanupTransformer from './transformers/alc-cleanup.js';
import alcSectionsTransformer from './transformers/alc-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-game': heroGameParser,
  'carousel-thumbnails': carouselThumbnailsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "video-lottery-detail",
  "description": "Video lottery game detail: full-width game banner, game card with title and screenshot carousel, description/summary card; no sidebar",
  "urls": [
    "(see tools/importer/urls-video-lottery-detail.txt)"
  ],
  "blocks": [
    {
      "name": "hero-game",
      "instances": [
        ".cmp-teaser.alc-custom-teaser"
      ]
    },
    {
      "name": "carousel-thumbnails",
      "instances": [
        ".alc-image-browser .alc-carousel.slideshow-main"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "game-banner",
      "selector": [
        ".cmp-teaser.alc-custom-teaser"
      ],
      "style": null,
      "blocks": [
        "hero-game"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "game-body",
      "selector": [
        "div.video-lottery-info-page.body-content"
      ],
      "style": "game-detail, vlt",
      "blocks": [
        "carousel-thumbnails"
      ],
      "defaultContent": [
        ".alc-image-browser__heading h1",
        ".video-lottery-game-summary #gameSummary"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - cleanup first, then sections
const transformers = [
  alcCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 0 ? [alcSectionsTransformer] : []),
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
