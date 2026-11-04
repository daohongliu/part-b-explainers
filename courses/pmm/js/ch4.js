/* ---------- Ch4 · Fig 4.1: beat the average ---------- */
reg('ch4', 'bestguess', function () {
  const svg = $('#bg4-svg'); if (!svg) return;
  const sa = $('#bg4-a'), sb = $('#bg4-b'), out = $('#bg4-out');
  const X = w => 0.95 + 0.75 * Math.sin(6.2 * w + .3) + 0.45 * w;
  const L = 60, Rx = 690, T = 16, B = 250, YMIN = -.5, YMAX = 2.5;
  const px = w => L + w * (Rx - L), py = v => B - (v - YMIN) / (YMAX - YMIN) * (B - T), pxi = p => (p - L) / (Rx - L);
  let b1 = .28, b2 = .58;
  const N = 800, ws = [], xs = [];
  for (let i = 0; i <= N; i++) { ws.push(i / N); xs.push(X(i / N)); }
  const gA = el('g', {}, svg), g = el('g', {}, svg), gH = el('g', {}, svg);
  axisLine(gA, L, Rx + 6, py(0), [[px(0), '0'], [px(.5), '½'], [px(1), '1']], { dy: 16, fs: 11 });
  vAxis(gA, L, B, T - 6, [[py(0), '0'], [py(1), '1'], [py(2), '2']]);
  function mkH(name) {
    const h = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'end of B: ' + name }, gH);
    el('rect', { x: -12, y: B - 8, width: 24, height: 34, fill: 'transparent' }, h);
    el('path', { d: 'M0 ' + (B - 2) + 'L-6.5 ' + (B + 11) + 'L6.5 ' + (B + 11) + 'Z', class: 's s-ink f-paper knob', 'stroke-width': 1.5 }, h);
    return h;
  }
  const h1 = mkH('left'), h2 = mkH('right');
  drag(h1, svg, p => { b1 = clamp(pxi(p.x), 0, b2 - .04); render(); });
  drag(h2, svg, p => { b2 = clamp(pxi(p.x), b1 + .04, 1); render(); });
  keyNudge(h1, () => b1, v => { b1 = clamp(v, 0, b2 - .04); render(); }, .01, .1);
  keyNudge(h2, () => b2, v => { b2 = clamp(v, b1 + .04, 1); render(); }, .01, .1);
  function stats() {
    let sB = 0, nB = 0, sC = 0, nC = 0;
    for (let i = 0; i < N; i++) { const w = (i + .5) / N, v = X(w); if (w >= b1 && w <= b2) { sB += v; nB++; } else { sC += v; nC++; } }
    return { mB: nB ? sB / nB : 0, mC: nC ? sC / nC : 0, pB: nB / N };
  }
  const mse = (a, b) => { let s = 0; for (let i = 0; i < N; i++) { const w = (i + .5) / N, v = X(w), y = (w >= b1 && w <= b2) ? a : b; s += (v - y) * (v - y); } return s / N; };
  function render() {
    clear(g);
    const a = +sa.value, b = +sb.value, st = stats();
    $('#bg4-av').textContent = a.toFixed(2); $('#bg4-bv').textContent = b.toFixed(2);
    el('rect', { x: px(b1), y: T, width: px(b2) - px(b1), height: B - T, class: 'f-bluew' }, g);
    text(g, (px(b1) + px(b2)) / 2, T + 14, 'B', 'lbl-blue lbl-serif', { 'text-anchor': 'middle', 'font-size': 16 });
    // area between X and guess, signed
    const seg2 = (lo, hi, lvl, cls) => {
      if (hi <= lo) return;
      let d = 'M' + r1(px(lo)) + ' ' + r1(py(lvl));
      for (let i = 0; i <= 120; i++) { const w = lo + (hi - lo) * i / 120; d += 'L' + r1(px(w)) + ' ' + r1(py(X(w))); }
      d += 'L' + r1(px(hi)) + ' ' + r1(py(lvl)) + 'Z';
      el('path', { d: d, fill: 'url(#h-' + cls + ')', opacity: .7 }, g);
    };
    seg2(b1, b2, a, 'blue'); seg2(0, b1, b, 'ochre'); seg2(b2, 1, b, 'ochre');
    const pts = ws.map((w, i) => [px(w), py(xs[i])]);
    path(poly(pts.filter((_, i) => i % 4 === 0 || i === N)), 's-ink', g, { 'stroke-width': 2.1 });
    text(g, px(.985), py(X(.985)) - 10, 'X', 'lbl-ink lbl-serif', { 'font-size': 16 });
    const hl = (lo, hi, v, cls, dash) => { if (hi > lo) path('M' + r1(px(lo)) + ' ' + r1(py(v)) + 'L' + r1(px(hi)) + ' ' + r1(py(v)), cls, g, { 'stroke-width': dash ? 1.3 : 2.6, 'stroke-dasharray': dash ? '5 4' : null }); };
    hl(b1, b2, st.mB, 's-blue', true); hl(0, b1, st.mC, 's-ochre', true); hl(b2, 1, st.mC, 's-ochre', true);
    hl(b1, b2, a, 's-blue'); hl(0, b1, b, 's-ochre'); hl(b2, 1, b, 's-ochre');
    h1.setAttribute('transform', 'translate(' + r1(px(b1)) + ',0)'); h2.setAttribute('transform', 'translate(' + r1(px(b2)) + ',0)');
    const m = mse(a, b), mmin = mse(st.mB, st.mC);
    out.innerHTML = 'your E[(X − Y)²] = <b>' + m.toFixed(4) + '</b>    best possible = ' + mmin.toFixed(4) + (m - mmin < 5e-5 ? '  <span class="ok">you found it</span>' : '') +
      '<br><span class="dim">P(B) = ' + st.pB.toFixed(3) + ',  E[X | B] = ' + st.mB.toFixed(3) + ',  E[X | Bᶜ] = ' + st.mC.toFixed(3) + '.  The error is (bias)² + (spread) on each piece, so the best guess on each piece is its average.</span>';
  }
  sa.addEventListener('input', render); sb.addEventListener('input', render);
  $('#bg4-snap').addEventListener('click', () => { const st = stats(); sa.value = st.mB.toFixed(2); sb.value = st.mC.toFixed(2); render(); });
  render();
});

