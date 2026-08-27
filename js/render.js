// ================================================================
// CV Render — Renderiza el CV desde los datos
// ================================================================

function renderCV(data) {
    const page = document.getElementById('cv-page');
    page.innerHTML = '';

    data.sections.forEach(sectionType => {
        const el = renderSection(sectionType, data);
        if (el) page.appendChild(el);
    });

    editor.updateSidebarActive(data);
    editor.updateSidebarAvailable(data);
}

function renderSection(type, data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cv-section';
    wrapper.dataset.section = type;

    // Controls
    const controls = document.createElement('div');
    controls.className = 'section-controls';
    controls.innerHTML = `
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
    section.innerHTML = '<h2>Experiencia</h2>';

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
    section.innerHTML = '<h2>Proyecto propio</h2>';

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
    section.innerHTML = '<h2>Stack</h2>';

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
    section.innerHTML = '<h2>Formación</h2>';

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
    section.innerHTML = `
        <div class="footer-line">
            <span>Idiomas: ${data.languages || '<span class="falta">[IDIOMAS]</span>'}</span>
            <span>Referencias a solicitud</span>
        </div>
    `;
    section.addEventListener('dblclick', () => editor.editLanguages());
    return section;
}

// ---- Links ----
const LINK_ICONS = {
    github: `<svg viewBox="-1 -1 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1C4.15 1 1 4.15 1 8c0 3.1 2 5.7 4.8 6.6.35.05.48-.15.48-.35v-1.2c-1.95.4-2.35-.95-2.35-.95-.3-.8-.85-.85-.85-.85-.6.05-.8.5-.8.5.5.8.4 1.25.4 1.25.5.85 1.3.6 1.65.45.05-.35.2-.6.35-.75-1.55-.2-3.2-.8-3.2-3.5 0-.8.3-1.45.75-1.95-.05-.2-.35-.95.05-2 0 0 .65-.2 2.1.75.6-.15 1.25-.25 1.9-.25.65 0 1.3.1 1.9.25 1.45-.95 2.1-.75 2.1-.75.35 1.05.05 1.8.05 2 .45.5.75 1.15.75 1.95 0 2.7-1.65 3.3-3.2 3.5.25.2.45.6.45 1.2v1.8c0 .2.13.4.48.35C13 13.7 15 11.1 15 8c0-3.85-3.15-7-7-7z"/></svg>`,
    linkedin: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="1.5" width="13" height="13" rx="2"/><path d="M4.5 7v4.5M4.5 4.5v.01M7.5 11.5V9c0-1.1.9-2 2-2s2 .9 2 2v2.5"/></svg>`,
    portfolio: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M5 3.5V2.5a1 1 0 011-1h4a1 1 0 011 1v1M1.5 7h13"/></svg>`,
    cert: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="3"/><path d="M5.5 8.5L4 14.5l4-2 4 2-1.5-6"/><path d="M11 4l1.5-1.5"/></svg>`,
};

function renderLinks(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>Links</h2>';

    const grid = document.createElement('div');
    grid.className = 'links-grid';

    const allLinks = data.links || [];

    allLinks.forEach((link, i) => {
        const item = document.createElement('span');
        item.className = 'link-item';
        if (link.url) {
            item.title = link.url;
            item.style.cursor = 'pointer';
        }

        const iconSvg = LINK_ICONS[link.icon] || LINK_ICONS.portfolio;

        item.innerHTML = `
            <span class="link-icon">${iconSvg}</span>
            <span class="link-label">${escapeHtml(link.label)}</span>
        `;

        if (!link.url) {
            item.title = 'Sin URL — doble clic para editar';
        }

        item.addEventListener('click', (e) => {
            if (link.url && e.detail === 1) {
                window.open(link.url, '_blank', 'noopener');
            }
        });

        item.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.editLinksEntry(i);
        });

        grid.appendChild(item);
    });

    // Botón agregar
    const addBtn = createAddButton('Agregar link', () => editor.addLinksEntry());
    addBtn.className += ' add-entry-btn-inline';

    section.appendChild(grid);
    section.appendChild(addBtn);

    section.addEventListener('dblclick', () => {
        if (allLinks.length > 0) {
            editor.editLinksEntry(0);
        } else {
            editor.addLinksEntry();
        }
    });
    return section;
}

// ---- Certifications ----
function renderCertifications(data) {
    const section = document.createElement('section');
    section.innerHTML = '<h2>Certificaciones</h2>';
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
