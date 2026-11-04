# Part B explainers

Study sites for Oxford Part B courses, built from the lecture notes. Each course follows its notes chapter by chapter and keeps the lecturer's numbering. It adds linked results with hover previews, a pinned-items panel, small exercises with answers, and pointers to the problem sheets.

Status: design system plus one sample chapter (PMM Chapter 1 and Sheet 1), waiting for review before the rest is written.

## Build and serve

Needs Node 20 or later.

```bash
npm install
```

```bash
npm run serve
```

This builds `dist/` and serves it at <http://localhost:4321/>. Use `npm run dev` to rebuild whenever a file under `courses/`, `shared/` or `build/` changes (reload the page by hand), and `npm run build` to build without serving.

The site has to be served over http rather than opened as files. The course index is fetched as JSON, and Claude in Chrome or the desktop app's browser can then read the pages.

## What the build checks

The build exits with an error if any of these fail:

- every formula renders in KaTeX, and the built HTML has no leftover TeX or placeholders;
- every reference resolves, and no reference points forward unless it is written as a preview (`[@>id]`);
- every numbered item in `manifest.yaml` for a written chapter is on the site (coverage);
- every sheet prompt comes after everything its question `uses`, and every question whose material is written has a prompt;
- no chapter rates every section the same for difficulty or importance;
- no banned phrase from `build/banned-phrases.txt` appears in a chapter source (more than one em dash in a paragraph is a warning);
- no internal link or anchor is broken.

## Layout

```
courses/courses.yaml          course ids in hub order
courses/<id>/course.yaml      title, lecturer, accent colours
courses/<id>/macros.json      KaTeX macros, so each object is always typeset the same way
courses/<id>/manifest.yaml    every numbered item in the notes, with page; the coverage check reads it
courses/<id>/notation.yaml    the notation index
courses/<id>/source/*.md      chapters
courses/<id>/sheets/*.md      problem sheets
courses/<id>/viz/*.js         visualisations, one module each, loaded when scrolled near
shared/css, shared/js         the design system and front-end modules (no framework)
shared/ai-rules.md            house rules for AI assistants (llms.txt and each page's note)
build/                        build script, checks, static server
```

The lecture-note PDFs are not in the repository (`*.pdf` is ignored).

## Writing a chapter

A chapter is Markdown with front matter and colon-fenced directives. Maths is `$...$` and `$$...$$`.

```markdown
---
id: ch2
number: 2
slug: integration
title: Integration
notes_pages: 14–22
---

Intro paragraph (gets the drop cap).

## Section title {#ch2-s-measurable difficulty=2 importance=core dnote="one-line reason" inote="one-line reason"}

:::definition{#ch2-def-measurable notes="2.1" page=14 title="Measurable function"}
Statement, with a defined term written [[measurable|t-measurable]].
:::

:::theorem{#ch2-thm-mct notes="2.13" page=17 title="Monotone Convergence Theorem"}
Statement.
:::

:::idea
The idea of the proof in a paragraph.
:::

:::proof
Proof. Cite results as [@ch1-lem-monotone], or with custom text as [this lemma](@ch1-lem-monotone).
A sidenote goes in the margin.^[Like this.] A tiny toy in the margin: ^[viz:name|caption].
:::

:::exercise{#ch2-ex-something title="Short title" uses="ch2-def-measurable"}
Question.
:::hint
Optional hint.
:::
:::answer
Full answer with reasoning.
:::
:::

:::sheet-prompt{q="sheet2-a1 sheet2-b3"}
:::

:::viz{#ch2-fig-name src=module-name title="Title" caption="What it shows and what to try."}
Text description for screen readers.
:::
```

Other blocks: `lemma`, `proposition`, `corollary`, `example`, `nonexample`, `remark`, `notation`, `claim`, `algorithm`, `aside` (collapsed, non-examinable material added by the site), `nonexaminable` (material the notes mark as non-examinable), `flag` (where the site departs from the notes), `preview` (a marked look ahead), `epigraph`. An item with `notes="x.y"` is shown under that number. An item without it is shown as added by the site. Nest directives by closing each inner one with its own `:::`. To nest a directive of the same kind, use more colons on the outer fence.

IDs never change once published. Display numbers come from the notes.

A sheet question is `::::question{#sheet1-b2 label="B2" uses="ch1-def-borel ch1-ex-pi-r"}`, with parts as `:::part{#sheet1-a1a label="(a)"}`. Add `pending="what it needs"` when the material it needs isn't written yet. Sheets never get solutions.

A visualisation module exports `mount(host, ctx)`. `ctx.colours()` returns the current theme colours, `ctx.tex(src)` renders KaTeX and `ctx.onTheme(fn)` redraws when the theme changes. Helpers for SVG, hand-drawn strokes and dragging are in `shared/js/viz-kit.js`.

## Adding a course

Create `courses/<id>/` with `course.yaml`, `macros.json`, `notation.yaml`, `manifest.yaml`, `source/`, `sheets/` and `viz/`, then add the id to `courses/courses.yaml`. The hub, course page, notation index, results index, search index, `llms.txt` entry and coverage report follow from those files.

## AI assistants

Claude in Chrome and the desktop app's browser can read a served page directly. Each page carries the house rules in a collapsed "Note for AI assistants" at the end, plus a machine-readable `<script id="ai-context">` (results in scope per section, course macros). `/llms.txt` has the rules and the course structure.

## Keyboard

`/` search · `j`/`k` next/previous section · `p` pinned items · `t` light/dark · `Alt+←` return after a jump · `?` help · `Esc` close.

Reading progress, pinned items, finished exercises and ticked sheet questions are stored in the browser's localStorage.
