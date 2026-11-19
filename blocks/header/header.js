import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// ":icon-atend-celular:" (or ":atend-celular:") at the start of a label
const ICON_TOKEN = /^\s*:([a-z0-9-]+):\s*/i;

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
 * Creates a decorative BSDS icon.
 * @param {string} name BSDS icon name (file name in the library "svg" folder)
 * @returns {Element} the <bsds-icon>
 */
function createIcon(name) {
  const icon = document.createElement('bsds-icon');
  icon.setAttribute('name', name);
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

/**
 * Reads the label of a list item: the text before its sublist, plus an optional icon
 * authored with the ":icon-name:" convention.
 * Two forms are handled, because the backend may or may not have converted the token:
 * - plain text ":icon-atend-celular: Canais Digitais"
 * - <span class="icon icon-icon-atend-celular"> (the EDS icon markup, already filled with an
 *   <img> pointing to /icons/... by decorateIcons): the span is removed
 * The "icon-" prefix of the BSDS names is optional: ":atend-celular:" works too.
 * @param {Element} item The <li>
 * @param {Element} [sublist] The nested <ul> of the item, excluded from the label
 * @returns {{text: string, icon: (string|undefined)}} the label text and icon name
 */
function readLabel(item, sublist) {
  const nodes = [...item.childNodes].filter((node) => node !== sublist);

  let icon;
  const span = nodes
    .filter((node) => node.nodeType === Node.ELEMENT_NODE)
    .map((el) => (el.matches('span.icon') ? el : el.querySelector('span.icon')))
    .find(Boolean);
  if (span) {
    icon = [...span.classList].find((c) => c.startsWith('icon-'))?.substring(5);
    span.remove();
  }

  let text = nodes.map((node) => node.textContent).join('').trim();
  const token = text.match(ICON_TOKEN);
  if (token) {
    icon = icon || token[1];
    text = text.slice(token[0].length).trim();
  }

  if (icon && !icon.startsWith('icon-')) icon = `icon-${icon}`;
  return { text, icon };
}

/**
 * Turns a second-level list into a panel with columns. Each second-level item is a column:
 * its label (with the optional icon) becomes the column title, its sublist the column links.
 * @param {Element} submenu The second-level <ul>
 */
function buildPanel(submenu) {
  submenu.classList.add('header-nav-panel');
  [...submenu.children].forEach((group) => {
    const links = group.querySelector(':scope > ul');
    const { text, icon } = readLabel(group, links);

    const title = document.createElement('p');
    title.className = 'header-nav-group-title';
    if (icon) title.append(createIcon(icon));
    title.append(text);

    group.replaceChildren(...[title, links].filter(Boolean));
  });
}

/**
 * Turns the authored nested list into a menu.
 * - first-level item with a sublist: a toggle button (it only opens the submenu; a link
 *   authored on its label is dropped)
 *   - sublist with a third level: panel with columns (second level = column title)
 *   - sublist with only two levels: simple dropdown
 * - first-level item without a sublist: stays as it was authored
 * The list itself is not rebuilt: the authored <ul>/<li> are reused.
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
    if (!submenu) {
      item.querySelector('a')?.classList.add('header-nav-top');
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'header-nav-top';
    button.textContent = readLabel(item, submenu).text;
    button.append(createIcon('icon-seta-baixo'));
    button.setAttribute('aria-expanded', 'false');
    submenu.id = `header-submenu-${i}`;
    button.setAttribute('aria-controls', submenu.id);
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      closeAll(nav, button);
      button.setAttribute('aria-expanded', String(!open));
    });

    const hasColumns = [...submenu.children].some((child) => child.querySelector(':scope > ul'));
    if (hasColumns) {
      buildPanel(submenu);
      item.classList.add('header-nav-mega');
    } else {
      submenu.classList.add('header-nav-dropdown');
    }

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
