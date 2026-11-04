
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
      a.appendChild(h('span', 'tl-n', sec ? sec.textContent : '§'));
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

/* ---------- minimap: the whole chapter in miniature, with the visible part outlined (as in a code editor) ---------- */
const mm = h('div', 'minimap'); mm.setAttribute('aria-hidden', 'true');
const mmc = document.createElement('canvas'); mm.appendChild(mmc);
const mmv = h('div', 'mm-view'); mm.appendChild(mmv);
document.body.appendChild(mm);
let MM = null, mmT = 0;
const MM_BOX = 'figure, .thm, .proof, aside.bg, details.pause, .sq, .algo, .sheet-prompt, header.ch-head';
function layoutMinimap() {
  MM = null;
  const v = currentView && document.getElementById(currentView);
  if (!v || !document.body.classList.contains('has-toc') || getComputedStyle(mm).display === 'none') return;
  const W = mm.clientWidth, H = mm.clientHeight; if (!W || !H) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  mmc.width = W * dpr; mmc.height = H * dpr; mmc.style.width = W + 'px'; mmc.style.height = H + 'px';
  const g = mmc.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const cs = getComputedStyle(document.body), col = n => cs.getPropertyValue(n).trim();
  const vr = v.getBoundingClientRect(), top0 = vr.top + window.scrollY, docH = Math.max(1, v.scrollHeight);
  const ref = v.querySelector('.sec-block > p, .view > p') || v;
  const rr = ref.getBoundingClientRect(), x0 = rr.left, colW = rr.width;
  const sx = (W - 6) / (colW * 1.38), sy = H / docH;
  const X = x => 3 + (x - x0) * sx, Y = y => (y + window.scrollY - top0) * sy;
  const rect = (r, fill, alpha) => { g.globalAlpha = alpha; g.fillStyle = fill; g.fillRect(X(r.left), Y(r.top), Math.max(1, r.width * sx), Math.max(1, r.height * sy)); };
  const boxes = $$(MM_BOX, v).filter(e => !e.parentElement.closest(MM_BOX) || e.matches('.proof'));
  boxes.forEach(e => {
    const r = e.getBoundingClientRect(); if (!r.height) return;
    if (e.matches('header.ch-head')) return rect(r, col('--ink'), .12);
    if (e.matches('figure')) { rect(r, col('--paper-2'), 1); g.globalAlpha = .5; g.strokeStyle = col('--ink-soft'); g.lineWidth = .6; g.strokeRect(X(r.left) + .5, Y(r.top) + .5, r.width * sx - 1, Math.max(1, r.height * sy - 1)); return; }
    if (e.matches('.thm')) { const c = e.classList.contains('k-def') ? col('--ochre') : e.classList.contains('k-ex') ? col('--ink-soft') : col('--blue'); rect(r, c, .22); g.globalAlpha = .9; g.fillStyle = c; g.fillRect(X(r.left), Y(r.top), 1.5, Math.max(1, r.height * sy)); return; }
    if (e.matches('.proof')) { g.globalAlpha = .7; g.fillStyle = col('--blue'); g.fillRect(X(r.left), Y(r.top), 1, Math.max(1, r.height * sy)); rect({ left: r.left + 8, top: r.top, width: r.width - 8, height: r.height }, col('--ink'), .1); return; }
    if (e.matches('aside.bg')) return rect(r, col('--ink-soft'), .16);
    if (e.matches('details.pause, .sheet-prompt')) return rect(r, col('--ochre'), .25);
    rect(r, col('--ink'), .12);
  });
  /* running text: one faint line per line of type, or a faint block when lines would merge */
  $$('p, li, .disp, .sec-meta', v).forEach(e => {
    if (e.closest(MM_BOX) || e.closest('.for-llms')) return;
    const r = e.getBoundingClientRect(); if (!r.height) return;
    const lh = parseFloat(getComputedStyle(e).lineHeight) || 28, n = Math.max(1, Math.round(r.height / lh));
    g.fillStyle = col('--ink');
    if (lh * sy >= 1.6) { for (let k = 0; k < n; k++) { g.globalAlpha = .28; const w = k === n - 1 && n > 1 ? .6 : 1; g.fillRect(X(r.left), Y(r.top + k * lh + lh * .35), r.width * sx * w, Math.max(.7, lh * sy * .45)); } }
    else rect(r, col('--ink'), .2);
  });
  $$('.role', v).forEach(e => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e).getPropertyValue('--rc').trim(); g.globalAlpha = .8; g.fillStyle = c || col('--ink-soft'); g.fillRect(X(r.left) - 2.5, Y(r.top), 1.2, Math.max(1, r.height * sy)); });
  /* headings with their numbers */
  g.font = '600 8px Recursive, ui-monospace, monospace'; g.textBaseline = 'middle';
  $$('h2, h3', v).forEach(e => {
    const r = e.getBoundingClientRect(); if (!r.height) return;
    const isH2 = e.tagName === 'H2';
    g.globalAlpha = isH2 ? .9 : .55; g.fillStyle = col('--ink');
    g.fillRect(X(r.left), Y(r.top + r.height / 2) - (isH2 ? 1.2 : .6), (isH2 ? .9 : .6) * colW * sx, isH2 ? 2.4 : 1.2);
    const sec = e.querySelector('.sec');
    if (isH2 && sec) { g.globalAlpha = 1; g.fillStyle = col('--paper'); const t = sec.textContent.trim(), tw = g.measureText(t).width; const ty = Y(r.top + r.height / 2); g.fillRect(W - tw - 6, ty - 5, tw + 5, 10); g.fillStyle = col('--ink'); g.fillText(t, W - tw - 3.5, ty + .5); }
  });
  $$('mark.unote, .unote-m', v).forEach(e => { const r = e.getBoundingClientRect(); g.globalAlpha = 1; g.fillStyle = col('--ochre'); g.fillRect(W - 3, Y(r.top), 3, Math.max(2, r.height * sy)); });
  g.globalAlpha = 1;
  MM = { top0, sy, docH };
  updateMinimap();
}
function updateMinimap() {
  if (!MM) return;
  const y = (window.scrollY - MM.top0) * MM.sy, hh = Math.max(8, window.innerHeight * MM.sy);
  mmv.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; mmv.style.height = hh.toFixed(1) + 'px';
}
function scheduleMinimap(ms) { clearTimeout(mmT); mmT = setTimeout(layoutMinimap, ms == null ? 120 : ms); }
let mmDrag = null;
mm.addEventListener('pointerdown', e => {
  if (!MM) return; e.preventDefault();
  const r = mm.getBoundingClientRect(), y = e.clientY - r.top, vt = (window.scrollY - MM.top0) * MM.sy, vh = window.innerHeight * MM.sy;
  mmDrag = (y >= vt && y <= vt + vh) ? y - vt : vh / 2;
  mm.setPointerCapture(e.pointerId); mmMove(e);
});
function mmMove(e) { if (mmDrag == null || !MM) return; const r = mm.getBoundingClientRect(); window.scrollTo(0, MM.top0 + (e.clientY - r.top - mmDrag) / MM.sy); }
mm.addEventListener('pointermove', mmMove);
mm.addEventListener('pointerup', () => { mmDrag = null; });
window.addEventListener('scroll', () => requestAnimationFrame(updateMinimap), { passive: true });
window.addEventListener('resize', () => scheduleMinimap(200));
if (window.ResizeObserver) new ResizeObserver(() => scheduleMinimap(250)).observe(document.querySelector('.page') || document.body);
const _showViewMM = showView;
showView = function (id) { const r = _showViewMM(id); MM = null; scheduleMinimap(60); r.then(() => scheduleMinimap(300)); return r; };

