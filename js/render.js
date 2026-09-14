// ================================================================
// CV Render — Renderiza el CV desde los datos
// ================================================================

const mmToPx = mm => mm * (96 / 25.4);

function renderCV(data) {
    const host = document.getElementById('cv-pages');
    const templateClass = 'cv-page template-' + (data.template || 'modern');
    host.innerHTML = '';

    const sections = [];
    data.sections.forEach(sectionType => {
        const el = renderSection(sectionType, data);
        if (el) sections.push(el);
    });

    paginate(host, sections, templateClass);

    editor.updateSidebarActive(data);
    editor.updateSidebarAvailable(data);
}

// ---- Paginación en hojas A4 ----
function paginate(host, sections, templateClass) {
    let current = null;

    function newPage() {
        const p = document.createElement('div');
        p.className = templateClass;
        host.appendChild(p);
        current = p;
        return p;
    }

    function pageMetrics(page) {
        const cs = getComputedStyle(page);
        const padTop = parseFloat(cs.paddingTop) || mmToPx(12);
        const padBottom = parseFloat(cs.paddingBottom) || mmToPx(9);
        const gap = parseFloat(cs.rowGap || cs.gap) || mmToPx(3.6);
        const height = parseFloat(cs.height) || mmToPx(297);
        // Margen de seguridad de 2mm para absorber cambios de métricas de fuente
        return { contentH: height - padTop - padBottom - mmToPx(2), gap };
    }

    function usedHeight(page, gap) {
        const kids = Array.from(page.children).filter(c => c.classList.contains('cv-section'));
        if (!kids.length) return 0;
        return kids.reduce((s, c) => s + c.offsetHeight, 0) + gap * (kids.length - 1);
    }

    function fitsOn(page, el, gap, contentH) {
        page.appendChild(el);
        const ok = usedHeight(page, gap) <= contentH;
        if (!ok) page.removeChild(el);
        return ok;
    }

    function splitSection(sec, gap, contentH) {
        // La página current está vacía; se coloca la sección para poder medir
        current.appendChild(sec);

        const inner = Array.from(sec.children).find(el =>
            el.tagName && el.tagName.toLowerCase() !== 'button' && !el.classList.contains('section-controls')
        );
        if (!inner) return; // se queda tal cual en la hoja actual

        const blocks = Array.from(inner.children);
        const addBtn = blocks.find(b => b.classList.contains('add-entry-btn'));
        const contentBlocks = blocks.filter(b => b !== addBtn);

        if (!contentBlocks.length) return;

        // Partir por bloques (puestos, filas de formación, etc.) que no se cortan
        const groups = [];
        let cur = [];
        let curH = 0;
        contentBlocks.forEach(b => {
            const h = b.offsetHeight || mmToPx(10);
            const need = (cur.length ? gap : 0) + h;
            if (cur.length && curH + need > contentH) {
                groups.push(cur);
                cur = [b];
                curH = h;
            } else {
                cur.push(b);
                curH += need;
            }
        });
        if (cur.length) groups.push(cur);

        if (addBtn && groups.length) groups[groups.length - 1].push(addBtn);

        // Quitar la sección original; la hoja actual queda libre para el primer fragmento
        current.removeChild(sec);

        groups.forEach((group, gi) => {
            const w = document.createElement('div');
            w.className = 'cv-section';
            if (gi > 0) w.classList.add('cv-section-fragment');
            w.dataset.section = sec.dataset.section;

            const innerEl = document.createElement(inner.tagName);
            innerEl.className = inner.className;
            group.forEach(b => innerEl.appendChild(b));
            w.appendChild(innerEl);

            if (gi === 0) {
                const ctrls = sec.querySelector('.section-controls');
                if (ctrls) w.appendChild(ctrls);
            }

            w.addEventListener('dblclick', () => editor.editSection(sec.dataset.section));

            if (gi === 0) {
                current.appendChild(w);
            } else {
                newPage();
                current.appendChild(w);
            }
        });
    }

    if (!sections.length) { newPage(); return; }

    newPage();
    const m = pageMetrics(current);

    sections.forEach(sec => {
        // Intentar en la página actual
        if (fitsOn(current, sec, m.gap, m.contentH)) return;
        // No cabe: probar en una hoja nueva
        newPage();
        if (fitsOn(current, sec, m.gap, m.contentH)) return;
        // La sección es más alta que una hoja completa: partirla
        newPage();
        splitSection(sec, m.gap, m.contentH);
    });

    // Quitar hojas vacías sobrantes
    Array.from(host.querySelectorAll(':scope > .cv-page')).forEach(p => {
        if (!p.querySelector(':scope > .cv-section')) p.remove();
    });
}

