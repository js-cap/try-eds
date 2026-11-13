import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the header
 * The header content is authored as a fragment (default: /nav), currently a single
 * bsds-header block. The boilerplate nav (hamburger, sections, tools) was removed; to consult it
 * see https://github.com/adobe-rnd/aem-boilerplate-xwalk/blob/main/blocks/header/header.js
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  if (fragment) block.replaceChildren(...fragment.children);
}
