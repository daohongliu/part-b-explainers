/* ---------- IT Ch1 · Fig 1.1: entropy as average surprise ---------- */
reg('it-ch1', 'binentropy', function () {
  const svg = $('#it-be-svg'); if (!svg) return;
  const sp = $('#it-be-p'), out = $('#it-be-out');
  const L = 50, W = 260, B = 240, T = 24, SMAX = 7, Y = s => B - Math.min(s, SMAX) / SMAX * (B - T);
  const L2 = 410, R2 = 700, X2 = p => L2 + p * (R2 - L2), Y2 = h => B - h * (B - T - 20);
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  vAxis(gA, L, B, T - 4, [0, 1, 2, 3, 4, 5, 6, 7].map(s => [Y(s), String(s)]));
  text(gA, L + 4, T - 8, 'surprise −log₂ (bits)', 'lbl', {});
  path('M' + L + ' ' + B + 'H' + (L + W + 10), 's-soft', gA, { 'stroke-width': 1.1 });
  axisLine(gA, L2, R2 + 6, B, [0, .25, .5, .75, 1].map(p => [X2(p), String(p)]), { dy: 16, fs: 11 });
  vAxis(gA, L2, B, T + 14, [[Y2(0), '0'], [Y2(.5), '½'], [Y2(1), '1']]);
  text(gA, R2, B + 32, 'p', 'lbl lbl-serif', { 'text-anchor': 'end' });
  text(gA, L2 + 6, T + 8, 'H(p) (bits)', 'lbl', {});
  const pts = []; for (let k = 0; k <= 200; k++) { const p = k / 200; pts.push([X2(p), Y2(itBin(p))]); }
  path(poly(pts), 's-blue', gA, { 'stroke-width': 2.2, fill: 'none' });
  let flips = '';
  function render() {
    const p = +sp.value; $('#it-be-pv').textContent = p.toFixed(3);
    clear(g);
    const H = itBin(p), wH = p * W, wT = (1 - p) * W;
    const sH = p > 0 ? -itLog2(p) : Infinity, sT = p < 1 ? -itLog2(1 - p) : Infinity;
    if (p > 0) { el('rect', { x: L, y: r1(Y(sH)), width: r1(wH), height: r1(B - Y(sH)), class: 'f-ochrew', stroke: 'var(--ochre)', 'stroke-width': 1 }, g); text(g, L + wH / 2, Y(sH) - 6, 'H', 'lbl-ink lbl-serif', { 'text-anchor': 'middle' }); }
    if (p < 1) { el('rect', { x: r1(L + wH), y: r1(Y(sT)), width: r1(wT), height: r1(B - Y(sT)), class: 'f-bluew', stroke: 'var(--blue)', 'stroke-width': 1 }, g); text(g, L + wH + wT / 2, Y(sT) - 6, 'T', 'lbl-ink lbl-serif', { 'text-anchor': 'middle' }); }
    el('rect', { x: L, y: r1(Y(H)), width: W, height: r1(B - Y(H)), fill: 'url(#h-ink)', opacity: .35 }, g);
    path('M' + L + ' ' + r1(Y(H)) + 'H' + (L + W), 's-ink', g, { 'stroke-width': 1.6, 'stroke-dasharray': '5 3' });
    text(g, L + W + 6, Y(H) + 4, 'H = ' + H.toFixed(3), 'lbl-ink', { 'font-size': 12 });
    text(g, L + W / 2, B + 18, 'width = probability', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    el('circle', { cx: r1(X2(p)), cy: r1(Y2(H)), r: 4.5, class: 'f-ochre' }, g);
    path('M' + r1(X2(p)) + ' ' + B + 'V' + r1(Y2(H)), 's-soft', g, { 'stroke-dasharray': '2 3' });
    let extra = '';
    if (flips) {
      let s = 0; for (const c of flips) s += c === 'H' ? sH : sT;
      extra = '<br><span style="font-family:var(--mono)">' + flips + '</span><br>average surprise of these 40 flips: <b>' + itFmt(s / flips.length) + '</b> bits (close to H, by the law of large numbers: this is the AEP of Chapter 2 in miniature).';
    }
    out.innerHTML = 'surprise of heads −log₂ p = <b>' + itFmt(sH) + '</b>,   of tails −log₂(1−p) = <b>' + itFmt(sT) + '</b>,   entropy H(p) = <b>' + H.toFixed(3) + '</b> bits.' + extra;
  }
  sp.addEventListener('input', () => { flips = ''; render(); });
  let seed = 9;
  $('#it-be-flip').addEventListener('click', () => { const R = rng(seed++), p = +sp.value; flips = ''; for (let i = 0; i < 40; i++) flips += R() < p ? 'H' : 'T'; render(); });
  render();
});

/* ---------- IT Ch1 · Fig 1.2: divergence is not symmetric ---------- */
reg('it-ch1', 'kl', function () {
  const svg = $('#it-kl-svg'); if (!svg) return;
  const spp = $('#it-kl-p'), sq = $('#it-kl-q'), out = $('#it-kl-out');
  const D = (a, b) => { let d = 0; [[a, b], [1 - a, 1 - b]].forEach(([x, y]) => { if (x > 0) d += y <= 0 ? Infinity : x * itLog2(x / y); }); return d; };
  const L = 300, R = 700, B = 250, T = 20, DM = 3, X = q => L + q * (R - L), Y = d => B - Math.min(d, DM) / DM * (B - T);
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, R + 6, B, [0, .25, .5, .75, 1].map(q => [X(q), String(q)]), { dy: 16, fs: 11 });
  vAxis(gA, L, B, T - 4, [0, 1, 2, 3].map(d => [Y(d), String(d)]));
  text(gA, R, B + 32, 'q(heads)', 'lbl', { 'text-anchor': 'end' });
  text(gA, L + 6, T + 2, 'bits', 'lbl', {});
  function bars(x0, a, lab, cls) {
    text(g, x0 + 40, 30, lab, 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 15 });
    [['heads', a], ['tails', 1 - a]].forEach(([n, v], j) => {
      const h = v * 170, x = x0 + j * 44;
      el('rect', { x, y: r1(220 - h), width: 36, height: r1(Math.max(h, .5)), class: cls, stroke: 'currentColor', 'stroke-width': .8 }, g);
      text(g, x + 18, 236, n, 'lbl', { 'text-anchor': 'middle', 'font-size': 10.5 });
      text(g, x + 18, 214 - h, v.toFixed(2), 'lbl', { 'text-anchor': 'middle', 'font-size': 10.5 });
    });
  }
  function render() {
    const p = +spp.value, q = +sq.value; $('#it-kl-pv').textContent = p.toFixed(2); $('#it-kl-qv').textContent = q.toFixed(2);
    clear(g);
    bars(20, p, 'p', 'f-bluew'); bars(140, q, 'q', 'f-ochrew');
    const a = [], b = [];
    for (let k = 1; k < 400; k++) { const t = k / 400; a.push([X(t), Y(D(p, t))]); b.push([X(t), Y(D(t, p))]); }
    path(poly(a), 's-blue', g, { 'stroke-width': 2.2, fill: 'none' });
    path(poly(b), 's-ochre', g, { 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '6 4' });
    text(g, R - 4, T + 14, 'D(p‖q) solid', 'lbl', { 'text-anchor': 'end', fill: 'var(--blue)' });
    text(g, R - 4, T + 30, 'D(q‖p) dashed', 'lbl', { 'text-anchor': 'end', fill: 'var(--ochre)' });
    const d1 = D(p, q), d2 = D(q, p);
    path('M' + r1(X(q)) + ' ' + B + 'V' + T, 's-soft', g, { 'stroke-dasharray': '2 3' });
    if (Number.isFinite(d1)) el('circle', { cx: r1(X(q)), cy: r1(Y(d1)), r: 4.5, class: 'f-blue' }, g);
    if (Number.isFinite(d2)) el('circle', { cx: r1(X(q)), cy: r1(Y(d2)), r: 4.5, class: 'f-ochre' }, g);
    out.innerHTML = 'D(p‖q) = <b>' + itFmt(d1) + '</b> bits,   D(q‖p) = <b>' + itFmt(d2) + '</b> bits.' +
      (!Number.isFinite(d1) ? '   <span class="bad">q gives probability 0 to an outcome p allows.</span>' : '') +
      '<br><span class="dim">Cross-entropy E<sub>p</sub>[−log₂ q(X)] = H(p) + D(p‖q) = ' + itFmt(itBin(p) + d1) + ' bits.</span>';
  }
  spp.addEventListener('input', render); sq.addEventListener('input', render);
  render();
});

