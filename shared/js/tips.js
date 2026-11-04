// One-line tooltips for [data-tip] (estimate marks, annotated symbols in displays).
import { el } from './util.js';

export function initTips() {
  let tip = null;
  const show = (target) => {
    tip?.remove();
    tip = el('div', { class: 'tip', role: 'tooltip' });
    tip.textContent = target.dataset.tip;
    document.body.append(tip);
    const r = target.getBoundingClientRect();
    const left = Math.min(window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 8, Math.max(8, r.left + window.scrollX + r.width / 2 - tip.offsetWidth / 2));
    tip.style.left = `${left}px`;
    tip.style.top = `${r.top + window.scrollY - tip.offsetHeight - 6}px`;
  };
  const hide = () => { tip?.remove(); tip = null; };
  document.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-tip]'); if (t) show(t); });
  document.addEventListener('mouseout', (e) => { if (e.target.closest('[data-tip]')) hide(); });
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-tip]'); if (t) { tip ? hide() : show(t); } });
}
