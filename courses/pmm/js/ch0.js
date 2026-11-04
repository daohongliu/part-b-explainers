/* ---------- Ch0 · Fig 0.1: random walks through four lenses ---------- */
reg('ch0', 'walks', function () {
  const cv = $('#rw-canvas'); if (!cv) return;
  const W = 720, H = 300, L = 46, Rr = 708, T = 12, B = 276, NMAX = 20000, KMAX = 200;
  const btns = $$('#fig0-1 [data-sc]'), sk = $('#rw-k'), sn = $('#rw-n'), out = $('#rw-out');
  let mode = 'clt', seed = 1, inc = null;
  function sample() {
    inc = new Int8Array(KMAX * NMAX); const R = rng(seed * 7919 + 13);
    for (let i = 0; i < inc.length; i += 1) inc[i] = R() < .5 ? -1 : 1;
  }
  const nOf = s => Math.round(Math.pow(10, 1 + 3.30103 * s / 100));
  function draw() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
    const K = +sk.value, N = nOf(+sn.value);
    $('#rw-kv').textContent = K; $('#rw-nv').textContent = N.toLocaleString('en-GB');
    const n0 = mode === 'lil' ? 16 : 1;
    const scale = (s, n) => mode === 'raw' ? s : mode === 'lln' ? s / n : mode === 'clt' ? s / Math.sqrt(n) : s / Math.sqrt(n * Math.log(Math.log(n)));
    const ymax = mode === 'raw' ? 3.2 * Math.sqrt(N) : mode === 'lln' ? 1 : mode === 'clt' ? 4 : 3;
    const X = n => L + (n / N) * (Rr - L), Y = v => (T + B) / 2 - v / ymax * (B - T) / 2;
    // axes
    g.strokeStyle = col('--ink-soft'); g.lineWidth = 1; g.globalAlpha = .9;
    g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(Rr, Y(0)); g.moveTo(L, T); g.lineTo(L, B); g.stroke();
    g.fillStyle = col('--ink-soft'); g.font = '11px Recursive, ui-monospace, monospace'; g.textAlign = 'right';
    [ymax, ymax / 2, 0, -ymax / 2, -ymax].forEach(v => g.fillText(Math.abs(v) >= 10 ? Math.round(v) : (+v.toFixed(2)).toString(), L - 6, Y(v) + 4));
    [0, .25, .5, .75, 1].forEach(f => { g.textAlign = f === 1 ? 'right' : 'center'; g.fillText(Math.round(f * N).toLocaleString('en-GB'), X(f * N), B + 16); });
    // bands
    const band = mode === 'clt' ? 2.326 : mode === 'lil' ? Math.SQRT2 : null;
    g.setLineDash([5, 5]); g.strokeStyle = col('--red'); g.lineWidth = 1.3; g.beginPath();
    if (band) { g.moveTo(L, Y(band)); g.lineTo(Rr, Y(band)); g.moveTo(L, Y(-band)); g.lineTo(Rr, Y(-band)); }
    else {
      const env = n => mode === 'raw' ? 2.326 * Math.sqrt(n) : 2.326 / Math.sqrt(n);
      for (const sgn of [1, -1]) { for (let i = 0; i <= 200; i++) { const n = Math.max(1, N * i / 200); const y = Y(sgn * Math.min(env(n), ymax)); if (i) g.lineTo(X(n), y); else g.moveTo(X(n), y); } }
    }
    g.stroke(); g.setLineDash([]);
    // paths
    const stride = Math.max(1, Math.floor(N / 900)); let outside = 0, maxAbs = 0;
    const finals = [];
    for (let k = 0; k < K; k++) {
      let s = 0; const base = k * NMAX; const pts = [];
      for (let n = 1; n <= N; n++) { s += inc[base + n - 1]; if (n >= n0 && (n % stride === 0 || n === N)) pts.push([n, scale(s, n)]); }
      const fin = pts[pts.length - 1][1]; finals.push(fin); maxAbs = Math.max(maxAbs, Math.abs(fin));
      const isOut = band ? Math.abs(fin) > band : (mode === 'raw' ? Math.abs(fin) > 2.326 * Math.sqrt(N) : Math.abs(fin) > 2.326 / Math.sqrt(N));
      if (isOut) outside++;
      g.beginPath(); pts.forEach((p, i) => { const y = Y(clamp(p[1], -ymax * 1.05, ymax * 1.05)); if (i) g.lineTo(X(p[0]), y); else g.moveTo(X(p[0]), y); });
      if (isOut) { g.strokeStyle = col('--red'); g.globalAlpha = .9; g.lineWidth = 1.3; }
      else if (k < 3) { g.strokeStyle = col(k === 1 ? '--ochre' : '--blue'); g.globalAlpha = .95; g.lineWidth = 1.3; }
      else { g.strokeStyle = col('--ink-soft'); g.globalAlpha = K > 60 ? .18 : .32; g.lineWidth = 1; }
      g.stroke();
    }
    g.globalAlpha = 1;
    const pct = (100 * outside / K).toFixed(1);
    if (mode === 'raw') out.innerHTML = 'S<sub>n</sub> itself: the spread keeps growing, like ±√n (dashed: ±2.326√n). Outside at n = ' + N.toLocaleString('en-GB') + ': ' + outside + ' of ' + K + ' paths.';
    else if (mode === 'lln') out.innerHTML = 'S<sub>n</sub>/n: largest |S<sub>N</sub>/N| among the paths = ' + maxAbs.toFixed(3) + '. Everything is being squashed to 0, at rate about 1/√n (dashed).';
    else if (mode === 'clt') out.innerHTML = 'S<sub>n</sub>/√n: outside (−2.326, 2.326) at n = ' + N.toLocaleString('en-GB') + ': <b>' + outside + '</b> of ' + K + ' paths (' + pct + '%; the central limit theorem predicts about 2%).';
    else out.innerHTML = 'S<sub>n</sub>/√(n log log n): ' + outside + ' of ' + K + ' paths currently beyond ±√2. Every path keeps returning near ±√2 forever, but the approach is slow: log log n is only ' + Math.log(Math.log(N)).toFixed(2) + ' here.';
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-sc'); pressGroup(btns, mode, 'data-sc'); draw(); }));
  sk.addEventListener('input', draw); sn.addEventListener('input', draw);
  $('#rw-new').addEventListener('click', () => { seed++; sample(); draw(); });
  sample(); draw();
  window.addEventListener('resize', () => { if (!cv.closest('.view').hidden) draw(); });
});

