# Acme School · Plataforma de exámenes

Plataforma web para que la escuela Acme cree exámenes y los estudiantes los resuelvan desde el navegador. Proyecto individual del skill de JavaScript (Campuslands).

## Tecnologías
HTML5 · CSS3 (variables, Grid, Flexbox) · JavaScript ES Modules · **Web Components** (Custom Elements, Shadow DOM, `<template>`) · `localStorage` / `sessionStorage`. Sin frameworks ni dependencias.

## Cómo ejecutarlo
Los módulos ES requieren un servidor local (no funcionan abriendo el archivo con doble clic):
1. Abre la carpeta en VS Code e instala la extensión **Live Server**.
2. Clic derecho en `index.html` → *Open with Live Server*.

**Cuenta de prueba:** `admin@acme.edu` / `Admin123` (se crea sola la primera vez, junto con un examen de ejemplo).

## Módulos
| Módulo | Página | Acceso |
|---|---|---|
| Login | `login.html` | Público |
| Gestión de usuarios (crear, editar, eliminar) | `admin.html` → pestaña Usuarios | Solo autenticados |
| Gestión de exámenes, preguntas y respuestas | `admin.html` → pestaña Exámenes | Solo autenticados |
| Resultados (extra) | `admin.html` → pestaña Resultados | Solo autenticados |
| Resolución de exámenes | `index.html` | Público |

## Estructura
```
├── index.html · login.html · admin.html
├── css/styles.css
└── js/
    ├── main-public.js · main-login.js · main-admin.js   (puntos de entrada)
    ├── storage.js   (capa de datos JSON + datos iniciales)
    ├── auth.js      (login, sesión, guardia de rutas)
    ├── utils.js     (escape de HTML, hash, formato de tiempo, toast)
    └── components/  ac-navbar · ac-toast · ac-login-form · ac-user-manager
                     ac-exam-manager · ac-exam-list · ac-exam-taker · ac-results-list
```

## Modelo de datos (JSON en localStorage)
```json
// acme_users
{ "id": "1000000001", "nombre": "...", "email": "...", "telefono": "...", "cargo": "Administrativo|Docente", "passwordHash": "sha256" }
// acme_exams
{ "codigo": "JS-001", "titulo": "...", "tiempo": 5, "aprobacion": 60, "descripcion": "...",
  "preguntas": [ { "id": "q1", "texto": "...", "respuestas": [ { "id": "a1", "texto": "...", "correcta": true } ] } ] }
// acme_results
{ "id": "...", "examen": "JS-001", "identificacion": "...", "nombre": "...", "correctas": 2, "total": 3, "porcentaje": 66.7, "aprobado": true, "fecha": "ISO" }
```
La sesión se guarda en `sessionStorage` (`acme_session`).

## Decisiones de diseño
- **Reglas de negocio:** cada pregunta exige mínimo 2 respuestas y exactamente 1 correcta (grupo de radios); el código del examen y la identificación del usuario no se repiten; no se puede eliminar la cuenta con la sesión abierta.
- **Reloj:** se calcula con la hora de finalización (`Date.now()`), no con un contador, para que no se atrase; al llegar a 0 el examen se envía solo.
- **Seguridad básica:** contraseñas con hash SHA-256 y todo texto del usuario se escapa antes de pintarse. Al ser un proyecto sin backend, no reemplaza una autenticación real.
- **Accesibilidad:** etiquetas en todos los campos, navegación por teclado (incluidas las pestañas con flechas), foco visible, enlace "Saltar al contenido", `role="timer"`/`alert`/`status`, contraste AA y `prefers-reduced-motion`.
- **Identidad visual:** azul cielo (#2FA3E6 / #146AA3), blanco y acento ámbar (#FFB43B) para las acciones principales del estudiante.

## Autor
Juan Diego Velandia Guerrero
