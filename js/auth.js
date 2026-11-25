// Autenticación: la sesión vive en sessionStorage (se cierra al cerrar la pestaña).
import { db } from './storage.js';
import { hash } from './utils.js';

const KEY = 'acme_session';

export async function login(email, password) {
  const user = db.users.all().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.passwordHash !== (await hash(password))) return null;
  sessionStorage.setItem(KEY, user.id);
  return user;
}

export const logout = () => sessionStorage.removeItem(KEY);

export function currentUser() {
  const id = sessionStorage.getItem(KEY);
  return id ? db.users.get(id) ?? null : null;
}

// Guardia de rutas privadas: sin sesión, redirige al login.
export function requireAuth() {
  const user = currentUser();
  if (!user) { location.replace('login.html'); return null; }
  return user;
}
