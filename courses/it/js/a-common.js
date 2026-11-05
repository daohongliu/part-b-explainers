/* ---------- Information Theory: shared helpers ---------- */
const itLog2 = x => Math.log(x) / Math.LN2;
function itEntropy(ps) { let h = 0; ps.forEach(p => { if (p > 0) h -= p * itLog2(p); }); return h; }
function itBin(p) { return p <= 0 || p >= 1 ? 0 : -p * itLog2(p) - (1 - p) * itLog2(1 - p); }
function itFmt(v, d) { return Number.isFinite(v) ? v.toFixed(d == null ? 3 : d) : '∞'; }
/* log of the gamma function (Lanczos), for binomial coefficients */
function itLgamma(z) {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - itLgamma(1 - z);
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function itLogChoose(n, k) { return itLgamma(n + 1) - itLgamma(k + 1) - itLgamma(n - k + 1); }
/* Huffman's algorithm on a list of probabilities. Returns the nodes (leaves first, then merges in order),
   the codeword lengths and codewords of the leaves. Ties are broken by creation order. */
function itHuffman(ps) {
  const nodes = ps.map((p, i) => ({ id: i, p, leaf: true, kids: null, order: -1 }));
  let live = nodes.slice(), k = 0;
  while (live.length > 1) {
    live.sort((a, b) => a.p - b.p || a.id - b.id);
    const a = live.shift(), b = live.shift();
    const n = { id: nodes.length, p: a.p + b.p, leaf: false, kids: [b, a], order: k++ };
    nodes.push(n); live.push(n);
  }
  const root = live[0], codes = new Array(ps.length).fill(''), lens = new Array(ps.length).fill(0);
  (function walk(n, s) { if (n.leaf) { codes[n.id] = s || '0'; lens[n.id] = s.length || 1; return; } walk(n.kids[0], s + '0'); walk(n.kids[1], s + '1'); })(root, '');
  return { nodes, root, codes, lens };
}
/* expected length of a binary Huffman code = sum of the probabilities of the internal nodes (fast version for many leaves) */
function itHuffmanLength(ps) {
  const q = ps.filter(p => p > 0).sort((a, b) => a - b), merged = []; let i = 0, j = 0, L = 0;
  const take = () => (j >= merged.length || (i < q.length && q[i] <= merged[j])) ? q[i++] : merged[j++];
  for (let n = q.length; n > 1; n--) { const s = take() + take(); merged.push(s); L += s; }
  return L;
}
/* write a number in [0,1) to l binary digits */
function itBits(x, l) { let s = ''; for (let i = 0; i < l; i++) { x *= 2; const b = x >= 1 ? 1 : 0; s += b; x -= b; } return s; }
