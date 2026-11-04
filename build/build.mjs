#!/usr/bin/env node
// Builds dist/ from courses/*/ and shared/. Usage: node build/build.mjs [--strict]
// Fails (exit 1) on any error: KaTeX failures, unresolved or forward references, coverage gaps, banned phrases.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { splitFrontMatter, splitSections, parseBlocks } from './lib/parse.mjs';
import { Renderer, esc, texToPlain } from './lib/render.mjs';
import { shell, aiNote, sizeBar, diffMark, impMark, pagesText, legend } from './lib/templates.mjs';
import { runChecks } from './lib/checks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const rel = (p) => path.relative(ROOT, p);

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function write(p, s) { mkdirp(path.dirname(p)); fs.writeFileSync(p, s); }
function copyDir(src, dst, filter = () => true) {
  if (!fs.existsSync(src)) return;
  mkdirp(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d, filter);
    else if (filter(e.name)) fs.copyFileSync(s, d);
  }
}

// ---------------------------------------------------------------- load
function loadCourse(dir) {
  const course = yaml.load(fs.readFileSync(path.join(dir, 'course.yaml'), 'utf8'));
  course.dir = dir;
  course.macros = fs.existsSync(path.join(dir, 'macros.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'macros.json'), 'utf8')) : {};
  course.notation = fs.existsSync(path.join(dir, 'notation.yaml')) ? yaml.load(fs.readFileSync(path.join(dir, 'notation.yaml'), 'utf8')) || [] : [];
  course.manifest = fs.existsSync(path.join(dir, 'manifest.yaml')) ? yaml.load(fs.readFileSync(path.join(dir, 'manifest.yaml'), 'utf8')) : { chapters: [], items: [] };
  const srcDir = path.join(dir, 'source');
  course.chapterFiles = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter((f) => f.endsWith('.md')).sort() : [];
  const shDir = path.join(dir, 'sheets');
  course.sheetFiles = fs.existsSync(shDir) ? fs.readdirSync(shDir).filter((f) => f.endsWith('.md')).sort() : [];
  return course;
}

// ---------------------------------------------------------------- render
function renderCourse(course) {
  const R = new Renderer(course);
  const chapters = [];
  const allPrompts = [];

  for (const f of course.chapterFiles) {
    const file = path.join(course.dir, 'source', f);
    const { meta, body } = splitFrontMatter(fs.readFileSync(file, 'utf8'));
    const ch = { ...meta, id: meta.id, number: String(meta.number), slug: meta.slug, file: rel(file) };
    ch.url = `/${course.id}/${ch.number}-${ch.slug}.html`;
    R.ctx = { file: rel(file), chapter: ch, pageUrl: ch.url, prompts: [], vizUsed: new Set() };
    R.exerciseCount = 0;
    R.sidenoteCount = 0;
    const startOrder = R.order;
    const parts = splitSections(body);
    ch.sections = [];
    let introHtml = '';
    parts.forEach((p, si) => {
      const isIntro = p.heading === null;
      const sec = isIntro ? null : {
        id: p.attrs.id, title: p.heading, difficulty: p.attrs.difficulty, importance: p.attrs.importance,
        dnote: p.attrs.dnote, inote: p.attrs.inote, items: [], size: { words: 0, displays: 0 }, startOrder: R.order,
      };
      if (sec) {
        if (!sec.id) R.err(`section "${p.heading}" has no {#id}`);
        sec.number = `${ch.number}.${ch.sections.length + 1}`;
        sec.titleHtml = R.mdBlock(sec.title, true);
        R.registerItem({ id: sec.id, kind: 'section', kindLabel: '§', number: sec.number, title: sec.title, titleHtml: sec.titleHtml, order: R.order, chapter: ch.id, chapterNumber: ch.number, chapterTitle: ch.title, url: `${ch.url}#${sec.id}`, uses: [], usedBy: new Set(), statementHtml: '' });
      }
      R.ctx.sectionId = sec?.id || null;
      R.ctx.size = sec ? sec.size : (ch.introSize = { words: 0, displays: 0 });
      R.ctx.tocItems = sec ? sec.items : [];
      // ### subsections become anchors in the section
      const text = p.text.replace(/^###\s+(.*?)\s*\{#([\w-]+)\}\s*$/gm, (_, t, id) => `<h3 id="${id}" class="subsec">${t}</h3>`);
      const html = R.renderNodes(parseBlocks(text, rel(file)));
      if (isIntro) introHtml = html;
      else {
        sec.html = html;
        sec.endOrder = R.order;
        ch.sections.push(sec);
      }
    });
    ch.introHtml = introHtml;
    ch.prompts = R.ctx.prompts;
    ch.vizUsed = [...R.ctx.vizUsed];
    ch.orderRange = [startOrder + 1, R.order];
    ch.epigraphHtml = meta.epigraph ? R.mdBlock(meta.epigraph, true) : '';
    ch.epigraphByHtml = meta.epigraph_by ? R.mdBlock(meta.epigraph_by, true) : '';
    allPrompts.push(...ch.prompts);
    chapters.push(ch);
  }

  // Sheets
  const sheets = [];
  for (const f of course.sheetFiles) {
    const file = path.join(course.dir, 'sheets', f);
    const { meta, body } = splitFrontMatter(fs.readFileSync(file, 'utf8'));
    const sh = { ...meta, file: rel(file), url: `/${course.id}/sheet-${meta.number}.html` };
    R.ctx = { file: rel(file), sheet: sh, pageUrl: sh.url, inSheet: true, sheetQuestions: [], prompts: [], vizUsed: new Set() };
    sh.html = R.renderNodes(parseBlocks(body, rel(file)));
    sh.introHtml = meta.intro ? R.mdBlock(meta.intro) : '';
    sh.questions = R.ctx.sheetQuestions;
    sheets.push(sh);
  }
  return { R, chapters, sheets, prompts: allPrompts };
}

// ---------------------------------------------------------------- resolve
function labelOf(it) {
  if (!it) return '??';
  if (it.kind === 'term') return it.term;
  if (it.kind === 'section') return `§${it.number}`;
  if (it.kind === 'question') return `Sheet ${it.sheetNumber} ${it.number}`;
  if (it.kind === 'figure') return texToPlain(it.title) || 'Figure';
  if (it.number) return `${it.kindLabel} ${it.number}`;
  return it.title ? `${it.kindLabel} (${texToPlain(it.title)})` : it.kindLabel;
}

function promptText(course, R, qs) {
  const items = qs.map((q) => R.items.get(q)).filter(Boolean);
  if (!items.length) return 'Sheet question (missing)';
  const bySheet = new Map();
  for (const it of items) {
    if (!bySheet.has(it.sheetNumber)) bySheet.set(it.sheetNumber, []);
    bySheet.get(it.sheetNumber).push(it);
  }
  const parts = [...bySheet.entries()].map(([n, its]) => {
    const links = its.map((it) => `<a class="xref q-link" data-ref="${it.id}" href="${it.url}">${esc(it.number)}</a>`);
    const list = links.length === 1 ? links[0] : `${links.slice(0, -1).join(', ')} and ${links[links.length - 1]}`;
    return `Sheet ${n}, Question${its.length > 1 ? 's' : ''} ${list}`;
  });
  return `You can now do ${parts.join('; ')}.`;
}

function resolve(html, R, course, ctxPrompts) {
  return html
    .replace(/⟦href:([\w:-]+)⟧/g, (_, id) => R.items.get(id)?.url || '#missing')
    .replace(/⟦label:([\w:-]+)⟧/g, (_, id) => esc(labelOf(R.items.get(id))))
    .replace(/⟦prompt:([^⟧]*)⟧/g, (_, qs) => promptText(course, R, qs.split(',')))
    .replace(/⟦promptback:([\w:-]+)⟧/g, (_, id) => {
      const p = ctxPrompts.find((pp) => pp.qs.includes(id));
      return p ? `Ready after <a href="${p.url}" class="xref" data-ref="${p.section}">${esc(labelOf(R.items.get(p.section)))}</a>.` : '';
    })
    .replace(/⟦backlinks:([\w:-]+)⟧/g, (_, id) => {
      const it = R.items.get(id);
      if (!it || !it.usedBy.size) return '';
      const list = [...it.usedBy].map((u) => R.items.get(u)).filter((u) => u && u.kind !== 'section').sort((a, b) => (a.order === Infinity) - (b.order === Infinity) || a.order - b.order);
      if (!list.length) return '';
      return `<span class="bl-label">Used in</span> ${list.map((u) => `<a class="xref" data-ref="${u.id}" href="${u.url}">${esc(labelOf(u))}</a>`).join(', ')}`;
    });
}

// ---------------------------------------------------------------- pages
function tocHtml(course, chapters, ch, maxWeight) {
  const others = chapters.map((c) => `<li${c === ch ? ' class="current"' : ''}><a href="${c.url}">${c.number}. ${esc(c.title)}</a></li>`).join('');
  const secs = ch.sections.map((s) => {
    const items = s.items.filter((it) => it.kind === 'prompt' || it.toc).map((it) => {
      if (it.kind === 'prompt') return `<li class="toc-prompt"><a href="#${it.id}">Sheet ${it.qs.map((q) => q.replace(/^sheet\d+-/, '').toUpperCase()).join(', ')}</a></li>`;
      const lab = it.kind === 'figure' ? `<span class="toc-kind">Figure</span> ${it.titleHtml}` : `<span class="toc-kind">${esc(it.kindLabel)}${it.number ? ` ${esc(it.number)}` : ''}</span>${it.titleHtml ? ` ${it.titleHtml}` : ''}`;
      return `<li class="toc-${it.kind}"><a href="#${it.id}">${lab}</a></li>`;
    }).join('');
    return `<li class="toc-sec" data-sec="${s.id}"><a href="#${s.id}" class="toc-sec-link"><span class="toc-num">${s.number}</span> <span class="toc-sec-title">${s.titleHtml}</span></a><span class="toc-est">${sizeBar(s.weight, maxWeight)}${diffMark(s.difficulty, s.dnote)}${impMark(s.importance, s.inote)}</span>${items ? `<ol class="toc-items">${items}</ol>` : ''}</li>`;
  }).join('');
  return `<div class="toc-inner">
<div class="toc-head"><a class="toc-course" href="/${course.id}/">${esc(course.short)}</a>
<details class="toc-chapters"><summary>Chapter ${ch.number}: ${esc(ch.title)}</summary><ol>${others}</ol></details></div>
<div class="toc-track"><div class="toc-progress" aria-hidden="true"><span></span></div>
<ol class="toc-secs">${secs}</ol></div>
${legend()}
</div>`;
}

function estLine(s, maxWeight) {
  return `<p class="sec-est">${sizeBar(s.weight, maxWeight)}<span class="est-pages">${pagesText(s.weight)}</span>${diffMark(s.difficulty, s.dnote)}${impMark(s.importance, s.inote)}</p>`;
}

function chapterPage(course, data, ch, maxWeight) {
  const { R, chapters, prompts } = data;
  const idx = chapters.indexOf(ch);
  const prev = chapters[idx - 1], next = chapters[idx + 1];
  const nEx = [...R.items.values()].filter((i) => i.kind === 'exercise' && i.chapter === ch.id).length;
  const nQ = new Set(ch.prompts.flatMap((p) => p.qs)).size;
  const available = [...R.items.values()].filter((i) => i.chapter && i.kind !== 'term' && i.kind !== 'section' && i.order <= ch.orderRange[1]).sort((a, b) => a.order - b.order);
  const secHtml = ch.sections.map((s) => {
    const avail = available.filter((i) => i.order <= s.endOrder).map((i) => i.id).join(' ');
    return `<section class="sec" id="${s.id}" data-available-results="${avail}" data-sec-number="${s.number}">
<h2 class="sec-title"><span class="sec-num">${s.number}</span> ${s.titleHtml}</h2>
${estLine(s, maxWeight)}
${s.html}
</section>`;
  }).join('\n');
  const chWeight = ch.sections.reduce((a, s) => a + s.weight, 0);
  const chDiff = Math.round(ch.sections.reduce((a, s) => a + (+s.difficulty || 0) * s.weight, 0) / chWeight);
  const body = `<article class="chapter ${ch.ornament ? `orn-${ch.ornament}` : ''}" data-chapter="${ch.id}" data-course="${course.id}">
<header class="ch-head">
<p class="ch-kicker">${esc(course.code)} · Chapter ${ch.number}</p>
<h1 class="ch-title">${esc(ch.title)}</h1>
${ch.epigraphHtml ? `<blockquote class="epigraph"><p>${ch.epigraphHtml}</p>${ch.epigraphByHtml ? `<footer>${ch.epigraphByHtml}</footer>` : ''}</blockquote>` : ''}
<p class="ch-est">${pagesText(chWeight)} · ${nEx} exercise${nEx === 1 ? '' : 's'} · ${nQ} sheet question${nQ === 1 ? '' : 's'} · ${diffMark(chDiff)} <span class="ch-notes">Lecture notes pp. ${esc(ch.notes_pages || '')}</span></p>
</header>
<div class="ch-intro">${ch.introHtml}</div>
${secHtml}
<footer class="ch-foot">
${ch.colophon ? `<p class="colophon">${R.mdBlock(ch.colophon, true)}</p>` : ''}
<nav class="ch-nav">${prev ? `<a class="ch-prev" href="${prev.url}">← ${prev.number}. ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="ch-next" href="${next.url}">${next.number}. ${esc(next.title)} →</a>` : `<a class="ch-next" href="/${course.id}/">Back to the course page</a>`}</nav>
${aiNote(course, { available: available.length ? `${available.length} results from Chapter 1 up to the end of Chapter ${ch.number}, listed per section in the data-available-results attributes` : '' })}
</footer>
</article>`;
  const aiContext = {
    site: 'Part B explainers', course: { id: course.id, code: course.code, title: course.title, lecturer: course.lecturer },
    page: { kind: 'chapter', chapter: ch.number, title: ch.title, url: ch.url },
    sections: ch.sections.map((s) => ({ id: s.id, number: s.number, title: s.title, availableResults: available.filter((i) => i.order <= s.endOrder).map((i) => ({ id: i.id, label: labelOf(i) })) })),
    rules: course.aiRules, macros: course.macros, notation: `/${course.id}/notation.html`, index: `/${course.id}/index.json`, llms: '/llms.txt',
  };
  let html = shell({
    title: `${ch.number}. ${ch.title} · ${course.short}`, course, description: ch.summary,
    crumbs: [{ text: esc(course.short), href: `/${course.id}/` }, { text: `${ch.number}. ${esc(ch.title)}` }],
    toc: tocHtml(course, chapters, ch, maxWeight), body, bodyClass: 'page-chapter', aiContext,
    extraHead: ch.vizUsed.length ? `<script>window.PBX_VIZ=${JSON.stringify(ch.vizUsed)}</script>` : '',
  });
  return resolve(html, R, course, prompts);
}

function sheetPage(course, data, sh) {
  const { R, prompts } = data;
  const body = `<article class="sheet-page" data-course="${course.id}" data-sheet="${sh.id}">
<header class="ch-head"><p class="ch-kicker">${esc(course.code)} · Problem sheet</p><h1 class="ch-title">Sheet ${sh.number}${sh.title ? `: ${esc(sh.title)}` : ''}</h1>
<p class="sheet-src">${esc(sh.source || '')}</p></header>
<div class="sheet-note"><p>Questions are typeset from the official sheet. There are no solutions here: these are tutorial questions. Each question lists the results it uses and the point in the text after which you have everything you need.</p></div>
${sh.introHtml}
${sh.html}
${aiNote(course, { available: '' })}
</article>`;
  const html = shell({ title: `Sheet ${sh.number} · ${course.short}`, course, crumbs: [{ text: esc(course.short), href: `/${course.id}/` }, { text: `Sheet ${sh.number}` }], body, bodyClass: 'page-sheet', aiContext: { course: course.id, page: { kind: 'sheet', number: sh.number }, rules: course.aiRules } });
  return resolve(html, R, course, prompts);
}

function coursePage(course, data, maxWeight) {
  const { R, chapters, sheets, prompts } = data;
  const manifestChapters = course.manifest.chapters || [];
  const written = new Map(chapters.map((c) => [String(c.number), c]));
  const rows = manifestChapters.filter((m) => m.in_scope).map((m) => {
    const c = written.get(String(m.number));
    if (!c) return `<li class="cp-ch pending"><span class="cp-num">${esc(m.number)}</span><span class="cp-title">${esc(m.title)}</span><span class="cp-state">not written yet</span></li>`;
    const w = c.sections.reduce((a, s) => a + s.weight, 0);
    return `<li class="cp-ch" data-chapter="${c.id}"><span class="cp-num">${c.number}</span><a class="cp-title" href="${c.url}">${esc(c.title)}</a><span class="cp-est">${sizeBar(w, maxWeight * 4)} ${pagesText(w)}</span><span class="cp-progress" data-progress="${c.id}"></span>
<ol class="cp-secs">${c.sections.map((s) => `<li><a href="${c.url}#${s.id}">${s.number} ${s.titleHtml}</a></li>`).join('')}</ol></li>`;
  }).join('');
  const skipped = manifestChapters.filter((m) => !m.in_scope);
  const tracker = sheets.map((sh) => `<li class="tr-sheet"><a href="${sh.url}">Sheet ${sh.number}</a>${sh.title ? ` <span class="tr-title">${esc(sh.title)}</span>` : ''}<ol class="tr-qs">${sh.questions.filter((q) => !q.partOf).map((q) => {
    const p = prompts.find((pp) => pp.qs.includes(q.id));
    return `<li class="tr-q" data-q="${q.id}" data-prompt="${p ? p.id : ''}"><a href="${q.url}" class="xref" data-ref="${q.id}">${esc(q.number)}</a><span class="tr-state"></span></li>`;
  }).join('')}</ol></li>`).join('');
  const body = `<article class="course-page" data-course="${course.id}">
<header class="ch-head"><p class="ch-kicker">${esc(course.code)} · ${esc(course.term)} · ${esc(course.lecturer)}</p><h1 class="ch-title">${esc(course.title)}</h1>
<p class="course-blurb">${R.mdBlock(course.blurb || '', true)}</p></header>
<section class="cp-section"><h2>Chapters</h2><ol class="cp-chapters">${rows}</ol>
${skipped.length ? `<p class="cp-skipped">Not covered on this site yet: ${skipped.map((m) => `${esc(m.number)}. ${esc(m.title)}`).join('; ')}.</p>` : ''}</section>
<section class="cp-section"><h2>Problem sheets</h2><p class="cp-note">A question unlocks once you have read past the point where everything it needs has been covered. Tick questions off on the sheet pages.</p><ol class="tracker">${tracker}</ol></section>
<section class="cp-section"><h2>Reference</h2><ul class="cp-ref"><li><a href="/${course.id}/notation.html">Notation index</a></li><li><a href="/${course.id}/results.html">Every labelled result</a></li></ul></section>
${aiNote(course, { available: '' })}
</article>`;
  return resolve(shell({ title: `${course.short}: ${course.title}`, course, crumbs: [{ text: esc(course.short) }], body, bodyClass: 'page-course', aiContext: { course: course.id, page: { kind: 'course' }, rules: course.aiRules } }), R, course, prompts);
}

function notationPage(course, data) {
  const { R } = data;
  const rows = course.notation.map((n) => {
    const def = R.items.get(n.defined);
    if (!def) R.err(`notation.yaml: ${n.tex} points to unknown item ${n.defined}`);
    return `<tr><td class="nt-sym">${R.tex(n.tex, false)}</td><td>${R.mdBlock(n.meaning, true)}</td><td>${def ? `<a class="xref" data-ref="${def.id}" href="${def.url}">${esc(labelOf(def))}</a>` : ''}</td></tr>`;
  }).join('');
  const body = `<article class="ref-page"><header class="ch-head"><p class="ch-kicker">${esc(course.code)}</p><h1 class="ch-title">Notation</h1></header>
<p>Symbols in the order they are introduced, with the lecturer's conventions. Hover a reference to see where it is defined.</p>
<table class="notation"><thead><tr><th>Symbol</th><th>Meaning</th><th>Defined in</th></tr></thead><tbody>${rows}</tbody></table>${aiNote(course, {})}</article>`;
  return resolve(shell({ title: `Notation · ${course.short}`, course, crumbs: [{ text: esc(course.short), href: `/${course.id}/` }, { text: 'Notation' }], body, bodyClass: 'page-ref' }), R, course, data.prompts);
}

function resultsPage(course, data) {
  const { R, chapters } = data;
  const body = `<article class="ref-page"><header class="ch-head"><p class="ch-kicker">${esc(course.code)}</p><h1 class="ch-title">Every labelled result</h1></header>
<p>Numbers match the lecture notes. Items marked “site” were added here and have no number in the notes.</p>
${chapters.map((c) => `<h2>${c.number}. ${esc(c.title)}</h2><ol class="results-list">${[...R.items.values()].filter((i) => i.chapter === c.id && !['term', 'section', 'figure'].includes(i.kind)).sort((a, b) => a.order - b.order).map((i) => `<li><a class="xref" data-ref="${i.id}" href="${i.url}">${esc(labelOf(i))}</a>${i.titleHtml && i.number ? ` <span class="item-title">${i.titleHtml}</span>` : ''}${i.notes ? ` <span class="notes-ref">notes p.${i.page}</span>` : ''}</li>`).join('')}</ol>`).join('')}
</article>`;
  return resolve(shell({ title: `Results · ${course.short}`, course, crumbs: [{ text: esc(course.short), href: `/${course.id}/` }, { text: 'Results' }], body, bodyClass: 'page-ref' }), R, course, data.prompts);
}

function indexJson(course, data) {
  const { R } = data;
  const strip = (h) => (h || '').replace(/<span class="sn"[\s\S]*?<\/span><\/span>/g, '').replace(/<footer class="backlinks"[\s\S]*?<\/footer>/g, '');
  const out = {};
  for (const it of R.items.values()) {
    let statement = it.statementHtml;
    if (it.kind === 'term') {
      const parent = R.items.get(it.parent);
      statement = parent ? parent.statementHtml : '';
    }
    out[it.id] = {
      id: it.id, kind: it.kind, label: labelOf(it), number: it.number || null, title: it.titleHtml || '', notes: it.notes || null, page: it.page || null,
      url: it.url, order: it.order === Infinity ? null : it.order, chapter: it.chapterNumber ? `${it.chapterNumber}. ${it.chapterTitle}` : (it.sheetNumber ? `Sheet ${it.sheetNumber}` : null),
      statement: resolve(strip(statement), R, course, data.prompts), proof: it.proofHtml ? resolve(strip(it.proofHtml), R, course, data.prompts) : null,
      parent: it.parent || it.partOf || null, uses: it.uses || [], usedBy: [...(it.usedBy || [])],
    };
  }
  return out;
}

function searchJson(course, data) {
  const { R } = data;
  const text = (h) => (h || '').replace(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g, ' $1 ').replace(/<span class="katex-html"[\s\S]*?<\/span><\/span><\/span>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  return [...R.items.values()].map((it) => ({ id: it.id, label: labelOf(it), kind: it.kind, url: it.url, title: texToPlain(it.title || it.term || ''), text: text(it.statementHtml).slice(0, 600) }));
}

function hubPage(courses) {
  const body = `<article class="hub">
<header class="hub-head"><p class="ch-kicker">Oxford · Mathematics and Computer Science · Part B</p><h1 class="hub-title">Part B, explained</h1>
<p class="hub-blurb">Each course follows its lecture notes chapter by chapter, with the notes’ numbering, linked results, small exercises and pointers to the problem sheets.</p></header>
<ol class="hub-courses">${courses.map(({ course, data }) => `<li class="hub-course" style="--c:${course.accent.light};--cd:${course.accent.dark}"><a href="/${course.id}/"><span class="hub-code">${esc(course.code)}</span><span class="hub-name">${esc(course.title)}</span><span class="hub-meta">${esc(course.term)} · ${data.chapters.length} of ${(course.manifest.chapters || []).filter((c) => c.in_scope).length} chapters written</span></a></li>`).join('')}</ol>
</article>`;
  return shell({ title: 'Part B, explained', course: null, body, bodyClass: 'page-hub' });
}

function page404() {
  const body = `<article class="p404"><p class="p404-num">404</p><h1>No such page</h1>
<p>Either the link is wrong or this chapter hasn’t been written yet. The set of pages you were looking for is non-empty but has measure zero.</p>
<p><a href="/">Back to the list of courses</a></p></article>`;
  return shell({ title: 'Not found', course: null, body, bodyClass: 'page-404' });
}

function llmsTxt(courses) {
  const rules = fs.readFileSync(path.join(ROOT, 'shared', 'ai-rules.md'), 'utf8');
  const structure = courses.map(({ course, data }) => `## ${course.title} (${course.code})\n\nCourse page: /${course.id}/\nNotation: /${course.id}/notation.html\nMachine-readable index of every labelled item: /${course.id}/index.json\n\n${data.chapters.map((c) => `- Chapter ${c.number}: ${c.title} (${c.url})\n${c.sections.map((s) => `  - ${s.number} ${s.title} (${c.url}#${s.id})`).join('\n')}`).join('\n')}\n\nProblem sheets:\n${data.sheets.map((s) => `- Sheet ${s.number}: ${s.url}`).join('\n')}`).join('\n\n');
  return `# Part B explainers\n\n> Study site for Oxford Part B Mathematics and Computer Science courses, built from the lecture notes.\n\n${rules}\n\n# Course structure\n\n${structure}\n`;
}

// ---------------------------------------------------------------- main
function main() {
  const t0 = Date.now();
  rmrf(DIST);
  mkdirp(DIST);
  const courseIds = yaml.load(fs.readFileSync(path.join(ROOT, 'courses', 'courses.yaml'), 'utf8')).courses;
  const courses = [];
  const errors = [], warnings = [];
  const aiRules = fs.readFileSync(path.join(ROOT, 'shared', 'ai-rules.md'), 'utf8');
  for (const id of courseIds) {
    const course = loadCourse(path.join(ROOT, 'courses', id));
    course.aiRules = aiRules;
    const data = renderCourse(course);
    const { R } = data;
    // Backlinks and reference checks.
    for (const r of R.refs) {
      const t = R.items.get(r.target);
      if (!t) { R.errors.push(`${r.file}: reference to unknown id "${r.target}"`); continue; }
      if (r.from && r.from !== r.target && !r.self) t.usedBy.add(r.from);
    }
    // explicit `uses` also produce backlinks
    for (const it of R.items.values()) for (const u of it.uses || []) {
      const t = R.items.get(u);
      if (!t) R.errors.push(`${it.id}: uses unknown id "${u}"`);
      else t.usedBy.add(it.id);
    }
    for (const ch of data.chapters) for (const s of ch.sections) s.weight = s.size.words + 28 * s.size.displays;
    courses.push({ course, data });
  }
  const maxWeight = Math.max(1, ...courses.flatMap(({ data }) => data.chapters.flatMap((c) => c.sections.map((s) => s.weight))));

  for (const { course, data } of courses) {
    const out = path.join(DIST, course.id);
    for (const ch of data.chapters) write(path.join(DIST, ch.url), chapterPage(course, data, ch, maxWeight));
    for (const sh of data.sheets) write(path.join(DIST, sh.url), sheetPage(course, data, sh));
    write(path.join(out, 'index.html'), coursePage(course, data, maxWeight));
    write(path.join(out, 'notation.html'), notationPage(course, data));
    write(path.join(out, 'results.html'), resultsPage(course, data));
    write(path.join(out, 'index.json'), JSON.stringify(indexJson(course, data)));
    write(path.join(out, 'search.json'), JSON.stringify(searchJson(course, data)));
    copyDir(path.join(course.dir, 'viz'), path.join(out, 'viz'));
    const res = runChecks({ ROOT, DIST, course, data });
    errors.push(...data.R.errors, ...res.errors);
    warnings.push(...data.R.warnings, ...res.warnings);
    console.log(`${course.short}: ${data.chapters.length} chapter(s), ${data.sheets.length} sheet(s), ${data.R.items.size} ids, ${data.R.mathCount} formulas`);
  }
  write(path.join(DIST, 'index.html'), hubPage(courses));
  write(path.join(DIST, '404.html'), page404());
  write(path.join(DIST, 'llms.txt'), llmsTxt(courses));
  write(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  // Assets
  copyDir(path.join(ROOT, 'shared', 'css'), path.join(DIST, 'assets', 'css'));
  copyDir(path.join(ROOT, 'shared', 'js'), path.join(DIST, 'assets', 'js'));
  copyDir(path.join(ROOT, 'shared', 'img'), path.join(DIST, 'assets'));
  copyDir(path.join(ROOT, 'shared', 'fonts'), path.join(DIST, 'assets', 'fonts'));
  const kd = path.join(ROOT, 'node_modules', 'katex', 'dist');
  write(path.join(DIST, 'assets', 'katex', 'katex.min.css'), fs.readFileSync(path.join(kd, 'katex.min.css')));
  copyDir(path.join(kd, 'fonts'), path.join(DIST, 'assets', 'katex', 'fonts'), (n) => n.endsWith('.woff2'));
  copyDir(path.join(kd, 'contrib'), path.join(DIST, 'assets', 'katex', 'contrib'), (n) => n === 'auto-render.mjs');
  write(path.join(DIST, 'assets', 'katex', 'katex.mjs'), fs.readFileSync(path.join(kd, 'katex.mjs')));

  // Post-build HTML checks across all pages
  const { postBuild } = runChecks;
  const post = postBuild(DIST);
  errors.push(...post.errors);
  warnings.push(...post.warnings);

  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);
  console.log(`Built in ${Date.now() - t0} ms: ${errors.length} error(s), ${warnings.length} warning(s).`);
  if (errors.length) process.exit(1);
}

main();
