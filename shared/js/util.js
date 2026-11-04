// Shared helpers: storage that never throws, the course index, small DOM utilities.
export const course = document.documentElement.dataset.course;

export const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(`pbx:${key}`); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(`pbx:${key}`, JSON.stringify(value)); } catch { /* private mode */ } },
};

let indexPromise = null;
export function loadIndex() {
  if (!course || course === 'hub') return Promise.resolve({});
  indexPromise ||= fetch(`/${course}/index.json`).then((r) => r.json()).catch(() => ({}));
  return indexPromise;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => window.matchMedia('(hover: none)').matches;

export function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}

export function toast(msg, ms = 3200) {
  const t = el('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

// Current reading position, as the order of the last labelled item above the middle of the viewport.
export function currentOrder() {
  const mid = window.innerHeight * 0.4;
  let best = 0;
  for (const e of document.querySelectorAll('[data-order]')) {
    if (e.getBoundingClientRect().top < mid) best = Math.max(best, +e.dataset.order);
  }
  return best;
}
