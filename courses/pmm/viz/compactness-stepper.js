// Proof stepper for the countable-additivity part of Theorem 1.15, run on A_n = (0, 1/n] ∪ (n, ∞).
// The same notation as the proof: B_n, C_n, closures, D_n, E_n, l, δ. A toggle replaces F by a version that is not
// right continuous at 0, where Step 2 cannot be done.
import { makeSvg, svg, el, clear, handPath } from '/assets/js/viz-kit.js';

const BASE_ROWS = [1, 2, 3, 4, 8, 16];
const N_MAX = 5000; // run the construction until some E_n is empty (it always is, eventually)
const XMAX = 8;
const ATOM = 0.3;
const Fgood = (x) => (x === Infinity ? 1 : x < 0 ? 0 : ATOM + (1 - ATOM) * (1 - Math.exp(-x / 1.5)));
const Fbad = (x) => (x === Infinity ? 1 : x <= 0 ? 0 : Fgood(x));

// Sets are arrays of intervals {lo, hi, lc, hc} (lc/hc: endpoint closed).
const A = (n) => [{ lo: 0, hi: 1 / n, lc: false, hc: true }, { lo: n, hi: Infinity, lc: false, hc: false }];
const cut = (S, l) => S.map((I) => ({ ...I, hi: Math.min(I.hi, l), hc: I.hi > l ? true : I.hc })).filter((I) => I.lo < I.hi);
function meet(S, T) {
  const out = [];
  for (const I of S) for (const J of T) {
    let lo, lc, hi, hc;
    if (I.lo > J.lo) { lo = I.lo; lc = I.lc; } else if (J.lo > I.lo) { lo = J.lo; lc = J.lc; } else { lo = I.lo; lc = I.lc && J.lc; }
    if (I.hi < J.hi) { hi = I.hi; hc = I.hc; } else if (J.hi < I.hi) { hi = J.hi; hc = J.hc; } else { hi = I.hi; hc = I.hc && J.hc; }
    if (lo < hi || (lo === hi && lc && hc)) out.push({ lo, hi, lc, hc });
  }
  return out;
}
const mass = (S, F) => S.reduce((m, I) => m + F(I.hi) - F(I.lo), 0);

