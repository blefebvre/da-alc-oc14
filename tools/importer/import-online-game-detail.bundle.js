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

  // tools/importer/import-online-game-detail.js
  var import_online_game_detail_exports = {};
  __export(import_online_game_detail_exports, {
    default: () => import_online_game_detail_default
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
  function parse(element, { document: document2 }) {
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

  // tools/importer/parsers/tabs-boxed.js
  var BULLET_RE = /^\s*[·•▪◦‣∙●]\s*/;
  function clean2(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function isEmptyNode(node) {
    if (node.nodeType === 3) return !clean2(node.textContent);
    if (node.nodeType !== 1) return true;
    if (node.tagName === "BR") return true;
    if (node.querySelector && node.querySelector("img, picture, video, iframe")) return false;
    if (node.tagName === "IMG") return false;
    return !clean2(node.textContent);
  }
  function splitLines(el) {
    const lines = [[]];
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "BR") lines.push([]);
      else lines[lines.length - 1].push(node);
    });
    return lines.filter((nodes) => nodes.some((n) => !isEmptyNode(n)));
  }
  function stripBullet(nodes) {
    const first = nodes.find((n) => !isEmptyNode(n));
    if (!first) return;
    if (first.nodeType === 3) {
      first.textContent = first.textContent.replace(BULLET_RE, "");
    } else {
      const walker = first.ownerDocument.createTreeWalker(first, 4);
      const t = walker.nextNode();
      if (t) t.textContent = t.textContent.replace(BULLET_RE, "");
    }
  }
  function lineStartsWithBullet(nodes) {
    const text = nodes.map((n) => n.textContent).join("");
    return BULLET_RE.test(text.replace(/^[\s ]+/, ""));
  }
  function convertBulletParagraph(document2, p) {
    const lines = splitLines(p);
    if (!lines.some(lineStartsWithBullet)) return [p];
    const out = [];
    let ul = null;
    lines.forEach((nodes) => {
      if (nodes[0] && nodes[0].nodeType === 3) nodes[0].textContent = nodes[0].textContent.replace(/^\s+/, "");
      if (lineStartsWithBullet(nodes)) {
        stripBullet(nodes);
        if (!ul) {
          ul = document2.createElement("ul");
          out.push(ul);
        }
        const li = document2.createElement("li");
        li.append(...nodes);
        ul.append(li);
      } else {
        ul = null;
        const np = document2.createElement("p");
        np.append(...nodes);
        out.push(np);
      }
    });
    return out;
  }
  function buildPanel(document2, panel) {
    if (!panel) return [];
    panel.querySelectorAll("a").forEach((a) => {
      if (!clean2(a.textContent) && !a.querySelector("img")) a.remove();
    });
    const content = [];
    [...panel.children].forEach((child) => {
      if (isEmptyNode(child)) return;
      if (child.tagName === "P") {
        while (child.lastChild && isEmptyNode(child.lastChild)) child.lastChild.remove();
        content.push(...convertBulletParagraph(document2, child));
      } else {
        content.push(child);
      }
    });
    if (!content.length && clean2(panel.textContent)) {
      const p = document2.createElement("p");
      p.append(...panel.childNodes);
      content.push(p);
    }
    return content;
  }
  function parse3(element, { document: document2 }) {
    const cells = [];
    let tabs = [...element.querySelectorAll(":scope > .cmp-tabs__tablist > .cmp-tabs__tab")];
    if (!tabs.length) tabs = [...element.querySelectorAll(".cmp-tabs__tab")];
    let panels = [...element.querySelectorAll(":scope > .cmp-tabs__tabpanel")];
    if (!panels.length) panels = [...element.querySelectorAll(".cmp-tabs__tabpanel")];
    tabs.forEach((tab, i) => {
      const label = clean2(tab.textContent);
      if (!label) return;
      const content = buildPanel(document2, panels[i]);
      cells.push([label, content.length ? content : ""]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-boxed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-game.js
  var ORIGIN3 = "https://www.alc.ca";
  function absolutize3(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN3}${v}`;
    return v;
  }
  function bgUrl(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
    return m && m[1] ? m[1] : "";
  }
  function clean3(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function linkParagraph2(document2, href, text, strong) {
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
  function parseHaveYouTried(element, document2) {
    const cells = [];
    element.querySelectorAll(".alc-hyt__container").forEach((card) => {
      const title = clean3(card.querySelector(".hyt-game-title") && card.querySelector(".hyt-game-title").textContent);
      const imageCell = [];
      const imgHolder = card.querySelector(".hyt-game-image");
      const imgEl = imgHolder && imgHolder.querySelector("img[src]");
      const src = imgEl ? imgEl.getAttribute("src") : bgUrl(imgHolder);
      if (src) {
        const img = document2.createElement("img");
        img.src = absolutize3(src);
        img.alt = imgEl && imgEl.getAttribute("alt") || title;
        imageCell.push(img);
      }
      const body = [];
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const prize = clean3(card.querySelector(".hyt-game-prize") && card.querySelector(".hyt-game-prize").textContent);
      if (prize) {
        const p = document2.createElement("p");
        p.textContent = prize;
        body.push(p);
      }
      const desc = clean3(card.querySelector(".hyt-game-description") && card.querySelector(".hyt-game-description").textContent);
      if (desc) {
        const p = document2.createElement("p");
        p.textContent = desc;
        body.push(p);
      }
      const learn = card.querySelector(".hyt-learn-more a[href]");
      if (learn) body.push(linkParagraph2(document2, learn.getAttribute("href"), clean3(learn.textContent) || "Learn More", false));
      const play = card.querySelector('.hyt-game-cta a[href], a[class*="hyt-play-url"][href]');
      if (play) body.push(linkParagraph2(document2, play.getAttribute("href"), clean3(play.textContent) || "Play now", true));
      const demo = card.querySelector('.hyt-try-demo a[href], a[class*="hyt-demo-url"][href]');
      if (demo) body.push(linkParagraph2(document2, demo.getAttribute("href"), clean3(demo.textContent) || "Try Demo", false));
      if (!imageCell.length && !body.length) return;
      cells.push([imageCell.length ? imageCell : "", body.length ? body : ""]);
    });
    return cells;
  }
  function parse4(element, { document: document2 }) {
    if (element.matches(".alc-hyt") || !element.querySelector(".game-tile") && element.querySelector(".alc-hyt__container")) {
      const hytCells = parseHaveYouTried(element, document2);
      if (!hytCells.length) {
        element.remove();
        return;
      }
      const hytBlock = WebImporter.Blocks.createBlock(document2, { name: "cards-game", cells: hytCells });
      element.replaceWith(hytBlock);
      return;
    }
    let tiles = [...element.querySelectorAll("article.game-tile")];
    if (!tiles.length) tiles = [...element.querySelectorAll(".game-tile")].filter((t) => !t.querySelector(".game-tile"));
    const cells = [];
    tiles.forEach((tile) => {
      const imageContainer = tile.querySelector(".game-tile-image-container");
      const content = tile.querySelector(".game-tile-content") || tile;
      const imageCell = [];
      const imgEl = imageContainer && imageContainer.querySelector("img[src]");
      const src = imgEl ? imgEl.getAttribute("src") : bgUrl(imageContainer);
      const titleEl = content.querySelector("h3.game-tile-title, .game-tile-title, h3, h2");
      const title = clean3(titleEl && titleEl.textContent);
      if (src) {
        const img = document2.createElement("img");
        img.src = absolutize3(src);
        img.alt = imgEl && imgEl.getAttribute("alt") || title;
        imageCell.push(img);
      }
      const prizeBar = imageContainer && imageContainer.querySelector(".prize-bar");
      const left = clean3(prizeBar && prizeBar.textContent);
      if (left) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        const subEl = prizeBar.querySelector("sub");
        const subText = clean3(subEl && subEl.textContent);
        if (subText) {
          const amount = clean3([...prizeBar.childNodes].filter((n) => n !== subEl).map((n) => n.textContent).join(" "));
          if (amount) strong.append(document2.createTextNode(`${amount} `));
          const sub = document2.createElement("sub");
          sub.textContent = subText;
          strong.append(sub);
        } else {
          strong.textContent = left;
        }
        p.append(strong);
        const rightEl = imageContainer.querySelector(".max-plus-bar, .gold-ball-bar, .prize-bar-right");
        const joinParts = (el) => clean3([...el.childNodes].map((n) => n.textContent).join(" "));
        let right = clean3(rightEl && [...rightEl.querySelectorAll("span")].map((s) => s.textContent).join(" "));
        if (rightEl && !/^\+/.test(right)) {
          const full = joinParts(rightEl);
          if (/^\+/.test(full) || !right) right = full;
        }
        right = clean3(right.replace(/\s*×\s*/g, " \xD7 ").replace(/^\+\s*/, "+ "));
        if (rightEl && rightEl.classList.contains("max-plus-bar") && right && !/^\+/.test(right)) {
          const attrCount = (rightEl.getAttribute("data-count") || rightEl.getAttribute("data-max-plus") || tile.getAttribute("data-max-plus") || "").trim();
          const prizeText = clean3(rightEl.querySelector(".prize-text") && rightEl.querySelector(".prize-text").textContent) || right;
          const amountMatch = prizeText.match(/\$[\d,]+/);
          let count = /^\d+$/.test(attrCount) ? attrCount : "";
          if (!count && amountMatch) {
            const re = new RegExp(`(\\d+)\\s*[x\xD7]\\s*\\${amountMatch[0]}`, "i");
            const scopes = [tile.textContent, document2.body && document2.body.textContent || ""];
            scopes.some((t) => {
              const m = clean3(t).match(re);
              if (m) count = m[1];
              return !!m;
            });
          }
          if (count) right = `+ ${count} ${right}`;
        }
        if (right) {
          p.append(document2.createTextNode(" "));
          const em = document2.createElement("em");
          em.textContent = right;
          p.append(em);
        }
        imageCell.push(p);
      }
      const body = [];
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const flag = tile.querySelector(".game-flag.new, .game-flag");
      if (flag && (flag.classList.contains("new") || /new/i.test(flag.textContent))) {
        const p = document2.createElement("p");
        p.textContent = "New";
        body.push(p);
      }
      const descParas = [...content.querySelectorAll(".game-tile-description p")];
      if (descParas.length) {
        descParas.forEach((p) => {
          if (clean3(p.textContent)) body.push(p);
        });
      } else {
        const desc = content.querySelector(".game-tile-description");
        if (desc && clean3(desc.textContent)) {
          const p = document2.createElement("p");
          p.append(...desc.childNodes);
          body.push(p);
        }
      }
      [...content.querySelectorAll("p")].filter((p) => !p.closest(".game-tile-description")).forEach((p) => {
        const text = clean3(p.textContent);
        if (!text) return;
        const np = document2.createElement("p");
        np.textContent = text;
        body.push(np);
      });
      const cta = content.querySelector("a.button, a.arrow-button");
      if (cta) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = clean3(cta.textContent) || cta.getAttribute("title") || "Learn more";
        p.append(a);
        body.push(p);
      }
      if (!imageCell.length && !body.length) return;
      cells.push([imageCell.length ? imageCell : "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-game", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/alc-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ORIGIN4 = "https://www.alc.ca";
  var ALC_HOSTS = ["www.alc.ca", "alc.ca"];
  function absolutizeUrl(value) {
    if (!value) return value;
    const v = value.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN4}${v}`;
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
  function rewriteLink(href) {
    if (!href) return href;
    const raw = href.trim();
    if (raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) return href;
    let url;
    try {
      url = new URL(raw, ORIGIN4);
    } catch (e) {
      return href;
    }
    const isRelative = raw.startsWith("/") && !raw.startsWith("//");
    if (!isRelative && !ALC_HOSTS.includes(url.hostname)) return href;
    let path = url.pathname;
    const isAsset = path.startsWith("/content/dam/");
    const isGameLauncher = /\/game\.html$/.test(path) && url.searchParams.has("gameId");
    if (isAsset || isGameLauncher || !path.startsWith("/content/alc")) {
      if (path.startsWith("/etc.clientlibs")) return href;
      return `${ORIGIN4}${path}${url.search}${url.hash || ""}`;
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
  function isGameDetailPage(root) {
    return !!root.querySelector("section.alc-game-details-header, div.digital-instants-info-page");
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
      // Game pages have no div.experiencefragment wrapper: the global header is
      // <div role="banner"><div class="xfpage page basicpage">...<header>...</header> (plus the
      // #loginFlow MFA modal) and the footer is a bare <footer class="main-footer">.
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
      // Browser-upgrade modal (sibling of .common-modals on game pages)
      ".modal-browser-check",
      // Site-wide alert/notification banners (<section data-bind="if: message"><div class="alert-area">)
      'section[data-bind="if: message"]',
      ".alert-area",
      ".notification.section",
      ".cmp-notification",
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
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const doc = payload && payload.document || document;
      const ogTitle = doc.querySelector('meta[property="og:title"], meta[name="og:title"]');
      if (ogTitle && /^[a-z0-9]+(-[a-z0-9]+)*$/.test((doc.title || "").trim()) && ogTitle.content.trim()) {
        doc.title = ogTitle.content.trim();
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
    if (sections.length < 2) return;
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

  // tools/importer/import-online-game-detail.js
  var parsers = {
    "hero-game": parse,
    "carousel-thumbnails": parse2,
    "tabs-boxed": parse3,
    "cards-game": parse4
  };
  var PAGE_TEMPLATE = {
    "name": "online-game-detail",
    "description": "Online casino / instant-win game detail: game banner with CTA bar, screenshot carousel, game summary, how-to-play/prizes tabs, and Have you tried rail",
    "urls": [
      "(see tools/importer/urls-online-game-detail.txt)"
    ],
    "blocks": [
      {
        "name": "hero-game",
        "instances": [
          "section.alc-game-details-header"
        ]
      },
      {
        "name": "carousel-thumbnails",
        "instances": [
          ".alc-image-browser .alc-carousel.slideshow-main"
        ]
      },
      {
        "name": "tabs-boxed",
        "instances": [
          ".cmp-tabs.cmp-tabs--alc"
        ]
      },
      {
        "name": "cards-game",
        "instances": [
          "section.alc-hyt"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "game-banner",
        "selector": [
          "section.alc-game-details-header"
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
          "div.digital-instants-info-page.body-content",
          "div.body-content"
        ],
        "style": "game-detail",
        "blocks": [
          "carousel-thumbnails",
          "tabs-boxed",
          "cards-game"
        ],
        "defaultContent": [
          ".alc-image-browser__heading h1",
          ".digital-instants-game-summary",
          "#haveYouTriedTitle h2"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
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
  var import_online_game_detail_default = {
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
      if (/\/instant-win-games\//.test(new URL(params.originalURL).pathname)) {
        main.querySelectorAll("table tr, div.section-metadata > div").forEach((row) => {
          const [key, value] = row.children;
          if (key && value && key.textContent.trim().toLowerCase() === "style" && /game-detail/.test(value.textContent)) {
            value.textContent = `${value.textContent.trim()}, instant`;
          }
        });
      }
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
  return __toCommonJS(import_online_game_detail_exports);
})();
