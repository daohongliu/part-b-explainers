// Margin toy for Lemma 1.4(2): G_n = (n, ∞) has infinite Lebesgue measure for every n, yet ⋂ G_n = ∅.
import { makeSvg, svg, linear, handPath, el, clear } from '/assets/js/viz-kit.js';

export function mount(host, ctx) {
  const W = 240, H = 64;
  const wrap = el('div');
  host.append(wrap);
  const controls = el('div', { class: 'controls' });
  const range = el('input', { type: 'range', min: '0', max: '9', step: '1', value: '2', 'aria-label': 'n' });
  const out = el('span', { class: 'readout' });
  controls.append(el('span', {}, ctx.tex('n')), range, out);
  host.append(controls);
  const x = linear(0, 12, 12, W - 12);

  function draw() {
    const c = ctx.colours();
    const n = +range.value;
    clear(wrap);
    const s = makeSvg(wrap, W, H, `The set G_n = (${n}, infinity) on the number line`);
    const g = svg('g', { filter: `url(#${s.roughId})` }, s);
    svg('path', { d: handPath([[x(0), 34], [x(12), 34]], 0.5, 3), stroke: c.ink3, 'stroke-width': 1, fill: 'none' }, g);
    for (let k = 0; k <= 11; k++) svg('line', { x1: x(k), x2: x(k), y1: 31, y2: 37, stroke: c.ink3, 'stroke-width': 0.8 }, g);
    for (const k of [0, 5, 10]) svg('text', { x: x(k), y: 52, 'text-anchor': 'middle', 'font-size': 10, fill: c.ink3 }, s).textContent = k;
    // the set (n, ∞)
    svg('path', { d: handPath([[x(n), 24], [x(11.6), 24]], 0.7, n + 7), stroke: c.accent, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
    svg('path', { d: `M${x(11.6)},19 L${x(12)},24 L${x(11.6)},29`, stroke: c.accent, 'stroke-width': 1.6, fill: 'none' }, g);
    svg('circle', { cx: x(n), cy: 24, r: 3.2, fill: c.card, stroke: c.accent, 'stroke-width': 1.5 }, s);
    out.innerHTML = ctx.tex(`\\lambda\\bigl((${n},\\infty)\\bigr) = \\infty`);
  }
  range.addEventListener('input', draw);
  ctx.onTheme(draw);
  draw();
}
