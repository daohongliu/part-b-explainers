// Client-side search over the course's labelled items (labels, titles, statement text including LaTeX source).
import { course } from './util.js';

let data = null;
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

function score(entry, terms) {
  const label = norm(entry.label), title = norm(entry.title || ''), text = norm(entry.text || '');
  let s = 0;
  for (const t of terms) {
    if (label === t) s += 40;
    if (label.includes(t)) s += 12;
    if (title.includes(t)) s += 8;
    if (text.includes(t)) s += 2;
    else if (!label.includes(t) && !title.includes(t)) return 0;
  }
  if (entry.kind === 'section') s += 1;
  if (entry.kind === 'term') s += 3;
  return s;
}

export function initSearch() {
  const box = document.getElementById('search');
  if (!box || !course || course === 'hub') return;
  const input = box.querySelector('input');
  const list = box.querySelector('.search-results');
  let sel = 0, results = [];
  const open = async () => {
    box.hidden = false;
    input.focus();
    input.select();
    data ||= await fetch(`/${course}/search.json`).then((r) => r.json()).catch(() => []);
    run();
  };
  const close = () => { box.hidden = true; };
  const draw = () => {
    list.innerHTML = results.map((r, i) => `<li class="${i === sel ? 'sel' : ''}"><a href="${r.url}"><span class="sr-kind">${r.kind === 'term' ? 'term' : r.kind}</span> ${r.label}${r.title && !r.label.includes(r.title) ? ` · ${r.title}` : ''}<span class="sr-snip">${(r.text || '').slice(0, 140)}</span></a></li>`).join('');
  };
  const run = () => {
    const q = norm(input.value.trim());
    if (!q || !data) { results = []; draw(); return; }
    const terms = q.split(/\s+/);
    results = data.map((e) => [score(e, terms), e]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 12).map(([, e]) => e);
    sel = 0;
    draw();
  };
  input.addEventListener('input', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, results.length - 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
    if (e.key === 'Enter' && results[sel]) { close(); location.href = results[sel].url; }
    if (e.key === 'Escape') close();
  });
  box.addEventListener('click', (e) => { if (e.target === box) close(); if (e.target.closest('a')) close(); });
  document.querySelectorAll('[data-action="search"]').forEach((b) => b.addEventListener('click', open));
  window.pbxSearch = open;
}
