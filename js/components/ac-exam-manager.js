import { db } from '../storage.js';
import { esc, uid, toast } from '../utils.js';

const newAnswer = () => ({ id: uid(), texto: '', correcta: false });
const newQuestion = () => ({ id: uid(), texto: '', respuestas: [newAnswer(), newAnswer()] });

class AcExamManager extends HTMLElement {
  connectedCallback() {
    this.editing = null;
    this.draft = [newQuestion()]; // preguntas del examen que se está editando
    this.innerHTML = `
      <div class="split split-wide">
        <section class="card" aria-labelledby="exam-form-title">
          <h2 id="exam-form-title">Nuevo examen</h2>
          <form novalidate>
            <div class="grid-form">
              <div class="field"><label for="e-codigo">Código</label><input id="e-codigo" name="codigo" required></div>
              <div class="field"><label for="e-titulo">Título</label><input id="e-titulo" name="titulo" required></div>
              <div class="field"><label for="e-tiempo">Tiempo (minutos)</label><input id="e-tiempo" name="tiempo" type="number" min="1" max="600" required></div>
              <div class="field"><label for="e-aprob">Porcentaje de aprobación</label><input id="e-aprob" name="aprobacion" type="number" min="1" max="100" required></div>
            </div>
            <div class="field"><label for="e-desc">Descripción del examen</label><textarea id="e-desc" name="descripcion" rows="3"></textarea></div>

            <h3>Preguntas</h3>
            <div class="questions"></div>
            <button class="btn btn-ghost" type="button" data-action="add-question">+ Agregar pregunta</button>

            <p class="form-error" role="alert" hidden></p>
            <div class="actions">
              <button class="btn btn-primary" type="submit">Crear examen</button>
              <button class="btn btn-ghost" type="button" data-action="cancel" hidden>Cancelar</button>
            </div>
          </form>
        </section>
        <section class="card" aria-labelledby="exam-list-title">
          <h2 id="exam-list-title">Exámenes registrados</h2>
          <div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de exámenes">
            <table><thead><tr><th>Código</th><th>Título</th><th>Tiempo</th><th>Aprobación</th><th>Preguntas</th><th>Acciones</th></tr></thead>
            <tbody></tbody></table>
          </div>
        </section>
      </div>`;

    this.form = this.querySelector('form');
    this.error = this.querySelector('.form-error');
    this.box = this.querySelector('.questions');

    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    this.form.addEventListener('click', (e) => this.onClick(e));
    this.box.addEventListener('input', (e) => this.onInput(e));
    this.box.addEventListener('change', (e) => this.onChange(e));
    this.querySelector('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (btn) btn.dataset.action === 'edit' ? this.edit(btn.dataset.id) : this.remove(btn.dataset.id);
    });
    this.renderQuestions();
    this.refresh();
  }

  // ---------- tabla ----------
  refresh() {
    const exams = db.exams.all();
    this.querySelector('tbody').innerHTML = exams.length
      ? exams.map((x) => `
        <tr><td>${esc(x.codigo)}</td><td>${esc(x.titulo)}</td><td>${x.tiempo} min</td><td>${x.aprobacion}%</td><td>${x.preguntas.length}</td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(x.codigo)}" aria-label="Editar ${esc(x.titulo)}">Editar</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${esc(x.codigo)}" aria-label="Eliminar ${esc(x.titulo)}">Eliminar</button>
        </td></tr>`).join('')
      : '<tr><td colspan="6" class="empty">No hay exámenes. Crea uno con el formulario.</td></tr>';
  }

  // ---------- constructor de preguntas ----------
  renderQuestions() {
    this.box.innerHTML = this.draft.map((q, i) => `
      <fieldset class="question-edit" data-q="${q.id}">
        <legend>Pregunta ${i + 1}</legend>
        <div class="field"><label for="qt-${q.id}">Enunciado</label>
          <input id="qt-${q.id}" data-field="q-text" value="${esc(q.texto)}" autocomplete="off"></div>
        <p class="muted small">Escribe las respuestas y marca la correcta (solo una).</p>
        ${q.respuestas.map((a, j) => `
          <div class="answer-row" data-a="${a.id}">
            <input type="radio" name="ok-${q.id}" ${a.correcta ? 'checked' : ''} aria-label="Marcar la respuesta ${j + 1} como correcta">
            <input type="text" data-field="a-text" value="${esc(a.texto)}" placeholder="Respuesta ${j + 1}" aria-label="Texto de la respuesta ${j + 1}" autocomplete="off">
            <button class="btn btn-ghost btn-sm" type="button" data-action="remove-answer" aria-label="Quitar la respuesta ${j + 1}">✕</button>
          </div>`).join('')}
        <div class="actions">
          <button class="btn btn-ghost btn-sm" type="button" data-action="add-answer">+ Respuesta</button>
          <button class="btn btn-danger btn-sm" type="button" data-action="remove-question">Quitar pregunta</button>
        </div>
      </fieldset>`).join('');
  }

  findQ(el) { return this.draft.find((q) => q.id === el.closest('[data-q]')?.dataset.q); }
  findA(el) { return this.findQ(el)?.respuestas.find((a) => a.id === el.closest('[data-a]')?.dataset.a); }

  onInput(e) {
    if (e.target.dataset.field === 'q-text') this.findQ(e.target).texto = e.target.value;
    if (e.target.dataset.field === 'a-text') this.findA(e.target).texto = e.target.value;
  }

  onChange(e) { // radio: una sola respuesta correcta por pregunta
    if (e.target.type !== 'radio') return;
    const q = this.findQ(e.target);
    const id = e.target.closest('[data-a]').dataset.a;
    q.respuestas.forEach((a) => { a.correcta = a.id === id; });
  }

  onClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const q = this.findQ(btn);
    switch (btn.dataset.action) {
      case 'add-question': this.draft.push(newQuestion()); break;
      case 'remove-question':
        if (this.draft.length === 1) return toast('El examen necesita al menos una pregunta.', 'error');
        this.draft = this.draft.filter((x) => x !== q); break;
      case 'add-answer': q.respuestas.push(newAnswer()); break;
      case 'remove-answer':
        if (q.respuestas.length <= 2) return toast('Cada pregunta necesita al menos dos respuestas.', 'error');
        q.respuestas = q.respuestas.filter((a) => a.id !== btn.closest('[data-a]').dataset.a); break;
      case 'cancel': return this.reset();
      default: return;
    }
    this.renderQuestions();
  }

  // ---------- guardar / editar / eliminar ----------
  showError(msg) { this.error.textContent = msg; this.error.hidden = false; }

  save() {
    const d = Object.fromEntries(new FormData(this.form));
    const exam = {
      codigo: d.codigo.trim(), titulo: d.titulo.trim(), tiempo: Number(d.tiempo), aprobacion: Number(d.aprobacion),
      descripcion: d.descripcion.trim(),
      preguntas: this.draft.map((q) => ({
        id: q.id, texto: q.texto.trim(),
        respuestas: q.respuestas.map((a) => ({ id: a.id, texto: a.texto.trim(), correcta: a.correcta })),
      })),
    };
    this.error.hidden = true;

    if (!exam.codigo) return this.showError('Escribe el código del examen.');
    if (!this.editing && db.exams.get(exam.codigo)) return this.showError('Ya existe un examen con ese código.');
    if (!exam.titulo) return this.showError('Escribe el título del examen.');
    if (!(exam.tiempo >= 1)) return this.showError('El tiempo debe ser de al menos 1 minuto.');
    if (!(exam.aprobacion >= 1 && exam.aprobacion <= 100)) return this.showError('El porcentaje de aprobación debe estar entre 1 y 100.');
    for (const [i, q] of exam.preguntas.entries()) {
      if (!q.texto) return this.showError(`Escribe el enunciado de la pregunta ${i + 1}.`);
      if (q.respuestas.some((a) => !a.texto)) return this.showError(`Completa todas las respuestas de la pregunta ${i + 1}.`);
      if (q.respuestas.filter((a) => a.correcta).length !== 1) return this.showError(`Marca exactamente una respuesta correcta en la pregunta ${i + 1}.`);
    }

    db.exams.save(exam);
    toast(this.editing ? 'Examen actualizado' : 'Examen creado');
    this.reset();
    this.refresh();
  }

  edit(codigo) {
    const x = db.exams.get(codigo);
    if (!x) return;
    this.editing = codigo;
    const f = this.form.elements;
    f.codigo.value = x.codigo; f.codigo.readOnly = true;
    f.titulo.value = x.titulo; f.tiempo.value = x.tiempo; f.aprobacion.value = x.aprobacion; f.descripcion.value = x.descripcion;
    this.draft = structuredClone(x.preguntas);
    this.renderQuestions();
    this.querySelector('#exam-form-title').textContent = 'Editar examen';
    this.form.querySelector('[type="submit"]').textContent = 'Guardar cambios';
    this.querySelector('[data-action="cancel"]').hidden = false;
    f.titulo.focus();
    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  remove(codigo) {
    const x = db.exams.get(codigo);
    if (!x || !confirm(`¿Eliminar el examen "${x.titulo}"? Esta acción no se puede deshacer.`)) return;
    db.exams.remove(codigo);
    if (this.editing === codigo) this.reset();
    toast('Examen eliminado');
    this.refresh();
  }

  reset() {
    this.editing = null;
    this.form.reset();
    this.form.elements.codigo.readOnly = false;
    this.draft = [newQuestion()];
    this.renderQuestions();
    this.error.hidden = true;
    this.querySelector('#exam-form-title').textContent = 'Nuevo examen';
    this.form.querySelector('[type="submit"]').textContent = 'Crear examen';
    this.querySelector('[data-action="cancel"]').hidden = true;
  }
}
customElements.define('ac-exam-manager', AcExamManager);
