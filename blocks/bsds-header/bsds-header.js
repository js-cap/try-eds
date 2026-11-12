import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Renders <bsds-simple-header> from the authored logo.
 * Row 1: logo (picture/img).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const img = block.querySelector('img');

  const header = document.createElement('bsds-simple-header');

  if (img) {
    const logo = document.createElement('img');
    logo.slot = 'logo';
    logo.src = img.currentSrc || img.src;
    logo.alt = img.alt || '';

    moveInstrumentation(img, logo);
    header.append(logo);
  }

  block.replaceChildren(header);

  loadBsds().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}
