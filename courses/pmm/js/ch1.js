/* ---------- hero: the triple ---------- */
reg('ch1', 'hero', function () {
  const svg = $('#hero-svg'); if (!svg) return;
  const gFill = el('g', {}, svg), gPencil = el('g', {}, svg), gInk = el('g', {}, svg), gUI = el('g', {}, svg);
  const OX = 127, OY = 120, ORX = 106, ORY = 86, AX = 96, AY = 104, ARX = 50, ARY = 42;
  const ell = (cx, cy, rx, ry) => 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + 2 * rx + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0Z';
  const fOm = el('path', { d: ell(OX + 3, OY + 2, ORX - 4, ORY - 4), class: 'f-ochrew fade', opacity: 0 }, gFill);
  const fComp = el('path', { d: ell(OX + 3, OY + 2, ORX - 4, ORY - 4) + ell(AX + 2, AY + 2, ARX, ARY), class: 'f-ochrew fade', 'fill-rule': 'evenodd', opacity: 0 }, gFill);
  const fA = el('path', { d: ell(AX + 2, AY + 2, ARX, ARY), class: 'f-ochrew fade', opacity: 0 }, gFill);
  const ink = [];
  ink.push(path(SK.loop(OX, OY, ORX, ORY, { seed: 3 }), 's-ink', gInk, { 'stroke-width': 1.7 }));
  ink.push(path(SK.loop(AX, AY, ARX, ARY, { seed: 8, rough: .8 }), 's-blue', gInk, { 'stroke-width': 1.5 }));
  text(gInk, 54, 72, 'A', 'lbl-blue lbl-serif', { 'font-size': 18 });
  text(gInk, 16, 46, 'Ω', 'lbl-ink lbl-serif', { 'font-size': 20 });
  // outcomes: 6 in A, 12 outside
  const R = rng(21), pts = [];
  const inA = (x, y) => ((x - AX) / (ARX - 6)) ** 2 + ((y - AY) / (ARY - 6)) ** 2 < 1;
  const inO = (x, y) => ((x - OX) / (ORX - 10)) ** 2 + ((y - OY) / (ORY - 10)) ** 2 < 1;
  const farOk = (x, y) => pts.every(p => Math.hypot(p[0] - x, p[1] - y) > 19);
  let guard = 0;
  while (pts.filter(p => p[2]).length < 6 && guard++ < 4000) { const x = AX - ARX + R() * 2 * ARX, y = AY - ARY + R() * 2 * ARY; if (inA(x, y) && farOk(x, y)) pts.push([x, y, true]); }
  guard = 0;
  while (pts.filter(p => !p[2]).length < 12 && guard++ < 6000) {
    const x = OX - ORX + R() * 2 * ORX, y = OY - ORY + R() * 2 * ORY;
    const nearA = ((x - AX) / (ARX + 8)) ** 2 + ((y - AY) / (ARY + 8)) ** 2 < 1;
    if (inO(x, y) && !nearA && farOk(x, y)) pts.push([x, y, false]);
  }
  pts.forEach((p, i) => el('circle', { cx: r1(p[0]), cy: r1(p[1]), r: 2.7 + (i % 3) * .25, class: 'f-ink' }, gInk));
  const nA = pts.filter(p => p[2]).length, nT = pts.length;

  // drawer of events
  const cards = [
    { lab: '∅', v: 0, num: 0, x: 322, rot: -3 },
    { lab: 'A', v: nA / nT, num: nA, x: 352, rot: 2 },
    { lab: 'A', sup: 'c', v: 1 - nA / nT, num: nT - nA, x: 382, rot: -1.5 },
    { lab: 'Ω', v: 1, num: nT, x: 412, rot: 3 }
  ];
  const cardG = [];
  cards.forEach((c, i) => {
    const g = el('g', { class: 'card-btn', tabindex: 0, role: 'button', 'aria-label': 'Weigh the event ' + (c.sup ? 'A complement' : c.lab) }, gUI);
    const face = el('g', { class: 'cardface', style: 'transition: transform .35s cubic-bezier(.3,1.6,.5,1)' }, g);
    const inner = el('g', { transform: 'rotate(' + c.rot + ' ' + (c.x + 14) + ' 150)' }, face);
    el('rect', { x: c.x, y: 92, width: 28, height: 66, class: 'f-paper s s-ink', 'stroke-width': 1.3, rx: 2 }, inner);
    path(SK.line(c.x + 5, 112, c.x + 23, 112, { seed: 40 + i, single: true, rough: .5 }), 's-soft', inner, { 'stroke-width': .9 });
    const t = text(inner, c.x + 14, 106, c.lab, 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 15 });
    if (c.sup) { const s = el('tspan', { dy: -6, 'font-size': '0.7em' }, t); s.textContent = c.sup; }
    cardG.push({ g: g, face: face });
  });
  // drawer front occludes the cards' lower halves
  const front = el('g', {}, gUI);
  el('rect', { x: 305, y: 150, width: 150, height: 72, class: 'f-paper' }, front);
  ink.push(path(SK.rect(305, 150, 150, 72, { seed: 61, rough: .8 }), 's-ink', front, { 'stroke-width': 1.6 }));
  ink.push(path(SK.line(305, 150, 318, 130, { seed: 66 }) + SK.line(455, 150, 442, 130, { seed: 67 }) + SK.line(318, 130, 442, 130, { seed: 68 }), 's-ink', gInk, { 'stroke-width': 1.3 }));
  ink.push(path(SK.loop(380, 190, 18, 7, { seed: 69, square: 4 }), 's-ink', front, { 'stroke-width': 1.4 }));
  text(front, 380, 172, 'events', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });

  // dial
  const DX = 633, DY = 184, DR = 84;
  const arc = [];
  for (let i = 0; i <= 24; i++) { const th = Math.PI + Math.PI * i / 24; arc.push([DX + DR * Math.cos(th), DY + DR * Math.sin(th)]); }
  ink.push(path(curve(arc), 's-ink', gInk, { 'stroke-width': 1.7 }));
  ink.push(path(SK.line(DX - DR - 14, DY + 2, DX + DR + 14, DY + 2, { seed: 71 }), 's-ink', gInk, { 'stroke-width': 1.5 }));
  [[0, '0'], [.25, null], [.5, '½'], [.75, null], [1, '1']].forEach(tk => {
    const th = Math.PI + Math.PI * tk[0], c = Math.cos(th), s = Math.sin(th);
    path(SK.line(DX + (DR - 10) * c, DY + (DR - 10) * s, DX + DR * c, DY + DR * s, { single: true, seed: 80 + tk[0] * 8 }), 's-ink', gInk, { 'stroke-width': 1.3 });
    if (tk[1]) text(gInk, DX + (DR + 15) * c, DY + (DR + 15) * s + 4, tk[1], 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
  });
  text(gInk, DX + DR + 8, DY - DR + 14, 'µ', 'lbl-ink lbl-serif', { 'font-size': 19 });
  const needle = el('g', {}, gUI);
  path('M' + DX + ' ' + DY + 'L' + (DX - DR + 18) + ' ' + (DY - 1.5) + 'M' + DX + ' ' + DY + 'L' + (DX - DR + 18) + ' ' + (DY + 1.5), 's-red', needle, { 'stroke-width': 1.6 });
  el('circle', { cx: DX, cy: DY, r: 5.5, class: 'f-ink' }, gUI);
  const read = text(gUI, DX, DY + 30, '', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 14 });

  // connecting arrows
  ink.push(path(curve([[238, 92], [262, 80], [292, 92]]), 's-soft', gInk, { 'stroke-width': 1.2 }));
  arrowHead(gInk, 292, 92, 1, 'soft', 7);
  text(gInk, 264, 70, 'which events?', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
  ink.push(path(curve([[468, 120], [500, 100], [530, 112]]), 's-soft', gInk, { 'stroke-width': 1.2 }));
  arrowHead(gInk, 530, 112, 1, 'soft', 7);
  text(gInk, 500, 90, 'how heavy?', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });

  // needle physics
  let v = 0, vel = 0, target = 0, raf = 0;
  function setNeedle(x) { needle.setAttribute('transform', 'rotate(' + r1(clamp(x, -.05, 1.05) * 180) + ' ' + DX + ' ' + DY + ')'); }
  function tick() {
    const acc = .085 * (target - v) - .2 * vel; vel += acc; v += vel;
    if (Math.abs(target - v) < 1e-4 && Math.abs(vel) < 1e-4) { v = target; vel = 0; setNeedle(v); raf = 0; return; }
    setNeedle(v); raf = requestAnimationFrame(tick);
  }
  function setTarget(t) { target = t; if (RM) { v = t; setNeedle(v); return; } if (!raf) raf = requestAnimationFrame(tick); }
  function select(i) {
    cardG.forEach((c, j) => { c.face.style.transform = j === i ? 'translateY(-13px)' : ''; });
    fA.setAttribute('opacity', i === 1 ? 1 : 0); fComp.setAttribute('opacity', i === 2 ? 1 : 0); fOm.setAttribute('opacity', i === 3 ? 1 : 0);
    const c = cards[i];
    read.textContent = 'µ(' + (c.sup ? 'Aᶜ' : c.lab) + ') = ' + c.num + '/' + nT + (c.num && c.num !== nT ? ' ≈ ' + c.v.toFixed(2) : '');
    setTarget(c.v);
  }
  let auto = null, step = 1, cycles = 0;
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
  cardG.forEach((c, i) => {
    c.g.addEventListener('click', () => { stopAuto(); select(i); });
    c.g.addEventListener('pointerenter', () => { stopAuto(); select(i); });
    c.g.addEventListener('focus', () => { stopAuto(); select(i); });
    c.g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopAuto(); select(i); } });
  });
  v = cards[1].v; setNeedle(v); select(1);
  if (!RM) {
    auto = setInterval(() => { step = (step + 1) % 4; if (step === 1) cycles++; if (cycles >= 2) { stopAuto(); return; } select(step); }, 2600);
    // ink over pencil
    requestAnimationFrame(() => {
      ink.forEach((p, i) => {
        let L = 0; try { L = p.getTotalLength(); } catch (_) {}
        if (!L) return;
        const ghost = p.cloneNode(); ghost.setAttribute('class', 's pencil'); gPencil.appendChild(ghost);
        p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        p.style.transition = 'stroke-dashoffset 1.1s ease ' + (0.08 * i) + 's';
      });
      requestAnimationFrame(() => requestAnimationFrame(() => ink.forEach(p => { p.style.strokeDashoffset = 0; })));
    });
  }
});

