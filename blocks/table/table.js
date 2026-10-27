/**
 * Table: first row = header cells, remaining rows = data rows.
 * Wrapped in a horizontally scrollable container. A block with a single row renders it
 * as data. Option "no-header" treats every row as data.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;
  const hasHeader = rows.length > 1 && !block.classList.contains('no-header');

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, index) => {
    const isHeader = hasHeader && index === 0;
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) td.scope = 'col';
      // unwrap a single paragraph so cells don't carry paragraph margins
      if (cell.children.length === 1 && cell.firstElementChild.tagName === 'P') {
        td.append(...cell.firstElementChild.childNodes);
      } else {
        td.append(...cell.childNodes);
      }
      tr.append(td);
    });
    (isHeader ? thead : tbody).append(tr);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  const label = block.closest('.section')?.querySelector('h2, h3')?.textContent.trim();
  wrapper.setAttribute('aria-label', label || 'Table');
  wrapper.append(table);
  block.replaceChildren(wrapper);
}
