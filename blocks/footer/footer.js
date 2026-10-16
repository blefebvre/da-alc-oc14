import { normalizeFragment } from '../../scripts/fragment-utils.js';

/*
 * Footer block (content-first).
 *
 * All copy, links and images come from the footer fragment
 * (content/footer.plain.html locally, /footer.plain.html on DA/EDS).
 * This file only creates layout shells and form controls around that content.
 *
 * Fragment contract — top-level sections, in order:
 *  1. lead form:   <p> intro, <ul> field [label, placeholder, <a href=action>submit</a>],
 *                  <ul> confirmation [question, consent (may hold links), confirm, cancel, note]
 *  2. utility bar: one <p> per item (text link, icon links, or a badge image)
 *  3. link columns: every following section with a heading + <ul> of links
 *  4. then, in order: logo links (heading + linked images), legal (<ul> + <p>s), marks (images)
 */

const MOBILE_QUERY = '(width < 1200px)';

/**
 * Fetches the footer fragment. Metadata-independent on purpose:
 * /content first (localhost / aem up), then the site root (DA/EDS production).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const root = document.createElement('div');
  root.innerHTML = await resp.text();
  // DA/EDS-served fragments wrap images in <picture> and list links in <p>, with media URLs
  // relative to the fragment: normalise back to the authored structure
  normalizeFragment(root, resp.url || '/footer.plain.html');
  root.querySelectorAll('img[src]').forEach((img) => { img.loading = 'lazy'; });
  return root;
}

/**
 * Creates an element with classes and attributes.
 * @param {string} tag
 * @param {object} [attrs]
 * @param {...(Node|string)} children
 */
function createEl(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') el.className = value;
    else if (value !== undefined && value !== null && value !== false) el.setAttribute(key, value);
  });
  el.append(...children);
  return el;
}

/** Moves all child nodes of `from` into a new element. */
function moveChildren(from, tag, attrs) {
  const el = createEl(tag, attrs);
  if (from) el.append(...from.childNodes);
  return el;
}

/** Opens every link inside `scope` in a new tab. */
function openInNewTab(scope) {
  scope.querySelectorAll('a[href]').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
}

function text(node) {
  return (node?.textContent || '').trim();
}

/**
 * Sends a subscription request to the form action (JSON body).
 * @returns {Promise<boolean>}
 */
