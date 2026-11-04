// Turns parsed source into HTML. One Renderer per course; it owns the item registry,
// the reading-order counter and the list of references to resolve once everything is known.
import MarkdownIt from 'markdown-it';
import katex from 'katex';
import { parseBlocks, parseAttrs } from './parse.mjs';

export const THEOREM_KINDS = {
  definition: 'Definition', theorem: 'Theorem', lemma: 'Lemma', proposition: 'Proposition',
  corollary: 'Corollary', example: 'Example', remark: 'Remark', notation: 'Notation', claim: 'Claim',
  algorithm: 'Algorithm', fact: 'Fact', convention: 'Convention', nonexample: 'Non-example',
};
const STATEMENT_KINDS = new Set(['theorem', 'lemma', 'proposition', 'corollary', 'claim', 'fact']);

const PLAIN = { '\\sigma': 'σ', '\\pi': 'π', '\\Omega': 'Ω', '\\mu': 'µ', '\\lambda': 'λ', '\\delta': 'δ', '\\varepsilon': 'ε', '\\eps': 'ε', '\\gamma': 'γ', '\\R': 'ℝ', '\\N': 'ℕ', '\\infty': '∞' };
export function texToPlain(src) {
  let s = String(src);
  for (const [k, v] of Object.entries(PLAIN)) s = s.split(k).join(v);
  return s.replace(/\\(mathscr|mathcal|mathbb|mathrm|operatorname)\{([^}]*)\}/g, '$2').replace(/\\[a-zA-Z]+/g, '').replace(/[{}$]/g, '').trim();
}

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class Renderer {
  constructor(course) {
    this.course = course;
    this.items = new Map(); // id -> item
    this.refs = []; // {target, pos, from, preview, file}
    this.order = 0; // reading-order counter (increments per labelled item)
    this.errors = [];
    this.warnings = [];
    this.mathCount = 0;
    this.sidenoteCount = 0;
    this.exerciseCount = 0;
    this.ctx = {}; // current chapter/section/item while rendering
    this.md = new MarkdownIt({ html: true, typographer: true, linkify: false });
    this.md.disable(['code']); // indented code blocks would swallow indented prose inside directives
    this.installLinkRule();
  }

  err(msg) { this.errors.push(`${this.ctx.file || ''}: ${msg}`); }
  warn(msg) { this.warnings.push(`${this.ctx.file || ''}: ${msg}`); }

  // ---------- maths ----------
  tex(src, display) {
    this.mathCount++;
    try {
      const html = katex.renderToString(src, {
        displayMode: display, throwOnError: true, strict: false, trust: true,
        macros: { ...this.course.macros }, output: 'htmlAndMathml',
      });
      return display ? `<span class="math-display" tabindex="0">${html}</span>` : `<span class="math-inline">${html}</span>`;
    } catch (e) {
      this.err(`KaTeX error in ${display ? 'display' : 'inline'} maths "${src.slice(0, 80)}": ${e.message}`);
      return '<span class="math-error">[maths failed to render]</span>';
    }
  }

  // Replaces $$..$$ and $..$ with placeholders, returning [text, restore].
  protectMath(text) {
    const store = [];
    this._mathSrc = this._mathSrc || [];
    const srcs = [];
    const put = (html, src) => { store.push(html); srcs.push(src); return `⟦m${store.length - 1}⟧`; };
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => put(this.tex(t.trim(), true), t));
    text = text.replace(/(^|[^\\$])\$(?!\s)((?:[^$\\\n]|\\.)+?)\$/g, (_, pre, t) => pre + put(this.tex(t, false), t));
    this._restoreTerm = (raw) => ({ html: raw.replace(/⟦m(\d+)⟧/g, (_, i) => store[+i]), plain: raw.replace(/⟦m(\d+)⟧/g, (_, i) => texToPlain(srcs[+i])) });
    text = text.replace(/\\\$/g, '$');
    return [text, (html) => html.replace(/⟦m(\d+)⟧/g, (_, i) => store[+i])];
  }

  // ---------- inline syntax ----------
  // [@id] -> auto-labelled ref; [@>id] -> allowed forward ref (preview); [[term|t-id]] -> defined term;
  // ^[...] -> sidenote; ^[viz:name|caption] -> marginal toy.
  preInline(text) {
    text = text.replace(/\[@(>?)([\w:-]+)\]/g, (_, p, id) => `[@@](@${p}${id})`);
    text = text.replace(/\[\[([^\]|]+)\|([\w:-]+)\]\]/g, (_, t, id) => {
      this.registerTerm(id, t);
      return `<dfn class="term" id="${id}">${t}</dfn>`;
    });
    return text;
  }

  extractSidenotes(text) {
    const store = [];
    let out = '';
    let i = 0;
    while (i < text.length) {
      if (text[i] === '^' && text[i + 1] === '[') {
        let depth = 0, j = i + 1;
        for (; j < text.length; j++) {
          if (text[j] === '[') depth++;
          else if (text[j] === ']' && --depth === 0) break;
        }
        store.push(text.slice(i + 2, j));
        out += `⟦s${store.length - 1}⟧`;
        i = j + 1;
      } else out += text[i++];
    }
    return [out, store];
  }

  renderSidenote(content) {
    const n = ++this.sidenoteCount;
    const viz = content.match(/^viz:([\w-]+)\|([\s\S]*)$/);
    let body;
    if (viz) {
      this.ctx.vizUsed?.add(viz[1]);
      body = `<span class="viz viz-margin" data-viz="${viz[1]}"><span class="viz-mount"></span></span><span class="sn-caption">${this.md.renderInline(viz[2].trim())}</span>`;
    } else body = this.md.renderInline(content.trim());
    return `<span class="sn" data-sn="${n}"><button class="sn-mark" type="button" aria-label="Sidenote ${n}" aria-expanded="false">${n}</button><span class="sidenote" role="note"><span class="sn-num">${n}</span> ${body}</span></span>`;
  }

  installLinkRule() {
    const md = this.md;
    const self = this;
    const defaultOpen = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
    md.renderer.rules.link_open = (tokens, idx, opts, env, slf) => {
      const href = tokens[idx].attrGet('href') || '';
      if (href.startsWith('@')) {
        let id = decodeURIComponent(href.slice(1));
        const preview = id.startsWith('>');
        if (preview) id = id.slice(1);
        const r = { target: id, pos: self.order, from: self.ctx.itemId || self.ctx.sectionId, preview, file: self.ctx.file, inSheet: !!self.ctx.inSheet };
        self.refs.push(r);
        // If the link text is the auto marker, fill in the label later.
        const next = tokens[idx + 1];
        if (next && next.type === 'text' && next.content === '@@') next.content = `⟦label:${id}⟧`;
        return `<a class="xref${preview ? ' xref-preview' : ''}" data-ref="${id}" href="⟦href:${id}⟧">`;
      }
      tokens[idx].attrSet('class', 'ext');
      tokens[idx].attrSet('rel', 'noopener');
      return defaultOpen(tokens, idx, opts, env, slf);
    };
  }

  // Full pipeline for a chunk of Markdown: maths, sidenotes, refs, terms.
  mdBlock(text, inline = false) {
    const [t1, restoreMath] = this.protectMath(text);
    const [t2, notes] = this.extractSidenotes(this.preInline(t1));
    let html = inline ? this.md.renderInline(t2) : this.md.render(t2);
    html = html.replace(/⟦s(\d+)⟧/g, (_, i) => this.renderSidenote(this.preInline(notes[+i])));
    return restoreMath(html);
  }

  wordsOf(text) {
    return text.replace(/\$\$[\s\S]+?\$\$/g, ' ').replace(/\$[^$]+\$/g, ' x ').split(/\s+/).filter(Boolean).length;
  }
  displaysOf(text) { return (text.match(/\$\$/g) || []).length / 2; }

  // ---------- registry ----------
  registerItem(item) {
    if (this.items.has(item.id)) this.err(`duplicate id ${item.id}`);
    this.items.set(item.id, item);
    return item;
  }
  registerTerm(id, text) {
    if (this.items.has(id)) return; // terms may be re-marked; keep first
    const t = this._restoreTerm ? this._restoreTerm(text) : { html: text, plain: text };
    this.items.set(id, {
      id, kind: 'term', term: t.plain, termHtml: t.html, parent: this.ctx.itemId, order: this.order,
      chapter: this.ctx.chapter?.id, section: this.ctx.sectionId, url: `${this.ctx.pageUrl}#${id}`, usedBy: new Set(),
    });
  }

  // ---------- blocks ----------
  renderNodes(nodes) { return nodes.map((n) => this.renderNode(n)).join('\n'); }

  renderNode(node) {
    if (node.type === 'md') {
      this.ctx.size && (this.ctx.size.words += this.wordsOf(node.text) * (this.ctx.inProof ? 1.4 : 1), this.ctx.size.displays += this.displaysOf(node.text));
      return this.mdBlock(node.text);
    }
    const h = this[`dir_${node.name.replace(/-/g, '_')}`];
    if (THEOREM_KINDS[node.name]) return this.dirTheoremLike(node);
    if (!h) { this.err(`unknown directive :::${node.name} (line ${node.line})`); return ''; }
    return h.call(this, node);
  }

  dirTheoremLike(node) {
    const a = node.attrs;
    const kind = node.name;
    if (!a.id) this.err(`:::${kind} at line ${node.line} has no #id`);
    const order = ++this.order;
    const number = a.notes || a.number || null;
    const item = this.registerItem({
      id: a.id, kind, kindLabel: THEOREM_KINDS[kind], number, notes: a.notes || null, page: a.page ? +a.page : null,
      title: a.title || '', order, chapter: this.ctx.chapter.id, chapterNumber: this.ctx.chapter.number,
      chapterTitle: this.ctx.chapter.title, section: this.ctx.sectionId, url: `${this.ctx.pageUrl}#${a.id}`,
      uses: (a.uses || '').split(/[\s,]+/).filter(Boolean), usedBy: new Set(), nonExaminable: !!a.nonexaminable,
      site: !a.notes, toc: a.toc !== 'false' && (kind !== 'remark' && kind !== 'notation' || !!a.title),
    });
    const prev = this.ctx.itemId;
    this.ctx.itemId = a.id;
    const body = this.renderNodes(node.children);
    this.ctx.itemId = prev;
    item.statementHtml = body;
    item.titleHtml = a.title ? this.mdBlock(a.title, true) : '';
    this.ctx.lastItem = item;
    this.ctx.tocItems?.push(item);
    return this.itemShell(item, body);
  }

  itemHead(item) {
    const num = item.number ? ` ${esc(item.number)}` : '';
    const title = item.titleHtml ? ` <span class="item-title">(${item.titleHtml})</span>` : '';
    const notesTag = item.notes
      ? `<span class="notes-ref" title="Numbered ${esc(item.notes)} in the lecture notes${item.page ? `, page ${item.page}` : ''}">notes p.${item.page ?? '?'}</span>`
      : item.site && !['exercise'].includes(item.kind) ? `<span class="notes-ref site-added" title="Added on this site; not in the lecture notes">site</span>` : '';
    return `<header class="item-head"><a class="item-label" href="#${item.id}">${esc(item.kindLabel)}${num}</a>${title}${notesTag}<button class="pin-btn" type="button" data-pin="${item.id}" title="Pin to the side panel (p toggles the panel)" aria-label="Pin ${esc(item.kindLabel)}${num}">pin</button></header>`;
  }

  itemShell(item, body) {
    return `<section class="item item-${item.kind}${item.nonExaminable ? ' non-examinable' : ''}" id="${item.id}" data-order="${item.order}">
${this.itemHead(item)}
<div class="item-body">${body}</div>
<footer class="backlinks" data-backlinks="${item.id}">⟦backlinks:${item.id}⟧</footer>
</section>`;
  }

  dir_proof(node) {
    const a = node.attrs;
    const target = a.of ? this.items.get(a.of) : this.ctx.lastItem;
    if (!target) this.err(`:::proof at line ${node.line} has nothing to attach to`);
    const prev = this.ctx.itemId;
    this.ctx.itemId = target?.id;
    this.ctx.inProof = true;
    const body = this.renderNodes(node.children);
    this.ctx.inProof = false;
    this.ctx.itemId = prev;
    if (target) target.proofHtml = (target.proofHtml || '') + body;
    const label = a.title ? this.mdBlock(a.title, true) : `Proof${a.of && target ? ` of <a class="xref" data-ref="${target.id}" href="⟦href:${target.id}⟧">⟦label:${target.id}⟧</a>` : ''}`;
    if (a.of) this.refs.push({ target: a.of, pos: this.order, from: a.of, file: this.ctx.file, self: true });
    return `<details class="proof" open${target ? ` data-proof-of="${target.id}"` : ''}><summary><span class="proof-label">${label}</span><span class="proof-toggle" aria-hidden="true"></span></summary><div class="proof-body">${body}<span class="qed" aria-label="end of proof">∎</span></div></details>`;
  }

  dir_idea(node) {
    return `<div class="proof-idea"><span class="idea-label">The idea.</span> ${this.renderNodes(node.children).replace(/^<p>/, '').replace(/<\/p>\s*$/, '')}</div>`;
  }

  dir_aside(node) {
    const t = node.attrs.title ? this.mdBlock(node.attrs.title, true) : 'Aside';
    return `<details class="aside"><summary><span class="aside-label">Aside</span> ${node.attrs.title ? t : ''} <span class="ne-tag">non-examinable</span></summary><div class="aside-body">${this.renderNodes(node.children)}</div></details>`;
  }

  // Marks material the notes say is not examinable but which is part of the notes.
  dir_nonexaminable(node) {
    return `<div class="notes-ne"><div class="notes-ne-tag">Not examinable (as stated in the notes)</div>${this.renderNodes(node.children)}</div>`;
  }

  dir_flag(node) {
    return `<aside class="flag" role="note"><span class="flag-label">Note on the notes</span> ${this.renderNodes(node.children)}</aside>`;
  }

  dir_preview(node) {
    return `<aside class="preview" role="note"><span class="preview-label">Looking ahead</span> ${this.renderNodes(node.children)}</aside>`;
  }

  dir_exercise(node) {
    const a = node.attrs;
    const order = ++this.order;
    const n = `${this.ctx.chapter.number}.${++this.exerciseCount}`;
    const item = this.registerItem({
      id: a.id, kind: 'exercise', kindLabel: this.course.exerciseLabel || 'Exercise', number: n, title: a.title || '', order,
      chapter: this.ctx.chapter.id, chapterNumber: this.ctx.chapter.number, chapterTitle: this.ctx.chapter.title,
      section: this.ctx.sectionId, url: `${this.ctx.pageUrl}#${a.id}`, uses: (a.uses || '').split(/[\s,]+/).filter(Boolean),
      usedBy: new Set(), site: true, toc: true,
    });
    const prev = this.ctx.itemId;
    this.ctx.itemId = a.id;
    const q = this.renderNodes(node.children.filter((c) => !(c.type === 'dir' && ['hint', 'answer'].includes(c.name))));
    const hint = node.children.find((c) => c.type === 'dir' && c.name === 'hint');
    const ans = node.children.find((c) => c.type === 'dir' && c.name === 'answer');
    if (!ans) this.err(`exercise ${a.id} has no :::answer`);
    const hintHtml = hint ? `<details class="ex-hint"><summary>Hint</summary>${this.renderNodes(hint.children)}</details>` : '';
    const ansHtml = ans ? `<details class="ex-answer"><summary>Answer</summary>${this.renderNodes(ans.children)}</details>` : '';
    this.ctx.itemId = prev;
    item.statementHtml = q;
    item.titleHtml = this.mdBlock(a.title || '', true);
    this.ctx.tocItems?.push(item);
    return `<details class="exercise" id="${a.id}" data-order="${order}">
<summary><span class="ex-label">${esc(item.kindLabel)} ${n}</span><span class="ex-sep">·</span><span class="ex-title">${item.titleHtml}</span><label class="ex-done" title="Mark as done"><input type="checkbox" data-done="${a.id}"> done</label></summary>
<div class="ex-body">${q}<div class="ex-reveals">${hintHtml}${ansHtml}</div></div>
<footer class="backlinks" data-backlinks="${a.id}">⟦backlinks:${a.id}⟧</footer>
</details>`;
  }

  dir_sheet_prompt(node) {
    const qs = (node.attrs.q || '').split(/[\s,]+/).filter(Boolean);
    const id = node.attrs.id || `prompt-${qs.join('-')}`;
    const pos = this.order;
    this.ctx.prompts.push({ id, qs, pos, chapter: this.ctx.chapter.id, section: this.ctx.sectionId, url: `${this.ctx.pageUrl}#${id}` });
    for (const q of qs) this.refs.push({ target: q, pos: Infinity, from: this.ctx.sectionId, file: this.ctx.file, prompt: true });
    const extra = node.children.length ? `<div class="prompt-extra">${this.renderNodes(node.children)}</div>` : '';
    this.ctx.tocItems?.push({ id, kind: 'prompt', qs });
    return `<aside class="sheet-prompt" id="${id}" data-prompt="${qs.join(' ')}"><span class="prompt-mark" aria-hidden="true"></span><div><p class="prompt-text">⟦prompt:${qs.join(',')}⟧</p>${extra}</div></aside>`;
  }

  dir_viz(node) {
    const a = node.attrs;
    const id = a.id || `viz-${a.src}`;
    const order = ++this.order;
    this.ctx.vizUsed.add(a.src);
    const caption = a.caption ? this.mdBlock(a.caption, true) : '';
    const item = this.registerItem({
      id, kind: 'figure', kindLabel: 'Figure', number: a.number || null, title: a.title || '', order, chapter: this.ctx.chapter.id,
      chapterNumber: this.ctx.chapter.number, chapterTitle: this.ctx.chapter.title, section: this.ctx.sectionId,
      url: `${this.ctx.pageUrl}#${id}`, uses: [], usedBy: new Set(), site: true, toc: true, viz: true,
    });
    item.titleHtml = this.mdBlock(a.title || '', true);
    item.statementHtml = `<p>${caption}</p>`;
    this.ctx.tocItems?.push(item);
    const desc = this.renderNodes(node.children);
    return `<figure class="viz${a.wide ? ' viz-wide' : ''}" id="${id}" data-viz="${a.src}" data-order="${order}">
<div class="viz-mount" aria-hidden="true"><div class="viz-loading">Loading the figure…</div></div>
<div class="viz-desc sr-only">${desc}</div>
<figcaption><span class="fig-label">${a.title ? this.mdBlock(a.title, true) : 'Figure'}.</span> ${caption}</figcaption>
</figure>`;
  }

  // Static figure: inline SVG from the viz folder, or markdown body.
  dir_figure(node) {
    const a = node.attrs;
    const caption = a.caption ? this.mdBlock(a.caption, true) : '';
    return `<figure class="static-fig"${a.id ? ` id="${a.id}"` : ''}>${this.renderNodes(node.children)}<figcaption>${caption}</figcaption></figure>`;
  }

  dir_epigraph(node) {
    return `<blockquote class="epigraph">${this.renderNodes(node.children)}${node.attrs.by ? `<footer>${this.mdBlock(node.attrs.by, true)}</footer>` : ''}</blockquote>`;
  }

  dir_steps(node) { // aligned derivation helper: just a styled wrapper
    return `<div class="steps">${this.renderNodes(node.children)}</div>`;
  }

  // ---------- sheets ----------
  dir_question(node) {
    const a = node.attrs;
    const sheet = this.ctx.sheet;
    const item = this.registerItem({
      id: a.id, kind: 'question', kindLabel: `Sheet ${sheet.number}`, number: a.label, title: a.title || '', order: Infinity,
      sheet: sheet.id, sheetNumber: sheet.number, url: `${this.ctx.pageUrl}#${a.id}`, chapter: null,
      uses: (a.uses || '').split(/[\s,]+/).filter(Boolean), usedBy: new Set(), section: a.part ? null : this.ctx.sheetSection,
      handIn: this.ctx.sheetSection === 'B', partOf: this.ctx.parentQuestion || null, pending: a.pending || null,
    });
    const prevQ = this.ctx.parentQuestion;
    if (!item.partOf) this.ctx.parentQuestion = a.id;
    const prev = this.ctx.itemId;
    this.ctx.itemId = a.id;
    const body = this.renderNodes(node.children);
    this.ctx.itemId = prev;
    this.ctx.parentQuestion = prevQ;
    item.statementHtml = body;
    this.ctx.sheetQuestions.push(item);
    const usesHtml = item.uses.length ? `<p class="q-uses">Uses: ${item.uses.map((u) => { this.refs.push({ target: u, pos: Infinity, from: a.id, file: this.ctx.file }); return `<a class="xref" data-ref="${u}" href="⟦href:${u}⟧">⟦label:${u}⟧</a>`; }).join(', ')}</p>` : '';
    const tag = item.partOf ? 'div' : 'section';
    return `<${tag} class="question${item.partOf ? ' q-part' : ''}" id="${a.id}"><header class="q-head"><a class="q-label" href="#${a.id}">${esc(a.label)}</a>${a.title ? ` <span class="item-title">${this.mdBlock(a.title, true)}</span>` : ''}<span class="q-status" data-qstatus="${a.id}"></span><button class="pin-btn" type="button" data-pin="${a.id}">pin</button></header><div class="q-body">${body}</div>${usesHtml}<p class="q-prompt-back">⟦promptback:${a.id}⟧</p></${tag}>`;
  }

  dir_part(node) {
    return this.dir_question({ ...node, attrs: { ...node.attrs, part: true } });
  }

  dir_sheetsection(node) {
    this.ctx.sheetSection = node.attrs.letter;
    const out = `<section class="sheet-section" id="section-${node.attrs.letter}"><h2>${this.mdBlock(node.attrs.title || `Section ${node.attrs.letter}`, true)}</h2>${this.renderNodes(node.children)}</section>`;
    return out;
  }

  dir_footnote(node) {
    return `<aside class="sheet-footnote">${this.renderNodes(node.children)}</aside>`;
  }
}
