import { createOptimizedPicture } from '../../scripts/aem.js';

const LABELS = {
  roleDescription: 'Carousel',
  controls: 'Winner Slide Controls',
  previous: 'Previous Winner',
  next: 'Next Winner',
  showSlide: 'Show Winner',
  of: 'of',
};

let carouselId = 0;

function getSlides(block) {
  return [...block.querySelectorAll('.carousel-winners-slide')];
}

function currentIndex(block) {
  return parseInt(block.dataset.activeSlide || '0', 10);
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
  block.querySelectorAll('.carousel-winners-indicator button').forEach((button, idx) => {
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
  block.querySelector('.carousel-winners-slides').scrollTo({
    top: 0,
    left: slides[index].offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, index);
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-winners-indicator button').forEach((button, idx) => {
    button.addEventListener('click', () => showSlide(block, idx));
  });
  block.querySelector('.carousel-winners-prev').addEventListener('click', () => showSlide(block, currentIndex(block) - 1));
  block.querySelector('.carousel-winners-next').addEventListener('click', () => showSlide(block, currentIndex(block) + 1));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.6 });
  getSlides(block).forEach((slide) => observer.observe(slide));
}

function optimize(picture, width) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width }]);
  picture.replaceWith(optimized);
  return optimized;
}

/**
 * Renders a "$1,000,000"-style amount as separate digit-group boxes (as on the source).
 * The original text stays available to assistive tech.
 */
function decorateAmount(el) {
  const text = el.textContent.trim();
  const match = text.match(/^(\$)?\s*(\d{1,3}(?:[,\s]\d{3})*)$/);
  if (!match) return;
  const [, currency, digits] = match;
  const groups = digits.split(/[,\s]/);
  const visual = document.createElement('span');
  visual.className = 'carousel-winners-digits';
  visual.setAttribute('aria-hidden', 'true');
  groups.forEach((group, idx) => {
    const box = document.createElement('span');
    box.className = 'carousel-winners-digit-group';
    if (idx === 0 && currency) {
      const cur = document.createElement('span');
      cur.className = 'carousel-winners-currency';
      cur.textContent = currency;
      // the source renders a word space between the currency sign and the digits
      box.append(cur, ' ');
    }
    box.append(group);
    visual.append(box);
  });
  const sr = document.createElement('span');
  sr.className = 'carousel-winners-sr';
  sr.textContent = text;
  el.replaceChildren(visual, sr);
}

const PROVINCES = {
  NS: 'ns', NB: 'nb', NL: 'nl', PE: 'pe', PEI: 'pe',
};

function isLinkOnly(el) {
  const links = el.querySelectorAll('a');
  return links.length === 1 && !el.querySelector('picture')
    && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Splits the authored text cell into an info column (name, location, CTA)
 * and a prize column (game logo, "Winner" label, prize amount).
 * Elements before the first logo image are info; elements after it are prize details.
 * A link-only paragraph always goes to the info column as the CTA.
 */
function buildContent(cell) {
  const info = document.createElement('div');
  info.className = 'carousel-winners-info';
  const prize = document.createElement('div');
  prize.className = 'carousel-winners-prize';

  let seenLogo = false;
  const prizeText = [];
  [...cell.children].forEach((el) => {
    if (isLinkOnly(el)) {
      el.classList.add('carousel-winners-cta');
      el.querySelector('a').classList.add('button', 'primary');
      info.append(el);
      return;
    }
    const picture = el.querySelector('picture');
    if (picture) {
      seenLogo = true;
      el.classList.add('carousel-winners-logo');
      optimize(picture, '400');
      prize.append(el);
      return;
    }
    if (seenLogo) {
      prizeText.push(el);
      prize.append(el);
      return;
    }
    if (/^H[1-6]$/.test(el.tagName)) el.classList.add('carousel-winners-name');
    else if (!info.querySelector('.carousel-winners-location')) el.classList.add('carousel-winners-location');
    info.append(el);
  });

  if (prizeText.length) {
    const amount = prizeText[prizeText.length - 1];
    amount.classList.add('carousel-winners-amount');
    decorateAmount(amount);
    if (prizeText.length > 1) prizeText[0].classList.add('carousel-winners-label');
  }

  // keep the label next to the logo (ribbon), as in the source layout
  const logo = prize.querySelector('.carousel-winners-logo');
  const label = prize.querySelector('.carousel-winners-label');
  if (logo && label) {
    const head = document.createElement('div');
    head.className = 'carousel-winners-prize-head';
    logo.before(head);
    head.append(logo, label);
  }

  return { info, prize };
}

function createSlide(row, slideIndex, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-winners-slide';
  slide.dataset.slideIndex = slideIndex;
  slide.id = `carousel-winners-${id}-slide-${slideIndex}`;

  const cells = [...row.children];
  // photo cell = a cell holding only an image; every other cell is merged into the content
  const photoCell = cells.find((c) => c.children.length === 1 && c.querySelector(':scope > picture, :scope > p > picture'));
  const contentCells = cells.filter((c) => c !== photoCell);
  let contentCell = null;
  if (contentCells.length) {
    contentCell = document.createElement('div');
    contentCells.forEach((c) => contentCell.append(...c.children));
  }

  if (photoCell) {
    const photo = document.createElement('div');
    photo.className = 'carousel-winners-photo';
    const picture = photoCell.querySelector('picture');
    photo.append(picture);
    optimize(picture, '400');
    slide.append(photo);
  }

  if (contentCell) {
    const { info, prize } = buildContent(contentCell);
    if (info.children.length) slide.append(info);
    if (prize.children.length) slide.append(prize);
    // province code at the end of the location ("Halifax, NS") drives the decorative map
    const place = info.querySelector('.carousel-winners-location');
    const code = place && place.textContent.trim().match(/\b([A-Z]{2,3})$/);
    if (code && PROVINCES[code[1]]) slide.dataset.province = PROVINCES[code[1]];
    const name = info.querySelector('h1, h2, h3, h4, h5, h6');
    if (name) {
      if (!name.id) name.id = `${slide.id}-name`;
      slide.setAttribute('aria-labelledby', name.id);
    }
  }

  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  block.id = `carousel-winners-${id}`;
  const rows = [...block.querySelectorAll(':scope > div')];

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', LABELS.roleDescription);

  const container = document.createElement('div');
  container.className = 'carousel-winners-slides-container';
  const slidesList = document.createElement('ul');
  slidesList.className = 'carousel-winners-slides';
  rows.forEach((row, idx) => slidesList.append(createSlide(row, idx, id)));
  container.append(slidesList);
  block.replaceChildren(container);

  if (rows.length < 2) {
    block.classList.add('carousel-winners-single');
    return;
  }

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-winners-prev';
  prev.setAttribute('aria-label', LABELS.previous);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-winners-next';
  next.setAttribute('aria-label', LABELS.next);
  container.append(prev, next);

  const nav = document.createElement('nav');
  nav.className = 'carousel-winners-nav';
  nav.setAttribute('aria-label', LABELS.controls);
  const indicators = document.createElement('ol');
  indicators.className = 'carousel-winners-indicators';
  rows.forEach((_, idx) => {
    const li = document.createElement('li');
    li.className = 'carousel-winners-indicator';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${LABELS.showSlide} ${idx + 1} ${LABELS.of} ${rows.length}`);
    li.append(button);
    indicators.append(li);
  });
  nav.append(indicators);
  block.append(nav);

  updateActiveSlide(block, 0);
  bindEvents(block);
}
