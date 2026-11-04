// gwern-style hover previews for every internal reference. Popups nest, stay open while hovered,
// and offer "Go to" and "Pin". On touch screens the first tap previews and the second follows the link.
import { loadIndex, el, isTouch, currentOrder } from './util.js';
import { pin } from './panel.js';

const OPEN_DELAY = 300;
const CLOSE_DELAY = 260;
let stack = []; // open popups, outermost first

function itemHtml(it, opts = {}) {
  const later = opts.readerOrder != null && it.order != null && it.order > opts.readerOrder;
  const title = it.title ? `<span class="popup-title">${it.title}</span>` : '';
  const where = it.chapter ? `<span>${it.chapter}</span>` : '';
  const notes = it.notes ? `<span title="Number in the lecture notes">notes p.${it.page ?? '?'}</span>` : '';
  return `<div class="popup-head"><span class="popup-label">${it.label}</span>${title}${where}${notes}${later ? '<span class="popup-later">later in the course</span>' : ''}
<span class="popup-actions"><a href="${it.url}" data-go>Go to</a><button type="button" data-pin-it="${it.id}">Pin</button></span></div>
<div class="popup-body">${it.statement || ''}</div>${it.kind === 'term' ? '<p class="popup-foot">Defined here.</p>' : ''}`;
}

export function previewHtml(it, opts) { return itemHtml(it, opts); }

function closeFrom(level) {
  while (stack.length > level) {
    const p = stack.pop();
    p.classList.remove('show');
    setTimeout(() => p.remove(), 160);
  }
}

function position(pop, anchor) {
  const r = anchor.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = r.left + window.scrollX;
  left = Math.min(left, window.scrollX + document.documentElement.clientWidth - pw - 12);
  left = Math.max(window.scrollX + 8, left);
  let top = r.bottom + window.scrollY + 6;
  if (r.bottom + ph + 12 > window.innerHeight && r.top - ph - 8 > 0) top = r.top + window.scrollY - ph - 6;
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

async function open(anchor, level) {
  const index = await loadIndex();
  const id = anchor.dataset.ref;
  const it = index[id];
  if (!it) return;
  closeFrom(level);
  const pop = el('div', { class: 'popup', role: 'dialog', 'aria-label': `Preview of ${it.label}` }, itemHtml(it, { readerOrder: currentOrder() }));
  pop._level = level;
  pop._anchor = anchor;
  if (it.kind === 'term') pop.querySelector(`dfn#${CSS.escape(id)}`)?.classList.add('hl');
  // ids inside previews would clash with the page; drop them.
  pop.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  document.body.append(pop);
  position(pop, anchor);
  requestAnimationFrame(() => pop.classList.add('show'));
  stack.push(pop);
  pop.querySelector('[data-pin-it]').addEventListener('click', () => { pin(id); closeFrom(0); });
  pop.querySelector('[data-go]').addEventListener('click', () => closeFrom(0));
  wire(pop, level + 1);
  pop.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  pop.addEventListener('mouseleave', () => scheduleClose(level));
}

let openTimer = 0, closeTimer = 0;
function scheduleClose(level) {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    // keep any popup that is currently hovered, and its parents
    const hovered = stack.findIndex((p) => p.matches(':hover'));
    closeFrom(hovered >= 0 ? hovered + 1 : level);
  }, CLOSE_DELAY);
}

function wire(root, level) {
  root.querySelectorAll('a.xref[data-ref], a.q-link[data-ref]').forEach((a) => {
    if (a._wired) return;
    a._wired = true;
    a.addEventListener('mouseenter', () => {
      if (isTouch()) return;
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(a, level), OPEN_DELAY);
    });
    a.addEventListener('mouseleave', () => { clearTimeout(openTimer); scheduleClose(level); });
    a.addEventListener('focus', () => { openTimer = setTimeout(() => open(a, level), OPEN_DELAY); });
    a.addEventListener('blur', () => { clearTimeout(openTimer); });
    a.addEventListener('click', (e) => {
      if (!isTouch()) { closeFrom(0); return; }
      const already = stack.some((p) => p._anchor === a);
      if (!already) { e.preventDefault(); open(a, level); }
      else closeFrom(0);
    });
  });
}

export function initPopups() {
  wire(document, 0);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFrom(0); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.popup, a.xref')) closeFrom(0); });
  window.addEventListener('pbx:wire', (e) => wire(e.detail || document, 0));
}
