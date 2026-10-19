/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-video-lottery-detail.js
  var import_video_lottery_detail_exports = {};
  __export(import_video_lottery_detail_exports, {
    default: () => import_video_lottery_detail_default
  });

  // tools/importer/parsers/hero-game.js
  var ORIGIN = "https://www.alc.ca";
  var LIVE_CASINO_LOBBY = "/content/alc/en/play-online/casino.html#live-casino";
  function absolutize(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN}${v}`;
    return v;
  }
  function clean(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function linkParagraph(document2, href, text, strong) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    if (strong) {
      const s = document2.createElement("strong");
      s.append(a);
      p.append(s);
    } else {
      p.append(a);
    }
    return p;
  }
  function bgUrl(el) {
    const style = el && el.getAttribute("style") || "";
    const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : "";
  }
  function parseVltTeaser(element, document2) {
    const cells = [];
    let bg = bgUrl(element);
    if (!bg) {
      const styled = [...element.querySelectorAll('[style*="background-image"]')].find((el) => bgUrl(el));
      bg = bgUrl(styled);
    }
    const title = element.getAttribute("data-gtm-variant") || "";
    if (bg) {
      const img = document2.createElement("img");
      img.src = absolutize(bg);
      img.alt = title;
      cells.push([img]);
    }
    const logoEl = element.querySelector(".cmp-teaser__logo img, .cmp-teaser__content img, img");
    if (logoEl && logoEl.getAttribute("src")) {
      const logo = document2.createElement("img");
      logo.src = absolutize(logoEl.getAttribute("src"));
      logo.alt = logoEl.getAttribute("alt") || title;
      cells.push([logo]);
    }
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-game", cells });
    element.replaceWith(block);
  }
  function parse(element, { document: document2 }) {
    if (element.classList.contains("alc-custom-teaser") && !element.querySelector(".alc-game-details-header__cta-wrapper")) {
      parseVltTeaser(element, document2);
      return;
    }
    const cells = [];
    const imgEl = element.querySelector(".cmp-teaser__image img, .cmp-image img, img.cmp-image__image");
    if (imgEl && imgEl.getAttribute("src")) {
      const img = document2.createElement("img");
      img.src = absolutize(imgEl.getAttribute("src"));
      img.alt = imgEl.getAttribute("alt") || "";
      cells.push([img]);
    }
    const wrapper = element.querySelector(".alc-game-details-header__cta-wrapper");
    const unavailable = element.querySelector("#gameUnavailable, [data-game-type]");
    const gameId = wrapper && (wrapper.getAttribute("data-game-identifier") || wrapper.getAttribute("data-gtm-id")) || unavailable && unavailable.getAttribute("data-gameid") || "";
    const gameType = unavailable && unavailable.getAttribute("data-game-type") || (element.classList.contains("alc-game-details-header--di") ? "instant" : "casino");
    const isInstant = gameType === "instant" || element.classList.contains("alc-game-details-header--di");
    const playEl = element.querySelector(".alc-game-details-header__play-now a, .alc-game-details-header__play-now button");
    const demoEl = element.querySelector(".alc-game-details-header__demo a, .alc-game-details-header__demo button");
    const playText = clean(playEl && playEl.textContent) || playEl && playEl.getAttribute("title") || "";
    const ctas = [];
    if (playEl && /browse games/i.test(playText)) {
      ctas.push(linkParagraph(document2, LIVE_CASINO_LOBBY, playText, true));
    } else {
      const base = isInstant ? "/content/alc/en/play-online/instant-win-games/game.html" : "/en/casino/game.html";
      const modes = isInstant ? ["M", "D"] : ["real", "demo"];
      const build = (mode) => `${base}?gameId=${encodeURIComponent(gameId)}&playMode=${mode}`;
      if (playEl) {
        const href = playEl.tagName === "A" && playEl.getAttribute("href") || (gameId ? build(modes[0]) : "");
        if (href) ctas.push(linkParagraph(document2, href, playText || "Play now", true));
      }
      if (demoEl) {
        const demoText = clean(demoEl.textContent) || "TRY DEMO";
        const href = demoEl.tagName === "A" && demoEl.getAttribute("href") || (gameId ? build(modes[1]) : "");
        if (href) ctas.push(linkParagraph(document2, href, demoText, false));
      }
    }
    if (ctas.length) cells.push([ctas]);
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-game", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-thumbnails.js
  var ORIGIN2 = "https://www.alc.ca";
  function absolutize2(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN2}${v}`;
    return v;
  }
  function parse2(element, { document: document2 }) {
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    let slides = [...element.querySelectorAll("li.slide")];
    if (!slides.length) slides = [...element.querySelectorAll(".slides > li")];
    slides.filter((slide) => !slide.classList.contains("clone") && slide.getAttribute("aria-hidden") !== "true").forEach((slide) => {
      const imgEl = slide.querySelector("img");
      const src = imgEl && (imgEl.getAttribute("src") || imgEl.getAttribute("data-src"));
      if (!src) return;
      const abs = absolutize2(src);
      if (seen.has(abs)) return;
      seen.add(abs);
      const img = document2.createElement("img");
      img.src = abs;
      img.alt = imgEl.getAttribute("alt") || "";
      cells.push([img]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-thumbnails", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/alc-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ORIGIN3 = "https://www.alc.ca";
  var ALC_HOSTS = ["www.alc.ca", "alc.ca"];
  function absolutizeUrl(value) {
    if (!value) return value;
    const v = value.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN3}${v}`;
    return v;
  }
  function absolutizeSrcset(srcset) {
    return srcset.split(",").map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      return [absolutizeUrl(url), ...rest].join(" ");
    }).join(", ");
  }
  function fixImages(element) {
    element.querySelectorAll("img[src], source[srcset], img[srcset]").forEach((el) => {
      const src = el.getAttribute("src");
      if (src && src.startsWith("/")) el.setAttribute("src", absolutizeUrl(src));
      const srcset = el.getAttribute("srcset");
      if (srcset) el.setAttribute("srcset", absolutizeSrcset(srcset));
    });
    element.querySelectorAll("[data-src]").forEach((el) => {
      const dataSrc = el.getAttribute("data-src");
      if (dataSrc && (dataSrc.startsWith("/") || dataSrc.startsWith("//"))) {
        el.setAttribute("data-src", absolutizeUrl(dataSrc));
      }
    });
    element.querySelectorAll('[style*="url"]').forEach((el) => {
      const style = el.getAttribute("style");
      const next = style.replace(/url\((['"]?)(\/[^'")]+)\1\)/g, (m, q, u) => `url(${q}${absolutizeUrl(u)}${q})`);
      if (next !== style) el.setAttribute("style", next);
    });
  }
  var APP_SCREEN_RE = new RegExp([
    "^/content/alc/en/(cart|checkout|confirmation|login|search-results|payment-authorization-failed",
    "|email-communications|interact-redirect|2chance-history-redirect|short-break-confirmation",
    "|long-break-confirmation)\\.html$",
    "|^/content/alc/en/(long-term-return-to-play|short-term-return-to-play|registration|game-configurator)(/.*)?\\.html$",
    "|^/content/alc/en/rewards/(existing-account-confirmation|join-rewards|points-details)\\.html$",
    "|^/content/alc/en/play-online/(casino|instant-win-games)/game\\.html$",
    "|^/content/alc/en/play-online/lottomax\\.html$",
    "|^/content/alc/en/corporate/about-atlantic-lottery/contact-us/send-a-message\\.html$",
    "|^/content/alc/en/referenced-content/"
  ].join(""));
  var isAppScreen = (path) => APP_SCREEN_RE.test(path);
  function rewriteLink(href) {
    if (!href) return href;
    const raw = href.trim();
    if (raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) return href;
    let url;
    try {
      url = new URL(raw, ORIGIN3);
    } catch (e) {
      return href;
    }
    const isRelative = raw.startsWith("/") && !raw.startsWith("//");
    if (!isRelative && !ALC_HOSTS.includes(url.hostname)) return href;
    let path = url.pathname;
    const isAsset = path.startsWith("/content/dam/");
    const isGameLauncher = /\/game\.html$/.test(path) && url.searchParams.has("gameId");
    if (isAsset || isGameLauncher || isAppScreen(path) || !path.startsWith("/content/alc")) {
      if (path.startsWith("/etc.clientlibs")) return href;
      return `${ORIGIN3}${path}${url.search}${url.hash || ""}`;
    }
    path = path.replace(/^\/content\/alc/, "") || "/";
    path = path.replace(/\.html$/, "");
    if (path === "" || path === "/en" || path === "/en/") path = "/";
    if (path !== "/") {
      path = path.split("/").map((seg) => {
        if (!seg) return seg;
        let s = seg;
        try {
          s = decodeURIComponent(s);
        } catch (e) {
        }
        return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }).join("/");
    }
    const params = new URLSearchParams(url.search);
    [...params.keys()].forEach((key) => {
      if (/^(itm_|utm_)/i.test(key)) params.delete(key);
    });
    const query = params.toString();
    return `${path}${query ? `?${query}` : ""}${url.hash || ""}`;
  }
  var DETAIL_PAGE_CHROME_SELECTORS = [
    '[role="banner"]',
    "div.xfpage",
    "#loginFlow",
    "header",
    // Header parts that sit outside <header> (siblings of .xfpage in the cleaned snapshot):
    // signed-in dashboard, top nav + off-canvas mobile nav, collapsible header promo.
    ".logged-in-info-wrapper",
    ".topnav",
    "#nav-mobile",
    "#collapsible-promo",
    "footer.main-footer",
    // Browser-upgrade modal (sibling of .common-modals on detail pages)
    ".modal-browser-check",
    // Site-wide alert/notification banners (<section data-bind="if: message"><div class="alert-area">)
    'section[data-bind="if: message"]',
    ".alert-area",
    ".notification.section",
    ".cmp-notification"
  ];
  function isGameDetailPage(root) {
    return !isVideoLotteryPage(root) && !!root.querySelector("section.alc-game-details-header, div.digital-instants-info-page");
  }
  function isVideoLotteryPage(root) {
    return !!root.querySelector("div.video-lottery-info-page");
  }
  var PENDING_METADATA = /* @__PURE__ */ new WeakMap();
  function registerPageMetadata(main, extra) {
    const rules = WebImporter && WebImporter.rules;
    if (!rules || typeof rules.createMetadata !== "function") return;
    if (!rules.createMetadata.alcMetadataWrapped) {
      const original = rules.createMetadata;
      const wrapped = function createMetadataWithExtras(m, doc) {
        const extras = PENDING_METADATA.get(m);
        if (!extras) return original.call(this, m, doc);
        PENDING_METADATA.delete(m);
        const base = WebImporter.Blocks && typeof WebImporter.Blocks.getMetadata === "function" ? WebImporter.Blocks.getMetadata(doc) : {};
        const meta = __spreadValues(__spreadValues({}, base), extras);
        m.append(WebImporter.Blocks.createBlock(doc, { name: "Metadata", cells: meta }));
        return meta;
      };
      wrapped.alcMetadataWrapped = true;
      try {
        rules.createMetadata = wrapped;
      } catch (e) {
        return;
      }
    }
    PENDING_METADATA.set(main, __spreadValues(__spreadValues({}, PENDING_METADATA.get(main) || {}), extra));
  }
  function removeSdiComments(root) {
    const walker = root.ownerDocument.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) {
      if (/SDI include/i.test(walker.currentNode.nodeValue || "")) comments.push(walker.currentNode);
    }
    comments.forEach((c) => c.remove());
  }
  function renameTag(el, tagName) {
    const next = el.ownerDocument.createElement(tagName);
    next.append(...el.childNodes);
    el.replaceWith(next);
    return next;
  }
  function cleanupGameDetailPage(element) {
    const doc = element.ownerDocument;
    const header = element.querySelector("section.alc-game-details-header");
    const unavailable = element.querySelector("#gameUnavailable");
    if (header && unavailable) {
      ["data-game-lobby-url", "data-gameid", "data-game-type"].forEach((attr) => {
        const v = unavailable.getAttribute(attr);
        if (v && !header.hasAttribute(attr)) header.setAttribute(attr, v);
      });
    }
    element.querySelectorAll(".cmp-breadcrumb").forEach((bc) => {
      const wrapper = bc.closest("section.hidden-xs") || bc.closest(".cmp-breadcrumb--alc") || bc;
      wrapper.remove();
    });
    WebImporter.DOMUtils.remove(element, [
      ...DETAIL_PAGE_CHROME_SELECTORS,
      // Live-casino lobby launch button + modal popup
      "#live-casino-component",
      "#live-casino-modal",
      // Hidden "Bonus Offer" rewards banner (filled client-side)
      "section.rewards-section",
      // Hidden "Game currently unavailable" message
      "#gameUnavailable",
      // Duplicate thumbnail strip: carousel-thumbnails parser only reads .slideshow-main
      ".alc-carousel.slideshow-thumbnails",
      // Favourite heart (account feature)
      ".alc-game-details-header__favourite",
      // Decorative background image (static/alc-images/background.jpg) and title logo
      "div.digital-instants-info-page > img",
      ".alc-image-browser__heading > img"
    ]);
    const body = element.querySelector("div.digital-instants-info-page");
    if (body && /background/i.test(body.getAttribute("style") || "")) body.removeAttribute("style");
    element.querySelectorAll(".alc-image-browser__heading").forEach((heading) => {
      const h1src = heading.querySelector("h1");
      if (!h1src) return;
      const prize = h1src.querySelector(".alc-image-browser__game-prize");
      const prizeText = prize ? prize.textContent.replace(/\s+/g, " ").trim() : "";
      if (prize) prize.remove();
      const title = h1src.textContent.replace(/\s+/g, " ").trim();
      const nodes = [];
      if (title) {
        const h1 = doc.createElement("h1");
        h1.textContent = title;
        nodes.push(h1);
      }
      if (prizeText) {
        const p = doc.createElement("p");
        p.textContent = prizeText;
        nodes.push(p);
      }
      heading.replaceWith(...nodes);
    });
    element.querySelectorAll(".digital-instants-game-summary").forEach((summary) => {
      const inner = summary.querySelector("#gameSummary") || summary.querySelector("section") || summary;
      inner.querySelectorAll("b").forEach((b) => renameTag(b, "strong"));
      inner.querySelectorAll("i").forEach((i) => renameTag(i, "em"));
      const nodes = [...inner.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim());
      if (!nodes.some((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName))) {
        const h2 = doc.createElement("h2");
        h2.textContent = "Game Summary";
        nodes.unshift(h2);
      }
      summary.replaceWith(...nodes);
    });
    let titleSeen = false;
    element.querySelectorAll('[id="haveYouTriedTitle"]').forEach((title) => {
      if (title.matches(".alc-hyt") || title.querySelector(".alc-hyt, .alc-hyt__container")) {
        title.removeAttribute("id");
        return;
      }
      if (titleSeen) {
        title.remove();
        return;
      }
      titleSeen = true;
      const text = (title.querySelector("h1, h2, h3, h4, h5, h6") || title).textContent.replace(/\s+/g, " ").trim();
      if (!text) {
        title.remove();
        return;
      }
      const h2 = doc.createElement("h2");
      h2.textContent = text;
      title.replaceWith(h2);
    });
  }
  function isTicketDetailPage(root) {
    return !!root.querySelector("div.game-detail-scratch");
  }
  function cleanupTicketDetailPage(element) {
    const doc = element.ownerDocument;
    const scratch = element.querySelector("div.game-detail-scratch");
    WebImporter.DOMUtils.remove(element, DETAIL_PAGE_CHROME_SELECTORS);
    scratch.querySelectorAll("div.breadcrumb-container").forEach((bc) => {
      const next = bc.nextSibling && bc.nextSibling.nodeType === 3 ? bc.nextSibling.nextSibling : bc.nextSibling;
      if (next && next.nodeType === 8 && /breadcrumb-container/.test(next.nodeValue || "")) next.remove();
      bc.remove();
    });
    WebImporter.DOMUtils.remove(scratch, [
      "section.body-content > img",
      "div.game-details-info > div.heading > img"
    ]);
    scratch.querySelectorAll("div.sidebar").forEach((sidebar) => {
      if (!sidebar.textContent.trim() && !sidebar.querySelector("img, picture, video, iframe, a")) sidebar.remove();
    });
    scratch.querySelectorAll("div.game-details-info > div.heading").forEach((heading) => {
      const text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
      const nameEl = heading.querySelector("h1.name") || heading.querySelector("h1:not(.price)");
      const name = text(nameEl);
      const price = text(heading.querySelector(".price"));
      const nodes = [];
      if (name) {
        const h1 = doc.createElement("h1");
        h1.textContent = name;
        nodes.push(h1);
      }
      if (price) {
        const p = doc.createElement("p");
        p.textContent = price;
        nodes.push(p);
      }
      heading.replaceWith(...nodes);
    });
  }
  var VLT_SUMMARY_HEADING = /^game summary:?$/i;
  function normText(el) {
    return (el ? el.textContent : "").replace(/[\s ]+/g, " ").trim();
  }
  function isEmptyContainer(el) {
    return !normText(el) && !el.querySelector('img, picture, video, iframe, [style*="url"]');
  }
  function cleanupVideoLotteryPage(element) {
    const doc = element.ownerDocument;
    WebImporter.DOMUtils.remove(element, [
      ...DETAIL_PAGE_CHROME_SELECTORS,
      // Duplicate thumbnail strip: carousel-thumbnails parser only reads .slideshow-main
      ".alc-carousel.slideshow-thumbnails",
      // Empty tracking div
      ".video-lottery-info-page .impress",
      // Decorative background image and title-bar logo
      "div.video-lottery-info-page > img",
      ".alc-image-browser__heading > img"
    ]);
    element.querySelectorAll(".cmp-breadcrumb").forEach((bc) => {
      const wrapper = bc.closest("section.hidden-xs") || bc.closest(".cmp-breadcrumb--alc") || bc;
      wrapper.remove();
    });
    element.querySelectorAll("div.video-lottery-info-page").forEach((body) => {
      if (/background|--bg/i.test(body.getAttribute("style") || "")) body.removeAttribute("style");
    });
    element.querySelectorAll("div.page-faqs").forEach((faqs) => {
      WebImporter.DOMUtils.remove(faqs, ["meta", "link", "script", "noscript", "style", "title"]);
      const text = normText(faqs);
      if (!text || /^faqs?$/i.test(text)) {
        faqs.remove();
        return;
      }
      faqs.querySelectorAll("h1").forEach((h) => renameTag(h, "h2"));
      const nodes = [...faqs.querySelectorAll("h2, h3, h4, h5, h6, p, ul, ol")].filter((n) => !n.parentElement.closest("p, ul, ol") && normText(n));
      faqs.replaceWith(...nodes);
    });
    element.querySelectorAll(".video-lottery-info-page aside").forEach((aside) => {
      if (isEmptyContainer(aside)) aside.remove();
    });
    element.querySelectorAll("section.alc-game-details-header--vlt").forEach((header) => {
      if (!header.querySelector(".cmp-teaser") && isEmptyContainer(header)) header.remove();
    });
    element.querySelectorAll("div.alc-container.section, div.cfm.section").forEach((container) => {
      if (isEmptyContainer(container)) container.remove();
    });
    element.querySelectorAll(".video-lottery-info-page .alc-image-browser__heading").forEach((heading) => {
      const title = normText(heading.querySelector("h1"));
      if (!title) {
        heading.remove();
        return;
      }
      const h1 = doc.createElement("h1");
      h1.textContent = title;
      heading.replaceWith(h1);
    });
    element.querySelectorAll(".video-lottery-game-summary").forEach((summary) => {
      const outer = summary.closest("section.alc-game-details__summary") || summary;
      const inner = summary.querySelector("#gameSummary") || summary.querySelector("section") || summary;
      inner.querySelectorAll("b").forEach((b) => renameTag(b, "strong"));
      inner.querySelectorAll("i").forEach((i) => renameTag(i, "em"));
      inner.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p").forEach((el) => {
        if (VLT_SUMMARY_HEADING.test(normText(el))) {
          const h2 = doc.createElement("h2");
          h2.textContent = "Game Summary";
          el.replaceWith(h2);
        }
      });
      const nodes = [...inner.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim());
      outer.replaceWith(...nodes);
    });
  }
  function fixSlugTitle(doc, h1Root, anyCase) {
    const title = (doc.title || "").trim();
    const slugRe = anyCase ? /^[a-z0-9]+(-[a-z0-9]+)*$/i : /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRe.test(title)) return;
    const ogTitle = doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
    const og = ogTitle ? (ogTitle.content || "").trim() : "";
    const ogIsReal = og && og !== title && !/^\d+$/.test(og);
    if (h1Root && !ogIsReal) {
      const h1 = h1Root.querySelector("div.game-details-info h1.name") || h1Root.querySelector("h1");
      const h1Text = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "";
      if (h1Text) {
        doc.title = h1Text;
        if (ogTitle) ogTitle.setAttribute("content", h1Text);
        return;
      }
    }
    if (og) doc.title = og;
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const doc = payload && payload.document || document;
      if (isTicketDetailPage(element)) {
        fixSlugTitle(doc, element.querySelector("div.game-detail-scratch"));
        cleanupTicketDetailPage(element);
        registerPageMetadata(element, { Breadcrumbs: "true" });
      } else if (isVideoLotteryPage(element)) {
        fixSlugTitle(doc, null, true);
        cleanupVideoLotteryPage(element);
        registerPageMetadata(element, { Breadcrumbs: "true" });
      } else {
        fixSlugTitle(doc, null);
      }
      if (isGameDetailPage(element)) {
        cleanupGameDetailPage(element);
        registerPageMetadata(element, { Breadcrumbs: "true" });
      }
      removeSdiComments(element);
      WebImporter.DOMUtils.remove(element, [
        // Global header experience fragment (contains nav, login/MFA modals, session timer) - migrated as nav fragment
        "div.experiencefragment",
        ".cmp-experiencefragment--header",
        // Global footer experience fragment - migrated as footer fragment
        "footer.experiencefragment",
        ".cmp-experiencefragment--footer",
        // Site-wide modals (jackpot modal, browser-upgrade modal)
        ".common-modals",
        // NOTE: .html-promo (mobile-only "Check winning numbers" banner) is real content and is
        // converted by the cards-promo parser - do not remove it or strip its attributes here.
        // Skip-to-main-content link
        ".cmp-page__skiptomaincontent",
        // Qualtrics intercept container (<div id="ZN_3Eu2u7P45FmpwJ5">)
        "#ZN_3Eu2u7P45FmpwJ5",
        // Countdown timers inside hero carousel slides
        ".next-draw-timer",
        // Tracking iframes (doubleclick, adsrvr "TTD Universal Pixel")
        "iframe"
      ]);
      fixImages(element);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "noscript",
        "script",
        "link",
        "style",
        // Tracking pixels present on the live page (adservice / reddit / adnxs)
        'img[src*="adservice"]',
        'img[src*="reddit"]',
        'img[src*="adnxs"]',
        'img[src*="adsrvr"]',
        'img[src*="doubleclick"]'
      ]);
      element.querySelectorAll(".section-header").forEach((header) => {
        const title = header.querySelector(".cmp-section-header__title");
        if (!title) return;
        const h2 = document.createElement("h2");
        h2.textContent = title.textContent.trim();
        header.replaceWith(h2);
      });
      element.querySelectorAll(".cq-dd-paragraph").forEach((wrapper) => {
        wrapper.replaceWith(...wrapper.childNodes);
      });
      fixImages(element);
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const next = rewriteLink(href);
        if (next !== href) a.setAttribute("href", next);
      });
    }
  }

  // tools/importer/transformers/alc-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (!sections.length) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
      let first = element.firstElementChild;
      while (first && first.tagName !== "HR" && !first.textContent.trim() && !first.querySelector("img, picture, table, hr")) {
        first = first.nextElementSibling;
      }
      if (first && first.tagName === "HR") first.remove();
    }
  }

  // tools/importer/import-video-lottery-detail.js
  var parsers = {
    "hero-game": parse,
    "carousel-thumbnails": parse2
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 0 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  function toDocumentPath(originalURL) {
    const rawPath = new URL(originalURL).pathname.replace(/^\/content\/alc/, "").replace(/\/$/, "").replace(/\.html?$/, "");
    if (rawPath === "" || rawPath === "/en") return "/index";
    return WebImporter.FileUtils.sanitizePath(rawPath);
  }
  var import_video_lottery_detail_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = toDocumentPath(params.originalURL);
      const report = {
        title: document2.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name)
      };
      return [{ element: main, path, report }];
    }
  };
  return __toCommonJS(import_video_lottery_detail_exports);
})();
