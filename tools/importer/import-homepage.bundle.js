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
  function parse3(element, { document: document2 }) {
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
    const isAsset = path.startsWith("/content/dam/");
    const isGameLauncher = /\/game\.html$/.test(path) && url.searchParams.has("gameId");
    if (isAsset || isGameLauncher || !path.startsWith("/content/alc")) {
      if (path.startsWith("/etc.clientlibs")) return href;
      return `${ORIGIN5}${path}${url.search}${url.hash || ""}`;
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
