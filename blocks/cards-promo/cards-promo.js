import { createOptimizedPicture } from '../../scripts/aem.js';

// source swaps its portrait desktop/tablet crops for the landscape mobile crop below 768px
const MOBILE_MEDIA = '(max-width: 767px)';

/**
 * Builds one <picture> per promo: the desktop image (first authored picture) by default and,
 * when a second (mobile) picture is authored, its sources for viewports below 768px.
 * @param {HTMLImageElement} desktopImg
 * @param {HTMLImageElement} [mobileImg]
 * @returns {HTMLPictureElement}
 */
function buildPromoPicture(desktopImg, mobileImg) {
  const picture = createOptimizedPicture(desktopImg.src, desktopImg.alt, false, [{ width: '750' }]);
  if (!mobileImg) return picture;

  const mobile = createOptimizedPicture(mobileImg.src, mobileImg.alt || desktopImg.alt, false, [{ width: '750' }]);
  const mobileSources = [...mobile.querySelectorAll('source')];
  const mobileFallback = mobile.querySelector('img');
  if (mobileFallback) {
    const source = document.createElement('source');
    source.setAttribute('srcset', mobileFallback.getAttribute('src'));
    mobileSources.push(source);
  }
  mobileSources.forEach((source) => source.setAttribute('media', MOBILE_MEDIA));
  picture.prepend(...mobileSources);
  return picture;
}

/**
 * One row per promo: cell 1 = promo image(s) (desktop, then optional mobile),
 * cell 2 = link to the destination.
 * The whole image becomes the link (link text / image alt used as accessible name).
 * Rows without an image keep their authored content.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-promo-card';

    const images = [...row.querySelectorAll('img')];
    const link = row.querySelector('a[href]');

    if (!images.length) {
      const body = document.createElement('div');
      body.className = 'cards-promo-card-body';
      [...row.children].forEach((cell) => body.append(...cell.childNodes));
      li.append(body);
      ul.append(li);
      return;
    }

    const [img, mobileImg] = images;
    const optimized = buildPromoPicture(img, mobileImg);

    const media = document.createElement('div');
    media.className = 'cards-promo-card-image';

    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      if (link.title) anchor.title = link.title;
      if (link.target) anchor.target = link.target;
      const label = img.alt || link.textContent.trim();
      if (label) anchor.setAttribute('aria-label', label);
      anchor.append(optimized);
      media.append(anchor);
    } else {
      media.append(optimized);
    }

    li.append(media);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
