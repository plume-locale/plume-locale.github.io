/**
 * [MVVM : Model]
 * Import/Export Model
 * Stores the state of the export selection and data structures.
 */

const ImportExportModel = {
    // State for the item selection in the advanced export modal
    // Format: "act-ID": true/false, "chapter-ID": true/false, "scene-ID": true/false
    selectionState: {},

    /**
     * Initialize selection state with all items selected or deselected
     * @param {boolean} selectAll 
     */
    initSelectionState: function (selectAll = true) {
        this.selectionState = {};
        if (!window.project || !window.project.acts) return;

        window.project.acts.forEach(act => {
            this.selectionState[`act-${act.id}`] = selectAll;
            act.chapters.forEach(chapter => {
                this.selectionState[`chapter-${chapter.id}`] = selectAll;
                chapter.scenes.forEach(scene => {
                    this.selectionState[`scene-${scene.id}`] = selectAll;
                });
            });
        });
    },

    /**
     * Get the export options from the DOM/View
     * (Note: Ideally passed from View to ViewModel, but Model can define the structure)
     */
    getDefaultOptions: function () {
        return {
            exportSummaries: false,
            exportProse: true,
            includeActTitles: true,
            includeSceneSubtitles: true,
            sceneDivider: 'asterisks',
            includeCharacters: false,
            includeWorld: false,
            includeTimeline: false,
            includeRelations: false,
            includeCodex: false,
            includeNotes: false
        };
    },

    /**
     * Get the content structure filtered by selection state
     */
    getSelectedContent: function () {
        let content = {
            acts: []
        };

        if (!window.project || !window.project.acts) return content;

        window.project.acts.forEach((act, actIndex) => {
            if (!this.selectionState[`act-${act.id}`]) return;

            let exportAct = {
                title: act.title || Localization.t('export.tree.act', actIndex + 1),
                chapters: []
            };

            act.chapters.forEach((chapter, chapIndex) => {
                if (!this.selectionState[`chapter-${chapter.id}`]) return;

                let exportChapter = {
                    title: chapter.title || Localization.t('export.tree.chapter', chapIndex + 1),
                    scenes: []
                };

                chapter.scenes.forEach((scene, sceneIndex) => {
                    if (!this.selectionState[`scene-${scene.id}`]) return;

                    // Get content (handle potential versions or plain text if needed)
                    // For now assume scene.content
                    let sceneContent = scene.content || '';
                    if (typeof window.getSceneExportContent === 'function') {
                        sceneContent = window.getSceneExportContent(scene);
                    }

                    let exportScene = {
                        title: scene.title || Localization.t('export.tree.scene', sceneIndex + 1),
                        summary: scene.summary || '',
                        content: sceneContent
                    };

                    exportChapter.scenes.push(exportScene);
                });

                if (exportChapter.scenes.length > 0) {
                    exportAct.chapters.push(exportChapter);
                }
            });

            if (exportAct.chapters.length > 0) {
                content.acts.push(exportAct);
            }
        });

        return content;
    }
};
