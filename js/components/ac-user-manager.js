import { db } from '../storage.js';
import { currentUser } from '../auth.js';
import { esc, hash, toast } from '../utils.js';

class AcUserManager extends HTMLElement {
  connectedCallback() {
    this.editing = null;
    this.innerHTML = `
      <div class="split">
        <section class="card" aria-labelledby="user-form-title">
          <h2 id="user-form-title">Nuevo usuario</h2>
          <form novalidate>
            <div class="field"><label for="u-id">Número de identificación</label>
              <input id="u-id" name="id" inputmode="numeric" required></div>
            <div class="field"><label for="u-nombre">Nombre completo</label>
              <input id="u-nombre" name="nombre" autocomplete="off" required></div>
            <div class="field"><label for="u-email">Email</label>
              <input id="u-email" name="email" type="email" autocomplete="off" required></div>
            <div class="field"><label for="u-tel">Teléfono</label>
              <input id="u-tel" name="telefono" type="tel" inputmode="tel" required></div>
            <div class="field"><label for="u-cargo">Cargo</label>
              <select id="u-cargo" name="cargo"><option>Administrativo</option><option>Docente</option></select></div>
            <div class="field"><label for="u-pass">Contraseña</label>
              <input id="u-pass" name="password" type="password" autocomplete="new-password">
              <small class="muted" id="pass-help">Mínimo 6 caracteres.</small></div>
            <p class="form-error" role="alert" hidden></p>
            <div class="actions">
              <button class="btn btn-primary" type="submit">Crear usuario</button>
              <button class="btn btn-ghost" type="button" data-action="cancel" hidden>Cancelar</button>
            </div>
          </form>
        </section>
        <section class="card" aria-labelledby="user-list-title">
          <h2 id="user-list-title">Usuarios registrados</h2>
          <div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de usuarios">
            <table><thead><tr><th>Identificación</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Cargo</th><th>Acciones</th></tr></thead>
            <tbody></tbody></table>
          </div>
        </section>
      </div>`;

    this.form = this.querySelector('form');
    this.error = this.querySelector('.form-error');
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    this.querySelector('[data-action="cancel"]').addEventListener('click', () => this.reset());
    this.querySelector('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      btn.dataset.action === 'edit' ? this.edit(btn.dataset.id) : this.remove(btn.dataset.id);
    });
    this.refresh();
  }

  refresh() {
    const users = db.users.all();
    this.querySelector('tbody').innerHTML = users.length
      ? users.map((u) => `
        <tr>
          <td>${esc(u.id)}</td><td>${esc(u.nombre)}</td><td>${esc(u.email)}</td><td>${esc(u.telefono)}</td>
          <td><span class="chip">${esc(u.cargo)}</span></td>
          <td class="row-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(u.id)}" aria-label="Editar a ${esc(u.nombre)}">Editar</button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(u.id)}" aria-label="Eliminar a ${esc(u.nombre)}">Eliminar</button>
          </td></tr>`).join('')
      : '<tr><td colspan="6" class="empty">Aún no hay usuarios. Crea el primero con el formulario.</td></tr>';
  }

  showError(msg) { this.error.textContent = msg; this.error.hidden = false; }

  async save() {
    const d = Object.fromEntries(new FormData(this.form));
    Object.keys(d).forEach((k) => { if (k !== 'password') d[k] = d[k].trim(); });
    this.error.hidden = true;

    if (!/^\d{5,12}$/.test(d.id)) return this.showError('La identificación debe tener entre 5 y 12 dígitos.');
    if (d.nombre.length < 3) return this.showError('Escribe el nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return this.showError('Escribe un correo válido, por ejemplo nombre@acme.edu.');
    if (!/^\+?\d{7,15}$/.test(d.telefono)) return this.showError('El teléfono debe tener entre 7 y 15 dígitos.');
    if (!this.editing && db.users.get(d.id)) return this.showError('Ya existe un usuario con esa identificación.');
    if (db.users.all().some((u) => u.email.toLowerCase() === d.email.toLowerCase() && u.id !== d.id))
      return this.showError('Ese correo ya está registrado.');
    if ((!this.editing || d.password) && d.password.length < 6) return this.showError('La contraseña debe tener mínimo 6 caracteres.');

    const prev = this.editing ? db.users.get(this.editing) : null;
    db.users.save({
      id: d.id, nombre: d.nombre, email: d.email, telefono: d.telefono, cargo: d.cargo,
      passwordHash: d.password ? await hash(d.password) : prev.passwordHash,
    });
    toast(this.editing ? 'Usuario actualizado' : 'Usuario creado');
    this.reset();
    this.refresh();
  }

  edit(id) {
    const u = db.users.get(id);
    if (!u) return;
    this.editing = id;
    const f = this.form.elements;
    f.id.value = u.id; f.id.readOnly = true;
    f.nombre.value = u.nombre; f.email.value = u.email; f.telefono.value = u.telefono; f.cargo.value = u.cargo;
    f.password.value = '';
    this.querySelector('#pass-help').textContent = 'Déjala vacía para conservar la contraseña actual.';
    this.querySelector('#user-form-title').textContent = 'Editar usuario';
    this.form.querySelector('[type="submit"]').textContent = 'Guardar cambios';
    this.querySelector('[data-action="cancel"]').hidden = false;
    f.nombre.focus();
  }

  remove(id) {
    if (id === currentUser()?.id) return toast('No puedes eliminar la cuenta con la que iniciaste sesión.', 'error');
    const u = db.users.get(id);
    if (!u || !confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
    db.users.remove(id);
    if (this.editing === id) this.reset();
    toast('Usuario eliminado');
    this.refresh();
  }

  reset() {
    this.editing = null;
    this.form.reset();
    this.form.elements.id.readOnly = false;
    this.error.hidden = true;
    this.querySelector('#pass-help').textContent = 'Mínimo 6 caracteres.';
    this.querySelector('#user-form-title').textContent = 'Nuevo usuario';
    this.form.querySelector('[type="submit"]').textContent = 'Crear usuario';
    this.querySelector('[data-action="cancel"]').hidden = true;
  }
}
customElements.define('ac-user-manager', AcUserManager);
