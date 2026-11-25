// Capa de persistencia: JSON en localStorage.
import { hash } from './utils.js';

const read = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function collection(key, idField) {
  const same = (item, id) => String(item[idField]) === String(id);
  return {
    all: () => read(key),
    get: (id) => read(key).find((i) => same(i, id)),
    save(item) { // crea o actualiza según el identificador
      const list = read(key);
      const i = list.findIndex((x) => same(x, item[idField]));
      i >= 0 ? (list[i] = item) : list.push(item);
      write(key, list);
    },
    remove: (id) => write(key, read(key).filter((i) => !same(i, id))),
  };
}

export const db = {
  users: collection('acme_users', 'id'),
  exams: collection('acme_exams', 'codigo'),
  results: collection('acme_results', 'id'),
};

// Datos iniciales para poder probar la plataforma desde el primer ingreso.
export async function seedDB() {
  if (db.users.all().length === 0) {
    db.users.save({
      id: '1000000001', nombre: 'Administrador Acme', email: 'admin@acme.edu',
      telefono: '3000000000', cargo: 'Administrativo', passwordHash: await hash('Admin123'),
    });
  }
  if (!localStorage.getItem('acme_seeded')) {
    db.exams.save({
      codigo: 'JS-001', titulo: 'Fundamentos de JavaScript', tiempo: 5, aprobacion: 60,
      descripcion: 'Variables, tipos de datos y funciones básicas.',
      preguntas: [
        { id: 'q1', texto: '¿Qué palabra clave declara una constante?', respuestas: [
          { id: 'a1', texto: 'var', correcta: false }, { id: 'a2', texto: 'const', correcta: true }, { id: 'a3', texto: 'static', correcta: false }] },
        { id: 'q2', texto: '¿Qué devuelve typeof "hola"?', respuestas: [
          { id: 'a1', texto: '"string"', correcta: true }, { id: 'a2', texto: '"text"', correcta: false }, { id: 'a3', texto: '"char"', correcta: false }] },
        { id: 'q3', texto: '¿Qué método agrega un elemento al final de un arreglo?', respuestas: [
          { id: 'a1', texto: 'shift()', correcta: false }, { id: 'a2', texto: 'push()', correcta: true }, { id: 'a3', texto: 'pop()', correcta: false }] },
      ],
    });
    localStorage.setItem('acme_seeded', '1');
  }
}
