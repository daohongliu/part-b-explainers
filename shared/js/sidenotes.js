// Sidenotes sit level with their reference in the right margin on wide screens and expand inline on tap elsewhere.
// The note element itself is moved between the text and the margin, so any toy mounted inside it survives.
export function initSidenotes() {
  const notes = [...document.querySelectorAll('.sn')];
  const margin = document.querySelector('.margin-notes');
  if (!notes.length || !margin) return;
  const wide = window.matchMedia('(min-width: 861px)');
  let wrappers = [];

  function place() {
    if (!wide.matches) return;
    const base = margin.getBoundingClientRect().top;
    let floor = -Infinity;
    for (const w of wrappers) {
      const mark = w._sn.querySelector('.sn-mark');
      const want = mark.getBoundingClientRect().top - base - 4;
      const top = Math.max(want, floor);
      w.style.top = `${top}px`;
      floor = top + w.offsetHeight + 12;
    }
  }

  function toMargin() {
    document.body.classList.add('has-margin');
    wrappers = notes.map((sn) => {
      const note = sn.querySelector('.sidenote') || sn._note;
      const w = document.createElement('div');
      w.className = 'margin-note';
      w._sn = sn;
      sn._note = note;
      sn._wrap = w;
      w.append(note);
      note.style.display = 'block';
      margin.append(w);
      w.addEventListener('mouseenter', () => sn.classList.add('hot'));
      w.addEventListener('mouseleave', () => sn.classList.remove('hot'));
      sn.querySelector('.sn-mark').addEventListener('mouseenter', () => w.classList.add('hot'));
      sn.querySelector('.sn-mark').addEventListener('mouseleave', () => w.classList.remove('hot'));
      return w;
    });
    place();
  }

  function toText() {
    document.body.classList.remove('has-margin');
    for (const sn of notes) {
      if (sn._note) { sn._note.style.display = ''; sn.append(sn._note); }
      sn._wrap?.remove();
    }
    wrappers = [];
  }

  const mode = () => (wide.matches ? toMargin() : toText());
  mode();
  wide.addEventListener('change', () => { toText(); mode(); });

  for (const sn of notes) {
    const btn = sn.querySelector('.sn-mark');
    btn.addEventListener('click', () => {
      if (wide.matches) return;
      const open = sn.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
  new ResizeObserver(schedule).observe(document.querySelector('.main'));
  window.addEventListener('resize', schedule);
  document.addEventListener('toggle', schedule, true);
  document.fonts?.ready.then(schedule);
  window.addEventListener('pbx:layout', schedule);
}
