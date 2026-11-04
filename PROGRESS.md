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
- [x] PMM Chapters 0–5 written, 30 figures, cross-references, wide-maths fixes, sections sidebar.
- [ ] build.py: multi-course main() (IN PROGRESS — helpers patched for difficulty/importance tags,
      named exercises `<pause n=...>`, `<sheet n= qs=>` prompts, `<qn n=>` sheet questions; main() removed, needs rewriting).
- [ ] features: detailed left TOC, section estimates, open-beside panel, notes (db + local), LLM block, course switcher.
- [ ] PMM sheets 1–4 + prompts in chapters; names on existing exercises; [dN iN] tags on headings.
- [ ] CLT Chapters 1–5 + figures + sheets 1–4 (PDFs in ~/Desktop/Part B/Computational Learning Theory).
- [ ] Publish artifact with capabilities {db:{rules:[{path:"notes",read:"owner",write:"owner"}]}, user:{}}.
