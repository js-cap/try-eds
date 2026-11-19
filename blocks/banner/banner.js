import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {


  loadBsds().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}
