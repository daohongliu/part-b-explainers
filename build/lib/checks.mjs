// Build-time checks: coverage, forward references, sheet prompts, ratings, style lint, leftover TeX, links.
import fs from 'node:fs';
import path from 'node:path';

const KIND_ALIASES = { claim: 'claim', figure: 'figure' };

export function runChecks({ ROOT, course, data }) {
  const errors = [], warnings = [];
  const { R, chapters, sheets, prompts } = data;
  const items = [...R.items.values()];

  // 1. Coverage against the manifest, for chapters that have been written.
  const written = new Set(chapters.map((c) => String(c.number)));
  const manifest = course.manifest.items || [];
  let covered = 0, expected = 0;
  for (const m of manifest) {
    if (!written.has(String(m.chapter))) continue;
    expected++;
    const kind = KIND_ALIASES[m.kind] || m.kind;
    const hit = items.find((i) => i.notes === String(m.number) && (i.kind === kind || (kind === 'figure' && i.kind === 'figure')));
    if (hit) covered++;
    else errors.push(`coverage: ${m.kind} ${m.number} (notes p.${m.page}) is in the manifest but not on the site`);
  }
  for (const x of course.manifest.extra || []) {
    if (!written.has(String(x.chapter))) continue;
    expected++;
    if (R.items.has(x.id)) covered++;
    else errors.push(`coverage: unnumbered item "${x.what}" (notes p.${x.page}) expected with id ${x.id}`);
  }
  for (const i of items) {
    if (!i.notes || !written.has(String(i.chapterNumber))) continue;
    if (!manifest.some((m) => String(m.number) === i.notes)) warnings.push(`coverage: ${i.id} claims notes number ${i.notes}, which is not in the manifest`);
  }
  if (expected) console.log(`  coverage ${course.short}: ${covered}/${expected} manifest entries in written chapters`);

  // 2. Forward references.
  for (const r of R.refs) {
    const t = R.items.get(r.target);
    if (!t || r.pos === Infinity || r.inSheet || t.order === Infinity) continue;
    if (t.order > r.pos && !r.preview) errors.push(`${r.file}: forward reference to ${r.target} (defined later) without a preview marker [@>id]`);
  }
  // `uses` declarations must also point backwards.
  for (const i of items) {
    if (i.order === Infinity) continue;
    for (const u of i.uses || []) {
      const t = R.items.get(u);
      if (t && t.order !== Infinity && t.order > i.order) errors.push(`${i.id}: declares it uses ${u}, which comes later`);
    }
  }

  // 3. Sheet prompts: placed after everything the question uses, and every reachable question has one.
  const promptOf = new Map();
  for (const p of prompts) for (const q of p.qs) {
    const it = R.items.get(q);
    if (!it) { errors.push(`sheet prompt refers to unknown question ${q}`); continue; }
    if (promptOf.has(q)) errors.push(`question ${q} has two prompts`);
    promptOf.set(q, p);
    const needs = it.uses.map((u) => R.items.get(u)).filter(Boolean);
    for (const n of needs) if (n.order !== Infinity && n.order > p.pos) errors.push(`prompt for ${q} is placed before ${n.id}, which the question uses`);
    if (!needs.length && !it.pending) warnings.push(`question ${q} declares no uses; its prompt placement cannot be checked`);
    const latest = needs.reduce((a, n) => (n.order > (a?.order ?? -1) ? n : a), null);
    if (latest && latest.section && p.section && latest.section !== p.section) {
      const secs = chapters.flatMap((c) => c.sections.map((s) => s.id));
      if (secs.indexOf(p.section) > secs.indexOf(latest.section) + 0) warnings.push(`prompt for ${q} is in ${p.section} but everything it needs is ready by ${latest.id} in ${latest.section}`);
    }
  }
  const maxWrittenOrder = Math.max(0, ...chapters.map((c) => c.orderRange[1]));
  for (const sh of sheets) for (const q of sh.questions) {
    if (q.partOf || q.pending || promptOf.has(q.id)) continue;
    const needs = q.uses.map((u) => R.items.get(u));
    const ready = needs.length && needs.every((n) => n && n.order <= maxWrittenOrder);
    if (ready) errors.push(`question ${q.id} only needs written material but has no sheet prompt`);
  }

  // 4. Ratings must vary within a chapter.
  for (const c of chapters) {
    if (c.sections.length < 3) continue;
    for (const key of ['difficulty', 'importance']) {
      const vals = new Set(c.sections.map((s) => s[key]));
      if (vals.size === 1) errors.push(`chapter ${c.number}: every section has the same ${key}`);
      if (c.sections.some((s) => !s[key])) errors.push(`chapter ${c.number}: a section is missing its ${key}`);
    }
  }

  // 5. Style lint on the sources.
  const banned = fs.readFileSync(path.join(ROOT, 'build', 'banned-phrases.txt'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const files = [...course.chapterFiles.map((f) => path.join(course.dir, 'source', f))];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, (m) => '\n'.repeat(m.split('\n').length - 1)).replace(/\$\$[\s\S]+?\$\$/g, ' ').replace(/\$[^$\n]+\$/g, ' ');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      for (const b of banned) {
        const re = new RegExp(`(^|[^\\w])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w])`, 'i');
        if (re.test(line)) errors.push(`${path.relative(ROOT, f)}:${i + 1}: banned phrase "${b}"`);
      }
    });
    for (const para of src.split(/\n\s*\n/)) {
      const n = (para.match(/—|(?<!-)---(?!-)/g) || []).length;
      if (n > 1) warnings.push(`${path.relative(ROOT, f)}: paragraph with ${n} em dashes: "${para.trim().slice(0, 60)}…"`);
    }
  }
  return { errors, warnings };
}

// Checks over the built HTML: leftover TeX and broken internal links.
runChecks.postBuild = function postBuild(DIST) {
  const errors = [], warnings = [];
  const pages = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p); } else if (p.endsWith('.html')) pages.push(p); } };
  walk(DIST);
  const ids = new Map();
  for (const p of pages) {
    const html = fs.readFileSync(p, 'utf8');
    ids.set('/' + path.relative(DIST, p), new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  for (const p of pages) {
    const url = '/' + path.relative(DIST, p);
    const html = fs.readFileSync(p, 'utf8');
    // leftover TeX
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<code[\s\S]*?<\/code>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '')
      .replace(/<span class="katex-mathml">[\s\S]*?<\/math><\/span>/g, '')
      .replace(/<details class="ai-note"[\s\S]*?<\/details>/g, '')
      .replace(/<[^>]+>/g, ' ');
    const m = text.match(/\$[^\s]|\\[a-zA-Z]{2,}|\\begin\{|⟦[^⟧]*⟧/);
    if (m) errors.push(`${url}: leftover TeX or placeholder near "${text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')}"`);
    if (html.includes('math-error')) errors.push(`${url}: contains a maths rendering error`);
    // links
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(href) || href.startsWith('/assets/') || href === '/llms.txt') continue;
      if (href === '#missing') { errors.push(`${url}: unresolved reference`); continue; }
      const [pth, hash] = href.split('#');
      let target = pth ? pth : url;
      if (target.endsWith('/')) target += 'index.html';
      if (!ids.has(target)) { errors.push(`${url}: broken link ${href}`); continue; }
      if (hash && !ids.get(target).has(hash)) errors.push(`${url}: broken anchor ${href}`);
    }
  }
  return { errors, warnings };
};
