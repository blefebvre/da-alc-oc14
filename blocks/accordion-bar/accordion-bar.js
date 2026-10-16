/**
 * Accordion bar: one row per item, cell 1 = label, cell 2 = rich-text body.
 * Each item becomes a native <details>/<summary>, collapsed by default.
 * Rows without a label are skipped; a missing body cell yields an empty panel.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const items = [];

  rows.forEach((row) => {
    const [labelCell, bodyCell] = [...row.children];
    const label = labelCell?.textContent.trim();
    if (!label) return;

    const details = document.createElement('details');
    details.className = 'accordion-bar-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-bar-label';
    const text = document.createElement('span');
    text.textContent = label;
    summary.append(text);

    const body = document.createElement('div');
    body.className = 'accordion-bar-body';
    if (bodyCell) body.append(...bodyCell.childNodes);

    details.append(summary, body);
    items.push(details);
  });

  block.replaceChildren(...items);
}
