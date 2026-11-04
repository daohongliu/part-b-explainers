// The side panel holds pinned items (statement plus expandable proof). Pins persist per course.
import { loadIndex, store, course, el } from './util.js';

const key = () => `pins:${course}`;
let panel, cards;

function setOpen(open) {
  if (!panel) return;
  panel.hidden = false;
  panel.classList.toggle('open', open);
  document.body.classList.toggle('panel-open', open);
  store.set(`panelOpen:${course}`, open);
}
export const togglePanel = () => setOpen(!panel.classList.contains('open'));

async function render() {
  if (!cards) return;
  const ids = store.get(key(), []);
  const index = await loadIndex();
  cards.innerHTML = '';
  for (const id of ids) {
    const it = index[id];
    if (!it) continue;
    const c = el('article', { class: 'card', 'data-card': id }, `<div class="card-head"><span class="popup-label">${it.label}</span>${it.title ? `<span class="popup-title">${it.title}</span>` : ''}
<span class="card-actions"><a href="${it.url}" title="Go to">go to</a><button type="button" data-unpin="${id}" title="Unpin" aria-label="Unpin ${it.label}">×</button></span></div>
<div class="card-body">${it.statement || ''}</div>${it.proof ? `<details><summary>Proof</summary><div class="card-proof">${it.proof}</div></details>` : ''}`);
    c.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    cards.append(c);
  }
  document.querySelectorAll('[data-pin-count]').forEach((n) => { n.textContent = ids.length || ''; });
  document.querySelectorAll('.pin-btn[data-pin]').forEach((b) => {
    const on = ids.includes(b.dataset.pin);
    b.classList.toggle('pinned', on);
    b.textContent = on ? 'pinned' : 'pin';
  });
  window.dispatchEvent(new CustomEvent('pbx:wire', { detail: cards }));
}

export function pin(id) {
  const ids = store.get(key(), []);
  if (!ids.includes(id)) ids.push(id);
  store.set(key(), ids);
  render();
  setOpen(true);
}
function unpin(id) {
  store.set(key(), store.get(key(), []).filter((x) => x !== id));
  render();
}

export function initPanel() {
  panel = document.getElementById('panel');
  cards = panel?.querySelector('.panel-cards');
  if (!panel) return;
  document.querySelectorAll('[data-action="panel"]').forEach((b) => b.addEventListener('click', togglePanel));
  panel.addEventListener('click', (e) => { const u = e.target.closest('[data-unpin]'); if (u) unpin(u.dataset.unpin); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.pin-btn[data-pin]');
    if (!b) return;
    const ids = store.get(key(), []);
    ids.includes(b.dataset.pin) ? unpin(b.dataset.pin) : pin(b.dataset.pin);
  });
  render();
  if (store.get(`panelOpen:${course}`, false) && store.get(key(), []).length && window.innerWidth > 860) setOpen(true);
  window.pbxTogglePanel = togglePanel;
}
