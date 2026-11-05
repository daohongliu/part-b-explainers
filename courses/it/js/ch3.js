/* ---------- IT Ch3 · Fig 3.1: block codes approach the entropy ---------- */
reg('it-ch3', 'blocks', function () {
  const svg = $('#it-blk-svg'); if (!svg) return;
  const sp = $('#it-blk-p'), out = $('#it-blk-out');
  const L = 60, R = 690, B = 240, T = 20, NM = 10;
  const X = n => L + (n - .5) / NM * (R - L);
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, R + 6, B, Array.from({ length: NM }, (_, i) => [X(i + 1), String(i + 1)]), { dy: 16, fs: 11 });
  text(gA, R, B + 32, 'block length n', 'lbl', { 'text-anchor': 'end' });
  text(gA, L + 6, T + 2, 'bits per flip', 'lbl', {});
  function render() {
    const p = +sp.value, q = 1 - p, H = itBin(p); $('#it-blk-pv').textContent = p.toFixed(2);
    const ys = [];
    for (let n = 1; n <= NM; n++) {
      const ps = [];
      for (let k = 0; k <= n; k++) { const pr = Math.pow(p, k) * Math.pow(q, n - k), c = Math.round(Math.exp(itLogChoose(n, k))); for (let j = 0; j < c; j++) ps.push(pr); }
      ys.push(itHuffmanLength(ps) / n);
    }
    const top = Math.max(1.05, H + 1.02), Y = v => B - v / top * (B - T);
    clear(g);
    const yt = el('g', {}, g); vAxis(yt, L, B, T - 4, [0, .25, .5, .75, 1, 1.25, 1.5].filter(v => v <= top).map(v => [Y(v), String(v)]));
    const band = []; for (let n = 1; n <= NM; n += .05) band.push([X(n), Y(Math.min(top, H + 1 / n))]);
    el('path', { d: poly(band) + 'L' + r1(X(NM)) + ' ' + r1(Y(H)) + 'L' + r1(X(1)) + ' ' + r1(Y(H)) + 'Z', class: 'f-ochrew' }, g);
    path(poly(band), 's-ochre', g, { 'stroke-width': 1.2, fill: 'none', 'stroke-dasharray': '4 3' });
    path('M' + L + ' ' + r1(Y(H)) + 'H' + R, 's-ink', g, { 'stroke-width': 1.5 });
    text(g, R - 4, Y(H) + 15, 'H(p) = ' + H.toFixed(3), 'lbl-ink', { 'text-anchor': 'end', 'font-size': 12 });
    text(g, X(1.6), Y(Math.min(top, H + 1 / 1.6)) - 8, 'H + 1/n', 'lbl', { fill: 'var(--ochre)', 'font-size': 11.5 });
    path(poly(ys.map((v, i) => [X(i + 1), Y(v)])), 's-blue', g, { 'stroke-width': 1.3, fill: 'none', opacity: .6 });
    ys.forEach((v, i) => el('circle', { cx: r1(X(i + 1)), cy: r1(Y(v)), r: 4.5, class: 'f-blue' }, g));
    out.innerHTML = 'Bits per flip: ' + ys.map((v, i) => 'n=' + (i + 1) + ': <b>' + v.toFixed(3) + '</b>').join(',  ') +
      '<br><span class="dim">Entropy ' + H.toFixed(3) + ' bits per flip. Blocks of 10 flips already need a Huffman code with 1024 codewords; this is the combinatorial explosion that arithmetic coding avoids.</span>';
  }
  sp.addEventListener('input', render);
  render();
});