/* ---------- Fig 1.1: finite / cofinite ---------- */
reg('ch1', 'fc', function () {
  const svg = $('#fc-svg'); if (!svg) return;
  const sl = $('#fc-n'), out = $('#fc-out'), nv = $('#fc-nv'), play = $('#fc-play');
  const N = 24, x0 = 14, cw = 26, y0 = 18, ch = 34;
  const gC = el('g', {}, svg), gB = el('g', {}, svg), fills = [];
  for (let i = 1; i <= N; i++) {
    const x = x0 + (i - 1) * cw;
    fills.push(el('rect', { x: x + 2.5, y: y0 + 3, width: cw - 5, height: ch - 5, class: 'f-ochrew fade', opacity: 0 }, gC));
    path(SK.rect(x, y0, cw, ch, { seed: i * 5, rough: .55 }), 's-soft', gC, { 'stroke-width': 1 });
    text(gC, x + cw / 2, y0 + ch / 2 + 4.5, String(i), 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 11.5 });
  }
  const ex = x0 + N * cw;
  const eFill = el('rect', { x: ex + 3, y: y0 + 3, width: 26, height: ch - 5, class: 'f-ochrew fade', opacity: 0 }, gC);
  text(gC, ex + 16, y0 + ch / 2 + 5, '…', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 15 });
  function render() {
    const n = +sl.value, inf = n >= 13;
    nv.textContent = inf ? '∞' : n;
    fills.forEach((f, i) => { const k = i + 1; f.setAttribute('opacity', (k % 2 === 0 && (inf || k <= 2 * n)) ? 1 : 0); });
    eFill.setAttribute('opacity', inf ? 1 : 0);
    clear(gB);
    const xEnd = inf ? ex + 28 : x0 + (2 * n) * cw;
    const yb = y0 + ch + 10;
    path(SK.line(x0 + cw + 4, yb, x0 + cw + 4, yb + 6, { single: true, seed: 3 }) + SK.line(x0 + cw + 4, yb + 6, xEnd - 4, yb + 6, { seed: 4 }) +
         SK.line(xEnd - 4, yb + 6, xEnd - 4, yb, { single: true, seed: 5 }), inf ? 's-red' : 's-ochre', gB, { 'stroke-width': 1.3 });
    const mid = (x0 + cw + xEnd) / 2;
    if (inf) text(gB, mid, yb + 26, '⋃ₙ Aₙ = the even numbers', 'lbl-red', { 'text-anchor': 'middle', 'font-size': 13 });
    else textSub(gB, mid, yb + 26, 'A', String(n), 'lbl-ochre', { 'text-anchor': 'middle', 'font-size': 14 });
    if (inf) {
      out.innerHTML = '⋃<sub>n</sub> A<sub>n</sub> = {2, 4, 6, …}. It is infinite, and so is its complement {1, 3, 5, …}. <span class="bad">Not in the algebra</span>: a countable union of members has escaped.';
    } else {
      const els = []; for (let k = 1; k <= Math.min(n, 4); k++) els.push(2 * k);
      const list = n <= 4 ? els.join(', ') : '2, 4, …, ' + 2 * n;
      out.innerHTML = 'A<sub>' + n + '</sub> = {' + list + '} has ' + n + ' element' + (n > 1 ? 's' : '') + ': finite, <span class="ok">so it is in the algebra</span>.';
    }
  }
  let timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; } play.textContent = '▸ play'; }
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (+sl.value >= 13) sl.value = 1;
    play.textContent = '❚❚ pause'; render();
    timer = setInterval(() => { const n = +sl.value; if (n >= 13) { stop(); return; } sl.value = n + 1; render(); }, RM ? 900 : 420);
  });
  sl.addEventListener('input', () => { stop(); render(); });
  render();
});

