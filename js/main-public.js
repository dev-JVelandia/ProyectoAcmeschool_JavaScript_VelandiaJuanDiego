import { seedDB } from './storage.js';
import './components/ac-navbar.js';
import './components/ac-toast.js';

await seedDB(); // los datos deben existir antes de que los componentes se rendericen
await Promise.all([import('./components/ac-exam-list.js'), import('./components/ac-exam-taker.js')]);

const intro = document.getElementById('intro');
const list = document.querySelector('ac-exam-list');
const taker = document.querySelector('ac-exam-taker');

list.addEventListener('exam-selected', (e) => {
  intro.hidden = list.hidden = true;
  taker.hidden = false;
  taker.start(e.detail.codigo);
  window.scrollTo({ top: 0 });
});

taker.addEventListener('exam-exit', () => {
  taker.hidden = true;
  intro.hidden = list.hidden = false;
  list.render();
});
