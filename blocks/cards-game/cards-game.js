import { createOptimizedPicture } from '../../scripts/aem.js';

const BADGE_PATTERN = /^new!?$/i;

function isLinkOnly(el) {
  const links = el.querySelectorAll('a');
  return links.length === 1 && !el.querySelector('picture')
    && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Image cell = a cell holding a picture, optionally followed by a jackpot strip paragraph
 * (e.g. "**$90,000,000 est.** *+ 90 × $100,000*").
 */
function isImageCell(cell) {
  if (!cell.querySelector('picture')) return false;
  return !cell.querySelector('h1, h2, h3, h4, h5, h6, a');
}

function decorateImageCell(cell) {
  cell.className = 'cards-game-card-image';
  [...cell.children].forEach((el) => {
    if (!el.querySelector('picture') && el.textContent.trim()) {
      el.className = 'cards-game-jackpot';
    }
  });
}

/**
 * Decorates the text cell of a game tile:
 * - heading -> title
 * - a short "New" paragraph -> badge (returned so it can sit on the image)
 * - the last link-only paragraph -> CTA button
 * - anything else stays in order as description / draw info
 */
function decorateBody(body) {
  body.className = 'cards-game-card-body';
  let badge = null;

  [...body.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      el.classList.add('cards-game-title');
    } else if (!badge && BADGE_PATTERN.test(el.textContent.trim()) && !el.querySelector('a, picture')) {
      badge = el;
      badge.className = 'cards-game-badge';
      badge.remove();
    }
  });

  const linkOnly = [...body.children].filter((el) => isLinkOnly(el));
  const ctaParagraph = linkOnly[linkOnly.length - 1];
  if (ctaParagraph) {
    ctaParagraph.classList.add('cards-game-cta');
    const link = ctaParagraph.querySelector('a');
    link.classList.add('cards-game-cta-link');
    // CTA always sits at the bottom of the tile
    body.append(ctaParagraph);
  }

  return badge;
}

/**
 * Mobile (< 768px) swipe carousel controls, matching alc.ca: prev/next buttons + one dot per tile.
 * The list itself is a CSS scroll-snap track; controls are hidden by CSS on wider screens.
 */
function decorateControls(block, ul) {
  const cards = [...ul.children];
  const controls = document.createElement('div');
  controls.className = 'cards-game-controls';

  const makeButton = (className, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    return button;
  };

  const prev = makeButton('cards-game-prev', 'Previous game');
  const next = makeButton('cards-game-next', 'Next game');
  const dots = document.createElement('div');
  dots.className = 'cards-game-dots';
  cards.forEach((card, i) => {
    const dot = makeButton('cards-game-dot', `Show game ${i + 1} of ${cards.length}`);
    dot.dataset.index = i;
    dots.append(dot);
  });
  controls.append(prev, next, dots);
  block.append(controls);

  const currentIndex = () => Math.round(ul.scrollLeft / (ul.clientWidth || 1));
  const goTo = (i) => {
    const index = Math.max(0, Math.min(cards.length - 1, i));
    ul.scrollTo({ left: index * ul.clientWidth, behavior: 'smooth' });
  };
  const update = () => {
    const active = currentIndex();
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === active);
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  controls.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button === prev) goTo(currentIndex() - 1);
    else if (button === next) goTo(currentIndex() + 1);
    else goTo(Number(button.dataset.index));
  });
  ul.addEventListener('scroll', update, { passive: true });
  update();
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-game-card';
    const cells = [...row.children];
    let imageCell = null;
    let body = null;

    cells.forEach((cell) => {
      if (!imageCell && isImageCell(cell)) {
        imageCell = cell;
        decorateImageCell(imageCell);
      } else if (!body) {
        body = cell;
      } else {
        // extra cells: merge into the body so authored content is not lost
        body.append(...cell.childNodes);
      }
    });

    if (imageCell) li.append(imageCell);
    if (body) {
      const badge = decorateBody(body);
      if (badge) {
        if (imageCell) imageCell.append(badge);
        else body.prepend(badge);
        li.classList.add('cards-game-card-new');
      }
      li.append(body);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
  if (ul.children.length > 1) decorateControls(block, ul);
}
