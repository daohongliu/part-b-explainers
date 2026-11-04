/* ---------- CLT Ch2 · Fig 2.1: the version space shrinks ---------- */
reg('clt-ch2', 'versionspace', function () {
  const svg = $('#clt-vs-svg'); if (!svg) return;
  const se = $('#clt-vs-e'), out = $('#clt-vs-out');
  const N = 61, TS = 21 / 60, L = 40, Rr = 700, B = 250, T = 70, SY = 34;
  const X = u => L + u * (Rr - L), Y = e => B - e / .7 * (B - T);
  let pts = [], R = rng(5), seed = 5;
  const gA = el('g', {}, svg), gH = el('g', {}, svg), gP = el('g', {}, svg);
  axisLine(gA, L, Rr + 8, B, [[X(0), '0'], [X(.25), '¼'], [X(.5), '½'], [X(.75), '¾'], [X(1), '1']], { dy: 16, fs: 11 });
  vAxis(gA, L, B, T - 4, [[Y(0), '0'], [Y(.2), '.2'], [Y(.4), '.4'], [Y(.6), '.6']]);
  text(gA, L + 6, T - 8, 'err(hₜ)', 'lbl', {});
  text(gA, Rr, B + 34, 'threshold t', 'lbl', { 'text-anchor': 'end' });
  path('M' + L + ' ' + SY + 'H' + Rr, 's-rule', gA, { 'stroke-width': 1 });
  text(gA, L - 6, SY + 4, 'x', 'lbl lbl-serif', { 'text-anchor': 'end' });
  function render() {
    const eps = +se.value; $('#clt-vs-ev').textContent = eps.toFixed(2);
    clear(gH); clear(gP);
    let cons = 0, badCons = 0, bad = 0;
    const bw = (Rr - L) / N * .62;
    for (let k = 0; k < N; k++) {
      const t = k / 60, e = Math.abs(t - TS);
      const ok = !(pts.some(x => x < TS && x >= t) || pts.some(x => x >= TS && x < t));
      const isBad = e > eps + 1e-9; if (isBad) bad++;
      if (ok) { cons++; if (isBad) badCons++; }
      el('rect', { x: r1(X(t) - bw / 2), y: r1(Y(e)), width: r1(bw), height: r1(Math.max(1, B - Y(e))), class: isBad ? 'f-red' : 'f-blue', opacity: ok ? .78 : .1 }, gH);
      if (Math.abs(t - TS) < 1e-9) text(gH, X(t), B + 30, 't*', 'lbl lbl-serif', { 'text-anchor': 'middle', fill: 'var(--blue)' });
    }
    path('M' + L + ' ' + r1(Y(eps)) + 'H' + Rr, 's-red', gH, { 'stroke-width': 1, 'stroke-dasharray': '4 4' });
    text(gH, Rr + 4, Y(eps) + 4, 'ε', 'lbl lbl-serif', { fill: 'var(--red)' });
    pts.forEach(x => {
      const pos = x >= TS, cx = X(x);
      if (pos) path('M' + r1(cx - 4) + ' ' + SY + 'H' + r1(cx + 4) + 'M' + r1(cx) + ' ' + (SY - 4) + 'V' + (SY + 4), 's-blue', gP, { 'stroke-width': 1.7 });
      else el('circle', { cx: r1(cx), cy: SY, r: 3, class: 's-ochre', fill: 'none', 'stroke-width': 1.3 }, gP);
      path('M' + r1(cx) + ' ' + (SY + 7) + 'V' + (SY + 18), 's-soft', gP, { 'stroke-width': .5, 'stroke-dasharray': '1 3', opacity: .6 });
    });
    const need = Math.ceil((Math.log(N) + Math.log(20)) / eps);
    out.innerHTML = pts.length + ' examples.   Hypotheses still consistent: <b>' + cons + '</b> of ' + N + ', of which ' +
      (badCons ? '<span class="bad">' + badCons + ' are bad</span>' : '<span class="ok">none are bad</span>') + ' (bad = error above ε; there are ' + bad + ' bad ones in all).' +
      '<br><span class="dim">Theorem 2.2 with δ = 0.05 asks for m ≥ (log 61 + log 20)/ε = ' + need + ' examples.</span>';
  }
  function draw(k) { for (let i = 0; i < k; i++) pts.push(R()); render(); }
  $('#clt-vs-one').addEventListener('click', () => draw(1));
  $('#clt-vs-ten').addEventListener('click', () => draw(10));
  $('#clt-vs-reset').addEventListener('click', () => { pts = []; seed++; R = rng(seed); render(); });
  se.addEventListener('input', render);
  render();
});