/* ---------- Ch4 · Fig 4.2: dyadic information ---------- */
reg('ch4', 'dyadic', function () {
  const svg = $('#dy-svg'); if (!svg) return;
  const sn = $('#dy-n'), sk = $('#dy-k'), out = $('#dy-out');
  const X = w => 0.9 + 0.6 * Math.sin(9 * w) + 0.25 * Math.sin(31 * w + 1) + (w > .62 ? .55 : 0);
  const L = 60, Rx = 690, T = 16, B = 260, YMIN = 0, YMAX = 2.4;
  const px = w => L + w * (Rx - L), py = v => B - (v - YMIN) / (YMAX - YMIN) * (B - T);
  const N = 4096, xs = []; for (let i = 0; i < N; i++) xs.push(X((i + .5) / N));
  const blockAvg = lvl => { const m = 1 << lvl, sz = N / m, av = []; for (let j = 0; j < m; j++) { let s = 0; for (let i = j * sz; i < (j + 1) * sz; i++) s += xs[i]; av.push(s / sz); } return av; };
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, Rx + 6, B, [[px(0), '0'], [px(.25), '¼'], [px(.5), '½'], [px(.75), '¾'], [px(1), '1']], { dy: 16, fs: 11 });
  vAxis(gA, L, B, T - 6, [[py(0), '0'], [py(1), '1'], [py(2), '2']]);
  function steps(av, cls, w, dash) {
    const m = av.length; let d = '';
    av.forEach((v, j) => { d += (j ? 'L' : 'M') + r1(px(j / m)) + ' ' + r1(py(v)) + 'L' + r1(px((j + 1) / m)) + ' ' + r1(py(v)); });
    path(d, cls, g, { 'stroke-width': w, 'stroke-dasharray': dash || null });
  }
  function render() {
    clear(g);
    const n = +sn.value; if (+sk.value > n) sk.value = n;
    const k = +sk.value;
    $('#dy-nv').textContent = n + ' (' + (1 << n) + ' pieces)'; $('#dy-kv').textContent = k < 0 ? 'off' : k;
    const av = blockAvg(n), m = 1 << n;
    for (let j = 1; j < m && m <= 64; j++) path('M' + r1(px(j / m)) + ' ' + T + 'L' + r1(px(j / m)) + ' ' + B, 's-rule', g, { 'stroke-width': .7 });
    const pts = []; for (let i = 0; i < N; i += 8) pts.push([px((i + .5) / N), py(xs[i])]);
    path(poly(pts), 's-ink', g, { 'stroke-width': 1.6, opacity: .75 });
    // fill between X and its conditional expectation
    let d = 'M' + px(0) + ' ' + py(av[0]);
    for (let i = 0; i < N; i += 8) d += 'L' + r1(px((i + .5) / N)) + ' ' + r1(py(xs[i]));
    for (let j = m - 1; j >= 0; j--) d += 'L' + r1(px((j + 1) / m)) + ' ' + r1(py(av[j])) + 'L' + r1(px(j / m)) + ' ' + r1(py(av[j]));
    el('path', { d: d + 'Z', fill: 'url(#h-blue)', opacity: .5 }, g);
    steps(av, 's-blue', 2.6);
    if (k >= 0) {
      const tw = []; const r = 1 << (n - k);
      for (let j = 0; j < (1 << k); j++) { let s = 0; for (let i = 0; i < r; i++) s += av[j * r + i]; tw.push(s / r); }
      steps(tw, 's-ochre', 2.2, '7 5');
      const direct = blockAvg(k); let diff = 0; direct.forEach((v, j) => { diff = Math.max(diff, Math.abs(v - tw[j])); });
      text(g, Rx, T + 12, 'E[ E[X|G_' + n + '] | G_' + k + ' ]', 'lbl-ochre', { 'text-anchor': 'end', 'font-size': 12 });
      var towerMsg = '<br><span class="ok">Tower: E[E[X | G<sub>' + n + '</sub>] | G<sub>' + k + '</sub>] and E[X | G<sub>' + k + '</sub>] differ by at most ' + diff.toExponential(1) + ' (rounding).</span>';
    }
    text(g, px(.99), py(X(.99)) + 18, 'X', 'lbl-ink lbl-serif', { 'font-size': 15 });
    let err = 0; for (let i = 0; i < N; i++) { const e = xs[i] - av[Math.floor(i / (N / m))]; err += e * e; } err = Math.sqrt(err / N);
    out.innerHTML = '‖X − E[X | G<sub>' + n + '</sub>]‖<sub>2</sub> = <b>' + err.toFixed(4) + '</b>.  On each piece the hatched area above the blue line equals the area below it: that is the defining relation <a class="xref" href="#eq14">(14)</a> for that piece.' + (k >= 0 ? towerMsg : '');
  }
  sn.addEventListener('input', render); sk.addEventListener('input', render);
  render();
});

