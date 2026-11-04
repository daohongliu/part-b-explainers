// Loads each visualisation module when it scrolls near. A module at /<course>/viz/<name>.js exports
// mount(container, ctx) and may return { destroy, retheme }. ctx gives theme colours and a KaTeX renderer.
import { course, reducedMotion } from './util.js';

let katexMod = null;
async function katex() {
  katexMod ||= (await import('/assets/katex/katex.mjs')).default;
  return katexMod;
}

export function colours() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return { paper: v('--paper'), paper2: v('--paper-2'), card: v('--card'), ink: v('--ink'), ink2: v('--ink-2'), ink3: v('--ink-3'), rule: v('--rule'), rule2: v('--rule-2'), accent: v('--accent'), accentSoft: v('--accent-soft'), c1: v('--c1'), c2: v('--c2'), c3: v('--c3'), c4: v('--c4'), hl: v('--hl') };
}

async function mountOne(fig) {
  if (fig.dataset.vizState) return;
  fig.dataset.vizState = 'loading';
  const name = fig.dataset.viz;
  const host = fig.querySelector('.viz-mount');
  try {
    const mod = await import(`/${course}/viz/${name}.js`);
    const k = await katex();
    const tex = (src, display = false) => k.renderToString(src, { displayMode: display, throwOnError: false });
    host.innerHTML = '';
    const ctx = { colours, tex, reducedMotion: reducedMotion(), onTheme: (fn) => window.addEventListener('pbx:theme', () => requestAnimationFrame(fn)) };
    await mod.mount(host, ctx);
    host.removeAttribute('aria-hidden');
    fig.dataset.vizState = 'mounted';
    window.dispatchEvent(new CustomEvent('pbx:layout'));
  } catch (e) {
    console.error(`[pbx] viz ${name} failed`, e);
    fig.dataset.vizState = `error: ${e.message}`;
    host.innerHTML = '<div class="viz-loading">This figure could not load. Its description is below for screen readers and in the caption.</div>';
  }
}

export function initViz() {
  const figs = [...document.querySelectorAll('[data-viz]')];
  if (!figs.length) return;
  if (!('IntersectionObserver' in window)) { figs.forEach(mountOne); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); mountOne(e.target); }
  }, { rootMargin: '400px 0px' });
  figs.forEach((f) => io.observe(f));
  // Fallback for throttled or background tabs, where IntersectionObserver may not fire: poll the viewport.
  const near = (f) => { const r = f.getBoundingClientRect(); return r.bottom > -400 && r.top < window.innerHeight + 400; };
  setInterval(() => figs.forEach((f) => { if (!f.dataset.vizState && near(f)) mountOne(f); }), 1500);
  window.addEventListener('beforeprint', () => figs.forEach(mountOne));
}