/* ---------- IT Ch1 · Fig 1.3: the information diagram from a joint table ---------- */
reg('it-ch1', 'infodiag', function () {
  const svg = $('#it-ent-svg'); if (!svg) return;
  const box = $('#it-joint'), out = $('#it-ent-out'), btns = $$('[data-itj]');
  const XV = [-1, 0, 1], YV = [0, 1, 2];
  const PRE = {
    ind: [[.2, .2, .1], [.12, .12, .06], [.08, .08, .04]].map(r => r.map(v => v * 100)),
    noisy: [[8, 1, 1], [1, 8, 1], [1, 1, 8]],
    copy: [[10, 0, 0], [0, 10, 0], [0, 0, 10]],
    sq: [[0, 10, 0], [10, 0, 0], [0, 10, 0]]
  };
  let W = PRE.noisy.map(r => r.slice());
  box.innerHTML = '';
  const tbl = document.createElement('table'); tbl.className = 'it-jt';
  tbl.innerHTML = '<thead><tr><th></th>' + YV.map(y => '<th>Y = ' + y + '</th>').join('') + '<th>p<sub>X</sub></th></tr></thead><tbody></tbody><tfoot><tr><th>p<sub>Y</sub></th><td></td><td></td><td></td><td></td></tr></tfoot>';
  const tb = tbl.querySelector('tbody'), inputs = [];
  XV.forEach((x, i) => {
    const tr = document.createElement('tr'); tr.innerHTML = '<th>X = ' + x + '</th>';
    YV.forEach((y, j) => {
      const td = document.createElement('td'); const inp = document.createElement('input');
      inp.type = 'range'; inp.min = 0; inp.max = 20; inp.step = 1; inp.setAttribute('aria-label', 'weight of X = ' + x + ', Y = ' + y);
      inp.addEventListener('input', () => { W[i][j] = +inp.value; mode = ''; render(); });
      const o = document.createElement('span'); o.className = 'jt-v'; td.appendChild(inp); td.appendChild(o); tr.appendChild(td); inputs.push([inp, o, i, j]);
    });
    const tdm = document.createElement('td'); tdm.className = 'jt-m'; tr.appendChild(tdm);
    tb.appendChild(tr);
  });
  box.appendChild(tbl);
  const g = el('g', {}, svg);
  let mode = 'noisy';
  function render() {
    pressGroup(btns, mode, 'data-itj');
    let tot = 0; W.forEach(r => r.forEach(v => tot += v)); if (tot === 0) { W[0][0] = 1; tot = 1; }
    const P = W.map(r => r.map(v => v / tot)), px = P.map(r => r.reduce((a, b) => a + b)), py = YV.map((_, j) => P.reduce((a, r) => a + r[j], 0));
    inputs.forEach(([inp, o, i, j]) => { inp.value = Math.min(20, W[i][j]); o.textContent = P[i][j].toFixed(2); });
    $$('.jt-m', tbl).forEach((td, i) => td.textContent = px[i].toFixed(2));
    $$('tfoot td', tbl).forEach((td, j) => td.textContent = j < 3 ? py[j].toFixed(2) : '');
    const HXY = itEntropy(P.flat()), HX = itEntropy(px), HY = itEntropy(py), I = Math.max(0, HX + HY - HXY), HXgY = HXY - HY, HYgX = HXY - HX;
    const EX = XV.reduce((s, x, i) => s + x * px[i], 0), EY = YV.reduce((s, y, j) => s + y * py[j], 0);
    let EXY = 0; XV.forEach((x, i) => YV.forEach((y, j) => EXY += x * y * P[i][j]));
    clear(g);
    const L = 40, S = 620 / Math.log2(9), yb = 150;
    const seg = (x0, w, cls, lab, val) => {
      if (w < 1e-9) return;
      el('rect', { x: r1(L + x0 * S), y: yb, width: r1(Math.max(w * S, 1)), height: 34, class: cls, stroke: 'var(--ink-soft)', 'stroke-width': .8 }, g);
      if (w * S > 46) { text(g, L + (x0 + w / 2) * S, yb + 15, lab, 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 12 }); text(g, L + (x0 + w / 2) * S, yb + 29, val.toFixed(2), 'lbl', { 'text-anchor': 'middle', 'font-size': 11 }); }
    };
    seg(0, HXgY, 'f-bluew', 'H(X|Y)', HXgY); seg(HXgY, I, 'f-ochrew', 'I(X;Y)', I); seg(HXgY + I, HYgX, 'f-bluew', 'H(Y|X)', HYgX);
    text(g, L, yb + 52, 'H(X,Y) = ' + HXY.toFixed(3), 'lbl', { 'font-size': 11.5 });
    const brace = (x0, x1, y, lab, col) => {
      const a = L + x0 * S, b = L + x1 * S;
      path('M' + r1(a) + ' ' + (y + 8) + 'V' + y + 'H' + r1(b) + 'V' + (y + 8), 's-' + col, g, { 'stroke-width': 1.5, fill: 'none' });
      text(g, (a + b) / 2, y - 6, lab, 'lbl', { 'text-anchor': 'middle', fill: 'var(--' + col + ')', 'font-size': 12 });
    };
    brace(0, HX, 112, 'H(X) = ' + HX.toFixed(3), 'blue');
    brace(HXgY, HXY, 60, 'H(Y) = ' + HY.toFixed(3), 'ochre');
    axisLine(g, L, L + 620, 205, [0, 1, 2, 3].map(b => [L + b * S, b + ' bit' + (b === 1 ? '' : 's')]), { dy: 14, fs: 10 });
    out.innerHTML = 'I(X;Y) = H(X) + H(Y) − H(X,Y) = <b>' + I.toFixed(3) + '</b> bits.   Cov(X,Y) = ' + (EXY - EX * EY).toFixed(3) + '.' +
      (Math.abs(EXY - EX * EY) < 1e-9 && I > 1e-6 ? '   <span class="ok">Uncorrelated, yet dependent: mutual information sees what covariance misses.</span>' : '') +
      (I < 1e-9 ? '   <span class="dim">Independent: the bracket for H(Y) starts where H(X) ends.</span>' : '');
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.dataset.itj; W = PRE[mode].map(r => r.slice()); render(); }));
  render();
});