/* ---------- chapter map: the main ideas and how they connect, between the text and the minimap ---------- */
const cmap = h('aside', 'cmap'); cmap.setAttribute('aria-label', 'Map of this chapter'); cmap.hidden = true;
const cmapHead = h('div', 'cmap-h'); cmapHead.appendChild(h('span', 'cmap-t', 'map of the chapter'));
const cmapX = h('button', 'side-x cmap-x', '×'); cmapX.type = 'button'; cmapX.title = 'Close'; cmapHead.appendChild(cmapX);
const cmapBody = h('div', 'cmap-b'); cmap.appendChild(cmapHead); cmap.appendChild(cmapBody);
const cmapBtn = h('button', 'cmap-btn', 'map'); cmapBtn.type = 'button'; cmapBtn.title = 'Map of the chapter'; cmapBtn.hidden = true;
document.body.appendChild(cmap); document.body.appendChild(cmapBtn);
let CM = null, cmOpen = false;
function chNum(id) { const m = /(?:^|-)(?:r|s|h|fig|alg|ch|eq)(\d+)/.exec(id.replace(/^clt-/, '')); return m ? +m[1] : null; }
function wrapText(t, w, px) { const words = t.split(' '), lines = []; let cur = ''; const cw = px * .5; words.forEach(x => { const nx = cur ? cur + ' ' + x : x; if (nx.length * cw > w && cur) { lines.push(cur); cur = x; } else cur = nx; }); if (cur) lines.push(cur); return lines; }
function placeCmap() {
  const v = currentView && document.getElementById(currentView);
  const data = v && v.querySelector('script.mindmap-data');
  const wide = window.innerWidth >= 1300 && document.body.classList.contains('has-toc');
  if (!data || !wide) { cmap.hidden = true; cmapBtn.hidden = true; return; }
  const page = $('.page').getBoundingClientRect(), mmr = mm.getBoundingClientRect();
  const free = (mmr.left || window.innerWidth) - page.right - 18;
  const docked = free >= 175;
  document.body.classList.toggle('cmap-docked', docked);
  cmapBtn.hidden = docked;
  cmap.hidden = !(docked || cmOpen);
  cmap.classList.toggle('floating', !docked);
  if (docked) { cmap.style.left = (page.right + 8) + 'px'; cmap.style.width = Math.min(300, free) + 'px'; }
  else { cmap.style.left = ''; cmap.style.width = ''; }
}
function buildCmap() {
  CM = null; cmapBody.innerHTML = '';
  const v = currentView && document.getElementById(currentView);
  const data = v && v.querySelector('script.mindmap-data');
  placeCmap();
  if (!data || cmap.hidden) return;
  const d = JSON.parse(data.textContent), here = +d.num;
  const W = Math.max(150, cmap.clientWidth - 14), FS = 11, LH = 13.5, PADX = 7, ARC = W < 230 ? 20 : 32;
  const boxW = lvl => W - ARC - 8 - lvl * 12;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', W); svg.setAttribute('class', 'cmap-svg');
  const gE = document.createElementNS(NS, 'g'), gN = document.createElementNS(NS, 'g'), gL = document.createElementNS(NS, 'g');
  svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(gL);
  const mk = (tag, at, par) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); (par || gN).appendChild(e); return e; };
  const nodes = {}; let y = 4;
  const ext = (d.ext || []).map(e => ({ id: e[0], label: e[1], to: e[2], ch: chNum(e[2]), ext: true }));
  const before = ext.filter(e => e.ch != null && e.ch < here), after = ext.filter(e => !(e.ch != null && e.ch < here));
  const section = (label) => { const t = mk('text', { x: 2, y: y + 9, class: 'cmap-sec' }); t.textContent = label; y += 16; };
  const drawNode = (n, lvl, cls) => {
    const w = boxW(lvl), x = 2 + lvl * 12;
    const lines = wrapText(n.label, w - 2 * PADX, FS);
    const hh = lines.length * LH + 8;
    const g = mk('g', { class: 'cmap-n ' + cls, tabindex: 0, role: 'link' });
    mk('rect', { x, y, width: w, height: hh, rx: 5 }, g);
    lines.forEach((l, i) => { const t = mk('text', { x: x + PADX, y: y + 4 + LH * (i + .78) }, g); t.textContent = l; });
    if (n.ext) { const t = mk('text', { x: x + w - 4, y: y + 10, class: 'cmap-ch', 'text-anchor': 'end' }, g); t.textContent = 'Ch ' + n.ch; }
    n.x = x; n.y = y; n.w = w; n.h = hh; n.cy = y + hh / 2; n.g = g; n.lvl = lvl;
    g.addEventListener('click', () => { const t = document.getElementById(n.to); if (t) jump(n.to, null); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter') g.dispatchEvent(new Event('click')); });
    g.addEventListener('mouseenter', () => focusNode(n.id)); g.addEventListener('mouseleave', () => focusNode(null));
    g.addEventListener('focus', () => focusNode(n.id)); g.addEventListener('blur', () => focusNode(null));
    const tt = mk('title', {}, g); tt.textContent = n.label + (n.ext ? ' (Chapter ' + n.ch + ')' : '') + ' · click to go there';
    nodes[n.id] = n; y += hh + 5;
  };
  if (before.length) { section('builds on'); before.forEach(n => drawNode(n, 0, 'ext')); y += 6; }
  section('this chapter');
  let lastTop = null;
  d.nodes.forEach(r => {
    const n = { id: r[0], label: r[1], to: r[2], lvl: r[3] };
    drawNode(n, n.lvl, n.lvl ? 'leaf' : 'hub');
    if (n.lvl && lastTop) { const p = nodes[lastTop]; mk('path', { d: `M${p.x + 6} ${p.y + p.h}V${n.cy}H${n.x}`, class: 'cmap-tree' }, gE); }
    if (!n.lvl) lastTop = n.id;
  });
  if (after.length) { y += 6; section('leads to'); after.forEach(n => drawNode(n, 0, 'ext')); }
  svg.setAttribute('height', y + 4);
  /* relations: arcs on the right-hand side */
  const edges = (d.edges || []).concat(d.extedges || []).map(e => ({ a: nodes[e[0]], b: nodes[e[1]], label: e[2] })).filter(e => e.a && e.b);
  edges.forEach(e => {
    const x1 = e.a.x + e.a.w, x2 = e.b.x + e.b.w, y1 = e.a.cy, y2 = e.b.cy, bulge = Math.min(ARC + 4, 10 + Math.abs(y2 - y1) * .12);
    const xm = Math.max(x1, x2) + bulge;
    e.p = mk('path', { d: `M${x1} ${y1}C${xm} ${y1} ${xm} ${y2} ${x2} ${y2}`, class: 'cmap-e' + (e.a.ext || e.b.ext ? ' x' : '') }, gE);
    const dir = y2 > y1 ? 1 : -1;
    e.h = mk('path', { d: `M${x2 + 5} ${y2 - 3}L${x2} ${y2}L${x2 + 5} ${y2 + 3}`, class: 'cmap-ah' + (e.a.ext || e.b.ext ? ' x' : '') }, gE);
    e.t = mk('text', { x: xm - 2, y: (y1 + y2) / 2 + 3, class: 'cmap-el', 'text-anchor': 'end' }, gL); e.t.textContent = e.label;
    e.bg = null;
  });
  cmapBody.appendChild(svg);
  CM = { nodes, edges, order: d.nodes.map(r => r[0]) };
  updateCmap();
}
function focusNode(id) {
  if (!CM) return;
  svgClass(cmapBody.firstChild, 'focus', !!id);
  const near = new Set(id ? [id] : []);
  CM.edges.forEach(e => { const on = id && (e.a.id === id || e.b.id === id); e.p.classList.toggle('on', !!on); e.h.classList.toggle('on', !!on); e.t.classList.toggle('on', !!on); if (on) { near.add(e.a.id); near.add(e.b.id); } });
  Object.values(CM.nodes).forEach(n => n.g.classList.toggle('near', near.has(n.id)));
}
function svgClass(el, c, on) { if (el && el.classList) el.classList.toggle(c, on); }
function updateCmap() {
  if (!CM) return;
  let cur = null;
  CM.order.forEach(id => { const n = CM.nodes[id], t = document.getElementById(n.to); if (t && t.getBoundingClientRect().top < window.innerHeight * .35) cur = id; });
  Object.values(CM.nodes).forEach(n => n.g.classList.toggle('cur', n.id === cur));
  if (cur && cmap.scrollHeight > cmap.clientHeight + 4) {
    const n = CM.nodes[cur], top = cmapBody.offsetTop + n.y;
    if (top < cmap.scrollTop + 30 || top > cmap.scrollTop + cmap.clientHeight - 60) cmap.scrollTop = top - cmap.clientHeight / 3;
  }
}
cmapBtn.addEventListener('click', () => { cmOpen = !cmOpen; buildCmap(); });
cmapX.addEventListener('click', () => { cmOpen = false; placeCmap(); });
window.addEventListener('scroll', () => requestAnimationFrame(updateCmap), { passive: true });
let cmT = 0; window.addEventListener('resize', () => { clearTimeout(cmT); cmT = setTimeout(buildCmap, 220); });
const _showViewCM = showView;
showView = function (id) { const r = _showViewCM(id); cmOpen = false; setTimeout(buildCmap, 80); r.then(() => setTimeout(buildCmap, 400)); return r; };

/* ---------- search across both courses ---------- */
const SRCH = { idx: null };
const TEXMAP = { le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', to: '→', infty: '∞', in: '∈', notin: '∉', ni: '∋', subseteq: '⊆', subset: '⊂', supseteq: '⊇', cup: '∪', cap: '∩', bigcup: '⋃', bigcap: '⋂', setminus: '∖', sigma: 'σ', mu: 'μ', nu: 'ν', Omega: 'Ω', omega: 'ω', eps: 'ε', varepsilon: 'ε', delta: 'δ', Delta: 'Δ', lambda: 'λ', Lambda: 'Λ', tau: 'τ', varphi: 'φ', phi: 'φ', Phi: 'Φ', psi: 'ψ', alpha: 'α', beta: 'β', gamma: 'γ', theta: 'θ', Theta: 'Θ', rho: 'ρ', kappa: 'κ', eta: 'η', chi: 'χ', pi: 'π', Pi: 'Π', Sigma: 'Σ', ell: 'ℓ',
  R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', Rbar: 'ℝ̄', PP: 'ℙ', E: '𝔼', EX: 'EX', F: '𝓕', G: '𝒢', C: '𝒞', H: '𝓗', D: '𝒟', X: '𝒳', A: '𝒜', B: 'ℬ', M: '𝓜', T: '𝒯', I: 'ℐ', Lp: 'Lᵖ', Pow: '𝒫', ind: '𝟙', VCD: 'VCD', err: 'err', size: 'size', bit: 'bit', sgn: 'sgn', poly: 'poly',
  sum: 'Σ', prod: 'Π', int: '∫', times: '×', cdot: '·', circ: '∘', oplus: '⊕', pm: '±', mid: '|', wedge: '∧', vee: '∨', bigwedge: '⋀', neg: '¬', emptyset: '∅', forall: '∀', exists: '∃', sim: '∼', approx: '≈', equiv: '≡', ll: '≪', uparrow: '↑', downarrow: '↓', Uparrow: '⇑', mapsto: '↦', longmapsto: '↦', implies: '⇒', Longrightarrow: '⇒', iff: '⇔', leftarrow: '←', xrightarrow: '→', pto: '→ᵖ', dto: '→ᵈ', langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', dots: '…', ldots: '…', cdots: '⋯',
  log: 'log', exp: 'exp', lim: 'lim', limsup: 'lim sup', liminf: 'lim inf', sup: 'sup', inf: 'inf', max: 'max', min: 'min', gcd: 'gcd', bmod: 'mod', pmod: 'mod', Pr: 'Pr' };
function detex(t) {
  t = t.replace(/\\[{}]/g, '').replace(/\\[()[\]]/g, ' ').replace(/\\[,;:! ]/g, ' ');
  for (let k = 0; k < 3; k++) t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
  return t.replace(/\\([A-Za-z]+)/g, (m, w) => TEXMAP[w] != null ? TEXMAP[w] + ' ' : ' ').replace(/[{}]/g, '').replace(/[\^_]/g, '').replace(/\s+/g, ' ').replace(/ ([,.;:)]) ?/g, '$1 ').trim();
}
function bodyText(el) { const c = el.cloneNode(true); c.querySelectorAll('.head, .pg, .role-l').forEach(x => x.remove()); return c.textContent; }
function buildIndex() {
  const idx = []; let auto = 0;
  const label = v => (v.dataset.short || '') + ' · ' + (v.dataset.title || '');
  $$('.view').forEach(v => {
    if (v.classList.contains('hub')) return;
    const vlab = label(v);
    let head = '';
    const push = (el, kind, title, text) => {
      if (!el.id) el.id = 'q' + (auto++).toString(36);
      idx.push({ id: el.id, view: v.id, course: v.dataset.course || '', kind, title: detex(title), text: detex(text), where: vlab, head, low: (detex(title) + ' ' + detex(text)).toLowerCase() });
    };
    $$('h2, h3, .thm, .algo, figure, aside.bg, details.pause, .sq, p, li', v).forEach(el => {
      if (el.closest('.for-llms, .xcard, .ch-nav, nav, .toc, .rindex, header')) return;
      if (/^H[23]$/.test(el.tagName)) { head = plainHeading(el); push(el, 'section', head, ''); return; }
      if (el.matches('.thm')) return push(el, 'result', el.dataset.label + (el.dataset.name ? ' (' + el.dataset.name + ')' : el.dataset.desc ? ' · ' + el.dataset.desc : ''), bodyText(el));
      if (el.matches('.algo')) return push(el, 'result', el.dataset.label + ' · ' + el.dataset.name, el.textContent);
      if (el.matches('figure')) { const c = el.querySelector('figcaption'); const t = el.querySelector('.figtag'); return push(el, 'figure', t ? t.textContent : 'Figure', c ? c.textContent.replace(t ? t.textContent : '', '') : ''); }
      if (el.matches('aside.bg')) { const hh = el.querySelector('.bg-head'); return push(el, 'background', hh ? hh.textContent : 'Background', el.textContent.replace(hh ? hh.textContent : '', '')); }
      if (el.matches('details.pause')) { const n = el.querySelector('.exname'); const q = el.querySelector('.ex-q'); return push(el, 'exercise', 'Exercise · ' + (n ? n.textContent : ''), q ? q.textContent : ''); }
      if (el.matches('.sq')) return push(el, 'question', (v.dataset.title || '') + ' Q' + el.querySelector('.sq-n').textContent + (el.dataset.name ? ' · ' + el.dataset.name : ''), el.textContent);
      if (el.closest('.thm, .algo, figure, aside.bg, details.pause, .sq, .sec-meta, .role-l')) return;
      if (el.tagName === 'LI' && el.closest('.toc-side, .hub-list')) return;
      push(el, 'text', head, el.textContent);
    });
  });
  SRCH.idx = idx;
}
const sbox = h('div', 'search-box'); sbox.hidden = true; sbox.setAttribute('role', 'dialog'); sbox.setAttribute('aria-label', 'Search');
sbox.innerHTML = '<div class="sb-in"><input type="search" placeholder="Search both courses: a result, a word, “Fatou”, “VC dimension”, “4.9”…" aria-label="Search" autocomplete="off" spellcheck="false"><div class="sb-filt" role="group"><button type="button" data-sf="" aria-pressed="true">all</button><button type="button" data-sf="pmm" aria-pressed="false">PMM</button><button type="button" data-sf="clt" aria-pressed="false">CLT</button></div></div><div class="sb-res" role="listbox"></div><div class="sb-foot">↑↓ to move · enter to go · esc to close</div>';
const sback = h('div', 'search-back'); sback.hidden = true;
document.body.appendChild(sback); document.body.appendChild(sbox);
const sin = $('input', sbox), sres = $('.sb-res', sbox); let sel = 0, hits = [], sfilt = '';
function esc2(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function snippet(text, terms) {
  const low = text.toLowerCase(); let at = -1;
  terms.forEach(t => { const i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; });
  let a = Math.max(0, at - 50), b = Math.min(text.length, (at < 0 ? 0 : at) + 130);
  let s = (a > 0 ? '…' : '') + text.slice(a, b) + (b < text.length ? '…' : '');
  s = esc2(s);
  terms.forEach(t => { if (t.length < 2) return; s = s.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
  return s;
}
const KW = { result: 0, section: 1, figure: 2, exercise: 3, question: 3, background: 4, text: 5 };
function runSearch() {
  if (!SRCH.idx) buildIndex();
  const q = sin.value.trim().toLowerCase();
  if (!q) { sres.innerHTML = '<div class="sb-empty">Type to search every chapter and problem sheet. Results come first, then sections, figures, exercises and text.</div>'; hits = []; return; }
  const terms = q.split(/\s+/).filter(Boolean);
  hits = SRCH.idx.filter(e => (!sfilt || e.course === sfilt) && terms.every(t => e.low.includes(t)))
    .map(e => { const tl = e.title.toLowerCase(); let sc = KW[e.kind] * 10; terms.forEach(t => { if (tl.includes(t)) sc -= 25; if (tl.startsWith(t)) sc -= 5; }); return [sc, e]; })
    .sort((a, b) => a[0] - b[0]).slice(0, 40).map(x => x[1]);
  sel = 0;
  sres.innerHTML = hits.length ? hits.map((e, i) => '<div class="sb-r' + (i === sel ? ' on' : '') + '" role="option" data-i="' + i + '"><div class="sb-k"><span class="sb-kind k-' + e.kind + '">' + e.kind + '</span>' + esc2(e.where) + (e.head && e.kind !== 'section' ? ' › ' + esc2(e.head) : '') + '</div><div class="sb-t">' + snippet(e.title, terms) + '</div>' + (e.text ? '<div class="sb-s">' + snippet(e.text, terms) + '</div>' : '') + '</div>').join('')
    : '<div class="sb-empty">Nothing matches all of those words.</div>';
}
function openSearch() { sbox.hidden = false; sback.hidden = false; sin.focus(); sin.select(); runSearch(); }
function closeSearch() { sbox.hidden = true; sback.hidden = true; }
function goHit(i) {
  const e = hits[i]; if (!e) return; closeSearch();
  jump(e.id, null);
  setTimeout(() => { const t = document.getElementById(e.id); if (t) { const d = t.closest('details'); if (d) { let p = d; while (p) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; } } t.scrollIntoView({ block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); } }, 150);
}
let sT = 0;
sin.addEventListener('input', () => { clearTimeout(sT); sT = setTimeout(runSearch, 90); });
sin.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = clamp(sel + (e.key === 'ArrowDown' ? 1 : -1), 0, Math.max(0, hits.length - 1)); $$('.sb-r', sres).forEach((r, i) => r.classList.toggle('on', i === sel)); const on = $('.sb-r.on', sres); if (on) on.scrollIntoView({ block: 'nearest' }); }
  if (e.key === 'Enter') { e.preventDefault(); goHit(sel); }
  if (e.key === 'Escape') closeSearch();
});
sres.addEventListener('click', e => { const r = e.target.closest('.sb-r'); if (r) goHit(+r.dataset.i); });
sback.addEventListener('click', closeSearch);
$$('[data-sf]', sbox).forEach(b => b.addEventListener('click', () => { sfilt = b.dataset.sf; pressGroup($$('[data-sf]', sbox), sfilt, 'data-sf'); runSearch(); sin.focus(); }));
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#search-btn')) openSearch(); });
document.addEventListener('keydown', e => {
  const typing = e.target.closest && e.target.closest('input, textarea, [contenteditable]');
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openSearch(); }
});
setTimeout(buildIndex, 50);

