/* ---------- IT Ch2 · Fig 2.1: the Kraft budget and the code tree ---------- */
reg('it-ch2', 'kraft', function () {
  const svg = $('#it-kr-svg'); if (!svg) return;
  const box = $('#it-kr-lens'), out = $('#it-kr-out');
  const START = [1, 2, 3, 3];
  let lens = START.slice();
  const LMAX = 6, NAMES = 'ABCDEFGHIJ'.split('');
  const g = el('g', {}, svg);
  function ui() {
    box.innerHTML = '';
    lens.forEach((l, i) => {
      const s = document.createElement('span'); s.className = 'kl';
      s.innerHTML = '<b>' + NAMES[i] + '</b> <button type="button" aria-label="shorter">−</button><span class="kv">' + l + '</span><button type="button" aria-label="longer">+</button>';
      const [m, p] = s.querySelectorAll('button');
      m.addEventListener('click', () => { lens[i] = Math.max(1, lens[i] - 1); ui(); render(); });
      p.addEventListener('click', () => { lens[i] = Math.min(LMAX, lens[i] + 1); ui(); render(); });
      box.appendChild(s);
    });
  }
  function render() {
    clear(g);
    const sum = lens.reduce((s, l) => s + Math.pow(2, -l), 0);
    /* budget bar */
    const BX = 40, BW = 520, BY = 18;
    el('rect', { x: BX, y: BY, width: BW, height: 22, class: 'f-paper2', stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
    const order = lens.map((l, i) => [l, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let acc = 0;
    order.forEach(([l, i], k) => {
      const w = Math.pow(2, -l);
      const over = acc + w > 1 + 1e-12;
      if (acc < 1.25) el('rect', { x: r1(BX + acc * BW), y: BY, width: r1(Math.min(w, 1.25 - acc) * BW), height: 22, class: over ? 'f-redw' : (k % 2 ? 'f-bluew' : 'f-ochrew'), stroke: over ? 'var(--red)' : 'var(--ink-soft)', 'stroke-width': .8 }, g);
      if (w * BW > 22 && acc < 1.2) text(g, BX + (acc + w / 2) * BW, BY + 15, NAMES[i], 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 12 });
      acc += w;
    });
    path('M' + (BX + BW) + ' ' + (BY - 6) + 'V' + (BY + 28), 's-ink', g, { 'stroke-width': 1.6 });
    text(g, BX + BW, BY - 9, 'budget 1', 'lbl', { 'text-anchor': 'end', 'font-size': 10.5 });
    text(g, BX, BY + 38, 'Σ 2^(−l) = ' + sum.toFixed(4), 'lbl', { 'font-size': 11.5, fill: sum > 1 + 1e-12 ? 'var(--red)' : 'var(--ink-soft)' });
    /* code tree */
    const TX = 60, TW = 600, TY = 80, DY = 34;
    const xOf = (s) => TX + (s.length ? (parseInt(s, 2) + .5) * TW / Math.pow(2, s.length) : TW / 2);
    const yOf = s => TY + s.length * DY;
    const codes = {};
    if (sum <= 1 + 1e-12) {
      let r = 0; order.forEach(([l, i]) => { codes[i] = itBits(r, l); r += Math.pow(2, -l); });
    }
    const owners = Object.values(codes);
    const dmax = Math.max(...lens);
    (function draw(s) {
      if (s.length >= dmax) return;
      ['0', '1'].forEach(b => {
        const c = s + b, onPath = owners.some(o => o.startsWith(c)), inside = owners.some(o => c.startsWith(o) && c !== o);
        path('M' + r1(xOf(s)) + ' ' + r1(yOf(s)) + 'L' + r1(xOf(c)) + ' ' + r1(yOf(c)), onPath ? 's-blue' : 's-rule', g, { 'stroke-width': onPath ? 1.8 : 1, opacity: inside ? .35 : 1 });
        draw(c);
      });
    })('');
    el('circle', { cx: r1(xOf('')), cy: TY, r: 4, class: 'f-ink' }, g);
    Object.entries(codes).forEach(([i, c]) => {
      const x = xOf(c), y = yOf(c), span = TW / Math.pow(2, c.length);
      if (c.length < dmax) el('rect', { x: r1(x - span / 2 + 2), y: r1(y + 8), width: r1(span - 4), height: r1((dmax - c.length) * DY - 4), class: 'f-bluew', rx: 4 }, g);
      el('circle', { cx: r1(x), cy: r1(y), r: 11, class: 'f-paper', stroke: 'var(--blue)', 'stroke-width': 1.6 }, g);
      text(g, x, y + 4.5, NAMES[i], 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 12.5 });
      text(g, x, y - 15, c, 'lbl', { 'text-anchor': 'middle', 'font-size': 10.5, 'font-family': 'var(--mono)', fill: 'var(--blue)' });
    });
    if (sum > 1 + 1e-12) text(g, 360, 190, 'over budget: no uniquely decodable code has these lengths', 'lbl', { 'text-anchor': 'middle', fill: 'var(--red)', 'font-size': 13 });
    out.innerHTML = sum > 1 + 1e-12 ? 'Kraft sum ' + sum.toFixed(4) + ' > 1. By Theorem 2.5 part 1, <span class="bad">no uniquely decodable code</span> has these lengths. Lengthen something.'
      : 'Kraft sum ' + sum.toFixed(4) + ' ≤ 1, so a prefix code exists: ' + lens.map((l, i) => NAMES[i] + ' ↦ <span style="font-family:var(--mono)">' + codes[i] + '</span>').join(',  ') +
        (sum < 1 - 1e-12 ? '.<br><span class="dim">Budget left over: some codeword could be shortened. The shaded strips are the strings each codeword rules out as a prefix.</span>' : '.<br><span class="dim">The budget is used exactly, so every branch of the tree ends in a codeword (the code is "complete").</span>');
  }
  $('#it-kr-add').addEventListener('click', () => { if (lens.length < 10) { lens.push(Math.min(LMAX, Math.max(...lens))); ui(); render(); } });
  $('#it-kr-del').addEventListener('click', () => { if (lens.length > 1) { lens.pop(); ui(); render(); } });
  $('#it-kr-reset').addEventListener('click', () => { lens = START.slice(); ui(); render(); });
  ui(); render();
});

/* ---------- IT Ch2 · Fig 2.2: the AEP for a coin, computed exactly ---------- */
reg('it-ch2', 'aep', function () {
  const svg = $('#it-aep-svg'); if (!svg) return;
  const sn = $('#it-aep-n'), sp = $('#it-aep-p'), se = $('#it-aep-e'), out = $('#it-aep-out');
  const L = 50, R = 700, B = 250, T = 20, NB = 110;
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  function render() {
    const n = +sn.value, p = +sp.value, eps = +se.value, q = 1 - p;
    $('#it-aep-nv').textContent = n; $('#it-aep-pv').textContent = p.toFixed(2); $('#it-aep-ev').textContent = eps.toFixed(2);
    const H = itBin(p), lo = -itLog2(q), hi = -itLog2(p);
    const X = s => L + (s - lo) / (hi - lo) * (R - L);
    clear(gA); clear(g);
    const ticks = []; const step = (hi - lo) > 4 ? 1 : (hi - lo) > 2 ? .5 : .25;
    for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push([X(t), (Math.round(t * 100) / 100).toString()]);
    axisLine(gA, L, R + 6, B, ticks, { dy: 16, fs: 11 });
    text(gA, R, B + 32, 'surprise per symbol  −(1/n) log₂ P(sequence)', 'lbl', { 'text-anchor': 'end' });
    const bins = new Array(NB).fill(0); let PT = 0, logT = -Infinity;
    const lse = (a, b) => a === -Infinity ? b : b === -Infinity ? a : Math.max(a, b) + Math.log2(1 + Math.pow(2, -Math.abs(a - b)));
    for (let k = 0; k <= n; k++) {
      const s = -(k * itLog2(p) + (n - k) * itLog2(q)) / n;
      const lc = itLogChoose(n, k) / Math.LN2, lp = lc + k * itLog2(p) + (n - k) * itLog2(q), pr = Math.pow(2, lp);
      bins[Math.min(NB - 1, Math.max(0, Math.floor((s - lo) / (hi - lo) * NB)))] += pr;
      if (Math.abs(s - H) <= eps) { PT += pr; logT = lse(logT, lc); }
    }
    const mx = Math.max(...bins), Y = v => B - v / mx * (B - T - 10);
    el('rect', { x: r1(X(Math.max(lo, H - eps))), y: T, width: r1(Math.max(0, X(Math.min(hi, H + eps)) - X(Math.max(lo, H - eps)))), height: B - T, class: 'f-ochrew' }, g);
    const bw = (R - L) / NB;
    bins.forEach((v, i) => { if (v > 0) el('rect', { x: r1(L + i * bw + .5), y: r1(Y(v)), width: r1(Math.max(bw - 1, .8)), height: r1(B - Y(v)), class: 'f-blue', opacity: .75 }, g); });
    path('M' + r1(X(H)) + ' ' + (T - 4) + 'V' + B, 's-ink', g, { 'stroke-width': 1.5 });
    text(g, X(H) + 5, T + 8, 'H(p) = ' + H.toFixed(3), 'lbl-ink', { 'font-size': 12 });
    text(g, X(Math.min(hi, H + eps)) + 4, T + 26, 'typical band H ± ε', 'lbl', { fill: 'var(--ochre)', 'font-size': 11 });
    const frac = logT === -Infinity ? null : logT - n;
    out.innerHTML = 'n = ' + n + ':  P(typical) = <b>' + PT.toFixed(4) + '</b>' + (PT >= 1 - eps ? ' <span class="ok">≥ 1 − ε</span>' : ' <span class="dim">(&lt; 1 − ε: n is not yet large enough)</span>') +
      '.   |T| = <b>2^' + (logT === -Infinity ? '−∞' : logT.toFixed(1)) + '</b>, between 2^n(H−ε) = 2^' + (n * (H - eps)).toFixed(1) + ' and 2^n(H+ε) = 2^' + (n * (H + eps)).toFixed(1) + '.' +
      '<br><span class="dim">The typical set is a fraction 2^' + (frac === null ? '−∞' : frac.toFixed(1)) + ' of all 2^' + n + ' sequences.</span>';
  }
  [sn, sp, se].forEach(s => s.addEventListener('input', render));
  render();
});
