// ================================================================
// Export PDF — Exporta el CV como PDF (una hoja A4 por página)
// ================================================================

// Oculta todos los controles de edición antes de capturar.
// Devuelve una función que restaura el estado original.
function prepareExport() {
    const host = document.getElementById('cv-pages');
    const wrapper = document.getElementById('cv-wrapper');
    const originalTransform = wrapper.style.transform;
    const originalHostGap = host.style.gap;

    // Quitar zoom para capturar a tamaño completo
    wrapper.style.transform = 'scale(1)';

    // Juntar las hojas (sin sombra) para que la exportación sea continua
    host.style.gap = '0';

    // Ocultar controles de edición y quitar highlights
    const hidden = [];
    host.querySelectorAll('.cv-page').forEach(page => {
        hidden.push({ el: page, prop: 'boxShadow', value: page.style.boxShadow });
        page.style.boxShadow = 'none';

        page.querySelectorAll('.section-controls, .entry-edit-btn, .add-entry-btn, .cv-section').forEach(el => {
            if (el.classList.contains('cv-section')) {
                hidden.push({ el, prop: 'border', value: el.style.border });
                el.style.border = 'none';
            } else {
                hidden.push({ el, prop: 'display', value: el.style.display });
                el.style.display = 'none';
            }
        });

        page.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    });

    return function restoreExport() {
        hidden.forEach(({ el, prop, value }) => {
            el.style[prop] = value;
        });
        host.style.gap = originalHostGap;
        wrapper.style.transform = originalTransform;
    };
}

function getCvFileName() {
    const name = (editor.data && editor.data.personal && editor.data.personal.name) || 'export';
    return 'cv-' + name.toLowerCase().replace(/\s+/g, '-');
}

function getPageBackground(page) {
    const bg = getComputedStyle(page).backgroundColor;
    return (bg && bg !== 'rgba(0, 0, 0, 0)') ? bg : '#fbfaf7';
}

// Añade hiperenlaces clicables (anotaciones invisibles) sobre la hoja
function addPdfLinks(pdf, page) {
    if (!(window.jspdf && window.jspdf.jsPDF)) return;

    const pageRect = page.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height) return;

    const scaleX = 210 / pageRect.width;
    const scaleY = 297 / pageRect.height;

    const targets = [];

    // Anclas normales (contacto, certificaciones)
    page.querySelectorAll('a[href]').forEach(a => {
        targets.push({ el: a, href: a.getAttribute('href') });
    });

    // Ítems de la grilla de links
    page.querySelectorAll('.link-item[data-href]').forEach(el => {
        targets.push({ el, href: el.dataset.href });
    });

    targets.forEach(({ el, href }) => {
        if (!href) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;

        const x = (r.left - pageRect.left) * scaleX;
        const y = (r.top - pageRect.top) * scaleY;
        const w = r.width * scaleX;
        const h = r.height * scaleY;

        try {
            // Rectángulo de enlace sin texto visible
            pdf.link(x, y, w, h, { url: href });
        } catch (e) { /* un enlace fallido no debe romper la exportación */ }
    });
}

async function exportPDF() {
    const restore = prepareExport();
    const overlay = createLoadingOverlay('Generando PDF...');

    const pages = Array.from(document.querySelectorAll('#cv-pages > .cv-page'));

    try {
        // Un frame para que el navegador aplique los estilos de exportación
        await new Promise(r => setTimeout(r, 50));

        const jsPDF = (window.jspdf && window.jspdf.jsPDF) || null;
        if (!jsPDF) throw new Error('jsPDF no disponible');

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                backgroundColor: getPageBackground(page),
                width: page.offsetWidth,
                height: page.offsetHeight,
            });

            if (i > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, 210, 297);

            addPdfLinks(pdf, page);
        }

        pdf.save(getCvFileName() + '.pdf');
        overlay.remove();
        restore();
        editor.toast('PDF exportado correctamente');
    } catch (err) {
        overlay.remove();
        restore();
        editor.toast('Error al exportar PDF');
        console.error(err);
    }
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