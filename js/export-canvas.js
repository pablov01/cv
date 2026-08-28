// ================================================================
// Export Canvas — Exporta el CV como imagen para importar en Canva
// ================================================================

function exportCanvasImage() {
    const page = document.getElementById('cv-page');
    const restore = prepareExport();

    const overlay = createLoadingOverlay('Generando imagen para Canva...');

    html2canvas(page, {
        scale: 3, // Alta resolución para Canva
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#fbfaf7',
        width: page.scrollWidth,
        height: page.scrollHeight,
    }).then(canvas => {
        overlay.remove();
        restore();

        // Crear enlace de descarga
        const link = document.createElement('a');
        const filename = 'cv-' + (editor.data.personal.name || 'export').toLowerCase().replace(/\s+/g, '-') + '-canva.png';
        link.download = filename;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        editor.toast('Imagen exportada. Importa en Canva como imagen.');
    }).catch(err => {
        overlay.remove();
        restore();
        editor.toast('Error al generar imagen');
        console.error(err);
    });
}

// Alternativa: exportar como SVG (mejor para Canva)
function exportCanvasSVG() {
    const page = document.getElementById('cv-page');
    const restore = prepareExport();

    const overlay = createLoadingOverlay('Generando SVG...');

    html2canvas(page, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fbfaf7',
    }).then(canvas => {
        overlay.remove();
        restore();

        // Convertir canvas a SVG embebido
        const imgData = canvas.toDataURL('image/png', 1.0);
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="210mm" height="${Math.round(canvas.height * 210 / canvas.width)}mm"
     viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image xlink:href="${imgData}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = 'cv-' + (editor.data.personal.name || 'export').toLowerCase().replace(/\s+/g, '-') + '.svg';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        editor.toast('SVG exportado para Canva');
    }).catch(err => {
        overlay.remove();
        restore();
        editor.toast('Error al generar SVG');
        console.error(err);
    });
}
