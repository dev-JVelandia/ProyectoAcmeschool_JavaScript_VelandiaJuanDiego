import { login } from '../auth.js';

class AcLoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="card login-card">
        <h1>Iniciar sesión</h1>
        <p class="muted">Acceso para personal administrativo y docente.</p>
        <form novalidate>
          <div class="field">
            <label for="login-email">Correo electrónico</label>
            <input id="login-email" name="email" type="email" autocomplete="username" required>
          </div>
          <div class="field">
            <label for="login-pass">Contraseña</label>
            <input id="login-pass" name="password" type="password" autocomplete="current-password" required>
          </div>
          <p class="form-error" role="alert" hidden></p>
          <button class="btn btn-primary btn-block" type="submit">Entrar</button>
        </form>
        <p class="hint">Cuenta de prueba: <strong>admin@acme.edu</strong> / <strong>Admin123</strong></p>
      </section>`;

    const form = this.querySelector('form');
    const error = this.querySelector('.form-error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { email, password } = Object.fromEntries(new FormData(form));
      error.hidden = true;
      if (!email.trim() || !password) { error.textContent = 'Escribe tu correo y tu contraseña.'; error.hidden = false; return; }
      const user = await login(email, password);
      if (!user) { error.textContent = 'Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.'; error.hidden = false; return; }
      location.href = 'admin.html';
    });
  }
}
customElements.define('ac-login-form', AcLoginForm);
