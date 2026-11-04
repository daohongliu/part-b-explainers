'use strict';
const NS = 'http://www.w3.org/2000/svg';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const FIGS = {};
function reg(ch, name, fn) { (FIGS[ch] = FIGS[ch] || []).push([name, fn]); }

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) { const v = attrs[k]; if (v !== null && v !== undefined) e.setAttribute(k, v); }
  if (parent) parent.appendChild(e);
  return e;
}
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const r1 = n => Math.round(n * 10) / 10;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt = (v, d) => (Math.abs(v) < 5e-10 ? 0 : v).toFixed(d == null ? 3 : d);
function gauss(R) { let u = 0, v = 0; while (u === 0) u = R(); v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/* the unsteady hand */
function curve(pts) {
  let d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += 'C' + r1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + r1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
         r1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + r1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + r1(p2[0]) + ' ' + r1(p2[1]);
  }
  return d;
}
function poly(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1])).join(''); }
const SK = {
  line(x1, y1, x2, y2, o) {
    o = o || {};
    const R = rng(o.seed != null ? o.seed : Math.round(x1 * 7 + y1 * 13 + x2 * 17 + y2 * 19) + 1);
    const rough = o.rough != null ? o.rough : 1;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    let d = '';
    const passes = o.single ? 1 : 2;
    for (let p = 0; p < passes; p++) {
      const j = () => (R() - .5) * 1.3 * rough;
      const bow = (R() - .5) * Math.min(len * .022, 3) * rough;
      const mx = (x1 + x2) / 2 + nx * bow, my = (y1 + y2) / 2 + ny * bow;
      d += 'M' + r1(x1 + j()) + ' ' + r1(y1 + j()) + 'Q' + r1(mx) + ' ' + r1(my) + ' ' + r1(x2 + j()) + ' ' + r1(y2 + j());
    }
    return d;
  },
  loop(cx, cy, rx, ry, o) {
    o = o || {};
    const R = rng(o.seed || 7), n = o.n || 24, p = o.square || 2, rough = o.rough != null ? o.rough : 1;
    const st = R() * Math.PI * 2, over = .32 + R() * .3, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = st + (Math.PI * 2 + over) * i / n, c = Math.cos(t), s = Math.sin(t);
      const k = (1 + (R() - .5) * .06 * rough) * (1 + .035 * i / n);
      const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / p), ey = Math.sign(s) * Math.pow(Math.abs(s), 2 / p);
      pts.push([cx + ex * rx * k, cy + ey * ry * k]);
    }
    return curve(pts);
  },
  rect(x, y, w, h, o) {
    o = o || {}; const s = o.seed || 1, r = o.rough;
    return SK.line(x, y, x + w, y, { seed: s, rough: r }) + SK.line(x + w, y, x + w, y + h, { seed: s + 1, rough: r }) +
           SK.line(x + w, y + h, x, y + h, { seed: s + 2, rough: r }) + SK.line(x, y + h, x, y, { seed: s + 3, rough: r });
  }
};
function path(d, cls, parent, extra) {
  const a = { d: d, class: 's ' + (cls || 's-ink') };
  if (extra) Object.assign(a, extra);
  return el('path', a, parent);
}
function text(parent, x, y, str, cls, extra) {
  const t = el('text', Object.assign({ x: x, y: y, class: 'lbl ' + (cls || '') }, extra || {}), parent);
  t.textContent = str; return t;
}
function textSub(parent, x, y, base, sub, cls, extra, after) {
  const t = el('text', Object.assign({ x: x, y: y, class: 'lbl ' + (cls || '') }, extra || {}), parent);
  t.appendChild(document.createTextNode(base));
  const s = el('tspan', { dy: 4, 'font-size': '0.74em' }, t); s.textContent = sub;
  if (after) { const a = el('tspan', { dy: -4 }, t); a.textContent = after; }
  return t;
}
function svgPt(svg, e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
function drag(node, svg, onMove) {
  node.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    try { node.setPointerCapture(e.pointerId); } catch (_) {}
    const mv = ev => onMove(svgPt(svg, ev));
    const up = () => { node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); };
    node.addEventListener('pointermove', mv); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    mv(e);
  });
}
function keyNudge(node, get, set, step, big) {
  node.addEventListener('keydown', e => {
    let d = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -1;
    else return;
    e.preventDefault(); set(get() + d * (e.shiftKey ? big : step));
  });
}
function endMark(g, x, y, kind, color) {
  el('circle', { cx: x, cy: y, r: 3.9, class: (kind === 'closed' ? 'f-' + color : 'f-paper') + ' s s-' + color, 'stroke-width': 1.7 }, g);
}
function arrowHead(g, x, y, dir, color, size) {
  size = size || 8;
  path(SK.line(x, y, x - dir * size, y - size * .62, { single: true, seed: (x | 0) + 3, rough: .4 }) +
       SK.line(x, y, x - dir * size, y + size * .62, { single: true, seed: (x | 0) + 4, rough: .4 }), 's-' + color, g, { 'stroke-width': 1.7 });
}
function seg(g, x1, x2, y, o) {
  o = o || {}; const c = o.color || 'blue', h = o.h == null ? 11 : o.h;
  if (x2 < x1) return;
  if (o.hatch && x2 > x1) el('rect', { x: x1, y: y - h / 2, width: x2 - x1, height: h, fill: 'url(#h-' + o.hatch + ')' }, g);
  if (x2 > x1) path(SK.line(x1, y, x2, y, { seed: o.seed || ((x1 + x2) | 0), rough: .45 }), 's-' + c, g, { 'stroke-width': o.w || 2.3 });
  if (o.left === 'inf') arrowHead(g, x1, y, -1, c); else if (o.left) endMark(g, x1, y, o.left, c);
  if (o.right === 'inf') arrowHead(g, x2, y, 1, c); else if (o.right) endMark(g, x2, y, o.right, c);
}
function axisLine(g, x1, x2, y, ticks, opts) {
  opts = opts || {};
  path(SK.line(x1, y, x2, y, { seed: 11, rough: .4 }), 's-soft', g, { 'stroke-width': 1.1 });
  ticks.forEach(t => {
    path(SK.line(t[0], y - 4, t[0], y + 4, { single: true, seed: (t[0] | 0) + 2, rough: .3 }), 's-soft', g, { 'stroke-width': 1 });
    if (t[1] != null) text(g, t[0], y + (opts.dy || 18), t[1], '', { 'text-anchor': 'middle', 'font-size': opts.fs || 12 });
  });
}
function vAxis(g, x, y1, y2, ticks, opts) {
  opts = opts || {};
  path(SK.line(x, y1, x, y2, { seed: 13, rough: .4 }), 's-soft', g, { 'stroke-width': 1.1 });
  ticks.forEach(t => {
    path(SK.line(x - 4, t[0], x + 4, t[0], { single: true, seed: (t[0] | 0) + 5, rough: .3 }), 's-soft', g, { 'stroke-width': 1 });
    if (t[1] != null) text(g, x - 8, t[0] + 4, t[1], '', { 'text-anchor': 'end', 'font-size': opts.fs || 11.5 });
  });
}
function pressGroup(btns, active, attr) { btns.forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(active)))); }
function bindRange(id, outId, fmtFn, onInput) {
  const r = document.getElementById(id), o = outId && document.getElementById(outId);
  const show = () => { if (o) o.textContent = fmtFn ? fmtFn(+r.value) : r.value; };
  r.addEventListener('input', () => { show(); onInput(+r.value); }); show();
  return r;
}
function playButton(btn, step, labelPlay, intervalMs) {
  let t = null; labelPlay = labelPlay || '▸ play';
  const stop = () => { if (t) { clearInterval(t); t = null; } btn.textContent = labelPlay; };
  btn.addEventListener('click', () => {
    if (t) { stop(); return; }
    btn.textContent = '❚❚ pause';
    t = setInterval(() => { if (step() === false) stop(); }, RM ? Math.max(400, intervalMs) : intervalMs);
  });
  return stop;
}
function safe(name, fn) { try { fn(); } catch (err) { console.error('[' + name + ']', err); } }
function hist(values, lo, hi, bins) {
  const c = new Array(bins).fill(0);
  values.forEach(v => { const k = Math.floor((v - lo) / (hi - lo) * bins); if (k >= 0 && k < bins) c[k]++; });
  return c;
}

