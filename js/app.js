// ================================================================
// App — Inicialización y utilidades globales
// ================================================================

let translations = {};
let currentLang = localStorage.getItem('cv-language') || 'es';

function i18n(key, defaultValue = key) {
    const keys = key.split('.');
    let t = translations[currentLang];
    for (const k of keys) {
        if (t && t[k] !== undefined) t = t[k];
        else return defaultValue;
    }
    return t || defaultValue;
}

function getSectionName(type) {
    const entry = (typeof SECTION_TYPES !== 'undefined' && SECTION_TYPES[type]) ? SECTION_TYPES[type] : null;
    if (!entry) return type;
    // SECTION_TYPES.name es texto en español por defecto; si hay traducción la usa
    const key = 'sections.' + type;
    const tr = i18n(key, null);
    return tr || entry.name;
}

function setLanguage(lang) {
    const prevLang = currentLang;
    const needsContentSwitch = typeof editor !== 'undefined' && editor.data && prevLang !== lang;
    // si ya hay datos cargados, guardar los del idioma previo antes de cambiar
    if (needsContentSwitch) {
        try { editor.saveData(); } catch {}
    }
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('cv-language', lang);
    updateLanguageSelectors();
    updateUITexts();
    if (needsContentSwitch) {
        editor.reloadForCurrentLang();
    } else if (typeof renderCV === 'function' && typeof editor !== 'undefined' && editor.data) {
        renderCV(editor.data);
        editor.updateSidebarAvailable(editor.data);
        editor.updateSidebarActive(editor.data);
    }
}

function updateLanguageSelectors() {
    document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
    const cur = document.getElementById('lang-current');
    if (cur) {
        const flag = cur.querySelector('.lang-flag');
        const label = cur.querySelector('.lang-initials');
        if (flag) { flag.className = 'lang-flag flag-' + currentLang; }
        if (label) { label.textContent = currentLang === 'es' ? 'ES' : currentLang === 'en' ? 'US' : currentLang.toUpperCase(); }
    }
}

function updateUITexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = i18n(key, null);
        if (val !== null) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.dataset.i18nTitle;
        const val = i18n(key, null);
        if (val !== null) el.title = val;
    });
}

function toggleLangDropdown(e) {
    e.stopPropagation();
    document.getElementById('lang-dropdown')?.classList.toggle('open');
}
document.addEventListener('click', () => {
    document.getElementById('lang-dropdown')?.classList.remove('open');
});

async function loadTranslations() {
    try {
        const res = await fetch('js/languages.json?v=6');
        translations = await res.json();
    } catch (err) {
        console.error('No se pudo cargar languages.json', err);
        translations = { es: {}, en: {}, fr: {} };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    document.documentElement.lang = currentLang;
    document.documentElement.setAttribute('data-lang', currentLang);
    updateLanguageSelectors();
    updateUITexts();

    editor.init();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            renderCV(editor.data);
            editor.initSortable();
        });
    }
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
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); editor.undo(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'z') { e.preventDefault(); editor.redo(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveToJSON(); }
    if (e.key === 'Escape') { editor.closeModal(); document.getElementById('lang-dropdown')?.classList.remove('open'); }
});
