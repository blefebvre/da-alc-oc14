let tabsId = 0;

function activate(block, index, focus = false) {
  const tabs = [...block.querySelectorAll('.tabs-boxed-tab')];
  const panels = [...block.querySelectorAll('.tabs-boxed-panel')];
  tabs.forEach((tab, idx) => {
    const active = idx === index;
    tab.setAttribute('aria-selected', active);
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  panels.forEach((panel, idx) => {
    panel.hidden = idx !== index;
  });
}

/**
 * Boxed tabs: one row per tab, cell 1 = tab label, cell 2 = panel content.
 * Rows with an empty label are skipped; a missing panel cell yields an empty panel.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  tabsId += 1;
  const id = tabsId;
  const rows = [...block.querySelectorAll(':scope > div')];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-boxed-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-boxed-panels';

  rows.forEach((row) => {
    const [labelCell, panelCell] = [...row.children];
    const label = labelCell?.textContent.trim();
    if (!label) return;
    const idx = tablist.children.length;
    const tabId = `tabs-boxed-${id}-tab-${idx}`;
    const panelId = `tabs-boxed-${id}-panel-${idx}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-boxed-tab';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.textContent = label;
    tab.addEventListener('click', () => activate(block, idx));
    tablist.append(tab);

    const panel = document.createElement('div');
    panel.className = 'tabs-boxed-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.tabIndex = 0;
    if (panelCell) panel.append(...panelCell.childNodes);
    panels.append(panel);
  });

  if (!tablist.children.length) return;

  tablist.addEventListener('keydown', (e) => {
    const count = tablist.children.length;
    const current = [...tablist.children].findIndex((t) => t.getAttribute('aria-selected') === 'true');
    let next = null;
    if (e.key === 'ArrowRight') next = (current + 1) % count;
    if (e.key === 'ArrowLeft') next = (current - 1 + count) % count;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = count - 1;
    if (next !== null) {
      e.preventDefault();
      activate(block, next, true);
    }
  });

  block.replaceChildren(tablist, panels);
  activate(block, 0);
}
