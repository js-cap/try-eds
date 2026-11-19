import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Closes every open submenu, except the one controlled by "except".
 * @param {Element} nav The menu
 * @param {Element} [except] Button that must stay as it is
 */
function closeAll(nav, except) {
  nav.querySelectorAll('button[aria-expanded="true"]').forEach((button) => {
    if (button !== except) button.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Creates the BSDS arrow used in the toggle buttons.
 * Decorative: the open/closed state is given by aria-expanded on the button.
 * @returns {Element} the <bsds-icon>
 */
function createArrow() {
  const arrow = document.createElement('bsds-icon');
  arrow.setAttribute('name', 'icon-seta-baixo');
  arrow.setAttribute('aria-hidden', 'true');
  return arrow;
}

/**
 * Turns the authored nested list into a menu. A first-level item with a sublist becomes
 * a toggle button (it only opens the submenu, it doesn't navigate: a link authored on its
 * label is dropped). A first-level item without a sublist stays as it was authored.
 * The list itself is not rebuilt: the authored <ul>/<li> are reused as they are.
 * @param {Element} list The authored <ul>
 * @returns {Element} the <nav>
 */
function buildNav(list) {
  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  nav.setAttribute('aria-label', 'Menu principal');
  nav.append(list);

  list.querySelectorAll(':scope > li').forEach((item, i) => {
    const submenu = item.querySelector(':scope > ul');
    if (!submenu) return;

    const button = document.createElement('button');
    button.type = 'button';
    // the label is everything before the nested list ("Produtos"); textContent also keeps
    // the text of a link the author may have put on it, without the link itself
    button.textContent = [...item.childNodes]
      .filter((node) => node !== submenu)
      .map((node) => node.textContent)
      .join('')
      .trim();
    button.append(createArrow());
    button.setAttribute('aria-expanded', 'false');
    submenu.id = `header-submenu-${i}`;
    button.setAttribute('aria-controls', submenu.id);
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      closeAll(nav, button);
      button.setAttribute('aria-expanded', String(!open));
    });

    item.replaceChildren(button, submenu);
  });

  // close with Esc or when clicking outside the menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll(nav);
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll(nav);
  });

  return nav;
}

/**
 * loads and decorates the header
 * The header content is authored as a fragment (default: /nav): a bsds-header block and,
 * next to it, a bulleted list (Text component) that becomes the menu. The boilerplate nav
 * was removed; to consult it see
 * https://github.com/adobe-rnd/aem-boilerplate-xwalk/blob/main/blocks/header/header.js
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  // loadFragment already decorated the bsds-header block, so <bsds-simple-header> exists here.
  // The menu goes inside it. The BSDS library itself is loaded by bsds-header.
  const list = fragment.querySelector('.default-content-wrapper > ul');
  const simpleHeader = fragment.querySelector('bsds-simple-header');
  if (list && simpleHeader) {
    const listWrapper = list.parentElement;
    const nav = buildNav(list);

    // desktop: default slot, on the same row as the logo
    // smaller screens: "bottom" slot, on a row below the logo
    const isDesktop = window.matchMedia('(min-width: 900px)');
    const placeNav = () => {
      if (isDesktop.matches) nav.removeAttribute('slot');
      else nav.slot = 'bottom';
    };
    placeNav();
    isDesktop.addEventListener('change', placeNav);

    simpleHeader.append(nav);
    // drop the wrapper the list came from, if nothing else was authored in it
    if (!listWrapper.children.length) listWrapper.remove();
  }

  block.replaceChildren(...fragment.children);
}