/* ---------- copy a result as a Mochi flashcard (markdown: front, ---, back) ---------- */
const MOCHI_MAC = [['PP','\\mathbb{P}'],['E','\\mathbb{E}'],['R','\\mathbb{R}'],['N','\\mathbb{N}'],['Q','\\mathbb{Q}'],['Z','\\mathbb{Z}'],['Rbar','\\overline{\\mathbb{R}}'],['F','\\mathcal{F}'],['A','\\mathcal{A}'],['I','\\mathcal{I}'],['B','\\mathcal{B}'],['G','\\mathcal{G}'],['H','\\mathcal{H}'],['Pow','\\mathcal{P}'],['T','\\mathcal{T}'],['D','\\mathcal{D}'],['M','\\mathcal{M}'],['C','\\mathcal{C}'],['X','\\mathcal{X}'],['eps','\\varepsilon'],['ind','\\mathbf{1}'],['as','\\text{ a.s.}'],['dto','\\xrightarrow{d}'],['pto','\\xrightarrow{\\mathbb{P}}'],['err','\\operatorname{err}'],['EX','\\mathrm{EX}'],['VCD','\\operatorname{VCD}'],['size','\\operatorname{size}'],['poly','\\operatorname{poly}'],['sgn','\\operatorname{sgn}']];
function mochiTex(t) {
  t = t.replace(/\\Lp\s*\{?(\w)\}?/g, '\\mathcal{L}^{$1}').replace(/\\bit\s*\{([^{}]*)\}/g, '\\overline{$1}').replace(/\\why\s*\{[^{}]*\}/g, '');
  MOCHI_MAC.forEach(([k, v]) => { t = t.replace(new RegExp('\\\\' + k + '(?![A-Za-z])', 'g'), () => v); });
  return t;
}
function mdOf(node) {
  let out = '';
  node.childNodes.forEach(n => {
    if (n.nodeType === 3) { out += n.textContent.replace(/\s+/g, ' '); return; }
    if (n.nodeType !== 1) return;
    const t = n.tagName, c = n.classList;
    if (t === 'MJX-CONTAINER') { const tex = mochiTex((n.dataset.tex || '').trim()); out += n.dataset.disp ? '\n\n$$' + tex + '$$\n\n' : '$$' + tex + '$$'; return; }
    if (c.contains('pg') || c.contains('qed') || c.contains('head') || t === 'SCRIPT' || t === 'STYLE' || t === 'SN' || c.contains('sn')) return;
    if (t === 'STRONG' || t === 'B') { out += '**' + mdOf(n).trim() + '**'; return; }
    if (t === 'EM' || t === 'I') { out += '_' + mdOf(n).trim() + '_'; return; }
    if (t === 'UL' || t === 'OL') { let i = 0; out += '\n\n'; n.querySelectorAll(':scope > li').forEach(li => { i++; out += (t === 'OL' ? i + '. ' : '- ') + mdOf(li).trim() + '\n'; }); out += '\n'; return; }
    if (t === 'P' || t === 'DIV') { out += '\n\n' + mdOf(n).trim() + '\n\n'; return; }
    if (t === 'BR') { out += '\n'; return; }
    out += mdOf(n);
  });
  return out;
}
function flashcardMd(el) {
  const label = el.dataset.label || '', name = el.dataset.name || '', desc = el.dataset.desc || '';
  const kw = label.split(' ')[0];
  const body = el.cloneNode(true); body.querySelectorAll('.fc-btn').forEach(x => x.remove());
  const tb = body.querySelector('.tb') || body;
  let back = mdOf(tb).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  back = back.replace(/^\*{0,2}[^\n]*?\([^\n]*?\)\.\*{0,2}\s*/, m => m.length < 140 && /^\*{0,2}(Definition|Theorem|Lemma|Proposition|Corollary|Example|Remark|Claim|Fact|Algorithm)/i.test(m) ? '' : m);
  const title = name || desc;
  const v = el.closest('.view'); const src = v ? (v.dataset.short || '') + ' ' + label : label;
  let front;
  if (/^Definition/i.test(kw)) front = '**' + (title ? 'Define: ' + title : 'State ' + label) + '**';
  else if (/^(Example|Remark|Claim|Fact)/i.test(kw)) front = '**' + label + (title ? ': ' + title : '') + '**';
  else front = '**State ' + label + (title ? ' (' + title + ')' : '') + '.**';
  return front + '\n\n---\n\n' + back + '\n\n_' + src.trim() + '_\n';
}
function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
  return new Promise((res, rej) => { try { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); res(); } catch (e) { rej(e); } });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.fc-btn'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const el = b.closest('.thm, .algo'); if (!el) return;
  copyText(flashcardMd(el)).then(() => { b.textContent = 'copied ✓'; b.classList.add('ok'); setTimeout(() => { b.textContent = '⧉ flashcard'; b.classList.remove('ok'); }, 1600); })
    .catch(() => { b.textContent = 'copy failed'; });
});
function addFcButtons(root) {
  $$('.thm, .algo', root || document).forEach(el => {
    if (el.closest('.xcard, .side-ib') || el.querySelector(':scope > .fc-btn')) return;
    const b = h('button', 'fc-btn'); b.type = 'button'; b.textContent = '⧉ flashcard'; b.title = 'Copy as a Mochi flashcard (markdown)';
    el.appendChild(b);
  });
}
addFcButtons();
