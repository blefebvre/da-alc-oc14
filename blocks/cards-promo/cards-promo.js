import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * One row per promo: cell 1 = promo image, cell 2 = link to the destination.
 * The whole image becomes the link (link text / image alt used as accessible name).
 * Rows without an image keep their authored content.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-promo-card';

    const picture = row.querySelector('picture');
    const link = row.querySelector('a[href]');

    if (!picture) {
      const body = document.createElement('div');
      body.className = 'cards-promo-card-body';
      [...row.children].forEach((cell) => body.append(...cell.childNodes));
      li.append(body);
      ul.append(li);
      return;
    }

    const img = picture.querySelector('img');
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);

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
