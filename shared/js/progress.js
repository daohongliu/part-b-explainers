// Local progress: exercises done, sheet prompts reached, questions ticked off, chapter percentages.
import { store, course } from './util.js';

export function initProgress() {
  if (!course || course === 'hub') return;
  // Exercises
  const done = new Set(store.get(`done:${course}`, []));
  document.querySelectorAll('input[data-done]').forEach((box) => {
    const id = box.dataset.done;
    const ex = box.closest('.exercise');
    box.checked = done.has(id);
    ex?.classList.toggle('done', box.checked);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      box.checked ? done.add(id) : done.delete(id);
      ex?.classList.toggle('done', box.checked);
      store.set(`done:${course}`, [...done]);
    });
  });
  // The label sits inside <summary>; keep clicks on it from toggling the exercise.
  document.querySelectorAll('.ex-done').forEach((l) => l.addEventListener('click', (e) => e.stopPropagation()));

  // Sheet prompts count as reached once they scroll into view.
  const seen = new Set(store.get(`prompts:${course}`, []));
  const prompts = document.querySelectorAll('.sheet-prompt');
  prompts.forEach((p) => p.classList.toggle('seen', seen.has(p.id)));
  if (prompts.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        seen.add(en.target.id);
        en.target.classList.add('seen');
        store.set(`prompts:${course}`, [...seen]);
        io.unobserve(en.target);
      }
    }, { rootMargin: '0px 0px -30% 0px' });
    prompts.forEach((p) => io.observe(p));
  }

  // Sheet pages: a done box per top-level question.
  const qdone = new Set(store.get(`qdone:${course}`, []));
  document.querySelectorAll('[data-qstatus]').forEach((slot) => {
    const id = slot.dataset.qstatus;
    if (slot.closest('.q-part')) return;
    slot.innerHTML = `<label class="q-done-label"><input type="checkbox" ${qdone.has(id) ? 'checked' : ''}> done</label>`;
    slot.querySelector('input').addEventListener('change', (e) => {
      e.target.checked ? qdone.add(id) : qdone.delete(id);
      store.set(`qdone:${course}`, [...qdone]);
    });
  });

  // Course page: tracker and chapter percentages.
  document.querySelectorAll('.tr-q').forEach((li) => {
    const unlocked = li.dataset.prompt && seen.has(li.dataset.prompt);
    li.classList.toggle('unlocked', !!unlocked);
    li.classList.toggle('done', qdone.has(li.dataset.q));
    li.querySelector('.tr-state').textContent = '';
    li.title = qdone.has(li.dataset.q) ? 'Done' : unlocked ? 'Ready: you have read everything it needs' : li.dataset.prompt ? 'Not reached yet' : 'Needs material not on the site yet';
  });
  document.querySelectorAll('[data-progress]').forEach((s) => {
    const p = store.get(`progress:${course}:${s.dataset.progress}`, 0);
    s.textContent = p > 0.01 ? `${Math.round(p * 100)}% read` : '';
  });
}
