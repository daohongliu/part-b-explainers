// Entry point for every page. Each feature is a small module; they share the course index via loadIndex().
import { initTheme } from './theme.js';
import { initSidenotes } from './sidenotes.js';
import { initPopups } from './popups.js';
import { initPanel } from './panel.js';
import { initNav } from './nav.js';
import { initToc } from './toc.js';
import { initSearch } from './search.js';
import { initKeys } from './keys.js';
import { initProgress } from './progress.js';
import { initViz } from './viz-loader.js';
import { initTips } from './tips.js';

const run = (name, fn) => { try { fn(); } catch (e) { console.error(`[pbx] ${name} failed`, e); } };

run('theme', initTheme);
run('nav', initNav);
run('toc', initToc);
run('sidenotes', initSidenotes);
run('popups', initPopups);
run('panel', initPanel);
run('search', initSearch);
run('keys', initKeys);
run('progress', initProgress);
run('viz', initViz);
run('tips', initTips);

// Print: expand proofs and asides, leave exercise answers closed.
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details.proof, details.aside, details.exercise').forEach((d) => { d.dataset.wasOpen = d.open; d.open = true; });
});
window.addEventListener('afterprint', () => {
  document.querySelectorAll('[data-was-open]').forEach((d) => { d.open = d.dataset.wasOpen === 'true'; delete d.dataset.wasOpen; });
});
