/* ---------- Ch3 · Fig 3.1: Borel–Cantelli ---------- */
reg('ch3', 'borelcantelli', function () {
  const cv = $('#bc-canvas'); if (!cv) return;
  const sp = $('#bc-p'), out = $('#bc-out');
  const W = 720, H = 270, L = 40, Rr = 708, T = 10, B = 244, ROWS = 30, NMAX = 20000;
  let seed = 2, U = null;
  function sample() { const R = rng(seed * 97 + 3); U = new Float32Array(ROWS * NMAX); for (let i = 0; i < U.length; i++) U[i] = R(); }
  function draw() {
    const p = +sp.value; $('#bc-pv').textContent = p.toFixed(2);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
    const X = n => L + Math.log10(n) / Math.log10(NMAX) * (Rr - L), rh = (B - T) / ROWS;
    g.fillStyle = col('--ink-soft'); g.font = '11px Recursive, ui-monospace, monospace'; g.textAlign = 'center';
    [1, 10, 100, 1000, 10000].forEach(n => { g.fillText(n.toLocaleString('en-GB'), X(n), B + 18); g.globalAlpha = .25; g.fillRect(X(n), T, 1, B - T); g.globalAlpha = 1; });
    g.textAlign = 'right'; g.fillText('ω', L - 10, T + 10);
    let lateRows = 0, total = 0, late = 0;
    for (let r = 0; r < ROWS; r++) {
      const y = T + r * rh + rh / 2; let lastN = 0, cnt = 0;
      g.strokeStyle = col('--rule'); g.lineWidth = .6; g.beginPath(); g.moveTo(L, y); g.lineTo(Rr, y); g.stroke();
      g.fillStyle = col(r === 0 ? '--blue' : r === 1 ? '--ochre' : '--ink');
      for (let n = 1; n <= NMAX; n++) if (U[r * NMAX + n - 1] < Math.pow(n, -p)) { cnt++; lastN = n; if (n > 1000) late++; g.beginPath(); g.arc(X(n), y, 2.1, 0, 7); g.fill(); }
      total += cnt; if (lastN > 1000) lateRows++;
    }
    let s = 0; for (let n = 1; n <= NMAX; n++) s += Math.pow(n, -p);
    out.innerHTML = 'Σ<sub>n≤20 000</sub> P(A<sub>n</sub>) = ' + s.toFixed(2) + (p > 1 ? ' (the full sum converges)' : ' (the full sum diverges)') + '.   Rows with an event after n = 1000: <b>' + lateRows + '</b> of ' + ROWS +
      '<br><span class="' + (p > 1 ? 'ok' : 'bad') + '">' + (p > 1 ? 'BC1: P(A<sub>n</sub> i.o.) = 0. Each row has a last dot, at a random time.' : 'BC2: P(A<sub>n</sub> i.o.) = 1. However far right you look, every row has more dots.') + '</span>';
  }
  sp.addEventListener('input', draw);
  $('#bc-new').addEventListener('click', () => { seed++; sample(); draw(); });
  sample(); draw();
});

