import { normalizeFragment } from '../../scripts/fragment-utils.js';

/*
 * Header block
 *
 * Content comes from the nav fragment (nav.plain.html). Top-level sections, in order:
 *   0 brand    – logo link
 *   1 search   – one link: href = search results page, text = input placeholder
 *   2 tools    – utility links; a "#id" link opens the header dialog with that id
 *   3 sections – primary nav list; an item with nested lists becomes a megamenu:
 *                first nested list = card grid, second nested list = side rail
 *   4 mobile   – optional section starting with a list: a plain-text item labels the
 *                menu toggle, links are shown in the mobile bar only
 *   then       – sign-in dialog columns; the last dialog section is the dialog footer
 * Copy, links and images stay in the fragment; this file only adds controls,
 * layout hooks and behaviour.
 */

const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Turns text into a class-safe slug.
 * @param {string} text input
 * @returns {string} slug
 */
function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Slug for a link, derived from its last path segment or hash.
 * @param {HTMLAnchorElement} a link
 * @returns {string} slug
 */
function linkSlug(a) {
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#')) return slugify(href.slice(1));
  const url = new URL(href, window.location.href);
  const segment = url.pathname.split('/').filter(Boolean).pop() || 'home';
  return slugify(segment.replace(/\.html$/, ''));
}

/**
 * Creates an element.
 * @param {string} tag tag name
 * @param {Object} attrs attributes (className handled specially)
 * @param  {...(Node|string)} children children
 * @returns {HTMLElement} element
 */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') node.className = value;
    else if (value != null && value !== false) node.setAttribute(key, value);
  });
  node.append(...children);
  return node;
}

/**
 * Removes whitespace-only text nodes directly inside an element.
 * @param {Element} parent element
 */
function stripWhitespace(parent) {
  [...parent.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
  });
}

/**
 * Fetches the nav fragment.
 * @returns {Promise<DocumentFragment|null>} parsed fragment
 */
async function fetchNav() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const template = document.createElement('template');
  template.innerHTML = await resp.text();
  // DA/EDS-served fragments wrap images in <picture> and list links in <p>, with media URLs
  // relative to the fragment: normalise back to the authored structure
  normalizeFragment(template.content, resp.url);
  template.content.querySelectorAll('img[src]').forEach((img) => img.setAttribute('loading', 'lazy'));
  return template.content;
}

/* ---------------------------------------------------------------- megamenu */

/**
 * Closes every open megamenu except the given trigger.
 * @param {Element} nav nav element
 * @param {Element} [except] trigger to keep
 */
