import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * One row per item: an image cell and a text cell, in authored order
 * (image-first renders image left, text-first renders image right). Stacks on mobile
 * with the image on top. Rows with a single cell render full width.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    const cells = [...row.children];
    if (cells.length < 2) row.classList.add('columns-media-single');

    cells.forEach((cell, index) => {
      const pics = cell.querySelectorAll('picture');
      if (pics.length === 1 && !cell.textContent.trim()) {
        cell.classList.add('columns-media-image');
        if (index > 0) row.classList.add('columns-media-image-right');
      } else {
        cell.classList.add('columns-media-text');
        cell.querySelectorAll('p').forEach((p) => {
          if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
        });
      }
    });
  });

  block.querySelectorAll('.columns-media-image picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}
