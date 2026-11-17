import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const quickAccess = document.createElement('bsds-quick-access');

  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (!link) return;
    const item = document.createElement('bsds-quick-access-item');
    item.setAttribute('href', link.href);
    item.textContent = link.textContent.trim();
    moveInstrumentation(row, item);
    quickAccess.append(item);
  });

  block.replaceChildren(quickAccess);

  loadBsds().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}