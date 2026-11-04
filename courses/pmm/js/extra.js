/* ---------- Ch5 · stopping times on three coin tosses ---------- */
reg('ch5', 'filtration', function () {
  const svg = $('#ft-svg'); if (!svg) return;
  const out = $('#ft-out');
  const OM = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];
  const TAU = {
    first: s => { const i = s.indexOf('H'); return i < 0 ? Infinity : i + 1; },
    second: s => { let c = 0; for (let i = 0; i < 3; i++) { if (s[i] === 'H') c++; if (c === 2) return i + 1; } return Infinity; },
    const: () => 2,
    last: s => { const i = s.lastIndexOf('T'); return i < 0 ? 0 : i + 1; }
  };
  let mode = 'first';
  const L = 92, CW = 76, T = 40, RH = 58;
  const g = el('g', {}, svg);
  function render() {
    clear(g);
    const tau = TAU[mode];
    OM.forEach((s, j) => { text(g, L + j * CW + CW / 2, 22, s, 'lbl', { 'text-anchor': 'middle', style: 'font-size:13px;letter-spacing:.08em' }); });
    let allOk = true; const bad = [];
    for (let n = 0; n <= 3; n++) {
      const y = T + n * RH;
      text(g, L - 14, y + 30, 'n = ' + n, 'lbl', { 'text-anchor': 'end' });
      /* shaded cells: tau = n */
      OM.forEach((s, j) => { if (tau(s) === n) el('rect', { x: L + j * CW + 3, y: y + 6, width: CW - 6, height: RH - 16, class: 'f-blue', opacity: .28, rx: 4 }, g); });
      /* atoms of F_n: blocks of 2^(3-n) consecutive outcomes */
      const bs = Math.pow(2, 3 - n);
      for (let b = 0; b < 8 / bs; b++) {
        const cells = OM.slice(b * bs, b * bs + bs), hits = cells.filter(s => tau(s) === n).length;
        const cut = hits > 0 && hits < cells.length; if (cut) { allOk = false; bad.push(n); }
        path(SK.rect(L + b * bs * CW + 1, y + 2, bs * CW - 2, RH - 8, { seed: 10 + n * 8 + b, rough: .35 }), cut ? 's-red' : 's-soft', g, { 'stroke-width': cut ? 2 : 1.1 });
      }
      OM.forEach((s, j) => { const t = tau(s); if (n === 3) text(g, L + j * CW + CW / 2, T + 4 * RH + 6, 'τ = ' + (t === Infinity ? '∞' : t), 'lbl', { 'text-anchor': 'middle' }); });
    }
    const ub = [...new Set(bad)];
    out.innerHTML = allOk ? '<span class="ok">A stopping time:</span> every {τ = n} is a union of boxes of row n, so it is in 𝓕<sub>n</sub>.'
      : '<span class="bad">Not a stopping time:</span> in row' + (ub.length > 1 ? 's ' : ' ') + ub.join(', ') + ' the event {τ = n} splits a box, so knowing the first n tosses doesn’t tell you whether τ = n.';
  }
  $$('[data-ft]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.ft; pressGroup($$('[data-ft]'), mode, 'data-ft'); render(); }));
  render();
});

