import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const quickAccess = document.createElement('bsds-quick-access');

  [...block.children].forEach((row) => {
    // keep every row, even empty ones: a freshly added item has no link yet and
    // must still render so the author can select it in the Universal Editor
    const link = row.children[0].textContent;
    const text = (row.children[1].textContent || link?.textContent).trim();
    const item = document.createElement('bsds-quick-access-item');
    if (link) item.setAttribute('href', link);
    item.textContent = text || 'Novo item';
    moveInstrumentation(row, item);
    quickAccess.append(item);
  });

  block.replaceChildren(quickAccess);

  loadBsds().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}