/* ---------- Fig 1.2: monotone limits ---------- */
reg('ch1', 'mono', function () {
  const svg = $('#mono-svg'); if (!svg) return;
  const sl = $('#mono-n'), nv = $('#mono-nv'), out = $('#mono-out'), btns = $$('#fig1-2 [data-mode]');
  const L = 92, Rx = 560, VX = 600, TOP = 26, RH = 25, LIMY = 252, AXY = 284;
  const modes = {
    up: { dom: [0, 10], name: 'F', set: k => [0, k], mu: k => String(k), lim: 'up' },
    down: { dom: [0, 1.08], name: 'G', set: k => [0, 1 / k], mu: k => (k === 1 ? '1' : '1/' + k), lim: 'empty' },
    run: { dom: [0, 10], name: 'G', set: k => [k, Infinity], mu: () => '∞', lim: 'empty' }
  };
  let mode = 'run';
  const g = el('g', {}, svg);
  function render() {
    const n = +sl.value; nv.textContent = n; const M = modes[mode];
    const X = x => L + (x - M.dom[0]) / (M.dom[1] - M.dom[0]) * (Rx - L);
    clear(g);
    text(g, VX + 20, TOP - 12, 'measure', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
    for (let k = 1; k <= n; k++) {
      const y = TOP + (k - 1) * RH + 6, s = M.set(k);
      textSub(g, 18, y + 4, M.name, String(k), 'lbl-ink', { 'font-size': 14 });
      path(SK.line(L, y, Rx + 18, y, { seed: 200 + k, rough: .3 }), 's-rule', g, { 'stroke-width': 1 });
      const x2 = s[1] === Infinity ? Rx + 18 : X(s[1]);
      seg(g, X(s[0]), x2, y, { color: 'blue', hatch: 'blue', left: 'open', right: s[1] === Infinity ? 'inf' : 'closed', seed: 300 + k });
      text(g, VX + 20, y + 4, M.mu(k), 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
    }
    if (n < 8) text(g, 26, TOP + n * RH + 10, '⋮', 'lbl', { 'font-size': 14 });
    path(SK.line(14, LIMY - 18, 650, LIMY - 18, { seed: 77, rough: .5 }), 's-rule', g, { 'stroke-width': 1, 'stroke-dasharray': '3 4' });
    const limLabel = mode === 'up' ? '⋃ₙ Fₙ' : '⋂ₙ Gₙ';
    text(g, 18, LIMY + 4, limLabel, 'lbl-ink', { 'font-size': 13 });
    if (M.lim === 'up') {
      seg(g, X(0), Rx + 18, LIMY, { color: 'ink', hatch: 'ink', left: 'open', right: 'inf', seed: 401 });
      text(g, VX + 20, LIMY + 4, '∞', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
    } else {
      text(g, (L + Rx) / 2, LIMY + 5, '∅', 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 17 });
      text(g, VX + 20, LIMY + 4, '0', mode === 'run' ? 'lbl-red' : 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
    }
    const ticks = [];
    if (M.dom[1] > 5) for (let t = 0; t <= 10; t += 1) ticks.push([X(t), String(t)]);
    else [0, .25, .5, .75, 1].forEach(t => ticks.push([X(t), t === 0 ? '0' : t === 1 ? '1' : String(t)]));
    axisLine(g, L - 6, Rx + 18, AXY, ticks, { dy: 16, fs: 11 });
    if (mode === 'up') out.innerHTML = 'µ(F<sub>n</sub>) = n ↑ ∞ = µ((0, ∞)). <span class="ok">Continuity from below.</span>';
    else if (mode === 'down') out.innerHTML = 'µ(G<sub>n</sub>) = 1/n ↓ 0 = µ(∅), and µ(G<sub>1</sub>) = 1 &lt; ∞. <span class="ok">Continuity from above.</span>';
    else out.innerHTML = 'µ(G<sub>n</sub>) = ∞ for every n, but µ(∅) = 0. <span class="bad">No set in the sequence has finite measure, and continuity fails.</span><div class="note-line">The mass hasn’t vanished; it has emigrated.</div>';
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-mode'); pressGroup(btns, mode, 'data-mode'); render(); }));
  sl.addEventListener('input', render);
  render();
});

/* ---------- Fig 1.3: the plan ---------- */
reg('ch1', 'road', function () {
  const svg = $('#road-svg'); if (!svg) return;
  const g = el('g', {}, svg);
  el('rect', { x: 26, y: 50, width: 200, height: 72, class: 'f-bluew' }, g);
  path(SK.rect(22, 46, 204, 76, { seed: 501, rough: .9 }), 's-ink', g, { 'stroke-width': 1.5 });
  text(g, 124, 74, 'values on a small class', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
  text(g, 124, 94, 'e.g. µ((a,b]) = b − a', 'lbl', { 'text-anchor': 'middle', 'font-size': 12 });
  text(g, 124, 111, '(an algebra, a π-system)', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
  el('rect', { x: 458, y: 50, width: 196, height: 72, class: 'f-ochrew' }, g);
  path(SK.rect(454, 46, 200, 76, { seed: 511, rough: .9 }), 's-ink', g, { 'stroke-width': 1.5 });
  text(g, 554, 80, 'a measure on the whole', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
  text(g, 554, 98, 'σ-algebra it generates', 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 13 });
  path(curve([[232, 70], [340, 52], [446, 70]]), 's-blue', g, { 'stroke-width': 1.6 });
  arrowHead(g, 446, 70, 1, 'blue', 9);
  text(g, 340, 22, 'is there one?', 'lbl-blue', { 'text-anchor': 'middle', 'font-size': 13 });
  text(g, 340, 38, 'construction · Carathéodory, Thm 1.12', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
  path(curve([[232, 104], [340, 120], [446, 104]]), 's-ochre', g, { 'stroke-width': 1.6 });
  arrowHead(g, 446, 104, 1, 'ochre', 9);
  text(g, 340, 144, 'is there only one?', 'lbl-ochre', { 'text-anchor': 'middle', 'font-size': 13 });
  text(g, 340, 161, 'uniqueness · π-systems, Thm 1.11', 'lbl', { 'text-anchor': 'middle', 'font-size': 11 });
});

/* ---------- Fig 1.4: the σ-algebra machine ---------- */
reg('ch1', 'sigma', function () {
  const svg = $('#sig-svg'); if (!svg) return;
  const pop = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
  const low = m => { for (let i = 0; i < 6; i++) if (m >> i & 1) return i; return 99; };
  const setStr = m => { if (m === 0) return '∅'; if (m === 63) return 'Ω'; const a = []; for (let i = 0; i < 6; i++) if (m >> i & 1) a.push(i + 1); return '{' + a.join(',') + '}'; };
  const setHtml = m => setStr(m);
  let gens = [3, 42], sel = 0, hover = null;
  const gOm = el('g', {}, svg), gLoops = el('g', { class: 'fade' }, svg), gPeb = el('g', {}, svg);
  path(SK.loop(340, 104, 318, 76, { seed: 99, square: 5, rough: .6 }), 's-ink', gOm, { 'stroke-width': 1.5 });
  text(gOm, 4, 22, 'Ω', 'lbl-ink lbl-serif', { 'font-size': 20 });
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const pebs = [];
  for (let i = 0; i < 6; i++) {
    const g = el('g', { class: 'peb', tabindex: 0, role: 'button', 'aria-label': 'Face ' + (i + 1), 'aria-pressed': 'false', style: 'cursor:pointer;transition:transform .6s cubic-bezier(.5,0,.2,1), opacity .25s' }, gPeb);
    const bg = el('path', { d: SK.loop(0, 0, 17, 17, { seed: 120 + i, square: 6, rough: .5, n: 28 }), class: 'f-paper s s-ink', 'stroke-width': 1.6 }, g);
    (PIPS[i + 1]).forEach(p => el('circle', { cx: p[0] * 8, cy: p[1] * 8, r: 2.6, class: 'f-ink' }, g));
    const ring = el('path', { d: SK.loop(0, 0, 23, 23, { seed: 140 + i, square: 4, rough: .8 }), class: 's s-ochre', 'stroke-width': 2.4, opacity: 0 }, g);
    const lab = text(g, 0, 50, String(i + 1), '', { 'text-anchor': 'middle', 'font-size': 11 });
    g.addEventListener('click', () => { sel ^= (1 << i); update(); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel ^= (1 << i); update(); } });
    pebs.push({ g: g, bg: bg, ring: ring, lab: lab });
  }
  function atomsOf(gs) {
    const groups = new Map();
    for (let x = 0; x < 6; x++) { const sig = gs.map(m => (m >> x) & 1).join(''); groups.set(sig, (groups.get(sig) || 0) | (1 << x)); }
    return Array.from(groups.values()).sort((a, b) => low(a) - low(b));
  }
  function members(atoms) {
    const out = [], k = atoms.length;
    for (let s = 0; s < (1 << k); s++) { let m = 0; for (let j = 0; j < k; j++) if (s >> j & 1) m |= atoms[j]; out.push(m); }
    return out.sort((a, b) => pop(a) - pop(b) || a - b);
  }
  const presetBtns = $$('#sig-presets [data-gen]');
  const addBtn = $('#sig-add'), selLab = $('#sig-sel-label'), gensBox = $('#sig-gens'), countBox = $('#sig-count'), info = $('#sig-info'), grid = $('#sig-grid');
  let lastAtomsKey = '';
  function paintPebbles() {
    pebs.forEach((p, i) => {
      const inSel = sel >> i & 1, inHov = hover != null && (hover >> i & 1);
      p.ring.setAttribute('opacity', inSel ? 1 : 0);
      p.bg.setAttribute('class', 's ' + (inHov ? 'f-bluew s-blue' : 'f-paper s-ink'));
      p.g.style.opacity = hover != null && !inHov ? .32 : 1;
      p.g.setAttribute('aria-pressed', String(!!inSel));
    });
  }
  function update() {
    const atoms = atomsOf(gens), k = atoms.length;
    // layout
    const sp = 50, gap = 34, total = 6 * sp + (k - 1) * gap;
    let x = 340 - total / 2;
    const loopsKey = atoms.join(',');
    const loops = [];
    atoms.forEach(a => {
      const n = pop(a), w = n * sp; let j = 0;
      for (let i = 0; i < 6; i++) if (a >> i & 1) { pebs[i].g.style.transform = 'translate(' + (x + sp / 2 + j * sp) + 'px,' + 100 + 'px)'; j++; }
      loops.push([x + w / 2, w / 2 + 4, a]);
      x += w + gap;
    });
    if (loopsKey !== lastAtomsKey) {
      clear(gLoops);
      if (k > 1) loops.forEach(L => path(SK.loop(L[0], 100, L[1], 34, { seed: 700 + L[2], square: 3.2, rough: .9 }), 's-blue', gLoops, { 'stroke-width': 1.5 }));
      if (lastAtomsKey && !RM) { gLoops.style.opacity = 0; setTimeout(() => { gLoops.style.opacity = 1; }, 420); }
      lastAtomsKey = loopsKey;
    }
    paintPebbles();
    // presets
    presetBtns.forEach(b => b.setAttribute('aria-pressed', String(gens.indexOf(+b.getAttribute('data-gen')) >= 0)));
    // selection
    if (sel) { selLab.textContent = 'Your event: ' + setStr(sel); } else { selLab.textContent = 'Click faces to build your own event.'; }
    addBtn.disabled = !sel || gens.indexOf(sel) >= 0;
    // generator chips
    gensBox.innerHTML = '';
    if (!gens.length) { const s = document.createElement('span'); s.className = 'mono'; s.style.color = 'var(--ink-soft)'; s.style.fontSize = '.8rem'; s.textContent = 'No generating events yet.'; gensBox.appendChild(s); }
    gens.forEach(m => {
      const c = document.createElement('span'); c.className = 'chip';
      c.appendChild(document.createTextNode(setStr(m)));
      const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + setStr(m)); x.textContent = '×';
      x.addEventListener('click', () => { gens = gens.filter(q => q !== m); update(); });
      c.addEventListener('mouseenter', () => { hover = m; paintPebbles(); }); c.addEventListener('mouseleave', () => { hover = null; paintPebbles(); });
      c.appendChild(x); gensBox.appendChild(c);
    });
    // counts and story
    const N = 1 << k;
    countBox.innerHTML = '<b>' + k + '</b> atom' + (k > 1 ? 's' : '') + ': ' + atoms.map(setStr).join('  ') + '  →  |σ(<i>A</i>)| = 2<sup>' + k + '</sup> = <b>' + N + '</b>';
    let story = '';
    if (k === 1) story = 'σ(<i>A</i>) = {∅, Ω}, the trivial σ-algebra. You learn only that the die was rolled, which, to be fair, you knew.';
    else if (k === 6) story = 'All 2<sup>6</sup> = 64 subsets: σ(<i>A</i>) = <i>P</i>(Ω). You learn the exact roll. Laplace’s demon nods.';
    else if (k === 2 && (atoms[0] === 21 || atoms[0] === 42)) story = 'You are told whether the roll is even, and nothing more.';
    else {
      const fresh = atoms.find(a => gens.every(g => g !== a && (63 ^ g) !== a));
      if (fresh != null && gens.length) {
        const expr = gens.map(g => (fresh & g) ? setStr(g) : setStr(g) + '<sup>c</sup>').join(' ∩ ');
        story = 'You are told which of the ' + k + ' atoms the roll landed in. Notice ' + setStr(fresh) + ' is in σ(<i>A</i>) though you never asked for it: ' + setStr(fresh) + ' = ' + expr + '.';
      } else story = 'You are told which of the ' + k + ' atoms the roll landed in, and nothing finer.';
    }
    info.innerHTML = story;
    // punch cards
    grid.innerHTML = '';
    members(atoms).forEach(m => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pcard'; b.setAttribute('aria-label', 'Event ' + setStr(m));
      const h = document.createElement('span'); h.className = 'holes';
      for (let i = 0; i < 6; i++) { const d = document.createElement('i'); if (m >> i & 1) d.className = 'on'; h.appendChild(d); }
      const t = document.createElement('span'); t.textContent = setStr(m);
      b.appendChild(h); b.appendChild(t);
      const on = () => { hover = m; paintPebbles(); }, off = () => { hover = null; paintPebbles(); };
      b.addEventListener('mouseenter', on); b.addEventListener('mouseleave', off); b.addEventListener('focus', on); b.addEventListener('blur', off);
      b.addEventListener('click', () => { sel = m; update(); });
      grid.appendChild(b);
    });
  }
  presetBtns.forEach(b => b.addEventListener('click', () => {
    const m = +b.getAttribute('data-gen'); const i = gens.indexOf(m);
    if (i >= 0) gens.splice(i, 1); else gens.push(m); update();
  }));
  addBtn.addEventListener('click', () => { if (sel && gens.indexOf(sel) < 0) { gens.push(sel); sel = 0; update(); } });
  $('#sig-clear').addEventListener('click', () => { gens = []; sel = 0; update(); });
  // initial placement without animation
  pebs.forEach(p => { p.g.style.transition = 'none'; });
  update();
  requestAnimationFrame(() => requestAnimationFrame(() => pebs.forEach(p => { p.g.style.transition = 'transform .6s cubic-bezier(.5,0,.2,1), opacity .25s'; })));
});

/* ---------- Fig 1.5: Borel kit ---------- */
reg('ch1', 'borel', function () {
  const svg = $('#bk-svg'); if (!svg) return;
  const D0 = -3, D1 = 3, L = 46, Rx = 636, AXY = 168;
  const X = x => L + (x - D0) / (D1 - D0) * (Rx - L), Xi = p => D0 + (p - L) / (Rx - L) * (D1 - D0);
  const tabs = $$('#fig1-5 [data-step]'), texts = $$('#fig1-5 [data-st]'), sl = $('#bk-n'), nv = $('#bk-nv'), nName = $('#bk-n-name'), nWrap = $('#bk-n-wrap');
  const st = { step: 1, x: -0.8, y: 1.2, a: -1.4, b: 1.3, n: 3, N: 3 };
  const gAx = el('g', {}, svg), g = el('g', {}, svg), gH = el('g', {}, svg);
  const ticks = []; for (let t = -3; t <= 3; t++) ticks.push([X(t), String(t).replace('-', '−')]);
  axisLine(gAx, L - 10, Rx + 10, AXY, ticks, { dy: 21, fs: 11 });
  function makeHandle(name) {
    const h = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'endpoint ' + name }, gH);
    el('rect', { x: -14, y: AXY - 28, width: 28, height: 40, fill: 'transparent' }, h);
    el('circle', { cx: 0, cy: AXY, r: 7, class: 's s-ink f-paper knob', 'stroke-width': 1.6 }, h);
    const t = text(h, 0, AXY - 13, name, 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 14 });
    return { g: h, t: t, key: null };
  }
  const H = [makeHandle('a'), makeHandle('b')];
  H.forEach(h => {
    drag(h.g, svg, p => { if (!h.key) return; st[h.key] = clamp(Math.round(Xi(p.x) * 20) / 20, -2.9, 2.9); constrain(h.key); render(); });
    keyNudge(h.g, () => st[h.key], v => { st[h.key] = clamp(Math.round(v * 20) / 20, -2.9, 2.9); constrain(h.key); render(); }, .05, .5);
  });
  function constrain(k) { if (k === 'a' && st.a > st.b - .1) st.a = st.b - .1; if (k === 'b' && st.b < st.a + .1) st.b = st.a + .1; }
  function rowLabel(y, s, cls) { text(g, L - 8, y - 10, s, cls || 'lbl', { 'font-size': 12 }); }
  const U = [[-2.6, -0.9], [0.4, 2.3]];
  function render() {
    clear(g);
    const s = st.step;
    tabs.forEach(b => b.setAttribute('aria-pressed', String(+b.getAttribute('data-step') === s)));
    texts.forEach(t => { t.hidden = +t.getAttribute('data-st') !== s; });
    const showN = s === 3 || s === 4 || s === 5;
    nWrap.hidden = !showN;
    if (s === 5) { nName.textContent = 'N'; sl.max = 24; sl.value = st.N; nv.textContent = st.N; }
    else if (showN) { nName.textContent = 'n'; sl.max = 24; sl.value = st.n; nv.textContent = st.n; }
    const keys = { 1: ['x', 'y'], 2: ['a', 'b'], 3: [null, 'b'], 4: ['a', 'b'], 5: [null, null], 6: ['x', null] }[s];
    H.forEach((h, i) => {
      h.key = keys[i]; h.g.style.display = h.key ? '' : 'none';
      if (h.key) { h.t.textContent = h.key; h.g.setAttribute('transform', 'translate(' + X(st[h.key]) + ',0)'); h.g.setAttribute('aria-valuenow', st[h.key]); h.g.setAttribute('aria-label', 'endpoint ' + h.key); }
    });
    const left = L - 10;
    if (s === 1) {
      seg(g, left, X(st.x), 34, { color: 'blue', hatch: 'blue', left: 'inf', right: 'closed', seed: 11 }); rowLabel(34, '(−∞, x]', 'lbl-blue');
      seg(g, left, X(st.y), 64, { color: 'ochre', hatch: 'ochre', left: 'inf', right: 'closed', seed: 12 }); rowLabel(64, '(−∞, y]', 'lbl-ochre');
      const m = Math.min(st.x, st.y);
      seg(g, left, X(m), 112, { color: 'ink', hatch: 'ink', left: 'inf', right: 'closed', seed: 13, w: 2.6 }); rowLabel(112, '∩ = (−∞, min(x, y)]', 'lbl-ink');
      path(SK.line(X(m), 118, X(m), AXY - 4, { single: true, seed: 14 }), 's-soft', g, { 'stroke-dasharray': '2 4', 'stroke-width': 1 });
    } else if (s === 2) {
      seg(g, left, X(st.b), 34, { color: 'blue', hatch: 'blue', left: 'inf', right: 'closed', seed: 21 }); rowLabel(34, '(−∞, b]', 'lbl-blue');
      seg(g, left, X(st.a), 64, { color: 'red', hatch: 'red', left: 'inf', right: 'closed', seed: 22 }); rowLabel(64, 'minus (−∞, a]', 'lbl-red');
      seg(g, X(st.a), X(st.b), 112, { color: 'ink', hatch: 'ink', left: 'open', right: 'closed', seed: 23, w: 2.6 }); rowLabel(112, '= (a, b]', 'lbl-ink');
    } else if (s === 3 || s === 4) {
      const n = st.n, show = []; for (let k = 1; k <= Math.min(n, 5); k++) show.push(k); if (n > 5) show.push(n);
      show.forEach((k, i) => {
        const y = 22 + i * 15;
        if (s === 3) seg(g, X(Math.max(D0, st.b - 1 / k)), X(st.b), y, { color: 'blue', left: 'open', right: 'closed', h: 0, w: 1.8, seed: 30 + k });
        else { const r = st.b - 1 / k; if (r > st.a) seg(g, X(st.a), X(r), y, { color: 'blue', left: 'open', right: 'closed', h: 0, w: 1.8, seed: 40 + k }); else text(g, X(st.a) + 6, y + 4, '∅', 'lbl', { 'font-size': 12 }); }
        text(g, L - 6, y + 4, (i === 5 ? '…' : '') + 'n=' + k, 'lbl', { 'text-anchor': 'end', 'font-size': 10.5 });
      });
      if (s === 3) {
        endMark(g, X(st.b), 126, 'closed', 'ink'); rowLabel(130, '⋂ₙ = {b}', 'lbl-ink');
        text(g, Rx + 4, 150, 'width of the n-th: 1/' + n + ' = ' + (1 / n).toFixed(3), 'lbl', { 'text-anchor': 'end', 'font-size': 11.5 });
      } else {
        seg(g, X(st.a), X(st.b), 126, { color: 'ink', hatch: 'ink', left: 'open', right: 'open', seed: 49, w: 2.6 }); rowLabel(130, '⋃ₙ = (a, b)', 'lbl-ink');
      }
    } else if (s === 5) {
      const N = st.N;
      U.forEach((c, i) => seg(g, X(c[0]), X(c[1]), 30, { color: 'blue', hatch: 'blue', left: 'open', right: 'open', seed: 51 + i }));
      rowLabel(30, 'U', 'lbl-blue lbl-serif');
      U.forEach((c, i) => {
        const lo = Math.ceil(c[0] * N - 1e-9) / N, hi = Math.floor(c[1] * N + 1e-9) / N;
        for (let j = Math.round(lo * N); j < Math.round(hi * N); j++) {
          const p = j / N, q = (j + 1) / N, x1 = X(p), x2 = X(q), h = Math.min(30, (x2 - x1) * .55 + 3);
          path('M' + r1(x1) + ' 92Q' + r1((x1 + x2) / 2) + ' ' + r1(92 - 2 * h) + ' ' + r1(x2) + ' 92', 's-ochre', g, { 'stroke-width': 1.1 });
        }
        if (hi > lo) seg(g, X(lo), X(hi), 126, { color: 'ink', hatch: 'ink', left: 'open', right: 'open', seed: 57 + i, w: 2.6 });
      });
      rowLabel(130, 'union of (p, q) ⊆ U, p, q ∈ ℤ/' + N, 'lbl-ink');
    } else if (s === 6) {
      seg(g, left, X(st.x), 50, { color: 'ink', hatch: 'ink', left: 'inf', right: 'closed', seed: 61, w: 2.6 }); rowLabel(50, '(−∞, x]  closed', 'lbl-ink');
      seg(g, X(st.x), Rx + 10, 100, { color: 'blue', hatch: 'blue', left: 'open', right: 'inf', seed: 62 }); text(g, Rx + 4, 128, 'complement (x, ∞): open', 'lbl-blue', { 'font-size': 12, 'text-anchor': 'end' });
    }
  }
  tabs.forEach(b => b.addEventListener('click', () => { st.step = +b.getAttribute('data-step'); render(); }));
  sl.addEventListener('input', () => { if (st.step === 5) st.N = +sl.value; else st.n = +sl.value; render(); });
  render();
});

/* ---------- Fig 1.6: why the π ---------- */
reg('ch1', 'pi', function () {
  const svg = $('#pi-svg'); if (!svg) return;
  const sl = $('#pi-t'), tv = $('#pi-tv'), btn = $('#pi-close'), tilesBox = $('#pi-tiles'), out = $('#pi-out');
  let t = +sl.value, closed = false, saved = t, hover = null;
  const panels = [{ cx: 170, title: 'µ₁: uniform' }, { cx: 510, title: 'µ₂' }];
  const off = [[-44, -42], [44, -42], [-44, 42], [44, 42]], CY = 124;
  const gStatic = el('g', {}, svg), gDyn = el('g', {}, svg);
  const titles = [];
  panels.forEach((p, k) => {
    titles.push(text(gStatic, p.cx, 22, p.title, 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 14 }));
    path(SK.loop(p.cx, CY - 42, 92, 36, { seed: 900 + k, square: 3, rough: .9 }), 's-blue', gStatic, { 'stroke-width': 1.5 });
    path(SK.loop(p.cx - 44, CY, 38, 88, { seed: 910 + k, square: 3, rough: .9 }), 's-ochre', gStatic, { 'stroke-width': 1.5 });
    text(gStatic, p.cx + 98, CY - 64, '{1,2}', 'lbl-blue', { 'font-size': 11.5 });
    text(gStatic, p.cx - 110, CY + 82, '{1,3}', 'lbl-ochre', { 'font-size': 11.5 });
  });
  const redLoops = el('g', { class: 'fade' }, svg);
  panels.forEach((p, k) => path(SK.loop(p.cx + off[0][0], CY + off[0][1], 30, 30, { seed: 930 + k, rough: 1 }), 's-red', redLoops, { 'stroke-width': 1.8 }));
  const tiles = [];
  const order = []; for (let m = 0; m < 16; m++) order.push(m);
  const pop = m => (m & 1) + (m >> 1 & 1) + (m >> 2 & 1) + (m >> 3 & 1);
  order.sort((a, b) => pop(a) - pop(b) || a - b);
  const name = m => { if (!m) return '∅'; if (m === 15) return 'Ω'; const a = []; for (let i = 0; i < 4; i++) if (m >> i & 1) a.push(i + 1); return '{' + a.join(',') + '}'; };
  order.forEach(m => {
    const d = document.createElement('button'); d.type = 'button'; d.className = 'tile'; d.setAttribute('aria-label', 'Subset ' + name(m));
    const g4 = document.createElement('span'); g4.className = 'g4';
    for (let i = 0; i < 4; i++) { const c = document.createElement('i'); if (m >> i & 1) c.className = 'on'; g4.appendChild(c); }
    const mk = document.createElement('span'); mk.className = 'mk mono';
    d.appendChild(g4); d.appendChild(mk);
    const on = () => { hover = m; draw(); }, offf = () => { hover = null; draw(); };
    d.addEventListener('mouseenter', on); d.addEventListener('mouseleave', offf); d.addEventListener('focus', on); d.addEventListener('blur', offf);
    tilesBox.appendChild(d); tiles.push({ m: m, d: d, mk: mk });
  });
  const masses = tt => [tt, .5 - tt, .5 - tt, tt];
  const meas = (ms, m) => ms.reduce((s, v, i) => s + ((m >> i & 1) ? v : 0), 0);
  function draw() {
    clear(gDyn);
    const M = [masses(.25), masses(t)];
    titles[1].textContent = 'µ₂: t = ' + t.toFixed(3).replace(/0$/, '');
    panels.forEach((p, k) => {
      off.forEach((o, i) => {
        const x = p.cx + o[0], y = CY + o[1], r = 34 * Math.sqrt(2 * M[k][i]);
        const inH = hover != null && (hover >> i & 1);
        if (r > .5) {
          el('circle', { cx: x + 1.5, cy: y + 1.5, r: r, class: inH ? 'f-bluew' : 'f-ochrew' }, gDyn);
          path(SK.loop(x, y, r, r, { seed: 950 + i + 10 * k, rough: .7 }), inH ? 's-blue' : 's-ink', gDyn, { 'stroke-width': inH ? 2.2 : 1.3 });
        } else path(SK.loop(x, y, 6, 6, { seed: 970 + i }), 's-soft', gDyn, { 'stroke-width': 1, 'stroke-dasharray': '2 3' });
        text(gDyn, x, y + 4, fmt(M[k][i], 2), 'lbl-ink', { 'text-anchor': 'middle', 'font-size': 11 });
        text(gDyn, p.cx + (o[0] < 0 ? -106 : 106), y + 4, String(i + 1), 'lbl', { 'text-anchor': 'middle', 'font-size': 11.5 });
      });
    });
    redLoops.style.opacity = closed ? 1 : 0;
    let agree = 0;
    tiles.forEach(T => {
      const a = meas(M[0], T.m), b = meas(M[1], T.m), ok = Math.abs(a - b) < 1e-9;
      if (ok) agree++;
      T.d.classList.toggle('agree', ok); T.d.classList.toggle('dis', !ok);
      T.mk.textContent = ok ? '✓' : '✗';
    });
    if (hover != null) {
      const a = meas(M[0], hover), b = meas(M[1], hover), ok = Math.abs(a - b) < 1e-9;
      out.innerHTML = name(hover) + ':  µ₁ = ' + fmt(a, 3) + ',  µ₂ = ' + fmt(b, 3) + '  ' + (ok ? '<span class="ok">agree</span>' : '<span class="bad">differ</span>');
    } else if (closed) {
      out.innerHTML = 'Now {{1,2}, {1,3}, {1}} is a π-system. Agreeing on it forces µ₂({1}) = ¼, so t = ¼: <span class="ok">µ₂ = µ₁ on all 16 sets</span>, by necessity.';
    } else if (agree === 16) {
      out.innerHTML = 'At t = ¼ the two coincide on all 16 sets, but only by luck: nothing about {1,2} and {1,3} forced it.';
    } else {
      out.innerHTML = 'They agree on <b>' + agree + '</b> of 16 sets: ∅, {1,2}, {1,3}, {2,4}, {3,4}, Ω. That collection is closed under complements and disjoint unions, but <span class="bad">{1,2} ∩ {1,3} = {1} is not in it</span>.';
    }
  }
  sl.addEventListener('input', () => { t = +sl.value; tv.textContent = t.toFixed(2); draw(); });
  btn.addEventListener('click', () => {
    closed = !closed; btn.setAttribute('aria-pressed', String(closed));
    if (closed) { saved = t; t = .25; sl.value = .25; sl.disabled = true; } else { t = saved; sl.value = saved; sl.disabled = false; }
    tv.textContent = t.toFixed(2); draw();
  });
  draw();
});

