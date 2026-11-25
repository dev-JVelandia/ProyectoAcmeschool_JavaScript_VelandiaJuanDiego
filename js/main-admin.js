import { requireAuth } from './auth.js';
import { seedDB } from './storage.js';

if (requireAuth()) {
  await seedDB();
  await Promise.all([
    import('./components/ac-navbar.js'), import('./components/ac-toast.js'),
    import('./components/ac-exam-manager.js'), import('./components/ac-user-manager.js'),
    import('./components/ac-results-list.js'),
  ]);

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((b) => {
      const on = b === tab;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) panel.firstElementChild.refresh?.(); // refresca datos al entrar
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus(); select(next);
    });
  });
}
