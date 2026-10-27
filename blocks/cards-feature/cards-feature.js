import { createOptimizedPicture } from '../../scripts/aem.js';

// images narrower than this (intrinsic px) are treated as icons, not full-width photos
const ICON_MAX_WIDTH = 160;

function optimize(picture) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return picture;
  const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
  ['width', 'height'].forEach((attr) => {
    const value = img.getAttribute(attr);
    const optImg = optimized.querySelector('img');
    if (value && optImg) optImg.setAttribute(attr, value);
  });
  return optimized;
}

function markIconOrPhoto(card, img) {
  const apply = (width) => {
    card.classList.toggle('cards-feature-card-icon', width > 0 && width <= ICON_MAX_WIDTH);
  };
  const attrWidth = parseInt(img.getAttribute('width'), 10);
  if (attrWidth) apply(attrWidth);
  else if (/\.svg$/i.test(new URL(img.src, window.location.href).pathname)) apply(1);
  if (img.complete && img.naturalWidth) apply(img.naturalWidth);
  else img.addEventListener('load', () => apply(img.naturalWidth), { once: true });
}

/**
 * One row per card: cell 1 = optional image (icon or photo), cell 2 = H3 + text + optional link.
 * Cells may be omitted or merged; a cell holding only a picture becomes the card image.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-feature-card';
    const body = document.createElement('div');
    body.className = 'cards-feature-card-body';
    let imageCell;

    [...row.children].forEach((cell) => {
      const pics = cell.querySelectorAll('picture');
      const onlyPicture = pics.length === 1 && !cell.textContent.trim();
      if (onlyPicture && !imageCell) {
        imageCell = document.createElement('div');
        imageCell.className = 'cards-feature-card-image';
        imageCell.append(optimize(pics[0]));
      } else {
        body.append(...cell.childNodes);
      }
    });

    if (imageCell) {
      li.append(imageCell);
      const img = imageCell.querySelector('img');
      if (img) markIconOrPhoto(li, img);
    }
    // drop empty paragraphs (e.g. &nbsp; spacers from the source)
    body.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
    });
    if (body.childNodes.length) li.append(body);
    if (li.children.length) ul.append(li);
  });

  const count = ul.children.length;
  block.classList.add(`cards-feature-${Math.min(Math.max(count, 1), 4)}`);
  block.replaceChildren(ul);
}