/* ---------- Fig 1.7: covering the rationals ---------- */
reg('ch1', 'cover', function () {
  const svg = $('#cov-svg'); if (!svg) return;
  const se = $('#cov-eps'), sk = $('#cov-k'), ev = $('#cov-epsv'), kv = $('#cov-kv'), play = $('#cov-play'), out = $('#cov-out');
  const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
  const Q = []; for (let q = 1; Q.length < 400; q++) for (let p = 0; p <= q && Q.length < 400; p++) if (gcd(p, q) === 1) Q.push(p / q);
  const L = 30, Rx = 650, LY = 168, X = x => L + x * (Rx - L);
  const cp = el('clipPath', { id: 'cov-clip' }, el('defs', {}, svg)); el('rect', { x: 0, y: 0, width: 680, height: 222 }, cp);
  const g = el('g', { 'clip-path': 'url(#cov-clip)' }, svg), gAx = el('g', {}, svg);
  axisLine(gAx, L - 8, Rx + 8, LY, [[X(0), '0'], [X(.25), '¼'], [X(.5), '½'], [X(.75), '¾'], [X(1), '1']], { dy: 34, fs: 12 });
  const epsOf = s => Math.pow(10, -1.6 + 1.6 * s / 100);
  function render() {
    const eps = epsOf(+se.value), K = +sk.value;
    ev.textContent = eps.toFixed(eps < .1 ? 3 : 2); kv.textContent = K;
    clear(g);
    const iv = [];
    for (let j = 1; j <= K; j++) { const c = Q[j - 1], len = eps / Math.pow(2, j); iv.push([c - len / 2, c + len / 2, j]); }
    // union inside [0,1]
    const cl = iv.map(v => [Math.max(0, v[0]), Math.min(1, v[1])]).filter(v => v[1] > v[0]).sort((a, b) => a[0] - b[0]);
    const un = [];
    cl.forEach(v => { if (un.length && v[0] <= un[un.length - 1][1]) un[un.length - 1][1] = Math.max(un[un.length - 1][1], v[1]); else un.push([v[0], v[1]]); });
    const covered = un.reduce((s, v) => s + v[1] - v[0], 0);
    // gaps
    let cur = 0; const gaps = [];
    un.forEach(v => { if (v[0] > cur) gaps.push([cur, v[0]]); cur = Math.max(cur, v[1]); }); if (cur < 1) gaps.push([cur, 1]);
    gaps.forEach(v => el('rect', { x: X(v[0]), y: LY - 7, width: Math.max(.6, X(v[1]) - X(v[0])), height: 14, fill: 'url(#h-red)' }, g));
    un.forEach(v => el('rect', { x: X(v[0]), y: LY - 3, width: Math.max(.6, X(v[1]) - X(v[0])), height: 6, class: 'f-blue', opacity: .85 }, g));
    // arches
    iv.forEach(v => {
      const x1 = X(v[0]), x2 = X(v[1]), w = x2 - x1;
      if (w < .9) { path('M' + r1((x1 + x2) / 2) + ' ' + (LY - 3) + 'l0 -4', 's-blue', g, { 'stroke-width': .8, opacity: .7 }); return; }
      const h = Math.min(122, 4 + w * .62);
      el('path', { d: 'M' + r1(x1) + ' ' + LY + 'Q' + r1((x1 + x2) / 2) + ' ' + r1(LY - 2 * h) + ' ' + r1(x2) + ' ' + LY, class: 'f-bluew s s-blue', 'stroke-width': v[2] <= 6 ? 1.4 : 1, opacity: .9 }, g);
    });
    // rational dots
    let unc = 0;
    Q.forEach((q, i) => {
      const isC = iv.some(v => q > v[0] && q < v[1]);
      if (!isC) unc++;
      el('circle', { cx: r1(X(q)), cy: LY + 13, r: i < 12 ? 2.4 : 1.5, class: isC ? 'f-blue' : 'f-red', opacity: isC ? .55 : .9 }, g);
    });
    const sumLen = eps * (1 - Math.pow(2, -K));
    out.innerHTML = 'Σ lengths = ε(1 − 2<sup>−' + K + '</sup>) = ' + fmt(sumLen, 4) + ' &lt; ε = ' + fmt(eps, 3) +
      '<br>covered part of [0, 1]: ' + fmt(covered, 4) + '    <span class="bad">uncovered: ' + fmt(1 - covered, 4) + ' ≥ 1 − ε</span>' +
      '<br><span class="dim">of the first 400 rationals, ' + unc + ' still uncovered (red dots)</span>';
  }
  let timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; } play.textContent = '▸ keep covering'; }
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (+sk.value >= 200) sk.value = 0;
    play.textContent = '❚❚ pause';
    timer = setInterval(() => { const k = +sk.value; if (k >= 200) { stop(); return; } sk.value = k + (k < 30 ? 1 : 3); render(); }, RM ? 400 : 90);
  });
  se.addEventListener('input', render); sk.addEventListener('input', () => { stop(); render(); });
  render();
});

