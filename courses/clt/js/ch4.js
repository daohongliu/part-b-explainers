/* ---------- CLT Ch4 · Fig 4.1: AdaBoost with decision stumps ---------- */
reg('clt-ch4', 'adaboost', function () {
  const cv = $('#clt-ab-canvas'); if (!cv) return;
  const out = $('#clt-ab-out');
  const W = 720, H = 360, PX = 14, PY = 14, S = 332, GX = 400, GW = 300, GT = 30, GB = 300;
  let data = 'disc', pts = [], D = [], hs = [], hist = [];
  function make() {
    const R = rng({ disc: 3, band: 8, xor: 5 }[data]); pts = [];
    for (let i = 0; i < 60; i++) {
      const x = .04 + .92 * R(), y = .04 + .92 * R();
      let lab;
      if (data === 'disc') lab = Math.hypot(x - .52, y - .48) < .3;
      else if (data === 'band') lab = Math.abs(x + y - 1) < .22;
      else lab = (x < .5) === (y < .5);
      pts.push([x, y, lab ? 1 : -1]);
    }
    D = pts.map(() => 1 / pts.length); hs = []; hist = [];
  }
  const stumpVal = (s, p) => s.sgn * (p[s.f] >= s.th ? 1 : -1);
  function bestStump() {
    let best = null;
    for (const f of [0, 1]) {
      const vals = [...new Set(pts.map(p => p[f]))].sort((a, b) => a - b), ths = [-1];
      for (let i = 0; i + 1 < vals.length; i++) ths.push((vals[i] + vals[i + 1]) / 2);
      for (const th of ths) for (const sgn of [1, -1]) {
        let e = 0; pts.forEach((p, i) => { if (sgn * (p[f] >= th ? 1 : -1) !== p[2]) e += D[i]; });
        if (!best || e < best.e - 1e-12) best = { f, th, sgn, e };
      }
    }
    return best;
  }
  const vote = p => hs.reduce((s, h) => s + h.a * stumpVal(h, p), 0);
  function round() {
    const s = bestStump(); const e = clamp(s.e, 1e-9, 1 - 1e-9);
    s.a = .5 * Math.log((1 - e) / e);
    let Z = 0; const nd = D.map((d, i) => { const v = d * Math.exp(-s.a * pts[i][2] * stumpVal(s, pts[i])); Z += v; return v; });
    D = nd.map(v => v / Z); s.Z = Z; hs.push(s);
    const terr = pts.filter(p => (vote(p) >= 0 ? 1 : -1) !== p[2]).length / pts.length;
    const prodZ = hs.reduce((q, h) => q * h.Z, 1);
    hist.push({ terr, prodZ, eps: s.e });
  }
  function draw() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.body), col = n => cs.getPropertyValue(n).trim();
    const X = u => PX + u * S, Y = v => PY + (1 - v) * S;
    g.fillStyle = col('--paper'); g.globalAlpha = .6; g.fillRect(PX, PY, S, S); g.globalAlpha = 1;
    if (hs.length && $('#clt-ab-region').checked) {
      const n = 83, c = S / n;
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        const v = vote([(a + .5) / n, 1 - (b + .5) / n]);
        g.fillStyle = v >= 0 ? col('--blue') : col('--ochre'); g.globalAlpha = .11 + Math.min(.12, Math.abs(v) * .05);
        g.fillRect(PX + a * c, PY + b * c, c, c);
      }
      g.globalAlpha = 1;
    }
    g.strokeStyle = col('--rule'); g.lineWidth = 1; g.strokeRect(PX, PY, S, S);
    const last = hs[hs.length - 1];
    if (last && last.th > 0) {
      g.setLineDash([6, 4]); g.strokeStyle = col('--ink'); g.lineWidth = 1.5; g.beginPath();
      if (last.f === 0) { g.moveTo(X(last.th), PY); g.lineTo(X(last.th), PY + S); } else { g.moveTo(PX, Y(last.th)); g.lineTo(PX + S, Y(last.th)); }
      g.stroke(); g.setLineDash([]);
    }
    const mx = Math.max(...D);
    pts.forEach((p, i) => {
      const r = 2 + 9 * Math.sqrt(D[i] / mx), x = X(p[0]), y = Y(p[1]);
      const wrong = hs.length && (vote(p) >= 0 ? 1 : -1) !== p[2];
      g.lineWidth = 1.7; g.strokeStyle = p[2] > 0 ? col('--blue') : col('--ochre');
      if (p[2] > 0) { g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, r * .8, 0, 7); g.stroke(); }
      if (wrong) { g.strokeStyle = col('--red'); g.lineWidth = 1; g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.stroke(); }
    });
    /* right panel: log-scale training error and bound */
    g.fillStyle = col('--ink-soft'); g.font = '11px Recursive, ui-monospace, monospace'; g.textAlign = 'right';
    const TM = Math.max(20, hist.length), LY = l => GT + (-l) / 3 * (GB - GT), TX = t => GX + t / TM * GW;
    [0, -1, -2, -3].forEach(k => { g.fillText(k === 0 ? '1' : '10⁻' + -k, GX - 6, LY(k) + 4); g.globalAlpha = .2; g.fillRect(GX, LY(k), GW, 1); g.globalAlpha = 1; });
    g.textAlign = 'center'; [0, TM / 2, TM].forEach(t => g.fillText(String(Math.round(t)), TX(t), GB + 16));
    g.fillText('round t', GX + GW / 2, GB + 34);
    g.strokeStyle = col('--ink-soft'); g.beginPath(); g.moveTo(GX, GT - 6); g.lineTo(GX, GB); g.lineTo(GX + GW, GB); g.stroke();
    const plot = (key, c, dash) => {
      g.strokeStyle = c; g.lineWidth = 2; g.setLineDash(dash || []); g.beginPath();
      const p0 = [TX(0), LY(0)]; g.moveTo(p0[0], p0[1]);
      hist.forEach((h, i) => { const v = Math.max(1e-3, h[key]); g.lineTo(TX(i + 1), LY(Math.log10(v))); });
      g.stroke(); g.setLineDash([]);
    };
    plot('prodZ', col('--ochre'), [5, 4]); plot('terr', col('--blue'));
    g.textAlign = 'left'; g.fillStyle = col('--blue'); g.fillText('training error', GX + 8, GT - 10);
    g.fillStyle = col('--ochre'); g.fillText('∏ Z (bound)', GX + 120, GT - 10);
    const h = hist[hist.length - 1];
    out.innerHTML = 'round ' + hs.length + (h ? ':   weighted error of this stump ε<sub>t</sub> = ' + h.eps.toFixed(3) + ' (γ<sub>t</sub> = ' + (.5 - h.eps).toFixed(3) + '),   training error of the vote = <b>' + (h.terr * 100).toFixed(1) + '%</b>,   ∏Z = ' + h.prodZ.toPrecision(3) +
      (h.terr === 0 ? '   <span class="ok">all 60 training points right</span>' : '') + (.5 - h.eps < .02 ? '<br><span class="bad">The best stump is barely better than a coin toss: no weak learner here.</span>' : '') : ':   press “one round”.');
  }
  $$('[data-ab-d]').forEach(b => b.addEventListener('click', () => { data = b.dataset.abD; pressGroup($$('[data-ab-d]'), data, 'data-ab-d'); make(); draw(); }));
  $('#clt-ab-step').addEventListener('click', () => { round(); draw(); });
  $('#clt-ab-ten').addEventListener('click', () => { for (let i = 0; i < 10; i++) round(); draw(); });
  $('#clt-ab-reset').addEventListener('click', () => { make(); draw(); });
  $('#clt-ab-region').addEventListener('change', draw);
  window.addEventListener('resize', () => { if (cv.offsetParent) draw(); });
  make(); draw();
});