/* ---------- tooltips ---------- */
(function () {
  const tip = document.createElement('div'); tip.id = 'tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
  let cur = null;
  function show(t) {
    cur = t; tip.textContent = t.getAttribute('data-tip'); tip.classList.add('on');
    const r = t.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2; x = Math.max(16, Math.min(x, window.innerWidth - tw - 16));
    let y = r.bottom + 8; if (y + th > window.innerHeight - 8) y = r.top - th - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hide(t) { if (!t || cur === t) { tip.classList.remove('on'); cur = null; } }
  document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && t !== cur) show(t); });
  document.addEventListener('mouseout', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && !t.contains(e.relatedTarget)) hide(t); });
  document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) show(t); });
  document.addEventListener('focusout', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) hide(t); });
  window.addEventListener('scroll', () => hide(), { passive: true });
  $$('[data-tip]').forEach(t => { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0'); });
})();

/* ---------- MathJax queue ---------- */
let mjChain = Promise.resolve();
/* Shrink maths that is wider than its column (displays to 60%, inline to 75%); scroll only beyond that. */
function fitMath(c) {
  const svg = c.querySelector(':scope > svg'); if (!svg) return;
  const isDisp = c.getAttribute('display') === 'true';
  if (svg.dataset.va === undefined) svg.dataset.va = svg.style.verticalAlign || '';
  svg.style.width = ''; svg.style.height = ''; svg.style.verticalAlign = svg.dataset.va; c.classList.remove('mj-wide');
  let avail;
  if (isDisp) {
    const d = c.closest('.disp') || c.parentElement; const no = d.querySelector(':scope > .eqno');
    avail = d.clientWidth - (no ? no.offsetWidth + 14 : 0);
  } else {
    const blk = c.parentElement && c.parentElement.closest('p, li, .tb, .readout, figcaption, summary, td, div, .xcard');
    avail = blk ? blk.clientWidth : 0;
  }
  const w = svg.getBoundingClientRect().width;
  if (!avail || !w || w <= avail - 1) return;
  const s = Math.max(isDisp ? .6 : .75, (avail - 2) / w);
  svg.style.width = (w * s).toFixed(1) + 'px'; svg.style.height = 'auto';
  const m = /(-?[\d.]+)ex/.exec(svg.dataset.va); if (m) svg.style.verticalAlign = (parseFloat(m[1]) * s).toFixed(3) + 'ex';
  if (w * s > avail) { c.classList.add('mj-wide'); const nw = c.closest('.nw'); if (nw) nw.classList.remove('nw'); }
}
function fixWide(nodes) { nodes.forEach(n => $$('mjx-container[jax="SVG"]', n).forEach(fitMath)); }
function typeset(nodes) {
  mjChain = mjChain.then(() => window.__mjReady).then(() => MathJax.typesetPromise(nodes)).then(() => { tagTex(nodes); fixWide(nodes); }).catch(err => console.error('[mathjax]', err));
  return mjChain;
}
let resizeT = null;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { const v = currentView && document.getElementById(currentView); if (v) fixWide([v]); }, 250); });