/* ---------- Fig 1.8: distribution function workbench ---------- */
reg('ch1', 'workbench', function () {
  const svg = $('#wb-svg'); if (!svg) return;
  const X0 = -1, X1 = 7, L = 56, Rx = 700;
  const X = x => L + (x - X0) / (X1 - X0) * (Rx - L), Xi = p => X0 + (p - L) / (Rx - L) * (X1 - X0);
  const FT = 22, FB = 228, Y = v => FB - v * (FB - FT);
  const HY = FB + 6;              // handles band
  const ST = 302, SB = 396;       // strip
  const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return s * y; };
  const ncdf = (x, m, s) => .5 * (1 + erf((x - m) / (s * Math.SQRT2)));
  const npdf = (x, m, s) => Math.exp(-.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  function cantor(t) { if (t <= 0) return 0; if (t >= 1) return 1; let r = 0, sc = .5; for (let i = 0; i < 40; i++) { t *= 3; const d = Math.floor(t); t -= d; if (d === 1) return r + sc; if (d === 2) r += sc; sc /= 2; } return r; }
  const ac = (w, cdf, pdf) => ({ t: 'ac', w: w, cdf: cdf, pdf: pdf });
  const PRE = {
    uniform: { d: 'Density 1 on [0, 1]: F climbs in a straight line from 0 to 1.', c: () => [ac(1, x => clamp(x, 0, 1), x => (x >= 0 && x <= 1 ? 1 : 0))] },
    normal: { d: 'Normal, mean 3, variance 1. F is smooth and F′ is the bell curve.', c: () => [ac(1, x => ncdf(x, 3, 1), x => npdf(x, 3, 1))] },
    expo: { d: 'Exponential(1): F(x) = 1 − e^(−x) for x ≥ 0, and 0 before.', c: () => [ac(1, x => (x < 0 ? 0 : 1 - Math.exp(-x)), x => (x < 0 ? 0 : Math.exp(-x)))] },
    die: { d: 'Six atoms of mass 1/6. F is a staircase, and every jump has its filled dot on top.', c: () => [1, 2, 3, 4, 5, 6].map(k => ({ t: 'atom', w: 1 / 6, x: k })) },
    poisson: { d: 'Poisson(2): atoms at 0, 1, 2, … of mass e^(−2)·2^k/k!. The atoms past 7 are off the chart but still count.', c: () => { const o = []; let p = Math.exp(-2); for (let k = 0; k <= 25; k++) { o.push({ t: 'atom', w: p, x: k }); p *= 2 / (k + 1); } return o; } },
    cantor: { d: 'The Devil’s staircase on [0, 6]: continuous, no atoms, and no density either.', c: () => [{ t: 'cantor', w: 1, lo: 0, hi: 6 }] },
    mix: { d: 'One of each kind: 40% normal, 30% in two atoms, 30% Cantor.', c: () => [ac(.4, x => ncdf(x, 1.6, .55), x => npdf(x, 1.6, .55)), { t: 'atom', w: .1, x: 0 }, { t: 'atom', w: .2, x: 3.5 }, { t: 'cantor', w: .3, lo: 4, hi: 7 }] }
  };
  let comps = PRE.mix.c(), a = 0.8, b = 3.5, preset = 'mix', userAtoms = 0;
  function Fv(x, left) {
    let s = 0;
    for (const c of comps) {
      if (c.t === 'ac') s += c.w * c.cdf(x);
      else if (c.t === 'atom') s += c.w * (left ? (x > c.x + 1e-12 ? 1 : 0) : (x >= c.x - 1e-12 ? 1 : 0));
      else s += c.w * cantor((x - c.lo) / (c.hi - c.lo));
    }
    return Math.min(1, s);
  }
  const F = x => Fv(x, false), Fm = x => Fv(x, true);
  function atoms() {
    const m = new Map();
    comps.forEach(c => { if (c.t === 'atom') { const k = Math.round(c.x * 1e6) / 1e6; m.set(k, (m.get(k) || 0) + c.w); } });
    return Array.from(m.entries()).map(e => ({ x: e[0], w: e[1] })).sort((p, q) => p.x - q.x);
  }
  const gAx = el('g', {}, svg), gShade = el('g', { 'pointer-events': 'none' }, svg), gStrip = el('g', { 'pointer-events': 'none' }, svg);
  const hit = el('rect', { x: L, y: ST - 8, width: Rx - L, height: SB - ST + 10, fill: 'transparent', style: 'cursor:crosshair' }, svg);
  const gCurve = el('g', { 'pointer-events': 'none' }, svg), gGuide = el('g', { 'pointer-events': 'none' }, svg), gH = el('g', {}, svg);
  // axes (static)
  path(SK.line(L, FB, L, FT - 6, { seed: 1001, rough: .4 }), 's-soft', gAx, { 'stroke-width': 1.1 });
  [0, .25, .5, .75, 1].forEach(v => {
    path(SK.line(L - 4, Y(v), L + 4, Y(v), { single: true, seed: 1010 + v * 8 }), 's-soft', gAx, { 'stroke-width': 1 });
    text(gAx, L - 9, Y(v) + 4, v === 0 ? '0' : v === 1 ? '1' : String(v), '', { 'text-anchor': 'end', 'font-size': 11 });
  });
  path('M' + L + ' ' + Y(1) + 'L' + Rx + ' ' + Y(1), 's-rule', gAx, { 'stroke-dasharray': '3 5', 'stroke-width': 1 });
  const xt = []; for (let t = -1; t <= 7; t++) xt.push([X(t), null]);
  axisLine(gAx, L, Rx + 6, FB, xt);
  const st2 = []; for (let t = -1; t <= 7; t++) st2.push([X(t), String(t).replace('-', '−')]);
  axisLine(gAx, L, Rx + 6, SB, st2, { dy: 18, fs: 11 });
  text(gAx, L + 8, FT + 2, 'F(x) = µ((−∞, x])', 'lbl-ink', { 'font-size': 12.5 });
  text(gAx, Rx, ST - 12, 'the measure µ itself: density, atoms, dust', 'lbl', { 'font-size': 11.5, 'text-anchor': 'end' });
  // handles
  function mkHandle(name) {
    const h = el('g', { class: 'handle', tabindex: 0, role: 'slider', 'aria-label': 'interval endpoint ' + name, 'aria-valuemin': X0, 'aria-valuemax': X1 }, gH);
    el('rect', { x: -15, y: HY - 2, width: 30, height: 40, fill: 'transparent' }, h);
    el('path', { d: 'M0 ' + (HY + 2) + 'L-7 ' + (HY + 15) + 'L7 ' + (HY + 15) + 'Z', class: 's s-ink f-paper knob', 'stroke-width': 1.6 }, h);
    text(h, 0, HY + 33, name, 'lbl-ink lbl-serif', { 'text-anchor': 'middle', 'font-size': 18 });
    return h;
  }
  const hA = mkHandle('a'), hB = mkHandle('b');
  function snap(v) {
    const px = X(v); let best = null;
    atoms().forEach(p => { if (Math.abs(X(p.x) - px) < 8 && (best == null || Math.abs(X(p.x) - px) < Math.abs(X(best) - px))) best = p.x; });
    return best != null ? best : Math.round(v * 20) / 20;
  }
  drag(hA, svg, p => { a = Math.min(snap(clamp(Xi(p.x), X0, X1)), b); render(); });
  drag(hB, svg, p => { b = Math.max(snap(clamp(Xi(p.x), X0, X1)), a); render(); });
  const renderAll = () => { drawCurve(); drawStrip(); render(); };
  keyNudge(hA, () => a, v => { a = clamp(Math.min(Math.round(v * 20) / 20, b), X0, X1); render(); }, .05, .5);
  keyNudge(hB, () => b, v => { b = clamp(Math.max(Math.round(v * 20) / 20, a), X0, X1); render(); }, .05, .5);
  hit.addEventListener('click', e => {
    const p = svgPt(svg, e), x = clamp(Math.round(Xi(p.x) * 20) / 20, X0 + .05, X1 - .05);
    if (userAtoms >= 12) { $('#wb-desc').textContent = 'That’s plenty of atoms. Pick a preset to start again.'; return; }
    comps = comps.map(c => Object.assign({}, c, { w: c.w * .85 })); comps.push({ t: 'atom', w: .15, x: x }); userAtoms++;
    preset = 'custom'; pressGroup($$('#wb-presets [data-preset]'), preset, 'data-preset');
    $('#wb-desc').textContent = 'Your own measure: each click scaled the old one by 0.85 and added an atom of mass 0.15. It is still a probability measure.';
    renderAll();
  });
  function drawCurve() {
    clear(gCurve);
    const at = atoms().filter(p => p.x > X0 && p.x < X1);
    const br = [X0].concat(at.map(p => p.x), [X1]);
    let d = '';
    for (let i = 0; i < br.length - 1; i++) {
      const u = br[i], v = br[i + 1], n = Math.max(2, Math.ceil((X(v) - X(u)) / 1.2));
      for (let k = 0; k <= n; k++) {
        const x = u + (v - u) * k / n;
        const val = (k === n && i < br.length - 2) ? Fm(v) : F(x);
        d += (k === 0 ? 'M' : 'L') + r1(X(x)) + ' ' + r1(Y(val));
      }
    }
    el('path', { d: d, class: 's s-ink', 'stroke-width': 2.1 }, gCurve);
    at.forEach(p => {
      const lo = Fm(p.x), hi = F(p.x);
      el('path', { d: 'M' + r1(X(p.x)) + ' ' + r1(Y(lo)) + 'L' + r1(X(p.x)) + ' ' + r1(Y(hi)), class: 's s-soft', 'stroke-dasharray': '2 3', 'stroke-width': 1 }, gCurve);
      el('circle', { cx: r1(X(p.x)), cy: r1(Y(lo)), r: 3.6, class: 'f-paper s s-ink', 'stroke-width': 1.5 }, gCurve);
      el('circle', { cx: r1(X(p.x)), cy: r1(Y(hi)), r: 3.6, class: 'f-ink' }, gCurve);
    });
  }
  function drawStrip() {
    clear(gStrip);
    const acs = comps.filter(c => c.t === 'ac');
    if (acs.length) {
      let d = 'M' + X(X0) + ' ' + SB; const n = 320;
      for (let k = 0; k <= n; k++) { const x = X0 + (X1 - X0) * k / n; const f = acs.reduce((s, c) => s + c.w * c.pdf(x), 0); d += 'L' + r1(X(x)) + ' ' + r1(SB - Math.min(86, 72 * f)); }
      d += 'L' + X(X1) + ' ' + SB + 'Z';
      el('path', { d: d, class: 'f-bluew s s-blue', 'stroke-width': 1.4 }, gStrip);
    }
    comps.filter(c => c.t === 'cantor').forEach(c => {
      const lev = 6, n = 1 << lev, w = (c.hi - c.lo) / Math.pow(3, lev);
      for (let i = 0; i < n; i++) {
        let left = 0; for (let j = 0; j < lev; j++) if (i >> (lev - 1 - j) & 1) left += 2 / Math.pow(3, j + 1);
        const x = c.lo + left * (c.hi - c.lo);
        if (x < X0 || x > X1) continue;
        const hgt = 5 + 40 * c.w * ((i * 7919) % 5 + 3) / 7;
        el('rect', { x: r1(X(x)), y: r1(SB - hgt), width: Math.max(1, X(x + w) - X(x)), height: r1(hgt), class: 'f-ochre', opacity: .55 }, gStrip);
      }
      text(gStrip, X((c.lo + Math.min(c.hi, X1)) / 2), SB - 52 * c.w - 14, 'Cantor dust', 'lbl-ochre', { 'text-anchor': 'middle', 'font-size': 11 });
    });
    atoms().forEach(p => {
      if (p.x < X0 || p.x > X1) return;
      const h = Math.min(90, 170 * p.w), x = X(p.x);
      path(SK.line(x, SB, x, SB - h, { single: true, seed: Math.round(p.x * 100) + 5, rough: .3 }), 's-ink', gStrip, { 'stroke-width': 1.8 });
      el('circle', { cx: r1(x), cy: r1(SB - h), r: 3.4, class: 'f-ink' }, gStrip);
    });
  }
  function render() {
    clear(gShade); clear(gGuide);
    const xa = X(a), xb = X(b), Fa = F(a), Fb = F(b), Fma = Fm(a), Fmb = Fm(b);
    el('rect', { x: xa, y: FT, width: Math.max(0, xb - xa), height: FB - FT, class: 'f-ochrew', opacity: .45 }, gShade);
    el('rect', { x: xa, y: ST - 4, width: Math.max(0, xb - xa), height: SB - ST + 4, class: 'f-ochrew', opacity: .7 }, gShade);
    text(gShade, xa + 5, ST + 16, '(', 'lbl-ochre', { 'text-anchor': 'middle', 'font-size': 20 });
    text(gShade, xb - 5, ST + 16, ']', 'lbl-ochre', { 'text-anchor': 'middle', 'font-size': 20 });
    [xa, xb].forEach((x, i) => el('path', { d: 'M' + r1(x) + ' ' + FT + 'L' + r1(x) + ' ' + SB, class: 's s-ochre', 'stroke-dasharray': '2 4', 'stroke-width': 1.1 }, gGuide));
    // bracket for F(b) − F(a)
    const right = xb + 92 < Rx, bx = right ? xb + 14 : xa - 14;
    el('path', { d: 'M' + r1(xa) + ' ' + r1(Y(Fa)) + 'L' + r1(bx) + ' ' + r1(Y(Fa)) + 'M' + r1(xb) + ' ' + r1(Y(Fb)) + 'L' + r1(bx) + ' ' + r1(Y(Fb)), class: 's s-ochre', 'stroke-dasharray': '2 3', 'stroke-width': 1 }, gGuide);
    if (Fb - Fa > .004) {
      path(SK.line(bx, Y(Fa), bx, Y(Fb), { single: true, seed: 1201, rough: .4 }) + SK.line(bx - 4, Y(Fa), bx + 4, Y(Fa), { single: true, seed: 1202 }) + SK.line(bx - 4, Y(Fb), bx + 4, Y(Fb), { single: true, seed: 1203 }), 's-ochre', gGuide, { 'stroke-width': 2 });
    }
    text(gGuide, bx + (right ? 8 : -8), (Y(Fa) + Y(Fb)) / 2 + 4, fmt(Fb - Fa), 'lbl-ochre', { 'text-anchor': right ? 'start' : 'end', 'font-size': 13, 'font-weight': 600 });
    el('circle', { cx: r1(xa), cy: r1(Y(Fa)), r: 3.2, class: 'f-ochre' }, gGuide);
    el('circle', { cx: r1(xb), cy: r1(Y(Fb)), r: 3.2, class: 'f-ochre' }, gGuide);
    hA.setAttribute('transform', 'translate(' + r1(xa) + ',0)'); hB.setAttribute('transform', 'translate(' + r1(xb) + ',0)');
    hA.setAttribute('aria-valuenow', a); hB.setAttribute('aria-valuenow', b);
    const jA = Fa - Fma, jB = Fb - Fmb;
    const totals = { ac: 0, d: 0, s: 0 }; comps.forEach(c => { totals[c.t === 'ac' ? 'ac' : c.t === 'atom' ? 'd' : 's'] += c.w; });
    const pct = v => Math.round(v * 100) + '%';
    $('#wb-out').innerHTML =
      'a = ' + fmt(a, 2) + ',  b = ' + fmt(b, 2) + '     F(a) = ' + fmt(Fa) + ',  F(b) = ' + fmt(Fb) +
      '<br><b>µ((a, b]) = F(b) − F(a) = ' + fmt(Fb - Fa) + '</b>' +
      '<br>' + (jA > 1e-9 ? '<span class="bad">a sits on an atom: µ({a}) = F(a) − F(a−) = ' + fmt(jA) + ', excluded from (a, b]</span>' : '<span class="dim">µ({a}) = F(a) − F(a−) = 0</span>') +
      '<br>µ([a, b]) = F(b) − F(a−) = ' + fmt(Fb - Fma) + (jB > 1e-9 ? '    <span class="ok">b sits on an atom of mass ' + fmt(jB) + ', included</span>' : '') +
      '<br><span class="dim">mix: ' + pct(totals.ac) + ' density · ' + pct(totals.d) + ' atoms · ' + pct(totals.s) + ' singular</span>';
  }
  function load(name) {
    preset = name; comps = PRE[name].c(); userAtoms = 0;
    $('#wb-desc').textContent = PRE[name].d;
    pressGroup($$('#wb-presets [data-preset]'), name, 'data-preset');
    drawCurve(); drawStrip(); render();
  }
  $$('#wb-presets [data-preset]').forEach(bn => bn.addEventListener('click', () => load(bn.getAttribute('data-preset'))));
  load('mix');
});

