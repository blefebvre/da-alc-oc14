// 10/11-digit numbers, or a short service number (e.g. 811) that is the whole line
const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|^\s*\d{3}\s*$/g;

function linkPhones(cell) {
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('a, strong, b')) nodes.push(node);
  }
  nodes.forEach((node) => {
    const text = node.textContent;
    const matches = [...text.matchAll(PHONE)];
    if (!matches.length) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    matches.forEach((m) => {
      const number = m[0].trim();
      const start = m.index + m[0].indexOf(number);
      frag.append(text.slice(last, start));
      const a = document.createElement('a');
      a.href = `tel:${number.replace(/[^\d+]/g, '')}`;
      a.textContent = number;
      frag.append(a);
      last = start + number.length;
    });
    frag.append(text.slice(last));
    node.replaceWith(frag);
  });
}

/**
 * Contact strip: one row with N cells (e.g. bold province label + phone number lines).
 * Bare phone numbers are linked with tel: when not already linked.
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const count = firstRow ? firstRow.children.length : 0;
  block.classList.add(`columns-contact-${count}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-contact-row');
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim()) {
        cell.remove();
        return;
      }
      cell.classList.add('columns-contact-item');
      linkPhones(cell);
    });
  });
}
