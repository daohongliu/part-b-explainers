/* ---------- CLT Ch3 · Fig 3.1: shattering tester ---------- */
reg('clt-ch3', 'shatter', function () {
  const svg = $('#clt-sh-svg'); if (!svg) return;
  const out = $('#clt-sh-out'), list = $('#clt-sh-dich');
  const W = 340, H = 300, LINE_Y = 150;
  const BEST = {
    int: [[110, LINE_Y], [230, LINE_Y]],
    rect: [[170, 50], [60, 150], [280, 150], [170, 250]],
    half: [[90, 230], [250, 230], [170, 70]]
  };
  let cls = 'rect', P = BEST.rect.map(p => p.slice()), sel = null;
  const gA = el('g', {}, svg), gC = el('g', {}, svg), gP = el('g', {}, svg);
  function realise(lab) {
    const pos = P.filter((_, i) => lab[i]), neg = P.filter((_, i) => !lab[i]);
    if (cls === 'int') {
      if (!pos.length) return { kind: 'none' };
      const lo = Math.min(...pos.map(p => p[0])), hi = Math.max(...pos.map(p => p[0]));
      return neg.some(p => p[0] >= lo && p[0] <= hi) ? null : { kind: 'int', lo, hi };
    }
    if (cls === 'rect') {
      if (!pos.length) return { kind: 'none' };
      const x0 = Math.min(...pos.map(p => p[0])), x1 = Math.max(...pos.map(p => p[0])), y0 = Math.min(...pos.map(p => p[1])), y1 = Math.max(...pos.map(p => p[1]));
      return neg.some(p => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1) ? null : { kind: 'rect', x0, x1, y0, y1 };
    }
    if (!pos.length || !neg.length) return { kind: pos.length ? 'all' : 'none' };
    const angs = [];
    for (let k = 0; k < 720; k++) angs.push(k / 720 * Math.PI * 2);
    for (let i = 0; i < P.length; i++) for (let j = 0; j < P.length; j++) if (i !== j) {
      const a = Math.atan2(P[j][1] - P[i][1], P[j][0] - P[i][0]) + Math.PI / 2;
      angs.push(a + 1e-4, a - 1e-4, a + Math.PI + 1e-4, a + Math.PI - 1e-4);
    }
    for (const a of angs) {
      const u = [Math.cos(a), Math.sin(a)], d = p => u[0] * p[0] + u[1] * p[1];
      const mp = Math.min(...pos.map(d)), mn = Math.max(...neg.map(d));
      if (mp > mn + 1e-6) return { kind: 'half', u, t: (mp + mn) / 2 };
    }
    return null;
  }
  function frame() {
    clear(gA);
    if (cls === 'int') { path('M14 ' + LINE_Y + 'H' + (W - 14), 's-ink', gA, { 'stroke-width': 1.3 }); arrowHead(gA, W - 12, LINE_Y, 'r'); }
  }
  function render() {
    frame(); clear(gC); clear(gP);
    const m = P.length, labs = [];
    for (let k = 0; k < (1 << m); k++) { const lab = []; for (let i = 0; i < m; i++) lab.push(!!(k >> (m - 1 - i) & 1)); labs.push(lab); }
    const res = labs.map(realise), ok = res.filter(Boolean).length;
    if (sel == null || sel >= labs.length) sel = labs.length - 1 - (1 << Math.max(0, m - 1) >> 0) + 0;
    if (sel < 0 || sel >= labs.length) sel = 0;
    const lab = labs[sel], r = res[sel];
    if (r && r.kind === 'int') { el('rect', { x: r.lo - 12, y: LINE_Y - 9, width: r.hi - r.lo + 24, height: 18, class: 'f-bluew' }, gC); path(SK.rect(r.lo - 12, LINE_Y - 9, r.hi - r.lo + 24, 18, { seed: 4, rough: .3 }), 's-blue', gC, { 'stroke-width': 1.5 }); }
    if (r && r.kind === 'rect') { el('rect', { x: r.x0 - 14, y: r.y0 - 14, width: r.x1 - r.x0 + 28, height: r.y1 - r.y0 + 28, class: 'f-bluew' }, gC); path(SK.rect(r.x0 - 14, r.y0 - 14, r.x1 - r.x0 + 28, r.y1 - r.y0 + 28, { seed: 4, rough: .3 }), 's-blue', gC, { 'stroke-width': 1.5 }); }
    if (r && r.kind === 'half') {
      /* line u·p = t, positive side shaded */
      const u = r.u, t = r.t, v = [-u[1], u[0]], c = [u[0] * t, u[1] * t], L = 900;
      const a = [c[0] - v[0] * L, c[1] - v[1] * L], b = [c[0] + v[0] * L, c[1] + v[1] * L];
      const a2 = [a[0] + u[0] * L, a[1] + u[1] * L], b2 = [b[0] + u[0] * L, b[1] + u[1] * L];
      const cp = el('clipPath', { id: 'clt-sh-clip' }, gC); el('rect', { x: 0, y: 0, width: W, height: H }, cp);
      el('path', { d: poly([a, b, b2, a2]) + 'Z', class: 'f-bluew', 'clip-path': 'url(#clt-sh-clip)' }, gC);
      path(SK.line(a[0], a[1], b[0], b[1], { seed: 3, rough: .3 }), 's-blue', gC, { 'stroke-width': 1.5, 'clip-path': 'url(#clt-sh-clip)' });
    }
    if (r && r.kind === 'all') el('rect', { x: 4, y: 4, width: W - 8, height: H - 8, class: 'f-bluew' }, gC);
    P.forEach((p, i) => {
      const g = el('g', { class: 'sh-pt', tabindex: 0, role: 'slider', 'aria-label': 'Point ' + (i + 1) }, gP);
      if (lab[i]) path('M' + (p[0] - 7) + ' ' + p[1] + 'H' + (p[0] + 7) + 'M' + p[0] + ' ' + (p[1] - 7) + 'V' + (p[1] + 7), 's-blue', g, { 'stroke-width': 2.6 });
      else el('circle', { cx: p[0], cy: p[1], r: 6, class: 's-ochre', fill: 'none', 'stroke-width': 2.2 }, g);
      el('circle', { cx: p[0], cy: p[1], r: 16, fill: 'transparent' }, g);
      text(g, p[0] + 11, p[1] - 10, String(i + 1), 'lbl', { style: 'font-size:13px' });
      drag(g, svg, q => { P[i][0] = clamp(q[0], 14, W - 14); P[i][1] = cls === 'int' ? LINE_Y : clamp(q[1], 14, H - 14); render(); });
    });
    list.innerHTML = labs.map((lb, k) => '<button type="button" role="listitem" class="sh-d' + (res[k] ? '' : ' no') + (k === sel ? ' on' : '') + '" data-k="' + k + '" aria-label="Labelling ' + lb.map((b, i) => (i + 1) + (b ? '+' : '−')).join(' ') + (res[k] ? ', realisable' : ', impossible') + '">' +
      lb.map(b => b ? '<i class="p">+</i>' : '<i class="n">−</i>').join('') + '</button>').join('');
    $$('.sh-d', list).forEach(b => b.addEventListener('click', () => { sel = +b.dataset.k; render(); }));
    const d = { int: 2, rect: 4, half: 3 }[cls];
    out.innerHTML = m + ' point' + (m > 1 ? 's' : '') + ': the class produces <b>' + ok + '</b> of the ' + (1 << m) + ' labellings. ' +
      (ok === 1 << m ? '<span class="ok">Shattered.</span>' : '<span class="bad">Not shattered</span>' + (r ? '' : '; the selected labelling is impossible.')) +
      '<br><span class="dim">VC dimension of this class: ' + d + '. Φ(' + m + ', ' + d + ') = ' + (function () { let s = 0, c = 1; for (let i = 0; i <= d && i <= m; i++) { s += c; c = c * (m - i) / (i + 1); } return s; })() + ' bounds the count for every set of ' + m + ' points.</span>';
  }
  function setClass(c) {
    cls = c; pressGroup($$('[data-sh-c]'), c, 'data-sh-c');
    if (c === 'int') P = P.map(p => [p[0], LINE_Y]);
    sel = null; render();
  }
  $$('[data-sh-c]').forEach(b => b.addEventListener('click', () => setClass(b.dataset.shC)));
  $('#clt-sh-add').addEventListener('click', () => { if (P.length >= 6) return; const R = rng(P.length * 13 + 5); P.push([40 + R() * (W - 80), cls === 'int' ? LINE_Y : 40 + R() * (H - 80)]); sel = null; render(); });
  $('#clt-sh-del').addEventListener('click', () => { if (P.length <= 1) return; P.pop(); sel = null; render(); });
  $('#clt-sh-best').addEventListener('click', () => { P = BEST[cls].map(p => p.slice()); sel = null; render(); });
  render();
});