/* ---------- Ch5 · a stopped random walk ---------- */
reg('ch5', 'stoppedwalk', function () {
  const svg = $('#sw-svg'); if (!svg) return;
  const sa = $('#sw-a'), out = $('#sw-out');
  const N = 80, L = 40, R = 705, Y0 = 130, SC = 11;
  const X = n => L + n / N * (R - L), Y = v => Y0 - v * SC;
  let seed = 3, walk = [];
  function make() { const r = rng(seed * 101 + 7); walk = [0]; for (let i = 1; i <= N; i++) walk.push(walk[i - 1] + (r() < .5 ? -1 : 1)); }
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  path('M' + L + ' ' + Y0 + 'H' + R, 's-rule', gA, { 'stroke-width': 1 });
  text(gA, R, Y0 + 16, 'n', 'lbl lbl-serif', { 'text-anchor': 'end' });
  function render() {
    const a = +sa.value; $('#sw-av').textContent = a; clear(g);
    let tau = walk.findIndex(v => v === a); if (tau < 0) tau = Infinity;
    path('M' + L + ' ' + r1(Y(a)) + 'H' + R, 's-blue', g, { 'stroke-dasharray': '5 4', 'stroke-width': 1.1 });
    text(g, L - 6, Y(a) + 4, String(a), 'lbl', { 'text-anchor': 'end' });
    path(poly(walk.map((v, i) => [X(i), Y(v)])), 's-soft', g, { 'stroke-width': 1.3, opacity: .7 });
    const st = walk.map((v, i) => [X(i), Y(i <= tau ? v : walk[tau])]);
    path(poly(st), 's-ink', g, { 'stroke-width': 2.4 });
    if (tau < Infinity) { el('circle', { cx: r1(X(tau)), cy: r1(Y(a)), r: 5, class: 'f-blue' }, g); text(g, X(tau), Y(a) - 10, 'τ = ' + tau, 'lbl', { 'text-anchor': 'middle' }); }
    out.innerHTML = tau < Infinity ? 'The walk first reaches ' + a + ' at time τ = ' + tau + '. After that the stopped process stays at X<sub>τ</sub> = ' + a + '.'
      : 'This walk doesn’t reach ' + a + ' within ' + N + ' steps, so here X<sup>τ</sup> and X agree throughout.';
  }
  sa.addEventListener('input', render);
  $('#sw-new').addEventListener('click', () => { seed++; make(); render(); });
  make(); render();
});

