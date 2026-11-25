import { currentUser, logout } from '../auth.js';
import { esc } from '../utils.js';

class AcNavbar extends HTMLElement {
  connectedCallback() {
    const mode = this.getAttribute('mode') || 'public';
    const user = mode === 'private' ? currentUser() : null;
    const actions = {
      public: '<a class="btn btn-ghost btn-sm" href="login.html">Acceso administrativo</a>',
      login: '<a class="btn btn-ghost btn-sm" href="index.html">Ver exámenes</a>',
      private: `<span class="user-chip">${esc(user?.nombre ?? '')}</span>
                <a class="btn btn-ghost btn-sm" href="index.html">Ver sitio público</a>
                <button class="btn btn-primary btn-sm" id="logout" type="button">Cerrar sesión</button>`,
    }[mode];

    this.innerHTML = `
      <header class="site-header">
        <div class="container bar">
          <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">A</span><span>Acme School</span></a>
          <nav aria-label="Principal" class="nav-actions">${actions}</nav>
        </div>
      </header>`;
    this.querySelector('#logout')?.addEventListener('click', () => { logout(); location.href = 'login.html'; });
  }
}
customElements.define('ac-navbar', AcNavbar);
