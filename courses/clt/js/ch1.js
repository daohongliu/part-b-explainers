/* ---------- CLT Ch1 · Fig 1.1: the rectangle game ---------- */
reg('clt-ch1', 'rectgame', function () {
  const svg = $('#clt-rg-svg'); if (!svg) return;
  const sm = $('#clt-rg-m'), se = $('#clt-rg-e'), out = $('#clt-rg-out');
  const PX = 20, PY = 10, S = 360;                       /* the unit square drawn at (PX,PY) with side S */
  const X = u => PX + u * S, Y = v => PY + (1 - v) * S;
  const HX = 420, HW = 280, HB = 330, HT = 40;           /* histogram panel */
  let dist = 'unif', tseed = 3, sseed = 1, trials = null;
  let Rt = null, REF = null, pts = [];
  function target() {
    const R = rng(tseed * 31 + 7);
    const w = .28 + .3 * R(), h = .26 + .3 * R();
    const x0 = .08 + (.84 - w) * R(), y0 = .08 + (.84 - h) * R();
    Rt = { x0, y0, x1: x0 + w, y1: y0 + h };
  }
  function drawer(R) {
    if (dist === 'unif') return () => [R(), R()];
    if (dist === 'blobs') {
      const C = [[.3, .35, .11], [.68, .62, .09], [.5, .78, .07]];
      return () => { for (;;) { const c = C[Math.floor(R() * 3)]; const p = [c[0] + c[2] * gauss(R), c[1] + c[2] * gauss(R)]; if (p[0] > 0 && p[0] < 1 && p[1] > 0 && p[1] < 1) return p; } };
    }
    /* most of the mass in a narrow band just inside the left side of the hidden rectangle */
    return () => { if (R() < .7) { for (;;) { const p = [Rt.x0 + .035 * Math.abs(gauss(R)), R()]; if (p[0] < 1) return p; } } return [R(), R()]; };
  }
  function reference() { const R = rng(999 + tseed), d = drawer(R); REF = []; for (let i = 0; i < 8000; i++) REF.push(d()); }
  const inR = (p, r) => r && p[0] >= r.x0 && p[0] <= r.x1 && p[1] >= r.y0 && p[1] <= r.y1;
  function sample(seed, m) { const R = rng(seed), d = drawer(R), a = []; for (let i = 0; i < m; i++) a.push(d()); return a; }
  function fit(ps) {
    let r = null;
    ps.forEach(p => { if (!inR(p, Rt)) return; if (!r) r = { x0: p[0], x1: p[0], y0: p[1], y1: p[1] }; else { r.x0 = Math.min(r.x0, p[0]); r.x1 = Math.max(r.x1, p[0]); r.y0 = Math.min(r.y0, p[1]); r.y1 = Math.max(r.y1, p[1]); } });
    return r;
  }
  function errOf(r) { let k = 0; for (const p of REF) if (inR(p, Rt) && !inR(p, r)) k++; return k / REF.length; }
  function strips(eps) {
    const ins = REF.filter(p => inR(p, Rt)), k = Math.max(1, Math.ceil(eps / 4 * REF.length));
    const q = (arr, i) => arr[Math.min(arr.length - 1, i)];
    const xs = ins.map(p => p[0]).sort((a, b) => a - b), ys = ins.map(p => p[1]).sort((a, b) => a - b);
    if (ins.length <= k) return null;
    return [
      { n: 1, x0: Rt.x0, x1: q(xs, k - 1), y0: Rt.y0, y1: Rt.y1 },
      { n: 2, x0: Rt.x0, x1: Rt.x1, y0: q(ys, ins.length - k), y1: Rt.y1 },
      { n: 3, x0: q(xs, ins.length - k), x1: Rt.x1, y0: Rt.y0, y1: Rt.y1 },
      { n: 4, x0: Rt.x0, x1: Rt.x1, y0: Rt.y0, y1: q(ys, k - 1) }
    ];
  }
  const g0 = el('g', {}, svg), gS = el('g', {}, svg), gP = el('g', {}, svg), gH = el('g', {}, svg);
  function frame() {
    clear(g0);
    el('rect', { x: PX, y: PY, width: S, height: S, class: 'f-paper', opacity: .55 }, g0);
    path(SK.rect(PX, PY, S, S, { seed: 4, rough: .5 }), 's-rule', g0, { 'stroke-width': 1 });
  }
  function render() {
    const m = +sm.value, eps = +se.value;
    $('#clt-rg-mv').textContent = m; $('#clt-rg-ev').textContent = eps.toFixed(2);
    pts = sample(sseed * 7919 + 13, m);
    const r = fit(pts), err = errOf(r);
    clear(gS); clear(gP);
    /* missed region R \ R' (hatched), R' filled */
    const rx = (a) => el('rect', a, gP);
    if (r) {
      const parts = [[Rt.x0, Rt.y0, r.x0, Rt.y1], [r.x1, Rt.y0, Rt.x1, Rt.y1], [r.x0, Rt.y0, r.x1, r.y0], [r.x0, r.y1, r.x1, Rt.y1]];
      parts.forEach(q => { if (q[2] > q[0] && q[3] > q[1]) rx({ x: X(q[0]), y: Y(q[3]), width: X(q[2]) - X(q[0]), height: Y(q[1]) - Y(q[3]), fill: 'url(#h-red)', opacity: .9 }); });
      rx({ x: X(r.x0), y: Y(r.y1), width: Math.max(1, X(r.x1) - X(r.x0)), height: Math.max(1, Y(r.y0) - Y(r.y1)), class: 'f-bluew' });
      path(SK.rect(X(r.x0), Y(r.y1), Math.max(1, X(r.x1) - X(r.x0)), Math.max(1, Y(r.y0) - Y(r.y1)), { seed: 9, rough: .35 }), 's-blue', gP, { 'stroke-width': 1.6 });
      text(gP, X(r.x1) - 4, Y(r.y1) + 14, "R′", 'lbl lbl-serif', { 'text-anchor': 'end', fill: 'var(--blue)' });
    } else rx({ x: X(Rt.x0), y: Y(Rt.y1), width: X(Rt.x1) - X(Rt.x0), height: Y(Rt.y0) - Y(Rt.y1), fill: 'url(#h-red)', opacity: .9 });
    let hit = null;
    if ($('#clt-rg-strips').checked) {
      const st = strips(eps);
      if (st) {
        hit = st.map(t => pts.some(p => inR(p, t)));
        st.forEach((t, i) => {
          el('rect', { x: X(t.x0), y: Y(t.y1), width: X(t.x1) - X(t.x0), height: Y(t.y0) - Y(t.y1), class: hit[i] ? 'f-green' : 'f-red', opacity: .16 }, gS);
          path(SK.rect(X(t.x0), Y(t.y1), X(t.x1) - X(t.x0), Y(t.y0) - Y(t.y1), { seed: 20 + i, rough: .3 }), hit[i] ? 's-green' : 's-red', gS, { 'stroke-width': 1, 'stroke-dasharray': '4 3' });
          const cx = (X(t.x0) + X(t.x1)) / 2, cy = (Y(t.y0) + Y(t.y1)) / 2;
          const lx = i === 0 ? X(t.x0) - 12 : i === 2 ? X(t.x1) + 12 : cx, ly = i === 1 ? Y(t.y1) - 6 : i === 3 ? Y(t.y0) + 14 : cy + 4;
          textSub(gS, lx, ly, 'T', String(t.n), 'lbl lbl-serif', { 'text-anchor': 'middle', fill: hit[i] ? 'var(--green)' : 'var(--red)' });
        });
      }
    }
    if ($('#clt-rg-show').checked || !r) path(SK.rect(X(Rt.x0), Y(Rt.y1), X(Rt.x1) - X(Rt.x0), Y(Rt.y0) - Y(Rt.y1), { seed: 5, rough: .6 }), 's-ink', gP, { 'stroke-width': 1.3, 'stroke-dasharray': '6 4' });
    if ($('#clt-rg-show').checked) text(gP, X(Rt.x0) + 5, Y(Rt.y1) - 5, 'R', 'lbl lbl-serif', {});
    let npos = 0;
    pts.forEach(p => {
      const x = X(p[0]), y = Y(p[1]);
      if (inR(p, Rt)) { npos++; path('M' + r1(x - 4) + ' ' + r1(y) + 'H' + r1(x + 4) + 'M' + r1(x) + ' ' + r1(y - 4) + 'V' + r1(y + 4), 's-blue', gP, { 'stroke-width': 1.8 }); }
      else el('circle', { cx: r1(x), cy: r1(y), r: 2.8, class: 's-ochre', fill: 'none', 'stroke-width': 1.3 }, gP);
    });
    const bound = Math.min(1, 4 * Math.exp(-m * eps / 4));
    const need = Math.ceil(4 / eps * Math.log(4 / .05));
    out.innerHTML = 'm = ' + m + ' points, ' + npos + ' positive.   err(h<sub>R′</sub>) ≈ <b>' + err.toFixed(3) + '</b> ' +
      (err <= eps ? '<span class="ok">≤ ε</span>' : '<span class="bad">&gt; ε</span>') +
      (hit ? '   ·   strips hit: ' + hit.filter(Boolean).length + ' of 4' + (hit.every(Boolean) ? ' <span class="ok">(so err ≤ ε is guaranteed)</span>' : ' <span class="dim">(no guarantee from the proof)</span>') : '') +
      '<br><span class="dim">bound (1.2) on P[err &gt; ε]: 4e<sup>−mε/4</sup> = ' + (bound >= 1 ? '≥ 1, useless' : bound.toPrecision(2)) + '.   For δ = 0.05, (1.3) asks for m ≥ ' + need + '.</span>';
    hist();
  }
  function hist() {
    clear(gH);
    const eps = +se.value, m = +sm.value;
    const top = .5, X2 = e => HX + Math.min(1, e / top) * HW;
    axisLine(gH, HX, HX + HW + 6, HB, [[X2(0), '0'], [X2(.1), '.1'], [X2(.2), '.2'], [X2(.3), '.3'], [X2(.4), '.4'], [X2(.5), '.5']], { dy: 16, fs: 11 });
    text(gH, HX + HW / 2, HB + 34, 'error of the tightest fit', 'lbl', { 'text-anchor': 'middle' });
    path('M' + r1(X2(eps)) + ' ' + (HT - 8) + 'V' + HB, 's-red', gH, { 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
    text(gH, X2(eps) + 4, HT - 10, 'ε', 'lbl lbl-serif', { fill: 'var(--red)' });
    if (!trials || trials.m !== m || trials.dist !== dist || trials.t !== tseed) {
      text(gH, HX + HW / 2, (HT + HB) / 2, 'press “run 300 trials”', 'lbl', { 'text-anchor': 'middle', opacity: .7 });
      return;
    }
    const B = 50, cnt = new Array(B).fill(0);
    trials.errs.forEach(e => cnt[Math.min(B - 1, Math.floor(e / top * B))]++);
    const mx = Math.max(...cnt, 1), bw = HW / B;
    cnt.forEach((c, i) => { if (!c) return; const h = (HB - HT) * c / mx; el('rect', { x: r1(HX + i * bw + .5), y: r1(HB - h), width: r1(bw - 1), height: r1(h), class: (i + .5) * top / B > eps ? 'f-red' : 'f-blue', opacity: .7 }, gH); });
    const fail = trials.errs.filter(e => e > eps).length / trials.errs.length;
    const bound = Math.min(1, 4 * Math.exp(-m * eps / 4));
    text(gH, HX + HW, HT + 6, 'err > ε in ' + (fail * 100).toFixed(1) + '% of trials', 'lbl', { 'text-anchor': 'end' });
    text(gH, HX + HW, HT + 22, 'bound: ' + (bound >= 1 ? '≥ 100%' : (bound * 100).toPrecision(2) + '%'), 'lbl', { 'text-anchor': 'end', opacity: .75 });
  }
  function runTrials() {
    const m = +sm.value, errs = [];
    for (let t = 0; t < 300; t++) errs.push(errOf(fit(sample(50000 + t * 131 + sseed, m))));
    trials = { m, dist, t: tseed, errs }; hist();
  }
  $$('[data-rg-d]').forEach(b => b.addEventListener('click', () => { dist = b.dataset.rgD; pressGroup($$('[data-rg-d]'), dist, 'data-rg-d'); reference(); trials = null; render(); }));
  sm.addEventListener('input', render); se.addEventListener('input', render);
  $('#clt-rg-new').addEventListener('click', () => { sseed++; render(); });
  $('#clt-rg-tgt').addEventListener('click', () => { tseed++; target(); reference(); trials = null; render(); });
  $('#clt-rg-run').addEventListener('click', runTrials);
  $('#clt-rg-show').addEventListener('change', render); $('#clt-rg-strips').addEventListener('change', render);
  frame(); target(); reference(); render();
});

/* ---------- CLT Ch1 · Fig 1.2: a rectangle and a blob ---------- */
reg('clt-ch1', 'shapes', function () {
  const svg = $('#clt-shapes-svg'); if (!svg) return;
  const g = el('g', {}, svg);
  el('rect', { x: 70, y: 50, width: 170, height: 110, class: 'f-bluew' }, g);
  path(SK.rect(70, 50, 170, 110, { seed: 3, rough: .5 }), 's-blue', g, { 'stroke-width': 1.6 });
  [[70, 'a₁'], [240, 'b₁']].forEach(([x, t]) => { path('M' + x + ' 168V182', 's-soft', g, { 'stroke-dasharray': '2 3' }); text(g, x, 198, t, 'lbl lbl-serif', { 'text-anchor': 'middle' }); });
  [[50, 'b₂'], [160, 'a₂']].forEach(([y, t]) => { path('M62 ' + y + 'H48', 's-soft', g, { 'stroke-dasharray': '2 3' }); text(g, 40, y + 5, t, 'lbl lbl-serif', { 'text-anchor': 'end' }); });
  text(g, 155, 222, 'four numbers', 'lbl', { 'text-anchor': 'middle' });
  const R = rng(17), pts = [], cx = 470, cy = 108;
  for (let i = 0; i < 26; i++) { const t = i / 26 * Math.PI * 2; const rr = 62 + 26 * Math.sin(3 * t + .7) + 14 * Math.sin(7 * t) + 9 * (R() - .5); pts.push([cx + rr * 1.45 * Math.cos(t), cy + rr * .95 * Math.sin(t)]); }
  pts.push(pts[0]);
  const d = curve(pts);
  el('path', { d, class: 'f-ochrew' }, g); path(d, 's-ochre', g, { 'stroke-width': 1.6 });
  pts.slice(0, -1).forEach((p, i) => { if (i % 2 === 0) el('circle', { cx: r1(p[0]), cy: r1(p[1]), r: 2.2, class: 'f-ochre' }, g); });
  text(g, cx, 222, 'one number per bend, and then some', 'lbl', { 'text-anchor': 'middle' });
});

/* ---------- CLT Ch1 · Fig 1.3: the conjunction learner ---------- */
reg('clt-ch1', 'conj', function () {
  const box = $('#clt-cj-lits'); if (!box) return;
  const n = 8; let tseed = 1, eseed = 1, target = null, alive = null, log = [], drawn = 0, used = 0;
  const lit = (i, neg) => '<span class="cj-z">z<sub>' + (i + 1) + '</sub></span>';
  function newTarget() {
    const R = rng(tseed * 53 + 11); target = [];
    const k = 2 + Math.floor(R() * 3);
    const idx = [...Array(n).keys()].sort(() => R() - .5).slice(0, k).sort((a, b) => a - b);
    idx.forEach(i => target.push([i, R() < .5]));
    reset();
  }
  function reset() { alive = []; for (let i = 0; i < n; i++) alive.push([true, true]); log = []; drawn = 0; used = 0; eseed++; render(); }
  const evalT = x => target.every(([i, neg]) => neg ? x[i] === 0 : x[i] === 1);
  let R = rng(1);
  function draw(k) {
    for (let t = 0; t < k; t++) {
      const x = []; for (let i = 0; i < n; i++) x.push(R() < .5 ? 0 : 1);
      const y = evalT(x) ? 1 : 0; drawn++;
      const killed = [];
      if (y === 1) { used++; for (let i = 0; i < n; i++) { const j = x[i] === 0 ? 0 : 1; if (alive[i][j]) { alive[i][j] = false; killed.push([i, j === 1]); } } }
      log.unshift({ x, y, killed });
    }
    log = log.slice(0, 8); render();
  }
  function litHTML(i, neg) { return neg ? '<span class="ov">z</span><sub>' + (i + 1) + '</sub>' : 'z<sub>' + (i + 1) + '</sub>'; }
  function render() {
    $('#clt-cj-target').innerHTML = '<span class="cj-lab">hidden target</span><span class="cj-f"><i>c</i> = ' + target.map(([i, neg]) => '<i>' + litHTML(i, neg) + '</i>').join(' ∧ ') + '</span>';
    let html = '<span class="cj-lab">hypothesis h</span>';
    for (let i = 0; i < n; i++) for (const neg of [false, true]) {
      const on = alive[i][neg ? 1 : 0], inT = target.some(([a, b]) => a === i && b === neg);
      html += '<span class="cj-l' + (on ? '' : ' off') + (inT ? ' tg' : '') + '">' + litHTML(i, neg) + '</span>';
    }
    box.innerHTML = html;
    $('#clt-cj-log').innerHTML = log.map(e => '<div class="cj-row' + (e.y ? '' : ' neg') + '"><span class="cj-x">' + e.x.join('') + '</span><span class="cj-y">' + (e.y ? '+' : '−') + '</span><span class="cj-k">' +
      (e.y ? (e.killed.length ? 'strikes ' + e.killed.map(([i, neg]) => litHTML(i, neg)).join(' ') : 'strikes nothing new') : 'ignored') + '</span></div>').join('') || '<div class="cj-row neg"><span class="cj-k">no examples yet</span></div>';
    let contra = false, k = 0;
    for (let i = 0; i < n; i++) { if (alive[i][0] && alive[i][1]) contra = true; k += (alive[i][0] ? 1 : 0) + (alive[i][1] ? 1 : 0); }
    const pc = Math.pow(2, -target.length), ph = contra ? 0 : Math.pow(2, -k), err = pc - ph;
    $('#clt-cj-out').innerHTML = drawn + ' examples drawn, ' + used + ' positive.   h has ' + k + ' literals' + (contra ? ' and still contains some z<sub>i</sub> ∧ <span class="ov">z</span><sub>i</sub>, so it is false everywhere' : '') +
      '.   err(h) = P[c = 1] − P[h = 1] = ' + (contra ? '2<sup>−' + target.length + '</sup> − 0' : '2<sup>−' + target.length + '</sup> − 2<sup>−' + k + '</sup>') + ' = <b>' + err.toFixed(4) + '</b>' + (err === 0 ? ' <span class="ok">h = c</span>' : '');
  }
  $('#clt-cj-one').addEventListener('click', () => draw(1));
  $('#clt-cj-ten').addEventListener('click', () => draw(10));
  $('#clt-cj-reset').addEventListener('click', () => { R = rng(eseed * 7 + 1); reset(); });
  $('#clt-cj-new').addEventListener('click', () => { tseed++; R = rng(tseed * 3 + 5); newTarget(); });
  newTarget();
});

/* ---------- CLT Ch1 · Fig 1.4: 3-colouring to 3-term DNF ---------- */
reg('clt-ch1', 'colour', function () {
  const svg = $('#clt-col-svg'); if (!svg) return;
  const V = [[150, 34], [62, 110], [238, 110], [96, 198], [150, 258], [214, 198]];
  const E = [[0, 1], [0, 5], [1, 2], [1, 3], [2, 5], [3, 4], [3, 5], [4, 5]];
  const COLS = ['r', 'g', 'b'], CV = { r: 'var(--red)', g: 'var(--green)', b: 'var(--blue)' }, NAME = { r: 'red', g: 'green', b: 'blue' };
  let col = ['r', 'g', 'b', 'r', 'b', 'g'];
  const gE = el('g', {}, svg), gV = el('g', {}, svg);
  const bits = zeros => V.map((_, i) => zeros.includes(i) ? 0 : 1);
  const term = c => V.map((_, i) => i).filter(i => col[i] !== c);   /* T_c = and of z_i over vertices not coloured c */
  const sat = (c, x) => term(c).every(i => x[i] === 1);
  const phi = x => COLS.some(c => sat(c, x));
  function render() {
    clear(gE); clear(gV);
    E.forEach(([a, b], k) => {
      const bad = col[a] === col[b];
      path(SK.line(V[a][0], V[a][1], V[b][0], V[b][1], { seed: 40 + k, rough: .6 }), bad ? 's-red' : 's-soft', gE, { 'stroke-width': bad ? 3.2 : 1.4 });
    });
    V.forEach((p, i) => {
      const g = el('g', { class: 'col-v', tabindex: 0, role: 'button', 'aria-label': 'Vertex ' + (i + 1) + ', ' + NAME[col[i]] + '. Activate to change colour.' }, gV);
      el('circle', { cx: p[0], cy: p[1], r: 17, fill: CV[col[i]], opacity: .2 }, g);
      path(SK.loop(p[0], p[1], 17, 17, { seed: 60 + i, rough: .7 }), '', g, { stroke: CV[col[i]], 'stroke-width': 2, fill: 'none' });
      text(g, p[0], p[1] + 5.5, String(i + 1), 'lbl', { 'text-anchor': 'middle', style: 'font-size:16px;fill:var(--ink);font-weight:600' });
      const step = () => { col[i] = COLS[(COLS.indexOf(col[i]) + 1) % 3]; render(); };
      g.addEventListener('click', step); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); step(); } });
    });
    const tz = c => { const t = term(c); return t.length ? t.map(i => 'z<sub>' + (i + 1) + '</sub>').join('∧') : '(empty: always true)'; };
    let html = '<div class="col-terms">' + COLS.map(c => '<div><span style="color:' + CV[c] + '">T<sub>' + c + '</sub></span> = ' + tz(c) + '</div>').join('') + '</div>';
    let wrong = 0;
    html += '<table class="col-t"><tr><th colspan="3">S<sub>+</sub> (want φ = 1)</th></tr>' + V.map((_, i) => { const x = bits([i]), ok = phi(x); if (!ok) wrong++; return '<tr><td>v(' + (i + 1) + ')</td><td class="mono">' + x.join('') + '</td><td class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓' : '✗') + '</td></tr>'; }).join('') + '</table>';
    html += '<table class="col-t"><tr><th colspan="3">S<sub>−</sub> (want φ = 0)</th></tr>' + E.map(([a, b]) => { const x = bits([a, b]), ok = !phi(x); if (!ok) wrong++; return '<tr><td>e({' + (a + 1) + ',' + (b + 1) + '})</td><td class="mono">' + x.join('') + '</td><td class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓' : '✗') + '</td></tr>'; }).join('') + '</table>';
    $('#clt-col-tables').innerHTML = html;
    const mono = E.filter(([a, b]) => col[a] === col[b]).length;
    $('#clt-col-out').innerHTML = mono ? '<span class="bad">' + mono + ' monochromatic edge' + (mono > 1 ? 's' : '') + '</span>, and φ gets ' + wrong + ' example' + (wrong === 1 ? '' : 's') + ' wrong: a proper colouring and a consistent formula fail together.'
      : '<span class="ok">Proper colouring</span>, and φ = T<sub>r</sub> ∨ T<sub>g</sub> ∨ T<sub>b</sub> labels all ' + (V.length + E.length) + ' examples correctly.';
  }
  render();
});
