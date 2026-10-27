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

  // tools/importer/import-content-page.js
  var import_content_page_exports = {};
  __export(import_content_page_exports, {
    default: () => import_content_page_default
  });

  // tools/importer/parsers/hero-banner.js
  var ORIGIN = "https://www.alc.ca";
  function clean(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolutize(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|data:)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN}${v}`;
    return v;
  }
  function cssUnescape(value) {
    return value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (m, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(.)/g, "$1");
  }
  function bgUrl(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/background(?:-image)?\s*:[^;]*url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
    return m && m[1] ? cssUnescape(m[1]).trim() : "";
  }
  function makeImg(document2, src, alt) {
    const img = document2.createElement("img");
    img.src = absolutize(src);
    img.alt = alt || "";
    return img;
  }
  function parse(element, { document: document2 }) {
    const isLegacy = element.matches(".hero") || !!element.querySelector(".hero-row");
    let image = null;
    if (isLegacy) {
      const holder = element.querySelector(".hero-row .hero-image") || element.querySelector(".hero-image");
      const src = bgUrl(holder) || holder && holder.querySelector('[data-media*="1200"][data-src]') && holder.querySelector('[data-media*="1200"][data-src]').getAttribute("data-src") || holder && holder.querySelector("[data-src]") && holder.querySelector("[data-src]").getAttribute("data-src");
      if (src) image = makeImg(document2, src, "");
    } else {
      const styled = [element, ...element.querySelectorAll('[style*="background"]')].find((el) => bgUrl(el));
      if (styled) {
        image = makeImg(document2, bgUrl(styled), "");
      } else {
        const imgEl = [...element.querySelectorAll(".image img, .cmp-image img, img")].find((i) => !i.closest(".cmp-breadcrumb") && (i.getAttribute("src") || "").trim());
        if (imgEl) image = makeImg(document2, imgEl.getAttribute("src"), imgEl.getAttribute("alt") || "");
      }
    }
    const content = [];
    const scope = isLegacy ? element.querySelector(".hero-row .text-area") || element.querySelector(".text-area") : element;
    if (scope) {
      const h = [...scope.querySelectorAll("h1, h2")].find((el) => !el.closest(".cmp-breadcrumb, .corp-menu-container") && clean(el.textContent));
      if (h) {
        const h1 = document2.createElement("h1");
        h1.textContent = clean(h.textContent);
        content.push(h1);
      }
      const paras = isLegacy ? [...scope.querySelectorAll("p")] : [...scope.querySelectorAll(".text .cmp-text > p, .text .cmp-text > ul, .text .cmp-text > ol")];
      paras.forEach((p) => {
        if (!clean(p.textContent)) return;
        if (p.closest(".cmp-breadcrumb, .corp-menu-container")) return;
        p.removeAttribute("class");
        p.removeAttribute("style");
        content.push(p);
      });
      const ctas = [...scope.querySelectorAll("a.button, a.arrow-button, .cmp-button, .alc-button a")].filter((a) => a.getAttribute("href") && clean(a.textContent));
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        const link = document2.createElement("a");
        link.href = absolutize(a.getAttribute("href"));
        link.textContent = clean(a.textContent);
        strong.append(link);
        p.append(strong);
        content.push(p);
      });
    }
    if (!image && !content.length) {
      element.remove();
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    if (content.length) cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  var ORIGIN2 = "https://www.alc.ca";
  var ITEM = ".teaser.cmp-teaser--tile, .teaser.cmp-teaser--vertical-wide, .teaser.cmp-teaser--vertical-square, .teaser.cmp-teaser--card, .teaser.cmp-teaser--tile-button, .teaser.cmp-teaser--icon-left, .information-card";
  var GENERIC = '.teaser[class*="aem-GridColumn--default--"]:not(.aem-GridColumn--default--12, .cmp-teaser--horizontal-left, .cmp-teaser--horizontal-right, .cmp-teaser--quiz, .cmp-teaser--rewards)';
  var ANY_ITEM = `${ITEM}, ${GENERIC}`;
  function clean2(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolutize2(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN2}${v}`;
    return v;
  }
  function isSkippable(el) {
    if (el.tagName === "HR" || el.matches(".section-metadata")) return false;
    if (el.matches(".separator, .cmp-separator")) return true;
    if (el.querySelector("img, iframe, video, picture")) return false;
    return !clean2(el.textContent);
  }
  function findRuns(grid, itemSelector) {
    const runs = [];
    let current = null;
    let pending = [];
    [...grid.children].forEach((child) => {
      if (child.matches(itemSelector)) {
        if (!current) {
          current = { items: [], nodes: [] };
          runs.push(current);
        } else {
          current.nodes.push(...pending);
        }
        pending = [];
        current.items.push(child);
        current.nodes.push(child);
      } else if (current && isSkippable(child)) {
        pending.push(child);
      } else {
        current = null;
        pending = [];
      }
    });
    return runs;
  }
  function modalVideoUrl(document2) {
    const frames = [...document2.querySelectorAll(".alc-modal iframe[src], .modal iframe[src]")].map((f) => f.getAttribute("src")).filter((s) => /youtube|youtu\.be|vimeo/i.test(s || ""));
    const unique = [...new Set(frames)];
    if (unique.length !== 1) return "";
    const src = absolutize2(unique[0]);
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/i);
    if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
    const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/i);
    if (vm) return `https://vimeo.com/${vm[1]}`;
    return src.split("?")[0];
  }
  function makeLink(document2, href, text) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function resolveHref(document2, a) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw || raw === "#" || /^javascript:/i.test(raw)) return modalVideoUrl(document2);
    return absolutize2(raw);
  }
  function imageFrom(document2, el, fallbackAlt) {
    const imgEl = [...el.querySelectorAll("img")].find((i) => (i.getAttribute("src") || "").trim() && !i.closest(".cmp-favourite-button"));
    if (!imgEl) return null;
    const img = document2.createElement("img");
    img.src = absolutize2(imgEl.getAttribute("src"));
    img.alt = imgEl.getAttribute("alt") || fallbackAlt || "";
    const w = imgEl.getAttribute("width");
    const h = imgEl.getAttribute("height");
    if (w) img.setAttribute("width", w);
    if (h) img.setAttribute("height", h);
    return img;
  }
  function trimBreaks(root) {
    root.querySelectorAll("p, b, strong, span, em, i, u").forEach((el) => {
      const edge = (first) => {
        let n2 = first ? el.firstChild : el.lastChild;
        while (n2 && n2.nodeType === 3 && !n2.textContent.replace(/ /g, " ").trim()) n2 = first ? n2.nextSibling : n2.previousSibling;
        return n2;
      };
      let n = edge(true);
      while (n && n.nodeName === "BR") {
        n.remove();
        n = edge(true);
      }
      n = edge(false);
      while (n && n.nodeName === "BR") {
        n.remove();
        n = edge(false);
      }
    });
  }
  function richParagraphs(container) {
    const out = [];
    if (!container) return out;
    container.querySelectorAll("a").forEach((a) => {
      if (!clean2(a.textContent) && !a.querySelector("img")) {
        a.remove();
        return;
      }
      const href = a.getAttribute("href");
      if (href) a.setAttribute("href", resolveHref(container.ownerDocument, a) || href);
    });
    trimBreaks(container);
    [...container.children].forEach((child) => {
      if (!clean2(child.textContent) && !child.querySelector("img")) return;
      child.removeAttribute("class");
      child.removeAttribute("style");
      out.push(child);
    });
    if (!out.length && clean2(container.textContent)) {
      const p = container.ownerDocument.createElement("p");
      p.textContent = clean2(container.textContent);
      out.push(p);
    }
    return bulletize(container.ownerDocument, out);
  }
  var BULLET_RE = /^[\s ]*[·•▪◦‣∙●]\s*/;
  function bulletize(document2, nodes) {
    const out = [];
    let ul = null;
    const firstText = (lineNodes) => {
      for (const n of lineNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) return n;
        if (n.nodeType === 1) {
          const walker = document2.createTreeWalker(n, 4);
          for (let t = walker.nextNode(); t; t = walker.nextNode()) if (t.textContent.trim()) return t;
        }
      }
      return null;
    };
    const addLine = (lineNodes) => {
      const text = lineNodes.map((n) => n.textContent).join("");
      if (!clean2(text) && !lineNodes.some((n) => n.nodeType === 1 && (n.matches("img") || n.querySelector("img")))) return;
      if (BULLET_RE.test(text)) {
        const t = firstText(lineNodes);
        if (t) t.textContent = t.textContent.replace(BULLET_RE, "");
        if (!ul) {
          ul = document2.createElement("ul");
          out.push(ul);
        }
        const li = document2.createElement("li");
        li.append(...lineNodes);
        ul.append(li);
      } else {
        ul = null;
        const p = document2.createElement("p");
        p.append(...lineNodes);
        out.push(p);
      }
    };
    nodes.forEach((node) => {
      const hasBullet = node.tagName === "P" && (BULLET_RE.test(node.textContent) || /<br[^>]*>\s*[·•▪◦‣∙●]/.test(node.innerHTML));
      if (!hasBullet) {
        ul = null;
        out.push(node);
        return;
      }
      let line = [];
      [...node.childNodes].forEach((n) => {
        if (n.nodeName === "BR") {
          addLine(line);
          line = [];
        } else {
          line.push(n);
        }
      });
      addLine(line);
    });
    return out;
  }
  function parseTeaser(document2, item) {
    const teaser = item.querySelector(".cmp-teaser") || item;
    const wrapLink = teaser.querySelector("a.cmp-teaser__link[href]");
    const titleEl = teaser.querySelector(".cmp-teaser__title");
    const title = clean2(titleEl && titleEl.textContent);
    const image = imageFrom(document2, teaser.querySelector(".cmp-teaser__image") || teaser, title);
    const body = [];
    const pretitle = clean2(teaser.querySelector(".cmp-teaser__pretitle") && teaser.querySelector(".cmp-teaser__pretitle").textContent);
    if (pretitle) {
      const p = document2.createElement("p");
      p.textContent = pretitle;
      body.push(p);
    }
    if (title) {
      const h3 = document2.createElement("h3");
      const titleLink = titleEl.querySelector("a[href]") || wrapLink;
      const href = titleLink ? resolveHref(document2, titleLink) : "";
      if (href) h3.append(makeLink(document2, href, title));
      else h3.textContent = title;
      body.push(h3);
    }
    body.push(...richParagraphs(teaser.querySelector(".cmp-teaser__description")));
    teaser.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
      const text = clean2(a.textContent);
      const href = resolveHref(document2, a);
      if (!text || !href) return;
      if (body.some((n) => n.querySelector && n.querySelector(`a[href="${href}"]`) && clean2(n.textContent) === text)) return;
      const p = document2.createElement("p");
      p.append(makeLink(document2, href, text));
      body.push(p);
    });
    if (!title && wrapLink) {
      const href = resolveHref(document2, wrapLink);
      const text = clean2(wrapLink.textContent);
      if (href && text) {
        const p = document2.createElement("p");
        p.append(makeLink(document2, href, text));
        body.push(p);
      }
    }
    return { image, body };
  }
  function parseInformationCard(document2, item) {
    const card = item.querySelector(".alc-information-card") || item;
    const titleEl = card.querySelector(".alc-information-card__title");
    const title = clean2(titleEl && titleEl.textContent);
    const image = imageFrom(document2, card.querySelector(".alc-information-card__image-wrapper") || card, title);
    const body = [];
    if (title) {
      const h3 = document2.createElement("h3");
      h3.textContent = title;
      body.push(h3);
    }
    card.querySelectorAll(".alc-information-card__description, .alc-information-card__text-box p").forEach((p) => {
      const text = clean2(p.textContent);
      if (!text) return;
      const np = document2.createElement("p");
      np.append(...p.childNodes);
      body.push(np);
    });
    card.querySelectorAll("a.alc-information-card__button, .alc-information-card__button-wrapper a").forEach((a) => {
      const text = clean2(a.textContent);
      const href = resolveHref(document2, a);
      if (!text || !href) return;
      if (body.some((n) => clean2(n.textContent) === text)) return;
      const p = document2.createElement("p");
      p.append(makeLink(document2, href, text));
      body.push(p);
    });
    return { image, body };
  }
  function buildCells(document2, items) {
    const cells = [];
    items.forEach((item) => {
      const { image, body } = item.querySelector(".alc-information-card") || item.matches(".alc-information-card") ? parseInformationCard(document2, item) : parseTeaser(document2, item);
      if (!image && !body.length) return;
      cells.push([image || "", body.length ? body : ""]);
    });
    return cells;
  }
  function parse2(element, { document: document2 }) {
    const runs = (element.matches(ANY_ITEM) ? [{ items: [element], nodes: [element] }] : findRuns(element, ANY_ITEM)).filter((run) => run.items.length > 1 || run.items.some((i) => i.matches(ITEM)));
    if (!runs.length) return;
    const meaningful = [...element.children].filter((c) => !isSkippable(c));
    const runCovers = runs.length === 1 && meaningful.every((c) => runs[0].nodes.includes(c));
    runs.forEach((run) => {
      const cells = buildCells(document2, run.items);
      if (!cells.length) return;
      const block = WebImporter.Blocks.createBlock(document2, { name: "cards-feature", cells });
      if (runCovers || element.matches(ANY_ITEM)) {
        element.replaceWith(block);
      } else {
        run.nodes[0].before(block);
        run.nodes.forEach((n) => n.remove());
      }
    });
  }

  // tools/importer/parsers/columns-media.js
  var ORIGIN3 = "https://www.alc.ca";
  var ITEM2 = ".teaser.cmp-teaser--horizontal-left, .teaser.cmp-teaser--horizontal-right, .textimage";
  function clean3(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolutize3(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN3}${v}`;
    return v;
  }
  function isSkippable2(el) {
    if (el.tagName === "HR" || el.matches(".section-metadata")) return false;
    if (el.matches(".separator, .cmp-separator")) return true;
    if (el.querySelector("img, iframe, video, picture, table")) return false;
    return !clean3(el.textContent);
  }
  function findRuns2(parent) {
    const runs = [];
    let current = null;
    let pending = [];
    [...parent.children].forEach((child) => {
      if (child.matches(ITEM2)) {
        if (!current) {
          current = { items: [], nodes: [] };
          runs.push(current);
        } else {
          current.nodes.push(...pending);
        }
        pending = [];
        current.items.push(child);
        current.nodes.push(child);
      } else if (current && isSkippable2(child)) {
        pending.push(child);
      } else {
        current = null;
        pending = [];
      }
    });
    return runs;
  }
  function imgSrc(imgEl) {
    let src = (imgEl.getAttribute("src") || "").trim();
    if (!src || src.startsWith("data:")) {
      const cmp = imgEl.closest("[data-cmp-src]");
      if (cmp) src = cmp.getAttribute("data-cmp-src").replace("{.width}", "");
    }
    if (!src || src.startsWith("data:")) {
      const set = (imgEl.getAttribute("srcset") || "").split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
      if (set.length) src = set[set.length - 1];
    }
    return src;
  }
  function imageFrom2(document2, root, fallbackAlt) {
    if (!root) return null;
    const imgEl = [...root.querySelectorAll("img")].find((i) => imgSrc(i));
    if (!imgEl) return null;
    const img = document2.createElement("img");
    img.src = absolutize3(imgSrc(imgEl));
    img.alt = imgEl.getAttribute("alt") || fallbackAlt || "";
    return img;
  }
  function modalVideoUrl2(document2) {
    const frames = [...document2.querySelectorAll(".alc-modal iframe[src], .modal iframe[src]")].map((f) => f.getAttribute("src")).filter((s) => /youtube|youtu\.be|vimeo/i.test(s || ""));
    const unique = [...new Set(frames)];
    if (unique.length !== 1) return "";
    const src = absolutize3(unique[0]);
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/i);
    if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
    const vm = src.match(/player\.vimeo\.com\/video\/(\d+)/i);
    if (vm) return `https://vimeo.com/${vm[1]}`;
    return src.split("?")[0];
  }
  function resolveHref2(document2, a) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw || raw === "#" || /^javascript:/i.test(raw)) return modalVideoUrl2(document2);
    return absolutize3(raw);
  }
  function makeLink2(document2, href, text) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function richChildren(document2, container) {
    const out = [];
    if (!container) return out;
    container.querySelectorAll("a").forEach((a) => {
      if (!clean3(a.textContent) && !a.querySelector("img")) {
        a.remove();
        return;
      }
      const href = a.getAttribute("href");
      if (href) a.setAttribute("href", resolveHref2(document2, a) || href);
    });
    [...container.children].forEach((child) => {
      if (!clean3(child.textContent) && !child.querySelector("img")) return;
      child.removeAttribute("class");
      child.removeAttribute("style");
      out.push(child);
    });
    if (!out.length && clean3(container.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean3(container.textContent);
      out.push(p);
    }
    return out;
  }
  function parseTeaser2(document2, item) {
    const teaser = item.querySelector(".cmp-teaser") || item;
    const wrapLink = teaser.querySelector("a.cmp-teaser__link[href]");
    const titleEl = teaser.querySelector(".cmp-teaser__title");
    const title = clean3(titleEl && titleEl.textContent);
    const image = imageFrom2(document2, teaser.querySelector(".cmp-teaser__image"), title);
    const text = [];
    const pretitleEl = teaser.querySelector(".cmp-teaser__pretitle");
    if (pretitleEl && clean3(pretitleEl.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean3(pretitleEl.textContent);
      text.push(p);
    }
    if (title) {
      const level = titleEl && /^H[2-4]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : "h3";
      const h = document2.createElement(level);
      const titleLink = titleEl.querySelector("a[href]") || wrapLink;
      const href = titleLink ? resolveHref2(document2, titleLink) : "";
      if (href) h.append(makeLink2(document2, href, title));
      else h.textContent = title;
      text.push(h);
    }
    text.push(...richChildren(document2, teaser.querySelector(".cmp-teaser__description")));
    teaser.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
      const label = clean3(a.textContent);
      const href = resolveHref2(document2, a);
      if (!label || !href) return;
      const p = document2.createElement("p");
      p.append(makeLink2(document2, href, label));
      text.push(p);
    });
    const imageFirst = item.matches(".cmp-teaser--horizontal-left");
    return { image, text, imageFirst };
  }
  function parseTextImage(document2, item) {
    const left = item.querySelector(".textimage-left");
    const right = item.querySelector(".textimage-right");
    const image = imageFrom2(document2, left || right || item, "");
    const text = richChildren(document2, item.querySelector(".textimage-text"));
    return { image, text, imageFirst: !right };
  }
  function buildCells2(document2, items) {
    const cells = [];
    items.forEach((item) => {
      const { image, text, imageFirst } = item.matches(".textimage") ? parseTextImage(document2, item) : parseTeaser2(document2, item);
      if (!image && !text.length) return;
      const textCell = text.length ? text : "";
      const imageCell = image || "";
      cells.push(imageFirst ? [imageCell, textCell] : [textCell, imageCell]);
    });
    return cells;
  }
  function parse3(element, { document: document2 }) {
    const runs = element.matches(ITEM2) ? [{ items: [element], nodes: [element] }] : findRuns2(element);
    if (!runs.length) return;
    const meaningful = [...element.children].filter((c) => !isSkippable2(c));
    const runCovers = runs.length === 1 && meaningful.every((c) => runs[0].nodes.includes(c));
    runs.forEach((run) => {
      const cells = buildCells2(document2, run.items);
      if (!cells.length) return;
      const block = WebImporter.Blocks.createBlock(document2, { name: "columns-media", cells });
      if (runCovers || element.matches(ITEM2)) {
        element.replaceWith(block);
      } else {
        run.nodes[0].before(block);
        run.nodes.forEach((n) => n.remove());
      }
    });
  }

  // tools/importer/parsers/columns-contact.js
  var ORIGIN4 = "https://www.alc.ca";
  var ITEM3 = ".text.cmp-text--desktop-alignment-center";
  function clean4(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolutize4(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN4}${v}`;
    return v;
  }
  function isSkippable3(el) {
    if (el.tagName === "HR" || el.matches(".section-metadata")) return false;
    if (el.matches(".separator, .cmp-separator")) return true;
    if (el.querySelector("img, iframe, table")) return false;
    return !clean4(el.textContent);
  }
  function helplineCell(document2, item) {
    const text = item.querySelector(".cmp-text") || item;
    const out = [];
    [...text.children].forEach((block) => {
      if (!clean4(block.textContent)) return;
      if (block.tagName !== "P") {
        block.removeAttribute("class");
        block.removeAttribute("style");
        out.push(block);
        return;
      }
      let p = document2.createElement("p");
      const flush = () => {
        if (clean4(p.textContent) || p.querySelector("img")) out.push(p);
        p = document2.createElement("p");
      };
      [...block.childNodes].forEach((node) => {
        if (node.nodeType === 1 && node.tagName === "BR") {
          flush();
          return;
        }
        if (node.nodeType === 1 && /^(B|STRONG)$/.test(node.tagName)) {
          const strong = document2.createElement("strong");
          strong.textContent = clean4(node.textContent);
          if (strong.textContent) p.append(strong);
          return;
        }
        if (node.nodeType === 1 && node.tagName === "A") {
          const a = document2.createElement("a");
          a.href = absolutize4(node.getAttribute("href"));
          a.textContent = clean4(node.textContent);
          if (a.textContent) p.append(a);
          return;
        }
        const t = node.textContent.replace(/ /g, " ");
        if (t.trim()) p.append(document2.createTextNode(p.childNodes.length ? t : t.replace(/^\s+/, "")));
      });
      flush();
    });
    return out;
  }
  function parse4(element, { document: document2 }) {
    const children = [...element.children];
    const items = children.filter((c) => c.matches(ITEM3));
    if (!items.length) return;
    const row = items.map((item) => {
      const content = helplineCell(document2, item);
      return content.length ? content : "";
    }).filter((c) => c !== "");
    if (!row.length) return;
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-contact", cells: [row] });
    const start = children.indexOf(items[0]);
    const end = children.indexOf(items[items.length - 1]);
    items[0].before(block);
    children.slice(start, end + 1).forEach((c) => {
      if (c.matches(ITEM3) || isSkippable3(c)) c.remove();
    });
  }

  // tools/importer/parsers/accordion-bar.js
  function clean5(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  var ORIGIN5 = "https://www.alc.ca";
  var CONTAINER = ".alc-container, .cmp-container, .aem-Grid, .responsivegrid, .container, .xf-content-height, .experiencefragment, .cmp-experiencefragment";
  function absolutize5(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN5}${v}`;
    return v;
  }
  function strongLinkParagraph(document2, a) {
    const href = a.getAttribute("href");
    const text = clean5(a.textContent) || a.getAttribute("title") || "";
    if (!href || href === "#" || !text) return null;
    const p = document2.createElement("p");
    const strong = document2.createElement("strong");
    const link = document2.createElement("a");
    link.href = absolutize5(href);
    link.textContent = text;
    strong.append(link);
    p.append(strong);
    return p;
  }
  function imgFrom(document2, imgEl) {
    const src = imgEl && (imgEl.getAttribute("src") || "").trim();
    if (!src) return null;
    const img = document2.createElement("img");
    img.src = absolutize5(src);
    img.alt = imgEl.getAttribute("alt") || "";
    return img;
  }
  function flatten(document2, root) {
    const out = [];
    root.querySelectorAll("a").forEach((a) => {
      if (!clean5(a.textContent) && !a.querySelector("img")) a.remove();
    });
    const visit = (el) => {
      if (el.nodeType === 3) {
        if (clean5(el.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean5(el.textContent);
          out.push(p);
        }
        return;
      }
      if (el.nodeType !== 1) return;
      if (el.matches("script, style, noscript, .separator, .cmp-separator, hr")) return;
      if (el.matches(".cmp-text, .text-area")) {
        [...el.children].forEach((c) => {
          if (!clean5(c.textContent) && !c.querySelector("img, table")) return;
          out.push(c);
        });
        return;
      }
      if (el.matches(".cmp-title")) {
        const h = el.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && clean5(h.textContent)) {
          const nh = document2.createElement(/^H[12]$/.test(h.tagName) ? "h3" : h.tagName.toLowerCase());
          nh.textContent = clean5(h.textContent);
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
        const title = clean5(el.querySelector(".cmp-teaser__title") && el.querySelector(".cmp-teaser__title").textContent);
        if (title) {
          const h = document2.createElement("h4");
          h.textContent = title;
          out.push(h);
        }
        const desc = el.querySelector(".cmp-teaser__description");
        if (desc) [...desc.children].forEach((c) => {
          if (clean5(c.textContent)) out.push(c);
        });
        el.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
          const href = a.getAttribute("href");
          if (!href || href === "#" || !clean5(a.textContent)) return;
          const p = document2.createElement("p");
          const link = document2.createElement("a");
          link.href = absolutize5(href);
          link.textContent = clean5(a.textContent);
          p.append(link);
          out.push(p);
        });
        return;
      }
      if (el.matches(".cmp-embed")) {
        const f = el.querySelector("iframe[src]");
        const m = f && f.getAttribute("src").match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
        const href = m ? `https://www.youtube.com/watch?v=${m[1]}` : f ? absolutize5(f.getAttribute("src")) : "";
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
      if (clean5(el.textContent) || el.querySelector("img, table") || el.tagName === "IMG") out.push(el);
    };
    [...root.childNodes].forEach(visit);
    return out;
  }
  function parseCoreAccordion(element, document2) {
    const cells = [];
    [...element.querySelectorAll(":scope > .cmp-accordion__item")].forEach((item) => {
      const titleEl = item.querySelector(":scope > .cmp-accordion__header .cmp-accordion__title") || item.querySelector(".cmp-accordion__title, .cmp-accordion__button");
      const title = clean5(titleEl && titleEl.textContent);
      if (!title) return;
      const panel = item.querySelector(":scope > .cmp-accordion__panel") || item.querySelector(".cmp-accordion__panel");
      const body = panel ? flatten(document2, panel) : [];
      cells.push([title, body.length ? body : ""]);
    });
    return cells;
  }
  function parse5(element, { document: document2 }) {
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
      const title = clean5(titleEl && titleEl.textContent);
      if (!title) return;
      const bodyEl = panel.querySelector(".panel-body") || panel.querySelector(".panel-collapse");
      const body = [];
      if (bodyEl) {
        [...bodyEl.children].forEach((child) => {
          if (!clean5(child.textContent) && !child.querySelector("img")) return;
          body.push(child);
        });
        if (!body.length && clean5(bodyEl.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean5(bodyEl.textContent);
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

  // tools/importer/parsers/tabs-boxed.js
  var BULLET_RE2 = /^\s*[·•▪◦‣∙●]\s*/;
  function clean6(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function isEmptyNode(node) {
    if (node.nodeType === 3) return !clean6(node.textContent);
    if (node.nodeType !== 1) return true;
    if (node.tagName === "BR") return true;
    if (node.querySelector && node.querySelector("img, picture, video, iframe")) return false;
    if (node.tagName === "IMG") return false;
    return !clean6(node.textContent);
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
      first.textContent = first.textContent.replace(BULLET_RE2, "");
    } else {
      const walker = first.ownerDocument.createTreeWalker(first, 4);
      const t = walker.nextNode();
      if (t) t.textContent = t.textContent.replace(BULLET_RE2, "");
    }
  }
  function lineStartsWithBullet(nodes) {
    const text = nodes.map((n) => n.textContent).join("");
    return BULLET_RE2.test(text.replace(/^[\s ]+/, ""));
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
      if (!clean6(a.textContent) && !a.querySelector("img")) a.remove();
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
    if (!content.length && clean6(panel.textContent)) {
      const p = document2.createElement("p");
      p.append(...panel.childNodes);
      content.push(p);
    }
    return content;
  }
  var ORIGIN6 = "https://www.alc.ca";
  var CONTAINER2 = ".alc-container, .cmp-container, .aem-Grid, .responsivegrid, .container, .xf-content-height, .experiencefragment, .cmp-experiencefragment";
  function absolutize6(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN6}${v}`;
    return v;
  }
  function linkParagraph(document2, href, text, strong) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = absolutize6(href);
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
  function imgFrom2(document2, imgEl) {
    const src = imgEl && (imgEl.getAttribute("src") || "").trim();
    if (!src) return null;
    const img = document2.createElement("img");
    img.src = absolutize6(src);
    img.alt = imgEl.getAttribute("alt") || "";
    return img;
  }
  function videoHref(el) {
    const f = el.querySelector("iframe[src]");
    if (f) {
      const m = f.getAttribute("src").match(/youtube(?:-nocookie)?\.com\/embed\/([^?&/]+)/);
      return m ? `https://www.youtube.com/watch?v=${m[1]}` : absolutize6(f.getAttribute("src"));
    }
    if (/^[A-Za-z0-9_-]{11}$/.test(el.id || "") && !/^embed-/.test(el.id)) return `https://www.youtube.com/watch?v=${el.id}`;
    return "";
  }
  function flatten2(document2, root) {
    const out = [];
    root.querySelectorAll("a").forEach((a) => {
      if (!clean6(a.textContent) && !a.querySelector("img")) a.remove();
    });
    const visit = (el) => {
      if (el.nodeType === 3) {
        if (clean6(el.textContent)) {
          const p = document2.createElement("p");
          p.textContent = clean6(el.textContent);
          out.push(p);
        }
        return;
      }
      if (el.nodeType !== 1) return;
      if (el.matches("script, style, noscript, .separator, .cmp-separator, hr, .cmp-favourite-button")) return;
      if (el.matches(".cmp-text")) {
        [...el.children].forEach((c) => {
          if (!clean6(c.textContent) && !c.querySelector("img, table")) return;
          out.push(...c.tagName === "P" ? convertBulletParagraph(document2, c) : [c]);
        });
        return;
      }
      if (el.matches(".cmp-title")) {
        const h = el.querySelector("h1, h2, h3, h4, h5, h6");
        if (h && clean6(h.textContent)) {
          const nh = document2.createElement(/^H[12]$/.test(h.tagName) ? "h3" : h.tagName.toLowerCase());
          nh.textContent = clean6(h.textContent);
          out.push(nh);
        }
        return;
      }
      if (el.matches(".cmp-image")) {
        const img = imgFrom2(document2, el.querySelector("img"));
        if (img) out.push(img);
        return;
      }
      if (el.matches(".alc-button, .cmp-button, .dynamic-cta, .cmp-dynamic-cta")) {
        el.querySelectorAll("a[href]").forEach((a) => {
          const href = a.getAttribute("href");
          const text = clean6(a.textContent) || a.getAttribute("title");
          if (href && href !== "#" && text) out.push(linkParagraph(document2, href, text, true));
        });
        return;
      }
      if (el.matches(".cmp-teaser")) {
        const img = imgFrom2(document2, el.querySelector(".cmp-teaser__image img"));
        if (img) out.push(img);
        const title = clean6(el.querySelector(".cmp-teaser__title") && el.querySelector(".cmp-teaser__title").textContent);
        if (title) {
          const h = document2.createElement("h4");
          h.textContent = title;
          out.push(h);
        }
        const desc = el.querySelector(".cmp-teaser__description");
        if (desc) {
          [...desc.children].forEach((c) => {
            if (!clean6(c.textContent) && !c.querySelector("img")) return;
            out.push(...c.tagName === "P" ? convertBulletParagraph(document2, c) : [c]);
          });
        }
        el.querySelectorAll(".cmp-teaser__action-container a[href]").forEach((a) => {
          const href = a.getAttribute("href");
          if (href && href !== "#" && clean6(a.textContent)) out.push(linkParagraph(document2, href, clean6(a.textContent), false));
        });
        return;
      }
      if (el.matches(".cmp-embed")) {
        const href = videoHref(el);
        if (href) out.push(linkParagraph(document2, href, href, false));
        return;
      }
      if (el.matches(".cmp-accordion")) {
        el.querySelectorAll(":scope > .cmp-accordion__item").forEach((item) => {
          const t = clean6(item.querySelector(".cmp-accordion__title") && item.querySelector(".cmp-accordion__title").textContent);
          if (t) {
            const h = document2.createElement("h4");
            h.textContent = t;
            out.push(h);
          }
          const panel = item.querySelector(":scope > .cmp-accordion__panel");
          if (panel) [...panel.childNodes].forEach(visit);
        });
        return;
      }
      if (el.matches(CONTAINER2) || el.tagName === "DIV" && el.children.length) {
        [...el.childNodes].forEach(visit);
        return;
      }
      if (clean6(el.textContent) || el.querySelector("img, table") || el.tagName === "IMG") out.push(el);
    };
    [...root.childNodes].forEach(visit);
    return out;
  }
  var CORE_CONTENT = ".alc-container, .cmp-container, .aem-Grid, .cmp-text, .cmp-teaser, .cmp-image, .cmp-embed, .cmp-accordion";
  function parse6(element, { document: document2 }) {
    const cells = [];
    let tabs = [...element.querySelectorAll(":scope > .cmp-tabs__tablist > .cmp-tabs__tab")];
    if (!tabs.length) tabs = [...element.querySelectorAll(".cmp-tabs__tab")];
    let panels = [...element.querySelectorAll(":scope > .cmp-tabs__tabpanel")];
    if (!panels.length) panels = [...element.querySelectorAll(".cmp-tabs__tabpanel")];
    tabs.forEach((tab, i) => {
      const label = clean6(tab.textContent);
      if (!label) return;
      const panel = panels[i];
      const content = panel && panel.querySelector(CORE_CONTENT) ? flatten2(document2, panel) : buildPanel(document2, panel);
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
  var ORIGIN7 = "https://www.alc.ca";
  function absolutize7(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN7}${v}`;
    return v;
  }
  function bgUrl2(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/url\(\s*(?:&quot;|["'])?(.*?)(?:&quot;|["'])?\s*\)/i);
    return m && m[1] ? m[1] : "";
  }
  function clean7(text) {
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
      const title = clean7(card.querySelector(".hyt-game-title") && card.querySelector(".hyt-game-title").textContent);
      const imageCell = [];
      const imgHolder = card.querySelector(".hyt-game-image");
      const imgEl = imgHolder && imgHolder.querySelector("img[src]");
      const src = imgEl ? imgEl.getAttribute("src") : bgUrl2(imgHolder);
      if (src) {
        const img = document2.createElement("img");
        img.src = absolutize7(src);
        img.alt = imgEl && imgEl.getAttribute("alt") || title;
        imageCell.push(img);
      }
      const body = [];
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const prize = clean7(card.querySelector(".hyt-game-prize") && card.querySelector(".hyt-game-prize").textContent);
      if (prize) {
        const p = document2.createElement("p");
        p.textContent = prize;
        body.push(p);
      }
      const desc = clean7(card.querySelector(".hyt-game-description") && card.querySelector(".hyt-game-description").textContent);
      if (desc) {
        const p = document2.createElement("p");
        p.textContent = desc;
        body.push(p);
      }
      const learn = card.querySelector(".hyt-learn-more a[href]");
      if (learn) body.push(linkParagraph2(document2, learn.getAttribute("href"), clean7(learn.textContent) || "Learn More", false));
      const play = card.querySelector('.hyt-game-cta a[href], a[class*="hyt-play-url"][href]');
      if (play) body.push(linkParagraph2(document2, play.getAttribute("href"), clean7(play.textContent) || "Play now", true));
      const demo = card.querySelector('.hyt-try-demo a[href], a[class*="hyt-demo-url"][href]');
      if (demo) body.push(linkParagraph2(document2, demo.getAttribute("href"), clean7(demo.textContent) || "Try Demo", false));
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
    const src = imgEl ? imgEl.getAttribute("src") : bgUrl2(holder);
    if (!src) return "";
    const img = document2.createElement("img");
    img.src = absolutize7(src);
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
      const text = clean7(a.textContent) || a.getAttribute("title") || fallback;
      if (body.some((n) => n.querySelector && n.querySelector(`a[href="${href}"]`))) return;
      body.push(linkParagraph2(document2, absolutize7(href), text, strong));
    };
    if (tile.matches("article.lotto-category")) {
      const logo = tile.querySelector('[class^="game-logo"], [class*=" game-logo"]');
      title = clean7(logo && logo.getAttribute("aria-label") || tile.getAttribute("data-game"));
      image = imageCellFrom(document2, tile.querySelector(".lotto-image"), title);
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const draws = clean7(tile.querySelector(".description-container .row-left") && tile.querySelector(".description-container .row-left").textContent);
      if (draws) body.push(textParagraph(document2, draws));
      tile.querySelectorAll(".lotto-game-description p").forEach((p) => {
        if (clean7(p.textContent)) body.push(textParagraph(document2, clean7(p.textContent)));
      });
      const next = clean7(tile.querySelector(".next-draw") && tile.querySelector(".next-draw").textContent);
      if (next) body.push(textParagraph(document2, next.replace(/\s*:\s*/, ": ")));
      const amountEl = tile.querySelector(".amounts-container .prize-amount");
      if (amountEl && clean7(amountEl.textContent)) {
        const rawDigits = [...amountEl.querySelectorAll("span")].map((s) => clean7(s.textContent)).join(",") || clean7(amountEl.textContent);
        const digits = /^\$?\d{4,}$/.test(rawDigits) ? rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : rawDigits;
        const est = clean7(tile.querySelector(".amounts-container .est") && tile.querySelector(".amounts-container .est").textContent);
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = `$${digits.replace(/^\$/, "")}${est ? ` ${est}` : ""}`;
        const infos = [...tile.querySelectorAll(".amounts-container .info-text")].filter((s) => !s.closest(EXTRA_SKIP) && clean7(s.textContent));
        const isBefore = (s) => !!(s.compareDocumentPosition(amountEl) & 4);
        const before = infos.filter(isBefore).map((s) => clean7(s.textContent));
        const after = infos.filter((s) => !isBefore(s)).map((s) => clean7(s.textContent));
        if (before.length) p.append(document2.createTextNode(`${before.join(" ")} `));
        p.append(strong);
        if (after.length) p.append(document2.createTextNode(` ${after.join(" ")}`));
        const extra = clean7(tile.querySelector(".amounts-container .additional-prizes") && tile.querySelector(".amounts-container .additional-prizes").textContent);
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
      title = clean7(a && a.getAttribute("title"));
      image = imageCellFrom(document2, tile.querySelector("img") || tile.querySelector(".buy-tickets__wrapper__container__bg"), title);
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      if (a) body.push(linkParagraph2(document2, absolutize7(a.getAttribute("href")), clean7(tile.querySelector(".buy-tickets__wrapper__container__purchase") && tile.querySelector(".buy-tickets__wrapper__container__purchase").textContent) || "Buy Now", true));
    } else if (tile.matches("div.game-tile")) {
      title = clean7(tile.querySelector(".casino-game-title") && tile.querySelector(".casino-game-title").textContent);
      image = imageCellFrom(document2, tile.querySelector(".casino-game"), title);
      const info = tile.querySelector("a.casino-info-button[href]");
      if (title) {
        const h3 = document2.createElement("h3");
        if (info) {
          const a = document2.createElement("a");
          a.href = absolutize7(info.getAttribute("href"));
          a.textContent = title;
          h3.append(a);
        } else {
          h3.textContent = title;
        }
        body.push(h3);
      }
    } else {
      const titleEl = tile.querySelector(".game-title, .scratch-name");
      title = clean7(titleEl && titleEl.textContent);
      image = imageCellFrom(document2, tile.querySelector(".game-tile-header, .game-image"), title);
      if (title) {
        const h3 = document2.createElement("h3");
        h3.textContent = title;
        body.push(h3);
      }
      const prizeEl = tile.querySelector(".game-prize:not(.hidden), .top-prize-gametile");
      const prize = clean7(prizeEl && [...prizeEl.childNodes].map((n) => n.textContent).join(" ").replace(/\s*-\s*/g, " - "));
      const range = prize.replace(/(\$[\d.,]+)\s+(\$[\d.,]+)/, "$1 - $2").replace(/\s*-\s*\$NaN\b/g, "").replace(/^(\$[\d.,]+) - \1$/, "$1");
      if (range) body.push(textParagraph(document2, range));
      const descEl = tile.querySelector(".description, .game-description");
      if (descEl) {
        const descClone = descEl.cloneNode(true);
        descClone.querySelectorAll("a").forEach((a) => a.remove());
        const desc = clean7(descClone.textContent);
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
      if (!href || href === "#" || !clean7(node.textContent)) return document2.createTextNode(clean7(node.textContent));
      out = document2.createElement("a");
      out.href = absolutize7(href);
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
      if (clean7(p.textContent)) {
        p.normalize();
        if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, "");
        if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, "");
        out.push(p);
      }
    };
    [...root.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (clean7(child.textContent)) line.push(child);
        return;
      }
      if (child.nodeType !== 1 || child.matches(EXTRA_SKIP) || child.matches(LOBBY_TILE)) return;
      if (INLINE_TAGS.test(child.tagName) && !child.querySelector(LOBBY_TILE)) {
        line.push(child);
        return;
      }
      flush();
      if (/^H[1-6]$/.test(child.tagName)) {
        if (clean7(child.textContent)) {
          const h = document2.createElement(child.tagName.toLowerCase());
          h.textContent = clean7(child.textContent);
          out.push(h);
        }
        return;
      }
      if (!clean7(child.textContent)) return;
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
  function parse7(element, { document: document2 }) {
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
      const src = imgEl ? imgEl.getAttribute("src") : bgUrl2(imageContainer);
      const titleEl = content.querySelector("h3.game-tile-title, .game-tile-title, h3, h2");
      const title = clean7(titleEl && titleEl.textContent);
      if (src) {
        const img = document2.createElement("img");
        img.src = absolutize7(src);
        img.alt = imgEl && imgEl.getAttribute("alt") || title;
        imageCell.push(img);
      }
      const prizeBar = imageContainer && imageContainer.querySelector(".prize-bar");
      const left = clean7(prizeBar && prizeBar.textContent);
      if (left) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        const subEl = prizeBar.querySelector("sub");
        const subText = clean7(subEl && subEl.textContent);
        if (subText) {
          const amount = clean7([...prizeBar.childNodes].filter((n) => n !== subEl).map((n) => n.textContent).join(" "));
          if (amount) strong.append(document2.createTextNode(`${amount} `));
          const sub = document2.createElement("sub");
          sub.textContent = subText;
          strong.append(sub);
        } else {
          strong.textContent = left;
        }
        p.append(strong);
        const rightEl = imageContainer.querySelector(".max-plus-bar, .gold-ball-bar, .prize-bar-right");
        const joinParts = (el) => clean7([...el.childNodes].map((n) => n.textContent).join(" "));
        let right = clean7(rightEl && [...rightEl.querySelectorAll("span")].map((s) => s.textContent).join(" "));
        if (rightEl && !/^\+/.test(right)) {
          const full = joinParts(rightEl);
          if (/^\+/.test(full) || !right) right = full;
        }
        right = clean7(right.replace(/\s*×\s*/g, " \xD7 ").replace(/^\+\s*/, "+ "));
        if (rightEl && rightEl.classList.contains("max-plus-bar") && right && !/^\+/.test(right)) {
          const attrCount = (rightEl.getAttribute("data-count") || rightEl.getAttribute("data-max-plus") || tile.getAttribute("data-max-plus") || "").trim();
          const prizeText = clean7(rightEl.querySelector(".prize-text") && rightEl.querySelector(".prize-text").textContent) || right;
          const amountMatch = prizeText.match(/\$[\d,]+/);
          let count = /^\d+$/.test(attrCount) ? attrCount : "";
          if (!count && amountMatch) {
            const re = new RegExp(`(\\d+)\\s*[x\xD7]\\s*\\${amountMatch[0]}`, "i");
            const scopes = [tile.textContent, document2.body && document2.body.textContent || ""];
            scopes.some((t) => {
              const m = clean7(t).match(re);
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
          if (clean7(p.textContent)) body.push(p);
        });
      } else {
        const desc = content.querySelector(".game-tile-description");
        if (desc && clean7(desc.textContent)) {
          const p = document2.createElement("p");
          p.append(...desc.childNodes);
          body.push(p);
        }
      }
      [...content.querySelectorAll("p")].filter((p) => !p.closest(".game-tile-description")).forEach((p) => {
        const text = clean7(p.textContent);
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
        a.textContent = clean7(cta.textContent) || cta.getAttribute("title") || "Learn more";
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

  // tools/importer/parsers/embed.js
  var ORIGIN8 = "https://www.alc.ca";
  function clean8(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolutize8(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|data:)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN8}${v}`;
    return v;
  }
  function canonicalVideoUrl(src) {
    const url = absolutize8(src);
    const yt = url.match(/youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/([^?&/#]+)/i) || url.match(/youtube\.com\/watch\?(?:.*&)?v=([^&#]+)/i) || url.match(/youtu\.be\/([^?&/#]+)/i);
    if (yt) {
      const start = url.match(/[?&](?:start|t)=(\d+)/);
      return `https://www.youtube.com/watch?v=${yt[1]}${start ? `&t=${start[1]}` : ""}`;
    }
    const vm = url.match(/player\.vimeo\.com\/video\/(\d+)(?:\?(?:.*&)?h=([\da-f]+))?/i) || url.match(/vimeo\.com\/(\d+)(?:\/([\da-f]+))?/i);
    if (vm) return `https://vimeo.com/${vm[1]}${vm[2] ? `/${vm[2]}` : ""}`;
    return url;
  }
  function captionContent(element) {
    const out = [];
    element.querySelectorAll(".cmp-embed__rte").forEach((rte) => {
      rte.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absolutize8(a.getAttribute("href"))));
      rte.querySelectorAll("[style], [class]").forEach((el) => {
        el.removeAttribute("style");
        el.removeAttribute("class");
      });
      [...rte.children].forEach((child) => {
        if (!clean8(child.textContent) && !child.querySelector("img")) return;
        out.push(child);
      });
    });
    return out;
  }
  function parse8(element, { document: document2 }) {
    const captions = captionContent(element);
    const iframe = element.querySelector("iframe[src], iframe[data-src]");
    let href = "";
    let title = "";
    if (iframe) {
      href = canonicalVideoUrl(iframe.getAttribute("src") || iframe.getAttribute("data-src"));
      title = clean8(iframe.getAttribute("title"));
    } else {
      const a = [...element.querySelectorAll("a[href]")].find((l) => /youtu|vimeo/i.test(l.getAttribute("href")));
      if (a) {
        href = canonicalVideoUrl(a.getAttribute("href"));
        title = clean8(a.textContent);
      }
    }
    if (!href) {
      element.replaceWith(...captions);
      return;
    }
    const content = [];
    const posterEl = [...element.querySelectorAll("img[src]:not(iframe img)")].find((i) => !i.closest(".cmp-embed__rte"));
    if (posterEl) {
      const img = document2.createElement("img");
      img.src = absolutize8(posterEl.getAttribute("src"));
      img.alt = posterEl.getAttribute("alt") || "";
      content.push(img);
    }
    const link = document2.createElement("a");
    link.href = href;
    link.textContent = title && !/^(youtube|vimeo)( video)?$/i.test(title) ? title : href;
    content.push(link);
    const cells = [[content]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "embed", cells });
    element.replaceWith(block, ...captions);
  }

  // tools/importer/parsers/table.js
  var ORIGIN9 = "https://www.alc.ca";
  function clean9(text) {
    return (text || "").replace(/[​-‍﻿]/g, "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolutize9(url) {
    if (!url) return "";
    const v = url.trim();
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(v)) return v;
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN9}${v}`;
    return v;
  }
  function isBoldOnly(cell) {
    const text = clean9(cell.textContent);
    if (!text) return true;
    const bold = [...cell.querySelectorAll("b, strong, h1, h2, h3, h4, h5, h6")].map((b) => clean9(b.textContent)).join(" ");
    return clean9(bold) === text;
  }
  function cellContent(document2, cell, isHeader) {
    const frag = document2.createElement("div");
    frag.append(...[...cell.childNodes].map((n) => n.cloneNode(true)));
    frag.querySelectorAll("[style], [class], [width], [height], [bgcolor], [align]").forEach((el) => {
      ["style", "class", "width", "height", "bgcolor", "align"].forEach((a) => el.removeAttribute(a));
    });
    frag.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absolutize9(a.getAttribute("href"))));
    frag.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src) img.setAttribute("src", absolutize9(src));
    });
    if (isHeader) {
      frag.querySelectorAll("b, strong").forEach((b) => b.replaceWith(...b.childNodes));
    }
    frag.querySelectorAll("p").forEach((p) => {
      if (!clean9(p.textContent) && !p.querySelector("img, a")) p.remove();
    });
    while (frag.lastChild && (frag.lastChild.nodeName === "BR" || frag.lastChild.nodeType === 3 && !frag.lastChild.textContent.trim())) {
      frag.lastChild.remove();
    }
    if (!clean9(frag.textContent) && !frag.querySelector("img")) return "";
    const nodes = [...frag.childNodes];
    nodes.forEach((n) => {
      if (n.nodeType === 3) n.textContent = n.textContent.replace(/ /g, " ").replace(/\s+/g, " ");
    });
    return nodes;
  }
  function parse9(element, { document: document2 }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) return;
    const rows = [...table.rows].filter((tr) => tr.closest("table") === table);
    if (!rows.length) {
      element.remove();
      return;
    }
    const headIdx = (() => {
      const first = rows[0];
      const cells2 = [...first.cells];
      if (first.parentElement && first.parentElement.tagName === "THEAD") return 0;
      if (cells2.length && cells2.every((c) => c.tagName === "TH")) return 0;
      if (rows.length > 1 && cells2.length > 1 && cells2.every((c) => isBoldOnly(c)) && cells2.some((c) => clean9(c.textContent)) && !first.querySelector("img")) return 0;
      return -1;
    })();
    const width = Math.max(...rows.map((tr) => [...tr.cells].reduce((n, c) => n + (parseInt(c.getAttribute("colspan"), 10) || 1), 0)));
    const cells = [];
    rows.forEach((tr, i) => {
      const row = [];
      [...tr.cells].forEach((c) => {
        row.push(cellContent(document2, c, i === headIdx));
        const span = parseInt(c.getAttribute("colspan"), 10) || 1;
        for (let s = 1; s < span; s += 1) row.push("");
      });
      while (row.length < width) row.push("");
      if (row.every((c) => c === "")) return;
      cells.push(row);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "table",
      variants: headIdx === 0 ? [] : ["no-header"],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-promo.js
  var ORIGIN10 = "https://www.alc.ca";
  function absolutize10(url) {
    if (!url) return "";
    const v = url.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN10}${v}`;
    return v;
  }
  function bgUrl3(el) {
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
    return bgUrl3(bgEl);
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
      const url = new URL(href, ORIGIN10);
      const seg = url.pathname.split("/").filter(Boolean).pop() || "";
      const name = seg.replace(/\.html$/, "").replace(/^lottomax$/i, "lotto max").replace(/[-_]+/g, " ").trim();
      if (!name) return "";
      return name.replace(/\b\w/g, (c) => c.toUpperCase());
    } catch (e) {
      return "";
    }
  }
  function parse10(element, { document: document2 }) {
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
        img.src = absolutize10(src);
        img.alt = label;
        imgCell.push(img);
        let mobileSrc = absolutize10(mobileImageUrl(slide));
        if (!/\/imageM\.img\./.test(mobileSrc)) {
          const derived = img.src.replace(/\/image[DT]\.img\./, "/imageM.img.");
          if (derived !== img.src) mobileSrc = derived;
        }
        if (mobileSrc && mobileSrc !== img.src) {
          const mImg = document2.createElement("img");
          mImg.src = mobileSrc;
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

  // tools/importer/transformers/alc-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ORIGIN11 = "https://www.alc.ca";
  var ALC_HOSTS = ["www.alc.ca", "alc.ca"];
  function absolutizeUrl(value) {
    if (!value) return value;
    const v = value.trim();
    if (v.startsWith("//")) return `https:${v}`;
    if (v.startsWith("/")) return `${ORIGIN11}${v}`;
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
      url = new URL(raw, ORIGIN11);
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
      return `${ORIGIN11}${path}${url.search}${url.hash || ""}`;
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
      const { pathname } = new URL(url, ORIGIN11);
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

  // tools/importer/transformers/alc-content-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTION_STYLES = /* @__PURE__ */ new WeakMap();
  var IGNORE_SELECTOR = [
    "script",
    "noscript",
    "style",
    "link",
    "meta",
    "iframe",
    "title",
    "header",
    "footer",
    "nav",
    '[role="banner"]',
    "div.xfpage",
    "#loginFlow",
    ".logged-in-info-wrapper",
    ".topnav",
    "#nav-mobile",
    "#collapsible-promo",
    "div.experiencefragment",
    ".cmp-experiencefragment--header",
    ".cmp-experiencefragment--footer",
    ".common-modals",
    ".modal-xf",
    ".cmp-modal",
    ".alc-modal",
    ".modal",
    ".modal-browser-check",
    ".cmp-page__skiptomaincontent",
    "#ZN_3Eu2u7P45FmpwJ5",
    'section[data-bind="if: message"]',
    ".alert-area",
    ".notification.section",
    ".cmp-notification",
    "section#page-breadcrumb",
    ".breadcrumb-container",
    ".breadcrumb",
    ".cmp-breadcrumb",
    ".livechat",
    ".alc-livechat",
    "#cxone-guide-container",
    "#stcpDiv",
    ".alc-mobile-banner",
    "div.banner.section",
    ".separator",
    "hr"
  ].join(", ");
  var HERO_SELECTOR = ".alc-container.cmp-container--pw-content-hero-padding, .alc-container.cmp-container--pw-landing-hero-padding, div.hero";
  var XF_SECTION_SELECTOR = "section.experiencefragment, .cmp-experiencefragment--gambling-helplines";
  var LEAF_SELECTOR = [
    HERO_SELECTOR,
    XF_SECTION_SELECTOR,
    ".online-corporate-detail > .body-content",
    ".text",
    ".title",
    ".teaser",
    ".image",
    ".tabs",
    ".accordion",
    ".embed",
    ".table",
    ".cmp-tabs",
    ".cmp-accordion",
    "table",
    "ul",
    "ol",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
  ].join(", ");
  function normText2(el) {
    return (el ? el.textContent : "").replace(/[\s ​-‍﻿]+/g, " ").trim();
  }
  function isTicketDetailPage2(root) {
    return !!root.querySelector("div.game-detail-scratch");
  }
  function isVideoLotteryPage2(root) {
    return !!root.querySelector("div.video-lottery-info-page");
  }
  function isGameDetailPage2(root) {
    return !isVideoLotteryPage2(root) && !!root.querySelector("section.alc-game-details-header, div.digital-instants-info-page");
  }
  function isContentPage2(root, payload) {
    const template = payload && payload.template;
    if (!template || template.name !== "content-page") return false;
    return !isTicketDetailPage2(root) && !isVideoLotteryPage2(root) && !isGameDetailPage2(root);
  }
  function hasMedia(el) {
    return !!el.querySelector('img, picture, video, iframe, table, [style*="url"]') || el.matches && el.matches("img, picture, video, iframe, table");
  }
  function contentText(el) {
    let text = normText2(el);
    if (!text) return "";
    el.querySelectorAll(IGNORE_SELECTOR).forEach((x) => {
      const t = normText2(x);
      if (t) text = text.replace(t, "");
    });
    return text.trim();
  }
  function isMeaningful(el) {
    if (el.nodeType !== 1 || el.matches(IGNORE_SELECTOR)) return false;
    if (el.matches(".aem-GridColumn--default--hide")) return false;
    return !!contentText(el) || hasMedia(el);
  }
  function meaningfulChildren(el) {
    return [...el.children].filter(isMeaningful);
  }
  function isAlcContainer(el) {
    return el.matches(".alc-container");
  }
  function containerItems(el) {
    const inner = el.querySelector(":scope > .cmp-container > .aem-Grid") || el.querySelector(":scope > .cmp-container") || el;
    return meaningfulChildren(inner);
  }
  function ownBackground(el) {
    const holders = [el, el.querySelector(":scope > .cmp-container")].filter(Boolean);
    for (const h of holders) {
      const style = h.getAttribute("style") || "";
      const m = style.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))/i);
      if (m) return m[1];
    }
    return "";
  }
  function parseColor(value) {
    if (!value) return null;
    let v = value.trim().toLowerCase();
    if (v.startsWith("#")) {
      v = v.slice(1);
      if (v.length === 3 || v.length === 4) v = v.split("").map((c) => c + c).join("");
      const a = v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1;
      return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16), a };
    }
    const m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === void 0 ? 1 : +m[4] };
  }
  function backgroundStyle(value) {
    const c = parseColor(value);
    if (!c || c.a < 0.6) return "";
    const min = Math.min(c.r, c.g, c.b);
    const max = Math.max(c.r, c.g, c.b);
    if (min < 216 || min >= 253) return "";
    if (c.b - c.r >= 6 && c.b >= c.g) return "light-blue";
    if (max - min <= 5) return "light-grey";
    return "";
  }
  function isWrapperContainer(el) {
    return isAlcContainer(el) && !el.matches(HERO_SELECTOR) && !backgroundStyle(ownBackground(el)) && !ownBackground(el);
  }
  function shouldExpand(el, siblings) {
    if (!isWrapperContainer(el)) return false;
    if (el.querySelector(":scope > #skip-to-main-content")) return true;
    const items = containerItems(el);
    if (!items.length) return false;
    if (siblings === 1) return true;
    return el.matches("main, section") && items.some((i) => isAlcContainer(i) || i.matches(HERO_SELECTOR));
  }
  function expand(items) {
    const out = [];
    items.forEach((item) => {
      if (shouldExpand(item, items.length)) {
        out.push(...expand(containerItems(item)));
      } else {
        out.push(item);
      }
    });
    return out;
  }
  function topLevelItems(main) {
    const aemRoot = main.querySelector(":scope > .root.responsivegrid > .aem-Grid");
    let items = aemRoot ? meaningfulChildren(aemRoot) : meaningfulChildren(main);
    let guard = 0;
    while (items.length === 1 && guard < 12 && !items[0].matches(LEAF_SELECTOR)) {
      const el = items[0];
      const next = isAlcContainer(el) ? containerItems(el) : meaningfulChildren(el);
      if (!next.length || isAlcContainer(el) && !shouldExpand(el, 1)) break;
      items = next;
      guard += 1;
    }
    return expand(items);
  }
  function isSectionStarter(el) {
    return isAlcContainer(el) || el.matches(HERO_SELECTOR) || el.matches(XF_SECTION_SELECTOR) || !el.matches(".text, .title, .teaser, .image, .tabs, .accordion, .embed, .table, .alc-button, .button, .dynamic-cta, .reference, .html-promo") && !el.matches('[class*="aem-GridColumn"]');
  }
  function isLooseHeadingOnly(group) {
    return group.items.every((i) => i.matches(".title, .text") && !i.querySelector("img, table, ul, ol"));
  }
  function buildSections(items) {
    const sections = [];
    let current = null;
    items.forEach((item) => {
      const starter = isSectionStarter(item);
      const hero = item.matches(HERO_SELECTOR);
      const styled = !!backgroundStyle(ownBackground(item)) || item.matches(XF_SECTION_SELECTOR);
      if (!starter) {
        if (!current || current.closed) {
          current = { items: [], start: item, loose: true };
          sections.push(current);
        }
        current.items.push(item);
        return;
      }
      if (!hero && !styled && current && !current.closed && current.loose && isLooseHeadingOnly(current)) {
        current.items.push(item);
        current.closed = true;
        return;
      }
      current = { items: [item], start: item, closed: true, hero };
      sections.push(current);
    });
    return sections;
  }
  function isCentered(el) {
    if (!el) return false;
    for (let p = el; p; p = p.parentElement) {
      const cls = p.getAttribute && p.getAttribute("class") || "";
      const style = p.getAttribute && p.getAttribute("style") || "";
      if (/text-align\s*:\s*center/i.test(style)) return true;
      if (/(^|\s)(cmp-title--text-center|text-center|alc-txt-center|center-block|cmp-text--desktop-alignment-center|cmp-container--desktop-align-center|cmp-teaser--text-center)(\s|$)/.test(cls)) return true;
      if (/(^|\s)(cmp-title--text-left|text-left|alc-txt-left)(\s|$)/.test(cls)) return false;
      if (p.matches && p.matches(".alc-container, section, body")) break;
    }
    return false;
  }
  function sectionStyle(section) {
    if (section.hero) return "";
    const styles = [];
    const first = section.items[0];
    const bg = first.matches(XF_SECTION_SELECTOR) ? "light-grey" : backgroundStyle(ownBackground(first));
    if (bg) styles.push(bg);
    const headingSel = "h1, h2, h3, h4, h5, h6";
    let heading = null;
    let intro = null;
    for (const item of section.items) {
      const candidates = item.matches(headingSel) ? [item] : [...item.querySelectorAll(headingSel)];
      heading = candidates.find((h) => normText2(h) && !h.closest(".cmp-teaser, .cmp-tabs, .cmp-accordion, .panel-group, table"));
      if (heading) break;
    }
    if (!heading) {
      for (const item of section.items) {
        const candidates = item.matches("p") ? [item] : [...item.querySelectorAll("p")];
        intro = candidates.find((p) => normText2(p) && !p.closest(".cmp-teaser, .cmp-tabs, .cmp-accordion, .panel-group, table"));
        if (intro) break;
      }
    }
    const probe = heading || intro;
    if (probe) {
      const holder = probe.closest(".title, .text") || probe;
      if (isCentered(probe) || isCentered(holder)) styles.push("centered");
    }
    return styles.join(", ");
  }
  function transform2(hookName, element, payload) {
    if (!isContentPage2(element, payload) && !SECTION_STYLES.has(element)) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      const sections = buildSections(topLevelItems(element));
      const styles = {};
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const style = sectionStyle(section);
        if (i === 0 && !style) continue;
        const hr = doc.createElement("hr");
        if (style) {
          const id = `content-${i}`;
          hr.setAttribute(SECTION_MARKER_ATTR, id);
          styles[id] = { style, first: i === 0 };
        }
        section.start.before(hr);
      }
      SECTION_STYLES.set(element, styles);
    }
    if (hookName === "afterTransform") {
      const styles = SECTION_STYLES.get(element) || {};
      SECTION_STYLES.delete(element);
      element.querySelectorAll(`hr[${SECTION_MARKER_ATTR}]`).forEach((marker) => {
        const id = marker.getAttribute(SECTION_MARKER_ATTR);
        const entry = styles[id];
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (!entry) return;
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: entry.style }
        });
        marker.after(metadataBlock);
        if (entry.first) marker.remove();
      });
      let first = element.firstElementChild;
      while (first && first.tagName !== "HR" && !first.textContent.trim() && !first.querySelector("img, picture, table, hr")) {
        first = first.nextElementSibling;
      }
      if (first && first.tagName === "HR") first.remove();
    }
  }

  // tools/importer/import-content-page.js
  var parsers = {
    "hero-banner": parse,
    "cards-feature": parse2,
    "columns-media": parse3,
    "columns-contact": parse4,
    "accordion-bar": parse5,
    "tabs-boxed": parse6,
    "cards-game": parse7,
    "embed": parse8,
    "table": parse9,
    "carousel-promo": parse10
  };
  var PAGE_TEMPLATE = {
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
          '.aem-Grid:not(.cmp-tabs *, .cmp-accordion *, .alc-modal *, .modal *):has(> .teaser.cmp-teaser--tile, > .teaser.cmp-teaser--vertical-wide, > .teaser.cmp-teaser--vertical-square, > .teaser.cmp-teaser--card, > .teaser.cmp-teaser--tile-button, > .teaser.cmp-teaser--icon-left, > .information-card, > .teaser[class*="aem-GridColumn--default--"]:not(.aem-GridColumn--default--12, .cmp-teaser--horizontal-left, .cmp-teaser--horizontal-right, .cmp-teaser--quiz, .cmp-teaser--rewards) + .teaser[class*="aem-GridColumn--default--"]:not(.aem-GridColumn--default--12, .cmp-teaser--horizontal-left, .cmp-teaser--horizontal-right, .cmp-teaser--quiz, .cmp-teaser--rewards))'
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
  var transformers = [
    transform,
    transform2
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
  var import_content_page_default = {
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
  return __toCommonJS(import_content_page_exports);
})();
