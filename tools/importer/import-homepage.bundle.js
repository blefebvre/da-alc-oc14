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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-promo.js
  var ORIGIN = "https://www.alc.ca";
  function absolutize(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN}${v}`;
    return v;
  }
  function bgUrl(el) {
    const style = (el == null ? void 0 : el.getAttribute("style")) || "";
    const m = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i) || style.match(/url\((?:&quot;|['"])?(.*?)(?:&quot;|['"])?\)/i);
    if (!m) return "";
    const value = (m.length > 2 ? m[2] : m[1]) || "";
    return value.replace(/&quot;/g, "").replace(/^['"]+|['"]+$/g, "").trim();
  }
  function desktopImageUrl(slide) {
    const spans = [...slide.querySelectorAll("span[data-src]")];
    if (spans.length) {
      const ranked = spans.map((s) => {
        const mw = (s.getAttribute("data-media") || "").match(/min-width:\s*(\d+)/);
        return { src: s.getAttribute("data-src"), w: mw ? parseInt(mw[1], 10) : 0 };
      }).sort((a, b) => b.w - a.w);
      if (ranked[0].src) return ranked[0].src;
    }
    const sources = [...slide.querySelectorAll("picture source[srcset]")];
    if (sources.length) {
      const ranked = sources.map((s) => {
        const mw = (s.getAttribute("media") || "").match(/min-width:\s*(\d+)/);
        return { src: s.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0], w: mw ? parseInt(mw[1], 10) : 0 };
      }).sort((a, b) => b.w - a.w);
      if (ranked[0].src) return ranked[0].src;
    }
    const img = slide.querySelector("img[src]");
    if (img) return img.getAttribute("src");
    const bgEl = slide.querySelector('[style*="background-image"]');
    return bgUrl(bgEl);
  }
  function mobileImageUrl(slide) {
    const candidates = [
      ...[...slide.querySelectorAll("span[data-src]")].map((s) => ({
        src: s.getAttribute("data-src"),
        media: s.getAttribute("data-media") || ""
      })),
      ...[...slide.querySelectorAll("picture source[srcset]")].map((s) => ({
        src: s.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0],
        media: s.getAttribute("media") || ""
      }))
    ].filter((c) => c.src);
    if (!candidates.length) return "";
    const byName = candidates.find((c) => /\/imageM\./.test(c.src));
    if (byName) return byName.src;
    const ranked = candidates.map((c) => {
      const mw = c.media.match(/min-width:\s*(\d+)/);
      return { src: c.src, w: mw ? parseInt(mw[1], 10) : 0 };
    }).sort((a, b) => a.w - b.w);
    return ranked[0].src;
  }
  function labelFromHref(href) {
    try {
      const url = new URL(href, ORIGIN);
      const seg = url.pathname.split("/").filter(Boolean).pop() || "";
      const name = seg.replace(/\.html$/, "").replace(/^lottomax$/i, "lotto max").replace(/[-_]+/g, " ").trim();
      if (!name) return "";
      return name.replace(/\b\w/g, (c) => c.toUpperCase());
    } catch (e) {
      return "";
    }
  }
  function parse(element, { document: document2 }) {
    let slides = [...element.querySelectorAll("article.fca-carousel-slide-promo")];
    if (!slides.length) slides = [...element.querySelectorAll("li.slide, .slide")];
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    slides.forEach((slide) => {
      if (slide.closest('.slick-cloned, .cloned, [aria-hidden="true"].clone')) return;
      const link = slide.querySelector("a[href]");
      const href = link ? link.getAttribute("href") : "";
      const src = desktopImageUrl(slide);
      const key = slide.id || `${href}|${src}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!src && !href) return;
      const existingImg = slide.querySelector("img[alt]");
      const label = existingImg && existingImg.getAttribute("alt").trim() || labelFromHref(href) || "Learn more";
      const imgCell = [];
      if (src) {
        const img = document2.createElement("img");
        img.src = absolutize(src);
        img.alt = label;
        imgCell.push(img);
        let mobileSrc2 = absolutize(mobileImageUrl(slide));
        if (!/\/imageM\.img\./.test(mobileSrc2)) {
          const derived = img.src.replace(/\/image[DT]\.img\./, "/imageM.img.");
          if (derived !== img.src) mobileSrc2 = derived;
        }
        if (mobileSrc2 && mobileSrc2 !== img.src) {
          const mImg = document2.createElement("img");
          mImg.src = mobileSrc2;
          mImg.alt = label;
          imgCell.push(mImg);
        }
      }
      const linkCell = [];
      if (href) {
        const a = document2.createElement("a");
        a.href = href;
        a.textContent = label;
        linkCell.push(a);
      }
      cells.push([imgCell.length ? imgCell : "", linkCell.length ? linkCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-winners.js
  var ORIGIN2 = "https://www.alc.ca";
  function absolutize2(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN2}${encodeURI(decodeURI(v))}`;
    return v;
  }
  function bgUrl2(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
    if (m && m[1]) return m[1];
    return el.getAttribute("data-src") || el.getAttribute("data-bg") || el.getAttribute("data-background") || "";
  }
  function formatPrize(prizeEl) {
    if (!prizeEl) return "";
    const groups = [...prizeEl.querySelectorAll("span")].map((s) => s.textContent.replace(/[^\d.]/g, "")).filter(Boolean);
    if (groups.length) return `$${groups.join(",")}`;
    const raw = prizeEl.textContent.replace(/\s+/g, " ").trim();
    if (!raw) return "";
    const digits = raw.replace(/[^\d]/g, "");
    return digits ? `$${Number(digits).toLocaleString("en-US")}` : raw;
  }
  function parse2(element, { document: document2 }) {
    let slides = [...element.querySelectorAll("div.slide")];
    if (!slides.length) slides = [...element.querySelectorAll(".slick-slide")];
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    slides.forEach((slide) => {
      if (slide.closest(".slick-cloned")) return;
      const nameEl = slide.querySelector(".winner-info h3, .winner-info h2, .winner-info h4, h3");
      const name = nameEl ? nameEl.textContent.replace(/\s+/g, " ").trim() : "";
      const photoSrc = bgUrl2(slide.querySelector(".winner-image"));
      const key = name || photoSrc;
      if (!key || seen.has(key)) return;
      seen.add(key);
      const photoCell = [];
      if (photoSrc) {
        const img = document2.createElement("img");
        img.src = absolutize2(photoSrc);
        img.alt = name;
        photoCell.push(img);
      }
      const content = [];
      if (name) {
        const h3 = document2.createElement("h3");
        h3.textContent = name;
        content.push(h3);
      }
      const locEl = slide.querySelector(".winner-info span.h2, .winner-info .location, .winner-info span");
      const location = locEl ? locEl.textContent.replace(/\s+/g, " ").trim() : "";
      if (location) {
        const p = document2.createElement("p");
        p.textContent = location;
        content.push(p);
      }
      const cta = slide.querySelector("a.all-winners, .winner-info a[href]");
      if (cta) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = cta.getAttribute("href").replace(/(\.html)+(?=$|[?#])/, ".html");
        a.textContent = cta.textContent.replace(/\s+/g, " ").trim() || "See all winners";
        p.append(a);
        content.push(p);
      }
      const logo = slide.querySelector("img.winning-game-logo, .game-title img");
      if (logo && logo.getAttribute("src")) {
        const p = document2.createElement("p");
        const img = document2.createElement("img");
        img.src = absolutize2(logo.getAttribute("src"));
        img.alt = logo.getAttribute("alt") || "game logo";
        p.append(img);
        content.push(p);
      }
      const ribbon = slide.querySelector(".winning-game-ribbon");
      const ribbonText = ribbon ? ribbon.textContent.replace(/\s+/g, " ").trim() : "";
      if (ribbonText) {
        const p = document2.createElement("p");
        p.textContent = ribbonText;
        content.push(p);
      }
      const prize = formatPrize(slide.querySelector(".prize-amount"));
      if (prize) {
        const p = document2.createElement("p");
        p.textContent = prize;
        content.push(p);
      }
      cells.push([photoCell.length ? photoCell : "", content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-winners", cells });
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
  function bgUrl3(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
    return m && m[1] ? m[1] : "";
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
  function parseHaveYouTried(element, document2) {
    const cells = [];
    element.querySelectorAll(".alc-hyt__container").forEach((card) => {
      const title = clean(card.querySelector(".hyt-game-title") && card.querySelector(".hyt-game-title").textContent);
      const imageCell = [];
      const imgHolder = card.querySelector(".hyt-game-image");
      const imgEl = imgHolder && imgHolder.querySelector("img[src]");
      const src = imgEl ? imgEl.getAttribute("src") : bgUrl3(imgHolder);
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
      const prize = clean(card.querySelector(".hyt-game-prize") && card.querySelector(".hyt-game-prize").textContent);
      if (prize) {
        const p = document2.createElement("p");
        p.textContent = prize;
        body.push(p);
      }
      const desc = clean(card.querySelector(".hyt-game-description") && card.querySelector(".hyt-game-description").textContent);
      if (desc) {
        const p = document2.createElement("p");
        p.textContent = desc;
        body.push(p);
      }
      const learn = card.querySelector(".hyt-learn-more a[href]");
      if (learn) body.push(linkParagraph(document2, learn.getAttribute("href"), clean(learn.textContent) || "Learn More", false));
      const play = card.querySelector('.hyt-game-cta a[href], a[class*="hyt-play-url"][href]');
      if (play) body.push(linkParagraph(document2, play.getAttribute("href"), clean(play.textContent) || "Play now", true));
      const demo = card.querySelector('.hyt-try-demo a[href], a[class*="hyt-demo-url"][href]');
      if (demo) body.push(linkParagraph(document2, demo.getAttribute("href"), clean(demo.textContent) || "Try Demo", false));
      if (!imageCell.length && !body.length) return;
      cells.push([imageCell.length ? imageCell : "", body.length ? body : ""]);
    });
    return cells;
  }
  var LOBBY_TILE = "article.game-tile-nondraw, .alc-game-tile__container, article.lotto-category, .buy-tickets__wrapper__container, div.game-tile:has(> .casino-game)";
  function textParagraph(document2, text) {
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function imageCellFrom(document2, holder, alt) {
    if (!holder) return "";
    const imgEl = holder.matches("img") ? holder : holder.querySelector("img[src]:not(.cmp-favourite-button__icon)");
    const src = imgEl ? imgEl.getAttribute("src") : bgUrl3(holder);
    if (!src) return "";
    const img = document2.createElement("img");
    img.src = absolutize3(src);
    img.alt = imgEl && imgEl.getAttribute("alt") || alt || "";
    return img;
  }
  function lobbyTileCells(document2, tile) {
    const body = [];
    let image = "";
    let title = "";
    const addLink = (a, fallback, strong) => {
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const text = clean(a.textContent) || a.getAttribute("title") || fallback;
      if (body.some((n) => n.querySelector && n.querySelector(`a[href="${href}"]`))) return;
      body.push(linkParagraph(document2, absolutize3(href), text, strong));
    };
    if (tile.matches("article.lotto-category")) {
      const logo = tile.querySelector('[class^="game-logo"], [class*=" game-logo"]');
      title = clean(logo && logo.getAttribute("aria-label") || tile.getAttribute("data-game"));
      image = imageCellFrom(document2, tile.querySelector(".lotto-image"), title);
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const draws = clean(tile.querySelector(".description-container .row-left") && tile.querySelector(".description-container .row-left").textContent);
      if (draws) body.push(textParagraph(document2, draws));
      tile.querySelectorAll(".lotto-game-description p").forEach((p) => {
        if (clean(p.textContent)) body.push(textParagraph(document2, clean(p.textContent)));
      });
      const next = clean(tile.querySelector(".next-draw") && tile.querySelector(".next-draw").textContent);
      if (next) body.push(textParagraph(document2, next.replace(/\s*:\s*/, ": ")));
      const amountEl = tile.querySelector(".amounts-container .prize-amount");
      if (amountEl && clean(amountEl.textContent)) {
        const rawDigits = [...amountEl.querySelectorAll("span")].map((s) => clean(s.textContent)).join(",") || clean(amountEl.textContent);
        const digits = /^\$?\d{4,}$/.test(rawDigits) ? rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : rawDigits;
        const est = clean(tile.querySelector(".amounts-container .est") && tile.querySelector(".amounts-container .est").textContent);
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = `$${digits.replace(/^\$/, "")}${est ? ` ${est}` : ""}`;
        const infos = [...tile.querySelectorAll(".amounts-container .info-text")].filter((s) => !s.closest(EXTRA_SKIP) && clean(s.textContent));
        const isBefore = (s) => !!(s.compareDocumentPosition(amountEl) & 4);
        const before = infos.filter(isBefore).map((s) => clean(s.textContent));
        const after = infos.filter((s) => !isBefore(s)).map((s) => clean(s.textContent));
        if (before.length) p.append(document2.createTextNode(`${before.join(" ")} `));
        p.append(strong);
        if (after.length) p.append(document2.createTextNode(` ${after.join(" ")}`));
        const extra = clean(tile.querySelector(".amounts-container .additional-prizes") && tile.querySelector(".amounts-container .additional-prizes").textContent);
        if (extra) {
          const em = document2.createElement("em");
          em.textContent = extra.replace(/\s*×\s*/g, " \xD7 ").replace(/^\+\s*/, "+ ");
          p.append(document2.createTextNode(" "), em);
        }
        body.push(p);
      }
      addLink(tile.querySelector(".lotto-footer .cta a"), "Get your ticket", true);
      addLink(tile.querySelector(".lotto-game-description a.read-more"), "Game Details", false);
      addLink(tile.querySelector(".lotto-footer .see-numbers a"), "See winning numbers & payouts", false);
    } else if (tile.matches(".buy-tickets__wrapper__container")) {
      const a = tile.querySelector("a[href]");
      title = clean(a && a.getAttribute("title"));
      image = imageCellFrom(document2, tile.querySelector("img") || tile.querySelector(".buy-tickets__wrapper__container__bg"), title);
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      if (a) body.push(linkParagraph(document2, absolutize3(a.getAttribute("href")), clean(tile.querySelector(".buy-tickets__wrapper__container__purchase") && tile.querySelector(".buy-tickets__wrapper__container__purchase").textContent) || "Buy Now", true));
    } else if (tile.matches("div.game-tile")) {
      title = clean(tile.querySelector(".casino-game-title") && tile.querySelector(".casino-game-title").textContent);
      image = imageCellFrom(document2, tile.querySelector(".casino-game"), title);
      const info = tile.querySelector("a.casino-info-button[href]");
      if (title) {
        const h3 = document2.createElement("h3");
        if (info) {
          const a = document2.createElement("a");
          a.href = absolutize3(info.getAttribute("href"));
          a.textContent = title;
          h3.append(a);
        } else {
          h3.textContent = title;
        }
        body.push(h3);
      }
    } else {
      const titleEl = tile.querySelector(".game-title, .scratch-name");
      title = clean(titleEl && titleEl.textContent);
      image = imageCellFrom(document2, tile.querySelector(".game-tile-header, .game-image"), title);
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const prizeEl = tile.querySelector(".game-prize:not(.hidden), .top-prize-gametile");
      const prize = clean(prizeEl && [...prizeEl.childNodes].map((n) => n.textContent).join(" ").replace(/\s*-\s*/g, " - "));
      const range = prize.replace(/(\$[\d.,]+)\s+(\$[\d.,]+)/, "$1 - $2").replace(/\s*-\s*\$NaN\b/g, "").replace(/^(\$[\d.,]+) - \1$/, "$1");
      if (range) body.push(textParagraph(document2, range));
      const descEl = tile.querySelector(".description, .game-description");
      if (descEl) {
        const descClone = descEl.cloneNode(true);
        descClone.querySelectorAll("a").forEach((a) => a.remove());
        const desc = clean(descClone.textContent);
        if (desc) body.push(textParagraph(document2, desc));
      }
      addLink(tile.querySelector(".description a[href], .learn-more a[href], .game-tile-content > a.try-now-link[href]"), "Learn More", false);
      addLink(tile.querySelector(".play-now-link a[href], .game-cta a[href]"), "Play now", true);
      addLink(tile.querySelector(".try-now-group a.try-now-link[href], .try-demo a[href]"), "Try Demo", false);
    }
    if (!image && !body.length) return null;
    return { key: title || image && image.src, row: [image || "", body.length ? body : ""] };
  }
  var EXTRA_SKIP = 'form, select, input, button, label, link, script, style, noscript, .browse-search, .filter, .filters, .material-icons, .hidden, [hidden], [aria-hidden="true"], [style*="display: none"], [style*="display:none"]';
  var INLINE_TAGS = /^(A|B|STRONG|EM|I|U|SPAN|SMALL|SUP|SUB|BR)$/;
  function inlineClone(document2, node) {
    if (node.nodeType === 3) return document2.createTextNode(node.textContent.replace(/ /g, " "));
    if (node.nodeType !== 1 || node.matches(EXTRA_SKIP)) return null;
    if (node.tagName === "BR") return document2.createElement("br");
    let out;
    if (node.tagName === "A") {
      const href = node.getAttribute("href");
      if (!href || href === "#" || !clean(node.textContent)) return document2.createTextNode(clean(node.textContent));
      out = document2.createElement("a");
      out.href = absolutize3(href);
    } else if (/^(B|STRONG)$/.test(node.tagName)) {
      out = document2.createElement("strong");
    } else if (/^(EM|I)$/.test(node.tagName)) {
      out = document2.createElement("em");
    } else {
      out = document2.createDocumentFragment();
    }
    [...node.childNodes].forEach((c) => {
      const n = inlineClone(document2, c);
      if (n) out.append(n);
    });
    return out;
  }
  function extraContent(document2, root, out = []) {
    let line = [];
    const flush = () => {
      const p = document2.createElement("p");
      line.forEach((n) => {
        const c = inlineClone(document2, n);
        if (c) p.append(c);
      });
      line = [];
      if (clean(p.textContent)) {
        p.normalize();
        if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, "");
        if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, "");
        out.push(p);
      }
    };
    [...root.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (clean(child.textContent)) line.push(child);
        return;
      }
      if (child.nodeType !== 1 || child.matches(EXTRA_SKIP) || child.matches(LOBBY_TILE)) return;
      if (INLINE_TAGS.test(child.tagName) && !child.querySelector(LOBBY_TILE)) {
        line.push(child);
        return;
      }
      flush();
      if (/^H[1-6]$/.test(child.tagName)) {
        if (clean(child.textContent)) {
          const h = document2.createElement(child.tagName.toLowerCase());
          h.textContent = clean(child.textContent);
          out.push(h);
        }
        return;
      }
      if (!clean(child.textContent)) return;
      extraContent(document2, child, out);
    });
    flush();
    return out;
  }
  function parseLobby(element, document2) {
    const tiles = [...element.querySelectorAll(LOBBY_TILE)].filter((t) => !t.parentElement.closest(LOBBY_TILE));
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    tiles.forEach((tile) => {
      const r = lobbyTileCells(document2, tile);
      if (!r) return;
      if (r.key && seen.has(r.key)) return;
      seen.add(r.key);
      cells.push(r.row);
    });
    return cells;
  }
  function parse3(element, { document: document2 }) {
    if (!element.querySelector("article.game-tile") && element.querySelector(LOBBY_TILE)) {
      const lobbyCells = parseLobby(element, document2);
      if (!lobbyCells.length) {
        element.remove();
        return;
      }
      const extras = extraContent(document2, element);
      const lobbyBlock = WebImporter.Blocks.createBlock(document2, { name: "cards-game", cells: lobbyCells });
      element.replaceWith(...extras, lobbyBlock);
      return;
    }
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
      const src = imgEl ? imgEl.getAttribute("src") : bgUrl3(imageContainer);
      const titleEl = content.querySelector("h3.game-tile-title, .game-tile-title, h3, h2");
      const title = clean(titleEl && titleEl.textContent);
      if (src) {
        const img = document2.createElement("img");
        img.src = absolutize3(src);
        img.alt = imgEl && imgEl.getAttribute("alt") || title;
        imageCell.push(img);
      }
      const prizeBar = imageContainer && imageContainer.querySelector(".prize-bar");
      const left = clean(prizeBar && prizeBar.textContent);
      if (left) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        const subEl = prizeBar.querySelector("sub");
        const subText = clean(subEl && subEl.textContent);
        if (subText) {
          const amount = clean([...prizeBar.childNodes].filter((n) => n !== subEl).map((n) => n.textContent).join(" "));
          if (amount) strong.append(document2.createTextNode(`${amount} `));
          const sub = document2.createElement("sub");
          sub.textContent = subText;
          strong.append(sub);
        } else {
          strong.textContent = left;
        }
        p.append(strong);
        const rightEl = imageContainer.querySelector(".max-plus-bar, .gold-ball-bar, .prize-bar-right");
        const joinParts = (el) => clean([...el.childNodes].map((n) => n.textContent).join(" "));
        let right = clean(rightEl && [...rightEl.querySelectorAll("span")].map((s) => s.textContent).join(" "));
        if (rightEl && !/^\+/.test(right)) {
          const full = joinParts(rightEl);
          if (/^\+/.test(full) || !right) right = full;
        }
        right = clean(right.replace(/\s*×\s*/g, " \xD7 ").replace(/^\+\s*/, "+ "));
        if (rightEl && rightEl.classList.contains("max-plus-bar") && right && !/^\+/.test(right)) {
          const attrCount = (rightEl.getAttribute("data-count") || rightEl.getAttribute("data-max-plus") || tile.getAttribute("data-max-plus") || "").trim();
          const prizeText = clean(rightEl.querySelector(".prize-text") && rightEl.querySelector(".prize-text").textContent) || right;
          const amountMatch = prizeText.match(/\$[\d,]+/);
          let count = /^\d+$/.test(attrCount) ? attrCount : "";
          if (!count && amountMatch) {
            const re = new RegExp(`(\\d+)\\s*[x\xD7]\\s*\\${amountMatch[0]}`, "i");
            const scopes = [tile.textContent, document2.body && document2.body.textContent || ""];
            scopes.some((t) => {
              const m = clean(t).match(re);
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
          if (clean(p.textContent)) body.push(p);
        });
      } else {
        const desc = content.querySelector(".game-tile-description");
        if (desc && clean(desc.textContent)) {
          const p = document2.createElement("p");
          p.append(...desc.childNodes);
          body.push(p);
        }
      }
      [...content.querySelectorAll("p")].filter((p) => !p.closest(".game-tile-description")).forEach((p) => {
        const text = clean(p.textContent);
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
        a.textContent = clean(cta.textContent) || cta.getAttribute("title") || "Learn more";
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

  // tools/importer/parsers/cards-promo.js
  var ORIGIN4 = "https://www.alc.ca";
  var GENERIC_ALT = /^(promo(tion)?\s*image|image|banner|promo)?$/i;
  function absolutize4(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN4}${v}`;
    return v;
  }
  function desktopSrc(picture, img) {
    const sources = [...picture ? picture.querySelectorAll("source[srcset]") : []].map((s) => {
      const mw = (s.getAttribute("media") || "").match(/min-width:\s*(\d+)/);
      return { src: s.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0], w: mw ? parseInt(mw[1], 10) : 0 };
    }).sort((a, b) => b.w - a.w);
    if (sources.length && sources[0].src) return sources[0].src;
    return img ? img.getAttribute("src") : "";
  }
  function mobileSrc(picture) {
    const sources = [...picture ? picture.querySelectorAll("source[srcset]") : []].map((s) => {
      const mw = (s.getAttribute("media") || "").match(/min-width:\s*(\d+)/);
      return { src: s.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0], w: mw ? parseInt(mw[1], 10) : 0 };
    }).filter((s) => s.src);
    if (!sources.length) return "";
    const byName = sources.find((s) => /\/imageM\./.test(s.src));
    if (byName) return byName.src;
    return sources.sort((a, b) => a.w - b.w)[0].src;
  }
  function toMobile(url) {
    return (url || "").replace(/\/image[DT]\.img\./, "/imageM.img.");
  }
  function bgUrl4(el) {
    const style = el && el.getAttribute("style") || "";
    const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
    return m && m[1] ? m[1] : "";
  }
  function parseHtmlPromo(element, document2) {
    const link = element.querySelector("a[href]") || (element.matches("a[href]") ? element : null);
    const spans = [...element.querySelectorAll("[data-src]")].map((s) => {
      const mw = (s.getAttribute("data-media") || "").match(/min-width:\s*(\d+)/);
      return { src: s.getAttribute("data-src"), w: mw ? parseInt(mw[1], 10) : 0 };
    }).filter((s) => s.src);
    const byName = spans.find((s) => /\/imageM\./.test(s.src));
    const smallest = spans.sort((a, b) => a.w - b.w)[0];
    const bgEl = element.querySelector('[style*="url("]');
    const imgEl = element.querySelector("img[src]");
    const rawSrc = byName && byName.src || smallest && smallest.src || bgUrl4(bgEl) || imgEl && imgEl.getAttribute("src") || "";
    const src = toMobile(rawSrc);
    const label = "Check winning numbers";
    const cells = [];
    const imageCell = [];
    if (src) {
      const image = document2.createElement("img");
      image.src = absolutize4(src);
      image.alt = label;
      imageCell.push(image);
    }
    const linkCell = [];
    if (link) {
      const a = document2.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = label;
      linkCell.push(a);
    }
    if (!imageCell.length && !linkCell.length) {
      element.remove();
      return;
    }
    cells.push([imageCell.length ? imageCell : "", linkCell.length ? linkCell : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-promo", cells });
    element.replaceWith(block);
  }
  function labelFromHref2(href) {
    try {
      const url = new URL(href, ORIGIN4);
      const seg = url.pathname.split("/").filter(Boolean).pop() || "";
      const name = seg.replace(/\.html$/, "").replace(/^lottomax$/i, "lotto max").replace(/[-_]+/g, " ").trim();
      return name ? name.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    } catch (e) {
      return "";
    }
  }
  function parse4(element, { document: document2 }) {
    if (element.matches(".html-promo") || element.querySelector(".html-promo-image-container") && !element.querySelector(".cmp-image")) {
      parseHtmlPromo(element, document2);
      return;
    }
    let items = [...element.querySelectorAll(".cmp-image")].filter((el) => el.querySelector("picture, img"));
    if (!items.length) {
      items = [...element.querySelectorAll("a[href] picture")].filter((p) => !p.closest(".banner")).map((p) => p.closest("a").parentElement);
    }
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    items.forEach((item) => {
      var _a;
      if (item.closest(".banner")) return;
      const picture = item.querySelector("picture");
      const img = item.querySelector("img");
      const link = item.querySelector("a[href]");
      const href = link ? link.getAttribute("href") : "";
      const src = desktopSrc(picture, img);
      if (!src) return;
      const key = `${href}|${src}`;
      if (seen.has(key)) return;
      seen.add(key);
      const alt = (img && img.getAttribute("alt") || "").trim();
      const gtmName = (((_a = item.querySelector("[data-gtm-name]")) == null ? void 0 : _a.getAttribute("data-gtm-name")) || "").trim();
      const label = !GENERIC_ALT.test(alt) && alt || labelFromHref2(href) || gtmName || alt || "Learn more";
      const image = document2.createElement("img");
      image.src = absolutize4(src);
      image.alt = alt && !GENERIC_ALT.test(alt) ? alt : label;
      const linkCell = [];
      if (href) {
        const a = document2.createElement("a");
        a.href = href;
        a.textContent = label;
        linkCell.push(a);
      }
      const imageCell = [image];
      let mSrc = absolutize4(mobileSrc(picture));
      if (!/\/imageM\.img\./.test(mSrc)) {
        const derived = toMobile(image.src);
        if (derived !== image.src) mSrc = derived;
      }
      if (mSrc && mSrc !== image.src) {
        const mImage = document2.createElement("img");
        mImage.src = mSrc;
        mImage.alt = image.alt;
        imageCell.push(mImage);
      }
      cells.push([imageCell, linkCell.length ? linkCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/alc-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ORIGIN5 = "https://www.alc.ca";
  var ALC_HOSTS = ["www.alc.ca", "alc.ca"];
  function absolutizeUrl(value) {
    if (!value) return value;
    const v = value.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN5}${v}`;
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
      url = new URL(raw, ORIGIN5);
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
      return `${ORIGIN5}${path}${url.search}${url.hash || ""}`;
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
      const { pathname } = new URL(url, ORIGIN5);
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

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-promo": parse,
    "carousel-winners": parse2,
    "cards-game": parse3,
    "cards-promo": parse4
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "ALC English homepage",
    urls: [
      "https://www.alc.ca/content/alc/en.html"
    ],
    blocks: [
      { name: "carousel-promo", instances: [".carousel.list.parbase.hero"] },
      { name: "carousel-winners", instances: [".winners-carousel.carousel.panelcontainer"] },
      { name: "cards-game", instances: [".alc-container.cmp-container--game-tiles"] },
      { name: "cards-promo", instances: [".alc-container.cmp-container--hide-column-gutters", ".html-promo"] }
    ],
    sections: [
      {
        id: "0",
        name: "mobile-banner",
        selector: [".html-promo"],
        style: "mobile-banner",
        blocks: ["cards-promo"],
        defaultContent: []
      },
      {
        id: "1",
        name: "hero-carousel",
        selector: [".carousel.list.parbase.hero"],
        style: null,
        blocks: ["carousel-promo"],
        defaultContent: []
      },
      {
        id: "2",
        name: "recent-winners",
        selector: [".section-header.cmp-section-header--alc-blue"],
        style: "winners",
        blocks: ["carousel-winners"],
        defaultContent: [".cmp-section-header--alc-blue .cmp-section-header__title"]
      },
      {
        id: "3",
        name: "featured-games",
        selector: [".section-header.cmp-section-header--alc-green"],
        style: "featured, sidebar",
        blocks: ["cards-game", "cards-promo"],
        defaultContent: [".cmp-section-header--alc-green .cmp-section-header__title"]
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
  var import_homepage_default = {
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
  return __toCommonJS(import_homepage_exports);
})();
