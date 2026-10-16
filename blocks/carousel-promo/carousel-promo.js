import { createOptimizedPicture } from '../../scripts/aem.js';

const LABELS = {
  roleDescription: 'Carousel',
  controls: 'Carousel Slide Controls',
  previous: 'Previous Slide',
  next: 'Next Slide',
  showSlide: 'Show Slide',
  of: 'of',
};

const AUTOPLAY_INTERVAL = 6000;
let carouselId = 0;

function getSlides(block) {
  return [...block.querySelectorAll('.carousel-promo-slide')];
}

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;
  getSlides(block).forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((link) => {
      if (active) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-promo-indicator button').forEach((button, idx) => {
    if (idx === slideIndex) {
      button.setAttribute('aria-current', 'true');
      button.disabled = true;
    } else {
      button.removeAttribute('aria-current');
      button.disabled = false;
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = getSlides(block);
  if (!slides.length) return;
  let index = slideIndex;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  block.querySelector('.carousel-promo-slides').scrollTo({
    top: 0,
    left: slides[index].offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, index);
}

function currentIndex(block) {
  return parseInt(block.dataset.activeSlide || '0', 10);
}

function startAutoplay(block) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let timer;
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    timer = setInterval(() => showSlide(block, currentIndex(block) + 1), AUTOPLAY_INTERVAL);
  };
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);
  start();
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-promo-indicator button').forEach((button, idx) => {
    button.addEventListener('click', () => showSlide(block, idx));
  });
  block.querySelector('.carousel-promo-prev').addEventListener('click', () => showSlide(block, currentIndex(block) - 1));
  block.querySelector('.carousel-promo-next').addEventListener('click', () => showSlide(block, currentIndex(block) + 1));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.6 });
  getSlides(block).forEach((slide) => observer.observe(slide));
}

const MOBILE_MEDIA = '(max-width: 767px)';

/**
 * Builds a single responsive <picture> for a slide: the desktop image from 768px up and,
 * when authored, the mobile crop below 768px.
 * @param {HTMLImageElement} desktopImg first authored image (desktop crop)
 * @param {HTMLImageElement} [mobileImg] optional second authored image (mobile crop)
 * @param {boolean} eager whether this is the first (LCP) slide
 * @returns {HTMLPictureElement}
 */
function buildSlidePicture(desktopImg, mobileImg, eager) {
  const picture = createOptimizedPicture(
    desktopImg.src,
    desktopImg.alt,
    eager,
    [{ media: '(min-width: 768px)', width: '2000' }, { width: '900' }],
  );

  if (mobileImg && mobileImg.src) {
    const mobile = createOptimizedPicture(mobileImg.src, mobileImg.alt, eager, [{ width: '750' }]);
    const mobileSources = [...mobile.querySelectorAll('source')];
    const mobileFallback = mobile.querySelector('img');
    if (mobileFallback) {
      const source = document.createElement('source');
      source.setAttribute('srcset', mobileFallback.getAttribute('src'));
      mobileSources.push(source);
    }
    mobileSources.forEach((source) => source.setAttribute('media', MOBILE_MEDIA));
    picture.prepend(...mobileSources);
  }

  const img = picture.querySelector('img');
  if (eager) img.setAttribute('fetchpriority', 'high');
  return picture;
}

/**
 * Builds one slide from an authored row.
 * Cell 1: desktop image, optionally followed by a mobile image (either may be linked).
 * Cell 2 (optional): a link to the destination, used to wrap the image when the image
 * is not linked itself.
 */
function createSlide(row, slideIndex, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-promo-slide';
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-promo-${id}-slide-${slideIndex}`;

  const images = [...row.querySelectorAll('img')];
  const img = images[0];
  if (!img) {
    // No image: keep any authored content so nothing is lost.
    const content = document.createElement('div');
    content.className = 'carousel-promo-slide-content';
    [...row.children].forEach((cell) => content.append(...cell.childNodes));
    slide.append(content);
    return slide;
  }

  const optimized = buildSlidePicture(img, images[1], slideIndex === 0);

  let link = img.closest('a');
  if (!link) {
    const links = [...row.querySelectorAll('a[href]')];
    if (links.length) {
      link = document.createElement('a');
      link.href = links[0].href;
      if (links[0].title) link.title = links[0].title;
      const label = img.alt || links[0].textContent.trim();
      if (label) link.setAttribute('aria-label', label);
    }
  }

  const media = document.createElement('div');
  media.className = 'carousel-promo-slide-image';
  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    if (link.title) anchor.title = link.title;
    if (link.getAttribute('aria-label')) anchor.setAttribute('aria-label', link.getAttribute('aria-label'));
    anchor.append(optimized);
    media.append(anchor);
  } else {
    media.append(optimized);
  }
  slide.append(media);
  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  block.id = `carousel-promo-${id}`;
  const rows = [...block.querySelectorAll(':scope > div')];

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', LABELS.roleDescription);

  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'carousel-promo-slides-container';
  const slidesList = document.createElement('ul');
  slidesList.className = 'carousel-promo-slides';
  slidesContainer.append(slidesList);

  rows.forEach((row, idx) => slidesList.append(createSlide(row, idx, id)));

  block.replaceChildren(slidesContainer);

  if (rows.length < 2) {
    block.classList.add('carousel-promo-single');
    return;
  }

  const controls = document.createElement('div');
  controls.className = 'carousel-promo-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-promo-prev';
  prev.setAttribute('aria-label', LABELS.previous);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-promo-next';
  next.setAttribute('aria-label', LABELS.next);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', LABELS.controls);
  const indicators = document.createElement('ol');
  indicators.className = 'carousel-promo-indicators';
  rows.forEach((_, idx) => {
    const li = document.createElement('li');
    li.className = 'carousel-promo-indicator';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${LABELS.showSlide} ${idx + 1} ${LABELS.of} ${rows.length}`);
    li.append(button);
    indicators.append(li);
  });
  nav.append(indicators);

  controls.append(prev, nav, next);
  block.append(controls);

  updateActiveSlide(block, 0);
  bindEvents(block);
  startAutoplay(block);
}
