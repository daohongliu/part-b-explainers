# Progress / handoff

Branch `illustrated` replaces the earlier explainer build with the illustrated version David preferred
(published so far as a claude.ai artifact: https://claude.ai/artifact/8fUSQZVyo5a4ii591VfEvY).
The spec David wants is in his message of 2026-11-04 (left TOC, section estimates, named exercises,
problem sheets with "now do question N" prompts, open-beside panel, private notes, LLM guidance,
per-course style variation, three.js where apt). Scope agreed: PMM Chapters 0–5 only (skip 6–7 for now),
Computational Learning Theory Chapters 1–5 (up to and including cryptographic hardness).
Everything ships as ONE artifact (both courses), notes stored in the artifact's `db`
(rules: owner-only), with a localStorage fallback when the db is unavailable (e.g. served from the repo).

## Layout
- `build/build.py` — builds `dist/index.html` from course sources (python3, no deps).
- `build/templates/` — head (CSS, MathJax config), shell, templates.
- `shared/js/core.js` — drawing helpers, router, xref previews, back button, TOC sidebar.
- `courses/<id>/src/chN.src`, `sheetN.src` — chapter/sheet sources (compact markup, see build.py docstring).
- `courses/<id>/inc/*.html` — figure markup included with `@@name@@`.
- `courses/<id>/js/chN.js` — figure code, registered with `reg('<view id>', name, fn)`.
- `dist/index.html` — last good build (currently the PMM 0–5 artifact as published, version 5).

## Status
- [x] PMM Chapters 0–5 written, 30 figures, cross-references, wide-maths fixes.
- [x] build.py multi-course (`courses/<id>/course.json`; CLT ids prefixed `clt-`), hub view `#contents`, course homes `#pmm`/`#clt`.
- [x] features.js: left contents sidebar with progress + minutes left (permanent ≥1300px), section estimates
      (`## Title {page} [dN iN]` → difficulty/importance), beside panel (⇥ on hover cards), private notes
      (select text or double-click a formula → ✎ note; db `notes` owner-only, localStorage fallback; drawer with export .md), LLM note per view.
- [x] PMM sheets 1–4 transcribed (`courses/pmm/src/sheetN.src`, `<qn n= t=>`), prompts `<sheet n= qs=>` in chapters,
      all exercises named, new fun exercises in ch0, ch2, ch3, ch4, ch5.
- [x] CLT Chapters 1–5 with 12 figures (Fig 3.3 uses three.js r128, loaded lazily), sheets 1–4 with the official hints folded, prompts in chapters.
- [x] Published as version 6 of https://claude.ai/artifact/8fUSQZVyo5a4ii591VfEvY with capabilities
      {db:{rules:[{path:"notes",read:"owner",write:"owner"}]}, downloads:true}; db checked (empty `notes`).

## Ideas not done yet
- PMM Chapters 6–7 (martingales, applications); CLT Chapters 6–9.
- An independent read-through of the CLT chapters for maths slips (the PMM chapters had one).
- Mobile check of every figure at 390px.

## Testing
`node <scratchpad>/t3.js "" view1,view2 [notes]` (run from the scratchpad dir) screenshots desk 1440 and phone 390.
