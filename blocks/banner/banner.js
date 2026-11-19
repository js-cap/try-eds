import { loadBsds, moveInstrumentation } from '../../scripts/scripts.js';

const FILLS = ['solid', 'outline'];

// moves the Universal Editor attributes from a row (and its cell) to the new element
function moveRowInstrumentation(row, target) {
  if (!row) return;
  moveInstrumentation(row, target);
  if (row.firstElementChild) moveInstrumentation(row.firstElementChild, target);
}

function createButton(row) {
  const [linkCell, fillCell] = row.children;
  const link = linkCell?.querySelector('a');
  const fill = fillCell?.textContent.trim();
  const button = document.createElement('bsds-button');
  if (link) button.setAttribute('href', link.href);
  button.setAttribute('fill', FILLS.includes(fill) ? fill : 'solid');
  button.textContent = link?.textContent.trim() || 'Novo botão';
  moveInstrumentation(row, button);
  return button;
}

export default function decorate(block) {
  const [
    imageRow, captionRow, highlightRow, titleRow, descriptionRow, ...buttonRows
  ] = block.children;

  const banner = document.createElement('bsds-banner');
  const img = imageRow?.querySelector('img');
  if (img) {
    const { origin, pathname } = new URL(img.src);
    const src = (width) => `${origin}${pathname}?width=${width}&format=webply&optimize=medium`;
    banner.setAttribute('image-src-desktop', src(2000));
    banner.setAttribute('image-src-mobile', src(750));
    banner.setAttribute('image-alt', img.alt);
  }

  const grid = document.createElement('bsds-grid');

  const caption = document.createElement('span');
  caption.textContent = captionRow?.textContent.trim() || 'Texto da legenda';
  moveRowInstrumentation(captionRow, caption);

  // title: "<h1><b>highlight</b> title</h1>" when both are filled, otherwise just the filled one
  const highlightText = highlightRow?.textContent.trim();
  const titleText = titleRow?.textContent.trim();
  const title = document.createElement('h1');
  if (highlightText) {
    const highlight = document.createElement('b');
    highlight.textContent = highlightText;
    title.append(highlight);
    if (titleText) title.append(` ${titleText}`);
  } else {
    title.textContent = titleText || 'título';
  }
  moveRowInstrumentation(titleRow, title);
  // the highlight row is removed below with replaceChildren: drop its instrumentation
  // instead of moving it to the <b>, so two editable fields are not nested inside the <h1>

  // description: richtext, keep the authored HTML (paragraphs, bold, links...)
  const description = document.createElement('div');
  const descriptionCell = descriptionRow?.firstElementChild;
  if (descriptionCell?.textContent.trim()) {
    description.append(...descriptionCell.childNodes);
  } else {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'Descrição';
    description.append(placeholder);
  }
  moveRowInstrumentation(descriptionRow, description);

  grid.append(caption, title, description, ...buttonRows.map(createButton));
  banner.append(grid);
  block.replaceChildren(banner);

  loadBsds().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
  });
}