function renderSection(type, data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cv-section';
    wrapper.dataset.section = type;

    // Controls
    const controls = document.createElement('div');
    controls.className = 'section-controls';
    controls.innerHTML = `
        <button class="section-control-btn edit-btn" title="Editar sección" onclick="editor.editSection('${type}')"><i class="fas fa-pen"></i></button>
        <button class="section-control-btn move-btn" title="Mover"><i class="fas fa-grip-vertical"></i></button>
        <button class="section-control-btn delete-btn" title="Eliminar sección" onclick="editor.removeSection('${type}')"><i class="fas fa-times"></i></button>
    `;
    wrapper.appendChild(controls);

    switch (type) {
        case 'personal':    wrapper.appendChild(renderPersonal(data)); break;
        case 'profile':     wrapper.appendChild(renderProfile(data)); break;
        case 'experience':  wrapper.appendChild(renderExperience(data)); break;
        case 'projects':    wrapper.appendChild(renderProjects(data)); break;
        case 'skills':      wrapper.appendChild(renderSkills(data)); break;
        case 'education':   wrapper.appendChild(renderEducation(data)); break;
        case 'languages':   wrapper.appendChild(renderLanguages(data)); break;
        case 'links':       wrapper.appendChild(renderLinks(data)); break;
        case 'certifications': wrapper.appendChild(renderCertifications(data)); break;
    }

    return wrapper;
}

// ---- Personal ----
function renderPersonal(data) {
    const d = data.personal;
    const el = document.createElement('header');
    el.className = 'encabezado';
    el.innerHTML = `
        ${d.photo ? `<img class="foto" src="${d.photo}" alt="${d.name}">` : ''}
        <div class="identidad">
            <h1>${d.name || '<span class="falta">[NOMBRE]</span>'}</h1>
            <div class="cargo">${d.title || '<span class="falta">[TÍTULO]</span>'}</div>
            <div class="contacto">
                ${d.location ? `<span>${d.location}</span>` : ''}
                ${d.phone ? `<span>${d.phone}</span>` : ''}
                ${d.email ? `<a href="mailto:${d.email}">${d.email}</a>` : ''}
                ${d.github ? `<a href="https://github.com/${d.github}" target="_blank">github.com/${d.github}</a>` : ''}
                ${d.linkedin ? `<a href="https://linkedin.com/in/${d.linkedin}" target="_blank">linkedin.com/in/${d.linkedin}</a>` : ''}
            </div>
        </div>
    `;
    el.addEventListener('dblclick', () => editor.editPersonal());
    return el;
}

// ---- Profile ----
function renderProfile(data) {
    const el = document.createElement('p');
    el.className = 'perfil';
    el.textContent = data.profile || '';
    el.addEventListener('dblclick', () => editor.editProfile());
    return el;
}

// ---- Experience ----
function renderExperience(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>' + (typeof i18n !== 'undefined' ? i18n('cv.sections.experience','Experiencia') : 'Experiencia') + '</h2>';

    data.experience.forEach((exp, i) => {
        const job = document.createElement('div');
        job.className = 'puesto';
        job.innerHTML = `
            <div class="fila">
                <span class="empresa">${exp.company || '<span class="falta">[EMPRESA]</span>'}</span>
                <span class="fecha">${formatDateRange(exp.startDate, exp.endDate)}</span>
            </div>
            ${exp.role ? `<div class="rol">${exp.role}</div>` : ''}
        `;

        // Botón editar en cada puesto
        const editBtn = document.createElement('button');
        editBtn.className = 'entry-edit-btn';
        editBtn.title = 'Editar este puesto';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.onclick = (e) => { e.stopPropagation(); editor.editExperienceEntry(i); };
        job.style.position = 'relative';
        job.appendChild(editBtn);

        exp.projects.forEach((proj, j) => {
            const projEl = document.createElement('div');
            projEl.className = 'proyecto';
            let html = '';
            if (proj.title) html += `<div class="titulo">${proj.title}</div>`;
            if (proj.bullets && proj.bullets.length > 0 && proj.bullets.some(b => b.trim())) {
                html += '<ul>' + proj.bullets.filter(b => b.trim()).map(b => `<li>${b}</li>`).join('') + '</ul>';
            }
            projEl.innerHTML = html;
            job.appendChild(projEl);
        });

        section.appendChild(job);
    });

    // Botón agregar
    const addBtn = createAddButton('Agregar experiencia', () => editor.addExperienceEntry());
    section.appendChild(addBtn);

    section.addEventListener('dblclick', () => editor.editExperienceEntry(0));
    return section;
}

