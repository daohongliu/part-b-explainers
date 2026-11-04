/* ---------- Ch2 · Fig 2.1: Lebesgue vs Riemann ---------- */
reg('ch2', 'lebesgue', function () {
  const svg = $('#lz-svg'); if (!svg) return;
  const btns = $$('#fig2-1 [data-lz]'), sn = $('#lz-n'), sk = $('#lz-k'), out = $('#lz-out');
  const f = x => 1.08 + 0.52 * Math.sin(7.3 * x + .4) + 0.24 * Math.sin(19 * x + 1.1);
  const L = 60, Rx = 690, B = 262, T = 18, YMAX = 2;
  const X = x => L + x * (Rx - L), Y = v => B - v / YMAX * (B - T);
  const NS_ = 1400, xs = [], fs = [];
  for (let i = 0; i <= NS_; i++) { xs.push(i / NS_); fs.push(f(i / NS_)); }
  let exact = 0; for (let i = 0; i < NS_; i++) exact += (fs[i] + fs[i + 1]) / 2 / NS_;
  let mode = 'leb';
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, Rx + 8, B, [[X(0), '0'], [X(.25), '¼'], [X(.5), '½'], [X(.75), '¾'], [X(1), '1']], { dy: 52, fs: 11 });
  vAxis(gA, L, B, T - 6, [[Y(0), '0'], [Y(.5), '½'], [Y(1), '1'], [Y(1.5), '1½'], [Y(2), '2']]);
  function render() {
    clear(g);
    const n = +sn.value, h = Math.pow(2, -n), cap = n;
    const kmax = Math.min(Math.floor(cap / h), Math.ceil(YMAX / h));
    sk.max = Math.max(0, Math.min(kmax, Math.ceil(1.95 / h)));
    if (+sk.value > +sk.max) sk.value = sk.max;
    const k = +sk.value;
    $('#lz-nv').textContent = n + '  (grid 1/' + Math.pow(2, n) + ')';
    $('#lz-kv').textContent = (k * h).toFixed(3) + ' ≤ f < ' + ((k + 1) * h).toFixed(3);
    const phi = v => Math.min(cap, Math.floor(v / h) * h);
    let approx = 0;
    if (mode === 'leb') {
      // staircase phi_n as filled region
      let d = 'M' + X(0) + ' ' + B;
      for (let i = 0; i <= NS_; i++) d += 'L' + r1(X(xs[i])) + ' ' + r1(Y(phi(fs[i])));
      d += 'L' + X(1) + ' ' + B + 'Z';
      el('path', { d: d, class: 'f-ochrew s s-ochre', 'stroke-width': 1.1 }, g);
      for (let i = 0; i < NS_; i++) approx += phi(fs[i]) / NS_;
      // level lines
      for (let j = 0; j * h <= YMAX + 1e-9; j++) if (h >= 1 / 32 || j % 2 === 0) path('M' + L + ' ' + r1(Y(j * h)) + 'L' + Rx + ' ' + r1(Y(j * h)), 's-rule', g, { 'stroke-width': .7 });
      // highlighted band and its preimage
      el('rect', { x: L, y: Y((k + 1) * h), width: Rx - L, height: Y(k * h) - Y((k + 1) * h), class: 'f-bluew' }, g);
      let meas = 0, run = null; const runs = [];
      for (let i = 0; i <= NS_; i++) {
        const inb = fs[i] >= k * h && fs[i] < (k + 1) * h;
        if (inb) { meas += (i < NS_ ? 1 / NS_ : 0); if (run === null) run = xs[i]; }
        if ((!inb || i === NS_) && run !== null) { runs.push([run, xs[i]]); run = null; }
      }
      runs.forEach(rn => { el('rect', { x: X(rn[0]), y: B + 8, width: Math.max(1.2, X(rn[1]) - X(rn[0])), height: 9, class: 'f-blue', opacity: .85 }, g);
        path('M' + r1(X(rn[0])) + ' ' + (B + 6) + 'L' + r1(X(rn[0])) + ' ' + r1(Y(k * h)), 's-blue', g, { 'stroke-dasharray': '1 3', 'stroke-width': .8 }); });
      out.innerHTML = '∫ φ<sub>' + n + '</sub> dλ = Σ<sub>k</sub> (k/2<sup>' + n + '</sup>) · λ(k/2<sup>' + n + '</sup> ≤ f &lt; (k+1)/2<sup>' + n + '</sup>) = <b>' + approx.toFixed(4) + '</b>    ∫ f dλ = ' + exact.toFixed(4) +
        '<br>highlighted band: λ({x : ' + (k * h).toFixed(3) + ' ≤ f(x) &lt; ' + ((k + 1) * h).toFixed(3) + '}) = ' + meas.toFixed(4) + ', spread over ' + runs.length + ' piece' + (runs.length === 1 ? '' : 's') + (n === 1 ? '<br><span class="dim">at n = 1 the cap min(n, ·) flattens everything above height 1</span>' : '');
    } else {
      const m = Math.pow(2, n);
      for (let j = 0; j < m; j++) {
        const a = j / m, b = (j + 1) / m; let lo = Infinity;
        for (let i = Math.floor(a * NS_); i <= Math.ceil(b * NS_); i++) lo = Math.min(lo, fs[i]);
        approx += lo / m;
        el('rect', { x: X(a), y: Y(lo), width: X(b) - X(a), height: B - Y(lo), class: 'f-ochrew' }, g);
        path(SK.rect(X(a), Y(lo), X(b) - X(a), B - Y(lo), { seed: 50 + j, rough: .3 }), 's-ochre', g, { 'stroke-width': .9 });
      }
      out.innerHTML = 'lower Riemann sum with 2<sup>' + n + '</sup> equal pieces = <b>' + approx.toFixed(4) + '</b>    ∫ f dλ = ' + exact.toFixed(4) +
        '<br><span class="dim">Here the pieces of the domain are fixed and their heights vary. Lebesgue fixes the heights and lets the pieces be any measurable sets.</span>';
    }
    const pts = xs.map((x, i) => [X(x), Y(fs[i])]);
    path(poly(pts.filter((_, i) => i % 4 === 0 || i === NS_)), 's-ink', g, { 'stroke-width': 2.1 });
    text(g, X(.965), Y(f(.965)) - 10, 'f', 'lbl-ink lbl-serif', { 'font-size': 16 });
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-lz'); pressGroup(btns, mode, 'data-lz'); render(); }));
  sn.addEventListener('input', render); sk.addEventListener('input', render);
  render();
});