/* ---------- Fig 1.9: where right continuity is used ---------- */
reg('ch1', 'rightcont', function () {
  const svg = $('#rc-svg'); if (!svg) return;
  const btns = $$('#fig1-9 [data-rc]'), sl = $('#rc-n'), nv = $('#rc-nv'), out = $('#rc-out');
  let mode = 'R';
  const L = 46, Rx = 330, X = x => L + (x + 1) / 2.1 * (Rx - L);
  const T = 26, B = 222, Y = v => B - v * (B - T);
  const BL = 404, BR = 664, bw = (BR - BL) / 20;
  const H = x => (x < -1 ? 0 : x < 0 ? .3 * (x + 1) : x > 1 ? 1 : x > 0 ? .7 + .3 * x : (mode === 'R' ? .7 : .3));
  const gS = el('g', {}, svg), g = el('g', {}, svg);
  path(SK.line(L, B, L, T - 6, { seed: 1301, rough: .4 }), 's-soft', gS, { 'stroke-width': 1.1 });
  [0, .3, .7, 1].forEach(v => { path(SK.line(L - 4, Y(v), L + 4, Y(v), { single: true, seed: 1310 + v * 10 }), 's-soft', gS); text(gS, L - 8, Y(v) + 4, String(v), '', { 'text-anchor': 'end', 'font-size': 11 }); });
  axisLine(gS, L, Rx + 4, B, [[X(-1), '−1'], [X(0), '0'], [X(.5), '½'], [X(1), '1']], { dy: 17, fs: 11 });
  path(SK.line(BL - 6, B, BR + 4, B, { seed: 1320, rough: .4 }), 's-soft', gS, { 'stroke-width': 1.1 });
  [1, 5, 10, 15, 20].forEach(k => text(gS, BL + (k - .5) * bw, B + 17, String(k), '', { 'text-anchor': 'middle', 'font-size': 11 }));
  text(gS, BL, T - 8, 'µ₀(Aₖ) = G(1/k) − G(0)', 'lbl-ink', { 'font-size': 12 });
  text(gS, L + 8, T - 8, 'G', 'lbl-ink lbl-serif', { 'font-size': 15 });
  function render() {
    const n = +sl.value; nv.textContent = n; clear(g);
    pressGroup(btns, mode, 'data-rc');
    // curve
    path(SK.line(X(-1), Y(0), X(0), Y(.3), { seed: 1330, rough: .4 }), 's-ink', g, { 'stroke-width': 2.1 });
    path(SK.line(X(0), Y(.7), X(1), Y(1), { seed: 1331, rough: .4 }) + SK.line(X(1), Y(1), X(1.1), Y(1), { seed: 1332, rough: .3 }), 's-ink', g, { 'stroke-width': 2.1 });
    el('path', { d: 'M' + X(0) + ' ' + Y(.3) + 'L' + X(0) + ' ' + Y(.7), class: 's s-soft', 'stroke-dasharray': '2 3' }, g);
    const top = mode === 'R';
    el('circle', { cx: X(0), cy: Y(.7), r: 4, class: top ? 'f-ink' : 'f-paper s s-ink', 'stroke-width': 1.6 }, g);
    el('circle', { cx: X(0), cy: Y(.3), r: 4, class: top ? 'f-paper s s-ink' : 'f-ink', 'stroke-width': 1.6 }, g);
    // A_n
    const xn = X(1 / n), v0 = H(0), vn = H(1 / n);
    el('rect', { x: X(0), y: T, width: xn - X(0), height: B - T, class: 'f-ochrew', opacity: .5 }, g);
    seg(g, X(0), xn, B + 32, { color: 'ochre', left: 'open', right: 'closed', h: 0, w: 2.4, seed: 1340 });
    textSub(g, (X(0) + xn) / 2 + 22, B + 54, 'A', String(n), 'lbl-ochre', { 'text-anchor': 'middle', 'font-size': 12 }, ' = (0, 1/' + n + ']');
    el('path', { d: 'M' + X(0) + ' ' + Y(v0) + 'L' + (Rx + 14) + ' ' + Y(v0) + 'M' + xn + ' ' + Y(vn) + 'L' + (Rx + 14) + ' ' + Y(vn), class: 's s-ochre', 'stroke-dasharray': '2 3' }, g);
    path(SK.line(Rx + 14, Y(v0), Rx + 14, Y(vn), { single: true, seed: 1350, rough: .3 }), 's-ochre', g, { 'stroke-width': 2.2 });
    text(g, Rx + 22, (Y(v0) + Y(vn)) / 2 + 4, fmt(vn - v0, 2), 'lbl-ochre', { 'font-size': 12, 'font-weight': 600 });
    // bars
    const lim = mode === 'R' ? 0 : .4;
    for (let k = 1; k <= 20; k++) {
      const v = H(1 / k) - H(0), x = BL + (k - 1) * bw + 1.5, w = bw - 3;
      el('rect', { x: x, y: Y(v), width: w, height: B - Y(v), fill: k === n ? 'url(#h-ochre)' : 'url(#h-ink)' }, g);
      path(SK.rect(x, Y(v), w, B - Y(v), { seed: 1400 + k, rough: .35 }), k === n ? 's-ochre' : 's-soft', g, { 'stroke-width': k === n ? 1.6 : .9 });
    }
    el('path', { d: 'M' + (BL - 6) + ' ' + Y(lim) + 'L' + (BR + 4) + ' ' + Y(lim), class: 's ' + (mode === 'R' ? 's-green' : 's-red'), 'stroke-dasharray': '5 4', 'stroke-width': 1.4 }, g);
    text(g, BR, Y(lim) - 6, 'limit ' + lim, mode === 'R' ? 'lbl-green' : 'lbl-red', { 'text-anchor': 'end', 'font-size': 11.5 });
    if (mode === 'R') out.innerHTML = 'µ₀(A<sub>' + n + '</sub>) = 0.3/' + n + ' = ' + fmt(vn - v0) + ' → 0. <span class="ok">Lemma 1.5’s test passes.</span><br>(0, 1] = ⨆<sub>k</sub> (1/(k+1), 1/k]:  µ₀((0, 1]) = 0.300  and  Σ<sub>k</sub> µ₀(pieces) = G(1) − lim G(1/n) = 0.300.';
    else out.innerHTML = 'µ₀(A<sub>' + n + '</sub>) = 0.4 + 0.3/' + n + ' = ' + fmt(vn - v0) + ' → 0.4, although A<sub>n</sub> ↓ ∅. <span class="bad">Not countably additive.</span><br>(0, 1] = ⨆<sub>k</sub> (1/(k+1), 1/k]:  µ₀((0, 1]) = 0.700  but  Σ<sub>k</sub> µ₀(pieces) = G(1) − lim G(1/n) = 0.300. <span class="bad">0.4 is unaccounted for.</span>';
  }
  btns.forEach(b => b.addEventListener('click', () => { mode = b.getAttribute('data-rc'); render(); }));
  sl.addEventListener('input', render);
  render();
});

