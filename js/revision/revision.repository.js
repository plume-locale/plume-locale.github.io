/*
 * REVISION MODULE - REPOSITORY
 * Handles data access and persistence for annotations within scene versions.
 */

const RevisionRepository = {
    /**
     * Gets the active version of a scene.
     */
    getActiveVersion(scene) {
        if (!scene.versions || scene.versions.length === 0) {
            return null;
        }
        return scene.versions.find(v => v.isActive) || scene.versions[scene.versions.length - 1];
    },

    /**
     * Gets annotations for the active version of a scene.
     */
    getVersionAnnotations(scene) {
        const activeVersion = this.getActiveVersion(scene);
        if (activeVersion) {
            if (!activeVersion.annotations) {
                activeVersion.annotations = [];
            }
            return activeVersion.annotations;
        }
        // Fallback to legacy annotations at scene level
        if (!scene.annotations) {
            scene.annotations = [];
        }
        return scene.annotations;
    },

    /**
     * Adds an annotation to the active version of a scene.
     */
    addAnnotation(scene, annotation) {
        const activeVersion = this.getActiveVersion(scene);
        if (activeVersion) {
            if (!activeVersion.annotations) activeVersion.annotations = [];
            activeVersion.annotations.push(annotation);
        } else {
            if (!scene.annotations) scene.annotations = [];
            scene.annotations.push(annotation);
        }
        this.save();
    },

    /**
     * Removes an annotation from the active version of a scene.
     */
    removeAnnotation(scene, annotationId) {
        const activeVersion = this.getActiveVersion(scene);
        if (activeVersion && activeVersion.annotations) {
            activeVersion.annotations = activeVersion.annotations.filter(a => a.id !== annotationId);
        } else if (scene.annotations) {
            scene.annotations = scene.annotations.filter(a => a.id !== annotationId);
        }
        this.save();
    },

    /**
     * Finds an annotation by ID in the active version of a scene.
     */
    findAnnotation(scene, annotationId) {
        return this.getVersionAnnotations(scene).find(a => a.id === annotationId);
    },

    /**
     * Migrates legacy scene annotations to the active version (one-time).
     */
    migrate(scene) {
        if (scene.annotations && scene.annotations.length > 0) {
            const activeVersion = this.getActiveVersion(scene);
            if (activeVersion) {
                if (!activeVersion.annotations) activeVersion.annotations = [];
                scene.annotations.forEach(ann => {
                    if (!activeVersion.annotations.find(a => a.id === ann.id)) {
                        activeVersion.annotations.push(ann);
                    }
                });
                scene.annotations = [];
                this.save();
                return true;
            }
        }
        return false;
    },

    /**
     * Finds a scene by ID in the project.
     */
    findSceneById(sceneId) {
        if (typeof project === 'undefined' || !project.acts) return null;
        for (const act of project.acts) {
            for (const chapter of act.chapters) {
                const scene = chapter.scenes.find(s => s.id == sceneId);
                if (scene) return scene;
            }
        }
        return null;
    },

    /**
     * Gets the total count of non-completed annotations for a scene.
     */
    getAnnotationCount(sceneId) {
        const scene = this.findSceneById(sceneId);
        if (!scene) return 0;

        const annotations = this.getVersionAnnotations(scene);
        return annotations.filter(a => a.type !== 'todo' && !a.completed).length;
    },

    /**
     * Persists the project data.
     */
    save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};
