import { seedDB } from './storage.js';
import { currentUser } from './auth.js';
import './components/ac-navbar.js';
import './components/ac-toast.js';

if (currentUser()) location.replace('admin.html'); // ya hay sesión activa
await seedDB();
await import('./components/ac-login-form.js');