function closeMegamenus(nav, except) {
  nav.querySelectorAll('.nav-trigger[aria-expanded="true"]').forEach((trigger) => {
    if (trigger !== except) trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Decorates a card grid list (logo link + optional CTA per item).
 * @param {HTMLUListElement} list card list
 */
function decorateCards(list) {
  list.className = 'nav-cards';
  [...list.children].forEach((li) => {
    stripWhitespace(li);
    li.className = 'nav-card';
    li.querySelectorAll('a').forEach((a) => {
      if (a.querySelector('img')) {
        a.className = 'nav-card-media';
        const img = a.querySelector('img');
        if (!a.title && img.alt) a.title = img.alt;
        return;
      }
      const strong = a.parentElement.tagName === 'STRONG' ? a.parentElement : null;
      if (strong) {
        strong.replaceWith(a);
        a.className = 'button nav-card-button';
      } else {
        a.className = 'nav-card-link';
      }
    });
    if (!li.querySelector('.nav-card-button, .nav-card-link')) li.classList.add('nav-card-promo');
    // compact text link used by the mobile accordion (label = card image alt)
    const media = li.querySelector('.nav-card-media');
    const alt = media?.querySelector('img')?.alt;
    if (media && alt) {
      li.append(el('a', { href: media.getAttribute('href'), className: 'nav-card-text' }, alt));
    }
  });
}

/**
 * Decorates a side rail list (heading item, links, optional background image).
 * @param {HTMLUListElement} list rail list
 * @returns {HTMLElement} rail container
 */
function decorateRail(list) {
  const rail = el('div', { className: 'nav-rail' });
  list.className = 'nav-rail-list';
  [...list.children].forEach((li) => {
    const link = li.querySelector('a');
    const img = li.querySelector('img');
    if (!link && img) {
      // decorative rail artwork: painted as a background, like the source
      rail.style.setProperty('--nav-rail-bg', `url("${img.getAttribute('src')}")`);
      rail.classList.add('nav-rail-has-bg');
      li.remove();
    } else if (!link) {
      li.className = 'nav-rail-heading';
    } else {
      li.className = 'nav-rail-item';
    }
  });
  rail.prepend(list);
  return rail;
}

/**
 * Decorates the primary nav list.
 * @param {Element} section nav sections wrapper
 * @param {Element} nav nav element
 */
function decorateSections(section, nav) {
  const list = section.querySelector('ul');
  if (!list) return;
  list.className = 'nav-list';
  [...list.children].forEach((li, index) => {
    li.className = 'nav-item';
    const sublists = li.querySelectorAll(':scope > ul');
    const link = li.querySelector(':scope > a');
    if (!sublists.length || !link) return;

    li.classList.add('nav-drop');
    const panelId = `nav-panel-${index + 1}`;
    const trigger = el('button', {
      type: 'button',
      className: 'nav-trigger',
      'aria-expanded': 'false',
      'aria-controls': panelId,
      'data-href': link.getAttribute('href'),
    }, link.textContent.trim());
    link.replaceWith(trigger);

    const panel = el('div', { className: 'nav-dropdown', id: panelId });
    const [cards, rail] = sublists;
    decorateCards(cards);
    panel.append(cards);
    if (rail) panel.append(decorateRail(rail));
    stripWhitespace(li);
    li.append(panel);

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const open = trigger.getAttribute('aria-expanded') === 'true';
      closeMegamenus(nav, trigger);
      trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
}

/* ------------------------------------------------------------------ dialog */

/**
 * Builds a form field from a fragment list item.
 * Rules: item with only <em> = checkbox; text + <em> = secret field with
 * show/hide toggle (first <em> = show label, second = hide label); text = text field.
 * @param {HTMLLIElement} li list item
 * @param {string} prefix id prefix
 * @returns {HTMLElement} field wrapper
 */
function buildField(li, prefix) {
  const ems = [...li.querySelectorAll('em')];
  const toggleLabels = ems.map((em) => em.textContent.trim());
  ems.forEach((em) => em.remove());
  const text = li.textContent.trim();
  if (!text && toggleLabels.length) {
    const id = `${prefix}-${slugify(toggleLabels[0])}`;
    return el(
      'div',
      { className: 'nav-field nav-field-checkbox' },
      el('input', { type: 'checkbox', id, name: slugify(toggleLabels[0]) }),
      el('label', { for: id }, toggleLabels[0]),
    );
  }
  const id = `${prefix}-${slugify(text)}`;
  const input = el('input', {
    type: toggleLabels.length ? 'password' : 'text',
    id,
    name: slugify(text),
    placeholder: text,
    required: '',
    autocomplete: toggleLabels.length ? 'current-password' : 'username',
  });
  const labelRow = el('div', { className: 'nav-field-label' }, el('label', { for: id }, text));
  if (toggleLabels.length) {
    const [showLabel, hideLabel = showLabel] = toggleLabels;
    const toggle = el('button', {
      type: 'button', className: 'nav-field-reveal', 'aria-controls': id, 'aria-pressed': 'false',
    }, showLabel);
    toggle.addEventListener('click', () => {
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      toggle.textContent = reveal ? hideLabel : showLabel;
      toggle.setAttribute('aria-pressed', String(reveal));
    });
    labelRow.append(toggle);
  }
  return el('div', { className: 'nav-field' }, labelRow, input);
}

/**
 * Builds the form column of the dialog.
 * @param {Element} section fragment section
 * @param {string} prefix id prefix
 * @returns {HTMLElement} column
 */
function buildFormColumn(section, prefix) {
  const col = el('div', { className: 'nav-dialog-col nav-dialog-form' });
  const form = el('form', { className: 'nav-form', novalidate: '' });
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      child.id = child.id || `${prefix}-title`;
      col.append(child);
    } else if (child.tagName === 'OL') {
      [...child.children].forEach((li) => form.append(buildField(li, prefix)));
    } else if (child.tagName === 'P' && child.children.length === 1 && child.firstElementChild.tagName === 'STRONG' && child.textContent.trim() === child.firstElementChild.textContent.trim()) {
      form.append(el('button', { type: 'submit', className: 'button nav-form-submit' }, child.textContent.trim()));
    } else if (child.tagName === 'UL') {
      child.className = 'nav-dialog-links';
      form.append(child);
    } else {
      child.classList.add('nav-dialog-note');
      form.append(child);
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reportValidity();
  });
  col.append(form);
  return col;
}

/**
 * Builds the header dialog from the fragment sections that follow the nav list.
 * @param {Element[]} sections fragment sections
 * @param {string} id dialog id
 * @returns {HTMLDialogElement} dialog
 */
function buildDialog(sections, id) {
  const dialog = el('dialog', { className: 'nav-dialog', id: `nav-dialog-${id}` });
  const body = el('div', { className: 'nav-dialog-body' });
  const [formSection, ...rest] = sections;
  const footerSection = rest.length > 1 ? rest.pop() : null;
  body.append(buildFormColumn(formSection, `nav-${id}`));
  rest.forEach((section) => {
    const col = el('div', { className: 'nav-dialog-col nav-dialog-aside' });
    col.append(...section.childNodes);
    col.querySelectorAll('p > a:only-child').forEach((a) => {
      a.className = 'button secondary';
      a.parentElement.className = 'button-wrapper';
    });
    body.append(col);
  });
  const close = el('button', { type: 'button', className: 'nav-dialog-close', 'aria-label': 'Close' });
  close.addEventListener('click', () => dialog.close());
  dialog.append(close, body);
  if (footerSection) {
    const footer = el('div', { className: 'nav-dialog-footer' });
    footer.append(...footerSection.childNodes);
    footer.querySelectorAll('a').forEach((a) => a.classList.add(`nav-link-${linkSlug(a)}`));
    dialog.append(footer);
  }
  const title = dialog.querySelector('h1, h2, h3, h4, h5, h6');
  if (title) dialog.setAttribute('aria-labelledby', title.id || (title.id = `nav-${id}-title`));
  // close when the backdrop (the dialog box itself, outside its content) is clicked
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return dialog;
}

/* ------------------------------------------------------------------- tools */

/**
 * Builds the search form from the search section.
 * @param {Element} section fragment section
 * @returns {HTMLElement} search wrapper
 */
function buildSearch(section) {
  const link = section.querySelector('a');
  const wrapper = el('div', { className: 'nav-search' });
  if (!link) return wrapper;
  const placeholder = link.textContent.trim();
  const form = el('form', { action: link.getAttribute('href'), method: 'get', role: 'search' });
  form.append(
    el('input', {
      type: 'text', name: 'q', placeholder, 'aria-label': placeholder, maxlength: '2048', autocomplete: 'off',
    }),
    el('button', { type: 'submit', className: 'nav-search-submit', 'aria-label': 'Search' }),
  );
  wrapper.append(form);
  return wrapper;
}

/**
 * Decorates the tools list; hash links become dialog openers.
 * @param {Element} section fragment section
 * @param {HTMLDialogElement|null} dialog header dialog
 * @returns {HTMLElement} tools wrapper
 */
function buildTools(section, dialog) {
  const wrapper = el('div', { className: 'nav-tools' });
  const account = el('div', { className: 'nav-account' });
  const list = section.querySelector('ul');
  if (!list) return { wrapper, account };
  [...list.children].forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const slug = linkSlug(a);
    li.className = `nav-tool nav-tool-${slug}`;
    a.setAttribute('aria-label', a.textContent.trim());
    if (a.getAttribute('href').startsWith('#') && dialog) {
      const button = el('button', {
        type: 'button',
        className: `nav-account-button nav-tool-${slug}`,
        'aria-haspopup': 'dialog',
        'aria-controls': dialog.id,
      }, el('span', { className: 'nav-account-label' }, a.textContent.trim()));
      button.addEventListener('click', () => dialog.showModal());
      account.append(button);
      li.remove();
    }
  });
  list.className = 'nav-tools-list';
  wrapper.append(list);
  return { wrapper, account };
}

/* ------------------------------------------------------------------ mobile */

/**
 * Opens or closes the mobile menu.
 * @param {Element} nav nav element
 * @param {boolean} [force] desired state
 */
function toggleMenu(nav, force) {
  const button = nav.querySelector('.nav-hamburger button');
  const expanded = force !== undefined ? force : button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  nav.classList.toggle('is-menu-open', expanded);
  document.body.classList.toggle('header-menu-open', expanded);
  document.body.style.overflowY = expanded && !isDesktop.matches ? 'hidden' : '';
}

/**
 * Clones a tools entry (wrapper keeps its slug class for styling).
 * @param {Element} tools tools wrapper
 * @param {string} slug tool slug
 * @returns {HTMLElement|null} cloned entry
 */
function cloneTool(tools, slug) {
  const link = tools.querySelector(`.nav-tool-${slug} a`);
  return link ? el('span', { className: `nav-tool nav-tool-${slug}` }, link.cloneNode(true)) : null;
}

/**
 * Builds the mobile drawer around the nav sections.
 * @param {Object} parts header parts
 * @returns {HTMLElement} drawer
 */
function buildDrawer({
  navSections, searchSection, tools, account, dialog,
}) {
  const drawer = el('div', { className: 'nav-drawer', id: 'nav-drawer' });
  const drawerAccount = el('div', { className: 'nav-drawer-account' });
  const register = cloneTool(tools, 'register-account');
  if (register) drawerAccount.append(register);
  const accountButton = account.querySelector('.nav-account-button');
  if (accountButton && dialog) {
    const button = accountButton.cloneNode(true);
    button.addEventListener('click', () => dialog.showModal());
    drawerAccount.append(button);
  }
  const drawerLinks = el('div', { className: 'nav-drawer-links' });
  [...tools.querySelectorAll('.nav-tool')]
    .filter((li) => !li.matches('.nav-tool-register-account, .nav-tool-cart'))
    .forEach((li) => {
      const slug = [...li.classList].find((c) => c.startsWith('nav-tool-')).slice(9);
      drawerLinks.append(cloneTool(tools, slug));
    });
  const search = searchSection ? buildSearch(searchSection) : null;
  if (search) search.className = 'nav-drawer-search';
  drawer.append(drawerAccount, navSections);
  if (search) drawer.append(search);
  drawer.append(drawerLinks);
  return drawer;
}

/**
 * Resets interactive state when crossing the desktop breakpoint.
 * @param {Element} nav nav element
 */
function resetState(nav) {
  closeMegamenus(nav);
  toggleMenu(nav, false);
}

/* ---------------------------------------------------------------- decorate */

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  const sections = [...fragment.children].filter((child) => child.tagName === 'DIV');
  const [brandSection, searchSection, toolsSection, navSection, ...rest] = sections;
  const mobileSection = rest[0]?.firstElementChild?.tagName === 'UL' ? rest.shift() : null;
  const dialogSections = rest;

  block.textContent = '';
  const nav = el('nav', { id: 'nav', 'aria-label': 'Main navigation' });

  // dialog (sign in) from trailing sections
  const hashLink = toolsSection?.querySelector('a[href^="#"]');
  const dialog = hashLink && dialogSections.length
    ? buildDialog(dialogSections, slugify(hashLink.getAttribute('href').slice(1)))
    : null;

  // row 0: brand, search, tools, account
  const top = el('div', { className: 'nav-top' });
  const mobileItems = mobileSection ? [...mobileSection.querySelectorAll('li')] : [];
  const menuLabel = mobileItems.find((li) => !li.querySelector('a'))?.textContent.trim();
  const hamburger = el('div', { className: 'nav-hamburger' }, el(
    'button',
    {
      type: 'button', 'aria-controls': 'nav-drawer', 'aria-expanded': 'false', 'aria-label': 'Open navigation',
    },
    el(
      'span',
      { className: 'nav-hamburger-icon' },
      el('span', { className: 'nav-hamburger-bar' }),
      el('span', { className: 'nav-hamburger-bar' }),
      el('span', { className: 'nav-hamburger-bar' }),
    ),
    menuLabel ? el('span', { className: 'nav-hamburger-label' }, menuLabel) : '',
  ));
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));
  const mobileLinks = el('div', { className: 'nav-mobile-links' });
  mobileItems.forEach((li) => {
    const a = li.querySelector('a');
    if (a) mobileLinks.append(a);
  });

  const brand = el('div', { className: 'nav-brand' });
  if (brandSection) brand.append(...brandSection.childNodes);
  brand.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'eager'));

  const search = searchSection ? buildSearch(searchSection) : el('div', { className: 'nav-search' });
  const { wrapper: tools, account } = toolsSection
    ? buildTools(toolsSection, dialog)
    : { wrapper: el('div'), account: el('div') };
  top.append(hamburger, brand, mobileLinks, search, tools, account);

  // row 1: primary nav
  const navSections = el('div', { className: 'nav-sections' });
  if (navSection) {
    navSections.append(...navSection.childNodes);
    decorateSections(navSections, nav);
  }

  const drawer = buildDrawer({
    navSections, searchSection, tools, account, dialog,
  });
  nav.append(top, drawer);
  document.body.classList.add('header-push');
  const navWrapper = el('div', { className: 'nav-wrapper' }, nav);
  block.append(navWrapper);
  if (dialog) block.append(dialog);

  // close megamenus on outside click and Escape
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !e.target.closest('.nav-drop')) closeMegamenus(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('.nav-trigger[aria-expanded="true"]');
    if (open) {
      closeMegamenus(nav);
      open.focus();
    } else if (nav.classList.contains('is-menu-open')) {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });

  // viewport resize: reset menus when crossing the breakpoint
  isDesktop.addEventListener('change', () => resetState(nav));
}
