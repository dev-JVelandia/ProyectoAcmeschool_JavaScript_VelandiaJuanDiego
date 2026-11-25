const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { position: fixed; right: 1rem; bottom: 1rem; z-index: 50; font-family: inherit; }
    .toast { background: #12324A; color: #fff; padding: .8rem 1.1rem; border-radius: 12px; border-left: 6px solid #2FA3E6;
             box-shadow: 0 10px 30px rgba(18,50,74,.3); max-width: min(90vw, 360px); font-weight: 600;
             opacity: 0; transform: translateY(12px); transition: opacity .25s, transform .25s; pointer-events: none; }
    .toast.show { opacity: 1; transform: none; }
    .toast.error { border-left-color: #FF7A7A; }
    .toast.ok { border-left-color: #5FD3A2; }
    @media (prefers-reduced-motion: reduce) { .toast { transition: none; } }
  </style>
  <div class="toast" role="status" aria-live="polite"></div>`;

class AcToast extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true)); }
  show(message, type = 'ok') {
    const el = this.shadowRoot.querySelector('.toast');
    el.textContent = message;
    el.className = `toast ${type} show`;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => el.classList.remove('show'), 3200);
  }
}
customElements.define('ac-toast', AcToast);