/* ---------- Ch3 · Fig 3.2: the moving blip ---------- */
reg('ch3', 'typewriter', function () {
  const svg = $('#tw-svg'); if (!svg) return;
  const btns = $$('#fig3-2 [data-tw]'), sn = $('#tw-n'), out = $('#tw-out');
  const L = 60, Rx = 680, AY = 92, X = x => L + x * (Rx - L), Xi = p => (p - L) / (Rx - L);
  let mode = 'all', w = 0.62;
  const gA = el('g', {}, svg), g = el('g', {}, svg), gH = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'omega' }, svg);
  axisLine(gA, L, Rx + 6, AY, [[X(0), '0'], [X(.25), '¼'], [X(.5), '½'], [X(.75), '¾'], [X(1), '1']], { dy: 16, fs: 11 });
  el('rect', { x: -12, y: AY - 40, width: 24, height: 52, fill: 'transparent' }, gH);
  el('path', { d: 'M0 ' + (AY - 6) + 'L-6.5 ' + (AY - 18) + 'L6.5 ' + (AY - 18) + 'Z', class: 's s-red f-paper knob', 'stroke-width': 1.6 }, gH);
  text(gH, 0, AY - 24, 'ω', 'lbl-red lbl-serif', { 'text-anchor': 'middle', 'font-size': 16 });
  drag(gH, svg, pt => { w = clamp(Xi(pt.x), .001, .999); render(); });
  keyNudge(gH, () => w, v => { w = clamp(v, .001, .999); render(); }, .01, .1);
  const mk = n => { const m = Math.floor(Math.log2(n)), k = n - Math.pow(2, m); return [m, k]; };
  const Xn = (n, om) => { const [m, k] = mk(n); return om >= k / Math.pow(2, m) && om < (k + 1) / Math.pow(2, m) ? 1 : 0; };
  function render() {
    clear(g);
    let n = +sn.value;
    if (mode === 'sub') { n = Math.pow(2, Math.floor(Math.log2(n))); }
    $('#tw-nv').textContent = n;
    const [m, k] = mk(n), a = k / Math.pow(2, m), b = (k + 1) / Math.pow(2, m);
    el('rect', { x: X(a), y: AY - 46, width: X(b) - X(a), height: 40, fill: 'url(#h-blue)' }, g);
    path(SK.rect(X(a), AY - 46, X(b) - X(a), 40, { seed: 20 + n, rough: .4 }), 's-blue', g, { 'stroke-width': 1.4 });
    textSub(g, (X(a) + X(b)) / 2, AY - 52, 'X', String(n), 'lbl-blue', { 'text-anchor': 'middle', 'font-size': 12 }, ' = 1');
    gH.setAttribute('transform', 'translate(' + r1(X(w)) + ',0)');
    // barcode
    const ks = []; if (mode === 'all') { for (let j = 1; j <= n; j++) ks.push(j); } else { for (let j = 1; j <= n; j *= 2) ks.push(j); }
    const BY = 150, BH = 40, total = mode === 'all' ? 63 : 6, cw = (Rx - L) / total;
    text(g, L - 8, BY + BH / 2 + 4, 'X_k(ω)', 'lbl-red', { 'text-anchor': 'end', 'font-size': 11 });
    let ones = 0;
    ks.forEach((j, i) => {
      const v = Xn(j, w); if (v) ones++;
      const x = L + i * cw;
      el('rect', { x: x + .6, y: BY, width: cw - 1.2, height: BH, class: v ? 'f-ink' : 'f-paper', opacity: v ? .9 : .6 }, g);
      if (mode === 'sub' || j === 1 || Math.log2(j) % 1 === 0) text(g, x + cw / 2, BY + BH + 15, String(j), 'lbl', { 'text-anchor': 'middle', 'font-size': 10 });
    });
    if (mode === 'all') for (let mm = 1; mm <= 5; mm++) { const x = L + (Math.pow(2, mm) - 1) * cw; path('M' + r1(x) + ' ' + (BY - 6) + 'L' + r1(x) + ' ' + (BY + BH + 4), 's-soft', g, { 'stroke-dasharray': '2 3', 'stroke-width': .9 }); }
    text(g, L, BY - 12, mode === 'all' ? 'passes: m = 0 | 1 | 2 | 3 | 4 | 5 (dashed lines separate them)' : 'subsequence k = 1, 2, 4, 8, 16, 32', 'lbl', { 'font-size': 11 });
    out.innerHTML = 'n = 2<sup>' + m + '</sup> + ' + k + ':  the blip is [' + (k) + '/' + Math.pow(2, m) + ', ' + (k + 1) + '/' + Math.pow(2, m) + '),  P[X<sub>n</sub> ≠ 0] = 2<sup>−' + m + '</sup> = ' + Math.pow(2, -m).toFixed(4) +
      '.   X<sub>n</sub>(ω) = ' + Xn(n, w) + ';  ' + (mode === 'all' ? 'so far X<sub>k</sub>(ω) = 1 for ' + ones + ' values of k ≤ n (one per pass).' : (w < Math.pow(2, -m) ? 'ω is still inside the first blip of this pass.' : 'ω > 2<sup>−' + m + '</sup>, so X<sub>2<sup>j</sup></sub>(ω) = 0 from now on.'));
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-tw'); pressGroup(btns, mode, 'data-tw'); render(); }));
  sn.addEventListener('input', render);
  playButton($('#tw-play'), () => { let n = +sn.value; if (n >= 63) { sn.value = 1; render(); return; } sn.value = mode === 'sub' ? Math.min(63, Math.pow(2, Math.floor(Math.log2(n)) + 1)) : n + 1; render(); }, '▸ play', 260);
  render();
});