/* ---------- views, router, back stack ---------- */
const views = $$('.view');
const prepared = {};
let currentView = null;
function prepare(v) {
  if (prepared[v.id]) return prepared[v.id];
  (FIGS[v.id] || []).forEach(f => safe(v.id + ':' + f[0], f[1]));
  prepared[v.id] = typeset([v]);
  return prepared[v.id];
}
function showView(id) {
  const v = document.getElementById(id) || document.getElementById('contents');
  views.forEach(x => { x.hidden = x !== v; });
  currentView = v.id;
  $$('.topbar .pills a').forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + v.id)));
  return prepare(v);
}
function scrollToEl(t, flash) {
  t.scrollIntoView({ block: 'start' });
  if (flash) { t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1900); }
}
let suppressNext = false;
function route() {
  if (suppressNext) { suppressNext = false; return; }
  const h = decodeURIComponent(location.hash.slice(1));
  const t = h && document.getElementById(h);
  if (!t) { showView('contents'); window.scrollTo(0, 0); return; }
  if (t.classList.contains('view')) { showView(t.id); window.scrollTo(0, 0); return; }
  const v = t.closest('.view');
  const ready = showView(v ? v.id : 'contents');
  requestAnimationFrame(() => scrollToEl(t, true));
  ready.then(() => requestAnimationFrame(() => t.scrollIntoView({ block: 'start' })));
}
window.addEventListener('hashchange', route);

