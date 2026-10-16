import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hides a failed image's container; collapses the whole block when nothing else is left.
 * @param {HTMLImageElement} img
 * @param {HTMLElement} target element to remove when the image fails
 * @param {HTMLElement} block
 */
function removeOnError(img, target, block) {
  const fail = () => {
    target.remove();
    if (!block.querySelector('img, a[href]')) {
      const wrapper = block.closest('.hero-game-wrapper') || block;
      wrapper.hidden = true;
    }
  };
  if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  else img.addEventListener('error', fail, { once: true });
}

/**
 * Game detail banner: a full-bleed banner image (row 1) plus either
 * - a CTA bar (online games, row 2 = links): bold links are already `a.button.primary`
 *   (decorateButtons in scripts.js), remaining plain links become secondary chevron links; or
 * - a game logo (video lottery, row 2 = a picture and no links), centred over the banner.
 * Authors may omit either row, or put the CTAs in the same row as the image.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const img = block.querySelector('img');
  const bgRow = img ? rows.find((row) => row.contains(img)) : null;

  // video lottery: an image-only row after the banner holds the game logo
  const logoRow = rows.find((row) => row !== bgRow
    && row.querySelector('img')
    && !row.querySelector('a[href]'));
  const logoImg = logoRow?.querySelector('img');
  const logoPicture = logoImg?.closest('picture') || logoImg;

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

  let logo;
  if (logoPicture) {
    logo = document.createElement('div');
    logo.className = 'hero-game-logo';
    logo.append(logoPicture);
    media.append(logo);
    block.classList.add('hero-game-has-logo');
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

  // broken banner/logo URLs (some alc.ca teasers 404): drop the image rather than show alt text
  if (logo) removeOnError(logoImg, logo, block);
  const bgImg = media.querySelector(':scope > picture > img');
  if (bgImg) removeOnError(bgImg, media, block);
}
