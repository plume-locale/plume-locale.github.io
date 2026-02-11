/**
 * [MVVM : Project ViewModel]
 * Logique métier et coordination entre le modèle et la vue.
 */

const ProjectViewModel = {
    /**
     * Mode d'affichage de la landing page (grid/table).
     */
    viewMode: localStorage.getItem('plume_projects_view_mode') || 'grid',

    /**
     * Change le mode d'affichage.
     */
    setViewMode(mode) {
        this.viewMode = mode;
        localStorage.setItem('plume_projects_view_mode', mode);
        ProjectView.renderLandingPage(projects);
    },
    /**
     * Initialisation et chargement des projets.
     */
    async init() {
        console.log('🚀 Initialisation du ProjectViewModel...');
        try {
            let loadedProjects = await ProjectRepository.getAll();
            console.log('🔍 Projets trouvés en base:', loadedProjects ? loadedProjects.length : 0);

            // Si un seul projet existe et c'est le projet par défaut vide "Mon Roman", 
            // on le considère comme "vide" pour forcer le chargement de la démo si possible.
            const isInitialDefault = loadedProjects && loadedProjects.length === 1 &&
                loadedProjects[0].title === Localization.t('project.model.default_title') &&
                (!loadedProjects[0].acts || loadedProjects[0].acts.length === 0);

            if (loadedProjects && loadedProjects.length > 0 && !isInitialDefault) {
                projects = loadedProjects;
                const savedId = await ProjectRepository.loadSetting('currentProjectId');
                console.log('📌 ID projet sauvegardé:', savedId);

                if (savedId) {
                    currentProjectId = savedId;
                    project = projects.find(p => p.id === savedId);
                    window.project = project;
                }

                if (!project && projects.length > 0) {
                    project = projects[0];
                    window.project = project;
                    currentProjectId = project.id;
                }
            } else {
                console.log('💡 Aucun projet (ou projet vide), tentative de chargement de demo/project.json...');

                // Tentative de chargement du projet de démo
                try {
                    const lang = Localization.getLocale();
                    console.log(`🌍 Premier lancement, chargement démo (${lang})`);

                    // 1. Vérifier si le projet est déjà injecté dans la page
                    // On ne l'utilise que si la langue correspond ou si c'est le seul choix
                    if (window.PLUME_DEMO_PROJECT && (lang === 'fr' || !lang)) {
                        project = window.PLUME_DEMO_PROJECT;
                        console.log('✅ Projet de démo trouvé dans window.PLUME_DEMO_PROJECT');
                    } else {
                        // 2. Sinon, tentative de fetch avec priorité à la langue
                        const paths = [
                            `./demo/project_${lang}.json`,
                            `demo/project_${lang}.json`,
                            './demo/project.json',
                            'demo/project.json',
                            '../demo/project.json'
                        ];
                        let response;
                        for (const p of paths) {
                            try {
                                response = await fetch(p);
                                if (response.ok) {
                                    console.log(`📡 Fetch réussi depuis: ${p}`);
                                    break;
                                }
                            } catch (err) { }
                        }

                        if (response && response.ok) {
                            project = await response.json();
                        } else if (window.PLUME_DEMO_PROJECT) {
                            project = window.PLUME_DEMO_PROJECT;
                        } else {
                            throw new Error('Démos introuvables via fetch');
                        }
                    }

                    if (project) {
                        // S'assurer qu'on ne garde pas un vieil ID qui pourrait entrer en conflit
                        if (!project.id || project.id === 'demo_project' || project.id === 1707519130000) {
                            project.id = Date.now();
                        }
                        console.log('✅ Projet de démo "' + project.title + '" chargé avec succès');
                    }
                } catch (e) {
                    console.warn('⚠️ Echec du chargement de la démo:', e.message);
                    console.log('ℹ️ Création du projet vide par défaut.');
                    project = ProjectModel.createDefault();
                }

                window.project = project;
                projects = [project];
                currentProjectId = project.id;

                // On écrase le projet par défaut précédent s'il existait
                await ProjectRepository.save(project);
                await ProjectRepository.saveSetting('currentProjectId', currentProjectId);
            }

            project = ProjectModel.ensureStructure(project);
            ProjectView.updateHeader(project.title);
            ProjectView.renderSidebarList(projects);

            if (currentView === 'projects') {
                ProjectView.renderLandingPage(projects);
            }

            console.log('✅ Projets chargés:', projects.length);
        } catch (error) {
            console.error('❌ Erreur chargement projets:', error);
            project = ProjectModel.createDefault();
            window.project = project;
        }
    },

    /**
     * Sauvegarde l'état actuel des projets.
     */
    async saveAll() {
        try {
            if (currentProjectId) {
                const index = projects.findIndex(p => p.id === currentProjectId);
                if (index >= 0) {
                    projects[index] = { ...project, updatedAt: new Date().toISOString() };
                }
            }

            for (const proj of projects) {
                await ProjectRepository.save(proj);
            }

            await ProjectRepository.saveSetting('currentProjectId', currentProjectId);
        } catch (error) {
            console.error('❌ Erreur sauvegarde projets:', error);
        }
    },

    /**
     * Crée un nouveau projet.
     */
    async create(data) {
        if (!data.title) {
            alert(Localization.t('project.viewmodel.alert_title_required'));
            return;
        }

        const newProject = ProjectModel.createDefault();
        newProject.title = data.title;
        newProject.description = data.description || "";
        newProject.genre = data.genre || "";

        // Application du template
        if (data.template && ProjectTemplates[data.template]) {
            const template = ProjectTemplates[data.template];
            const timestamp = Date.now();

            // 1. Génération de la structure (Actes / Chapitres / Scènes)
            // Note : Pour la structure, on garde des nombres car certains modules font du parseInt()
            newProject.acts = template.acts.map((actTemplate, actIdx) => ({
                id: timestamp + (actIdx * 1000),
                title: actTemplate.title,
                chapters: actTemplate.chapters.map((chapTemplate, chapIdx) => ({
                    id: timestamp + (actIdx * 1000) + chapIdx + 1,
                    title: chapTemplate.title,
                    summary: chapTemplate.description || "",
                    scenes: [
                        {
                            id: timestamp + (actIdx * 10000) + (chapIdx * 100) + 1,
                            title: Localization.t('search.default.untitled'),
                            content: `<i>Note de template : ${chapTemplate.description || ""}</i><br><br>`,
                            status: 'draft',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ]
                }))
            }));

            // 2. Génération du Plot Grid si défini dans le template
            if (template.plotGrid) {
                newProject.plotGrid = {
                    rows: [],
                    columns: [],
                    cards: [],
                    settings: { showStructure: true, syncEnabled: true }
                };

                // Colonne Structure (obligatoire pour le sync)
                newProject.plotGrid.columns.push({
                    id: 'pg_col_struct',
                    type: 'structure',
                    title: Localization.t('nav.structure'),
                    order: 0,
                    width: 250
                });

                // Colonnes additionnelles du template
                const columnIds = ['pg_col_struct'];
                if (template.plotGrid.columns) {
                    template.plotGrid.columns.forEach((colTitle, idx) => {
                        const colId = 'pg_col_' + (idx + 1) + '_' + timestamp;
                        columnIds.push(colId);
                        newProject.plotGrid.columns.push({
                            id: colId,
                            type: 'custom',
                            title: colTitle,
                            order: idx + 1,
                            width: 250
                        });
                    });
                }

                // Génération des cartes exemples si définies
                if (template.plotGrid.cards && typeof PlotGridModel !== 'undefined') {
                    template.plotGrid.cards.forEach(cardTemplate => {
                        const actIdx = cardTemplate.actIndex || 0;
                        const chapIdx = cardTemplate.chapterIndex || 0;
                        const colIdx = cardTemplate.columnIndex || 0;

                        // Retrouver l'ID de la scène correspondante (basé sur la logique de création ci-dessus)
                        // Note : Par défaut un template crée 1 scène par chapitre
                        const sceneId = timestamp + (actIdx * 10000) + (chapIdx * 100) + 1;
                        const colId = columnIds[colIdx];

                        if (colId) {
                            const card = PlotGridModel.createCard({
                                id: 'pg_card_' + timestamp + '_' + Math.random().toString(36).substr(2, 5),
                                rowId: String(sceneId), // Les scènes servent de lignes en mode sync
                                colId: colId,
                                title: cardTemplate.title || "",
                                content: cardTemplate.content || ""
                            });
                            newProject.plotGrid.cards.push(card);
                        }
                    });
                }
            }

            // 3. Génération des personnages (Archetypes)
            if (template.characters && typeof CharacterModel !== 'undefined') {
                template.characters.forEach((charTemplate, idx) => {
                    const character = CharacterModel.create({
                        id: String(timestamp + (idx * 500)), // ID en STRING pour le CRUD
                        name: charTemplate.name,
                        role: charTemplate.role,
                        description: charTemplate.description || ""
                    });
                    newProject.characters.push(character);
                });
            }

            // 4. Génération de l'Univers (Lieux/Eléments)
            if (template.world && typeof WorldModel !== 'undefined') {
                template.world.forEach((worldTemplate, idx) => {
                    const element = WorldModel.create({
                        id: String(timestamp + (idx * 600)), // ID en STRING
                        name: worldTemplate.name,
                        type: worldTemplate.type || 'Lieu',
                        description: worldTemplate.description || ""
                    });
                    newProject.world.push(element);
                });
            }

            // 5. Génération du Codex (Lore)
            if (template.codex && typeof CodexModel !== 'undefined') {
                template.codex.forEach((codexTemplate, idx) => {
                    const entry = CodexModel.create({
                        id: String(timestamp + (idx * 700)), // ID en STRING
                        title: codexTemplate.title,
                        category: codexTemplate.category || 'Autre',
                        summary: codexTemplate.summary || ""
                    });
                    newProject.codex.push(entry);
                });
            }
        } else {
            // Structure par défaut si aucun template
            newProject.acts = [
                { id: Date.now(), title: Localization.t('search.default.act') + " 1", chapters: [] }
            ];
        }

        projects.push(newProject);
        await this.saveAll();

        ProjectView.closeNewModal();

        if (currentView === 'projects') {
            ProjectView.renderLandingPage(projects);
        } else {
            this.switchTo(newProject.id);
        }
    },

    /**
     * Change le projet actif.
     * @param {number} projectId 
     * @param {boolean} shouldSwitchView Si true, bascule vers la vue éditeur.
     */
    switchTo(projectId, shouldSwitchView = true) {
        currentProjectId = projectId;
        project = projects.find(p => p.id === projectId);
        window.project = project;

        if (!project) return;

        ProjectView.updateHeader(project.title);

        // Reset navigation state
        currentActId = null;
        currentChapterId = null;
        currentSceneId = null;

        if (shouldSwitchView && typeof switchView === 'function') switchView('editor');
        if (typeof renderActsList === 'function') renderActsList();
        if (typeof refreshAllViews === 'function') refreshAllViews();

        localStorage.setItem('plume_locale_current_project', projectId);
        ProjectView.renderSidebarList(projects);

        if (currentView === 'projects') {
            ProjectView.renderLandingPage(projects);
        }
    },

    /**
     * Supprime un projet.
     */
    async delete(projectId) {
        const proj = projects.find(p => p.id === projectId);
        if (!proj) return;

        if (!confirm(Localization.t('project.viewmodel.confirm_delete', [proj.title]))) return;

        projects = projects.filter(p => p.id !== projectId);
        await ProjectRepository.delete(projectId);
        await ProjectRepository.saveSetting('currentProjectId', currentProjectId);

        if (currentProjectId === projectId) {
            if (projects.length > 0) {
                this.switchTo(projects[0].id, false);
            } else {
                project = ProjectModel.createDefault();
                window.project = project;
                projects = [project];
                currentProjectId = project.id;
                await ProjectRepository.save(project);
                this.switchTo(project.id, false);
            }
        }

        ProjectView.renderSidebarList(projects);
        if (currentView === 'projects') {
            ProjectView.renderLandingPage(projects);
        }
    },

    /**
     * Exporte un projet en JSON.
     */
    export(projectId) {
        const proj = projects.find(p => p.id === projectId);
        if (!proj) return;

        const dataStr = JSON.stringify(proj, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${proj.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Ouvre le menu de sauvegarde pour un projet spécifique.
     */
    backup(projectId) {
        const proj = projects.find(p => p.id === projectId);
        if (!proj) return;

        // On définit temporairement ce projet comme actif pour le modal de backup
        window.project = proj;

        if (typeof ImportExportViewModel !== 'undefined') {
            ImportExportViewModel.showBackupMenu();
        }
    },

    /**
     * Gère l'import d'un projet.
     */
    async import(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!imported.title) throw new Error(Localization.t('project.viewmodel.import_invalid_format'));

                imported.id = Date.now();
                // imported.title += Localization.t('project.viewmodel.import_suffix'); // Removed as per user request
                imported.createdAt = new Date().toISOString();
                imported.updatedAt = new Date().toISOString();

                projects.push(imported);
                await this.saveAll();
                ProjectView.renderSidebarList(projects);
                if (currentView === 'projects') {
                    ProjectView.renderLandingPage(projects);
                }
                alert(Localization.t('project.viewmodel.import_success', [imported.title]));
            } catch (error) {
                alert(Localization.t('project.viewmodel.error_prefix') + error.message);
            }
        };
        reader.readAsText(file);
    },

    /**
     * Déclenche le sélecteur de fichier pour l'import.
     */
    importHandler() {
        document.getElementById('importProjectFile')?.click();
    },

    /**
     * Importe le projet de démo.
     */
    async importDemo() {
        console.log('📡 Tentative d\'import de la démo...');
        try {
            const lang = Localization.getLocale();
            console.log(`🌍 Langue actuelle : ${lang}`);

            let demoProj = null;

            // Chemins à tester, priorité à la langue actuelle
            const paths = [
                `demo/project_${lang}.json`,
                `demo/projet_${lang}.json`,
                'demo/project.json',
                'demo/projet.json',
                '../demo/project.json'
            ];

            for (const path of paths) {
                try {
                    console.log(`🔍 Test du chemin : ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        demoProj = await response.json();
                        console.log(`✅ Démo trouvée à : ${path}`);
                        break;
                    }
                } catch (e) {
                    // On continue vers le chemin suivant
                }
            }

            if (!demoProj && window.PLUME_DEMO_PROJECT) {
                console.log('💡 Utilisation de la démo injectée (fallback)');
                demoProj = window.PLUME_DEMO_PROJECT;
            }

            if (!demoProj || !demoProj.title) throw new Error('Démo introuvable ou invalide');

            // On crée une copie profonde pour éviter de modifier l'original
            const newProject = JSON.parse(JSON.stringify(demoProj));
            newProject.id = Date.now();
            newProject.createdAt = new Date().toISOString();
            newProject.updatedAt = new Date().toISOString();

            // S'assurer que projects est défini
            if (typeof projects === 'undefined') projects = [];

            projects.push(newProject);
            await this.saveAll();

            ProjectView.renderSidebarList(projects);
            if (currentView === 'projects') {
                ProjectView.renderLandingPage(projects);
            }

            alert(Localization.t('project.viewmodel.import_success', [newProject.title]));
        } catch (error) {
            console.error('❌ Erreur import démo:', error);
            alert(Localization.t('project.viewmodel.import_error', [error.message]));
        }
    },

    /**
     * Récupère le texte pour l'analyse selon la portée.
     */
    getTextForAnalysis(scope) {
        if (scope === 'current' && currentSceneId) {
            const act = project.acts.find(a => a.id === currentActId);
            if (!act) return '';
            const chapter = act.chapters.find(c => c.id === currentChapterId);
            if (!chapter) return '';
            const scene = chapter.scenes.find(s => s.id === currentSceneId);
            if (!scene) return '';
            return ProjectModel.stripHTML(scene.content);
        } else if (scope === 'chapter') {
            let chap;
            if (!currentChapterId) {
                if (project.acts.length > 0 && project.acts[0].chapters.length > 0) {
                    chap = project.acts[0].chapters[0];
                }
            } else {
                const act = project.acts.find(a => a.id === currentActId);
                if (act) chap = act.chapters.find(c => c.id === currentChapterId);
            }
            if (!chap) return '';
            return chap.scenes.map(s => ProjectModel.stripHTML(s.content)).join('\n\n');
        } else if (scope === 'act') {
            let act;
            if (!currentActId) {
                if (project.acts.length > 0) act = project.acts[0];
            } else {
                act = project.acts.find(a => a.id === currentActId);
            }
            if (!act) return '';
            return act.chapters.flatMap(ch => ch.scenes.map(s => ProjectModel.stripHTML(s.content))).join('\n\n');
        } else if (scope === 'all') {
            return project.acts.flatMap(a => a.chapters.flatMap(ch => ch.scenes.map(s => ProjectModel.stripHTML(s.content)))).join('\n\n');
        }
        return '';
    },

    /**
     * Lance l'analyse du texte.
     */
    runAnalysis() {
        const scope = document.getElementById('analysisScope')?.value || 'current';
        const text = this.getTextForAnalysis(scope);

        if (!text || text.trim().length === 0) {
            ProjectView.renderAnalysisEmpty();
            return;
        }

        const analysis = {
            wordCount: typeof getWordCount === 'function' ? getWordCount(text) : text.trim().split(/\s+/).length,
            repetitions: ProjectModel.detectRepetitions(text),
            readability: ProjectModel.calculateReadability(text),
            wordFrequency: ProjectModel.calculateWordFrequency(text),
            sentenceLength: ProjectModel.calculateSentenceLength(text),
            narrativeDistribution: ProjectModel.analyzeNarrativeDistribution(text)
        };

        ProjectView.displayAnalysisResults(analysis);
    }
};
