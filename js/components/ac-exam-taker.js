import { db } from '../storage.js';
import { esc, uid, fmtTime, toast } from '../utils.js';

class AcExamTaker extends HTMLElement {
  disconnectedCallback() { this.stopTimer(); }

  start(codigo) {
    this.exam = db.exams.get(codigo);
    this.done = false;
    if (!this.exam) { toast('Ese examen ya no está disponible.', 'error'); return this.exit(); }
    this.renderIdentify();
  }

  exit() { this.stopTimer(); this.dispatchEvent(new CustomEvent('exam-exit', { bubbles: true })); }

  // ---------- 1. Identificación ----------
  renderIdentify() {
    const x = this.exam;
    this.innerHTML = `
      <section class="card narrow-card">
        <h2>${esc(x.titulo)}</h2>
        <p class="muted">${x.preguntas.length} preguntas · ${x.tiempo} minutos · Apruebas con ${x.aprobacion}%</p>
        <p>Tus respuestas quedarán asociadas a estos datos.</p>
        <form novalidate>
          <div class="field"><label for="s-id">Número de identificación</label><input id="s-id" name="id" inputmode="numeric" autocomplete="off" required></div>
          <div class="field"><label for="s-name">Nombre completo</label><input id="s-name" name="nombre" autocomplete="name" required></div>
          <p class="form-error" role="alert" hidden></p>
          <div class="actions">
            <button class="btn btn-primary" type="submit">Comenzar examen</button>
            <button class="btn btn-ghost" type="button" data-action="back">Volver</button>
          </div>
        </form>
      </section>`;
    const form = this.querySelector('form');
    const error = this.querySelector('.form-error');
    this.querySelector('[data-action="back"]').addEventListener('click', () => this.exit());
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (!/^\d{5,12}$/.test(d.id.trim())) { error.textContent = 'La identificación debe tener entre 5 y 12 dígitos.'; error.hidden = false; return; }
      if (d.nombre.trim().length < 3) { error.textContent = 'Escribe tu nombre completo.'; error.hidden = false; return; }
      this.student = { id: d.id.trim(), nombre: d.nombre.trim() };
      this.renderExam();
    });
    form.elements.id.focus();
  }

  // ---------- 2. Examen ----------
  renderExam() {
    const x = this.exam;
    this.innerHTML = `
      <form class="exam" novalidate>
        <header class="exam-head">
          <div>
            <h2>${esc(x.titulo)}</h2>
            <p class="muted">${x.preguntas.length} preguntas · Apruebas con ${x.aprobacion}% · <span class="answered">0 de ${x.preguntas.length} respondidas</span></p>
          </div>
          <div class="timer" role="timer" aria-label="Tiempo restante"><span class="timer-value">${fmtTime(x.tiempo * 60)}</span></div>
          <div class="timer-bar" aria-hidden="true"><span></span></div>
        </header>
        ${x.preguntas.map((q, i) => `
          <fieldset class="question">
            <legend><span class="q-num">${i + 1}</span> ${esc(q.texto)}</legend>
            ${q.respuestas.map((a) => `
              <label class="option"><input type="radio" name="q${i}" value="${a.id}"><span>${esc(a.texto)}</span></label>`).join('')}
          </fieldset>`).join('')}
        <div class="actions end"><button class="btn btn-primary btn-lg" type="submit">Terminar</button></div>
      </form>`;

    this.form = this.querySelector('form');
    this.timerEl = this.querySelector('.timer');
    this.timerValue = this.querySelector('.timer-value');
    this.bar = this.querySelector('.timer-bar span');
    this.answeredEl = this.querySelector('.answered');

    this.form.addEventListener('change', () => {
      this.answeredEl.textContent = `${this.countAnswered()} de ${x.preguntas.length} respondidas`;
    });
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.finish(false); });

    this.beforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', this.beforeUnload);

    // Se calcula con la hora de fin (no con un contador) para que el reloj no se atrase.
    this.total = x.tiempo * 60;
    this.endAt = Date.now() + this.total * 1000;
    this.timerId = setInterval(() => this.tick(), 250);
    this.tick();
  }

  countAnswered() { return this.exam.preguntas.filter((_, i) => this.form.querySelector(`input[name="q${i}"]:checked`)).length; }

  tick() {
    const left = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
    this.timerValue.textContent = fmtTime(left);
    this.bar.style.width = `${(left / this.total) * 100}%`;
    this.timerEl.classList.toggle('warn', left <= 60);
    if (left === 0) this.finish(true);
  }

  stopTimer() {
    clearInterval(this.timerId);
    if (this.beforeUnload) { window.removeEventListener('beforeunload', this.beforeUnload); this.beforeUnload = null; }
  }

  // ---------- 3. Resultado ----------
  finish(byTime) {
    if (this.done) return;
    const x = this.exam;
    const pending = x.preguntas.length - this.countAnswered();
    if (!byTime && pending > 0 && !confirm(`Te faltan ${pending} pregunta(s) por responder. ¿Quieres terminar de todos modos?`)) return;
    this.done = true;
    this.stopTimer();

    const answers = x.preguntas.map((q, i) => {
      const chosen = this.form.querySelector(`input[name="q${i}"]:checked`)?.value ?? null;
      return { pregunta: q.id, respuesta: chosen, acierto: q.respuestas.some((a) => a.id === chosen && a.correcta) };
    });
    const correctas = answers.filter((a) => a.acierto).length;
    const porcentaje = Math.round((correctas / x.preguntas.length) * 1000) / 10;
    const aprobado = porcentaje >= x.aprobacion;

    db.results.save({
      id: uid(), examen: x.codigo, titulo: x.titulo, identificacion: this.student.id, nombre: this.student.nombre,
      correctas, total: x.preguntas.length, porcentaje, aprobado, terminoPorTiempo: byTime,
      fecha: new Date().toISOString(), respuestas: answers,
    });

    this.innerHTML = `
      <section class="card result ${aprobado ? 'pass' : 'fail'}" tabindex="-1">
        <p class="muted">${byTime ? 'Se acabó el tiempo. ' : ''}${esc(this.student.nombre)}, este es tu resultado en ${esc(x.titulo)}:</p>
        <p class="score" aria-label="Porcentaje de aciertos">${porcentaje}%</p>
        <p>${correctas} de ${x.preguntas.length} respuestas correctas (mínimo para aprobar: ${x.aprobacion}%)</p>
        <p class="verdict" role="status">${aprobado ? '¡Felicidades! Aprobaste el examen.' : 'No aprobaste esta vez. Repasa los temas e inténtalo de nuevo.'}</p>
        <button class="btn btn-primary" type="button" data-action="home">Volver a los exámenes</button>
      </section>`;
    this.querySelector('[data-action="home"]').addEventListener('click', () => this.exit());
    this.querySelector('.result').focus();
    window.scrollTo({ top: 0 });
  }
}
customElements.define('ac-exam-taker', AcExamTaker);
