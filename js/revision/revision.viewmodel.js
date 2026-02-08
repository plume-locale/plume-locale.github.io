/*
 * REVISION MODULE - VIEWMODEL
 * Handles business logic, state management, and coordinates View and Repository.
 */

const RevisionViewModel = {
    state: {
        revisionMode: false,
        selectedHighlightColor: 'yellow',
        selectedAnnotationType: 'comment',
        currentSelection: null
    },

    /**
     * Toggles the revision mode state and updates UI.
     */
    toggleRevisionMode() {
        if (!currentSceneId) {
            alert(Localization.t('revision.alert.open_scene'));
            return;
        }

        this.state.revisionMode = !this.state.revisionMode;

        const toolbarHTML = typeof getEditorToolbarHTML === 'function' ? getEditorToolbarHTML() : '';
        RevisionView.updateToolbar(this.state.revisionMode, this.state.selectedHighlightColor, toolbarHTML);
    },

    /**
     * Updates the selected highlight color.
     */
    selectHighlightColor(color) {
        this.state.selectedHighlightColor = color;
        RevisionView.updateHighlightButtons(color);
    },

    /**
     * Applies the current highlight color to the selection.
     */
    applyHighlight() {
        const success = RevisionView.wrapSelectionInSpan(`highlight-${this.state.selectedHighlightColor}`);
        if (success) {
            this.updateSceneContent();
        } else {
            alert(Localization.t('revision.alert.highlight_error'));
        }

        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
    },

    /**
     * Removes highlights from the current selection.
     */
    removeHighlight() {
        const success = RevisionView.removeHighlightSpan();
        if (success) {
            this.updateSceneContent();
        } else {
            alert(Localization.t('revision.alert.select_highlight'));
        }

        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
    },

    /**
     * Prepares and opens the annotation popup.
     */
    openAnnotationPopup() {
        const sel = window.getSelection();
        if (!sel.rangeCount || sel.isCollapsed) {
            alert(Localization.t('revision.alert.select_text_to_annotate'));
            return;
        }

        this.state.currentSelection = {
            text: sel.toString(),
            range: sel.getRangeAt(0).cloneRange()
        };

        RevisionView.showAnnotationPopup();
    },

    /**
     * Closes the annotation popup and clears the selection state.
     */
    closeAnnotationPopup() {
        RevisionView.hideAnnotationPopup();
        this.state.currentSelection = null;
    },

    /**
     * Updates the selected annotation type.
     */
    selectAnnotationType(type) {
        this.state.selectedAnnotationType = type;
        RevisionView.updateAnnotationTypeButtons(type);
    },

    /**
     * Saves a new annotation for the current selection.
     */
    saveAnnotation() {
        const input = document.getElementById('annotationText');
        const text = input ? input.value.trim() : '';

        if (!text) {
            alert(Localization.t('revision.alert.enter_annotation'));
            return;
        }

        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { scene } = current;

        const annotation = RevisionModel.createAnnotation({
            type: this.state.selectedAnnotationType,
            text: text,
            context: this.state.currentSelection ? this.state.currentSelection.text : ''
        });

        // Data persistence
        RevisionRepository.addAnnotation(scene, annotation);

        // Visual insertion
        if (this.state.currentSelection && this.state.currentSelection.range) {
            RevisionView.insertAnnotationMarker(annotation, this.state.currentSelection.range);
            this.updateSceneContent();
        }

        this.closeAnnotationPopup();
        this.renderAnnotationsPanel();

        if (typeof renderActsList === 'function') renderActsList();
    },

    /**
     * Deletes an annotation.
     */
    deleteAnnotation(annotationId) {
        if (!confirm(Localization.t('revision.confirm.delete'))) return;

        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { scene } = current;

        RevisionView.removeAnnotationMarker(annotationId);
        RevisionRepository.removeAnnotation(scene, annotationId);

        this.updateSceneContent();
        this.renderAnnotationsPanel();

        if (typeof renderActsList === 'function') renderActsList();
        if (typeof showNotification === 'function') showNotification(Localization.t('revision.notify.deleted'));
    },

    /**
     * Toggles the completion status of an annotation.
     */
    toggleAnnotationComplete(annotationId) {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { scene } = current;

        const annotation = RevisionRepository.findAnnotation(scene, annotationId);
        if (annotation) {
            annotation.completed = !annotation.completed;
            RevisionRepository.save();
            this.renderAnnotationsPanel();
            if (typeof renderActsList === 'function') renderActsList();
        }
    },

    /**
     * Synchronizes the editor content with the scene and active version data.
     */
    updateSceneContent() {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { scene } = current;

        const html = RevisionView.getEditorHTML();
        if (html !== null) {
            scene.content = html;
            const activeVersion = RevisionRepository.getActiveVersion(scene);
            if (activeVersion) {
                activeVersion.content = html;
            }
            RevisionRepository.save();
        }
    },

    /**
     * Refreshes the annotations panel view.
     */
    renderAnnotationsPanel() {
        const current = SceneVersionRepository.getCurrentScene();

        if (current && current.scene) {
            const scene = current.scene;
            RevisionRepository.migrate(scene);
            const annotations = RevisionRepository.getVersionAnnotations(scene);
            const activeVersion = RevisionRepository.getActiveVersion(scene);
            RevisionView.renderAnnotationsPanel(scene, annotations, activeVersion);
        } else {
            RevisionView.renderAnnotationsEmpty();
        }

        this.updateAnnotationsButton();
    },

    /**
     * Toggles the annotations panel visibility.
     */
    toggleAnnotationsPanel() {
        const isHidden = RevisionView.togglePanel();
        if (!isHidden) {
            this.renderAnnotationsPanel();
        }
        this.updateAnnotationsButton(!isHidden);
    },

    /**
     * Updates all annotation-related badges in the UI.
     */
    updateAnnotationsButton(isOpen) {
        if (isOpen === undefined) {
            const panel = document.getElementById('annotationsPanel');
            isOpen = panel && !panel.classList.contains('hidden');
        }

        const stats = {
            annotationCount: 0,
            todoCount: 0,
            totalTodos: 0
        };

        const current = SceneVersionRepository.getCurrentScene();
        if (current && current.scene) {
            const annotations = RevisionRepository.getVersionAnnotations(current.scene);
            stats.annotationCount = annotations.filter(a => a.type !== 'todo').length;
            stats.todoCount = annotations.filter(a => a.type === 'todo' && !a.completed).length;
        }

        // Global count for Todos
        if (typeof project !== 'undefined' && project.acts) {
            project.acts.forEach(act => {
                act.chapters.forEach(chapter => {
                    chapter.scenes.forEach(scene => {
                        const anns = RevisionRepository.getVersionAnnotations(scene);
                        stats.totalTodos += anns.filter(a => a.type === 'todo' && !a.completed).length;
                    });
                });
            });
        }

        RevisionView.updateBadges(stats, isOpen);
        RevisionView.updateDensityIndicators();
    },

    /**
     * Scrolls the editor to an annotation and performs a pulse animation.
     */
    scrollToAnnotation(annotationId) {
        const success = RevisionView.scrollToAnnotation(annotationId);
        if (success) {
            this.highlightAnnotation(annotationId);
        } else {
            console.warn(`Marker for annotation ${annotationId} not found`);
            if (typeof showNotification === 'function') showNotification(Localization.t('revision.notify.not_found'));
        }
    },

    /**
     * Triggers a pulse animation on an annotation marker.
     */
    highlightAnnotation(annotationId) {
        RevisionView.animateMarkerPulse(annotationId);
    },

    /**
     * Gets a list of entities (characters/world/codex) for autocomplete.
     */
    getEntities() {
        const entities = [];
        if (typeof project !== 'undefined') {
            // Characters
            if (project.characters) {
                project.characters.forEach(c => entities.push({ name: c.name, type: 'user' }));
            }
            // World Elements
            if (project.world) {
                project.world.forEach(w => entities.push({ name: w.name, type: 'globe' }));
            }
            // Codex Entries
            if (project.codex) {
                project.codex.forEach(e => entities.push({ name: e.title, type: 'book-open' }));
            }
            // Notes
            if (project.notes) {
                project.notes.forEach(n => entities.push({ name: n.title, type: 'sticky-note' }));
            }
            // Timeline Events
            if (project.timeline) {
                project.timeline.forEach(t => entities.push({ name: t.title, type: 'clock' }));
            }
        }
        return entities;
    }
};
