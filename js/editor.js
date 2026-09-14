// ================================================================
// Editor — Lógica del editor de CV
// ================================================================

const editor = {
    data: null,
    zoom: 1,
    history: [],
    historyIndex: -1,
    modalState: null,
    sortable: null,

    getStorageKey() {
        const lang = (typeof currentLang !== 'undefined' ? currentLang : 'es');
        return 'cv-data-' + lang;
    },
    init() {
        const lang = (typeof currentLang !== 'undefined' ? currentLang : 'es');
        // migración: si existe clave antigua cv-data sin sufijo, moverla a es
        try {
            const legacy = localStorage.getItem('cv-data');
            if (legacy && !localStorage.getItem('cv-data-es')) {
                localStorage.setItem('cv-data-es', legacy);
            }
        } catch {}
        const saved = this.loadData();
        const defaults = getDefaultData(lang);
        this.data = saved ? this.mergeDefaults(saved, defaults) : defaults;
        this.applyColor(this.data.color);
        this.setTemplate(this.data.template);
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
    },
    reloadForCurrentLang() {
        // usado al cambiar idioma: descarta historial y carga datos del nuevo idioma
        this.history = [];
        this.historyIndex = -1;
        const lang = (typeof currentLang !== 'undefined' ? currentLang : 'es');
        const saved = this.loadData();
        const defaults = getDefaultData(lang);
        this.data = saved ? this.mergeDefaults(saved, defaults) : defaults;
        this.applyColor(this.data.color);
        this.setTemplate(this.data.template);
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        // Re-paginar tras layout/fonts — igual que en app.js init — evita que
        // projects salte a 2ª hoja dejando hueco en 1ª al medir antes de pintar
        requestAnimationFrame(() => {
            renderCV(this.data);
            this.initSortable();
        });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                renderCV(this.data);
                this.initSortable();
            });
        }
    },

    mergeDefaults(saved, defaults) {
        // Agregar secciones que no existen en datos guardados
        const mergedSections = [...new Set([...defaults.sections, ...saved.sections])];
        saved.sections = mergedSections;

        // Asegurar que existan las estructuras de datos por defecto
        if (!saved.links) saved.links = defaults.links;
        if (!saved.personal) saved.personal = defaults.personal;
        if (!saved.skills) saved.skills = defaults.skills;
        if (!saved.education) saved.education = defaults.education;
        if (!saved.experience) saved.experience = defaults.experience;
        if (!saved.projects) saved.projects = defaults.projects;
        if (!saved.certifications) saved.certifications = defaults.certifications || [];

        return saved;
    },

    // ---- Persistencia (por idioma) ----
    loadData() {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },

    saveData() {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.data));
    },

    // ---- Historial ----
    pushHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(this.data)));
        this.historyIndex = this.history.length - 1;
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    },

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            renderCV(this.data);
            this.initSortable();
            this.saveData();
            this.toast('Deshacer');
        }
    },

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.data = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            renderCV(this.data);
            this.initSortable();
            this.saveData();
            this.toast('Rehacer');
        }
    },

    // ---- Secciones ----
    addSection(type) {
        if (this.data.sections.includes(type)) return;
        this.data.sections.push(type);

        // Inicializar datos por defecto si no existen
        if (type === 'certifications' && !this.data[type]) {
            this.data[type] = [];
        }

        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
    },

    removeSection(type) {
        const nm = (typeof getSectionName !== 'undefined' ? getSectionName(type) : SECTION_TYPES[type].name);
        if (!confirm(`¿Eliminar la sección "${nm}"?`)) return;
        this.data.sections = this.data.sections.filter(s => s !== type);
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        this.toast('Sección eliminada');
    },

    editSection(type) {
        const entryCount = {
            experience: (this.data.experience || []).length,
            projects: (this.data.projects || []).length,
            education: (this.data.education || []).length,
            links: (this.data.links || []).length,
            certifications: (this.data.certifications || []).length,
        }[type];

        switch (type) {
            case 'personal':        this.editPersonal(); break;
            case 'profile':         this.editProfile(); break;
            case 'experience':      entryCount ? this.editExperienceEntry(0) : this.addExperienceEntry(); break;
            case 'projects':        entryCount ? this.editProjectsEntry(0) : this.addProjectsEntry(); break;
            case 'skills':          this.editSkills(); break;
            case 'education':       entryCount ? this.editEducationEntry(0) : this.addEducationEntry(); break;
            case 'languages':       this.editLanguages(); break;
            case 'links':           entryCount ? this.chooseLinksEntry() : this.addLinksEntry(); break;
            case 'certifications':  entryCount ? this.editCertificationsEntry(0) : this.addCertificationsEntry(); break;
        }
    },

    // ---- Sidebar ----
    updateSidebarAvailable(data) {
        const container = document.getElementById('available-sections');
        container.innerHTML = '';

        Object.entries(SECTION_TYPES).forEach(([type, info]) => {
            if (info.singleton && data.sections.includes(type)) return;

            const btn = document.createElement('button');
            btn.className = 'section-btn';
            btn.dataset.section = type;
            const labelAvail = (typeof getSectionName !== 'undefined' ? getSectionName(type) : info.name);
            btn.innerHTML = `<i class="${info.icon}"></i> ${labelAvail}`;
            btn.onclick = () => this.addSection(type);
            container.appendChild(btn);
        });
    },

    updateSidebarActive(data) {
        const container = document.getElementById('active-sections');
        container.innerHTML = '';

        data.sections.forEach(type => {
            const info = SECTION_TYPES[type];
            if (!info) return;

            const item = document.createElement('div');
            item.className = 'active-section-item';
            item.dataset.section = type;
            const labelActive = (typeof getSectionName !== 'undefined' ? getSectionName(type) : info.name);
            item.innerHTML = `
                <i class="fas fa-grip-vertical drag-handle"></i>
                <span class="section-name"><i class="${info.icon}" style="margin-right:6px;font-size:0.75rem"></i>${labelActive}</span>
                <button class="remove-btn" onclick="editor.removeSection('${type}')" title="Eliminar"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(item);
        });

        // Sortable para reordenar en sidebar
        if (this.sidebarSortable) this.sidebarSortable.destroy();
        this.sidebarSortable = new Sortable(container, {
            handle: '.drag-handle',
            animation: 150,
            onEnd: (evt) => {
                const sections = Array.from(container.children).map(el => el.dataset.section);
                this.data.sections = sections;
                renderCV(this.data);
                this.initSortable();
                this.pushHistory();
                this.saveData();
            }
        });
    },

    // ---- Drag & Drop en CV ----
    initSortable() {
        const host = document.getElementById('cv-pages');
        if (this.sortable) {
            this.sortable.forEach(s => { if (s) s.destroy(); });
            this.sortable = [];
        }

        this.sortable = Array.from(host.querySelectorAll(':scope > .cv-page')).map(page =>
            new Sortable(page, {
                handle: '.move-btn',
                group: 'cv-sections',
                animation: 200,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onEnd: () => {
                    const order = [];
                    host.querySelectorAll(':scope > .cv-page > .cv-section').forEach(el => {
                        const type = el.dataset.section;
                        if (order[order.length - 1] !== type) order.push(type);
                    });
                    if (order.length) this.data.sections = order;
                    this.updateSidebarActive(this.data);
                    this.pushHistory();
                    this.saveData();
                }
            })
        );
    },

    // ---- Template ----
    setTemplate(name) {
        this.data.template = name;
        document.querySelectorAll('#cv-pages > .cv-page').forEach(p => {
            p.className = 'cv-page template-' + name;
        });

        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.template === name);
        });

        this.saveData();
    },

    // ---- Color ----
    setColor(color) {
        this.data.color = color;
        this.applyColor(color);

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.style.background === color || rgbToHex(btn.style.backgroundColor) === color);
        });

        this.saveData();
    },

    applyColor(color) {
        document.documentElement.style.setProperty('--acento', color);
    },

    // ---- Zoom ----
    zoomIn() {
        this.zoom = Math.min(this.zoom + 0.1, 2);
        this.applyZoom();
    },

    zoomOut() {
        this.zoom = Math.max(this.zoom - 0.1, 0.5);
        this.applyZoom();
    },

    applyZoom() {
        document.getElementById('cv-wrapper').style.transform = `scale(${this.zoom})`;
        document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
    },

    // ---- Reset ----
    resetCV() {
        if (!confirm('¿Reiniciar el CV? Se borrarán todos los cambios.')) return;
        const lang = (typeof currentLang !== 'undefined' ? currentLang : 'es');
        this.data = getDefaultData(lang);
        localStorage.removeItem(this.getStorageKey());
        // también limpiar clave legada si estamos en es
        if (lang === 'es') try { localStorage.removeItem('cv-data'); } catch {}
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.applyColor(this.data.color);
        this.setTemplate(this.data.template);
        this.toast('CV reiniciado');
    },

    // ---- Modal ----
    openModal(title, fields, currentValues, onSave, onDelete) {
        this.modalState = { onSave, onDelete };
        document.getElementById('modal-title').textContent = title;

        const body = document.getElementById('modal-body');
        body.innerHTML = '';

        fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group' + (field.row ? ' form-row' : '');

            if (field.type === 'textarea') {
                group.innerHTML = `
                    <label>${field.label}</label>
                    <textarea data-field="${field.key}" rows="${field.rows || 3}">${currentValues[field.key] || ''}</textarea>
                `;
            } else if (field.type === 'select') {
                const opts = (field.options || []).map(o =>
                    `<option value="${o.value}" ${currentValues[field.key] === o.value ? 'selected' : ''}>${o.label}</option>`
                ).join('');
                group.innerHTML = `
                    <label>${field.label}</label>
                    <select data-field="${field.key}">${opts}</select>
                `;
            } else if (field.type === 'list') {
                group.innerHTML = `
                    <label>${field.label}</label>
                    <div data-field="${field.key}" class="list-editor">
                        ${(currentValues[field.key] || []).map((item, i) => `
                            <div class="list-item" style="display:flex;gap:6px;margin-bottom:6px;">
                                <input type="text" value="${escapeHtml(item)}" data-index="${i}" style="flex:1">
                                <button class="btn btn-danger" onclick="this.parentElement.remove()" style="padding:6px 10px;font-size:0.8rem">✕</button>
                            </div>
                        `).join('')}
                        <button class="btn btn-cancel" onclick="editor.addListItem(this)" style="font-size:0.8rem;padding:6px 12px;margin-top:4px">+ Agregar</button>
                    </div>
                `;
            } else {
                group.innerHTML = `
                    <label>${field.label}</label>
                    <input type="${field.type || 'text'}" data-field="${field.key}" value="${escapeHtml(currentValues[field.key] || '')}" placeholder="${field.placeholder || ''}">
                `;
            }

            body.appendChild(group);
        });

        document.getElementById('edit-modal').style.display = 'flex';

        // Agregar botón de eliminar si hay callback
        const footer = document.querySelector('.modal-footer');
        const existingDelete = footer.querySelector('.btn-danger');
        if (existingDelete) existingDelete.remove();

        if (onDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.onclick = onDelete;
            footer.insertBefore(deleteBtn, footer.firstChild);
        }
    },

    addListItem(btn) {
        const list = btn.parentElement;
        const items = list.querySelectorAll('.list-item');
        const div = document.createElement('div');
        div.className = 'list-item';
        div.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;';
        div.innerHTML = `
            <input type="text" value="" data-index="${items.length}" style="flex:1">
            <button class="btn btn-danger" onclick="this.parentElement.remove()" style="padding:6px 10px;font-size:0.8rem">✕</button>
        `;
        list.insertBefore(div, btn);
        div.querySelector('input').focus();
    },

    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.modalState = null;
    },

    saveModal() {
        if (!this.modalState) return;

        const values = {};
        document.querySelectorAll('#modal-body .form-group').forEach(group => {
            const key = group.querySelector('[data-field]')?.dataset.field;
            if (!key) return;

            const field = group.querySelector('[data-field]');
            if (field.tagName === 'TEXTAREA') {
                values[key] = field.value;
            } else if (field.classList.contains('list-editor')) {
                values[key] = Array.from(field.querySelectorAll('input'))
                    .map(input => input.value)
                    .filter(v => v.trim());
            } else {
                values[key] = field.value;
            }
        });

        this.modalState.onSave(values);
        this.closeModal();
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
    },

    // ---- Edit methods ----
    editPersonal() {
        const d = this.data.personal;
        this.openModal('Editar Datos Personales', [
            { key: 'name', label: 'Nombre completo', placeholder: 'Tu nombre' },
            { key: 'title', label: 'Cargo / Título', placeholder: 'Desarrollador Full Stack' },
            { key: 'location', label: 'Ubicación', placeholder: 'Ciudad, País' },
            { key: 'phone', label: 'Teléfono', placeholder: '+595 ...' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'github', label: 'GitHub (usuario)', placeholder: 'usuario' },
            { key: 'linkedin', label: 'LinkedIn (usuario)', placeholder: 'usuario' },
        ], d, (vals) => {
            Object.assign(this.data.personal, vals);
        });
    },

    editProfile() {
        this.openModal('Editar Perfil', [
            { key: 'profile', label: 'Descripción profesional', type: 'textarea', rows: 5 },
        ], { profile: this.data.profile }, (vals) => {
            this.data.profile = vals.profile;
        });
    },

    // ---- Experience (per-entry) ----
    editExperienceEntry(index) {
        const exp = this.data.experience[index];
        if (!exp) return;

        this.openModal('Editar Experiencia — ' + (exp.company || 'Nueva'), [
            { key: 'company', label: 'Empresa' },
            { key: 'role', label: 'Cargo / Rol' },
            { key: 'startDate', label: 'Fecha inicio', placeholder: '2022' },
            { key: 'endDate', label: 'Fecha fin', placeholder: 'actual' },
            { key: 'projects', label: 'Proyectos (sub-secciones)', type: 'list' },
        ], {
            company: exp.company,
            role: exp.role,
            startDate: exp.startDate,
            endDate: exp.endDate,
            projects: exp.projects ? exp.projects.map(p => p.title || p).filter(Boolean) : [],
        }, (vals) => {
            this.data.experience[index].company = vals.company;
            this.data.experience[index].role = vals.role;
            this.data.experience[index].startDate = vals.startDate;
            this.data.experience[index].endDate = vals.endDate;
            // Reconstruir projects desde la lista de strings
            if (vals.projects && vals.projects.length) {
                this.data.experience[index].projects = vals.projects.map(title => ({
                    title: title,
                    bullets: [''],
                }));
            }
        }, () => {
            // Callback de eliminar
            if (confirm('¿Eliminar esta experiencia?')) {
                this.data.experience.splice(index, 1);
                this.closeModal();
                renderCV(this.data);
                this.initSortable();
                this.pushHistory();
                this.saveData();
            }
        });
    },

    addExperienceEntry() {
        this.data.experience.push({
            company: '',
            role: '',
            startDate: '',
            endDate: '',
            projects: [{ title: '', bullets: [''] }],
        });
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        // Abrir directamente la nueva entrada
        this.editExperienceEntry(this.data.experience.length - 1);
    },

    // ---- Projects (per-entry) ----
    editProjectsEntry(index) {
        const proj = this.data.projects[index];
        if (!proj) return;

        this.openModal('Editar Proyecto — ' + (proj.name || 'Nuevo'), [
            { key: 'name', label: 'Nombre del proyecto' },
            { key: 'role', label: 'Descripción', type: 'textarea', rows: 2 },
            { key: 'startDate', label: 'Fecha inicio' },
            { key: 'endDate', label: 'Fecha fin' },
            { key: 'bullets', label: 'Detalles', type: 'list' },
        ], proj, (vals) => {
            Object.assign(this.data.projects[index], vals);
        }, () => {
            if (confirm('¿Eliminar este proyecto?')) {
                this.data.projects.splice(index, 1);
                this.closeModal();
                renderCV(this.data);
                this.initSortable();
                this.pushHistory();
                this.saveData();
            }
        });
    },

    addProjectsEntry() {
        this.data.projects.push({
            name: '',
            role: '',
            startDate: '',
            endDate: '',
            bullets: [''],
        });
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        this.editProjectsEntry(this.data.projects.length - 1);
    },

    // ---- Education (per-entry) ----
    editEducationEntry(index) {
        const ed = this.data.education[index];
        if (!ed) return;

        this.openModal('Editar Formación — ' + (ed.degree || 'Nueva'), [
            { key: 'degree', label: 'Título / Grado' },
            { key: 'school', label: 'Institución' },
            { key: 'startDate', label: 'Fecha inicio' },
            { key: 'endDate', label: 'Fecha fin' },
        ], ed, (vals) => {
            Object.assign(this.data.education[index], vals);
        }, () => {
            if (confirm('¿Eliminar esta formación?')) {
                this.data.education.splice(index, 1);
                this.closeModal();
                renderCV(this.data);
                this.initSortable();
                this.pushHistory();
                this.saveData();
            }
        });
    },

    addEducationEntry() {
        this.data.education.push({
            degree: '',
            school: '',
            startDate: '',
            endDate: '',
        });
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        this.editEducationEntry(this.data.education.length - 1);
    },

    // ---- Links (per-entry) ----
    editLinksEntry(index) {
        const link = (this.data.links || [])[index] || {};
        this.openModal('Editar Link — ' + (link.label || 'Nuevo'), [
            { key: 'label', label: 'Nombre', placeholder: 'GitHub' },
            { key: 'url', label: 'URL', placeholder: 'https://...' },
            { key: 'icon', label: 'Tipo de ícono', type: 'select', options: [
                { value: 'github', label: 'GitHub' },
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'portfolio', label: 'Portafolio / Web' },
                { value: 'cert', label: 'Certificado' },
            ]},
        ], link, (vals) => {
            if (!this.data.links) this.data.links = [];
            if (this.data.links[index]) {
                Object.assign(this.data.links[index], vals);
            } else {
                this.data.links.push(vals);
            }
        }, () => {
            if (confirm('¿Eliminar este link?')) {
                this.data.links.splice(index, 1);
                this.closeModal();
                renderCV(this.data);
                this.initSortable();
                this.pushHistory();
                this.saveData();
            }
        });
    },

    chooseLinksEntry() {
        const links = this.data.links || [];
        if (links.length === 1) {
            this.editLinksEntry(0);
            return;
        }
        // Modal selector para elegir qué link editar
        const body = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'Editar Links — seleccionar';
        body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${links.map((link, i) => `
                    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;">
                        <span style="flex:1;min-width:0;">
                            <strong>${escapeHtml(link.label) || '<em style=color:#94a3b8>Sin nombre</em>'}</strong>
                            <span style="color:#64748b;font-size:0.82rem;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(link.url) || '<em>Sin URL</em>'}</span>
                        </span>
                        <span style="font-size:0.75rem;color:#94a3b8;text-transform:capitalize;">${escapeHtml(link.icon)}</span>
                        <button class="btn btn-save" style="padding:6px 12px;font-size:0.82rem;white-space:nowrap;" onclick="editor.closeModal(); editor.editLinksEntry(${i})"><i class="fas fa-pen"></i> Editar</button>
                    </div>
                `).join('')}
                <button class="btn btn-cancel" style="margin-top:4px;" onclick="editor.closeModal(); editor.addLinksEntry()"><i class="fas fa-plus"></i> Agregar link</button>
            </div>
        `;
        // Sin onSave, solo selector
        this.modalState = null;
        const footer = document.querySelector('.modal-footer');
        const deleteBtn = footer.querySelector('.btn-danger');
        if (deleteBtn) deleteBtn.remove();
        // Ocultar botón Guardar en modo selector
        const saveBtn = footer.querySelector('.btn-save');
        if (saveBtn) saveBtn.style.display = 'none';
        // Mostrar modal y restaurar Guardar al cerrar
        document.getElementById('edit-modal').style.display = 'flex';
        // Monkey-patch closeModal para restaurar footer
        const origClose = this.closeModal.bind(this);
        this.closeModal = () => {
            document.getElementById('edit-modal').style.display = 'none';
            this.modalState = null;
            if (saveBtn) saveBtn.style.display = '';
            this.closeModal = origClose;
        };
    },

    addLinksEntry() {
        if (!this.data.links) this.data.links = [];
        this.data.links.push({ label: '', url: '', icon: 'portfolio' });
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        this.editLinksEntry(this.data.links.length - 1);
    },

    editSkills() {
        const skills = this.data.skills;
        const fields = Object.entries(skills).map(([cat]) => ({
            key: cat, label: cat,
        }));

        this.openModal('Editar Stack / Habilidades', fields, skills, (vals) => {
            this.data.skills = vals;
        });
    },

    editLanguages() {
        this.openModal('Editar Idiomas', [
            { key: 'languages', label: 'Idiomas', placeholder: 'Español nativo · Inglés B2' },
        ], { languages: this.data.languages }, (vals) => {
            this.data.languages = vals.languages;
        });
    },

    // ---- Certifications (per-entry) ----
    editCertificationsEntry(index) {
        const cert = this.data.certifications[index];
        if (!cert) return;

        this.openModal('Editar Certificación — ' + (cert.title || 'Nueva'), [
            { key: 'title', label: 'Certificación / Acreditación' },
            { key: 'issuer', label: 'Institución / Emisor' },
            { key: 'year', label: 'Año' },
            { key: 'url', label: 'URL del certificado (opcional)', placeholder: 'https://...', type: 'url' },
        ], cert, (vals) => {
            Object.assign(this.data.certifications[index], vals);
        }, () => {
            if (confirm('¿Eliminar esta certificación?')) {
                this.data.certifications.splice(index, 1);
                this.closeModal();
                renderCV(this.data);
                this.initSortable();
                this.pushHistory();
                this.saveData();
            }
        });
    },

    addCertificationsEntry() {
        if (!this.data.certifications) this.data.certifications = [];
        this.data.certifications.push({ title: '', issuer: '', year: '', url: '' });
        renderCV(this.data);
        this.initSortable();
        this.pushHistory();
        this.saveData();
        this.editCertificationsEntry(this.data.certifications.length - 1);
    },

    // ---- Toast ----
    toast(msg) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },
};

// ---- Helpers ----
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return rgb;
    return '#' + match.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
}
