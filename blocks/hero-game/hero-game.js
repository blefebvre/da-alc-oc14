import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Game detail banner: a full-bleed banner image (row 1) and a CTA bar (row 2).
 * Bold links are already turned into `a.button.primary` by decorateButtons in scripts.js;
 * any remaining plain links become secondary chevron text links.
 * Authors may omit either row, or put the CTAs in the same row as the image.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const img = block.querySelector('img');

  const media = document.createElement('div');
  media.className = 'hero-game-image';
  if (img) {
    const picture = createOptimizedPicture(img.src, img.alt || '', true, [
      { media: '(min-width: 768px)', width: '2000' },
      { width: '900' },
    ]);
    picture.querySelector('img').setAttribute('fetchpriority', 'high');
    media.append(picture);
  }

  const bar = document.createElement('div');
  bar.className = 'hero-game-cta';
  const inner = document.createElement('div');
  inner.className = 'hero-game-cta-inner';
  bar.append(inner);

  rows.forEach((row) => {
    [...row.querySelectorAll(':scope > div')].forEach((cell) => {
      [...cell.children].forEach((child) => {
        if (child.querySelector('img') || child.tagName === 'PICTURE' || child.tagName === 'IMG') return;
        if (!child.textContent.trim()) return;
        inner.append(child);
      });
    });
  });

  inner.querySelectorAll('a[href]').forEach((a) => {
    if (!a.classList.contains('button')) {
      a.classList.add('hero-game-link');
      a.closest('p')?.classList.add('hero-game-link-wrapper');
    }
  });

  const children = [];
  if (img) children.push(media);
  if (inner.children.length) children.push(bar);
  block.replaceChildren(...children);
  if (!img) block.classList.add('hero-game-no-image');
}