const backStack = [];
const backBtn = document.createElement('button');
backBtn.type = 'button'; backBtn.className = 'backpill'; backBtn.hidden = true; document.body.appendChild(backBtn);
function headingBefore(node) {
  const v = node.closest('.view'); if (!v) return null;
  let best = null;
  $$('h2, header.ch-head h1', v).forEach(h => { if (h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) best = h; });
  return best;
}
function refreshBack() {
  const e = backStack[backStack.length - 1];
  backBtn.hidden = !e;
  if (e) backBtn.textContent = '↩ back to ' + e.label;
}
function jump(id, from) {
  const h = from && headingBefore(from);
  const vTitle = (document.getElementById(currentView) || {}).dataset || {};
  let label = vTitle.short || 'contents';
  if (h) label = (vTitle.short ? vTitle.short + ' · ' : '') + h.textContent.replace(/\s*p\.\s*\d+\s*$/, '').replace(/^\d+(\.\d+)?\s*/, '').trim();
  backStack.push({ view: currentView, y: window.scrollY, label: label.length > 46 ? label.slice(0, 44) + '…' : label });
  if (backStack.length > 20) backStack.shift();
  refreshBack();
  if (location.hash === '#' + id) route(); else location.hash = id;
}
backBtn.addEventListener('click', () => {
  const e = backStack.pop(); refreshBack(); if (!e) return;
  showView(e.view);
  try { history.replaceState(null, '', '#' + e.view); } catch (_) {}
  requestAnimationFrame(() => window.scrollTo(0, e.y));
});

