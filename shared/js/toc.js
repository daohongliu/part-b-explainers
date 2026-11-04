// Contents: highlight the current section and item, fill the progress line, open as a drawer on small screens.
import { store, course } from './util.js';

export function initToc() {
  const toc = document.getElementById('toc');
  document.querySelectorAll('[data-action="toc"]').forEach((b) => b.addEventListener('click', () => toc?.classList.toggle('open')));
  if (!toc) return;
  toc.addEventListener('click', (e) => { if (e.target.closest('a') && window.innerWidth <= 1120) toc.classList.remove('open'); });
  const article = document.querySelector('article.chapter');
  if (!article) return;
  const chapter = article.dataset.chapter;
  const secs = [...article.querySelectorAll('section.sec')];
  const tocSecs = new Map([...toc.querySelectorAll('.toc-sec')].map((li) => [li.dataset.sec, li]));
  const itemLinks = new Map([...toc.querySelectorAll('.toc-items a')].map((a) => [a.getAttribute('href').slice(1), a.parentElement]));
  const bar = toc.querySelector('.toc-progress span');
  const readKey = `read:${course}:${chapter}`;
  const read = new Set(store.get(readKey, []));
  read.forEach((id) => tocSecs.get(id)?.classList.add('read'));

  let ticking = false;
  function update() {
    ticking = false;
    const mid = window.innerHeight * 0.35;
    let active = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top < mid) active = s;
    for (const [id, li] of tocSecs) li.classList.toggle('active', active && id === active.id);
    // current item
    let cur = null;
    for (const [id, li] of itemLinks) {
      const t = document.getElementById(id);
      li.classList.remove('current');
      if (t && t.getBoundingClientRect().top < mid) cur = li;
    }
    cur?.classList.add('current');
    // progress through the chapter
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const frac = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, total)));
    if (bar) bar.style.height = `${frac * 100}%`;
    const best = Math.max(frac, store.get(`progress:${course}:${chapter}`, 0));
    store.set(`progress:${course}:${chapter}`, best);
    // a section counts as read once its end has scrolled above the middle of the screen
    for (const s of secs) {
      if (!read.has(s.id) && s.getBoundingClientRect().bottom < mid) {
        read.add(s.id);
        tocSecs.get(s.id)?.classList.add('read');
        store.set(readKey, [...read]);
      }
    }
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  window.pbxSections = secs;
}
