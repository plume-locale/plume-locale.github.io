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
                    // 1. Vérifier si le projet est déjà injecté dans la page (plus fiable)
                    if (window.PLUME_DEMO_PROJECT) {
                        project = window.PLUME_DEMO_PROJECT;
                        console.log('✅ Projet de démo trouvé dans window.PLUME_DEMO_PROJECT');
                    } else {
                        // 2. Sinon, tentative de fetch classique (fallback)
                        const paths = [
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
        if (data.template === 'fantasy') {
            newProject.acts = [
                { id: Date.now(), title: Localization.t('project.viewmodel.template_fantasy_act1'), chapters: [] },
                { id: Date.now() + 1, title: Localization.t('project.viewmodel.template_fantasy_act2'), chapters: [] },
                { id: Date.now() + 2, title: Localization.t('project.viewmodel.template_fantasy_act3'), chapters: [] }
            ];
        } else if (data.template === 'thriller') {
            newProject.acts = [
                { id: Date.now(), title: Localization.t('project.viewmodel.template_thriller_act1'), chapters: [] },
                { id: Date.now() + 1, title: Localization.t('project.viewmodel.template_thriller_act2'), chapters: [] },
                { id: Date.now() + 2, title: Localization.t('project.viewmodel.template_thriller_act3'), chapters: [] }
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
     */
    switchTo(projectId) {
        currentProjectId = projectId;
        project = projects.find(p => p.id === projectId);
        window.project = project;

        if (!project) return;

        ProjectView.updateHeader(project.title);

        // Reset navigation state
        currentActId = null;
        currentChapterId = null;
        currentSceneId = null;

        if (typeof switchView === 'function') switchView('editor');
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
                this.switchTo(projects[0].id);
            } else {
                project = ProjectModel.createDefault();
                window.project = project;
                projects = [project];
                currentProjectId = project.id;
                await ProjectRepository.save(project);
                this.switchTo(project.id);
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
