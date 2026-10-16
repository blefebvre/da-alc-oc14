import { createOptimizedPicture } from '../../scripts/aem.js';

const LABELS = {
  roleDescription: 'Carousel',
  thumbnails: 'Choose screenshot',
  previous: 'Previous screenshot',
  next: 'Next screenshot',
  show: 'Show screenshot',
  of: 'of',
};

let carouselId = 0;

function setActive(block, index, focusThumb = false) {
  const slides = [...block.querySelectorAll('.carousel-thumbnails-slide')];
  const thumbs = [...block.querySelectorAll('.carousel-thumbnails-thumb')];
  if (!slides.length) return;
  const i = Math.max(0, Math.min(index, slides.length - 1));
  block.dataset.activeSlide = i;

  slides.forEach((slide, idx) => {
    const active = idx === i;
    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', !active);
  });
  thumbs.forEach((thumb, idx) => {
    const active = idx === i;
    thumb.classList.toggle('active', active);
    if (active) thumb.setAttribute('aria-current', 'true');
    else thumb.removeAttribute('aria-current');
  });

  const prev = block.querySelector('.carousel-thumbnails-prev');
  const next = block.querySelector('.carousel-thumbnails-next');
  if (prev) prev.disabled = i === 0;
  if (next) next.disabled = i === slides.length - 1;

  const track = block.querySelector('.carousel-thumbnails-track');
  const thumb = thumbs[i];
  if (track && thumb) {
    // keep the active thumbnail inside the strip's padded area (clear of the chevrons)
    const item = thumb.parentElement;
    const inset = (parseFloat(getComputedStyle(track).paddingLeft) || 0)
      + (parseFloat(getComputedStyle(item).marginLeft) || 0);
    const trackRect = track.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.left - inset < trackRect.left) {
      track.scrollBy({ left: itemRect.left - inset - trackRect.left, behavior: 'smooth' });
    } else if (itemRect.right + inset > trackRect.right) {
      track.scrollBy({ left: itemRect.right + inset - trackRect.right, behavior: 'smooth' });
    }
    if (focusThumb) thumb.focus({ preventScroll: true });
  }
}

/**
 * Screenshot gallery: one image per authored row. Renders a large main image and a
 * thumbnail strip (built from the same images) with prev/next chevrons.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  const images = [...block.querySelectorAll(':scope > div img')];

  block.id = `carousel-thumbnails-${id}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', LABELS.roleDescription);

  if (!images.length) return;

  const main = document.createElement('ul');
  main.className = 'carousel-thumbnails-slides';

  images.forEach((img, idx) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-thumbnails-slide';
    slide.id = `carousel-thumbnails-${id}-slide-${idx}`;
    slide.append(createOptimizedPicture(img.src, img.alt || '', false, [
      { media: '(min-width: 768px)', width: '1200' },
      { width: '750' },
    ]));
    main.append(slide);
  });

  block.replaceChildren(main);

  if (images.length < 2) {
    block.classList.add('carousel-thumbnails-single');
    setActive(block, 0);
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'carousel-thumbnails-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-thumbnails-prev';
  prev.setAttribute('aria-label', LABELS.previous);
  prev.setAttribute('aria-controls', block.id);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-thumbnails-next';
  next.setAttribute('aria-label', LABELS.next);
  next.setAttribute('aria-controls', block.id);

  const track = document.createElement('ul');
  track.className = 'carousel-thumbnails-track';
  track.setAttribute('aria-label', LABELS.thumbnails);

  images.forEach((img, idx) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'carousel-thumbnails-thumb';
    button.setAttribute('aria-controls', `carousel-thumbnails-${id}-slide-${idx}`);
    button.setAttribute('aria-label', `${LABELS.show} ${idx + 1} ${LABELS.of} ${images.length}`);
    button.append(createOptimizedPicture(img.src, '', false, [{ width: '300' }]));
    button.addEventListener('click', () => setActive(block, idx));
    li.append(button);
    track.append(li);
  });

  const current = () => parseInt(block.dataset.activeSlide || '0', 10);
  prev.addEventListener('click', () => setActive(block, current() - 1));
  next.addEventListener('click', () => setActive(block, current() + 1));

  block.addEventListener('keydown', (e) => {
    if (!e.target.closest('.carousel-thumbnails-nav')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(block, current() - 1, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive(block, current() + 1, true); }
  });

  nav.append(prev, track, next);
  block.append(nav);
  setActive(block, 0);
}
