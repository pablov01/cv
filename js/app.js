// ================================================================
// App — Inicialización y utilidades globales
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    editor.init();
});

// ---- Guardar / Cargar JSON ----
function saveToJSON() {
    const data = JSON.stringify(editor.data, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'cv-data.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    editor.toast('Datos guardados como JSON');
}

function loadFromJSON() {
    document.getElementById('json-input').click();
}

function handleJSONLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            editor.data = data;
            editor.saveData();
            editor.applyColor(data.color || '#8c4a2f');
            editor.setTemplate(data.template || 'modern');
            renderCV(editor.data);
            editor.initSortable();
            editor.pushHistory();
            editor.toast('CV cargado correctamente');
        } catch (err) {
            editor.toast('Error al cargar el archivo JSON');
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
    // Ctrl+Z = undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
    }
    // Ctrl+Shift+Z = redo
    if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        editor.redo();
    }
    // Ctrl+S = save JSON
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveToJSON();
    }
    // Escape = close modal
    if (e.key === 'Escape') {
        editor.closeModal();
    }
});