export function mount(host, ctx) {
  let step = 0, bad = false, delta = 0.2;
  const W = 680, rowH = 30, top = 26, H = top + (BASE_ROWS.length + 1) * rowH + 34, L = 70, R = 150;
  const xs = (x) => L + (Math.sqrt(Math.min(Math.max(x, 0), XMAX)) / Math.sqrt(XMAX)) * (W - L - R);
  const plot = el('div');
  const text = el('div', { class: 'step-text', 'aria-live': 'polite' });
  const controls = el('div', { class: 'controls' });
  const back = el('button', { class: 'btn', type: 'button' }, '← Back');
  const next = el('button', { class: 'btn', type: 'button' }, 'Next →');
  const count = el('span', { class: 'step-count' });
  const toggle = el('button', { class: 'btn', type: 'button', 'aria-pressed': 'false' }, 'Break right continuity at 0');
  const dRange = el('input', { type: 'range', min: '0.05', max: '0.3', step: '0.01', value: String(delta), 'aria-label': 'delta' });
  const dOut = el('span', { class: 'readout' });
  controls.append(back, next, count, el('span', { style: 'flex:1' }), el('span', {}, ctx.tex('\\delta')), dRange, dOut, toggle);
  host.append(plot, text, controls);
  back.addEventListener('click', () => { step = Math.max(0, step - 1); draw(); });
  next.addEventListener('click', () => { step = Math.min(maxStep(), step + 1); draw(); });
  toggle.addEventListener('click', () => { bad = !bad; step = Math.min(step, 2); draw(); });
  dRange.addEventListener('input', () => { delta = +dRange.value; draw(); });
  host.tabIndex = -1;
  host.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') next.click(); if (e.key === 'ArrowLeft') back.click(); });
  const maxStep = () => (bad ? 2 : 4);

  function compute() {
    const F = bad ? Fbad : Fgood;
    // l: the least integer with F(-l) + 1 - F(l) <= δ/2
    let l = 1;
    while (F(-l) + 1 - F(l) > delta / 2 && l < XMAX - 0.5) l++;
    const rows = [];
    let D = null, E = null;
    let failN = null, emptyN = null;
    for (let n = 1; n <= N_MAX; n++) {
      const An = A(n), Bn = cut(An, l);
      const eps = delta / 2 ** (n + 2);
      // choose ã for each interval: halve the allowed gap so the strict inequality is visible
      let ok = true;
      const share = eps / Math.max(1, Bn.length);
      const Cn = Bn.map((I) => {
        // largest admissible shift (binary search), then a little less so the inequality is strict
        let lo = 0, hi = I.hi - I.lo;
        for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (F(I.lo + mid) - F(I.lo) < share) lo = mid; else hi = mid; }
        const t = Math.max(lo * 0.9, 1e-9);
        if (lo === 0) ok = false;
        return { lo: I.lo + t, hi: I.hi, lc: false, hc: true, from: I.lo };
      });
      const Cbar = Cn.map((I) => ({ ...I, lc: true }));
      D = D ? meet(D, Cn) : Cn;
      E = E ? meet(E, Cbar) : Cbar;
      if (!ok && failN === null) failN = n;
      if (!E.length && emptyN === null) emptyN = n;
      if (BASE_ROWS.includes(n) || (!bad && emptyN === n) || (bad && n === 64)) rows.push({ n, An, Bn, Cn, Cbar, D, E, eps, ok, mA: mass(An, F), mB: mass(Bn, F), mBC: mass(Bn, F) - mass(Cn, F), mD: mass(D, F) });
      if (n > 16 && (emptyN !== null || bad && n >= 64)) break;
    }
    return { F, l, rows, failN, emptyN };
  }

  function drawSet(s, S, y, colour, { closedDots = false, faint = false } = {}) {
    for (const I of S) {
      if (I.lo >= XMAX) {
        if (!faint) svg('text', { x: W - R - 2, y: y - 6, 'text-anchor': 'end', 'font-size': 10, fill: colour }, s).textContent = `∪ (${I.lo}, ∞), off the scale`;
        continue;
      }
      const x0 = xs(I.lo), x1 = I.hi === Infinity ? W - R + 14 : xs(I.hi);
      svg('path', { d: handPath([[x0, y], [x1, y]], 0.5, Math.round(x0 + x1)), stroke: colour, 'stroke-width': faint ? 2 : 4, opacity: faint ? 0.25 : 1, fill: 'none', 'stroke-linecap': 'butt' }, s);
      if (faint) continue;
      const dot = (x, closed) => svg('circle', { cx: x, cy: y, r: 3.2, fill: closed || closedDots ? colour : ctx.colours().card, stroke: colour, 'stroke-width': 1.4 }, s);
      dot(x0, I.lc);
      if (I.hi !== Infinity) dot(x1, I.hc);
      else svg('path', { d: `M${x1 - 5},${y - 5} L${x1},${y} L${x1 - 5},${y + 5}`, stroke: colour, fill: 'none', 'stroke-width': 1.5 }, s);
    }
  }

  const f3 = (v) => v.toFixed(3);
  function draw() {
    const c = ctx.colours();
    const { l, rows, failN } = compute();
    toggle.classList.toggle('on', bad);
    toggle.setAttribute('aria-pressed', String(bad));
    toggle.textContent = bad ? 'Restore right continuity' : 'Break right continuity at 0';
    dOut.innerHTML = ctx.tex(`= ${delta.toFixed(2)}`);
    back.disabled = step === 0;
    next.disabled = step >= maxStep();
    count.textContent = `Step ${step} of ${maxStep()}`;
    clear(plot);
    const s = makeSvg(plot, W, H, 'Rows of sets on a number line for the compactness argument');
    // axis ticks
    const ay = H - 18;
    svg('line', { x1: xs(0), x2: W - R + 14, y1: ay, y2: ay, stroke: c.ink3 }, s);
    for (const v of [0, 1 / 32, 1 / 8, 0.5, 1, 2, 4, 8]) {
      svg('line', { x1: xs(v), x2: xs(v), y1: ay, y2: ay + 4, stroke: c.ink3 }, s);
      svg('text', { x: xs(v), y: ay + 15, 'text-anchor': 'middle', 'font-size': 10, fill: c.ink3 }, s).textContent = v < 0.2 && v > 0 ? `1/${Math.round(1 / v)}` : v;
    }
    svg('text', { x: W - R + 20, y: ay + 4, 'font-size': 10, fill: c.ink3 }, s).textContent = '√-scale';
    if (step >= 1) {
      svg('line', { x1: xs(l), x2: xs(l), y1: 8, y2: ay, stroke: c.c1, 'stroke-dasharray': '4 4' }, s);
      svg('text', { x: xs(l) + 4, y: 16, class: 'hand', fill: c.c1 }, s).textContent = `l = ${l}`;
    }
    const head = ['µ₀(Aₙ)', 'µ₀(Bₙ)', 'µ₀(Bₙ∖Cₙ)', 'µ₀(Dₙ)', 'µ₀(Dₙ)'][step];
    svg('text', { x: W - R + 30, y: 14, 'font-size': 11, fill: c.ink2, 'font-weight': 600 }, s).textContent = head;
    rows.forEach((r, i) => {
      const y = top + i * rowH + 10;
      const name = ['A', 'B', 'C\u0305', 'E', 'E'][step];
      svg('text', { x: 8, y: y + 4, 'font-size': 12, 'font-style': 'italic', fill: c.ink2 }, s).textContent = `${name}${String(r.n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')}`;
      svg('line', { x1: xs(0), x2: W - R + 14, y1: y, y2: y, stroke: c.rule, 'stroke-width': 0.8 }, s);
      let val = '', warn = false;
      if (step === 0) { drawSet(s, r.An, y, c.ink); val = f3(r.mA); warn = r.mA < delta; }
      if (step === 1) { drawSet(s, r.An, y, c.ink, { faint: true }); drawSet(s, r.Bn, y, c.ink); val = f3(r.mB); warn = r.mB < delta / 2; }
      if (step === 2) {
        drawSet(s, r.Bn, y, c.ink, { faint: true });
        if (r.ok) { drawSet(s, r.Cbar, y, c.accent); val = `${f3(r.mBC)} < ${r.eps.toPrecision(2)}`; }
        else { val = 'no ã works'; warn = true; drawSet(s, r.Bn, y, c.c4); }
      }
      if (step >= 3) {
        drawSet(s, r.Bn, y, c.ink, { faint: true });
        if (r.E.length) drawSet(s, r.E, y, c.c2, { closedDots: true });
        else svg('text', { x: xs(0) + 6, y: y + 4, 'font-size': 12, fill: c.c4 }, s).textContent = '∅';
        val = f3(r.mD);
        warn = r.mD < delta / 4;
      }
      svg('text', { x: W - R + 30, y: y + 4, 'font-size': 12, fill: warn ? c.c4 : c.ink, 'font-variant-numeric': 'tabular-nums' }, s).textContent = val;
    });
    // step text, matching the proof
    const firstBelow = rows.find((r) => r.mA < delta);
    const firstEmpty = rows.find((r) => !r.E.length);
    const T = ctx.tex;
    const msgs = bad ? [
      `Now ${T('F(0) = 0')}, so ${T('F')} is not right continuous at ${T('0')} (the limit from the right is ${T('0.3')}). Each ${T('\\mu_0(A_n) = F(1/n) - F(0) + 1 - F(n)')} is at least ${T('0.3')}, although ${T('A_n \\downarrow \\emptyset')}. By [Lemma 1.5] this ${T('\\mu_0')} is not countably additive. So the proof must break somewhere.`,
      `Step 1 still works: with ${T(`l = ${l}`)}, ${T('F(-l) + 1 - F(l) \\le \\delta/2')}, so ${T('\\mu_0(B_n) \\ge \\delta/2')} for every ${T('n')}.`,
      `Step 2 fails. For the piece ${T('(0, 1/n]')} we need ${T('\\tilde a')} with ${T('F(\\tilde a) - F(0) < \\delta/2^{n+2}')}, but ${T('F(\\tilde a) - F(0) \\ge 0.3')} for every ${T('\\tilde a > 0')}. The mass ${T('0.3')} sits just to the right of the excluded point ${T('0')}, and no closed set inside ${T('B_n')} can capture it.`,
    ] : [
      `Suppose ${T('A_n \\downarrow \\emptyset')} but ${T('\\mu_0(A_n) \\ge \\delta')} for all ${T('n')}. The rows show ${T('A_n = (0, 1/n] \\cup (n, \\infty)')}. For this right-continuous ${T('F')} the masses tend to ${T('0')}${firstBelow ? `, and in fact ${T(`\\mu_0(A_{${firstBelow.n}}) < \\delta`)} already` : ''}; the proof shows that this is forced. Watch where each step uses a hypothesis.`,
      `Step 1: cut to ${T(`B_n = A_n \\cap (-l, l]`)} with ${T(`l = ${l}`)}, chosen so that ${T(`F(-l) + 1 - F(l) = ${f3(Fgood(-l) + 1 - Fgood(l))} \\le \\delta/2`)}. The piece running off to infinity is gone; for ${T(`n \\ge ${l}`)} it is empty.`,
      `Step 2: move each left endpoint ${T('a')} right to ${T('\\tilde a')} so that ${T('\\mu_0(B_n \\setminus C_n) < \\delta/2^{n+2}')} (right column). Right continuity of ${T('F')} at ${T('a')} is what makes this possible. The coloured sets are the closures ${T('\\overline{C}_n \\subseteq B_n')}.`,
      `Step 3: ${T('E_n = \\bigcap_{i \\le n} \\overline{C}_i')}, closed and bounded, so compact, and decreasing in ${T('n')}. The proof shows ${T('\\mu_0(D_n) \\ge \\delta/4')} if every ${T('\\mu_0(A_i) \\ge \\delta')}; the right column gives the actual ${T('\\mu_0(D_n)')}.`,
      `Conclusion: ${firstEmpty ? `${T(`E_{${firstEmpty.n}} = \\emptyset`)}` : `some ${T('E_n')} is empty`}. Nested non-empty compact sets would have a common point, which would lie in every ${T('A_n')}; there is none, so some ${T('E_n')} is empty, hence ${T('D_n = \\emptyset')} and ${T('\\mu_0(D_n) = 0 < \\delta/4')}. So the assumption ${T('\\mu_0(A_n) \\ge \\delta')} for all ${T('n')} was false: ${T('\\mu_0(A_n) \\to 0')}.`,
    ];
    text.innerHTML = msgs[step].replace('[Lemma 1.5]', '<a class="xref" data-ref="ch1-lem-cont-empty" href="#ch1-lem-cont-empty">Lemma 1.5</a>');
    window.dispatchEvent(new CustomEvent('pbx:wire', { detail: text }));
  }
  ctx.onTheme(draw);
  draw();
}