/* ---------- Ch3 · Fig 3.3: map of the modes ---------- */
reg('ch3', 'modes', function () {
  const svg = $('#md-svg'); if (!svg) return;
  const out = $('#md-out');
  const N = { as: [120, 70, 'almost surely'], pr: [360, 70, 'in probability'], di: [600, 70, 'in distribution'], lp: [360, 220, 'in Lᵖ'] };
  const A = [
    ['as', 'pr', true, -1, 'Theorem 3.10(1). If X<sub>n</sub>(ω) → X(ω) for almost every ω, then for each ε the events {|X<sub>n</sub> − X| > ε} happen only finitely often, and Fatou turns that into P(|X<sub>n</sub> − X| > ε) → 0.'],
    ['pr', 'as', false, 1, 'Example 3.9, the moving blip: P(X<sub>n</sub> ≠ 0) → 0, but X<sub>n</sub>(ω) = 1 infinitely often for every ω. Consolation prize (Theorem 3.10(2)): some <i>subsequence</i> converges almost surely.'],
    ['pr', 'di', true, -1, 'If X<sub>n</sub> → X in probability and F is continuous at x, then for small ε, P(X ≤ x − ε) − P(|X<sub>n</sub> − X| > ε) ≤ F<sub>n</sub>(x) ≤ P(X ≤ x + ε) + P(|X<sub>n</sub> − X| > ε). Let n → ∞ and then ε → 0.'],
    ['di', 'pr', false, 1, 'Let X ~ N(0,1) and X<sub>n</sub> = −X for all n. Every X<sub>n</sub> has exactly the law of X, so X<sub>n</sub> → X in distribution trivially, but |X<sub>n</sub> − X| = 2|X| doesn’t shrink. Convergence in distribution only sees laws, not the random variables themselves. (It does imply convergence in probability when the limit is a constant.)'],
    ['lp', 'pr', true, -1, 'Corollary 3.13, by Markov’s inequality: P(|X<sub>n</sub> − X| > ε) ≤ ε<sup>−p</sup> E|X<sub>n</sub> − X|<sup>p</sup>.'],
    ['pr', 'lp', false, 1, 'Example 3.8: the spike n(1 − nx) on [0, 1/n] tends to 0 in probability (even almost surely) but has E|f<sub>n</sub>| = ½ for every n. The mass escapes into a set of vanishing probability.'],
    ['as', 'lp', false, 1, 'Example 3.8 again: almost sure convergence with no convergence in L¹. Chapter 6 identifies exactly what is missing: uniform integrability.'],
    ['lp', 'as', false, -1, 'Example 3.9 again: the moving blip has E|X<sub>n</sub>| = 2<sup>−m</sup> → 0, so it converges in L¹ (in fact in every Lᵖ), yet converges at no point ω ∈ (0,1).']
  ];
  const g = el('g', {}, svg);
  let sel = 0;
  function render() {
    clear(g);
    A.forEach((a, i) => {
      const [x1, y1] = N[a[0]], [x2, y2] = N[a[1]];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
      const off = 11, pad = 62;
      const sx = x1 + ux * pad + nx * off, sy = y1 + uy * (pad * .55) + ny * off, ex = x2 - ux * pad + nx * off, ey = y2 - uy * (pad * .55) + ny * off;
      const gr = el('g', { tabindex: 0, role: 'button', 'aria-pressed': String(i === sel), 'aria-label': (a[2] ? 'implication ' : 'non-implication ') + N[a[0]][2] + ' to ' + N[a[1]][2], style: 'cursor:pointer' }, g);
      el('path', { d: 'M' + sx + ' ' + sy + 'L' + ex + ' ' + ey, stroke: 'transparent', 'stroke-width': 16, fill: 'none' }, gr);
      const c = a[2] ? 'ink' : 'red';
      path(SK.line(sx, sy, ex, ey, { seed: 400 + i, rough: .5 }), 's-' + c, gr, { 'stroke-width': i === sel ? 3 : 1.6, 'stroke-dasharray': a[2] ? null : '6 5' });
      const ah = 9, bx = ex - ux * ah, by = ey - uy * ah;
      path('M' + r1(bx + nx * 5) + ' ' + r1(by + ny * 5) + 'L' + r1(ex) + ' ' + r1(ey) + 'L' + r1(bx - nx * 5) + ' ' + r1(by - ny * 5), 's-' + c, gr, { 'stroke-width': i === sel ? 3 : 1.6 });
      if (!a[2]) text(gr, (sx + ex) / 2 + nx * 10, (sy + ey) / 2 + ny * 10 + 4, '✗', 'lbl-red', { 'text-anchor': 'middle', 'font-size': 12 });
      const act = () => { sel = i; render(); };
      gr.addEventListener('click', act); gr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
    Object.keys(N).forEach((k, i) => {
      const [x, y, lab] = N[k];
      el('rect', { x: x - 64, y: y - 20, width: 128, height: 40, class: 'f-paper' }, g);
      path(SK.loop(x, y, 66, 22, { seed: 600 + i, square: 5, rough: .6 }), 's-ink', g, { 'stroke-width': 1.5 });
      text(g, x, y + 5, lab, 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13.5 });
    });
    const a = A[sel];
    out.innerHTML = '<b>' + N[a[0]][2] + (a[2] ? ' ⟹ ' : ' ⇏ ') + N[a[1]][2] + '.</b> ' + a[4];
  }
  render();
});

/* ---------- Ch3 · Fig 3.4: Jensen ---------- */
reg('ch3', 'jensen', function () {
  const svg = $('#jn-svg'); if (!svg) return;
  const btns = $$('#fig3-4 [data-jf]'), out = $('#jn-out');
  const F = {
    sq: { f: x => x * x, d: x => 2 * x, dom: [-2, 2], ymin: -.4, ymax: 4.2, convex: true },
    exp: { f: x => Math.exp(x), d: x => Math.exp(x), dom: [-2, 1.6], ymin: -.3, ymax: 5.2, convex: true },
    abs: { f: x => Math.abs(x), d: x => (x > 0 ? 1 : x < 0 ? -1 : 0), dom: [-2, 2], ymin: -.3, ymax: 2.2, convex: true },
    cos: { f: x => Math.cos(x), d: x => -Math.sin(x), dom: [-2.6, 2.6], ymin: -1.2, ymax: 1.3, convex: false }
  };
  const wts = [.25, .45, .3];
  let key = 'sq', xs = [-1.5, .2, 1.4];
  const L = 70, Rx = 690, T = 16, B = 270;
  const g = el('g', {}, svg), gH = el('g', {}, svg);
  const handles = wts.map((w, i) => {
    const h = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'value ' + (i + 1) + ' of X' }, gH);
    el('circle', { cx: 0, cy: 0, r: 16, fill: 'transparent' }, h);
    el('circle', { cx: 0, cy: 0, r: 5 + 10 * w, class: 'f-bluew s s-blue knob', 'stroke-width': 1.8 }, h);
    return h;
  });
  function sc() { const m = F[key]; return { X: x => L + (x - m.dom[0]) / (m.dom[1] - m.dom[0]) * (Rx - L), Xi: p => m.dom[0] + (p - L) / (Rx - L) * (m.dom[1] - m.dom[0]), Y: v => B - (v - m.ymin) / (m.ymax - m.ymin) * (B - T) }; }
  handles.forEach((h, i) => {
    drag(h, svg, pt => { const m = F[key]; xs[i] = clamp(sc().Xi(pt.x), m.dom[0] + .02, m.dom[1] - .02); render(); });
    keyNudge(h, () => xs[i], v => { const m = F[key]; xs[i] = clamp(v, m.dom[0] + .02, m.dom[1] - .02); render(); }, .05, .4);
  });
  function render() {
    clear(g);
    const m = F[key], { X, Y } = sc();
    axisLine(g, L, Rx + 4, Y(0), [], {});
    const pts = []; for (let i = 0; i <= 200; i++) { const x = m.dom[0] + (m.dom[1] - m.dom[0]) * i / 200; pts.push([X(x), Y(m.f(x))]); }
    path(poly(pts), 's-ink', g, { 'stroke-width': 2.2 });
    const P = xs.map(x => [x, m.f(x)]);
    const ord = [0, 1, 2].sort((a, b) => P[a][0] - P[b][0]);
    el('path', { d: poly(ord.map(i => [X(P[i][0]), Y(P[i][1])])) + 'Z', class: 'f-ochrew s s-ochre', 'stroke-width': 1, opacity: .8 }, g);
    const EX = wts.reduce((s, w, i) => s + w * xs[i], 0), EF = wts.reduce((s, w, i) => s + w * P[i][1], 0), fE = m.f(EX), a = m.d(EX);
    const xl = m.dom[0], xr = m.dom[1];
    path('M' + r1(X(xl)) + ' ' + r1(Y(fE + a * (xl - EX))) + 'L' + r1(X(xr)) + ' ' + r1(Y(fE + a * (xr - EX))), 's-soft', g, { 'stroke-dasharray': '6 5', 'stroke-width': 1.3 });
    path('M' + r1(X(EX)) + ' ' + r1(Y(fE)) + 'L' + r1(X(EX)) + ' ' + r1(Y(EF)), EF >= fE ? 's-ochre' : 's-red', g, { 'stroke-width': 2.4 });
    el('circle', { cx: X(EX), cy: Y(EF), r: 6, class: 'f-ochre' }, g);
    el('circle', { cx: X(EX), cy: Y(fE), r: 5, class: 'f-red' }, g);
    text(g, X(EX) + 10, Y(EF) - 6, '(E X, E f(X))', 'lbl-ochre', { 'font-size': 11.5 });
    text(g, X(EX) + 10, Y(fE) + 16, '(E X, f(E X))', 'lbl-red', { 'font-size': 11.5 });
    path('M' + X(EX) + ' ' + (Y(fE) + 4) + 'L' + X(EX) + ' ' + B, 's-soft', g, { 'stroke-dasharray': '1 3' });
    text(g, X(EX), B + 16, 'E X', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    handles.forEach((h, i) => h.setAttribute('transform', 'translate(' + r1(X(xs[i])) + ',' + r1(Y(P[i][1])) + ')'));
    const gap = EF - fE;
    out.innerHTML = 'E X = ' + EX.toFixed(3) + '   E f(X) = ' + EF.toFixed(3) + '   f(E X) = ' + fE.toFixed(3) + '   gap = <b class="' + (gap >= -1e-12 ? 'ok' : 'bad') + '">' + gap.toFixed(3) + '</b>' +
      (m.convex ? '' : '<br><span class="bad">cos is not convex on this range, so the dots need not lie above a line through the red point, and the gap can be negative. Drag the dots close together near 0.</span>');
  }
  btns.forEach(b => b.addEventListener('click', () => { key = b.getAttribute('data-jf'); const m = F[key]; xs = xs.map(x => clamp(x, m.dom[0] + .05, m.dom[1] - .05)); pressGroup(btns, key, 'data-jf'); render(); }));
  render();
});

