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

  // tools/importer/import-ticket-detail.js
  var import_ticket_detail_exports = {};
  __export(import_ticket_detail_exports, {
    default: () => import_ticket_detail_default
  });

  // tools/importer/parsers/columns-ticket.js
  var ORIGIN = "https://www.alc.ca";
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
  function bestSrc(img) {
    const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
    if (srcset) {
      let best = "";
      let bestW = -1;
      srcset.split(",").forEach((part) => {
        const [u, d] = part.trim().split(/\s+/);
        const w = d ? parseFloat(d) : 0;
        if (u && w > bestW) {
          best = u;
          bestW = w;
        }
      });
      if (best) return best;
    }
    return img.getAttribute("src") || img.getAttribute("data-src") || "";
  }
  function parse(element, { document: document2 }) {
    const mediaCell = [];
    const numEl = element.querySelector(".game-number");
    const gameNum = clean(numEl && numEl.textContent);
    if (gameNum) {
      const p = document2.createElement("p");
      p.textContent = gameNum;
      mediaCell.push(p);
    }
    const srcImg = element.querySelector(".ticket-image img") || element.querySelector("img");
    if (srcImg) {
      const src = absolutize(bestSrc(srcImg));
      if (src) {
        const img = document2.createElement("img");
        img.src = src;
        img.alt = srcImg.getAttribute("alt") || (gameNum ? `Ticket ${gameNum}` : "");
        mediaCell.push(img);
      }
    }
    const infoCell = [];
    const details = element.querySelector(".game-details") || element;
    [...details.querySelectorAll(":scope > p")].forEach((srcP) => {
      const labelEl = srcP.querySelector("span, strong, b");
      const full = clean(srcP.textContent);
      const textMatch = full.match(/^([^:]{2,60}:)\s*(.*)$/);
      const label = clean(labelEl && labelEl.textContent) || (textMatch ? textMatch[1] : "");
      const value = label ? clean(full.slice(full.indexOf(label) + label.length)) : full;
      if (!value && !label) return;
      const p = document2.createElement("p");
      if (label) {
        const strong = document2.createElement("strong");
        strong.textContent = label;
        p.append(strong, document2.createTextNode(` ${value}`));
      } else {
        p.textContent = value;
      }
      infoCell.push(p);
    });
    const linkEl = details.querySelector(".top-prizes-remaining a[href]");
    if (linkEl) {
      const text = clean(linkEl.textContent);
      if (text) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = linkEl.getAttribute("href");
        a.textContent = text;
        p.append(a);
        infoCell.push(p);
      }
    }
    if (!mediaCell.length && !infoCell.length) {
      element.remove();
      return;
    }
    const cells = [[mediaCell, infoCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-ticket", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-bar.js
  function clean2(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  var ORIGIN2 = "https://www.alc.ca";
  var CONTAINER = ".alc-container, .cmp-container, .aem-Grid, .responsivegrid, .container, .xf-content-height, .experiencefragment, .cmp-experiencefragment";
  function absolutize2(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN2}${v}`;
    return v;
  }
  function strongLinkParagraph(document2, a) {
    const href = a.getAttribute("href");
    const text = clean2(a.textContent) || a.getAttribute("title") || "";
    if (!href || href === "#" || !text) return null;
    const p = document2.createElement("p");
    const strong = document2.createElement("strong");
    const link = document2.createElement("a");
    link.href = absolutize2(href);
    link.textContent = text;
    strong.append(link);
    p.append(strong);
    return p;
  }
  function imgFrom(document2, imgEl) {
    const src = imgEl && (imgEl.getAttribute("src") || "").trim();
    if (!src) return null;
    const img = document2.createElement("img");
    img.src = absolutize2(src);
    img.alt = imgEl.getAttribute("alt") || "";
    return img;
  }
  function flatten(document2, root) {
    const out = [];
    root.querySelectorAll("a").forEach((a) => {
      if (!clean2(a.textContent) && !a.querySelector("img")) a.remove();
    });
    const visit = (el) => {
      if (el.nodeType === 3) {
        if (clean2(el.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean2(el.textContent);
          out.push(p);
        }
        return;
      }
      if (el.nodeType !== 1) return;
      if (el.matches("script, style, noscript, .separator, .cmp-separator, hr")) return;
      if (el.matches(".cmp-text, .text-area")) {
        [...el.children].forEach((c) => {
          if (!clean2(c.textContent) && !c.querySelector("img, table")) return;
          out.push(c);
        });
        return;
      }
      if (el.matches(".cmp-title")) {
        const h = el.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && clean2(h.textContent)) {
          const nh = document2.createElement(/^H[12]$/.test(h.tagName) ? "h3" : h.tagName.toLowerCase());
          nh.textContent = clean2(h.textContent);
          out.push(nh);
        }
        return;
      }
      if (el.matches(".cmp-image, .image")) {
        const img = imgFrom(document2, el.querySelector("img"));
        if (img) out.push(img);
        return;
      }
      if (el.matches(".alc-button, .cmp-button, .dynamic-cta, .cmp-dynamic-cta")) {
        el.querySelectorAll("a[href]").forEach((a) => {
          const p = strongLinkParagraph(document2, a);
          if (p) out.push(p);
        });
        return;
      }
      if (el.matches(".cmp-teaser")) {
        const img = imgFrom(document2, el.querySelector(".cmp-teaser__image img"));
        if (img) out.push(img);
        const title = clean2(el.querySelector(".cmp-teaser__title") && el.querySelector(".cmp-teaser__title").textContent);
        if (title) {
          const h = document2.createElement("h4");
          h.textContent = title;
          out.push(h);
        }
        const desc = el.querySelector(".cmp-teaser__description");
        if (desc) [...desc.children].forEach((c) => {
          if (clean2(c.textContent)) out.push(c);
        });
        el.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
          const href = a.getAttribute("href");
          if (!href || href === "#" || !clean2(a.textContent)) return;
          const p = document2.createElement("p");
          const link = document2.createElement("a");
          link.href = absolutize2(href);
          link.textContent = clean2(a.textContent);
          p.append(link);
          out.push(p);
        });
        return;
      }
      if (el.matches(".cmp-embed")) {
        const f = el.querySelector("iframe[src]");
        const m = f && f.getAttribute("src").match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
        const href = m ? `https://www.youtube.com/watch?v=${m[1]}` : f ? absolutize2(f.getAttribute("src")) : "";
        if (href) {
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = href;
          p.append(a);
          out.push(p);
        }
        return;
      }
      if (el.matches(CONTAINER) || el.tagName === "DIV" && el.children.length && !el.matches("p")) {
        [...el.childNodes].forEach(visit);
        return;
      }
      if (clean2(el.textContent) || el.querySelector("img, table") || el.tagName === "IMG") out.push(el);
    };
    [...root.childNodes].forEach(visit);
    return out;
  }
  function parseCoreAccordion(element, document2) {
    const cells = [];
    [...element.querySelectorAll(":scope > .cmp-accordion__item")].forEach((item) => {
      const titleEl = item.querySelector(":scope > .cmp-accordion__header .cmp-accordion__title") || item.querySelector(".cmp-accordion__title, .cmp-accordion__button");
      const title = clean2(titleEl && titleEl.textContent);
      if (!title) return;
      const panel = item.querySelector(":scope > .cmp-accordion__panel") || item.querySelector(".cmp-accordion__panel");
      const body = panel ? flatten(document2, panel) : [];
      cells.push([title, body.length ? body : ""]);
    });
    return cells;
  }
  function parse2(element, { document: document2 }) {
    if (element.matches(".cmp-accordion")) {
      const coreCells = parseCoreAccordion(element, document2);
      if (!coreCells.length) {
        element.remove();
        return;
      }
      const coreBlock = WebImporter.Blocks.createBlock(document2, { name: "accordion-bar", cells: coreCells });
      element.replaceWith(coreBlock);
      return;
    }
    const cells = [];
    const panels = [...element.querySelectorAll(":scope > .panel")];
    panels.forEach((panel) => {
      const titleEl = panel.querySelector(".panel-title") || panel.querySelector(".panel-heading");
      const title = clean2(titleEl && titleEl.textContent);
      if (!title) return;
      const bodyEl = panel.querySelector(".panel-body") || panel.querySelector(".panel-collapse");
      const body = [];
      if (bodyEl) {
        [...bodyEl.children].forEach((child) => {
          if (!clean2(child.textContent) && !child.querySelector("img")) return;
          body.push(child);
        });
        if (!body.length && clean2(bodyEl.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean2(bodyEl.textContent);
          body.push(p);
        }
      }
      cells.push([title, body]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-bar", cells });
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
    "|^/content/alc/en/(long-term-return-to-play|short-term-return-to-play|registration|game-configurator|my-account)(/.*)?\\.html$",
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
    if (/^\/[^/@]+@[a-z0-9.-]+$/i.test(path)) return `mailto:${path.slice(1)}`;
    const shortGame = path.match(/^\/en\/(casino|instant-win-games)\/([^/]+)\.html$/);
    if (shortGame && shortGame[2] !== "game") path = `/content/alc/en/play-online/${shortGame[1]}/${shortGame[2]}.html`;
    if (path === "/" && !isRelative) return "/";
    const isAsset = path.startsWith("/content/dam/");
    const isGameLauncher = /\/game\.html$/.test(path) && url.searchParams.has("gameId");
    if (isAsset || isGameLauncher || isAppScreen(path) || !path.startsWith("/content/alc")) {
      if (path.startsWith("/etc.clientlibs")) return href;
      return `${ORIGIN3}${path}${url.search}${url.hash || ""}`;
    }
    path = path.replace(/^\/content\/alc/, "") || "/";
    path = path.replace(/\.html?$/, "");
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
  var CONTENT_PAGES = /* @__PURE__ */ new WeakSet();
  function isHomepageUrl(url) {
    if (!url) return false;
    try {
      const { pathname } = new URL(url, ORIGIN3);
      return /^\/(content\/alc\/en(\.html)?|en(\.html)?)?\/?$/.test(pathname);
    } catch (e) {
      return false;
    }
  }
  function isContentPage(root, payload) {
    if (isTicketDetailPage(root) || isVideoLotteryPage(root) || isGameDetailPage(root)) return false;
    const template = payload && payload.template;
    if (template && template.name) return template.name === "content-page";
    const url = payload && (payload.params && payload.params.originalURL || payload.url) || "";
    return !!url && !isHomepageUrl(url);
  }
  var CONTENT_PAGE_CHROME_SELECTORS = [
    // Source breadcrumbs (AEM .breadcrumb component in the title banner; legacy
    // section#page-breadcrumb > .breadcrumb-container). Auto-generated in EDS ("Breadcrumbs: true").
    "section#page-breadcrumb",
    ".breadcrumb-container",
    ".breadcrumb",
    ".cmp-breadcrumb",
    // Legacy "Explore: ..." corporate sub-navigation dropdown (div.hero > [id^=corpmenu] > .corp-menu-container)
    ".corp-menu-container",
    ".cq-dd-pages",
    // Live chat (div.livechat > .alc-livechat > #livechat) and the CXone chat launcher
    ".livechat",
    ".alc-livechat",
    "#cxone-guide-container",
    // ShareThis helper
    "#stcpDiv",
    // App-only "Download our App" mobile banners (div.banner.section > .alc-mobile-banner)
    // (the emptied div.banner.section / .digital-instants-intro wrappers go with the empty spacers)
    ".alc-mobile-banner",
    // Alert bars / outage messages / hidden "Bonus Offer" rewards banner / checkout sign-in banner
    'section[id^="alert-"]',
    "#live-casino-outage-message",
    ".rewards-banner",
    "#direct-checkout-banner",
    // Live-casino lobby launcher + its game modal
    "#live-casino-component",
    "#live-casino-modal",
    // Hidden client-side states ("0 results", "Temporarily Unavailable")
    ".winners-error",
    ".jackpot-temp-unavailable.hidden",
    // Mobile-only filter toggles (the filter panels themselves stay with the game lists)
    "a.scratch-mobile-filter-expand",
    "p.filter.visible-xs",
    ".filters-collapse.visible-xs",
    // Homepage-only mobile "Check winning numbers" banner (homepage clones /en/our-games, /en/play-online)
    ".html-promo"
  ];
  var CONTENT_HERO_SELECTOR = ".alc-container.cmp-container--pw-content-hero-padding, .alc-container.cmp-container--pw-landing-hero-padding, div.hero";
  function cleanText(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/[\s ]+/g, " ").trim();
  }
  function renameTagKeepAttrs(el, tagName) {
    const next = el.ownerDocument.createElement(tagName);
    [...el.attributes].forEach((attr) => next.setAttribute(attr.name, attr.value));
    next.append(...el.childNodes);
    el.replaceWith(next);
    return next;
  }
  function videoWatchUrl(src) {
    if (!src) return "";
    const abs = absolutizeUrl(src);
    const yt = abs.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/#]+)/i);
    if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
    const short = abs.match(/youtu\.be\/([^?&/#]+)/i);
    if (short) return `https://www.youtube.com/watch?v=${short[1]}`;
    const vm = abs.match(/player\.vimeo\.com\/video\/(\d+)/i);
    if (vm) return `https://vimeo.com/${vm[1]}`;
    if (/youtube\.com\/watch|vimeo\.com\/\d+/i.test(abs)) return abs;
    return "";
  }
  function videoUrlsIn(scope) {
    const urls = [];
    scope.querySelectorAll("iframe[src], iframe[data-src], [data-video-url], [data-embed-url]").forEach((el) => {
      ["src", "data-src", "data-video-url", "data-embed-url"].forEach((attr) => {
        const u = videoWatchUrl(el.getAttribute(attr));
        if (u) urls.push(u);
      });
    });
    return [...new Set(urls)];
  }
  var TRACKING_SRC_RE = /doubleclick|adsrvr|adservice|adnxs|reddit|facebook\.com\/tr|googletagmanager|evolutionGame/i;
  var MODAL_SELECTOR = ".modal-xf, .cmp-modal, .alc-modal, .modal";
  function fixModalVideoLinks(root) {
    const doc = root.ownerDocument;
    const modals = [...root.querySelectorAll(MODAL_SELECTOR)];
    const allModalVideos = [...new Set(modals.flatMap((m) => videoUrlsIn(m)))];
    root.querySelectorAll("a").forEach((a) => {
      if (a.closest(MODAL_SELECTOR)) return;
      const href = (a.getAttribute("href") || "").trim();
      if (href && href !== "#" && !/^javascript:/i.test(href)) return;
      const target = a.getAttribute("data-target") || a.getAttribute("data-bs-target") || "";
      const opensModal = /modal/i.test(a.getAttribute("data-toggle") || a.getAttribute("data-bs-toggle") || "") || !!target;
      if (!opensModal && !/video|watch/i.test(cleanText(a.textContent))) return;
      let urls = [];
      if (target && target.startsWith("#")) {
        const modal = doc.getElementById(target.slice(1));
        if (modal) urls = videoUrlsIn(modal);
      }
      if (!urls.length) urls = allModalVideos;
      if (urls.length === 1) a.setAttribute("href", urls[0]);
    });
  }
  function similarText(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    const wa = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
    const wb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
    if (!wa.size || !wb.size) return false;
    let common = 0;
    wa.forEach((w) => {
      if (wb.has(w)) common += 1;
    });
    return common / Math.max(wa.size, wb.size) >= 0.6;
  }
  function imageKeys(el) {
    return [...el.querySelectorAll("img[src]")].map((i) => (i.getAttribute("src") || "").split("?")[0].split("/").pop()).filter(Boolean);
  }
  var MOBILE_ONLY_SELECTOR = ".aem-GridColumn--default--hide, .visible-xs, .visible-xs-block";
  var ALL_BREAKPOINTS_HIDDEN = ["xs", "sm", "md", "default"].map((bp) => `aem-GridColumn--${bp}--hide`);
  function removeHiddenDuplicates(root) {
    const hidden = [...root.querySelectorAll(MOBILE_ONLY_SELECTOR)];
    const hiddenSet = new Set(hidden);
    const kept = /* @__PURE__ */ new Set();
    const isPresent = (el) => {
      for (let p = el; p && p !== root; p = p.parentElement) {
        if (hiddenSet.has(p) && !kept.has(p)) return false;
      }
      return true;
    };
    hidden.forEach((el) => {
      if (!el.isConnected) return;
      if (isEmptyContainer(el) || ALL_BREAKPOINTS_HIDDEN.every((c) => el.classList.contains(c))) {
        el.remove();
        return;
      }
      const type = (el.classList[0] || el.tagName).toString();
      const text = cleanText(el.textContent);
      const imgs = imageKeys(el);
      const peers = [...root.getElementsByClassName(type)].filter((p) => p !== el && p.isConnected && !p.contains(el) && !el.contains(p) && isPresent(p));
      const desktopTwin = el.classList.contains("aem-GridColumn--default--hide") ? peers.some((p) => p.parentElement === el.parentElement && p.classList.contains("aem-GridColumn--xs--hide")) : peers.some((p) => p.parentElement === el.parentElement && p.classList.contains("hidden-xs"));
      const hasEquivalent = desktopTwin || peers.some((p) => {
        const pt = cleanText(p.textContent);
        if (text) return similarText(text, pt);
        const pi = imageKeys(p);
        return imgs.length && imgs.every((k) => pi.includes(k));
      });
      if (hasEquivalent) el.remove();
      else kept.add(el);
    });
  }
  function ctaParagraph(doc, href, text) {
    const p = doc.createElement("p");
    const strong = doc.createElement("strong");
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.textContent = text;
    strong.append(a);
    p.append(strong);
    return p;
  }
  function buttonHref(button) {
    if ((button.getAttribute("data-ga4-event") || "") === "rewards_join" || (button.getAttribute("data-ga4-param-user-flow") || "") === "join_rewards") {
      return "/content/alc/en/rewards/join-rewards.html";
    }
    const href = (button.getAttribute("href") || "").trim();
    return href && href !== "#" ? href : "";
  }
  function convertCtas(root) {
    const doc = root.ownerDocument;
    const outsideHero = (el) => !el.closest(CONTENT_HERO_SELECTOR) && !el.closest(".cmp-teaser");
    root.querySelectorAll(".dynamic-cta").forEach((wrapper) => {
      if (!outsideHero(wrapper)) return;
      const cta = wrapper.querySelector(".cmp-dynamic-cta") || wrapper;
      const nodes = [];
      const button = cta.querySelector("a.cmp-dynamic-cta__button");
      const text = cleanText(button ? button.textContent : cta.getAttribute("data-unauth-button-text"));
      const href = button && button.getAttribute("href") || cta.getAttribute("data-unauth-button-link") || "";
      if (text && href) nodes.push(ctaParagraph(doc, href, text));
      let desc = cta.querySelector(".cmp-dynamic-cta__description");
      if (!desc && cta.getAttribute("data-unauth-description")) {
        desc = doc.createElement("div");
        desc.innerHTML = cta.getAttribute("data-unauth-description").replace(/&nbsp;/g, " ");
      }
      if (desc && cleanText(desc.textContent)) {
        desc.querySelectorAll("b").forEach((b) => renameTag(b, "strong"));
        desc.querySelectorAll("u").forEach((u) => u.replaceWith(...u.childNodes));
        desc.querySelectorAll("br").forEach((br) => br.remove());
        const p = doc.createElement("p");
        p.append(...desc.childNodes);
        nodes.push(p);
      }
      if (nodes.length) wrapper.replaceWith(...nodes);
      else wrapper.remove();
    });
    const buttons = [
      ...root.querySelectorAll(".alc-button"),
      ...[...root.querySelectorAll("a.cmp-button")].filter((a) => !a.closest(".alc-button"))
    ];
    buttons.forEach((el) => {
      if (!el.isConnected || !outsideHero(el)) return;
      const links = el.matches("a") ? [el] : [...el.querySelectorAll("a[href], button")];
      const nodes = links.map((link) => {
        const text = cleanText(link.textContent);
        const href = link.matches("button") ? buttonHref(link) : (link.getAttribute("href") || "").trim();
        return text && href && href !== "#" ? ctaParagraph(doc, href, text) : null;
      }).filter(Boolean);
      const holder = el.matches("a") && el.parentElement && el.parentElement.matches("div.button") && el.parentElement.children.length === 1 ? el.parentElement : el;
      if (nodes.length) holder.replaceWith(...nodes);
      else holder.remove();
    });
  }
  var EMPTY_SPACER_SELECTOR = [
    ".text",
    ".title",
    ".image",
    ".teaser",
    ".alc-container",
    ".cfm",
    ".responsivegrid",
    ".contributions",
    ".social-responsibility",
    "div.events",
    "div.promo",
    ".promo-holder",
    ".faq-promo",
    "div.sidebar",
    "aside",
    "div.banner.section",
    ".digital-instants-intro"
  ].join(", ");
  var KEEP_HIDDEN_SELECTOR = ".cmp-tabs, .cmp-accordion, .panel-group, .alc-carousel, .carousel, .slick-slider, .cmp-container--game-tiles, section.alc-hyt, .di-featured-section, .browse-game-list, section.ko-scratch-list, .games-wrapper, .buy-tickets__wrapper";
  function isEmptyHeading(h) {
    return !normText(h) && !h.querySelector("img, picture");
  }
  function cleanupContentPage(element, doc) {
    const pageTitle = doc.title;
    element.querySelectorAll("title").forEach((t) => t.remove());
    if (pageTitle && doc.title !== pageTitle) doc.title = pageTitle;
    fixModalVideoLinks(element);
    WebImporter.DOMUtils.remove(element, [
      ...DETAIL_PAGE_CHROME_SELECTORS,
      ...CONTENT_PAGE_CHROME_SELECTORS,
      MODAL_SELECTOR,
      "script",
      "noscript",
      "style"
    ]);
    element.querySelectorAll('[style*="display: none"], [style*="display:none"]').forEach((el) => {
      if (el.isConnected && !el.closest(KEEP_HIDDEN_SELECTOR)) el.remove();
    });
    WebImporter.DOMUtils.remove(element, [".material-icons", ".material-icons-outlined", ".material-symbols-outlined"]);
    element.querySelectorAll(".social").forEach((el) => {
      if (/^share\b/i.test(normText(el))) el.remove();
    });
    WebImporter.DOMUtils.remove(element, [".separator", ".cmp-separator", "hr"]);
    removeHiddenDuplicates(element);
    [...element.querySelectorAll(EMPTY_SPACER_SELECTOR)].reverse().forEach((el) => {
      if (el.isConnected && isEmptyContainer(el)) el.remove();
    });
    element.querySelectorAll("p").forEach((p) => {
      if (isEmptyContainer(p)) p.remove();
    });
    element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (isEmptyHeading(h)) h.remove();
    });
    element.querySelectorAll("h1.cmp-teaser__title").forEach((h) => {
      if (!h.closest(CONTENT_HERO_SELECTOR)) renameTagKeepAttrs(h, "h3");
    });
    convertCtas(element);
    fixSlugTitle(doc, element);
  }
  var DECORATIVE_BG_RE = /(^|[/_-])(bg|background|pattern|texture)[^/]*\.(jpe?g|png|gif|svg|webp)|[a-z]bg\.(jpe?g|png)|alc-images\/|\/casinoWrapper\/|\/TM-[A-Za-z]+_(en|fr)\.png/i;
  function cssUnescapeUrl(value) {
    return value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (m, hex) => String.fromCodePoint(parseInt(hex, 16)));
  }
  function cleanupContentDefaultContent(root) {
    const outside = (el) => !el.closest("table");
    root.querySelectorAll("label").forEach((label) => {
      if (outside(label) && (label.hasAttribute("for") || label.querySelector("input, select, textarea"))) label.remove();
    });
    root.querySelectorAll("select, input, textarea, button").forEach((el) => {
      if (el.isConnected && outside(el)) el.remove();
    });
    root.querySelectorAll("form").forEach((form) => {
      if (outside(form)) form.replaceWith(...form.childNodes);
    });
    const isHashLink = (a) => (a.getAttribute("href") || "").trim() === "#";
    root.querySelectorAll("ul, ol").forEach((list) => {
      if (!outside(list)) return;
      const items = [...list.children];
      if (items.length && items.every((li) => {
        const links = [...li.querySelectorAll("a")];
        return links.length && links.every(isHashLink) && normText(li) === links.map((a) => normText(a)).join(" ").trim();
      })) list.remove();
    });
    root.querySelectorAll("a").forEach((a) => {
      if (!outside(a)) return;
      if (!normText(a) && !a.querySelector("img, picture")) a.remove();
      else if (isHashLink(a)) a.replaceWith(...a.childNodes);
    });
    root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      if (outside(h) && isEmptyHeading(h)) h.remove();
    });
  }
  function stripDecorativeBackgrounds(root) {
    root.querySelectorAll('[style*="url"]').forEach((el) => {
      if (el.closest("table")) return;
      const style = el.getAttribute("style") || "";
      const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      if (!m || !DECORATIVE_BG_RE.test(cssUnescapeUrl(m[2]))) return;
      const next = style.replace(/background(?:-image)?\s*:[^;]*url\([^)]*\)[^;]*;?/gi, "").trim();
      if (next) el.setAttribute("style", next);
      else el.removeAttribute("style");
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
      } else if (isContentPage(element, payload)) {
        CONTENT_PAGES.add(element);
        cleanupContentPage(element, doc);
        registerPageMetadata(element, { Breadcrumbs: "true" });
      } else {
        fixSlugTitle(doc, null);
      }
      const contentPage = CONTENT_PAGES.has(element);
      if (contentPage) {
        element.querySelectorAll("div.experiencefragment").forEach((xf) => {
          const named = [...xf.querySelectorAll(".cmp-experiencefragment")].some((c) => !c.matches(".cmp-experiencefragment--header, .cmp-experiencefragment--footer"));
          const chrome = xf.querySelector('header, footer, [role="banner"], .topnav, #nav-mobile, .cmp-experiencefragment--header, .cmp-experiencefragment--footer, .modal');
          if (named && !chrome && !xf.closest(".common-modals, .modal-xf")) xf.classList.replace("experiencefragment", "alc-xf-content");
        });
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
        // Tracking iframes (doubleclick, adsrvr "TTD Universal Pixel"). Content pages keep their
        // video / embed iframes for the embed, accordion-bar and tabs-boxed parsers (see below).
        ...contentPage ? [] : ["iframe"]
      ]);
      if (contentPage) {
        element.querySelectorAll("iframe").forEach((frame) => {
          const src = frame.getAttribute("src") || frame.getAttribute("data-src") || "";
          const isEmbed = frame.closest(".cmp-embed, .embed") || videoWatchUrl(src);
          if (!isEmbed || TRACKING_SRC_RE.test(src)) frame.remove();
        });
      }
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
      if (CONTENT_PAGES.has(element)) {
        stripDecorativeBackgrounds(element);
        cleanupContentDefaultContent(element);
      }
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

  // tools/importer/import-ticket-detail.js
  var parsers = {
    "columns-ticket": parse,
    "accordion-bar": parse2
  };
  var PAGE_TEMPLATE = {
    "name": "ticket-detail",
    "description": "Scratch N Win / Breakopen ticket detail: breadcrumb, single ticket card (title, price, ticket image, top prize, prizes available, odds) and how-to-play accordion",
    "urls": [
      "(see tools/importer/urls-ticket-detail.txt)"
    ],
    "blocks": [
      {
        "name": "columns-ticket",
        "instances": [
          "div.game-details-info > div.details"
        ]
      },
      {
        "name": "accordion-bar",
        "instances": [
          "div.panel-group#accordion"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "ticket-body",
        "selector": [
          "div.game-detail-scratch > section.body-content"
        ],
        "style": "ticket-detail",
        "blocks": [
          "columns-ticket",
          "accordion-bar"
        ],
        "defaultContent": [
          "div.game-details-info > div.heading"
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
  var import_ticket_detail_default = {
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
  return __toCommonJS(import_ticket_detail_exports);
})();