/* ---------- IT Ch1 · Fig 1.4: Fano's inequality ---------- */
reg('it-ch1', 'fano', function () {
  const svg = $('#it-fano-svg'); if (!svg) return;
  const sk = $('#it-fano-k'), sh = $('#it-fano-h'), out = $('#it-fano-out');
  const L = 60, R = 690, B = 240, T = 20;
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  function render() {
    const k = +sk.value, HM = itLog2(k); sh.max = HM.toFixed(2); if (+sh.value > HM) sh.value = HM.toFixed(2);
    const h = +sh.value; $('#it-fano-kv').textContent = k; $('#it-fano-hv').textContent = h.toFixed(2);
    const X = e => L + e * (R - L), Y = v => B - v / HM * (B - T);
    clear(gA); clear(g);
    axisLine(gA, L, R + 6, B, [0, .25, .5, .75, 1].map(e => [X(e), String(e)]), { dy: 16, fs: 11 });
    const yt = []; for (let b = 0; b <= HM + 1e-9; b += HM > 4 ? 1 : .5) yt.push([Y(b), String(b)]);
    vAxis(gA, L, B, T - 4, yt);
    text(gA, R, B + 32, 'error probability Pₑ = P(X ≠ Y)', 'lbl', { 'text-anchor': 'end' });
    text(gA, L + 6, T + 2, 'H(X|Y) (bits)', 'lbl', {});
    const f = e => itBin(e) + e * itLog2(k - 1), emax = (k - 1) / k;
    const cur = [], top = [];
    for (let i = 0; i <= 300; i++) { const e = i / 300 * emax; cur.push([X(e), Y(f(e))]); }
    el('path', { d: poly(cur) + 'L' + r1(X(emax)) + ' ' + r1(Y(HM)) + 'L' + r1(X(0)) + ' ' + r1(Y(HM)) + 'Z', fill: 'url(#h-red)', opacity: .35 }, g);
    path(poly(cur), 's-blue', g, { 'stroke-width': 2.3, fill: 'none' });
    if (k > 2) { const c = []; for (let i = 0; i <= 50; i++) { const e = i / 50; const v = 1 + e * itLog2(k - 1); if (v <= HM) c.push([X(e), Y(v)]); } path(poly(c), 's-soft', g, { 'stroke-dasharray': '5 4', fill: 'none' }); }
    text(g, X(.08), Y(HM) + 18, 'impossible', 'lbl', { fill: 'var(--red)' });
    path('M' + L + ' ' + r1(Y(h)) + 'H' + R, 's-ochre', g, { 'stroke-width': 1.5 });
    let lo = 0, hi = emax; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) >= h) hi = m; else lo = m; }
    const pe = h >= HM - 1e-9 ? emax : hi;
    el('circle', { cx: r1(X(pe)), cy: r1(Y(h)), r: 5, class: 'f-ochre' }, g);
    path('M' + r1(X(pe)) + ' ' + r1(Y(h)) + 'V' + B, 's-ochre', g, { 'stroke-dasharray': '2 3' });
    const cor = k > 2 ? Math.max(0, (h - 1) / itLog2(k - 1)) : NaN;
    out.innerHTML = 'With H(X|Y) = ' + h.toFixed(2) + ' bits and |𝒳| = ' + k + ', every way of guessing X from Y errs with probability at least <b>' + pe.toFixed(3) + '</b>.' +
      (k > 2 ? '<br><span class="dim">Corollary 1.22 gives the weaker Pₑ ≥ (H(X|Y) − 1)/log₂(|𝒳| − 1) = ' + cor.toFixed(3) + '.</span>' : '<br><span class="dim">With two values, Fano reads H(X|Y) ≤ H(Pₑ).</span>');
  }
  sk.addEventListener('input', render); sh.addEventListener('input', render);
  render();
});
