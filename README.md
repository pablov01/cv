# CV Builder

Editor visual de currículum en una sola página con paginación A4 real, personalización de plantilla/color y exportación a PDF/Canva. Pensado para generar un CV profesional listo para imprimir o compartir sin depender de herramientas externas.

![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ¿Para qué sirve?

- Crear y editar un CV completo desde el navegador (datos personales, perfil, experiencia, proyectos propios, stack, formación, idiomas, links y certificaciones).
- Reordenar secciones por drag & drop tanto en el sidebar como en el propio CV.
- Previsualizar paginación real en hojas A4 (210×297 mm) con salto automático y partición de secciones largas.
- Exportar a **PDF** (html2pdf/jspdf + html2canvas), **imagen para Canva** y **JSON** (guardar/cargar).
- Trabajar 100% local: los datos se persisten en `localStorage` por idioma.

## Funcionalidades

### Edición
- Doble click sobre cualquier sección o botón de lápiz por entrada para abrir modal.
- Agregar/eliminar entradas individuales (experiencia, proyectos, formación, links, certificaciones) sin borrar toda la sección.
- Modal genérico con tipos `text`, `textarea`, `select` y `list` (`js/editor.js:276`).
- Historial con `undo`/`redo` (`Ctrl+Z` / `Ctrl+Shift+Z`) limitado a 50 estados y atajos `Ctrl+S` (guardar JSON) y `Esc` (cerrar modal).
- Zoom (50%–200%) y reinicio a valores por defecto.

### Secciones
Definidas en `js/data.js:5` `SECTION_TYPES` (singleton + icono):
`personal`, `profile`, `experience`, `projects`, `skills`, `education`, `certifications`, `languages`, `links`.
Sidebar muestra *secciones disponibles* y *secciones activas* reordenables con SortableJS (`js/editor.js:172`, `js/render.js:194`).

### Plantillas y color
- 6 plantillas: `modern`, `classic`, `minimal`, `harvard`, `elegant`, `creative` (`css/cv.css`).
- 8 colores de acento vía CSS var `--acento` (`js/editor.js:242`).

### Paginación A4
`js/render.js:24` `paginate()` crea páginas `.cv-page` de 210×297 mm, calcula `contentH = height - padding - 2mm` y decide con `fitsOn()`/`usedHeight()` si una sección cabe o debe partirse por bloques. Re-paginado en `requestAnimationFrame` y `document.fonts.ready` tras cada render para evitar huecos al cambiar idioma/fuente.

### Internacionalización (rama `feat/languages`)
- Dropdown en esquina superior derecha del toolbar con bandera **PY — ES** y **US — EN** (`index.html:108`, `css/editor.css` `.lang-dropdown`).
- `js/languages.json` con traducciones de UI y `js/app.js:8` `i18n()` + `setLanguage()`.
- Contenido del CV bilingüe: `js/data.js:53` `getDefaultData(lang)` retorna perfil, experiencia, proyectos, skills y formación traducidos. Persistencia separada `cv-data-es` / `cv-data-en` en `js/editor.js:35` (`getStorageKey()`, `reloadForCurrentLang()` con repaginado diferido).

### Exportación
- **PDF** `js/export-pdf.js` (html2pdf) y **Canva** `js/export-canvas.js` (html2canvas + jsPDF).
- **JSON** `js/app.js:102` `saveToJSON()` / `handleJSONLoad()`; carga aplica color/plantilla y re-renderiza.

## Stack

| Capa | Tecnología |
|------|------------|
| UI | HTML5 semántico, CSS3 (variables, flex, grid), Font Awesome 6.5, Google Fonts (Newsreader + Source Sans 3) |
| Lógica | Vanilla JavaScript (ES6), sin framework/build |
| Interacción | SortableJS 1.15 para drag & drop |
| Export | html2pdf.js 0.10, html2canvas 1.4, jsPDF 2.5 (CDN) |
| Servidor dev | Node.js `http` estático sin cache (`server.js:22`, puerto 3000) |
| Persistencia | `localStorage` (`cv-data-*`, `cv-language`) |

## Estructura

```
cv/
├── index.html          # layout sidebar + toolbar + #cv-pages + modal
├── css/
│   ├── editor.css      # sidebar, toolbar, lang-dropdown, modal, toast
│   └── cv.css          # plantillas A4, tipografía, variables de impresión
├── js/
│   ├── data.js         # SECTION_TYPES + getDefaultData(lang) bilingüe
│   ├── app.js          # i18n, setLanguage, loadTranslations, atajos
│   ├── editor.js       # estado, historial, CRUD por entrada, persistencia por idioma
│   ├── render.js       # renderCV + paginate A4 + render* por sección
│   ├── languages.json  # diccionario es/en/fr
│   ├── export-pdf.js
│   └── export-canvas.js
├── assets/             # fuentes e íconos
└── server.js           # servidor estático Node
```

## Uso

```bash
# con Node instalado
node server.js
# abre http://localhost:3000

# o con npx serve
npm start
```

1. Edita tu información con doble click o el lápiz de cada entrada.
2. Reordena secciones arrastrando desde el sidebar o el botón de grip en el CV.
3. Cambia plantilla y color.
4. Cambia idioma ES ↔ US desde el dropdown superior derecho (el contenido del CV también cambia y se guarda por idioma).
5. Exporta a PDF / Canva o guarda el JSON para respaldo.

## Atajos

| Atajo | Acción |
|-------|--------|
| `Ctrl+Z` | Deshacer |
| `Ctrl+Shift+Z` | Rehacer |
| `Ctrl+S` | Guardar JSON |
| `Esc` | Cerrar modal / dropdown de idioma |
| Doble click | Editar sección |

## Licencia

MIT — Pablo Villalba.
