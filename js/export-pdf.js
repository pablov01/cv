// ================================================================
// Export PDF — Exporta el CV como PDF usando html2pdf.js
// ================================================================

// Oculta todos los controles de edición antes de capturar la imagen.
// Devuelve una función que restaura el estado original.
function prepareExport() {
    const page = document.getElementById('cv-page');
    const wrapper = document.getElementById('cv-wrapper');
    const originalTransform = wrapper.style.transform;

    // Quitar zoom para capturar a tamaño completo
    wrapper.style.transform = 'scale(1)';

    // Ocultar todos los elementos de edición (controles, botones de
    // entrada, botones "agregar") y sus íconos de fuente para que no
    // aparezcan en la exportación.
    const hidden = [];
    page.querySelectorAll('.section-controls, .entry-edit-btn, .add-entry-btn, .cv-section').forEach(el => {
        if (el.classList.contains('cv-section')) {
            hidden.push({ el, prop: 'border', value: el.style.border });
            el.style.border = 'none';
        } else {
            hidden.push({ el, prop: 'display', value: el.style.display });
            el.style.display = 'none';
        }
    });

    // Quitar contenteditable highlights
    page.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

    return function restoreExport() {
        hidden.forEach(({ el, prop, value }) => {
            el.style[prop] = value;
        });
        wrapper.style.transform = originalTransform;
    };
}

function exportPDF() {
    const page = document.getElementById('cv-page');
    const restore = prepareExport();

    const overlay = createLoadingOverlay('Generando PDF...');

    const opt = {
        margin:       0,
        filename:     'cv-' + (editor.data.personal.name || 'export').toLowerCase().replace(/\s+/g, '-') + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  {
            scale: 2,
            useCORS: true,
            letterRendering: true,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
        },
    };

    html2pdf().set(opt).from(page).save()
        .then(() => {
            overlay.remove();
            restore();
            editor.toast('PDF exportado correctamente');
        })
        .catch(err => {
            overlay.remove();
            restore();
            editor.toast('Error al exportar PDF');
            console.error(err);
        });
}

function createLoadingOverlay(msg) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner"></i>
            <p>${msg}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}
