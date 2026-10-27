import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Page-title banner.
 * Row 1: background image (optional). Row 2: H1 + optional subtitle (optional).
 * Works with image-only, heading-only, or both in a single row.
 * @param {Element} block
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const media = document.createElement('div');
  media.className = 'hero-banner-media';
  const content = document.createElement('div');
  content.className = 'hero-banner-content';

  if (picture) {
    const img = picture.querySelector('img');
    let pic = picture;
    if (img) {
      const url = new URL(img.src, window.location.href);
      if (url.origin === window.location.origin && !/\.svg$/i.test(url.pathname)) {
        pic = createOptimizedPicture(img.src, img.alt || '', true, [{ media: '(min-width: 768px)', width: '2000' }, { width: '750' }]);
        const optimizedImg = pic.querySelector('img');
        if (optimizedImg) optimizedImg.setAttribute('fetchpriority', 'high');
      } else {
        img.loading = 'eager';
      }
    }
    // remove the original picture and its wrapping <p> when it held nothing else
    const parent = picture.parentElement;
    picture.remove();
    if (parent && parent.tagName === 'P' && !parent.textContent.trim() && !parent.children.length) parent.remove();
    media.append(pic);
  }

  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const nodes = [...cell.childNodes]
      .filter((n) => n.nodeType === Node.ELEMENT_NODE || n.textContent.trim());
    content.append(...nodes);
  });

  block.replaceChildren();
  if (media.children.length) block.append(media);
  else block.classList.add('no-image');
  if (content.children.length || content.textContent.trim()) block.append(content);
}
