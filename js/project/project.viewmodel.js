/**
 * [MVVM : Project ViewModel]
 * Logique métier et coordination entre le modèle et la vue.
 */

const ProjectViewModel = {
    /**
     * Initialisation et chargement des projets.
     */
    async init() {
        try {
            const loadedProjects = await ProjectRepository.getAll();

            if (loadedProjects && loadedProjects.length > 0) {
                projects = loadedProjects;
                const savedId = await ProjectRepository.loadSetting('currentProjectId');

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
                project = ProjectModel.createDefault();
                window.project = project;
                projects = [project];
                currentProjectId = project.id;
                await ProjectRepository.save(project);
            }

            project = ProjectModel.ensureStructure(project);
            ProjectView.updateHeader(project.title);
            ProjectView.renderList(projects, currentProjectId);

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
        this.switchTo(newProject.id);
        ProjectView.closeProjectsModal();
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
        ProjectView.renderList(projects, currentProjectId);
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

        ProjectView.renderList(projects, currentProjectId);
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
                ProjectView.renderList(projects, currentProjectId);
                alert(Localization.t('project.viewmodel.import_success', [imported.title]));
            } catch (error) {
                alert(Localization.t('project.viewmodel.error_prefix') + error.message);
            }
        };
        reader.readAsText(file);
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
