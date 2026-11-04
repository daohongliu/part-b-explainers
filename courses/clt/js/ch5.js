/* ---------- CLT Ch5 · Fig 5.1: discrete cube roots at toy size ---------- */
reg('clt-ch5', 'cuberoot', function () {
  const cv = $('#clt-cr-canvas'); if (!cv) return;
  const si = $('#clt-cr-i'), sx = $('#clt-cr-x'), out = $('#clt-cr-out');
  const W = 720, H = 330;
  let p = 29, q = 41, N, phi, d, units, root, bits;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const pw = (b, e, m) => { let r = 1; b %= m; while (e > 0) { if (e & 1) r = r * b % m; b = b * b % m; e >>= 1; } return r; };
  function setup() {
    N = p * q; phi = (p - 1) * (q - 1);
    d = 1; while ((3 * d) % phi !== 1) d++;
    units = []; root = {};
    for (let x = 1; x < N; x++) if (gcd(x, N) === 1) { units.push(x); root[x] = pw(x, d, N); }
    bits = Math.ceil(Math.log2(N));
    si.max = bits; if (+si.value > bits) si.value = bits;
    sx.max = units.length; if (+sx.value > units.length) sx.value = Math.ceil(units.length / 3);
  }
  function draw() {
    const i = +si.value, x = units[+sx.value - 1];
    $('#clt-cr-iv').textContent = i; $('#clt-cr-xv').textContent = x;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cs = getComputedStyle(document.body), col = n => cs.getPropertyValue(n).trim();
    const L = 40, R = 706, T = 10, B = 214, X = v => L + v / N * (R - L), Y = v => B - v / N * (B - T);
    g.strokeStyle = col('--rule'); g.lineWidth = 1; g.strokeRect(L, T, R - L, B - T);
    g.fillStyle = col('--ink-soft'); g.font = '11px Recursive, ui-monospace, monospace';
    g.textAlign = 'right'; g.fillText('cube root', L - 6, T + 10); g.fillText(String(N), L - 6, T + 22);
    g.textAlign = 'center'; g.fillText('x', R - 6, B + 14);
    units.forEach(u => { const on = u === x; g.fillStyle = on ? col('--red') : col('--blue'); g.globalAlpha = on ? 1 : .55; g.beginPath(); g.arc(X(u), Y(root[u]), on ? 4.5 : 1.7, 0, 7); g.fill(); });
    g.globalAlpha = 1;
    /* bit strip */
    const sT = 240, sH = 22, n = units.length, cw = (R - L) / n;
    g.textAlign = 'right'; g.fillStyle = col('--ink-soft'); g.fillText('bit ' + i, L - 6, sT + 15);
    units.forEach((u, k) => { const b = root[u] >> (i - 1) & 1; g.fillStyle = b ? col('--blue') : col('--ochre'); g.globalAlpha = b ? .8 : .45; g.fillRect(L + k * cw, sT, Math.max(cw - (cw > 3 ? .6 : 0), .8), sH); });
    g.globalAlpha = 1;
    const kx = +sx.value - 1; g.strokeStyle = col('--red'); g.lineWidth = 2; g.strokeRect(L + kx * cw - 1, sT - 3, Math.max(cw, 2) + 2, sH + 6);
    let ones = 0; units.forEach(u => { ones += root[u] >> (i - 1) & 1; });
    g.textAlign = 'left'; g.fillStyle = col('--ink-soft');
    g.fillText('|Z*N| = ' + n + ' = φ(N);  bit ' + i + ' is 1 on ' + ones + ' of them', L, sT + sH + 18);
    /* decoding steps */
    const K = Math.floor(Math.log2(phi)); const sq = [x];
    for (let j = 1; j <= K; j++) sq.push(sq[j - 1] * sq[j - 1] % N);
    const used = []; for (let j = 0; j <= K; j++) if (d >> j & 1) used.push(j);
    const y = root[x];
    out.innerHTML = 'N = ' + p + ' × ' + q + ' = ' + N + ',   φ(N) = ' + phi + ',   secret d = ' + d + ' = ' + d.toString(2) + '<sub>2</sub>   (3d = ' + 3 * d + ' ≡ 1 mod ' + phi + ')' +
      '<br>squarings:  ' + sq.map((v, j) => '<span class="' + (d >> j & 1 ? 'cr-on' : 'cr-off') + '">x<sup>' + (1 << j) + '</sup> ≡ ' + v + '</span>').join('  ') +
      '<br>cube root of ' + x + ' = ' + used.map(j => 'x<sup>' + (1 << j) + '</sup>').join(' · ') + ' ≡ <b>' + y + '</b>   check: ' + y + '³ = ' + (y * y * y).toLocaleString('en-GB') + ' ≡ ' + pw(y, 3, N) + ' (mod ' + N + ').   bit ' + i + ' of ' + y + ' = ' + y.toString(2) + '<sub>2</sub> is <b>' + (y >> (i - 1) & 1) + '</b>';
  }
  $$('[data-cr-n]').forEach(b => b.addEventListener('click', () => { [p, q] = b.dataset.crN.split(',').map(Number); pressGroup($$('[data-cr-n]'), b.dataset.crN, 'data-cr-n'); setup(); draw(); }));
  si.addEventListener('input', draw); sx.addEventListener('input', draw);
  window.addEventListener('resize', () => { if (cv.offsetParent) draw(); });
  setup(); draw();
});
