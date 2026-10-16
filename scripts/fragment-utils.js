/**
 * Normalises a .plain.html fragment as served by Document Authoring / EDS so it matches the
 * authored structure the header and footer decorators expect:
 * - <picture> wrappers are replaced by their <img> (src resolved against the fragment URL, so
 *   relative "./media_..." references work on nested pages)
 * - paragraphs that DA inserts as the only wrapper inside list items are unwrapped
 * @param {ParentNode} root parsed fragment
 * @param {string} fragmentUrl URL the fragment was fetched from
 */
// eslint-disable-next-line import/prefer-default-export
export function normalizeFragment(root, fragmentUrl) {
  const base = new URL(fragmentUrl, window.location.href);
  const resolve = (value) => {
    const url = new URL(value, base);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.href;
  };

  root.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    if (img) picture.replaceWith(img);
    else picture.remove();
  });
  root.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', resolve(img.getAttribute('src')));
  });

  // <li><p>content</p>...</li> -> <li>content...</li> (only for paragraphs directly in list items)
  root.querySelectorAll('li > p').forEach((p) => {
    p.replaceWith(...p.childNodes);
  });
}
