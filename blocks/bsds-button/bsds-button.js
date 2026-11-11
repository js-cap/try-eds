import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Renders a BSDS button (<bsds-button>) from authored content.
 * Row 1: link, Row 2 (optional): label. Variant via block class: primary (default) | secondary.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const [linkRow, textRow] = [...block.children];
  const anchor = linkRow?.querySelector('a');
  const href = anchor?.href || linkRow?.textContent.trim();
  const label = textRow?.textContent.trim() || anchor?.textContent.trim() || href;

  const color = block.classList.contains('secondary') ? 'secondary' : 'primary';
  const button = document.createElement('bsds-button');
  button.setAttribute('color', color);
  button.textContent = label;

  const host = href ? document.createElement('a') : button;
  if (href) {
    host.href = href;
    if (anchor?.title) host.title = anchor.title;
    host.append(button);
  }

  moveInstrumentation(block.firstElementChild || block, host);
  block.replaceChildren(host);

  try {
    await loadBsds();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