// ---- Projects ----
function renderProjects(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>' + (typeof i18n !== 'undefined' ? i18n('cv.sections.projects','Proyecto propio') : 'Proyecto propio') + '</h2>';

    data.projects.forEach((proj, i) => {
        const el = document.createElement('div');
        el.className = 'puesto';
        el.innerHTML = `
            <div class="fila">
                <span class="empresa">${proj.name || '<span class="falta">[NOMBRE]</span>'}</span>
                <span class="fecha">${formatDateRange(proj.startDate, proj.endDate)}</span>
            </div>
            ${proj.role ? `<div class="rol">${proj.role}</div>` : ''}
            ${proj.bullets && proj.bullets.length && proj.bullets.some(b => b.trim()) ?
                '<ul>' + proj.bullets.filter(b => b.trim()).map(b => `<li>${b}</li>`).join('') + '</ul>' : ''}
        `;

        const editBtn = document.createElement('button');
        editBtn.className = 'entry-edit-btn';
        editBtn.title = 'Editar este proyecto';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.onclick = (e) => { e.stopPropagation(); editor.editProjectsEntry(i); };
        el.style.position = 'relative';
        el.appendChild(editBtn);

        section.appendChild(el);
    });

    const addBtn = createAddButton('Agregar proyecto', () => editor.addProjectsEntry());
    section.appendChild(addBtn);

    section.addEventListener('dblclick', () => editor.editProjectsEntry(0));
    return section;
}

// ---- Skills ----
function renderSkills(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>' + (typeof i18n !== 'undefined' ? i18n('cv.sections.skills','Stack') : 'Stack') + '</h2>';

    const dl = document.createElement('dl');
    dl.className = 'stack';

    Object.entries(data.skills).forEach(([cat, items]) => {
        dl.innerHTML += `<dt>${cat}</dt><dd>${items}</dd>`;
    });

    section.appendChild(dl);
    section.addEventListener('dblclick', () => editor.editSkills());
    return section;
}

// ---- Education ----
function renderEducation(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>' + (typeof i18n !== 'undefined' ? i18n('cv.sections.education','Formación') : 'Formación') + '</h2>';

    const div = document.createElement('div');
    div.className = 'formacion';

    data.education.forEach((ed, i) => {
        const row = document.createElement('div');
        row.className = 'fila';
        row.style.position = 'relative';
        row.innerHTML = `
            <span><strong>${ed.degree || '<span class="falta">[TÍTULO]</span>'}</strong> · ${ed.school || '<span class="falta">[INSTITUCIÓN]</span>'}</span>
            <span class="fecha">${formatDateRange(ed.startDate, ed.endDate)}</span>
        `;

        const editBtn = document.createElement('button');
        editBtn.className = 'entry-edit-btn';
        editBtn.title = 'Editar esta formación';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.onclick = (e) => { e.stopPropagation(); editor.editEducationEntry(i); };
        row.appendChild(editBtn);

        div.appendChild(row);
    });

    section.appendChild(div);

    const addBtn = createAddButton('Agregar formación', () => editor.addEducationEntry());
    section.appendChild(addBtn);

    section.addEventListener('dblclick', () => editor.editEducationEntry(0));
    return section;
}

// ---- Languages ----
function renderLanguages(data) {
    const section = document.createElement('section');
    const langLabel = typeof i18n !== 'undefined' ? i18n('cv.sections.languages','Idiomas') : 'Idiomas';
    const refLabel = typeof i18n !== 'undefined' ? i18n('referencia','Referencias a solicitud') : 'Referencias a solicitud';
    section.innerHTML = `
        <div class="footer-line">
            <span>${langLabel}: ${data.languages || '<span class="falta">[IDIOMAS]</span>'}</span>
            <span>${refLabel}</span>
        </div>
    `;
    section.addEventListener('dblclick', () => editor.editLanguages());
    return section;
}

