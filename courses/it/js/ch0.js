/* ---------- IT Ch0 · Fig 0.1: Shannon's picture of communication ---------- */
reg('it-ch0', 'comm', function () {
  const svg = $('#it-comm-svg'); if (!svg) return;
  const out = $('#it-comm-out'), sf = $('#it-comm-f');
  const boxes = [['source', 20], ['source\nencoder', 140], ['channel\nencoder', 260], ['noisy\nchannel', 380], ['decoders', 500], ['destination', 620]];
  const gB = el('g', {}, svg), gT = el('g', {}, svg);
  boxes.forEach(([lab, x], i) => {
    const later = i === 2;
    el('rect', { x, y: 18, width: 84, height: 50, rx: 6, class: i === 3 ? 'f-redw' : i === 1 ? 'f-bluew' : 'f-paper2', stroke: later ? 'var(--ink-soft)' : 'var(--ink)', 'stroke-width': 1.1, 'stroke-dasharray': later ? '4 3' : 'none', opacity: later ? .6 : 1 }, gB);
    lab.split('\n').forEach((t, j, a) => text(gB, x + 42, 46 + (j - (a.length - 1) / 2) * 14, t, 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 12.5, opacity: later ? .6 : 1 }));
    if (i < boxes.length - 1) { path('M' + (x + 86) + ' 43H' + (x + 116), 's-soft', gB, { 'stroke-width': 1.2 }); arrowHead(gB, x + 118, 43, 1, 'soft', 5); }
  });
  text(gB, 182, 88, 'Chapters 1–3: compress', 'lbl', { 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--blue)' });
  text(gB, 362, 88, 'Chapters 4–5: protect', 'lbl', { 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--red)' });
  const MSG = 'information is surprise';
  const AL = 'abcdefghijklmnopqrstuvwxyz ';
  let seed = 3;
  function render() {
    const f = +sf.value; $('#it-comm-fv').textContent = f.toFixed(2);
    const R = rng(seed); clear(gT);
    let bits = '', rx = '', flips = 0;
    for (const ch of MSG) { const v = AL.indexOf(ch); for (let b = 4; b >= 0; b--) bits += (v >> b) & 1; }
    for (let i = 0; i < bits.length; i++) { const flip = R() < f; if (flip) flips++; rx += flip ? 1 - +bits[i] : bits[i]; }
    let recv = '', bad = 0;
    for (let i = 0; i < MSG.length; i++) { const v = parseInt(rx.slice(5 * i, 5 * i + 5), 2); const c = v < AL.length ? AL[v] : '?'; recv += c; if (c !== MSG[i]) bad++; }
    const row = (y, lab, s, cmp) => {
      text(gT, 20, y, lab, 'lbl', { 'font-size': 11.5 });
      const t = el('text', { x: 150, y, class: 'lbl lbl-ink', 'font-family': 'var(--mono)', 'font-size': 13 }, gT);
      for (let i = 0; i < s.length; i++) { const sp = el('tspan', cmp && s[i] !== cmp[i] ? { fill: 'var(--red)', 'font-weight': 700 } : {}, t); sp.textContent = s[i]; }
    };
    row(128, 'message', MSG);
    row(152, '5 bits a letter', bits.slice(0, 70) + '…');
    row(176, 'after the noise', rx.slice(0, 70) + '…', bits.slice(0, 70));
    row(200, 'received', recv, MSG);
    out.innerHTML = flips + ' of ' + bits.length + ' bits flipped; ' + bad + ' of ' + MSG.length + ' letters wrong. <span class="dim">Five bits a letter is wasteful too: English needs fewer than 4.1 bits a letter on average (Sheet 1, Question 8).</span>';
  }
  sf.addEventListener('input', render);
  $('#it-comm-go').addEventListener('click', () => { seed++; render(); });
  render();
});

/* ---------- IT Ch0 · Fig 0.2: guessing with yes/no questions ---------- */
reg('it-ch0', 'guess', function () {
  const svg = $('#it-guess-svg'); if (!svg) return;
  const out = $('#it-guess-out'), btns = $$('[data-itg]');
  const g = el('g', {}, svg);
  const NAMES = 'ABCDEFGH'.split('');
  let mode = 'uni', seed = 1;
  function dist() {
    if (mode === 'uni') return NAMES.map(() => 1 / 8);
    if (mode === 'skew') return NAMES.map((_, i) => i === 0 ? .65 : .05);
    if (mode === 'geo') return NAMES.map((_, i) => i < 7 ? Math.pow(2, -(i + 1)) : 1 / 128);
    const R = rng(seed); const w = NAMES.map(() => Math.pow(R(), 2.2) + .01); const s = w.reduce((a, b) => a + b); return w.map(x => x / s);
  }
  function render() {
    pressGroup(btns, mode, 'data-itg'); clear(g);
    const ps = dist(), hf = itHuffman(ps);
    /* lay out: leaves in in-order, y by depth */
    const pos = new Map(); let li = 0; const depthMax = Math.max(...hf.lens);
    const dy = Math.min(42, 230 / depthMax);
    (function place(n, d) {
      if (n.leaf) { pos.set(n, [70 + li * 82, 28 + d * dy]); li++; return; }
      place(n.kids[0], d + 1); place(n.kids[1], d + 1);
      pos.set(n, [(pos.get(n.kids[0])[0] + pos.get(n.kids[1])[0]) / 2, 28 + d * dy]);
    })(hf.root, 0);
    let q = 0;
    (function edges(n) {
      if (n.leaf) return;
      const [x, y] = pos.get(n);
      n.kids.forEach((c, j) => { const [cx, cy] = pos.get(c); path('M' + r1(x) + ' ' + r1(y) + 'L' + r1(cx) + ' ' + r1(cy), 's-soft', g, { 'stroke-width': 1.1 }); text(g, (x + cx) / 2 + (j ? 6 : -6), (y + cy) / 2 - 2, j ? 'no' : 'yes', 'lbl', { 'text-anchor': 'middle', 'font-size': 10 }); edges(c); });
      el('circle', { cx: r1(x), cy: r1(y), r: 9, class: 'f-paper2', stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
      text(g, x, y + 4, '?', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 11 });
    })(hf.root);
    hf.nodes.filter(n => n.leaf).forEach(n => {
      const [x, y] = pos.get(n), p = ps[n.id];
      el('rect', { x: r1(x - 26), y: r1(y - 12), width: 52, height: 26, rx: 5, class: 'f-bluew', stroke: 'var(--blue)', 'stroke-width': 1 }, g);
      text(g, x, y + 4, NAMES[n.id], 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 14 });
      text(g, x, y + 28, p < .01 ? p.toFixed(4) : p.toFixed(3), 'lbl', { 'text-anchor': 'middle', 'font-size': 10.5 });
      text(g, x, y + 41, hf.lens[n.id] + (hf.lens[n.id] === 1 ? ' question' : ' questions'), 'lbl', { 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--blue)' });
    });
    const avg = ps.reduce((s, p, i) => s + p * hf.lens[i], 0), H = itEntropy(ps);
    out.innerHTML = 'Average number of questions <b>' + avg.toFixed(3) + '</b>.   Entropy H = <b>' + H.toFixed(3) + '</b> bits.   log₂ 8 = 3.' +
      '<br><span class="dim">' + (Math.abs(avg - H) < 1e-9 ? 'Equal: every probability is a power of ½, so each outcome can sit exactly −log₂ p questions deep.' : 'Always H ≤ average < H + 1 (Chapter 3).') + '</span>';
  }
  btns.forEach(b => b.addEventListener('click', () => { if (b.dataset.itg === 'rand' && mode === 'rand') seed++; mode = b.dataset.itg; render(); }));
  render();
});
