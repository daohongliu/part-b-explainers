// Parameter explorer for Definition 1.14 / Theorem 1.15: the mass of an interval is read off the distribution function F,
// and whether a jump at an endpoint counts depends on whether the endpoint is in the interval.
import { makeSvg, svg, linear, handPath, el, clear, draggable } from '/assets/js/viz-kit.js';

function cantor(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let v = 0, scale = 0.5;
  for (let i = 0; i < 40; i++) {
    x *= 3;
    const d = Math.floor(x);
    x -= d;
    if (d === 1) return v + scale;
    if (d === 2) v += scale;
    scale /= 2;
  }
  return v;
}

const PRESETS = {
  mixture: {
    name: 'Atom at 0 plus a density',
    dom: [-2, 6], atoms: [[0, 0.3]],
    F: (x) => (x < 0 ? 0 : 0.3 + 0.7 * (1 - Math.exp(-x / 1.5))),
    a: -1, b: 2,
  },
  uniform: {
    name: 'Uniform on [0, 1]', dom: [-0.5, 1.5], atoms: [],
    F: (x) => Math.min(1, Math.max(0, x)), a: 0.25, b: 0.6,
  },
  die: {
    name: 'A fair die', dom: [0, 7], atoms: [1, 2, 3, 4, 5, 6].map((k) => [k, 1 / 6]),
    F: (x) => Math.min(6, Math.max(0, Math.floor(x))) / 6, a: 2, b: 4,
  },
  cantor: {
    name: 'Cantor function', dom: [-0.15, 1.15], atoms: [],
    F: cantor, a: 0.3, b: 0.72,
  },
};
const TYPES = [
  { key: '(]', tex: '(a,b]', left: 'F(a)', right: 'F(b)', incA: false, incB: true },
  { key: '[]', tex: '[a,b]', left: 'F(a-)', right: 'F(b)', incA: true, incB: true },
  { key: '()', tex: '(a,b)', left: 'F(a)', right: 'F(b-)', incA: false, incB: false },
  { key: '[)', tex: '[a,b)', left: 'F(a-)', right: 'F(b-)', incA: true, incB: false },
];

