
/* =====================================================================
   features.js: course context, chapter contents sidebar with progress,
   the "beside" panel, private notes, header strips, three.js loader.
   ===================================================================== */

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } }
};
function h(tag, cls, txt) { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
function toast(msg) {
  const t = h('div', 'toast', msg); document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 400); }, 2600);
}

/* ---------- TeX source for every typeset formula (used by notes) ---------- */
function tagTex(nodes) {
  try {
    MathJax.startup.document.getMathItemsWithin(nodes).forEach(it => {
      const c = it.typesetRoot; if (c && c.dataset && !c.dataset.tex) { c.dataset.tex = it.math; if (it.display) c.dataset.disp = '1'; }
    });
  } catch (_) {}
}

/* ---------- three.js, loaded only when a figure asks for it ---------- */
let threeP = null;
function loadThree() {
  if (!threeP) threeP = new Promise((res, rej) => {
    if (window.THREE) return res(window.THREE);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => res(window.THREE); s.onerror = () => { threeP = null; rej(new Error('three.js failed to load')); };
    document.head.appendChild(s);
  });
  return threeP;
}

/* ---------- header strips: random walks for PMM, labelled points for CLT ---------- */
function drawStrip(c) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = c.clientWidth || 600, H = 120;
  c.width = W * dpr; c.height = H * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr);
  const cs = getComputedStyle(document.body);
  const col = n => cs.getPropertyValue(n).trim();
  const R = rng(c.dataset.motif === 'points' ? 11 : 7);
  if (c.dataset.motif === 'points') {
    /* a hidden threshold concept: points left of it are one label, right of it the other; a few sampled points are circled */
    const th = W * (.38 + .2 * R());
    g.setLineDash([4, 5]); g.strokeStyle = col('--ink-soft'); g.globalAlpha = .55; g.lineWidth = 1;
    g.beginPath(); g.moveTo(th, 8); g.lineTo(th + 18, H - 8); g.stroke(); g.setLineDash([]);
    for (let k = 0; k < 170; k++) {
      const x = 8 + R() * (W - 16), y = 10 + R() * (H - 20), pos = x > th + (y - 8) * 18 / (H - 16);
      g.globalAlpha = k % 9 === 0 ? 1 : .5; g.strokeStyle = g.fillStyle = pos ? col('--blue') : col('--ochre'); g.lineWidth = 1.3;
      g.beginPath();
      if (pos) { g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.moveTo(x, y - 3); g.lineTo(x, y + 3); g.stroke(); }
      else { g.arc(x, y, 2.2, 0, 7); g.stroke(); }
      if (k % 9 === 0) { g.globalAlpha = .7; g.strokeStyle = col('--ink-soft'); g.lineWidth = .8; g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.stroke(); }
    }
    g.globalAlpha = 1; return;
  }
  const cols = [col('--blue'), col('--ochre'), col('--ink-soft')];
  for (let k = 0; k < 7; k++) {
    g.beginPath(); g.strokeStyle = cols[k % 3]; g.globalAlpha = k < 3 ? .9 : .45; g.lineWidth = k < 3 ? 1.4 : 1;
    let y = H / 2; g.moveTo(0, y);
    const n = 300; for (let i = 1; i <= n; i++) { y += (R() < .5 ? -1 : 1) * 1.25; if (y < 6 || y > H - 6) y = clamp(2 * (y < 6 ? 6 : H - 6) - y, 6, H - 6); g.lineTo(i * W / n, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
}
function walkStrip() {
  const v = currentView && document.getElementById(currentView); if (!v) return;
  $$('canvas.walk-strip', v).forEach(c => { if (c.dataset.drawn !== String(c.clientWidth)) { c.dataset.drawn = String(c.clientWidth); drawStrip(c); } });
}

/* ---------- chapter contents sidebar, reading progress ---------- */
const readbar = h('div', 'readbar'); readbar.appendChild(h('i')); document.body.appendChild(readbar);
const tocSide = h('nav', 'toc-side'); tocSide.setAttribute('aria-label', 'Contents of this chapter'); tocSide.hidden = true;
const tocBtn = h('button', 'toc-btn', '§ contents'); tocBtn.type = 'button'; tocBtn.hidden = true; tocBtn.setAttribute('aria-expanded', 'false');
document.body.appendChild(tocSide); document.body.appendChild(tocBtn);
let TS = null;
const READ = LS.get('pbs-read', {});
function plainHeading(hd) {
  return Array.from(hd.childNodes).filter(n => !(n.classList && (n.classList.contains('pg') || n.classList.contains('sec')))).map(n => n.textContent).join('').trim();
}
function buildToc(v) {
  const isDoc = !!v && (v.classList.contains('chapter') || v.classList.contains('sheet'));
  document.body.classList.toggle('has-toc', isDoc);
  tocSide.hidden = !isDoc; tocBtn.hidden = !isDoc; closeToc();
  readbar.hidden = !isDoc;
  TS = null;
  if (!isDoc) return;
  tocSide.innerHTML = '';
  const t = v.querySelector('header.ch-head h1'), eb = v.querySelector('header.ch-head .eyebrow');
  const head = h('div', 'toc-head');
  const tt = h('a', 'toc-title'); tt.href = '#' + v.id; tt.textContent = (eb ? eb.textContent + ' · ' : '') + (t ? t.textContent : '');
  const meta = h('div', 'toc-meta');
  const prog = h('div', 'toc-prog'); prog.appendChild(h('i'));
  head.appendChild(tt); head.appendChild(meta); head.appendChild(prog); tocSide.appendChild(head);
  const ul = h('ul', 'toc-l');
  const secs = [];
  const isSheet = v.classList.contains('sheet');
  const tops = isSheet ? $$('.sq[id]', v) : $$('h2[id]', v);
  tops.forEach((hd, i) => {
    const li = h('li', 'tl-sec'), a = h('a');
    a.href = '#' + hd.id;
    if (isSheet) {
      a.appendChild(h('span', 'tl-n', hd.querySelector('.sq-n').textContent.trim()));
      a.appendChild(h('span', 'tl-t', hd.dataset.name || ''));
    } else {
      const sec = hd.querySelector('.sec');
      if (sec) a.appendChild(h('span', 'tl-n', sec.textContent));
      a.appendChild(h('span', 'tl-t', plainHeading(hd)));
      if (hd.dataset.min) a.appendChild(h('span', 'tl-m', hd.dataset.min + '′'));
      if (hd.dataset.d) {
        const dd = +hd.dataset.d, ii = +hd.dataset.i;
        const gauge = h('span', 'tl-g');
        gauge.title = 'Difficulty: ' + ['gentle', 'steady', 'demanding'][dd - 1] + '. Importance for the rest of the course: ' + ['background', 'useful', 'core'][ii - 1] + '.';
        gauge.innerHTML = '<span class="tl-gd" aria-label="difficulty ' + dd + ' of 3">' + '●'.repeat(dd) + '○'.repeat(3 - dd) + '</span><span class="tl-gi" aria-label="importance ' + ii + ' of 3">' + '★'.repeat(ii) + '☆'.repeat(3 - ii) + '</span>';
        a.appendChild(gauge);
      }
    }
    li.appendChild(a);
    /* everything between this heading and the next: subsections and numbered results */
    const sub = h('ul', 'tl-sub'), subs = [];
    if (!isSheet) {
      const next = tops[i + 1];
      $$('h3[id], .thm[id^="' + (v.dataset.course === 'clt' ? 'clt-' : '') + 'r"]', v).forEach(x => {
        if (!(hd.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
        if (next && !(next.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_PRECEDING)) return;
        if (x.closest('.xcard, .side-panel')) return;
        const sl = h('li', x.tagName === 'H3' ? 'tl-h3' : 'tl-r'), sa = h('a');
        sa.href = '#' + x.id;
        if (x.tagName === 'H3') sa.textContent = plainHeading(x);
        else { sa.appendChild(h('span', 'tl-k', x.dataset.label)); const nm = x.dataset.name || x.dataset.desc; if (nm) { const e = h('span', 'tl-nm' + (x.dataset.name ? '' : ' tl-desc'), nm); sa.appendChild(e); } }
        sl.appendChild(sa); sub.appendChild(sl); subs.push([x, sl]);
      });
    }
    if (sub.children.length) li.appendChild(sub);
    ul.appendChild(li);
    secs.push({ hd, li, subs, min: +(hd.dataset.min || 0) });
  });
  const rail = h('div', 'toc-rail'); rail.appendChild(h('i')); rail.appendChild(h('b')); ul.appendChild(rail);
  tocSide.appendChild(ul);
  const foot = h('div', 'toc-foot');
  const course = v.dataset.course;
  const home = h('a', '', '↖ ' + (course === 'clt' ? 'Learning Theory' : 'PMM') + ' contents'); home.href = '#' + course;
  foot.appendChild(home); tocSide.appendChild(foot);
  ul.addEventListener('click', e => { if (e.target.closest('a')) closeToc(); });
  TS = { v, secs, meta, ul, rail, prog: prog.firstChild, total: secs.reduce((s, x) => s + x.min, 0), isSheet };
  updateToc();
}
function updateToc() {
  if (!TS) return;
  const { v, secs } = TS;
  const r = v.getBoundingClientRect(), vh = window.innerHeight;
  const frac = clamp((vh * .35 - r.top) / Math.max(1, r.height - vh * .5), 0, 1);
  readbar.firstChild.style.width = (frac * 100).toFixed(1) + '%';
  TS.prog.style.width = (frac * 100).toFixed(1) + '%';
  let cur = -1;
  secs.forEach((s, i) => { if (s.hd.getBoundingClientRect().top < vh * .3) cur = i; });
  let left = 0;
  secs.forEach((s, i) => {
    s.li.classList.toggle('cur', i === cur); s.li.classList.toggle('done', i < cur);
    if (i > cur) left += s.min;
    else if (i === cur) {
      const nx = secs[i + 1] ? secs[i + 1].hd.getBoundingClientRect().top : r.bottom;
      const span = Math.max(1, nx - s.hd.getBoundingClientRect().top);
      left += s.min * clamp((nx - vh * .3) / span, 0, 1);
    }
  });
  /* vertical rail: how far down the list the reading point is, interpolated within the current section and subsection */
  let y = 0;
  if (cur >= 0) {
    const s = secs[cur], hdTop = s.hd.getBoundingClientRect().top;
    const nxTop = secs[cur + 1] ? secs[cur + 1].hd.getBoundingClientRect().top : r.bottom;
    const items = [[s.hd, s.li.firstChild]].concat(s.subs.map(([x, sl]) => [x, sl]));
    let k = 0; items.forEach(([x], j) => { if (x.getBoundingClientRect().top < vh * .3) k = j; });
    s.subs.forEach(([, sl], j) => sl.classList.toggle('cur', j + 1 === k));
    const elTop = items[k][0].getBoundingClientRect().top, elNext = items[k + 1] ? items[k + 1][0].getBoundingClientRect().top : nxTop;
    const f = clamp((vh * .3 - elTop) / Math.max(1, elNext - elTop), 0, 1);
    const ulTop = TS.ul.getBoundingClientRect().top, row = items[k][1].getBoundingClientRect();
    const rowNext = items[k + 1] ? items[k + 1][1].getBoundingClientRect().top : (secs[cur + 1] ? secs[cur + 1].li.getBoundingClientRect().top : s.li.getBoundingClientRect().bottom);
    y = row.top - ulTop + f * (rowNext - row.top);
  }
  secs.forEach((s, i) => { if (i !== cur) s.subs.forEach(([, sl]) => sl.classList.remove('cur')); });
  TS.rail.firstChild.style.height = y.toFixed(1) + 'px';
  TS.rail.lastChild.style.top = y.toFixed(1) + 'px'; TS.rail.lastChild.style.opacity = cur >= 0 ? 1 : 0;
  const best = Math.max(READ[v.id] || 0, frac);
  if (best > (READ[v.id] || 0) + .02 || (best === 1 && READ[v.id] !== 1)) { READ[v.id] = Math.round(best * 100) / 100; LS.set('pbs-read', READ); }
  TS.meta.textContent = TS.isSheet ? `${secs.length} questions` : `${Math.round(frac * 100)}% through · ≈ ${Math.max(0, Math.round(left))} min left`;
  /* keep the current entry visible in a long sidebar */
  const c = secs[cur];
  if (c && c !== TS.lastCur) { TS.lastCur = c; if (!tocSide.classList.contains('open')) { const lr = c.li.getBoundingClientRect(), tr = tocSide.getBoundingClientRect(); if (lr.top < tr.top + 60 || lr.bottom > tr.bottom - 20) tocSide.scrollTop += lr.top - tr.top - 80; } }
}
let tocRaf = 0;
window.addEventListener('scroll', () => { if (!tocRaf) tocRaf = requestAnimationFrame(() => { tocRaf = 0; updateToc(); }); }, { passive: true });
window.addEventListener('resize', () => { updateToc(); walkStrip(); });
function closeToc() { tocSide.classList.remove('open'); tocBtn.setAttribute('aria-expanded', 'false'); }
tocBtn.addEventListener('click', () => { const o = !tocSide.classList.contains('open'); tocSide.classList.toggle('open', o); tocBtn.setAttribute('aria-expanded', String(o)); if (o) updateToc(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeToc(); });
document.addEventListener('pointerdown', e => { if (tocSide.classList.contains('open') && !tocSide.contains(e.target) && e.target !== tocBtn) closeToc(); });

/* reading marks on course contents pages */
function markRead(v) {
  $$('.toc > li', v).forEach(li => {
    const a = li.querySelector('.t a'); if (!a) return;
    const f = READ[a.getAttribute('href').slice(1)] || 0;
    let m = li.querySelector('.rd'); if (!m) { m = h('span', 'rd'); m.appendChild(h('i')); li.querySelector('.cmeta').appendChild(m); }
    m.firstChild.style.width = Math.round(f * 100) + '%'; m.title = f ? Math.round(f * 100) + '% read' : 'not started';
  });
}

/* ---------- the "beside" panel ---------- */
const side = h('aside', 'side-panel'); side.hidden = true; side.setAttribute('aria-label', 'Pinned beside the text');
const sideHead = h('div', 'side-head');
sideHead.appendChild(h('span', 'side-t', 'beside the text'));
const sideClose = h('button', 'side-x', 'close all'); sideClose.type = 'button';
sideHead.appendChild(sideClose); side.appendChild(sideHead);
const sideBody = h('div', 'side-body'); side.appendChild(sideBody);
document.body.appendChild(side);
sideClose.addEventListener('click', () => { sideBody.innerHTML = ''; syncSide(); });
function syncSide() { side.hidden = !sideBody.children.length; document.body.classList.toggle('side-open', !side.hidden); }
function openBeside(id) {
  const t = document.getElementById(id); if (!t) return;
  const old = sideBody.querySelector('[data-for="' + id + '"]'); if (old) old.remove();
  const it = h('div', 'side-item'); it.dataset.for = id;
  const hd = h('div', 'side-ih');
  const v = t.closest('.view');
  hd.appendChild(h('span', '', labelOf(t) + (v && v.dataset.short ? '  ·  ' + v.dataset.short : '')));
  const acts = h('span', 'xacts');
  const go = h('a', 'xgo', 'go there →'); go.href = '#' + id; go.addEventListener('click', e => { e.preventDefault(); jump(id, null); });
  const x = h('button', 'side-x', '×'); x.type = 'button'; x.title = 'Remove'; x.addEventListener('click', () => { it.remove(); syncSide(); });
  acts.appendChild(go); acts.appendChild(x); hd.appendChild(acts); it.appendChild(hd);
  const body = h('div', 'side-ib');
  let src = t;
  if (/^H[23]$/.test(t.tagName)) { body.appendChild(t.cloneNode(true)); let n = t, k = 0; while ((n = n.nextElementSibling) && k < 3 && !/^H[23]$/.test(n.tagName)) { if (n.tagName === 'P') { body.appendChild(n.cloneNode(true)); k++; } } }
  else {
    body.appendChild(src.cloneNode(true));
    /* a result travels with its proof */
    const nx = t.nextElementSibling;
    if (nx && nx.matches('.proof, details.pf')) body.appendChild(nx.cloneNode(true));
  }
  scrub(body); $$('[id]', body).forEach(n => n.removeAttribute('id'));
  $$('.sec-meta', body).forEach(n => n.remove());
  it.appendChild(body);
  sideBody.prepend(it); syncSide();
  if (/\\\(|\\\[/.test(body.textContent)) typeset([body]);
  $$('canvas', body).forEach(c => c.remove());
}

/* ---------- private notes ---------- */
const NOTES = { list: LS.get('pbs-notes', []), db: null, mode: 'local' };
function noteText(n) { return n.nodeType === 3; }
const SKIP_SEL = 'script, style, .sn-toggle, button, svg, canvas, .sec-meta, .for-llms, .eqno, input, textarea';
/* Flatten a view into a string, with every formula written as its TeX source. */
function linearize(root) {
  let text = ''; const segs = [];
  (function walk(n) {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { segs.push({ n: c, s: text.length, e: text.length + c.data.length }); text += c.data; }
      else if (c.nodeType === 1) {
        if (c.tagName === 'MJX-CONTAINER') { const tx = c.dataset.tex ? (c.dataset.disp ? '$$' + c.dataset.tex + '$$' : '$' + c.dataset.tex + '$') : ''; segs.push({ n: c, s: text.length, e: text.length + tx.length, m: 1 }); text += tx; }
        else if (c.matches(SKIP_SEL)) continue;
        else walk(c);
      }
    }
  })(root);
  return { text, segs };
}
function offsetOf(L, node, off, isEnd) {
  for (const s of L.segs) {
    if (s.m && s.n.contains(node)) return isEnd ? s.e : s.s;
    if (s.n === node) return s.s + Math.min(off, s.e - s.s);
  }
  const pr = document.createRange();
  try { pr.setStart(node, off); } catch (_) { return -1; }
  for (const s of L.segs) { if (pr.comparePoint(s.n, 0) >= 0) return s.s; }
  return L.text.length;
}
function anchorBefore(node, v) {
  let best = null;
  $$('[id]', v).forEach(x => { if (x.matches('h2, h3, .thm, figure, .disp, aside.bg, .sq, details.pause') && (x.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING || x.contains(node))) best = x; });
  return best;
}
function unmark(v) {
  $$('mark.unote', v).forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
  $$('.unote-m', v).forEach(m => { m.classList.remove('unote-m'); delete m.dataset.note; });
}
function markNote(v, n) {
  const L = linearize(v);
  let idx = -1, best = -1, from = 0;
  while ((from = L.text.indexOf(n.quote, from)) >= 0) {
    let sc = 0;
    const pre = L.text.slice(Math.max(0, from - (n.prefix || '').length), from), suf = L.text.slice(from + n.quote.length, from + n.quote.length + (n.suffix || '').length);
    for (let k = 1; k <= pre.length && pre[pre.length - k] === n.prefix[n.prefix.length - k]; k++) sc++;
    for (let k = 0; k < suf.length && suf[k] === n.suffix[k]; k++) sc++;
    if (sc > best) { best = sc; idx = from; }
    from++;
  }
  if (idx < 0) return false;
  const a = idx, b = idx + n.quote.length;
  L.segs.filter(s => s.e > a && s.s < b).forEach(s => {
    if (s.m) { s.n.classList.add('unote-m'); s.n.dataset.note = n.id; return; }
    let node = s.n; const st = Math.max(0, a - s.s), en = Math.min(s.e, b) - s.s;
    if (!node.data.slice(st, en).trim()) return;
    if (en < node.data.length) node.splitText(en);
    if (st > 0) node = node.splitText(st);
    const m = document.createElement('mark'); m.className = 'unote'; m.dataset.note = n.id;
    node.parentNode.insertBefore(m, node); m.appendChild(node);
  });
  return true;
}
function restoreNotes(v) {
  if (!v) return;
  unmark(v);
  NOTES.list.filter(n => n.view === v.id).forEach(n => { n._lost = !markNote(v, n); });
}
function noteCount() { const c = $('#notes-btn .count'); if (c) c.textContent = NOTES.list.length ? String(NOTES.list.length) : ''; }
function persistLocal() { LS.set('pbs-notes', NOTES.list.map(({ _lost, ...n }) => n)); }
async function saveNote(n) {
  n.updated = Date.now();
  const i = NOTES.list.findIndex(x => x.id === n.id); if (i >= 0) NOTES.list[i] = n; else NOTES.list.push(n);
  refreshNotes();
  if (NOTES.mode === 'db') {
    try { const { _lost, ...d } = n; await NOTES.db.collection('notes').doc(n.id).set(d); return; }
    catch (err) { console.warn('[notes]', err); NOTES.mode = 'local'; toast('Couldn’t reach your account’s storage, so this note is kept in this browser.'); }
  }
  persistLocal();
}
async function deleteNote(id) {
  NOTES.list = NOTES.list.filter(x => x.id !== id); refreshNotes();
  if (NOTES.mode === 'db') { try { await NOTES.db.collection('notes').doc(id).delete(); return; } catch (err) { console.warn('[notes]', err); } }
  persistLocal();
}
function refreshNotes() {
  noteCount();
  const v = currentView && document.getElementById(currentView);
  if (v && prepared[v.id]) prepared[v.id].then(() => restoreNotes(v));
  if (!drawer.hidden) renderDrawer();
}
async function initNotes() {
  noteCount();
  if (!(window.claude && typeof window.claude.use === 'function')) return;
  let db = null; try { db = await window.claude.use('db'); } catch (_) {}
  if (!db) return;
  NOTES.db = db;
  const timer = setTimeout(() => { if (NOTES.mode !== 'db') console.warn('[notes] storage slow; using this browser for now'); }, 10000);
  db.collection('notes').onSnapshot(snap => {
    clearTimeout(timer);
    const first = NOTES.mode !== 'db';
    NOTES.mode = 'db';
    const remote = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    /* notes written in this browser before the account store answered are moved across once */
    if (first) {
      const local = LS.get('pbs-notes', []).filter(n => !remote.some(r => r.id === n.id));
      local.forEach(n => db.collection('notes').doc(n.id).set(n).catch(() => {}));
      if (local.length) { remote.push(...local); LS.set('pbs-notes', []); }
    }
    NOTES.list = remote; refreshNotes();
  }, err => { clearTimeout(timer); console.warn('[notes]', err); NOTES.mode = 'local'; });
}

/* selection → "add a note" button */
const fab = h('button', 'note-fab', '✎ note'); fab.type = 'button'; fab.hidden = true; document.body.appendChild(fab);
let pending = null;
function selectionInfo() {
  const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  const host = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
  if (!host || host.closest('.xcard, .side-panel, .notes-drawer, .note-pop, .topbar, .toc-side, figure .fig-body')) return null;
  const v = host.closest('.view'); if (!v) return null;
  return fromRange(r, v);
}
function fromRange(r, v) {
  const L = linearize(v);
  const a = offsetOf(L, r.startContainer, r.startOffset, false), b = offsetOf(L, r.endContainer, r.endOffset, true);
  if (a < 0 || b <= a) return null;
  let quote = L.text.slice(a, b); const lead = quote.length - quote.trimStart().length;
  quote = quote.trim(); if (quote.length < 2) return null;
  const s = a + lead;
  return { v, quote: quote.slice(0, 1200), prefix: L.text.slice(Math.max(0, s - 40), s), suffix: L.text.slice(s + quote.length, s + quote.length + 40), rect: r.getBoundingClientRect(), node: r.startContainer };
}
function showFab(info) {
  pending = info; if (!info) { fab.hidden = true; return; }
  const rc = info.rect;
  fab.hidden = false;
  const x = clamp(rc.right - fab.offsetWidth / 2, 12, window.innerWidth - fab.offsetWidth - 12);
  let y = rc.bottom + 8; if (y + 40 > window.innerHeight) y = rc.top - 40;
  fab.style.left = x + 'px'; fab.style.top = y + 'px';
}
let selT = 0;
document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(() => { if (!pop.hidden) return; showFab(selectionInfo()); }, 220); });
window.addEventListener('scroll', () => { if (!fab.hidden && pending) { const s = window.getSelection(); if (s && s.rangeCount) { pending.rect = s.getRangeAt(0).getBoundingClientRect(); showFab(pending); } } }, { passive: true });
/* a double-click on a formula selects the whole formula */
document.addEventListener('dblclick', e => {
  const c = e.target.closest && e.target.closest('.view mjx-container'); if (!c || c.closest('figure .fig-body')) return;
  const r = document.createRange(); r.selectNode(c);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
});
fab.addEventListener('mousedown', e => e.preventDefault());
fab.addEventListener('click', () => {
  if (!pending) return;
  const p = pending, v = p.v, anc = anchorBefore(p.node, v);
  const hd = headingBefore(p.node.nodeType === 1 ? p.node : p.node.parentElement);
  openPop({ id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), view: v.id, course: v.dataset.course || '', viewTitle: v.dataset.short + ' · ' + v.dataset.title,
    where: hd ? plainHeading(hd) : '', anchor: anc ? anc.id : v.id, quote: p.quote, prefix: p.prefix, suffix: p.suffix, text: '', created: Date.now() }, p.rect, true);
  fab.hidden = true;
});

/* the note editor */
const pop = h('div', 'note-pop'); pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Note');
pop.innerHTML = '<div class="np-q"></div><textarea rows="4" placeholder="Your note. Only you can see it."></textarea><div class="np-row"><span class="np-where"></span><span class="np-b"><button type="button" class="np-del">delete</button><button type="button" class="np-cancel">cancel</button><button type="button" class="np-save">save</button></span></div>';
document.body.appendChild(pop);
let popNote = null;
function quoteHTML(q) {
  /* show the quote as text, with its formulas typeset */
  return esc(q).replace(/\$\$([\s\S]+?)\$\$/g, '\\[$1\\]').replace(/\$([^$]+?)\$/g, '\\($1\\)');
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function openPop(n, rect, isNew) {
  popNote = Object.assign({}, n);
  const q = $('.np-q', pop); q.innerHTML = quoteHTML(n.quote.length > 400 ? n.quote.slice(0, 398) + '…' : n.quote);
  $('.np-where', pop).textContent = isNew ? '' : 'edited ' + new Date(n.updated || n.created).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  $('.np-del', pop).hidden = !!isNew;
  const ta = $('textarea', pop); ta.value = n.text || '';
  pop.hidden = false;
  const w = pop.offsetWidth;
  let x = clamp((rect ? rect.left : window.innerWidth / 2 - w / 2), 12, window.innerWidth - w - 12);
  let y = rect ? rect.bottom + 10 : 120; if (y + pop.offsetHeight > window.innerHeight - 12) y = Math.max(12, (rect ? rect.top : 0) - pop.offsetHeight - 10);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  if (/\\\(|\\\[/.test(q.innerHTML)) typeset([q]);
  setTimeout(() => ta.focus(), 30);
}
function closePop() { pop.hidden = true; popNote = null; }
$('.np-cancel', pop).addEventListener('click', closePop);
$('.np-save', pop).addEventListener('click', () => { if (!popNote) return; popNote.text = $('textarea', pop).value.trim(); const n = popNote; closePop(); window.getSelection().removeAllRanges(); saveNote(n); });
$('.np-del', pop).addEventListener('click', () => { if (!popNote) return; const id = popNote.id; closePop(); deleteNote(id); });
$('textarea', pop).addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('.np-save', pop).click(); if (e.key === 'Escape') closePop(); });
document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== fab) closePop(); });
document.addEventListener('click', e => {
  const m = e.target.closest && e.target.closest('mark.unote, .unote-m'); if (!m || e.target.closest('a')) return;
  const sel = window.getSelection(); if (sel && !sel.isCollapsed) return;
  const n = NOTES.list.find(x => x.id === m.dataset.note); if (n) openPop(n, m.getBoundingClientRect(), false);
});
document.addEventListener('mouseover', e => {
  const m = e.target.closest && e.target.closest('mark.unote, .unote-m'); if (!m) return;
  const n = NOTES.list.find(x => x.id === m.dataset.note); if (n && !m.title) m.title = n.text || '(empty note)';
});

/* the notes drawer */
const drawer = h('aside', 'notes-drawer'); drawer.hidden = true; drawer.setAttribute('aria-label', 'Your notes');
document.body.appendChild(drawer);
function noteMarkdown() {
  const by = {};
  NOTES.list.slice().sort((a, b) => a.created - b.created).forEach(n => { (by[n.viewTitle || n.view] = by[n.viewTitle || n.view] || []).push(n); });
  let md = '# Notes on Part B, slowly\n\n_Exported ' + new Date().toLocaleString() + '_\n';
  Object.keys(by).forEach(k => {
    md += '\n## ' + k + '\n';
    by[k].forEach(n => { md += '\n> ' + n.quote.replace(/\n+/g, ' ') + '\n' + (n.where ? '\n_' + n.where + '_\n' : '') + '\n' + (n.text || '_(no text)_') + '\n'; });
  });
  return md;
}
async function exportNotes() {
  const md = noteMarkdown(), name = 'part-b-notes-' + new Date().toISOString().slice(0, 10) + '.md';
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { await dl.save({ filename: name, data: md }); return; }
  } catch (err) { if (err && err.code === 'declined') return; console.warn('[export]', err); }
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  } catch (_) { copyNotes(); }
}
async function copyNotes() { try { await navigator.clipboard.writeText(noteMarkdown()); toast('Copied your notes as Markdown.'); } catch (_) { toast('Couldn’t reach the clipboard.'); } }
function renderDrawer() {
  drawer.innerHTML = '';
  const hd = h('div', 'nd-head'); hd.appendChild(h('span', 'nd-t', 'your notes'));
  const x = h('button', 'side-x', 'close'); x.type = 'button'; x.addEventListener('click', () => { drawer.hidden = true; }); hd.appendChild(x);
  drawer.appendChild(hd);
  drawer.appendChild(h('p', 'nd-where', NOTES.mode === 'db' ? 'Stored with your claude.ai account. Only you can read them.' : 'Stored in this browser only. Export them now and then to keep a copy.'));
  if (!NOTES.list.length) {
    drawer.appendChild(h('p', 'nd-empty', 'Nothing yet. Select a passage or double-click a formula, then press ✎ note.'));
  }
  const groups = {};
  NOTES.list.slice().sort((a, b) => (a.course + a.view).localeCompare(b.course + b.view, undefined, { numeric: true }) || a.created - b.created).forEach(n => { (groups[n.viewTitle || n.view] = groups[n.viewTitle || n.view] || []).push(n); });
  Object.keys(groups).forEach(k => {
    drawer.appendChild(h('div', 'nd-g', k));
    groups[k].forEach(n => {
      const it = h('div', 'nd-it');
      const q = h('div', 'nd-q'); q.innerHTML = quoteHTML(n.quote.length > 220 ? n.quote.slice(0, 218) + '…' : n.quote); it.appendChild(q);
      if (n.text) it.appendChild(h('div', 'nd-x', n.text));
      const row = h('div', 'nd-row');
      row.appendChild(h('span', '', (n.where ? n.where + ' · ' : '') + new Date(n.updated || n.created).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + (n._lost ? ' · passage moved' : '')));
      const go = h('a', '', 'go →'); go.href = '#' + n.anchor;
      go.addEventListener('click', e => { e.preventDefault(); drawer.hidden = true; goToNote(n); });
      row.appendChild(go); it.appendChild(row); drawer.appendChild(it);
    });
  });
  const ft = h('div', 'nd-foot');
  const ex = h('button', '', 'export .md'); ex.type = 'button'; ex.addEventListener('click', exportNotes);
  const cp = h('button', '', 'copy'); cp.type = 'button'; cp.addEventListener('click', copyNotes);
  ft.appendChild(ex); ft.appendChild(cp); drawer.appendChild(ft);
  typeset([drawer]);
}
function goToNote(n) {
  const fromLabel = null;
  jump(n.anchor, fromLabel);
  const v = document.getElementById(n.view);
  (prepared[n.view] || Promise.resolve()).then(() => setTimeout(() => {
    const m = v && v.querySelector('[data-note="' + n.id + '"]');
    if (m) { const d = m.closest('details'); if (d && !d.open) { let p = d; while (p) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; } } m.scrollIntoView({ block: 'center' }); m.classList.add('flash-n'); setTimeout(() => m.classList.remove('flash-n'), 1800); }
  }, 120));
}
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#notes-btn')) { drawer.hidden = !drawer.hidden; if (!drawer.hidden) renderDrawer(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') drawer.hidden = true; });

/* ---------- per-view hook ---------- */
const _showView = showView;
showView = function (id) {
  const r = _showView(id);
  const v = document.getElementById(currentView);
  document.body.dataset.course = (v && v.dataset.course) || '';
  document.title = v ? (v.classList.contains('hub') ? 'Part B, slowly' : v.dataset.title + ' · ' + (v.dataset.course === 'clt' ? 'Computational Learning Theory' : 'Probability, Measure and Martingales')) : document.title;
  $$('.topbar .pills a').forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + currentView)));
  buildToc(v);
  walkStrip();
  if (v && v.classList.contains('course-home')) markRead(v);
  fab.hidden = true; closePop();
  r.then(() => { restoreNotes(v); updateToc(); });
  return r;
};
initNotes();
function setTopH() { const t = $('.topbar'); if (t) document.documentElement.style.setProperty('--topbar-h', t.offsetHeight + 'px'); }
setTopH(); window.addEventListener('resize', setTopH);
