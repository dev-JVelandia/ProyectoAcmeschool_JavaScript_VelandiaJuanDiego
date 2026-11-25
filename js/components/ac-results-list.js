import { db } from '../storage.js';
import { esc } from '../utils.js';

class AcResultsList extends HTMLElement {
  connectedCallback() { this.refresh(); }

  refresh() {
    const rows = db.results.all().slice().reverse();
    this.innerHTML = `
      <section class="card" aria-labelledby="res-title">
        <h2 id="res-title">Resultados de los exámenes</h2>
        <div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de resultados">
          <table><thead><tr><th>Identificación</th><th>Nombre</th><th>Examen</th><th>Aciertos</th><th>Porcentaje</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>${rows.length ? rows.map((r) => `
            <tr><td>${esc(r.identificacion)}</td><td>${esc(r.nombre)}</td><td>${esc(r.titulo)}</td>
            <td>${r.correctas} de ${r.total}</td><td>${r.porcentaje}%</td>
            <td><span class="chip ${r.aprobado ? 'chip-ok' : 'chip-bad'}">${r.aprobado ? 'Aprobado' : 'No aprobado'}</span></td>
            <td>${new Date(r.fecha).toLocaleString('es-CO')}</td></tr>`).join('')
            : '<tr><td colspan="7" class="empty">Todavía nadie ha presentado un examen.</td></tr>'}</tbody></table>
        </div>
      </section>`;
  }
}
customElements.define('ac-results-list', AcResultsList);