export function mount(host, ctx) {
  const W = 640, H = 330, L = 46, R = 18, T = 16, B = 62;
  let preset = PRESETS.mixture, a = preset.a, b = preset.b, type = TYPES[0];
  const plot = el('div');
  const readout = el('div', { class: 'readout', 'aria-live': 'polite', style: 'margin-top:.4rem;min-height:1.6em' });
  const controls = el('div', { class: 'controls' });
  const sel = el('select', { 'aria-label': 'Distribution' });
  for (const [k, p] of Object.entries(PRESETS)) sel.append(el('option', { value: k }, p.name));
  sel.addEventListener('change', () => { preset = PRESETS[sel.value]; a = preset.a; b = preset.b; draw(); });
  controls.append(sel);
  const typeBtns = TYPES.map((t) => {
    const btn = el('button', { class: 'btn', type: 'button', 'aria-pressed': 'false' }, ctx.tex(t.tex));
    btn.addEventListener('click', () => { type = t; draw(); });
    controls.append(btn);
    return [t, btn];
  });
  host.append(plot, readout, controls);

  const Fm = (x) => {
    const at = preset.atoms.find(([p]) => Math.abs(p - x) < 1e-9);
    return at ? preset.F(x) - at[1] : preset.F(x);
  };
  const snap = (v) => {
    for (const [p] of preset.atoms) if (Math.abs(p - v) < (preset.dom[1] - preset.dom[0]) / 70) return p;
    return v;
  };
  const fmt = (v) => (Math.abs(v) < 5e-4 ? '0' : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''));

  function draw() {
    const c = ctx.colours();
    typeBtns.forEach(([t, btn]) => { btn.classList.toggle('on', t === type); btn.setAttribute('aria-pressed', String(t === type)); });
    clear(plot);
    const [d0, d1] = preset.dom;
    const x = linear(d0, d1, L, W - R), y = linear(0, 1, H - B, T);
    const s = makeSvg(plot, W, H, `Graph of the distribution function for ${preset.name}, with an interval from ${fmt(a)} to ${fmt(b)}`);
    const rough = `url(#${s.roughId})`;
    // axes
    const ax = svg('g', { filter: rough }, s);
    svg('path', { d: handPath([[L, H - B], [W - R, H - B]], 0.6, 2), stroke: c.ink3, fill: 'none' }, ax);
    svg('path', { d: handPath([[L, H - B], [L, T - 4]], 0.6, 5), stroke: c.ink3, fill: 'none' }, ax);
    for (const v of [0, 0.5, 1]) {
      svg('line', { x1: L - 4, x2: L, y1: y(v), y2: y(v), stroke: c.ink3 }, s);
      svg('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: c.ink3 }, s).textContent = v;
      if (v === 1) svg('line', { x1: L, x2: W - R, y1: y(1), y2: y(1), stroke: c.rule, 'stroke-dasharray': '3 4' }, s);
    }
    const step = (d1 - d0) > 3 ? 1 : 0.5;
    for (let v = Math.ceil(d0 / step) * step; v <= d1 + 1e-9; v += step) {
      svg('line', { x1: x(v), x2: x(v), y1: H - B, y2: H - B + 4, stroke: c.ink3 }, s);
      svg('text', { x: x(v), y: H - B + 16, 'text-anchor': 'middle', 'font-size': 11, fill: c.ink3 }, s).textContent = +v.toFixed(2);
    }
    // the shaded mass: rise of F between the two relevant values
    const lo = type.incA ? Fm(a) : preset.F(a);
    const hi = type.incB ? preset.F(b) : Fm(b);
    svg('rect', { x: L + 1, width: W - R - L - 1, y: y(Math.max(lo, hi)), height: Math.max(0, y(lo) - y(hi)), fill: c.accent, opacity: 0.1 }, s);
    svg('line', { x1: L - 2, x2: L - 2, y1: y(lo), y2: y(hi), stroke: c.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
    // graph of F, broken at the atoms
    const breaks = [d0, ...preset.atoms.map(([p]) => p).filter((p) => p > d0 && p < d1), d1];
    const g = svg('g', { filter: rough }, s);
    for (let i = 0; i < breaks.length - 1; i++) {
      const pts = [];
      const u0 = breaks[i], u1 = breaks[i + 1];
      const N = preset === PRESETS.cantor ? 600 : 120;
      for (let k = 0; k <= N; k++) {
        const u = u0 + ((u1 - u0) * k) / N;
        const v = k === N && i < breaks.length - 2 ? Fm(u1) : preset.F(u);
        pts.push([x(u), y(v)]);
      }
      svg('path', { d: handPath(pts, 0.25, i + 11), stroke: c.ink, 'stroke-width': 1.8, fill: 'none', 'stroke-linejoin': 'round' }, g);
    }
    for (const [p, m] of preset.atoms) {
      if (p < d0 || p > d1) continue;
      svg('line', { x1: x(p), x2: x(p), y1: y(preset.F(p) - m), y2: y(preset.F(p)), stroke: c.ink3, 'stroke-dasharray': '2 3' }, s);
      svg('circle', { cx: x(p), cy: y(preset.F(p) - m), r: 3.6, fill: c.card, stroke: c.ink, 'stroke-width': 1.5 }, s);
      svg('circle', { cx: x(p), cy: y(preset.F(p)), r: 3.6, fill: c.ink }, s);
    }
    if (preset === PRESETS.mixture) {
      const t = svg('text', { x: x(0.3), y: y(0.13), class: 'hand' }, s);
      t.textContent = 'jump = µ({0}) = 0.3';
      svg('path', { d: `M${x(0.27)},${y(0.135)} q -10,0 -16,-4`, stroke: c.ink2, fill: 'none', 'stroke-width': 1 }, s);
      const t2 = svg('text', { x: x(1.5), y: y(0.36), class: 'hand' }, s);
      t2.textContent = 'filled dot: F(0) takes the upper value';
      svg('path', { d: `M${x(1.45)},${y(0.37)} Q${x(0.6)},${y(0.36)} ${x(0.08)},${y(0.31)}`, stroke: c.ink2, fill: 'none', 'stroke-width': 1 }, s);
    }
    // interval on the axis
    const ya = H - B + 30;
    svg('line', { x1: x(a), x2: x(b), y1: ya, y2: ya, stroke: c.accent, 'stroke-width': 3, 'stroke-linecap': 'butt' }, s);
    const bracket = (px, open, left) => {
      const dir = left ? 1 : -1;
      if (open) svg('path', { d: `M${px + dir * 5},${ya - 8} Q${px - dir * 1},${ya} ${px + dir * 5},${ya + 8}`, stroke: c.accent, 'stroke-width': 2, fill: 'none' }, s);
      else svg('path', { d: `M${px + dir * 5},${ya - 8} L${px},${ya - 8} L${px},${ya + 8} L${px + dir * 5},${ya + 8}`, stroke: c.accent, 'stroke-width': 2, fill: 'none' }, s);
    };
    bracket(x(a), !type.incA, true);
    bracket(x(b), !type.incB, false);
    for (const [name, val, set] of [['a', a, (v) => { a = Math.min(v, b); }], ['b', b, (v) => { b = Math.max(v, a); }]]) {
      const h = svg('g', { tabindex: 0, role: 'slider', 'aria-label': `Endpoint ${name}`, 'aria-valuenow': fmt(val), 'aria-valuemin': d0, 'aria-valuemax': d1 }, s);
      svg('line', { x1: x(val), x2: x(val), y1: y(0), y2: ya + 10, stroke: c.accent, 'stroke-dasharray': '2 3', opacity: 0.7 }, h);
      svg('circle', { cx: x(val), cy: ya + 14, r: 9, fill: c.card, stroke: c.accent, 'stroke-width': 1.5 }, h);
      svg('text', { x: x(val), y: ya + 18, 'text-anchor': 'middle', 'font-size': 12, 'font-style': 'italic', fill: c.accent }, h).textContent = name;
      draggable(s, h, (p) => { set(snap(Math.min(d1, Math.max(d0, x.invert(p.x))))); draw(); s.querySelector(`[aria-label="Endpoint ${name}"]`)?.focus(); });
      h.addEventListener('keydown', (e) => {
        const dv = (d1 - d0) / 100 * (e.shiftKey ? 10 : 1);
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(snap(Math.min(d1, val + dv))); draw(); e.preventDefault(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(snap(Math.max(d0, val - dv))); draw(); e.preventDefault(); }
        plot.querySelector(`[aria-label="Endpoint ${name}"]`)?.focus();
      });
    }
    const mass = hi - lo;
    readout.innerHTML = ctx.tex(`\\mu\\bigl(${type.tex.replace('a', fmt(a)).replace('b', fmt(b))}\\bigr) = ${type.right.replace('b', 'b')} - ${type.left} = ${fmt(hi)} - ${fmt(lo)} = ${fmt(mass)}`);
  }
  ctx.onTheme(draw);
  draw();
}
