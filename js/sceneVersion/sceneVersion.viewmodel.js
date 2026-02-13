/*
 * SCENE VERSION MODULE - VIEWMODEL
 * Handles business logic and state management.
 */

const SceneVersionViewModel = {
    state: {
        isVisible: false
    },

    init() {
        // Initialize state if needed
    },

    toggleSidebar() {
        this.state.isVisible = !this.state.isVisible;
        SceneVersionView.updateSidebarVisibility(this.state.isVisible);
    },

    showSidebar() {
        this.state.isVisible = true;
        SceneVersionView.updateSidebarVisibility(true);
    },

    hideSidebar() {
        this.state.isVisible = false;
        SceneVersionView.updateSidebarVisibility(false);
    },

    getActiveVersion(scene) {
        if (!scene.versions) return null;
        return scene.versions.find(v => v.isActive);
    },

    createVersion() {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) {
            alert(Localization.t('versions.alert.select_scene'));
            return;
        }
        const { scene } = current;
        SceneVersionRepository.ensureVersionsInitialized(scene);

        // Get current editor content
        const editorContent = SceneVersionView.getEditorContent();
        const currentContent = editorContent !== null ? editorContent : (scene.content || '');

        // Get annotations
        const currentAnnotations = typeof getVersionAnnotations === 'function' ? getVersionAnnotations(scene) : [];

        // Save current active version content first
        const currentActiveFn = this.getActiveVersion(scene);
        if (currentActiveFn) {
            currentActiveFn.content = currentContent;
            currentActiveFn.wordCount = (currentContent && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(currentContent) : 0;
        }

        // Create new version
        const newVersion = SceneVersionModel.create(currentContent, currentAnnotations);
        newVersion.number = scene.versions.length + 1;
        newVersion.isActive = true;
        newVersion.wordCount = (currentContent && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(currentContent) : 0;

        // Deactivate others
        scene.versions.forEach(v => v.isActive = false);

        // Add
        scene.versions.push(newVersion);

        // Update scene references
        scene.activeVersionId = newVersion.id;
        scene.content = currentContent;

        SceneVersionRepository.save();
        SceneVersionView.renderList(scene);

        // Update other UI parts
        if (typeof renderAnnotationsPanel === 'function') renderAnnotationsPanel();
        if (typeof updateAnnotationsButton === 'function') updateAnnotationsButton(false);
        if (typeof showNotification === 'function') showNotification(Localization.t('versions.notify.created', [newVersion.number]));
    },

    restoreVersion(versionId) {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { act, chapter, scene } = current;

        const version = scene.versions.find(v => v.id === versionId);
        if (!version) return;

        // Save current state to active version
        const currentActive = this.getActiveVersion(scene);
        if (currentActive) {
            const content = SceneVersionView.getEditorContent() || scene.content || '';
            currentActive.content = content;
            currentActive.wordCount = (content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(content) : 0;
        }

        // Deactivate all
        scene.versions.forEach(v => v.isActive = false);

        // Activate target
        version.isActive = true;
        scene.activeVersionId = version.id;
        scene.content = version.content; // Load content
        scene.wordCount = version.wordCount;

        SceneVersionRepository.save();
        SceneVersionView.renderList(scene);

        // Refresh editor — use tabs system if active to avoid destroying the tab strip
        if (typeof tabsState !== 'undefined' && tabsState.panes.left.tabs.length > 0) {
            renderTabs();
        } else if (typeof renderEditor === 'function') {
            renderEditor(act, chapter, scene);
        }
        setTimeout(() => {
            if (typeof reattachAnnotationMarkerListeners === 'function') reattachAnnotationMarkerListeners();
            SceneVersionView.reattachAnnotationListeners();
        }, 50);

        if (typeof renderAnnotationsPanel === 'function') renderAnnotationsPanel();
        if (typeof updateAnnotationsButton === 'function') updateAnnotationsButton(false);
    },

    deleteVersion(versionId) {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { act, chapter, scene } = current;

        if (!scene.versions || scene.versions.length <= 1) {
            alert(Localization.t('versions.alert.last_version'));
            return;
        }

        const version = scene.versions.find(v => v.id === versionId);
        if (!version) return;

        if (!confirm(Localization.t('versions.confirm.delete', [version.number]))) return;

        const wasActive = version.isActive;
        scene.versions = scene.versions.filter(v => v.id !== versionId);

        // Renumber
        scene.versions.forEach((v, index) => v.number = index + 1);

        // Activate last if deleted was active
        if (wasActive && scene.versions.length > 0) {
            const last = scene.versions[scene.versions.length - 1];
            last.isActive = true;
            scene.activeVersionId = last.id;
            scene.content = last.content;
            scene.wordCount = last.wordCount;

            if (typeof tabsState !== 'undefined' && tabsState.panes.left.tabs.length > 0) {
                renderTabs();
            } else if (window.renderEditor) {
                window.renderEditor(act, chapter, scene);
            }
        }

        SceneVersionRepository.save();
        SceneVersionView.renderList(scene);
    },

    renameVersion(versionId) {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { scene } = current;

        const version = scene.versions.find(v => v.id === versionId);
        if (!version) return;

        const newLabel = prompt(Localization.t('versions.prompt.rename'), version.label || '');
        if (newLabel === null) return;

        version.label = newLabel.trim();
        SceneVersionRepository.save();
        SceneVersionView.renderList(scene);
    },

    toggleFinal(versionId) {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;
        const { scene } = current;

        const version = scene.versions.find(v => v.id === versionId);
        if (!version) return;

        if (version.isFinal) {
            version.isFinal = false;
            if (typeof showNotification === 'function') showNotification(Localization.t('versions.notify.unmarked_final'));
        } else {
            scene.versions.forEach(v => v.isFinal = false);
            version.isFinal = true;
            if (typeof showNotification === 'function') showNotification(Localization.t('versions.notify.marked_final', [version.number]));
        }

        SceneVersionRepository.save();
        SceneVersionView.renderList(scene);
    },

    updateCurrentContent(content) {
        const current = SceneVersionRepository.getCurrentScene();
        if (!current) return;

        const { scene } = current;
        scene.content = content;
        scene.wordCount = (content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(content) : 0;

        // Update active version
        if (scene.versions && scene.versions.length > 0) {
            const active = scene.versions.find(v => v.isActive);
            if (active) {
                active.content = content;
                active.wordCount = scene.wordCount;
            }
        }
    }
};