/* ---------- CLT Ch2 · Fig 2.2: sample-size bounds against n ---------- */
reg('clt-ch2', 'samplecomplexity', function () {
  const svg = $('#clt-sc-svg'); if (!svg) return;
  const se = $('#clt-sc-e'), sn = $('#clt-sc-n'), out = $('#clt-sc-out');
  const L = 64, Rr = 700, T = 16, B = 250, NMAX = 200, LMIN = 1, LMAX = 10;
  const X = n => L + (n - 2) / (NMAX - 2) * (Rr - L), Y = lg => B - (lg - LMIN) / (LMAX - LMIN) * (B - T);
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, Rr + 8, B, [2, 50, 100, 150, 200].map(n => [X(n), String(n)]), { dy: 16, fs: 11 });
  vAxis(gA, L, B, T - 4, [2, 4, 6, 8, 10].map(k => [Y(k), '10' + ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰'][k]]));
  text(gA, Rr, B + 34, 'number of variables n', 'lbl', { 'text-anchor': 'end' });
  text(gA, L + 6, T + 4, 'examples', 'lbl', {});
  const LD = Math.log(20);
  const dnf = (n, e) => (6 * n * Math.LN2 + LD) / e, cnf = (n, e) => (8 * n * n * n * Math.LN2 + LD) / e;
  function render() {
    const e = +se.value, n0 = +sn.value; $('#clt-sc-ev').textContent = e.toFixed(2); $('#clt-sc-nv').textContent = n0;
    clear(g);
    const line = (f, cls, lab) => {
      const pts = []; for (let n = 2; n <= NMAX; n += 2) pts.push([X(n), Y(Math.log10(f(n, e)))]);
      path(poly(pts.filter(p => p[1] >= T - 2)), cls, g, { 'stroke-width': 2.2 });
      const last = pts.filter(p => p[1] >= T - 2).pop(); text(g, last[0] - 4, last[1] - 8, lab, 'lbl', { 'text-anchor': 'end' });
    };
    line(dnf, 's-ochre', 'consistent 3-term DNF (NP-hard)'); line(cnf, 's-blue', 'consistent 3-CNF (efficient)');
    path('M' + r1(X(n0)) + ' ' + T + 'V' + B, 's-soft', g, { 'stroke-dasharray': '2 3' });
    [[dnf, 'f-ochre'], [cnf, 'f-blue']].forEach(([f, c]) => { const y = Y(Math.log10(f(n0, e))); if (y >= T - 2) el('circle', { cx: r1(X(n0)), cy: r1(y), r: 4, class: c }, g); });
    const a = dnf(n0, e), b = cnf(n0, e), fm = v => v >= 1e6 ? v.toExponential(1).replace('e+', ' × 10^') : Math.ceil(v).toLocaleString('en-GB');
    out.innerHTML = 'n = ' + n0 + ', ε = ' + e.toFixed(2) + ':   3-term DNF bound ≈ <b>' + fm(a) + '</b>,   3-CNF bound ≈ <b>' + fm(b) + '</b>,   ratio ≈ ' + Math.round(b / a).toLocaleString('en-GB');
  }
  se.addEventListener('input', render); sn.addEventListener('input', render);
  render();
});
