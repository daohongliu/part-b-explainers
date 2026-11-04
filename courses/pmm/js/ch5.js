/* ---------- Ch5 · Fig 5.1: is it a stopping time? ---------- */
reg('ch5', 'stoptree', function () {
  const svg = $('#st-svg'); if (!svg) return;
  const btns = $$('#st-presets [data-st]'), out = $('#st-out');
  const N = 5, P = 1 << N, X0 = 50, DX = 118, YT = 18, YB = 356;
  const leafY = i => YT + i * (YB - YT) / (P - 1);
  const bits = p => { const b = []; for (let k = N - 1; k >= 0; k--) b.push((p >> k) & 1); return b; }; // 1 = H
  const S = p => { const b = bits(p), s = [0]; b.forEach(x => s.push(s[s.length - 1] + (x ? 1 : -1))); return s; };
  const firstHit = (s, v) => { for (let n = 0; n <= N; n++) if (s[n] === v) return n; return Infinity; };
  const T = {
    hit: { name: 'first time S = 2', f: p => firstHit(S(p), 2) },
    hh: { name: 'first time of two heads in a row', f: p => { const b = bits(p); for (let n = 2; n <= N; n++) if (b[n - 1] && b[n - 2]) return n; return Infinity; } },
    det: { name: 'the deterministic time n = 3', f: () => 3 },
    after: { name: 'one step after S first hits 2', f: p => { const t = firstHit(S(p), 2); return t === Infinity ? Infinity : (t + 1 <= N ? t + 1 : Infinity); } },
    before: { name: 'one step before S first hits 2', f: p => { const t = firstHit(S(p), 2); return t === Infinity ? Infinity : t - 1; } },
    last0: { name: 'the last time n ≤ 5 with S_n = 0', f: p => { const s = S(p); let l = 0; for (let n = 0; n <= N; n++) if (s[n] === 0) l = n; return l; } },
    argmax: { name: 'the first time S reaches its maximum over 0..5', f: p => { const s = S(p); let m = 0; for (let n = 0; n <= N; n++) if (s[n] > s[m]) m = n; return m; } }
  };
  let key = 'hit', sel = 22;
  const g = el('g', {}, svg);
  // node position: depth n, prefix q (top n bits)
  const nodeY = (n, q) => { const lo = q << (N - n), hi = ((q + 1) << (N - n)) - 1; return (leafY(lo) + leafY(hi)) / 2; };
  function render() {
    clear(g);
    const tau = []; for (let p = 0; p < P; p++) tau.push(T[key].f(p));
    let bad = null;
    for (let n = 0; n <= N; n++) for (let q = 0; q < (1 << n); q++) {
      const paths = []; for (let p = q << (N - n); p < (q + 1) << (N - n); p++) paths.push(p);
      const st = paths.filter(p => tau[p] === n).length;
      const x = X0 + n * DX, y = nodeY(n, q);
      if (n < N) {
        [0, 1].forEach(c => { const y2 = nodeY(n + 1, q * 2 + c), onSel = (sel >> (N - n - 1)) === q * 2 + c && (sel >> (N - n)) === q;
          path('M' + r1(x) + ' ' + r1(y) + 'L' + r1(x + DX) + ' ' + r1(y2), onSel ? 's-blue' : 's-rule', g, { 'stroke-width': onSel ? 2.4 : 1 });
          if (n === 0 || (n === 1 && q === 0)) text(g, x + DX / 2, (y + y2) / 2 + (c ? -4 : 12), c ? 'H' : 'T', 'lbl', { 'text-anchor': 'middle', 'font-size': 10 }); });
      }
      const mixed = st > 0 && st < paths.length, all = st === paths.length && st > 0;
      if (mixed && !bad) bad = { n: n, q: q, stop: paths.filter(p => tau[p] === n), go: paths.filter(p => tau[p] !== n) };
      el('circle', { cx: x, cy: y, r: n === N ? 3.2 : 4.5, class: all ? 'f-ochre' : (mixed ? 'f-paper s s-red' : 'f-ink'), 'stroke-width': 2.4, opacity: all || mixed ? 1 : .55 }, g);
      if (mixed) el('circle', { cx: x, cy: y, r: 9, class: 's s-red', 'stroke-width': 1.6 }, g);
    }
    for (let p = 0; p < P; p++) {
      const y = leafY(p), lg = el('g', { style: 'cursor:pointer' }, g);
      el('rect', { x: X0 + N * DX + 4, y: y - 5.5, width: 60, height: 11, fill: 'transparent' }, lg);
      const s = bits(p).map(b => (b ? 'H' : 'T')).join('');
      text(lg, X0 + N * DX + 10, y + 3.5, s + '  τ=' + (tau[p] === Infinity ? '∞' : tau[p]), p === sel ? 'lbl-blue' : 'lbl', { 'font-size': 8.6 });
      lg.addEventListener('click', () => { sel = p; render(); });
    }
    for (let n = 0; n <= N; n++) text(g, X0 + n * DX, 12, 'n=' + n, 'lbl', { 'text-anchor': 'middle', 'font-size': 10 });
    // selected path marker
    const ts = tau[sel];
    if (ts !== Infinity) { const x = X0 + ts * DX, y = nodeY(ts, sel >> (N - ts)); el('circle', { cx: x, cy: y, r: 7, class: 's s-blue', 'stroke-width': 2 }, g); }
    const seq = bits(sel).map(b => (b ? 'H' : 'T')).join(''), ss = S(sel);
    let msg = 'Path ' + seq + ' (S = ' + ss.join(', ') + '): τ = ' + (ts === Infinity ? '∞' : ts) + '.<br>';
    if (!bad) msg += '<span class="ok">τ = ' + T[key].name + ' is a stopping time:</span> at every node, the paths through it all stop there or all carry on.';
    else {
      const pre = bad.n ? bits(bad.stop[0]).slice(0, bad.n).map(b => (b ? 'H' : 'T')).join('') : '(nothing yet)';
      const a = bits(bad.stop[0]).map(b => (b ? 'H' : 'T')).join(''), b = bits(bad.go[0]).map(b => (b ? 'H' : 'T')).join('');
      msg += '<span class="bad">τ = ' + T[key].name + ' is not a stopping time.</span> At time ' + bad.n + ', after seeing ' + pre + ', the path ' + a + ' says “stop now” but ' + b + ' says “not now”, and nothing seen so far tells them apart. So {τ = ' + bad.n + '} ∉ F<sub>' + bad.n + '</sub>.';
    }
    out.innerHTML = msg;
  }
  btns.forEach(b => b.addEventListener('click', () => { key = b.getAttribute('data-st'); pressGroup(btns, key, 'data-st'); render(); }));
  render();
});
