/* ---------- CLT Ch1 · the PAC game ---------- */
reg('clt-ch1', 'pacgame', function () {
  const svg = $('#clt-pg-svg'); if (!svg) return;
  const out = $('#clt-pg-out');
  const g = el('g', {}, svg), gT = el('g', {}, svg);
  const boxes = [
    { x: 14, w: 140, t: 'adversary', s: ['picks target c ∈ 𝒞,', 'distribution 𝒟,', 'ε and δ'] },
    { x: 196, w: 120, t: 'oracle EX(c, 𝒟)', s: ['draws x ~ 𝒟', 'returns (x, c(x))', 'm times'] },
    { x: 358, w: 130, t: 'learner L', s: ['sees only the', 'examples, ε, δ', 'outputs h'] },
    { x: 530, w: 176, t: 'judge', s: ['fresh x ~ 𝒟:', 'is P[h(x) ≠ c(x)] ≤ ε?', 'must hold w.p. ≥ 1 − δ'] }];
  boxes.forEach((b, i) => {
    path(SK.rect(b.x, 70, b.w, 110, { seed: 3 + i * 5, rough: .55 }), i === 2 ? 's-blue' : i === 0 ? 's-red' : 's-ink', g, { 'stroke-width': 1.6 });
    text(g, b.x + b.w / 2, 94, b.t, 'lbl', { 'text-anchor': 'middle', style: 'font-weight:600;font-size:13px' });
    b.s.forEach((l, k) => text(g, b.x + b.w / 2, 120 + k * 18, l, 'lbl lbl-serif', { 'text-anchor': 'middle', style: 'font-size:14px' }));
    if (i < 3) { const x1 = b.x + b.w + 6, x2 = boxes[i + 1].x - 6; path(SK.line(x1, 125, x2, 125, { seed: 40 + i, rough: .5 }), 's-ink', g, { 'stroke-width': 1.4 }); arrowHead(g, x2, 125, 1, 'ink'); }
  });
  text(g, 84, 46, '∀ c, 𝒟, ε, δ', 'lbl lbl-serif', { 'text-anchor': 'middle', fill: 'var(--red)', style: 'font-size:15px' });
  text(g, 423, 46, '∃ L, chosen first', 'lbl lbl-serif', { 'text-anchor': 'middle', fill: 'var(--blue)', style: 'font-size:15px' });
  text(g, 256, 205, 'm ≤ poly(n, size(c), 1/ε, 1/δ)', 'lbl', { 'text-anchor': 'middle' });
  /* a round: a toy learner for thresholds on [0,1]; the adversary picks t and a lopsided D */
  $('#clt-pg-play').addEventListener('click', () => {
    clear(gT);
    const R = rng(Math.floor(Math.random() * 1e9)), t = .2 + .6 * R(), skew = 1 + 3 * R(), eps = .05, m = 60;
    const draw = () => Math.pow(R(), skew);
    const xs = []; for (let i = 0; i < m; i++) xs.push(draw());
    const pos = xs.filter(x => x >= t); const th = pos.length ? Math.min(...pos) : 1;
    let bad = 0; const F = 20000; for (let i = 0; i < F; i++) { const x = draw(); if ((x >= t) !== (x >= th)) bad++; }
    const err = bad / F;
    xs.slice(0, 24).forEach((x, i) => { const c = el('circle', { cx: 207 + (i % 12) * 9, cy: 224 + Math.floor(i / 12) * 9, r: 2.6, class: x >= t ? 'f-blue' : 'f-ochre' }, gT); c.style.opacity = 0; setTimeout(() => { c.style.transition = 'opacity .3s'; c.style.opacity = 1; }, RM ? 0 : 30 * i); });
    out.innerHTML = 'Adversary: threshold concept x ≥ ' + t.toFixed(3) + ', with 𝒟 squashed towards 0 (skew ' + skew.toFixed(1) + '). Oracle: ' + m + ' examples. Learner: the smallest positive example, h = [x ≥ ' + th.toFixed(3) + '].' +
      '<br>Judge: err(h) ≈ ' + err.toFixed(4) + (err <= eps ? ' <span class="ok">≤ ε = 0.05, the learner wins this round.</span>' : ' <span class="bad">&gt; ε = 0.05, the learner loses this round (allowed with probability δ).</span>');
  });
});

