import { store } from './util.js';

export function initTheme() {
  const root = document.documentElement;
  const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = () => root.dataset.theme || (systemDark() ? 'dark' : 'light');
  const toggle = () => {
    const next = effective() === 'dark' ? 'light' : 'dark';
    // If the choice matches the system, forget it so the page follows the system again.
    if ((next === 'dark') === systemDark()) { delete root.dataset.theme; store.set('theme', null); try { localStorage.removeItem('pbx:theme'); } catch {} }
    else { root.dataset.theme = next; try { localStorage.setItem('pbx:theme', next); } catch {} }
    window.dispatchEvent(new CustomEvent('pbx:theme'));
  };
  document.querySelectorAll('[data-action="theme"]').forEach((b) => b.addEventListener('click', toggle));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => window.dispatchEvent(new CustomEvent('pbx:theme')));
  window.pbxToggleTheme = toggle;
}