/* ---------- Ch3 · Fig 3.5: Lp balls ---------- */
reg('ch3', 'lpballs', function () {
  const svg = $('#lp-svg'); if (!svg) return;
  const sp = $('#lp-p'), out = $('#lp-out');
  const pOf = s => s >= 100 ? Infinity : Math.pow(10, -0.5 + 1.5 * s / 99.99);
  const CX = 170, CY = 160, S = 62;
  const X = v => CX + v * S, Y = v => CY - v * S;
  let pt = [1.5, .45];
  const norm = (x, p) => p === Infinity ? Math.max(Math.abs(x[0]), Math.abs(x[1])) : Math.pow((Math.pow(Math.abs(x[0]), p) + Math.pow(Math.abs(x[1]), p)) / 2, 1 / p);
  const gA = el('g', {}, svg), g = el('g', {}, svg), gH = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'the random variable X' }, svg);
  axisLine(gA, X(-2.3), X(2.3), CY, [[X(-2), '−2'], [X(-1), '−1'], [X(1), '1'], [X(2), '2']], { dy: 15, fs: 10 });
  path(SK.line(CX, Y(-2.3), CX, Y(2.3), { seed: 3, rough: .4 }), 's-soft', gA, { 'stroke-width': 1.1 });
  text(gA, X(2.3) + 6, CY + 18, 'x₁', 'lbl lbl-serif', { 'font-size': 13 }); text(gA, CX + 8, Y(2.3) + 4, 'x₂', 'lbl lbl-serif', { 'font-size': 13 });
  el('circle', { cx: 0, cy: 0, r: 14, fill: 'transparent' }, gH);
  el('circle', { cx: 0, cy: 0, r: 5.5, class: 'f-red s s-paper knob', 'stroke-width': 1.5 }, gH);
  text(gH, 9, -9, 'X', 'lbl-red lbl-serif', { 'font-size': 15 });
  drag(gH, svg, q => { pt = [clamp((q.x - CX) / S, -2.3, 2.3), clamp((CY - q.y) / S, -2.3, 2.3)]; render(); });
  function ball(p) {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = 2 * Math.PI * i / 240, c = Math.cos(t), s = Math.sin(t);
      const r = p === Infinity ? 1 / Math.max(Math.abs(c), Math.abs(s)) : Math.pow(2 / (Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p)), 1 / p);
      pts.push([X(r * c), Y(r * s)]);
    }
    return poly(pts) + 'Z';
  }
  const ref = [[1, 'p = 1'], [2, '2'], [4, '4'], [Infinity, '∞']];
  ref.forEach((r, i) => { path(ball(r[0]), 's-soft', gA, { 'stroke-width': .9, opacity: .7, 'stroke-dasharray': '3 3' }); });
  text(gA, X(2.04), Y(.14), 'p = 1', 'lbl', { 'font-size': 10 }); text(gA, X(-1.12), Y(1.12), 'p = ∞', 'lbl', { 'font-size': 10, 'text-anchor': 'end' });
  // right plot
  const PL = 410, PR = 700, PT = 30, PB = 280;
  const lx = p => PL + (Math.log10(p) + .5) / 1.5 * (PR - PL);
  function render() {
    clear(g);
    const p = pOf(+sp.value); $('#lp-pv').textContent = p === Infinity ? '∞' : p.toFixed(2);
    el('path', { d: ball(p), class: 'f-bluew s s-blue', 'stroke-width': 2 }, g);
    gH.setAttribute('transform', 'translate(' + r1(X(pt[0])) + ',' + r1(Y(pt[1])) + ')');
    const nmax = Math.max(Math.abs(pt[0]), Math.abs(pt[1]), .2);
    const Yp = v => PB - v / (nmax * 1.1) * (PB - PT);
    axisLine(g, PL, PR + 4, PB, [[lx(.316), '0.3'], [lx(1), '1'], [lx(3.16), '3'], [lx(10), '10']], { dy: 15, fs: 10 });
    vAxis(g, PL, PB, PT - 6, [[Yp(0), '0'], [Yp(nmax), 'max |x_i|']]);
    path('M' + PL + ' ' + r1(Yp(nmax)) + 'L' + PR + ' ' + r1(Yp(nmax)), 's-rule', g, { 'stroke-dasharray': '3 4' });
    const cp = []; for (let i = 0; i <= 120; i++) { const q = Math.pow(10, -.5 + 1.5 * i / 120); cp.push([lx(q), Yp(norm(pt, q))]); }
    path(poly(cp), 's-blue', g, { 'stroke-width': 2 });
    const pc = p === Infinity ? 10 : p;
    el('circle', { cx: lx(pc), cy: Yp(norm(pt, p)), r: 4.5, class: 'f-red' }, g);
    text(g, PL + 6, PT - 10, '‖X‖_p as a function of p', 'lbl-ink', { 'font-size': 11.5 });
    const n = norm(pt, p);
    out.innerHTML = 'X = (' + pt[0].toFixed(2) + ', ' + pt[1].toFixed(2) + '):  ‖X‖<sub>p</sub> = <b>' + n.toFixed(3) + '</b>' + (n <= 1 ? ' ≤ 1, inside the ball' : ' > 1, outside the ball') +
      '.  ‖X‖<sub>1</sub> = ' + norm(pt, 1).toFixed(3) + ' ≤ ‖X‖<sub>2</sub> = ' + norm(pt, 2).toFixed(3) + ' ≤ ‖X‖<sub>∞</sub> = ' + norm(pt, Infinity).toFixed(3) +
      (p < 1 ? '<br><span class="bad">p &lt; 1: the ball is not convex, so the triangle inequality fails and ‖·‖<sub>p</sub> is not a norm.</span>' : '');
  }
  sp.addEventListener('input', render);
  render();
});