/* ---------- Ch4 · the tower property as repeated averaging ---------- */
reg('ch4', 'tower', function () {
  const svg = $('#tow-svg'); if (!svg) return;
  const out = $('#tow-out');
  const n = 12, L = 50, R = 700, B = 220, T = 20, W = (R - L) / n, YM = 10;
  const Y = v => B - v / YM * (B - T);
  const fine = [3, 3, 2, 4], coarse = [6, 6];  /* block sizes; the coarse blocks are unions of fine ones */
  let seed = 4, xs = [], cur = 'x', shown = null, anim = 0;
  function make() { const r = rng(seed * 37 + 1); xs = []; for (let i = 0; i < n; i++) xs.push(1 + Math.round(r() * 8)); }
  const avg = (v, sizes) => { const o = []; let i = 0; sizes.forEach(s => { const m = v.slice(i, i + s).reduce((a, b) => a + b, 0) / s; for (let k = 0; k < s; k++) o.push(m); i += s; }); return o; };
  const target = () => cur === 'x' ? xs : cur === 'f' ? avg(xs, fine) : cur === 'g' ? avg(xs, coarse) : avg(avg(xs, fine), coarse);
  const gA = el('g', {}, svg), gB = el('g', {}, svg), gP = el('g', {}, svg);
  path('M' + L + ' ' + B + 'H' + R, 's-ink', gA, { 'stroke-width': 1.2 });
  function boxes() {
    clear(gP);
    let i = 0; fine.forEach((s, k) => { path(SK.rect(L + i * W + 2, T - 6, s * W - 4, B - T + 12, { seed: 30 + k, rough: .3 }), 's-soft', gP, { 'stroke-width': 1 }); i += s; });
    i = 0; coarse.forEach((s, k) => { path(SK.rect(L + i * W - 2, T - 12, s * W + 4, B - T + 24, { seed: 50 + k, rough: .4 }), 's-ink', gP, { 'stroke-width': 2 }); i += s; });
  }
  function draw(v) {
    clear(gB);
    v.forEach((h, i) => { el('rect', { x: r1(L + i * W + 7), y: r1(Y(h)), width: r1(W - 14), height: r1(B - Y(h)), class: cur === 'x' ? 'f-bluew' : 'f-ochrew' }, gB); path('M' + r1(L + i * W + 7) + ' ' + r1(Y(h)) + 'h' + r1(W - 14), cur === 'x' ? 's-blue' : 's-ochre', gB, { 'stroke-width': 2 }); });
    xs.forEach((h, i) => { if (cur !== 'x') el('circle', { cx: r1(L + i * W + W / 2), cy: r1(Y(h)), r: 2.6, class: 'f-blue', opacity: .55 }, gB); });
  }
  function go(to) {
    cur = to; pressGroup($$('[data-tow]'), cur, 'data-tow');
    const from = shown || xs.slice(), tgt = target(), t0 = performance.now();
    cancelAnimationFrame(anim);
    const step = now => { const k = RM ? 1 : Math.min(1, (now - t0) / 450), e = k * (2 - k); shown = from.map((v, i) => v + (tgt[i] - v) * e); draw(shown); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
    const f = avg(xs, fine), g2 = avg(xs, coarse), fg = avg(f, coarse);
    const ex = xs.reduce((a, b) => a + b, 0) / n;
    out.innerHTML = 'On the two coarse pieces: 𝔼[X | 𝒢] = ' + [g2[0], g2[6]].map(v => v.toFixed(2)).join(' and ') + ',   𝔼[𝔼[X | 𝓕] | 𝒢] = ' + [fg[0], fg[6]].map(v => v.toFixed(2)).join(' and ') +
      '. <span class="ok">The same.</span>   And averaging everything gives 𝔼[X] = ' + ex.toFixed(2) + ' whichever route you take.';
  }
  $$('[data-tow]').forEach(b => b.addEventListener('click', () => go(b.dataset.tow)));
  $('#tow-new').addEventListener('click', () => { seed++; make(); shown = null; go(cur); });
  make(); boxes(); go('x');
});

/* ---------- Ch3 · Markov's inequality as areas ---------- */
reg('ch3', 'markovpic', function () {
  const svg = $('#mk-svg'); if (!svg) return;
  const sl = $('#mk-l'), out = $('#mk-out');
  const L = 50, R = 690, B = 230, T = 14, YM = 4.4;
  const X = u => L + u * (R - L), Y = v => B - v / YM * (B - T);
  /* a decreasing curve: the quantile function of an exponential-ish random variable, capped for display */
  const q = u => Math.min(YM - .05, -Math.log(Math.max(1e-6, u)) * .9 + .15);
  const mean = (() => { let s = 0; for (let i = 0; i < 4000; i++) s += q((i + .5) / 4000); return s / 4000; })();
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, R + 8, B, [[X(0), '0'], [X(.5), '½'], [X(1), '1']], { dy: 16, fs: 11 });
  vAxis(gA, L, B, T - 4, [[Y(0), '0'], [Y(1), '1'], [Y(2), '2'], [Y(3), '3'], [Y(4), '4']]);
  text(gA, R, B + 34, 'outcomes, sorted from largest X to smallest', 'lbl', { 'text-anchor': 'end' });
  function render() {
    const lam = +sl.value; $('#mk-lv').textContent = lam.toFixed(2); clear(g);
    const pts = []; for (let i = 0; i <= 300; i++) { const u = .002 + i / 300 * .998; pts.push([X(u), Y(q(u))]); }
    el('path', { d: 'M' + X(0) + ' ' + B + 'L' + poly(pts).slice(1) + 'L' + X(1) + ' ' + B + 'Z', class: 'f-bluew' }, g);
    path(poly(pts), 's-blue', g, { 'stroke-width': 2.2 });
    let p = 0; for (let i = 0; i < 4000; i++) if (q((i + .5) / 4000) >= lam) p++; p /= 4000;
    el('rect', { x: X(0), y: Y(lam), width: X(p) - X(0), height: B - Y(lam), class: 'f-ochre', opacity: .45 }, g);
    path(SK.rect(X(0), Y(lam), X(p) - X(0), B - Y(lam), { seed: 7, rough: .3 }), 's-ochre', g, { 'stroke-width': 1.5 });
    path('M' + L + ' ' + r1(Y(lam)) + 'H' + R, 's-ochre', g, { 'stroke-dasharray': '4 4', 'stroke-width': 1 });
    text(g, R - 4, Y(lam) - 6, 'λ', 'lbl lbl-serif', { 'text-anchor': 'end', fill: 'var(--ochre)' });
    out.innerHTML = 'ochre area λ·P[X ≥ λ] = ' + lam.toFixed(2) + ' × ' + p.toFixed(3) + ' = <b>' + (lam * p).toFixed(3) + '</b>   ≤   blue area 𝔼[X] = <b>' + mean.toFixed(3) + '</b>.   So P[X ≥ λ] ≤ 𝔼[X]/λ = ' + (mean / lam).toFixed(3) + '.';
  }
  sl.addEventListener('input', render); render();
});