/* ---------- Fig 1.10: the proof, step by step ---------- */
reg('ch1', 'proof', function () {
  const svg = $('#pf-svg'); if (!svg) return;
  const tabs = $$('#fig1-10 [data-pf]'), texts = $$('#fig1-10 [data-pft]');
  const D0 = -8, D1 = 10, L = 64, Rx = 656, X = x => L + (clamp(x, D0, D1) - D0) / (D1 - D0) * (Rx - L);
  const l = 5, INF = Infinity;
  const A = [
    [[-7, -4], [-2, 3], [6, INF]],
    [[-6, -4], [-1.5, 2.5], [7, INF]],
    [[-1.2, 2], [8, INF]],
    [[-0.8, 1.2], [9, INF]]
  ];
  const eta = [.45, .4, .3, .25];
  const Bs = A.map(row => row.map(v => [Math.max(v[0], -l), Math.min(v[1], l)]).filter(v => v[1] > v[0]));
  const Cs = Bs.map((row, n) => row.map(v => [Math.min(v[0] + eta[n], v[1] - .05), v[1]]));
  function inter(P, Qr) { const o = []; P.forEach(p => Qr.forEach(q => { const lo = Math.max(p[0], q[0]), hi = Math.min(p[1], q[1]); if (hi >= lo) o.push([lo, hi]); })); return o; }
  const Es = []; Cs.forEach((row, n) => Es.push(n === 0 ? row.map(v => v.slice()) : inter(Es[n - 1], row)));
  const ROWY = [36, 74, 112, 150], g = el('g', {}, svg), gAx = el('g', {}, svg);
  const tk = []; for (let t = -8; t <= 10; t += 2) tk.push([X(t), String(t).replace('-', '−')]);
  axisLine(gAx, L - 6, Rx + 6, 214, tk, { dy: 17, fs: 10.5 });
  let step = 0;
  function rowSet(row, n, kind, color, hatch, ghost) {
    row.forEach((v, i) => {
      const inf = v[1] === INF, x2 = inf ? Rx + 4 : X(v[1]);
      seg(g, X(v[0]), x2, ROWY[n], { color: color, hatch: hatch, left: kind === 'closed' ? 'closed' : 'open', right: inf ? 'inf' : 'closed', h: ghost ? 0 : 10, w: ghost ? 1.2 : 2.3, seed: 1500 + n * 10 + i + (ghost ? 5 : 0) });
    });
  }
  function render() {
    clear(g);
    tabs.forEach(b => b.setAttribute('aria-pressed', String(+b.getAttribute('data-pf') === step)));
    texts.forEach(t => { t.hidden = +t.getAttribute('data-pft') !== step; });
    const names = ['A', 'B', 'C', 'E'];
    for (let n = 0; n < 4; n++) {
      textSub(g, 14, ROWY[n] + 4, names[step], String(n + 1), 'lbl-ink', { 'font-size': 13 });
      path(SK.line(L - 4, ROWY[n], Rx + 4, ROWY[n], { seed: 1600 + n, rough: .3 }), 's-rule', g, { 'stroke-width': .8 });
    }
    if (step >= 1) {
      [-l, l].forEach((x, i) => {
        el('path', { d: 'M' + X(x) + ' 18L' + X(x) + ' 200', class: 's s-red', 'stroke-dasharray': '4 4', 'stroke-width': 1.2 }, g);
        text(g, X(x), 13, i ? 'l' : '−l', 'lbl-red lbl-serif', { 'text-anchor': 'middle', 'font-size': 13 });
      });
    }
    for (let n = 0; n < 4; n++) {
      if (step === 0) rowSet(A[n], n, 'open', 'blue', 'blue');
      else if (step === 1) { rowSet(A[n], n, 'open', 'soft', null, true); rowSet(Bs[n], n, 'open', 'blue', 'blue'); }
      else if (step === 2) {
        Bs[n].forEach((v, i) => { const c = Cs[n][i]; el('rect', { x: X(v[0]), y: ROWY[n] - 6, width: X(c[0]) - X(v[0]), height: 12, fill: 'url(#h-red)' }, g); });
        rowSet(Bs[n], n, 'open', 'soft', null, true); rowSet(Cs[n], n, 'closed', 'blue', 'blue');
      } else {
        rowSet(Cs[n], n, 'closed', 'soft', null, true); rowSet(Es[n], n, 'closed', 'ink', 'ink');
      }
    }
    if (step === 3) {
      const x = X(0), y = 186;
      const star = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 10, th = -Math.PI / 2 + i * Math.PI / 5; star.push((i ? 'L' : 'M') + r1(x + r * Math.cos(th)) + ' ' + r1(y + r * Math.sin(th))); }
      el('path', { d: star.join('') + 'Z', class: 'f-ochre s s-ink', 'stroke-width': 1 }, g);
      el('path', { d: 'M' + x + ' 156L' + x + ' 175', class: 's s-ochre', 'stroke-dasharray': '2 3' }, g);
      text(g, x + 16, y + 4, 'x ∈ every Eₙ ⊆ Aₙ', 'lbl-ink', { 'font-size': 12 });
    }
  }
  tabs.forEach(b => b.addEventListener('click', () => { step = +b.getAttribute('data-pf'); render(); }));
  render();
});