/* ---------- IT Ch3 · Fig 3.2: Huffman's algorithm step by step ---------- */
reg('it-ch3', 'huffman', function () {
  const svg = $('#it-hf-svg'); if (!svg) return;
  const box = $('#it-hf-in'), out = $('#it-hf-out'), btns = $$('[data-ith]');
  const PRE = { a: [.3, .3, .2, .2], b: [.5, .25, .1, .05, .05, .05], c: [.5, .25, .125, .0625, .0625], d: [.4, .3, .2, .1] };
  const NAMES = 'ABCDEFGH'.split('');
  let raw = PRE.b.slice(), step = 0, mode = 'b';
  const g = el('g', {}, svg);
  function ui() {
    box.innerHTML = '';
    raw.forEach((v, i) => {
      const s = document.createElement('label'); s.className = 'kl';
      s.innerHTML = '<b>' + NAMES[i] + '</b> <input type="number" min="0" step="0.01" value="' + v + '" aria-label="weight of ' + NAMES[i] + '">';
      s.querySelector('input').addEventListener('input', e => { raw[i] = Math.max(0, +e.target.value || 0); step = 0; mode = ''; render(); });
      box.appendChild(s);
    });
    const add = document.createElement('button'); add.type = 'button'; add.textContent = '+ symbol';
    add.addEventListener('click', () => { if (raw.length < 8) { raw.push(.05); step = 0; ui(); render(); } });
    const del = document.createElement('button'); del.type = 'button'; del.textContent = '− symbol';
    del.addEventListener('click', () => { if (raw.length > 2) { raw.pop(); step = 0; ui(); render(); } });
    box.appendChild(add); box.appendChild(del);
  }
  function render() {
    pressGroup(btns, mode, 'data-ith'); clear(g);
    let tot = raw.reduce((a, b) => a + b, 0); const ps = tot > 0 ? raw.map(v => v / tot) : raw.map(() => 1 / raw.length);
    const hf = itHuffman(ps), m = ps.length, nMerge = m - 1; step = Math.min(step, nMerge);
    /* final layout: leaves in in-order of the final tree along the bottom, internal nodes above by height */
    const pos = new Map(), ht = new Map(); let li = 0;
    const dx = Math.min(100, 620 / m);
    (function lay(n) {
      if (n.leaf) { ht.set(n, 0); pos.set(n, [360 - (m - 1) * dx / 2 + li * dx, 0]); li++; return; }
      lay(n.kids[0]); lay(n.kids[1]);
      ht.set(n, 1 + Math.max(ht.get(n.kids[0]), ht.get(n.kids[1])));
      pos.set(n, [(pos.get(n.kids[0])[0] + pos.get(n.kids[1])[0]) / 2, 0]);
    })(hf.root);
    const H0 = ht.get(hf.root), dy = Math.min(46, 200 / Math.max(1, H0)), yOf = n => 236 - ht.get(n) * dy;
    const shown = n => n.leaf || n.order < step;
    const nextNode = hf.nodes.find(n => !n.leaf && n.order === step);
    hf.nodes.forEach(n => {
      if (n.leaf || !shown(n)) return;
      const [x] = pos.get(n), y = yOf(n);
      n.kids.forEach((c, j) => { const [cx] = pos.get(c); path('M' + r1(x) + ' ' + r1(y) + 'L' + r1(cx) + ' ' + r1(yOf(c)), 's-ink', g, { 'stroke-width': 1.2 }); text(g, (x + cx) / 2 + (j ? 7 : -7), (y + yOf(c)) / 2, String(j), 'lbl', { 'text-anchor': 'middle', 'font-size': 11, 'font-family': 'var(--mono)', fill: 'var(--blue)' }); });
    });
    hf.nodes.forEach(n => {
      if (!shown(n)) return;
      const [x] = pos.get(n), y = yOf(n), hot = nextNode && nextNode.kids.includes(n);
      if (n.leaf) {
        el('rect', { x: r1(x - 24), y: r1(y - 13), width: 48, height: 26, rx: 5, class: 'f-bluew', stroke: hot ? 'var(--ochre)' : 'var(--blue)', 'stroke-width': hot ? 2.6 : 1 }, g);
        text(g, x, y + 4.5, NAMES[n.id], 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 14 });
        text(g, x, y + 30, ps[n.id].toFixed(3), 'lbl', { 'text-anchor': 'middle', 'font-size': 10.5 });
        if (step === nMerge) text(g, x, y + 46, hf.codes[n.id], 'lbl', { 'text-anchor': 'middle', 'font-size': 11, 'font-family': 'var(--mono)', fill: 'var(--blue)' });
      } else {
        el('circle', { cx: r1(x), cy: r1(y), r: 16, class: 'f-paper2', stroke: hot ? 'var(--ochre)' : 'var(--ink-soft)', 'stroke-width': hot ? 2.6 : 1 }, g);
        text(g, x, y + 4, n.p.toFixed(2), 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 10.5 });
      }
    });
    const H = itEntropy(ps), sh = ps.map(p => p > 0 ? Math.ceil(-itLog2(p) - 1e-12) : 0), el_ = sh.map(l => l + 1);
    const E = ls => ps.reduce((s, p, i) => s + p * ls[i], 0);
    const live = m - step;
    out.innerHTML = (step < nMerge ? 'Step ' + step + ' of ' + nMerge + ': ' + live + ' nodes left; the two smallest (outlined) are merged next.' : '<b>Done.</b> Read each codeword from the root down.') +
      '<table class="it-hf-t"><thead><tr><th></th>' + ps.map((_, i) => '<th>' + NAMES[i] + '</th>').join('') + '<th>expected length</th></tr></thead><tbody>' +
      '<tr><td>p</td>' + ps.map(p => '<td>' + p.toFixed(3) + '</td>').join('') + '<td>H = ' + H.toFixed(3) + '</td></tr>' +
      '<tr><td>Huffman</td>' + hf.lens.map(l => '<td>' + l + '</td>').join('') + '<td><b>' + E(hf.lens).toFixed(3) + '</b></td></tr>' +
      '<tr><td>Shannon</td>' + sh.map(l => '<td>' + l + '</td>').join('') + '<td>' + E(sh).toFixed(3) + '</td></tr>' +
      '<tr><td>Elias</td>' + el_.map(l => '<td>' + l + '</td>').join('') + '<td>' + E(el_).toFixed(3) + '</td></tr></tbody></table>';
  }
  $('#it-hf-step').addEventListener('click', () => { step++; render(); });
  $('#it-hf-all').addEventListener('click', () => { step = 99; render(); });
  $('#it-hf-reset').addEventListener('click', () => { step = 0; render(); });
  btns.forEach(b => b.addEventListener('click', () => { mode = b.dataset.ith; raw = PRE[mode].slice(); step = 0; ui(); render(); }));
  ui(); render();
});

