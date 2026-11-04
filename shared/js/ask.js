// "Ask Claude" on text selection: copy a ready-made prompt (selection with LaTeX source, location, results in scope,
// house rules) and open claude.ai. Long prompts are only copied; short ones are also passed as ?q= to pre-fill the chat.
import { el, toast, course, loadIndex } from './util.js';

const URL_LIMIT = 6000;

// Text of a DOM fragment with every KaTeX formula replaced by its TeX source in $...$ or $$...$$.
function fragmentToText(frag) {
  frag.querySelectorAll('.katex-display, .katex').forEach((k) => {
    if (!k.isConnected && !frag.contains(k)) return;
    const ann = k.querySelector('annotation[encoding="application/x-tex"]');
    const display = k.classList.contains('katex-display');
    if (ann) k.replaceWith(document.createTextNode(display ? `\n$$${ann.textContent.trim()}$$\n` : `$${ann.textContent.trim()}$`));
  });
  frag.querySelectorAll('.sn-mark, .pin-btn, .backlinks').forEach((n) => n.remove());
  return frag.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function selectionText(sel) {
  const range = sel.getRangeAt(0).cloneRange();
  // If the selection starts or ends inside a formula, widen it to the whole formula.
  const widen = (node, start) => {
    const k = (node.nodeType === 1 ? node : node.parentElement)?.closest('.katex-display, .katex');
    if (k) start ? range.setStartBefore(k) : range.setEndAfter(k);
  };
  widen(range.startContainer, true);
  widen(range.endContainer, false);
  const div = document.createElement('div');
  div.append(range.cloneContents());
  return fragmentToText(div);
}

async function buildPrompt(sel) {
  const text = selectionText(sel);
  const node = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
  const section = node?.closest('section.sec');
  const item = node?.closest('.item, .exercise, .question, .viz');
  const index = await loadIndex();
  const itemLabel = item ? index[item.id]?.label : null;
  const avail = (section?.dataset.availableResults || '').split(' ').filter(Boolean).map((id) => index[id]?.label).filter(Boolean);
  const ctx = JSON.parse(document.getElementById('ai-context')?.textContent || '{}');
  const pageTitle = document.title;
  const secTitle = section ? `${section.dataset.secNumber} ${section.querySelector('.sec-title')?.textContent.replace(/^\S+\s*/, '').trim()}` : null;
  const lines = [
    `I'm working through ${ctx.course?.title || 'a course'} (${ctx.course?.code || ''}) on my study site and don't understand this passage.`,
    '',
    `Page: ${pageTitle} (${location.href.split('#')[0]})`,
    secTitle ? `Section: ${secTitle}` : null,
    itemLabel ? `Inside: ${itemLabel}` : null,
    '',
    'The passage (maths as LaTeX):',
    '"""',
    text,
    '"""',
    '',
    avail.length ? `Results available at this point: ${avail.join(', ')}.` : null,
    '',
    'Please explain it, following these rules:',
    '- Use the course notation and conventions as in the passage.',
    '- Only use results that come before this point (listed above). If a clear explanation needs later material, say so and keep it brief.',
    '- Cite results by their labels above.',
    "- If this is a problem sheet question, don't solve it; give hints or explain the ideas only.",
    '- Write plainly, step by step, justifying each step. No headline-style sentences or bold lead-ins.',
    '- Write maths with $...$ inline and $$...$$ for displays.',
  ].filter((l) => l !== null);
  return lines.join('\n');
}

export function initAsk() {
  if (!course || course === 'hub') return;
  let btn = null;
  const hide = () => { btn?.remove(); btn = null; };
  document.addEventListener('mouseup', (e) => {
    if (e.target.closest('.ask-btn')) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length < 2) { hide(); return; }
      const anchor = sel.anchorNode?.parentElement;
      if (!anchor?.closest('.main, .panel, .popup') || anchor.closest('input, textarea, .search')) { hide(); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      hide();
      btn = el('button', { class: 'ask-btn', type: 'button' }, 'Ask Claude');
      btn.style.left = `${Math.max(8, r.left + window.scrollX + r.width / 2 - 45)}px`;
      btn.style.top = `${r.bottom + window.scrollY + 8}px`;
      btn.addEventListener('mousedown', (ev) => ev.preventDefault());
      btn.addEventListener('click', async () => {
        const prompt = await buildPrompt(sel);
        let copied = false;
        try { await navigator.clipboard.writeText(prompt); copied = true; } catch { /* clipboard blocked */ }
        const url = prompt.length < URL_LIMIT ? `https://claude.ai/new?q=${encodeURIComponent(prompt)}` : 'https://claude.ai/new';
        window.open(url, '_blank', 'noopener');
        toast(copied ? 'Prompt copied. If the new chat is empty, paste it in.' : 'Could not copy automatically. The prompt is in the console.');
        if (!copied) console.log(prompt);
        hide();
      });
      document.body.append(btn);
    }, 10);
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('.ask-btn')) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
}