async function postSubscription(action, email) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  const payload = {
    PlayerInformation: { Email: email, TermsOfServiceId: '', LocaleCode: `${lang}_CA` },
    Optin: { Channel: 1, Promotion: true, LargeDrawWin: true },
  };
  try {
    const resp = await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Builds the confirmation step of the lead form from the confirmation list.
 * @returns {{ panel: HTMLElement, open: Function, close: Function }}
 */
function buildConfirmPanel(list, uid, onConfirm) {
  const [questionLi, consentLi, confirmLi, cancelLi, noteLi] = list ? [...list.children] : [];
  const emailEcho = createEl('span', { className: 'footer-confirm-email' });
  const question = createEl('p', { className: 'footer-confirm-question' }, `${text(questionLi)} "`, emailEcho, '"?');

  const checkboxId = `${uid}-consent`;
  const checkbox = createEl('input', { type: 'checkbox', id: checkboxId, required: '' });
  const consentLabel = moveChildren(consentLi, 'label', { for: checkboxId });
  openInNewTab(consentLabel);
  const consent = createEl('p', { className: 'footer-confirm-consent' }, checkbox, consentLabel);

  const confirmBtn = createEl('button', { type: 'button', className: 'footer-confirm-submit', disabled: '' }, text(confirmLi));
  const cancelBtn = createEl('button', { type: 'button', className: 'footer-confirm-cancel' }, text(cancelLi));
  const actions = createEl('div', { className: 'footer-confirm-actions' }, confirmBtn, cancelBtn);

  const note = moveChildren(noteLi, 'p', { className: 'footer-confirm-note' });
  openInNewTab(note);

  const panel = createEl('div', {
    className: 'footer-confirm', role: 'dialog', 'aria-modal': 'false', 'aria-label': text(questionLi), hidden: '',
  }, question, consent, actions, note);

  const close = () => {
    panel.hidden = true;
    checkbox.checked = false;
    confirmBtn.disabled = true;
  };
  const open = (email) => {
    emailEcho.textContent = email;
    panel.hidden = false;
    checkbox.focus();
  };

  checkbox.addEventListener('change', () => { confirmBtn.disabled = !checkbox.checked; });
  cancelBtn.addEventListener('click', close);
  confirmBtn.addEventListener('click', async () => {
    if (!checkbox.checked) return;
    confirmBtn.disabled = true;
    await onConfirm();
    close();
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return { panel, open, close };
}

/**
 * Builds the lead-capture band (intro + email form + confirmation step).
 * @param {HTMLElement} section fragment section
 */
function buildLeadForm(section) {
  const intro = section.querySelector(':scope > p');
  const [fieldList, confirmList] = section.querySelectorAll(':scope > ul');
  const [labelLi, placeholderLi, submitLi] = fieldList ? [...fieldList.children] : [];
  const submitLink = submitLi?.querySelector('a');
  const uid = 'footer-subscribe';

  const label = createEl('label', { for: `${uid}-email`, className: 'footer-visually-hidden' }, text(labelLi));
  const input = createEl('input', {
    type: 'email', id: `${uid}-email`, name: 'email', autocomplete: 'email', required: '', placeholder: text(placeholderLi),
  });
  const submit = createEl('button', { type: 'submit', className: 'footer-subscribe-submit', disabled: '' }, text(submitLi));
  const group = createEl('div', { className: 'footer-subscribe-group' }, input, submit);
  const form = createEl('form', {
    className: 'footer-subscribe-form', action: submitLink?.href || '', method: 'post', novalidate: '',
  }, label, group);

  const isValid = () => input.value.trim() !== '' && input.checkValidity();
  const confirm = buildConfirmPanel(confirmList, uid, async () => {
    const ok = await postSubscription(form.action, input.value.trim());
    if (ok) {
      input.value = '';
      submit.disabled = true;
    }
  });
  form.append(confirm.panel);

  input.addEventListener('input', () => {
    submit.disabled = !isValid();
    if (!isValid()) confirm.close();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isValid()) {
      input.reportValidity();
      return;
    }
    confirm.open(input.value.trim());
  });

  const container = createEl('div', { className: 'footer-container' }, moveChildren(intro, 'p', { className: 'footer-subscribe-intro' }), form);
  return createEl('div', { className: 'footer-subscribe' }, container);
}

/**
 * Builds the utility bar (contact link, social icons, feedback link, badge).
 * @param {HTMLElement} section fragment section
 */
function buildUtilityBar(section) {
  const bar = createEl('div', { className: 'footer-bar' });
  let linkIndex = 0;
  [...section.children].forEach((item) => {
    const cell = moveChildren(item, 'p', { className: 'footer-bar-item' });
    const links = [...cell.querySelectorAll('a')];
    if (links.length && links.every((a) => a.querySelector('img'))) {
      cell.classList.add('footer-bar-social');
    } else if (!links.length && cell.querySelector('img')) {
      cell.classList.add('footer-bar-badge');
    } else if (links.length) {
      linkIndex += 1;
      cell.classList.add('footer-bar-link', `footer-bar-link-${linkIndex}`);
    }
    bar.append(cell);
  });
  return createEl('div', { className: 'footer-container footer-bar-wrap' }, bar);
}

/**
 * Builds one link column; the heading doubles as the accordion toggle on mobile.
 * @param {HTMLElement} section fragment section
 * @param {number} index
 */
function buildLinkColumn(section, index) {
  const column = createEl('div', { className: 'footer-column' });
  const panelId = `footer-column-panel-${index}`;
  const heading = section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
  const headingLink = heading?.querySelector('a');

  const toggle = createEl('button', {
    type: 'button', className: 'footer-column-toggle', 'aria-expanded': 'false', 'aria-controls': panelId,
  }, text(heading));
  heading.classList.add('footer-column-heading');
  column.append(heading, toggle);

  const panel = createEl('div', { className: 'footer-column-panel', id: panelId });
  [...section.children].forEach((child) => {
    if (child === heading) return;
    if (child.tagName === 'UL') child.classList.add('footer-column-links');
    else child.classList.add('footer-column-tagline');
    panel.append(child);
  });
  // landing-page link for the accordion (mobile only), cloned from the heading link
  if (headingLink) {
    const list = panel.querySelector('.footer-column-links');
    const overview = createEl('li', { className: 'footer-column-overview' }, headingLink.cloneNode(true));
    if (list) list.prepend(overview);
  }
  column.append(panel);
  return column;
}

/** Wires single-open accordion behaviour for the link columns (mobile only). */
function decorateAccordion(columns) {
  const mq = window.matchMedia(MOBILE_QUERY);
  const toggles = [...columns.querySelectorAll('.footer-column-toggle')];
  const setOpen = (toggle, open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.closest('.footer-column').classList.toggle('is-open', open);
  };
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
      toggles.forEach((t) => setOpen(t, false));
      setOpen(toggle, willOpen);
    });
  });
  mq.addEventListener('change', () => toggles.forEach((t) => setOpen(t, false)));
}

function buildLogoLinks(section) {
  const wrap = createEl('div', { className: 'footer-sites' });
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) child.classList.add('footer-sites-heading');
    else child.classList.add('footer-sites-logos');
    wrap.append(child);
  });
  openInNewTab(wrap);
  return wrap;
}

function buildLegal(section) {
  const legal = createEl('div', { className: 'footer-legal' });
  [...section.children].forEach((child) => {
    child.classList.add(child.tagName === 'UL' ? 'footer-legal-links' : 'footer-legal-text');
    legal.append(child);
  });
  return legal;
}

function buildMarks(section) {
  const marks = createEl('div', { className: 'footer-marks' });
  section.querySelectorAll('img').forEach((img) => marks.append(img));
  return marks;
}

const isLinkColumn = (section) => !!section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')
  && !!section.querySelector(':scope > ul a');

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  if (!fragment) return;
  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const [formSection, barSection, ...rest] = sections;

  const columnSections = rest.filter(isLinkColumn);
  const [logoSection, legalSection, marksSection] = rest.filter((s) => !isLinkColumn(s));

  const head = createEl('div', { className: 'footer-head' });
  if (formSection) head.append(buildLeadForm(formSection));
  if (barSection) head.append(buildUtilityBar(barSection));

  const main = createEl('div', { className: 'footer-main footer-container' });
  const columns = createEl('div', { className: 'footer-columns' });
  columnSections.forEach((section, i) => columns.append(buildLinkColumn(section, i)));
  decorateAccordion(columns);
  main.append(columns);
  if (logoSection) main.append(buildLogoLinks(logoSection));
  const bottom = createEl('div', { className: 'footer-bottom' });
  if (legalSection) bottom.append(buildLegal(legalSection));
  if (marksSection) bottom.append(buildMarks(marksSection));
  main.append(bottom);

  block.textContent = '';
  block.append(head, main);
}