/* ---------- IT Ch3 · Fig 3.3: arithmetic coding as zooming ---------- */
reg('it-ch3', 'arith', function () {
  const svg = $('#it-ar-svg'); if (!svg) return;
  const inp = $('#it-ar-msg'), out = $('#it-ar-out');
  const SY = ['a', 'b', 'c'], PR = [.6, .3, .1], CUM = [0, .6, .9, 1];
  const L = 70, R = 690, g = el('g', {}, svg);
  function render() {
    const msg = (inp.value.toLowerCase().match(/[abc]/g) || []).slice(0, 12);
    clear(g);
    const rows = msg.length + 1, rh = Math.min(46, 300 / rows);
    let lo = 0, hi = 1;
    for (let r = 0; r < rows; r++) {
      const y = 12 + r * rh, w = hi - lo;
      text(g, L - 8, y + 15, r < msg.length ? msg[r] : '', 'lbl-ink lbl-serif', { 'text-anchor': 'end', 'font-size': 15 });
      SY.forEach((s, j) => {
        const a = L + CUM[j] * (R - L), b = L + CUM[j + 1] * (R - L), hot = r < msg.length && msg[r] === s;
        el('rect', { x: r1(a), y: r1(y), width: r1(b - a), height: r1(rh * .52), class: hot ? 'f-ochrew' : 'f-paper2', stroke: hot ? 'var(--ochre)' : 'var(--ink-soft)', 'stroke-width': hot ? 1.8 : .8 }, g);
        if (b - a > 20) text(g, (a + b) / 2, y + rh * .36, s, 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
      });
      text(g, L, y + rh * .52 + 11, lo.toPrecision(6), 'lbl', { 'font-size': 9.5 });
      text(g, R, y + rh * .52 + 11, hi.toPrecision(6), 'lbl', { 'font-size': 9.5, 'text-anchor': 'end' });
      if (r < msg.length) {
        const j = SY.indexOf(msg[r]), a = L + CUM[j] * (R - L), b = L + CUM[j + 1] * (R - L), yn = y + rh;
        path('M' + r1(a) + ' ' + r1(y + rh * .52) + 'L' + L + ' ' + r1(yn) + 'M' + r1(b) + ' ' + r1(y + rh * .52) + 'L' + R + ' ' + r1(yn), 's-ochre', g, { 'stroke-width': .9, opacity: .7 });
        lo = lo + CUM[j] * w; hi = lo + PR[j] * w;
      }
    }
    if (!msg.length) { out.innerHTML = 'Type a message made of the letters a, b and c.'; return; }
    const len = hi - lo, mid = (lo + hi) / 2, nb = Math.ceil(-itLog2(len) - 1e-12) + 1, code = itBits(mid, nb);
    const H = itEntropy(PR);
    out.innerHTML = 'Final interval [' + lo.toPrecision(8) + ', ' + hi.toPrecision(8) + '), length ∏p = ' + len.toPrecision(4) +
      '.<br>Code: the first ⌈−log₂ ' + len.toPrecision(3) + '⌉ + 1 = ' + nb + ' bits of the midpoint ' + mid.toPrecision(8) + ': <b style="font-family:var(--mono)">' + code + '</b>' +
      '<br><span class="dim">' + (nb / msg.length).toFixed(2) + ' bits per symbol for this message; the entropy is ' + H.toFixed(3) + ' bits per symbol, and the overhead of at most 2 bits gets spread over longer messages.</span>';
  }
  inp.addEventListener('input', render);
  render();
});

/* ---------- IT Ch3 · Fig 3.4: Tunstall's tree ---------- */
reg('it-ch3', 'tunstall', function () {
  const svg = $('#it-tu-svg'); if (!svg) return;
  const sp = $('#it-tu-p'), out = $('#it-tu-out');
  const D = 3, M = 2, SPLITS = Math.floor((Math.pow(2, D) - M) / (M - 1));
  let k = 0;
  const g = el('g', {}, svg);
  function build(p, steps) {
    const pr = s => { let v = 1; for (const c of s) v *= c === 'a' ? p : 1 - p; return v; };
    let leaves = ['a', 'b'], internal = [];
    for (let i = 0; i < steps; i++) {
      let best = 0; leaves.forEach((s, j) => { if (pr(s) > pr(leaves[best]) + 1e-12) best = j; });
      const s = leaves[best]; internal.push(s); leaves[best] = s + 'a'; leaves.push(s + 'b');
    }
    return { leaves, internal, pr };
  }
  function render() {
    const p = +sp.value; $('#it-tu-pv').textContent = p.toFixed(2);
    clear(g);
    const { leaves, internal, pr } = build(p, k);
    const nodes = new Set(['']); leaves.concat(internal).forEach(s => { for (let i = 1; i <= s.length; i++) nodes.add(s.slice(0, i)); });
    const isLeaf = s => leaves.includes(s);
    const pos = new Map(); let li = 0; const maxD = Math.max(...leaves.map(s => s.length));
    const dy = Math.min(44, 230 / maxD), nl = leaves.length, dx = Math.min(84, 640 / nl);
    (function lay(s) {
      if (isLeaf(s)) { pos.set(s, [360 - (nl - 1) * dx / 2 + li * dx, 24 + s.length * dy]); li++; return; }
      lay(s + 'a'); lay(s + 'b');
      pos.set(s, [(pos.get(s + 'a')[0] + pos.get(s + 'b')[0]) / 2, 24 + s.length * dy]);
    })('');
    nodes.forEach(s => { if (!s) return; const par = s.slice(0, -1); const [x, y] = pos.get(par), [cx, cy] = pos.get(s); path('M' + r1(x) + ' ' + r1(y) + 'L' + r1(cx) + ' ' + r1(cy), 's-soft', g, { 'stroke-width': 1.1 }); text(g, (x + cx) / 2 + (s.endsWith('a') ? -7 : 7), (y + cy) / 2, s.slice(-1), 'lbl lbl-serif', { 'text-anchor': 'middle', 'font-size': 12 }); });
    let best = null; if (k < SPLITS) { best = 0; leaves.forEach((s, j) => { if (pr(s) > pr(leaves[best]) + 1e-12) best = j; }); best = leaves[best]; }
    nodes.forEach(s => {
      const [x, y] = pos.get(s);
      if (!s) { el('circle', { cx: x, cy: y, r: 4, class: 'f-ink' }, g); return; }
      if (isLeaf(s)) {
        el('rect', { x: r1(x - 26), y: r1(y - 11), width: 52, height: 22, rx: 5, class: 'f-bluew', stroke: s === best ? 'var(--ochre)' : 'var(--blue)', 'stroke-width': s === best ? 2.6 : 1 }, g);
        text(g, x, y + 4, s, 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': s.length > 4 ? 10.5 : 12.5 });
        text(g, x, y + 24, pr(s).toFixed(4), 'lbl', { 'text-anchor': 'middle', 'font-size': 9.5 });
      } else el('circle', { cx: r1(x), cy: r1(y), r: 4, class: 'f-soft' }, g);
    });
    const EL = 1 + internal.reduce((s, v) => s + pr(v), 0), H = itBin(p);
    const done = k >= SPLITS;
    out.innerHTML = 'After ' + k + ' of ' + SPLITS + ' splits: ' + leaves.length + ' leaves.   Expected input symbols per output word = 1 + ' + (internal.length ? internal.map(v => pr(v).toFixed(4)).join(' + ') : '0') + ' = <b>' + EL.toFixed(4) + '</b>.' +
      (done ? '<br>Output bits per input symbol: 3 / ' + EL.toFixed(4) + ' = <b>' + (3 / EL).toFixed(3) + '</b>, against the entropy H = ' + H.toFixed(3) + '.' : '<br><span class="dim">The outlined leaf is the likeliest, so it is split next.</span>');
  }
  $('#it-tu-step').addEventListener('click', () => { if (k < SPLITS) k++; render(); });
  $('#it-tu-reset').addEventListener('click', () => { k = 0; render(); });
  sp.addEventListener('input', () => { k = 0; render(); });
  render();
});
