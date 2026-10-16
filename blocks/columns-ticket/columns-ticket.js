import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Ticket details: one row, two cells.
 * Cell 1 = optional "Game #n" label paragraph + ticket image.
 * Cell 2 = info paragraphs (label in <strong>) + optional link paragraph.
 * Missing cells/paragraphs are tolerated.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const cells = rows.flatMap((row) => [...row.children]);
  // Image cell = first cell holding a picture/img; info cell = first other cell.
  const mediaCell = cells.find((c) => c.querySelector('picture, img'));
  const infoCell = cells.find((c) => c !== mediaCell);

  const wrapper = document.createElement('div');
  wrapper.className = 'columns-ticket-row';

  if (mediaCell) {
    mediaCell.className = 'columns-ticket-media';
    [...mediaCell.querySelectorAll('p')].forEach((p) => {
      if (!p.querySelector('picture, img') && p.textContent.trim()) {
        p.classList.add('columns-ticket-label');
      }
    });
    mediaCell.querySelectorAll('picture > img').forEach((img) => {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
      img.closest('picture').replaceWith(optimized);
    });
    const pic = mediaCell.querySelector('picture');
    if (pic) {
      const holder = pic.closest('p') || pic;
      holder.classList.add('columns-ticket-image');
    }
    wrapper.append(mediaCell);
  }

  if (infoCell) {
    infoCell.className = 'columns-ticket-info';
    [...infoCell.children].forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('img')) {
        el.remove();
        return;
      }
      const link = el.querySelector('a');
      if (link && el.textContent.trim() === link.textContent.trim()) {
        el.classList.add('columns-ticket-link');
        link.classList.remove('button');
        el.classList.remove('button-container');
      } else {
        el.classList.add('columns-ticket-item');
        const text = el.textContent.trim().toLowerCase();
        if (text.startsWith('top prize')) el.classList.add('columns-ticket-top-prize');
        if (text.startsWith('overall chance')) el.classList.add('columns-ticket-odds');
      }
    });
    wrapper.append(infoCell);
  }

  block.replaceChildren(wrapper);
}