/* ---------- CLT Ch3 · the lower-bound distribution ---------- */
reg('clt-ch3', 'lowerbound', function () {
  const svg = $('#clt-lb-svg'); if (!svg) return;
  const sm = $('#clt-lb-m'), out = $('#clt-lb-out');
  const d = 41, eps = .02, heavy = 1 - 8 * eps, light = 8 * eps / (d - 1);
  let seed = 1;
  const g = el('g', {}, svg);
  function render() {
    const m = +sm.value; $('#clt-lb-mv').textContent = m; clear(g);
    const R = rng(seed * 991 + m), seen = new Set(); let hits1 = 0;
    for (let i = 0; i < m; i++) { const u = R(); if (u < heavy) hits1++; else seen.add(Math.min(d - 2, Math.floor((u - heavy) / light))); }
    el('circle', { cx: 70, cy: 110, r: 46, class: 'f-bluew' }, g);
    path(SK.loop(70, 110, 46, 46, { seed: 3, rough: .6 }), 's-blue', g, { 'stroke-width': 1.6 });
    text(g, 70, 106, 'x₁', 'lbl lbl-serif', { 'text-anchor': 'middle', style: 'font-size:18px' });
    text(g, 70, 126, (heavy).toFixed(2), 'lbl', { 'text-anchor': 'middle' });
    text(g, 70, 182, hits1 + ' draws', 'lbl', { 'text-anchor': 'middle' });
    for (let j = 0; j < d - 1; j++) {
      const cx = 150 + (j % 20) * 27.5, cy = 80 + Math.floor(j / 20) * 62, s = seen.has(j);
      el('circle', { cx, cy, r: 9, class: s ? 'f-blue' : 'f-paper', opacity: s ? .8 : 1 }, g);
      path(SK.loop(cx, cy, 9, 9, { seed: 10 + j, rough: .5 }), s ? 's-blue' : 's-soft', g, { 'stroke-width': 1.1 });
      if (!s) text(g, cx, cy + 4, '?', 'lbl', { 'text-anchor': 'middle', style: 'font-size:11px' });
    }
    text(g, 150, 40, '40 light points of mass ' + light.toFixed(3) + ' · filled = seen · ? = a guess', 'lbl', {});
    const unseen = d - 1 - seen.size, expErr = unseen * light / 2, need = Math.ceil((d - 1) / (32 * eps));
    out.innerHTML = m + ' examples: ' + seen.size + ' of the 40 light points seen, ' + unseen + ' unseen.   Expected error ≈ ½ × ' + unseen + ' × ' + light.toFixed(4) + ' = <b>' + expErr.toFixed(4) + '</b> ' +
      (expErr > eps ? '<span class="bad">&gt; ε = 0.02</span>' : '<span class="ok">≤ ε = 0.02</span>') + '<br><span class="dim">Theorem 3.9’s threshold (d − 1)/(32ε) = ' + need + '. The theorem’s constants are loose; the picture shows the mechanism.</span>';
  }
  sm.addEventListener('input', render);
  $('#clt-lb-new').addEventListener('click', () => { seed++; render(); });
  render();
});

/* ---------- CLT Ch5 · circuit depth for x^d mod N ---------- */
reg('clt-ch5', 'depth', function () {
  const svg = $('#clt-dp-svg'); if (!svg) return;
  const sk = $('#clt-dp-k'), out = $('#clt-dp-out');
  let mode = 'chain', seed = 5;
  const g = el('g', {}, svg);
  function bitsOf() { const k = +sk.value, R = rng(seed * 13 + k); const b = [1]; for (let i = 1; i < k - 1; i++) b.push(R() < .5 ? 1 : 0); b.push(1); return b; }
  const node = (x, y, t, cls) => { el('circle', { cx: x, cy: y, r: 15, class: cls || 'f-paper' }, g); path(SK.loop(x, y, 15, 15, { seed: Math.round(x + y), rough: .5 }), 's-ink', g, { 'stroke-width': 1.1 }); text(g, x, y + 4, t, 'lbl', { 'text-anchor': 'middle', style: 'font-size:9.5px' }); };
  const wire = (x1, y1, x2, y2) => path(SK.line(x1, y1, x2, y2, { seed: Math.round(x1 * 3 + y2), rough: .4 }), 's-soft', g, { 'stroke-width': 1 });
  function render() {
    clear(g); const b = bitsOf(), k = b.length; $('#clt-dp-kv').textContent = k;
    const ones = b.map((v, j) => v ? j : -1).filter(j => j >= 0);
    const L = 40, R = 690, dx = (R - L) / Math.max(1, k - 1), ySq = 60;
    /* inputs / squares row */
    for (let j = 0; j < k; j++) {
      const x = L + j * dx;
      if (mode === 'chain' && j > 0) wire(x - dx + 15, ySq, x - 15, ySq);
      node(x, ySq, j === 0 ? 'x' : 'x' + String(1 << j).replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]), b[j] ? 'f-bluew' : 'f-paper');
      text(g, x, ySq - 20, String(b[j]), 'lbl', { 'text-anchor': 'middle', fill: b[j] ? 'var(--blue)' : 'var(--ink-soft)' });
    }
    text(g, L - 28, ySq - 20, 'd:', 'lbl', {});
    /* product tree over the selected squares */
    let level = ones.map(j => ({ x: L + j * dx, y: ySq })), depth = 0;
    while (level.length > 1) {
      depth++; const nxt = [], y = ySq + 52 * depth;
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) { const x = (level[i].x + level[i + 1].x) / 2; wire(level[i].x, level[i].y + 15, x, y - 15); wire(level[i + 1].x, level[i + 1].y + 15, x, y - 15); node(x, y, '×', 'f-ochrew'); nxt.push({ x, y }); }
        else nxt.push(level[i]);
      }
      level = nxt;
    }
    const sqDepth = mode === 'chain' ? k - 1 : 0, total = sqDepth + depth;
    text(g, R, 290, 'depth ≈ ' + (mode === 'chain' ? (k - 1) + ' squarings + ' : '') + depth + ' product levels = ' + total, 'lbl', { 'text-anchor': 'end', style: 'font-size:12px' });
    out.innerHTML = 'd = ' + b.slice().reverse().join('') + '<sub>2</sub> has ' + k + ' bits, ' + ones.length + ' of them 1.   ' +
      (mode === 'chain' ? 'From x alone: ' + (k - 1) + ' squarings one after another, then ' + depth + ' levels of products: depth grows like the number of bits.' : 'Given the squares: only ' + depth + ' levels of products, about log₂ ' + ones.length + '. (Each product of two 2n-bit numbers is itself a small circuit; the notes count that too.)');
  }
  $$('[data-dp]').forEach(btn => btn.addEventListener('click', () => { mode = btn.dataset.dp; pressGroup($$('[data-dp]'), mode, 'data-dp'); render(); }));
  sk.addEventListener('input', render);
  $('#clt-dp-new').addEventListener('click', () => { seed++; render(); });
  render();
});