/* ---------- Ch2 · Fig 2.2: convergence lab ---------- */
reg('ch2', 'convergence', function () {
  const svg = $('#cv-svg'); if (!svg) return;
  const btns = $$('#fig2-2 [data-cv]'), sn = $('#cv-n'), out = $('#cv-out');
  const M = {
    spike: { dom: [0, 1.05], ymax: 12, f: (n, x) => (x > 0 && x < 1 / n ? n : 0), lim: () => 0, I: n => 1, Ilim: 0, env: x => (x <= 0 ? 0 : Math.floor(1 / x) + (Math.abs(1 / x - Math.round(1 / x)) < 1e-12 ? -1 : 0)), envI: '∞',
             say: 'Every point x > 0 is eventually outside (0, 1/n), so f<sub>n</sub> → 0 pointwise, but ∫ f<sub>n</sub> = 1. The mass escapes <i>upwards</i> into an ever taller, thinner spike.' },
    slide: { dom: [0, 13], ymax: 1.6, f: (n, x) => (x >= n && x <= n + 1 ? 1 : 0), lim: () => 0, I: n => 1, Ilim: 0, env: x => (x >= 1 ? 1 : 0), envI: '∞',
             say: 'Each point is passed once and then left behind, so f<sub>n</sub> → 0 pointwise, but ∫ f<sub>n</sub> = 1. The mass escapes <i>sideways</i> to infinity.' },
    spread: { dom: [0, 13], ymax: 1.2, f: (n, x) => (x >= 0 && x <= n ? 1 / n : 0), lim: () => 0, I: n => 1, Ilim: 0, env: x => (x < 0 ? 0 : 1 / Math.max(1, Math.ceil(x))), envI: '∞ (it is Σ 1/k)',
             say: 'f<sub>n</sub> → 0 uniformly, even, but ∫ f<sub>n</sub> = 1. The mass escapes <i>outwards</i>, spread ever thinner over an ever longer interval.' },
    dom: { dom: [0, 1.05], ymax: 1.2, f: (n, x) => (x >= 0 && x <= 1 ? Math.pow(x, n) : 0), lim: x => (x === 1 ? 1 : 0), I: n => 1 / (n + 1), Ilim: 0, env: x => (x >= 0 && x <= 1 ? x : 0), envI: '½',
             say: 'f<sub>n</sub> → 0 except at the single point x = 1 (a null set), and every f<sub>n</sub> sits under the integrable roof g = 1 on [0,1]. Dominated convergence applies: ∫ f<sub>n</sub> = 1/(n+1) → 0.' },
    mono: { dom: [0, 1.05], ymax: 6, f: (n, x) => (x > 0 && x <= 1 ? Math.min(n, 1 / Math.sqrt(x)) : 0), lim: x => (x > 0 && x <= 1 ? 1 / Math.sqrt(x) : 0), I: n => 2 - 1 / n, Ilim: 2, env: x => (x > 0 && x <= 1 ? 1 / Math.sqrt(x) : 0), envI: '2',
             say: 'f<sub>n</sub> ↑ f = x<sup>−1/2</sup>, an unbounded function, and the Monotone Convergence Theorem gives ∫ f<sub>n</sub> = 2 − 1/n ↑ 2 = ∫ f. No roof is needed for increasing non-negative sequences.' }
  };
  let mode = 'spike';
  const g = el('g', {}, svg);
  const L = 54, Rx = 690, B = 262, T = 16;
  function render() {
    clear(g);
    const m = M[mode], n = +sn.value; $('#cv-nv').textContent = n;
    const X = x => L + (x - m.dom[0]) / (m.dom[1] - m.dom[0]) * (Rx - L), Y = v => B - Math.min(v, m.ymax * 1.04) / m.ymax * (B - T);
    const tk = []; const step = m.dom[1] > 5 ? 1 : .25; for (let t = 0; t <= m.dom[1] + 1e-9; t += step) tk.push([X(t), m.dom[1] > 5 ? String(t) : (t === 0 ? '0' : t === 1 ? '1' : t.toFixed(2))]);
    axisLine(g, L, Rx + 6, B, tk, { dy: 17, fs: 10.5 });
    const yt = [0, m.ymax / 2, m.ymax].map(v => [Y(v), v % 1 ? v.toFixed(1) : String(v)]);
    vAxis(g, L, B, T - 6, yt);
    const NSmp = 1400, sample = fn => { const p = []; for (let i = 0; i <= NSmp; i++) { const x = m.dom[0] + (m.dom[1] - m.dom[0]) * i / NSmp; p.push([X(x), Y(fn(x))]); } return p; };
    // envelope
    path(poly(sample(m.env)), 's-red', g, { 'stroke-width': 1.4, 'stroke-dasharray': '5 4' });
    // earlier f_k faint
    for (let k = Math.max(1, n - 3); k < n; k++) path(poly(sample(x => m.f(k, x))), 's-soft', g, { 'stroke-width': 1, opacity: .45 });
    // f_n filled
    const pn = sample(x => m.f(n, x));
    el('path', { d: poly(pn) + 'L' + X(m.dom[1]) + ' ' + B + 'L' + X(m.dom[0]) + ' ' + B + 'Z', fill: 'url(#h-blue)' }, g);
    path(poly(pn), 's-blue', g, { 'stroke-width': 2.2 });
    // limit
    path(poly(sample(m.lim)), 's-ink', g, { 'stroke-width': 2.4, opacity: .85 });
    text(g, Rx - 4, T + 10, 'envelope sup f_k', 'lbl-red', { 'text-anchor': 'end', 'font-size': 11 });
    const In = m.I(n);
    const lab = mode === 'dom' ? 'DCT applies' : mode === 'mono' ? 'MCT applies' : 'no domination';
    out.innerHTML = '∫ f<sub>' + n + '</sub> = <b>' + (In % 1 ? In.toFixed(4) : In) + '</b>    ∫ lim f<sub>n</sub> = ' + m.Ilim + '    ∫ envelope = ' + m.envI + '    <span class="' + (mode === 'dom' || mode === 'mono' ? 'ok' : 'bad') + '">' + lab + '</span>' +
      '<br><span class="dim">' + m.say + (mode === 'dom' || mode === 'mono' ? '' : ' Fatou: ∫ lim inf f<sub>n</sub> = 0 ≤ 1 = lim inf ∫ f<sub>n</sub>, strictly.') + '</span>';
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-cv'); pressGroup(btns, mode, 'data-cv'); render(); }));
  sn.addEventListener('input', render);
  render();
});

/* ---------- Ch2 · Fig 2.3: Fubini fails ---------- */
reg('ch2', 'fubini', function () {
  const svg = $('#fb-svg'); if (!svg) return;
  const btns = $$('#fig2-3 [data-fb]'), out = $('#fb-out');
  const K = 8, cs = 34, X0 = 150, Y0 = 26;
  const a = (i, j) => (i === j ? 1 : j === i + 1 ? -1 : 0);
  let mode = null, hov = null;
  const g = el('g', {}, svg);
  const setHov = h => { if (String(h) === String(hov)) return; hov = h; render(); };
  function render() {
    clear(g);
    for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
      const x = X0 + j * cs, y = Y0 + i * cs, v = a(i, j);
      const hl = (mode === 'rows' || (hov && hov[0] === 'r' && hov[1] === i)) && (!hov || hov[0] !== 'r' || hov[1] === i) ? (hov && hov[0] === 'r' ? 'row' : 'r') : null;
      const inRow = hov && hov[0] === 'r' && hov[1] === i, inCol = hov && hov[0] === 'c' && hov[1] === j;
      if (inRow || inCol) el('rect', { x: x + 1, y: y + 1, width: cs - 2, height: cs - 2, class: 'f-ochrew' }, g);
      text(g, x + cs / 2, y + cs / 2 + 5, v === 0 ? '0' : (v > 0 ? '1' : '−1'), v > 0 ? 'lbl-blue' : v < 0 ? 'lbl-red' : 'lbl', { 'text-anchor': 'middle', 'font-size': v ? 15 : 12, opacity: v ? 1 : .45 });
    }
    path(SK.rect(X0, Y0, K * cs, K * cs, { seed: 7, rough: .5 }), 's-soft', g, { 'stroke-width': 1.1 });
    for (let i = 0; i < K; i++) {
      const rs = el('g', { style: 'cursor:pointer' }, g);
      el('rect', { x: X0 + K * cs + 6, y: Y0 + i * cs, width: 60, height: cs, fill: 'transparent' }, rs);
      text(rs, X0 + K * cs + 34, Y0 + i * cs + cs / 2 + 5, '0', mode === 'rows' ? 'lbl-ink' : 'lbl', { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': mode === 'rows' ? 700 : 400 });
      rs.addEventListener('mouseenter', () => setHov(['r', i])); rs.addEventListener('mouseleave', () => setHov(null));
      const csm = el('g', { style: 'cursor:pointer' }, g);
      el('rect', { x: X0 + i * cs, y: Y0 + K * cs + 4, width: cs, height: 28, fill: 'transparent' }, csm);
      text(csm, X0 + i * cs + cs / 2, Y0 + K * cs + 22, i === 0 ? '1' : '0', mode === 'cols' ? 'lbl-ink' : 'lbl', { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': mode === 'cols' ? 700 : 400 });
      csm.addEventListener('mouseenter', () => setHov(['c', i])); csm.addEventListener('mouseleave', () => setHov(null));
    }
    text(g, X0 + K * cs + 34, Y0 - 8, 'row sum', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    text(g, X0 - 12, Y0 + K * cs + 22, 'column sum', 'lbl', { 'text-anchor': 'end', 'font-size': 11 });
    text(g, X0 + K * cs + 12, Y0 + K * cs + 22, '⋱', 'lbl', { 'font-size': 14 });
    text(g, X0 + K * cs / 2, Y0 + K * cs + 52, '…and so on forever', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    if (mode === 'rows') { text(g, 610, Y0 + K * cs / 2, 'Σ = 0', 'lbl-ink', { 'font-size': 20, 'font-weight': 700 }); }
    if (mode === 'cols') { text(g, X0 + K * cs / 2, Y0 + K * cs + 76, 'Σ = 1', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700 }); }
    let msg = mode === 'rows' ? 'Σ<sub>i</sub> Σ<sub>j</sub> a<sub>ij</sub> = Σ<sub>i</sub> 0 = <b>0</b>' : mode === 'cols' ? 'Σ<sub>j</sub> Σ<sub>i</sub> a<sub>ij</sub> = 1 + 0 + 0 + … = <b>1</b>' : 'Pick an order of summation, or hover over a row or column sum.';
    if (hov) msg += '<br><span class="dim">' + (hov[0] === 'r' ? 'row ' + (hov[1] + 1) + ': 1 + (−1) = 0' : 'column ' + (hov[1] + 1) + ': ' + (hov[1] === 0 ? 'just the 1 on the diagonal' : '(−1) from the row above, + 1 on the diagonal = 0')) + '</span>';
    out.innerHTML = msg + '<br><span class="dim">Σ<sub>i,j</sub> |a<sub>ij</sub>| = 1 + 1 + 1 + … = ∞, so the double sum has no meaning on its own.</span>';
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-fb'); pressGroup(btns, mode, 'data-fb'); render(); }));
  render();
});

/* ---------- Ch2 · Fig 2.4: random series and the 0-1 law ---------- */
reg('ch2', 'series01', function () {
  const cv = $('#rs-canvas'); if (!cv) return;
  const sp = $('#rs-p'), out = $('#rs-out');
  const W = 720, H = 290, L = 46, Rr = 708, T = 12, B = 260, NMAX = 6000, KP = 40;
  let seed = 4, signs = null;
  function sample() { const R = rng(seed * 31 + 7); signs = new Int8Array(KP * NMAX); for (let i = 0; i < signs.length; i++) signs[i] = R() < .5 ? -1 : 1; }
  function draw() {
    const p = +sp.value; $('#rs-pv').textContent = p.toFixed(2);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
    const lx = n => L + Math.log10(n) / Math.log10(NMAX) * (Rr - L);
    // compute paths
    const paths = []; let ymax = 0;
    for (let k = 0; k < KP; k++) { let s = 0; const pts = []; for (let n = 1; n <= NMAX; n++) { s += signs[k * NMAX + n - 1] / Math.pow(n, p); if (n < 50 || n % 5 === 0) pts.push([n, s]); } paths.push(pts); pts.forEach(q => { ymax = Math.max(ymax, Math.abs(q[1])); }); }
    ymax = Math.max(2, Math.ceil(ymax));
    const Y = v => (T + B) / 2 - v / ymax * (B - T) / 2;
    g.strokeStyle = col('--ink-soft'); g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(Rr, Y(0)); g.moveTo(L, T); g.lineTo(L, B); g.stroke();
    g.fillStyle = col('--ink-soft'); g.font = '11px Recursive, ui-monospace, monospace'; g.textAlign = 'center';
    [1, 10, 100, 1000].forEach(n => g.fillText(String(n), lx(n), B + 16)); g.fillText('n', Rr - 6, B + 16);
    g.textAlign = 'right'; [ymax, 0, -ymax].forEach(v => g.fillText(String(v), L - 6, Y(v) + 4));
    paths.forEach((pts, k) => {
      g.beginPath(); pts.forEach((q, i) => { const x = lx(q[0]), y = Y(q[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.strokeStyle = col(k === 0 ? '--blue' : k === 1 ? '--ochre' : '--ink-soft'); g.globalAlpha = k < 2 ? .95 : .3; g.lineWidth = k < 2 ? 1.4 : 1; g.stroke();
    });
    g.globalAlpha = 1;
    let v = 0; for (let n = 1; n <= 200000; n++) v += Math.pow(n, -2 * p);
    const conv = p > .5;
    out.innerHTML = 'Σ<sub>k</sub> Var(ε<sub>k</sub>/k<sup>p</sup>) = Σ k<sup>−2p</sup> ' + (conv ? '= ' + v.toFixed(3) + ' &lt; ∞' : 'diverges (2p ≤ 1)') + '.    P(series converges) = <b>' + (conv ? '1' : '0') + '</b>' +
      '<br><span class="dim">The 0-1 law alone says only “0 or 1”. Which one it is depends on whether the variances are summable, a fact we will be able to prove with martingales in Chapter 6.</span>';
  }
  sp.addEventListener('input', draw);
  $('#rs-new').addEventListener('click', () => { seed++; sample(); draw(); });
  sample(); draw();
});
