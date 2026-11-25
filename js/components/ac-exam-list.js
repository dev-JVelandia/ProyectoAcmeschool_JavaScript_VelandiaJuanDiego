import { db } from '../storage.js';
import { esc } from '../utils.js';

class AcExamList extends HTMLElement {
  connectedCallback() { this.render(); }

  render() {
    const exams = db.exams.all().filter((x) => x.preguntas?.length); // solo exámenes con preguntas
    this.innerHTML = exams.length
      ? `<h2 class="visually-hidden">Exámenes disponibles</h2>
         <div class="exam-grid">${exams.map((x) => `
          <article class="card exam-card">
            <h3>${esc(x.titulo)}</h3>
            <p class="muted">${esc(x.descripcion) || 'Sin descripción.'}</p>
            <ul class="meta">
              <li><span class="meta-label">Tiempo</span><strong>${x.tiempo} min</strong></li>
              <li><span class="meta-label">Aprobación</span><strong>${x.aprobacion}%</strong></li>
              <li><span class="meta-label">Preguntas</span><strong>${x.preguntas.length}</strong></li>
            </ul>
            <button class="btn btn-accent btn-block" type="button" data-code="${esc(x.codigo)}">Presentar examen</button>
          </article>`).join('')}</div>`
      : '<p class="empty card">Todavía no hay exámenes disponibles. Vuelve más tarde.</p>';

    this.querySelectorAll('button[data-code]').forEach((b) =>
      b.addEventListener('click', () =>
        this.dispatchEvent(new CustomEvent('exam-selected', { detail: { codigo: b.dataset.code }, bubbles: true }))));
  }
}
customElements.define('ac-exam-list', AcExamList);
