// Keyboard shortcuts: / search, j/k sections, p panel, t theme, ? help, Alt+← return, Esc close.
export function initKeys() {
  const help = document.getElementById('help');
  const toggleHelp = () => { help.hidden = !help.hidden; };
  document.querySelectorAll('[data-action="help"]').forEach((b) => b.addEventListener('click', toggleHelp));
  help?.addEventListener('click', (e) => { if (e.target === help) help.hidden = true; });

  const jump = (dir) => {
    const secs = window.pbxSections || [...document.querySelectorAll('section.sec, .question:not(.q-part)')];
    if (!secs.length) return;
    const y = 80;
    let idx = secs.findIndex((s) => s.getBoundingClientRect().top > y + 4);
    if (idx === -1) idx = secs.length;
    const target = dir > 0 ? secs[idx] : secs[Math.max(0, idx - 2)];
    target?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); history.back(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    switch (e.key) {
      case '/': e.preventDefault(); window.pbxSearch?.(); break;
      case 'j': jump(1); break;
      case 'k': jump(-1); break;
      case 'p': window.pbxTogglePanel?.(); break;
      case 't': window.pbxToggleTheme?.(); break;
      case '?': toggleHelp(); break;
      case 'Escape':
        help.hidden = true;
        document.getElementById('search').hidden = true;
        document.getElementById('toc')?.classList.remove('open');
        break;
      default:
    }
  });
}