/* ---------- Ch4 · Fig 4.3: projection ---------- */
reg('ch4', 'projection', function () {
  const svg = $('#pj-svg'); if (!svg) return;
  const s = [1, 2, 3].map(i => $('#pj-' + i)), out = $('#pj-out');
  const O = [330, 200];
  const e1 = [-82, 14], e2 = [26, 46], e3 = [0, -72];
  const P = v => [O[0] + v[0] * e1[0] + v[1] * e2[0] + v[2] * e3[0], O[1] + v[0] * e1[1] + v[1] * e2[1] + v[2] * e3[1]];
  const g = el('g', {}, svg), gA = el('g', {}, svg);
  [[e1, 'ω = 1'], [e2, 'ω = 2'], [e3, 'ω = 3']].forEach((a, i) => {
    const v = [0, 0, 0]; v[i] = 2.1; const p = P(v);
    path(SK.line(O[0], O[1], p[0], p[1], { seed: 30 + i, rough: .4 }), 's-soft', gA, { 'stroke-width': 1.1 });
    text(gA, p[0] + (i === 0 ? -6 : 6), p[1] + (i === 2 ? -6 : 14), a[1], 'lbl', { 'font-size': 11, 'text-anchor': i === 0 ? 'end' : 'start' });
  });
  function render() {
    clear(g);
    const x = s.map(r => +r.value); s.forEach((r, i) => { $('#pj-' + (i + 1) + 'v').textContent = (+r.value).toFixed(2); });
    const y = [(x[0] + x[1]) / 2, (x[0] + x[1]) / 2, x[2]];
    // plane K: span of (1,1,0) and (0,0,1)
    const c = [[-1.2, -1.2, -.4], [1.6, 1.6, -.4], [1.6, 1.6, 1.6], [-1.2, -1.2, 1.6]].map(P);
    el('path', { d: poly(c) + 'Z', class: 'f-ochrew s s-ochre', 'stroke-width': 1, opacity: .75 }, g);
    text(g, c[3][0] + 10, c[3][1] + 16, 'K = {Y(1) = Y(2)}', 'lbl-ochre', { 'font-size': 12 });
    const pX = P(x), pY = P(y);
    path(SK.line(O[0], O[1], pX[0], pX[1], { seed: 41, rough: .3 }), 's-blue', g, { 'stroke-width': 2.4 });
    el('circle', { cx: pX[0], cy: pX[1], r: 4.5, class: 'f-blue' }, g);
    text(g, pX[0] + 8, pX[1] - 6, 'X', 'lbl-blue lbl-serif', { 'font-size': 16 });
    path(SK.line(O[0], O[1], pY[0], pY[1], { seed: 42, rough: .3 }), 's-ochre', g, { 'stroke-width': 2.4 });
    el('circle', { cx: pY[0], cy: pY[1], r: 4.5, class: 'f-ochre' }, g);
    text(g, pY[0] + 8, pY[1] + 16, 'E[X | G]', 'lbl-ochre', { 'font-size': 12.5 });
    path('M' + r1(pX[0]) + ' ' + r1(pX[1]) + 'L' + r1(pY[0]) + ' ' + r1(pY[1]), 's-red', g, { 'stroke-width': 1.8, 'stroke-dasharray': '5 4' });
    // right-angle mark (in 3D, then projected)
    const dv = [x[0] - y[0], x[1] - y[1], x[2] - y[2]], dl = Math.hypot(...dv);
    if (dl > .08) {
      const u = dv.map(t => t / dl * .18), w = [.13, .13, 0];
      const q1 = P([y[0] + u[0], y[1] + u[1], y[2] + u[2]]), q2 = P([y[0] + u[0] + w[0], y[1] + u[1] + w[1], y[2] + u[2]]), q3 = P([y[0] + w[0], y[1] + w[1], y[2]]);
      path('M' + r1(q1[0]) + ' ' + r1(q1[1]) + 'L' + r1(q2[0]) + ' ' + r1(q2[1]) + 'L' + r1(q3[0]) + ' ' + r1(q3[1]), 's-red', g, { 'stroke-width': 1.1 });
    }
    el('circle', { cx: O[0], cy: O[1], r: 3, class: 'f-ink' }, g);
    const ip = (a, b) => (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / 3;
    const err = [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
    out.innerHTML = 'X = (' + x.map(t => t.toFixed(2)).join(', ') + ')   E[X | G] = (' + y.map(t => t.toFixed(2)).join(', ') + '): average X over {1, 2}, keep X(3).' +
      '<br>E[(X − E[X|G]) 1<sub>{1,2}</sub>] = ' + fmt(ip(err, [1, 1, 0])) + ',   E[(X − E[X|G]) 1<sub>{3}</sub>] = ' + fmt(ip(err, [0, 0, 1])) + '  <span class="ok">orthogonal to K, so the defining relation holds</span>' +
      '<br><span class="dim">squared distance to the plane ‖X − E[X|G]‖² = ' + ip(err, err).toFixed(4) + '; any other point of K is further away.</span>';
  }
  s.forEach(r => r.addEventListener('input', render));
  render();
});
