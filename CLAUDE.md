see @AGENTS.md

# alc.ca migration notes

Migration of https://www.alc.ca/content/alc/en.html (English only) to this DA project.
Preview: https://main--da-alc-oc14--blefebvre.aem.page/ — content is previewed on aem.page only, never published live.

## URLs
- Clean paths: `/content/alc/en/x/y.html` -> `/en/x/y`, each segment lowercased and sanitised like
  `WebImporter.FileUtils.sanitizePath` (e.g. `referenced/PrivacyPolicy` -> `/en/referenced/privacypolicy`).
  The English homepage is `/` (document `index`).
- The `redirects` sheet (`tools/importer/redirects.json`, uploaded to DA as `/redirects.json`) maps old alc.ca paths
  to the new ones. EDS applies redirects BEFORE content: a page listed as a source never renders, so regenerate
  and re-preview the sheet whenever pages are added (`node tools/importer/build-redirects.cjs tools/importer/redirects.json`).
- The sheet also mirrors alc.ca's own 302s on-site (`/en/our-games` and `/en/play-online` -> `/`,
  `/en/our-games/casino` -> `/en/play-online/casino`, `/en/legal/privacy-policy` -> `/en/referenced/privacypolicy`, ...).
  It sends pages that are broken, empty or soft-404 on alc.ca to the nearest migrated parent page
  (`tools/importer/data/empty-shells.txt`, `unmigrated-status.txt`, `link-extra-check.txt`).

## Application screens stay on alc.ca (decision: link, do not rebuild)
- Cart, checkout, sign-in, registration, my-account, search, help, return-to-play / break flows, rewards account
  screens, the contact form, game launchers (`.../game.html?gameId=`) and ticket configurators
  (`/content/alc/en/game-configurator/*`) need the alc.ca backend. Links to them point to www.alc.ca.
  The list is `APP_SCREEN_RE` in `tools/importer/transformers/alc-cleanup.js`; keep `build-redirects.cjs` in sync.
- Nav "Play Online" items (Lotto Max, Lotto 6/49, Daily Grand, Atlantic 49, Bucko, Keno, Poker Lotto, Salsa Bingo)
  are purchase screens on alc.ca (`/en/play-online/lottomax` -> alc.ca game configurator). They intentionally
  redirect to alc.ca. The on-site info pages are `/en/our-games/lotto/*`. Accepted as-is.
- PROLINE Stadium (`/en/our-games/proline`, `/en/play-online/proline/*`) is a separate alc.ca product: it stays on alc.ca.
- French (`/fr`) is out of scope for now and goes to the live French site.
- Assets (`/content/dam/...` PDFs and images) are linked from www.alc.ca, not copied.

## Templates and import
- Templates in `tools/importer/page-templates.json`: homepage, online-game-detail (casino + instant win),
  ticket-detail (Scratch 'N Win / Breakopen), video-lottery-detail, content-page (corporate, PlayWise, legal,
  promos, landing pages). URL lists: `tools/importer/urls-<template>.txt`.
- Shared cleanup: `transformers/alc-cleanup.js` removes the header/footer experience fragments and rewrites links.
  On content pages, other experience fragments (`cmp-experiencefragment--adam`, `--contact-us`, `--games`, ...) are content and are kept.
- After an import: `node tools/importer/build-redirects.cjs tools/importer/redirects.json`, then
  `node tools/importer/fix-links.cjs` (links point straight at final on-site pages, including in nav/footer), then
  `node tools/importer/alc-link-audit.cjs` (expect 0 internal 404s).
- Publish: `tools/importer/publish-to-da.sh <paths-file> <log>` (DA upload + aem.page preview). Find pages missing
  or outdated on aem.page with `node tools/importer/preview-diff.mjs <out-file>`. Check links on aem.page with
  `node tools/importer/live-link-check.mjs`. Scripts write reports to `migration-work/` (local, not committed).
- Empty shells on alc.ca (retired games / tickets, `tools/importer/data/empty-shells.txt`) are imported but never
  published. They redirect to their category page.

## Code
- `scripts/aem.js` here lacks section-metadata handling: `decorateSectionMetadata()` in `scripts/scripts.js` does it.
- DA rewrites fragments (wraps images in `<picture>`, wraps list items in `<p>`, makes media URLs relative):
  `scripts/fragment-utils.js` `normalizeFragment()` undoes that for the nav and footer.
- Proxima Nova weights are remapped in `styles/fonts.css` (700 renders semibold, 800 bold) to match alc.ca.
- Breadcrumbs come from the `Breadcrumbs` page metadata flag (`buildBreadcrumbs()` in `scripts/scripts.js`).

## Local edits that a re-import overwrites
- `en/promos/funding2` and `en/promos/archived/lotto/thenewlotto649`: their markup on alc.ca is malformed, so the
  sections were repaired by hand (local copy, then uploaded to DA). Re-apply the fixes after re-importing those pages.

## Known gaps
- Content-page blocks (hero-banner, cards-feature, columns-media, columns-contact, embed, table) have structural CSS only.
- The `/en/play-online/casino` game grid is client-rendered from an API and was not captured.
- Lotto tiles have no images (CSS sprites on alc.ca). Jackpot amounts are static.
- Video Lottery landing keeps its sort/filter labels as text.
