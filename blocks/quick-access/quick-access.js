import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

// values accepted by the BSDS "color" property (1.1.0), authored via the block "classes" field
const COLORS = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral'];
// values of the "fill" field of the Quick Access Button item
const FILLS = ['solid', 'outline'];

/**
 * Returns the fill of a button row, or undefined for a regular item row.
 * A button row has an extra cell holding the "fill" value (solid | outline).
 * @param {Element} row The block row
 * @returns {string|undefined} the fill value
 */
function getFill(row) {
  return [...row.children]
    .filter((cell) => !cell.querySelector('a'))
    .map((cell) => cell.textContent.trim())
    .find((value) => FILLS.includes(value));
}

/**
 * Builds a <bsds-quick-access-item> from a row.
 * Empty rows are kept: a freshly added item has no link yet and must still render
 * so the author can select it in the Universal Editor.
 * @param {Element} row The block row
 * @returns {Element} the item
 */
function createItem(row) {
  const link = row.querySelector('a');
  const text = (link?.textContent || row.textContent).trim();
  const item = document.createElement('bsds-quick-access-item');
  if (link) item.setAttribute('href', link.href);
  item.textContent = text || 'Novo item';
  moveInstrumentation(row, item);
  return item;
}

/**
 * Builds a <bsds-button> wrapped in a <div slot="end"> from a row.
 * The Universal Editor instrumentation goes on the wrapper, not on the button: on mobile,
 * BSDS 1.1.0 copies the end-slot buttons into its accordion with cloneNode(true), which would
 * duplicate the data-aue-* attributes (and the item in the Content Tree).
 * @param {Element} row The block row
 * @param {string} fill solid | outline
 * @param {string} [color] BSDS color
 * @returns {Element} the wrapper holding the button
 */
function createButton(row, fill, color) {
  const link = row.querySelector('a');
  const button = document.createElement('bsds-button');
  if (link) button.setAttribute('href', link.href);
  button.setAttribute('fill', fill);
  if (color) button.setAttribute('color', color);
  button.textContent = link?.textContent.trim() || 'Novo botão';

  const wrapper = document.createElement('div');
  wrapper.slot = 'end';
  wrapper.append(button);
  moveInstrumentation(row, wrapper);
  return wrapper;
}

/**
 * Renders <bsds-quick-access>: items go to the default slot, buttons to the "end" slot.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const color = COLORS.find((c) => block.classList.contains(c));
  const quickAccess = document.createElement('bsds-quick-access');
  if (color) quickAccess.setAttribute('color', color);

  // buttons are appended after the items, each one in its own <div slot="end">
  const buttons = [];
  [...block.children].forEach((row) => {
    const fill = getFill(row);
    if (fill) buttons.push(createButton(row, fill, color));
    else quickAccess.append(createItem(row));
  });
  quickAccess.append(...buttons);

  // the component (1.1.0) reads its children once on load: append it only when complete
  block.replaceChildren(quickAccess);

  loadBsds().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}