/* ---------- CLT Ch3 · Fig 3.2: growth function ---------- */
reg('clt-ch3', 'growth', function () {
  const svg = $('#clt-gf-svg'); if (!svg) return;
  const sd = $('#clt-gf-d'), out = $('#clt-gf-out');
  const L = 60, Rr = 700, T = 14, B = 230, MMAX = 40, LMAX = 13;
  const X = m => L + m / MMAX * (Rr - L), Y = lg => B - lg / LMAX * (B - T);
  const gA = el('g', {}, svg), g = el('g', {}, svg);
  axisLine(gA, L, Rr + 8, B, [0, 10, 20, 30, 40].map(m => [X(m), String(m)]), { dy: 16, fs: 11 });
  const sup = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹¹', '¹²', '¹³'];
  vAxis(gA, L, B, T - 4, [0, 3, 6, 9, 12].map(k => [Y(k), '10' + sup[k]]));
  text(gA, Rr, B + 34, 'number of points m', 'lbl', { 'text-anchor': 'end' });
  const Phi = (m, d) => { let s = 0, c = 1; for (let i = 0; i <= d && i <= m; i++) { s += c; c = c * (m - i) / (i + 1); } return s; };
  function render() {
    const d = +sd.value; $('#clt-gf-dv').textContent = d; clear(g);
    const curve_ = (f, cls, extra, from) => { const pts = []; for (let m = from || 0; m <= MMAX; m += .5) { const v = Math.log10(f(m)); if (v <= LMAX + .3) pts.push([X(m), Y(Math.max(0, v))]); } if (pts.length > 1) path(poly(pts), cls, g, extra); return pts; };
    curve_(m => Math.pow(2, m), 's-soft', { 'stroke-width': 1.8 });
    curve_(m => Math.pow(Math.E * m / d, d), 's-ochre', { 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, d);
    const pts = []; for (let m = 0; m <= MMAX; m++) pts.push([X(m), Y(Math.log10(Phi(m, d)))]);
    path(poly(pts), 's-blue', g, { 'stroke-width': 2.4 });
    pts.forEach((p, m) => { if (m % 2 === 0 || m <= d) el('circle', { cx: r1(p[0]), cy: r1(p[1]), r: 2.4, class: 'f-blue' }, g); });
    path('M' + r1(X(d)) + ' ' + T + 'V' + B, 's-soft', g, { 'stroke-dasharray': '2 3' });
    text(g, X(d) + 4, T + 10, 'm = d', 'lbl', {});
    out.innerHTML = 'd = ' + d + ':   at m = 40, 2<sup>m</sup> ≈ ' + Math.pow(2, 40).toExponential(1).replace('e+', ' × 10^') + ', Φ(40, ' + d + ') = ' + Phi(40, d).toLocaleString('en-GB') + ', (em/d)<sup>d</sup> ≈ ' + Math.round(Math.pow(Math.E * 40 / d, d)).toLocaleString('en-GB');
  }
  sd.addEventListener('input', render); render();
});

/* ---------- CLT Ch3 · Fig 3.3: four points in R^3 shattered by planes (three.js) ---------- */
reg('clt-ch3', 'halfspaces3d', function () {
  const canvas = $('#clt-hs-canvas'); if (!canvas) return;
  const note = $('#clt-hs-note'), out = $('#clt-hs-out'), btns = $('#clt-hs-pts');
  const PTS = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]], NAMES = ['0', 'e₁', 'e₂', 'e₃'];
  let lab = [true, false, true, false], spin = !RM;
  function solve() {
    /* rows [x, 1] · [w; w0] = ±1 */
    const A = PTS.map((p, i) => [p[0], p[1], p[2], 1, lab[i] ? 1 : -1]);
    for (let c = 0; c < 4; c++) {
      let piv = c; for (let r = c + 1; r < 4; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < 4; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 5; k++) A[r][k] -= f * A[c][k]; }
    }
    return [A[0][4] / A[0][0], A[1][4] / A[1][1], A[2][4] / A[2][2], A[3][4] / A[3][3]];
  }
  btns.innerHTML = PTS.map((_, i) => '<button type="button" data-hs="' + i + '"></button>').join('');
  function readout(wv) {
    $$('[data-hs]', btns).forEach(b => { const i = +b.dataset.hs; b.textContent = NAMES[i] + ' ' + (lab[i] ? '+' : '−'); b.setAttribute('aria-pressed', String(lab[i])); });
    const [a, b, c, w0] = wv, f = v => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(0).replace('-', '−');
    const lin = ts => { let o = ''; ts.forEach(([v, x]) => { const r = Math.round(v); if (!r) return; const m = Math.abs(r) === 1 && x ? '' : String(Math.abs(r)); o += (o ? (r < 0 ? ' − ' : ' + ') : (r < 0 ? '−' : '')) + m + x; }); return o || '0'; };
    out.innerHTML = lab.every(Boolean) || lab.every(x => !x) ? 'All four points have the same label, so any plane with all of them on one side will do.'
      : 'w = (' + f(a) + ', ' + f(b) + ', ' + f(c) + '), w₀ = ' + f(w0) + ':   positive side {x : ' + lin([[a, 'x₁'], [b, 'x₂'], [c, 'x₃'], [w0, '']]) + ' ≥ 0}.   <span class="ok">Separated.</span> All 16 labellings work, so the set is shattered and VCD ≥ 4.';
  }
  loadThree().then(THREE => {
    note.textContent = '';
    const cs = getComputedStyle(document.body), col = n => new THREE.Color(cs.getPropertyValue(n).trim() || '#888');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1.6, .1, 50);
    cam.position.set(3.1, 2.3, 3.4); cam.lookAt(.3, .3, .3);
    const world = new THREE.Group(); scene.add(world);
    world.position.set(-.05, 0, 0);
    const lineMat = new THREE.LineBasicMaterial({ color: col('--ink-soft'), transparent: true, opacity: .55 });
    const axisMat = new THREE.LineBasicMaterial({ color: col('--rule') });
    const seg = (a, b, m) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); world.add(new THREE.Line(g, m)); };
    seg([0, 0, 0], [1.5, 0, 0], axisMat); seg([0, 0, 0], [0, 1.5, 0], axisMat); seg([0, 0, 0], [0, 0, 1.5], axisMat);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) seg(PTS[i], PTS[j], lineMat);
    const sph = new THREE.SphereGeometry(.07, 24, 16);
    const posMat = new THREE.MeshBasicMaterial({ color: col('--blue') }), negMat = new THREE.MeshBasicMaterial({ color: col('--ochre') });
    const dots = PTS.map(p => { const m = new THREE.Mesh(sph, posMat); m.position.set(...p); world.add(m); return m; });
    const ringGeo = new THREE.RingGeometry(.1, .125, 32);
    const rings = PTS.map(p => { const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col('--ochre'), side: THREE.DoubleSide })); r.position.set(...p); world.add(r); return r; });
    const planeMat = new THREE.MeshBasicMaterial({ color: col('--blue'), transparent: true, opacity: .2, side: THREE.DoubleSide, depthWrite: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), planeMat); world.add(plane);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry), new THREE.LineBasicMaterial({ color: col('--blue'), transparent: true, opacity: .6 }));
    plane.add(edge);
    function update() {
      const wv = solve();
      dots.forEach((d, i) => { d.material = lab[i] ? posMat : negMat; d.visible = lab[i]; rings[i].visible = !lab[i]; });
      const w = new THREE.Vector3(wv[0], wv[1], wv[2]), w0 = wv[3];
      const same = lab.every(Boolean) || lab.every(x => !x);
      plane.visible = !same;
      if (!same) {
        const n2 = w.lengthSq(), c = new THREE.Vector3(.25, .25, .25);
        const center = c.clone().sub(w.clone().multiplyScalar((w.dot(c) + w0) / n2));
        plane.position.copy(center);
        plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), w.clone().normalize());
      }
      readout(wv);
    }
    function size() {
      const wv = canvas.parentElement.clientWidth || 600, hv = Math.min(380, Math.max(240, wv * .58));
      renderer.setSize(wv, hv, false); canvas.style.width = '100%'; canvas.style.height = hv + 'px';
      cam.aspect = wv / hv; cam.updateProjectionMatrix();
    }
    size(); window.addEventListener('resize', () => { size(); draw(); });
    let rotY = .5, rotX = 0, dragging = null, raf = 0, visible = true;
    function draw() { world.rotation.y = rotY; world.rotation.x = rotX; rings.forEach(r => r.quaternion.copy(cam.quaternion).premultiply(world.quaternion.clone().invert())); renderer.render(scene, cam); }
    function loop() { raf = 0; if (spin && visible && !dragging) { rotY += .004; draw(); raf = requestAnimationFrame(loop); } }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    canvas.addEventListener('pointerdown', e => { dragging = [e.clientX, e.clientY, rotY, rotX]; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!dragging) return; rotY = dragging[2] + (e.clientX - dragging[0]) * .01; rotX = clamp(dragging[3] + (e.clientY - dragging[1]) * .01, -1.2, 1.2); draw(); });
    canvas.addEventListener('pointerup', () => { dragging = null; kick(); });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    $$('[data-hs]', btns).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.hs; lab[i] = !lab[i]; update(); draw(); }));
    let k = 5;
    $('#clt-hs-next').addEventListener('click', () => { k = (k + 1) % 16; lab = [0, 1, 2, 3].map(i => !!(k >> (3 - i) & 1)); update(); draw(); });
    const sb = $('#clt-hs-spin'); sb.setAttribute('aria-pressed', String(spin));
    sb.addEventListener('click', () => { spin = !spin; sb.setAttribute('aria-pressed', String(spin)); kick(); });
    update(); draw(); kick();
  }).catch(() => { note.textContent = 'The 3D view needs three.js, which could not be loaded here. The readout below still works.'; readout(solve()); });
});
