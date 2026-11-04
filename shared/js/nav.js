// Going back: every internal jump records where you were, so Back (or the floating button, or Alt+←) returns there.
// The target of a jump is briefly highlighted.
const RETURN_MS = 12000;
let returnTimer = 0;

function flash(target) {
  if (!target) return;
  target.classList.remove('flash');
  void target.offsetWidth;
  target.classList.add('flash');
  setTimeout(() => target.classList.remove('flash'), 1900);
  if (target.tagName === 'DETAILS') target.open = true;
  target.closest('details:not([open])')?.setAttribute('open', '');
}

function showReturn() {
  const box = document.querySelector('.return-btn');
  if (!box) return;
  box.hidden = false;
  clearTimeout(returnTimer);
  returnTimer = setTimeout(() => { box.hidden = true; }, RETURN_MS);
}

export function goBack() {
  const st = history.state;
  if (st && st.pbxFrom != null) history.back();
}

export function initNav() {
  // Remember the current scroll position in the current history entry.
  const save = () => history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    save();
    if (url.pathname === location.pathname && url.hash) {
      e.preventDefault();
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      history.pushState({ pbxFrom: window.scrollY }, '', url.hash);
      target.closest('details:not([open])')?.setAttribute('open', '');
      target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      flash(target);
      showReturn();
    } else {
      sessionStorage.setItem('pbx:jumped', '1');
    }
  });
  window.addEventListener('popstate', (e) => {
    const y = e.state?.scrollY;
    if (y != null) window.scrollTo({ top: y });
    else if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    document.querySelector('.return-btn').hidden = true;
  });
  document.querySelector('[data-action="return"]')?.addEventListener('click', () => { history.back(); });
  // Arriving from a link on another page: highlight the target and offer the way back.
  if (location.hash) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) {
      t.closest('details:not([open])')?.setAttribute('open', '');
      requestAnimationFrame(() => { t.scrollIntoView(); flash(t); });
    }
  }
  try { if (sessionStorage.getItem('pbx:jumped')) { sessionStorage.removeItem('pbx:jumped'); if (document.referrer && new URL(document.referrer).origin === location.origin) showReturn(); } } catch {}
  window.pbxGoBack = () => history.back();
}
