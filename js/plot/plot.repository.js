/**
 * Repository pour le module Plot
 * Gère le stockage et la récupération des points d'intrigue.
 */
class PlotRepository {
    constructor() {
        this._plotPoints = [];
    }

    /**
     * Récupère tous les points d'intrigue.
     * @returns {Array<PlotPoint>} Liste des points
     */
    getAll() {
        return this._plotPoints;
    }

    /**
     * Définit la liste des points d'intrigue.
     * @param {Array<PlotPoint>} points 
     */
    setAll(points) {
        this._plotPoints = points;
        // Synchroniser avec la variable globale pour compatibilité descendante si nécessaire
        if (typeof plotPoints !== 'undefined') {
            // On vide le tableau global et on le remplit
            plotPoints.length = 0;
            // On ne peut pas réassigner plotPoints si c'est const, mais c'est sûrement let/var ou un tableau mutable
            points.forEach(p => plotPoints.push(p));
        }
    }

    /**
     * Vide la liste des points.
     */
    clear() {
        this._plotPoints = [];
        if (typeof plotPoints !== 'undefined') {
            plotPoints.length = 0;
        }
    }

    /**
     * Ajoute un point à la liste.
     * @param {PlotPoint} point 
     */
    add(point) {
        this._plotPoints.push(point);
    }

    /**
     * Génère les points d'intrigue à partir des données du projet.
     * @param {Object} projectData - L'objet projet global (project)
     */
    generateFromProject(projectData) {
        if (!projectData || !projectData.acts) return;

        const points = [];
        let position = 0;
        const totalActs = projectData.acts.length;

        projectData.acts.forEach((act, actIndex) => {
            const totalChapters = act.chapters.length;

            act.chapters.forEach((chapter, chapIndex) => {
                const totalScenes = chapter.scenes.length;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    const context = {
                        act: act,
                        chapter: chapter,
                        actIndex: actIndex,
                        totalActs: totalActs,
                        chapterIndex: chapIndex,
                        totalChapters: totalChapters,
                        sceneIndex: sceneIndex,
                        totalScenes: totalScenes
                    };

                    const intensity = PlotModel.calculateSceneTension(scene, context);

                    points.push(new PlotPoint({
                        position: position++,
                        intensity: intensity,
                        title: scene.title,
                        actId: act.id,
                        chapterId: chapter.id,
                        sceneId: scene.id,
                        description: `${act.title} > ${chapter.title} > ${scene.title}`,
                        wordCount: scene.content ? scene.content.split(/\s+/).filter(w => w.length > 0).length : 0
                    }));
                });
            });
        });

        this.setAll(points);
        return points;
    }
}
