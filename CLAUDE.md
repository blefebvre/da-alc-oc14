see @AGENTS.md

# alc.ca migration notes

Migration of https://www.alc.ca/content/alc/en.html (English, then French: see "French" below) to this DA project.
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
- Content pages: source `<table>`s that no parser handles (lotto prize payouts in `.payout-tables`, careers, some
  releases) are converted to `table` blocks at the end of `import-content-page.js`. Otherwise the importer turns
  them into a block named after the first cell (e.g. "match"). Check for unknown block names after an import.
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

## Still open
- Design pass for the content-page blocks (hero-banner, cards-feature, columns-media, columns-contact, embed, table)
  and the light-blue / light-grey / centered section styles: they have structural CSS only.
- Re-import `/en/play-online/casino`: its game grid is client-rendered from an API and was not captured.
- Lotto tiles have no images (CSS sprites on alc.ca).
- Jackpot amounts are static (imported text, not live data).
- Video Lottery landing keeps its sort/filter labels as text.

## French (in progress, started 2026-11-03)
- Paths mirror English: `/content/alc/fr/x.html` -> `/fr/x` (alc.ca uses the English slugs for almost every
  French page). French homepage: `/fr/` (document `fr/index`); `/fr` and `/content/alc/fr.html` redirect to it.
- URL lists: `tools/importer/urls-fr-<template>.txt`, built from the alc.ca French sitemap
  (`data/urls-fr-sitemap.txt`) by giving each French page the template of its English counterpart; French-only
  pages (e.g. `/fr/promos/demandez-nous`) get one by path. Same templates, parsers and transformers as English.
- Importer language handling: `alc-cleanup.js` (`pageLang`, from the source URL / `<html lang>`), APP_SCREEN_RE
  matches `en|fr`, `hero-game.js` launchers (`/fr/casino/game.html`, French live-casino lobby), inserted headings
  ("Résumé du jeu") and the homepage mobile banner label.
- Nav / footer: `content/fr/nav.plain.html` and `content/fr/footer.plain.html` are generated from the English
  fragments by `tools/importer/build-fr-fragments.py`. It pairs the alc.ca EN and FR header / footer pieces (same
  structure, footer lists in a different order, so link texts are matched by target) and downloads the French nav
  tiles and footer logos (`content/images/fr-*`). The sign-in panel wording differs, so its texts are listed by
  hand in the script (`SIGN_IN`). Regenerate after editing the English nav or footer.
- Site code: `scripts/i18n.js` (`getLanguage()`, `t()` UI strings, `getAlternatePath()`). Header and footer load
  `/fr/nav` and `/fr/footer` on French pages; `<html lang>` follows the path; breadcrumbs use French labels
  (`BREADCRUMB_LABELS.fr` in `scripts/scripts.js`, taken from alc.ca's French breadcrumbs); the FR / EN toggle
  links to the same page in the other language.
- Redirects: `build-redirects.cjs` covers both languages (alc.ca 302s mirrored for `/fr/...` too, French status
  checks in `data/unmigrated-status-fr.txt`).
- Found while inventorying French: 37 live English pages (31 casino games, others) were not in the original
  catalog and are now in the English URL lists.