// ---- Links ----
const LINK_ICONS = {
    github: `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 1C4.19 1 1 4.19 1 8c0 3.09 2 5.71 4.77 6.64.35.06.47-.15.47-.33v-1.15c-1.94.42-2.35-.94-2.35-.94-.32-.8-.77-1.02-.77-1.02-.63-.43.05-.42.05-.42.7.05 1.06.71 1.06.71.62 1.06 1.62.76 2.02.58.06-.45.24-.76.44-.93-1.55-.18-3.17-.78-3.17-3.47 0-.77.27-1.39.72-1.88-.07-.18-.31-.9.07-1.88 0 0 .59-.19 1.93.72a6.6 6.6 0 0 1 3.54 0c1.34-.91 1.93-.72 1.93-.72.38.98.14 1.7.07 1.88.45.49.72 1.11.72 1.88 0 2.7-1.63 3.29-3.18 3.47.25.21.47.63.47 1.28v1.89c0 .18.12.39.48.33A6.7 6.7 0 0 0 15 8c0-3.81-3.19-8-7-8z"/></svg>`,
    linkedin: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="1.5" width="13" height="13" rx="2"/><path d="M4.5 7v4.5M4.5 4.5v.01M7.5 11.5V9c0-1.1.9-2 2-2s2 .9 2 2v2.5"/></svg>`,
    portfolio: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M5 3.5V2.5a1 1 0 011-1h4a1 1 0 011 1v1M1.5 7h13"/></svg>`,
    cert: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="3"/><path d="M5.5 8.5L4 14.5l4-2 4 2-1.5-6"/><path d="M11 4l1.5-1.5"/></svg>`,
};

function renderLinks(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>' + (typeof i18n !== 'undefined' ? i18n('cv.sections.links','Links') : 'Links') + '</h2>';

    const grid = document.createElement('div');
    grid.className = 'links-grid';

    const allLinks = data.links || [];

    allLinks.forEach((link, i) => {
        const iconSvg = LINK_ICONS[link.icon] || LINK_ICONS.portfolio;

        const wrapper = document.createElement('div');
        wrapper.className = 'link-item-wrapper';
        wrapper.style.cssText = 'position:relative;display:inline-flex;';

        const item = document.createElement(link.url ? 'a' : 'span');
        item.className = 'link-item';
        if (link.url) {
            item.href = link.url;
            item.target = '_blank';
            item.rel = 'noopener';
            item.title = link.url;
        } else {
            item.title = 'Sin URL — clic en lápiz para editar';
        }

        item.innerHTML = `
            <span class="link-icon">${iconSvg}</span>
            <span class="link-label">${escapeHtml(link.label)}</span>
        `;

        item.addEventListener('click', (e) => {
            if (link.url) e.preventDefault();
            if (link.url && e.detail === 1) {
                window.open(link.url, '_blank', 'noopener');
            }
        });

        item.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.editLinksEntry(i);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'entry-edit-btn';
        editBtn.title = 'Editar este link';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.style.cssText = 'top:-6px;right:-6px;';
        editBtn.onclick = (e) => { e.stopPropagation(); editor.editLinksEntry(i); };
        wrapper.appendChild(item);
        wrapper.appendChild(editBtn);

        grid.appendChild(wrapper);
    });

    // Botón agregar
    const addBtn = createAddButton('Agregar link', () => editor.addLinksEntry());
    addBtn.className += ' add-entry-btn-inline';

    section.appendChild(grid);
    section.appendChild(addBtn);

    section.addEventListener('dblclick', () => {
        if (allLinks.length > 0) {
            editor.chooseLinksEntry();
        } else {
            editor.addLinksEntry();
        }
    });
    return section;
}

// ---- Certifications ----
function renderCertifications(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>' + (typeof i18n !== 'undefined' ? i18n('cv.sections.certifications','Certificaciones') : 'Certificaciones') + '</h2>';

    const div = document.createElement('div');
    div.className = 'formacion';

    (data.certifications || []).forEach((cert, i) => {
        const row = document.createElement('div');
        row.className = 'fila';
        row.style.position = 'relative';

        const titleText = cert.title ? escapeHtml(cert.title) : '<span class="falta">[CERTIFICACIÓN]</span>';
        const titleHtml = cert.url
            ? `<a class="cert-link" href="${escapeHtml(cert.url)}" target="_blank" rel="noopener">${titleText}<svg class="cert-link-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5L14 2M14 2H8.5M14 2v5.5"/><path d="M13 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h4"/></svg></a>`
            : titleText;

        row.innerHTML = `
            <span><strong>${titleHtml}</strong>
                ${cert.issuer ? `<span class="cert-issuer">${escapeHtml(cert.issuer)}</span>` : ''}</span>
            <span class="fecha">${cert.year || ''}</span>
        `;

        const editBtn = document.createElement('button');
        editBtn.className = 'entry-edit-btn';
        editBtn.title = 'Editar esta certificación';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.onclick = (e) => { e.stopPropagation(); editor.editCertificationsEntry(i); };
        row.appendChild(editBtn);

        div.appendChild(row);
    });

    section.appendChild(div);

    const addBtn = createAddButton('Agregar certificación', () => editor.addCertificationsEntry());
    section.appendChild(addBtn);

    section.addEventListener('dblclick', () => {
        if ((data.certifications || []).length > 0) {
            editor.editCertificationsEntry(0);
        } else {
            editor.addCertificationsEntry();
        }
    });
    return section;
}

// ---- Helpers ----
function formatDateRange(start, end) {
    if (!start && !end) return '<span class="falta">[FECHAS]</span>';
    if (start && end) return `${start} — ${end}`;
    if (start) return `${start} — actual`;
    return end;
}

function createAddButton(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'add-entry-btn';
    btn.innerHTML = `<i class="fas fa-plus"></i> ${label}`;
    btn.onclick = (e) => { e.stopPropagation(); onClick(); };
    return btn;
}
