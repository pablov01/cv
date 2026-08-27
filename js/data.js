// ================================================================
// CV Data — Estructura de datos del CV
// ================================================================

const SECTION_TYPES = {
    personal: {
        name: 'Datos Personales',
        icon: 'fas fa-user',
        singleton: true,
    },
    profile: {
        name: 'Perfil',
        icon: 'fas fa-align-left',
        singleton: true,
    },
    experience: {
        name: 'Experiencia',
        icon: 'fas fa-briefcase',
        singleton: true,
    },
    projects: {
        name: 'Proyectos',
        icon: 'fas fa-project-diagram',
        singleton: true,
    },
    skills: {
        name: 'Stack / Habilidades',
        icon: 'fas fa-cogs',
        singleton: true,
    },
    education: {
        name: 'Formación',
        icon: 'fas fa-graduation-cap',
        singleton: true,
    },
    certifications: {
        name: 'Certificaciones',
        icon: 'fas fa-certificate',
        singleton: false,
    },
    languages: {
        name: 'Idiomas',
        icon: 'fas fa-language',
        singleton: true,
    },
    links: {
        name: 'Links',
        icon: 'fas fa-link',
        singleton: true,
    },
};

function getDefaultData() {
    return {
        template: 'modern',
        color: '#8c4a2f',
        sections: ['personal', 'profile', 'experience', 'projects', 'skills', 'education', 'links', 'languages'],
        personal: {
            name: 'Pablo Sebastián Villalba Araujo',
            title: 'Desarrollador Full Stack · Laravel · PHP · DevOps · IA aplicada',
            email: 'psva001@gmail.com',
            phone: '+595 972 294 053',
            location: 'Asunción, Paraguay',
            github: 'pablov01',
            linkedin: 'pablov01',
            photo: null,
        },
        profile: 'Desarrollador full stack con experiencia construyendo sistemas de gestión para el sector financiero y de facturación electrónica en Paraguay y Perú. Trabajo el stack Laravel de punta a punta, diseño arquitecturas RAG con modelos de lenguaje locales e implemento flujos DevOps con Docker y CI/CD. Me enfoco en crear sistemas que funcionen en entornos reales, con atención a rendimiento, escalabilidad y mantenibilidad.',
        experience: [
            {
                company: 'Santa Rosa',
                role: 'Full Stack Developer',
                startDate: '2025',
                endDate: 'actual',
                projects: [
                    {
                        title: 'Sistemas de gestión interna',
                        bullets: [
                            'Desarrollo y mantenimiento de aplicaciones web con Laravel y Next.js',
                            'Integración de bases de datos PostgreSQL y flujos de automatización',
                        ],
                    }
                ]
            },
            {
                company: 'TECCOM S.R.L.',
                role: 'Full Stack Developer',
                startDate: '2022',
                endDate: '2025',
                projects: [
                    {
                        title: 'Sistema de Riesgo Crediticio para cooperativas · Perú',
                        bullets: [
                            'Módulos de análisis crediticio y scoring con Laravel y PostgreSQL',
                            'Plataforma utilizada por múltiples cooperativas en Perú',
                        ],
                    },
                    {
                        title: 'Sistema de Facturación Electrónica · SIFEN',
                        bullets: [
                            'Integración con el sistema SIFEN de facturación electrónica de Paraguay',
                            'Firma digital, generación de XML y comunicación con la SET',
                        ],
                    }
                ]
            }
        ],
        projects: [
            {
                name: 'sifenBot',
                role: 'Asistente conversacional sobre la normativa del SIFEN, con RAG y LLM local sobre GPU de 8 GB',
                startDate: '2026',
                endDate: 'en desarrollo',
                bullets: [
                    'Arquitectura híbrida Laravel 13 y FastAPI sobre PostgreSQL 15 con pgvector, Redis y Docker; recuperación vectorial y léxica con reranking y umbral de dominio',
                    '384 campos extraídos del Manual Técnico con 0 errores de parseo y 96 % de coincidencia contra los 47 esquemas XSD oficiales',
                ],
            },
            {
                name: 'Developer Portfolio',
                role: 'Portfolio personal con integración a la API de GitHub, diseño moderno y despliegue automatizado',
                startDate: '2025',
                endDate: 'activo',
                bullets: [
                    'Next.js, TypeScript, Tailwind CSS y GitHub API con cache de 1 hora',
                    'CI/CD con GitHub Actions para versionado automático y releases',
                ],
            },
            {
                name: 'DevOps Monitoring Stack',
                role: 'Entorno de observabilidad infraestructural con containerización y despliegues automatizados',
                startDate: '2024',
                endDate: 'activo',
                bullets: [
                    'Docker, Grafana, métricas y pipelines de CI/CD',
                    'Monitoreo de servidores Linux con alertas y dashboards',
                ],
            },
        ],
        skills: {
            Backend: 'PHP 8.3 · Laravel · Node.js · Python · APIs REST · Arquitectura de software',
            Frontend: 'Next.js · React · Vue · TypeScript · Blade · Livewire · Tailwind CSS',
            'Bases de datos': 'PostgreSQL · MySQL · MongoDB · Elasticsearch · Oracle',
            DevOps: 'Docker · Kubernetes · GitHub Actions · CI/CD · Linux · Infraestructura',
            IA: 'RAG · embeddings BGE-M3 · reranking · Ollama · LLMs locales',
            Herramientas: 'Git · GitHub · VSCode · Postman · Swagger · Power BI',
        },
        education: [
            {
                degree: 'Ingeniería Informática',
                school: 'Universidad de la Integración de las Américas',
                startDate: '2021',
                endDate: 'en curso',
            },
            {
                degree: 'Bachiller Técnico en Informática',
                school: 'Colegio Téc. Carlos Antonio López',
                startDate: '2018',
                endDate: '2020',
            }
        ],
        languages: 'Español nativo · Inglés ',
        links: [
            { label: 'GitHub', url: 'https://github.com/pablov01', icon: 'github' },
            { label: 'LinkedIn', url: 'https://linkedin.com/in/pablov01', icon: 'linkedin' },
            { label: 'Portafolio', url: 'https://pablovillalba.dev', icon: 'portfolio' },
            { label: 'Certificados', url: '', icon: 'cert' },
        ],
    };
}