/* ---------- cross-reference previews ---------- */
const card = document.createElement('div');
card.className = 'xcard'; card.hidden = true; card.setAttribute('role', 'dialog'); document.body.appendChild(card);
let cardFor = null, hideTimer = null, showTimer = null, lastPointer = 'mouse';
function labelOf(t) {
  if (t.dataset.label) return t.dataset.label + (t.dataset.name ? ' · ' + t.dataset.name : '');
  if (t.tagName === 'FIGURE') { const g = $('.figtag', t); return g ? g.textContent : 'Figure'; }
  if (t.classList.contains('bg')) { const h = $('.bg-head', t); return h ? h.textContent : 'Background'; }
  if (t.classList.contains('disp')) return 'Equation ' + (t.dataset.eq ? '(' + t.dataset.eq + ')' : '');
  if (/^H[23]$/.test(t.tagName)) return 'Section';
  return '';
}
function scrub(n) {
  n.removeAttribute('id');
  $$('[id]', n).forEach(x => x.removeAttribute('id'));
  $$('.sn-ref, .sn-toggle, .sidenote, .pg, .qed, script', n).forEach(x => x.remove());
  $$('[tabindex]', n).forEach(x => x.removeAttribute('tabindex'));
  n.classList.remove('flash');
}
function buildCard(a) {
  const id = (a.getAttribute('href') || '').slice(1), t = document.getElementById(id);
  if (!t) return false;
  card.innerHTML = '';
  const head = document.createElement('div'); head.className = 'xcard-head';
  const v = t.closest('.view');
  const lab = document.createElement('span'); lab.textContent = labelOf(t) + (v && v.dataset.short && v.id !== currentView ? '  ·  ' + v.dataset.short : '');
  const go = document.createElement('a'); go.href = '#' + id; go.textContent = 'go there →'; go.className = 'xgo';
  go.addEventListener('click', e => { e.preventDefault(); hideCard(true); jump(id, a); });
  const bs = document.createElement('button'); bs.type = 'button'; bs.className = 'xbeside'; bs.textContent = '⇥ beside'; bs.title = 'Keep this open in a panel beside the text';
  bs.addEventListener('click', e => { e.preventDefault(); hideCard(true); openBeside(id); });
  const acts = document.createElement('span'); acts.className = 'xacts'; acts.appendChild(bs); acts.appendChild(go);
  head.appendChild(lab); head.appendChild(acts); card.appendChild(head);
  let body;
  if (t.tagName === 'FIGURE') body = ($('figcaption', t) || t).cloneNode(true);
  else if (/^H[23]$/.test(t.tagName)) {
    body = document.createElement('div');
    let n = t, k = 0; body.appendChild(t.cloneNode(true));
    while ((n = n.nextElementSibling) && k < 2 && !/^H[23]$/.test(n.tagName)) { if (n.tagName === 'P') { body.appendChild(n.cloneNode(true)); k++; } }
  } else body = t.cloneNode(true);
  scrub(body); $$('[id]', body).forEach(x => x.removeAttribute('id'));
  card.appendChild(body);
  if (/\\\(|\\\[/.test(body.textContent)) typeset([body]).then(() => place(a));
  cardFor = a; card.hidden = false;
  place(a);
  requestAnimationFrame(() => card.classList.add('on'));
  return true;
}
function place(a) {
  const r = a.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
  let x = r.left; x = Math.max(16, Math.min(x, window.innerWidth - cw - 16));
  let y = r.bottom + 8; if (y + ch > window.innerHeight - 10 && r.top - ch - 8 > 10) y = r.top - ch - 8;
  if (y + ch > window.innerHeight - 10) y = Math.max(10, window.innerHeight - ch - 10);
  card.style.left = x + 'px'; card.style.top = y + 'px';
}
function hideCard(now) {
  clearTimeout(showTimer);
  const go = () => { card.classList.remove('on'); card.hidden = true; cardFor = null; };
  if (now) go(); else { clearTimeout(hideTimer); hideTimer = setTimeout(go, 220); }
}
document.addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; if (!card.hidden && !card.contains(e.target) && !(e.target.closest && e.target.closest('a.xref'))) hideCard(true); }, true);
document.addEventListener('mouseover', e => {
  const a = e.target.closest && e.target.closest('a.xref');
  if (card.contains(e.target)) { clearTimeout(hideTimer); return; }
  if (!a || lastPointer === 'touch') return;
  clearTimeout(hideTimer);
  if (cardFor === a) return;
  clearTimeout(showTimer); showTimer = setTimeout(() => buildCard(a), 140);
});
document.addEventListener('mouseout', e => {
  const a = e.target.closest && e.target.closest('a.xref');
  if ((a && !a.contains(e.relatedTarget)) || (card.contains(e.target) && !card.contains(e.relatedTarget))) {
    clearTimeout(showTimer);
    if (e.relatedTarget && (card.contains(e.relatedTarget) || (cardFor && cardFor.contains(e.relatedTarget)))) return;
    hideCard();
  }
});
document.addEventListener('focusin', e => { const a = e.target.closest && e.target.closest('a.xref'); if (a && !card.contains(a) && lastPointer !== 'touch') buildCard(a); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(true); });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a.xref');
  if (!a) return;
  const id = (a.getAttribute('href') || '').slice(1);
  if (!document.getElementById(id)) return;
  e.preventDefault();
  if (lastPointer === 'touch' && cardFor !== a && !card.contains(a)) { buildCard(a); return; }
  hideCard(true); jump(id, a);
});
window.addEventListener('scroll', () => { if (!card.hidden && lastPointer !== 'touch') hideCard(true); }, { passive: true });
window.addEventListener('resize', () => hideCard(true));