/* ---------- Ch0 · Fig 0.2: binomial tree ---------- */
reg('ch0', 'binomial', function () {
  const svg = $('#bt-svg'); if (!svg) return;
  const ids = ['n', 'u', 'd', 'r', 'k', 'p'], R = {}, out = $('#bt-out'), fsel = $('#bt-f');
  const fmts = { n: v => v, u: v => v.toFixed(2), d: v => v.toFixed(2), r: v => v.toFixed(3), k: v => v, p: v => v.toFixed(2) };
  ids.forEach(k => { R[k] = bindRange('bt-' + k, 'bt-' + k + 'v', fmts[k], () => render()); });
  fsel.addEventListener('change', () => render());
  const g = el('g', {}, svg);
  let hover = null;
  function payoff(s, K) { const f = fsel.value; return f === 'call' ? Math.max(s - K, 0) : f === 'put' ? Math.max(K - s, 0) : (s > K ? 1 : 0); }
  function render() {
    clear(g);
    const N = +R.n.value, u = +R.u.value, d = +R.d.value, r = +R.r.value, K = +R.k.value, p = +R.p.value, S0 = 100;
    const ok = (1 - d) < (1 + r) && (1 + r) < (1 + u);
    const q = (r + d) / (u + d);
    const S = (i, j) => S0 * Math.pow(1 + u, j) * Math.pow(1 - d, i - j);
    const V = []; V[N] = []; for (let j = 0; j <= N; j++) V[N][j] = payoff(S(N, j), K);
    for (let i = N - 1; i >= 0; i--) { V[i] = []; for (let j = 0; j <= i; j++) V[i][j] = (q * V[i + 1][j + 1] + (1 - q) * V[i + 1][j]) / (1 + r); }
    const sp = Math.min(30, 140 / N), X = i => 70 + i * (600 / N), Yy = (i, j) => 168 - (2 * j - i) * sp;
    for (let i = 0; i < N; i++) for (let j = 0; j <= i; j++) {
      path(SK.line(X(i), Yy(i, j), X(i + 1), Yy(i + 1, j + 1), { seed: 100 + i * 10 + j, rough: .5 }), 's-soft', g, { 'stroke-width': 1.1 });
      path(SK.line(X(i), Yy(i, j), X(i + 1), Yy(i + 1, j), { seed: 200 + i * 10 + j, rough: .5 }), 's-soft', g, { 'stroke-width': 1.1 });
    }
    const fs = N > 4 ? 10.5 : 12, dots = [];
    if (hover && hover[0] > N) hover = null;
    const dotCls = (i, j) => hover && hover[0] === i && hover[1] === j ? 'f-ochre' : (i === N ? 'f-paper s s-ink' : 'f-ink');
    for (let i = 0; i <= N; i++) for (let j = 0; j <= i; j++) {
      const nd = el('g', { tabindex: 0, role: 'button', 'aria-label': 'node at time ' + i + ' after ' + j + ' up moves', style: 'cursor:pointer' }, g);
      el('circle', { cx: X(i), cy: Yy(i, j), r: 14, fill: 'transparent' }, nd);
      dots.push({ i: i, j: j, el: el('circle', { cx: X(i), cy: Yy(i, j), r: 4, class: dotCls(i, j), 'stroke-width': 1.4 }, nd) });
      text(nd, X(i), Yy(i, j) - 8, S(i, j).toFixed(1), 'lbl-ink', { 'text-anchor': 'middle', 'font-size': fs });
      text(nd, X(i), Yy(i, j) + 16, V[i][j].toFixed(2), 'lbl-blue', { 'text-anchor': 'middle', 'font-size': fs });
      const on = () => { if (hover && hover[0] === i && hover[1] === j) return; hover = [i, j]; dots.forEach(o => o.el.setAttribute('class', dotCls(o.i, o.j))); writeOut(); };
      nd.addEventListener('mouseenter', on); nd.addEventListener('focus', on); nd.addEventListener('click', on);
    }
    text(g, X(0), 322, 't = 0', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    text(g, X(N), 322, 't = N = ' + N, 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    text(g, 14, 22, 'price', 'lbl-ink', { 'font-size': 11 }); text(g, 14, 36, 'claim value', 'lbl-blue', { 'font-size': 11 });
    // real-world expectation of the discounted payoff, for contrast
    let EP = 0, EQ = 0, binom = 1;
    for (let j = 0; j <= N; j++) { if (j) binom = binom * (N - j + 1) / j; EP += binom * Math.pow(p, j) * Math.pow(1 - p, N - j) * V[N][j]; EQ += binom * Math.pow(q, j) * Math.pow(1 - q, N - j) * V[N][j]; }
    EP /= Math.pow(1 + r, N); EQ /= Math.pow(1 + r, N);
    function writeOut() {
    let h = '';
    if (hover && hover[0] < N) {
      const [i, j] = hover; const Hh = (V[i + 1][j + 1] - V[i + 1][j]) / (S(i + 1, j + 1) - S(i + 1, j));
      h = '<br>At the highlighted node (S = ' + S(i, j).toFixed(2) + '): hold <b>H = ' + Hh.toFixed(4) + '</b> shares and ' + (V[i][j] - Hh * S(i, j)).toFixed(2) + ' in the bank. Up: ' +
        (Hh * S(i + 1, j + 1) + (V[i][j] - Hh * S(i, j)) * (1 + r)).toFixed(2) + ' = ' + V[i + 1][j + 1].toFixed(2) + '; down: ' + (Hh * S(i + 1, j) + (V[i][j] - Hh * S(i, j)) * (1 + r)).toFixed(2) + ' = ' + V[i + 1][j].toFixed(2) + '.';
    } else if (hover) h = '<br><span class="dim">At time N the claim simply pays out; there is nothing left to hedge.</span>';
    out.innerHTML = (ok ? '' : '<span class="bad">Need 1 − d &lt; 1 + r &lt; 1 + u, otherwise there is a risk-free profit and no sensible price.</span><br>') +
      'risk-neutral q = (r + d)/(u + d) = <b>' + q.toFixed(4) + '</b>    price V<sub>0</sub> = (1+r)<sup>−N</sup> E<sub>Q</sub>[f] = <b>' + EQ.toFixed(4) + '</b>' +
      '<br><span class="dim">For contrast, the real-world average (1+r)<sup>−N</sup> E<sub>P</sub>[f] = ' + EP.toFixed(4) + ', which is not a price anyone can enforce.</span>' + h;
    }
    writeOut();
  }
  render();
});

/* ---------- Ch0 · Fig 0.3: Galton–Watson ---------- */
reg('ch0', 'galton', function () {
  const svg = $('#gw-svg'); if (!svg) return;
  const law = $('#gw-law'), sm = $('#gw-m'), mv = $('#gw-mv'), out = $('#gw-out');
  let seed = 3, firstRender = true;
  const gTree = el('g', {}, svg), gPlot = el('g', {}, svg);
  function pois(R, m) { const Lm = Math.exp(-m); let k = 0, p = 1; do { k++; p *= R(); } while (p > Lm); return k - 1; }
  function child(R, m) { return law.value === 'pois' ? pois(R, m) : (R() < m / 2 ? 2 : 0); }
  function f(t, m) { return law.value === 'pois' ? Math.exp(m * (t - 1)) : (1 - m / 2) + (m / 2) * t * t; }
  function render() {
    if (law.value === 'bin') { sm.max = 2; if (+sm.value > 2) sm.value = 2; } else sm.max = 2.5;
    const m = +sm.value; mv.textContent = m.toFixed(2);
    // tree
    clear(gTree);
    if (firstRender) { firstRender = false; for (let s = 3; s < 80; s++) { const Rt = rng(s * 101 + Math.round(m * 100)); let z = 1, ok = true; for (let k = 0; k < 6; k++) { let nz = 0; for (let i = 0; i < Math.min(z, 48); i++) nz += child(Rt, m); z = nz; if (!z) { ok = false; break; } } if (ok && z < 40) { seed = s; break; } } }
    const R = rng(seed * 101 + Math.round(m * 100)); const G = 8, cap = 48;
    let gen = [{ x: 210 }], Z = [1];
    text(gTree, 6, 18, 'generation', 'lbl', { 'font-size': 10.5 });
    for (let k = 0; k < G; k++) {
      const y = 34 + k * 34, ny = y + 34, next = [];
      gen.forEach((p, i) => { const c = child(R, m); for (let t = 0; t < c; t++) next.push({ par: p }); });
      Z.push(next.length);
      const shown = next.slice(0, cap);
      shown.forEach((c, i) => { c.x = 30 + (shown.length === 1 ? 180 : i * 360 / Math.max(1, shown.length - 1)); });
      shown.forEach(c => { if (c.par.x != null) path('M' + r1(c.par.x) + ' ' + (y + 4) + 'L' + r1(c.x) + ' ' + (ny - 4), 's-soft', gTree, { 'stroke-width': .9 }); });
      gen.forEach(p => { if (p.x != null) el('circle', { cx: r1(p.x), cy: y, r: 3.3, class: 'f-ink' }, gTree); });
      text(gTree, 6, y + 4, String(k), 'lbl', { 'font-size': 10.5 });
      if (next.length > cap) text(gTree, 404, ny + 4, '+' + (next.length - cap), 'lbl-ochre', { 'font-size': 10.5, 'text-anchor': 'end' });
      gen = shown;
      if (!next.length) { text(gTree, 210, ny + 4, 'extinct', 'lbl-red', { 'text-anchor': 'middle', 'font-size': 12 }); break; }
      if (k === G - 1) gen.forEach(p => el('circle', { cx: r1(p.x), cy: ny, r: 3.3, class: 'f-ink' }, gTree));
    }
    // pgf plot
    clear(gPlot);
    const PX = 470, PW = 230, PY = 270, PH = 230, x = t => PX + t * PW, y = v => PY - v * PH;
    axisLine(gPlot, PX, PX + PW + 6, PY, [[x(0), '0'], [x(.5), '½'], [x(1), '1']], { dy: 16, fs: 11 });
    vAxis(gPlot, PX, PY, PY - PH - 6, [[y(0), null], [y(.5), '½'], [y(1), '1']]);
    path('M' + x(0) + ' ' + y(0) + 'L' + x(1) + ' ' + y(1), 's-soft', gPlot, { 'stroke-dasharray': '3 4' });
    const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([x(t), y(f(t, m))]); }
    path(poly(pts), 's-blue', gPlot, { 'stroke-width': 2 });
    text(gPlot, x(.02), y(f(0, m)) - 8, 'f(θ)', 'lbl-blue lbl-serif', { 'font-size': 14 });
    let qn = 0, d = 'M' + x(0) + ' ' + y(0);
    for (let n = 0; n < 40; n++) { const nq = f(qn, m); d += 'L' + r1(x(qn)) + ' ' + r1(y(nq)) + 'L' + r1(x(nq)) + ' ' + r1(y(nq)); qn = nq; }
    path(d, 's-ochre', gPlot, { 'stroke-width': 1.2 });
    let q = 0; for (let n = 0; n < 5000; n++) q = f(q, m);
    el('circle', { cx: x(q), cy: y(q), r: 4.5, class: 'f-red' }, gPlot);
    text(gPlot, x(q) - 6, y(q) - 10, 'q', 'lbl-red lbl-serif', { 'text-anchor': 'end', 'font-size': 15 });
    text(gPlot, PX + PW, PY + 30, 'θ', 'lbl lbl-serif', { 'font-size': 13 });
    // Monte Carlo extinction frequency
    const R2 = rng(seed * 7 + 5 + Math.round(m * 1000)); let died = 0; const TR = 4000;
    for (let t = 0; t < TR; t++) {
      let z = 1;
      for (let gnr = 0; gnr < 60 && z > 0 && z < 400; gnr++) { let nz = 0; for (let i = 0; i < z; i++) nz += child(R2, m); z = nz; }
      if (z === 0) died++;
    }
    const Ms = Z.map((z, n) => (z / Math.pow(m, n)).toFixed(2));
    out.innerHTML = 'm = ' + m.toFixed(2) + (m <= 1 ? ' ≤ 1' : ' > 1') + ':  smallest root q = <b>' + q.toFixed(4) + '</b>,  simulated extinction frequency = ' + (died / TR).toFixed(4) +
      (Math.abs(m - 1) < 1e-9 ? '  <span class="dim">(at m = 1 the staircase creeps towards 1 very slowly)</span>' : '') +
      '<br><span class="dim">this family: Z<sub>n</sub> = ' + Z.join(', ') + ';  M<sub>n</sub> = Z<sub>n</sub>/m<sup>n</sup> = ' + Ms.join(', ') + '</span>';
  }
  law.addEventListener('change', render); sm.addEventListener('input', render);
  $('#gw-new').addEventListener('click', () => { seed++; render(); });
  render();
});
