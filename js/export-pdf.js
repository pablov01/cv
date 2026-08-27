// ================================================================
// Export PDF — Exporta el CV como PDF usando html2pdf.js
// ================================================================

function exportPDF() {
    const page = document.getElementById('cv-page');
    const originalTransform = document.getElementById('cv-wrapper').style.transform;

    // Quitar zoom para capturar a tamaño completo
    document.getElementById('cv-wrapper').style.transform = 'scale(1)';

    // Ocultar controles de edición
    page.querySelectorAll('.section-controls').forEach(el => el.style.display = 'none');
    page.querySelectorAll('.cv-section').forEach(el => {
        el.style.border = 'none';
    });

    // Quitar contenteditable highlights
    const editables = page.querySelectorAll('[contenteditable]');
    editables.forEach(el => el.removeAttribute('contenteditable'));

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
            document.getElementById('cv-wrapper').style.transform = originalTransform;
            editor.toast('PDF exportado correctamente');
        })
        .catch(err => {
            overlay.remove();
            document.getElementById('cv-wrapper').style.transform = originalTransform;
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
