// ==========================================
// SCENE VERSION MANAGEMENT (Versions par scène)
// ==========================================

// [MVVM : ViewModel]
// État d'interface utilisé par la vue (visibilité du panneau)
let sceneVersionsSidebarVisible = false;

// [MVVM : Other]
// Met à jour l'état et manipule le DOM (Mixte ViewModel + View)
function toggleVersionsSidebar() {
    const sidebar = document.getElementById('sidebarVersions');
    const toggleBtn = document.getElementById('headerVersionsToggle');
    const toolBtn = document.getElementById('toolVersionsBtn');
    sceneVersionsSidebarVisible = !sceneVersionsSidebarVisible;

    if (sceneVersionsSidebarVisible) {
        sidebar.classList.remove('hidden');
        if (toggleBtn) {
            toggleBtn.classList.add('active');
            toggleBtn.title = 'Masquer les versions de scène';
        }
        if (toolBtn) {
            toolBtn.classList.add('active');
        }
    } else {
        sidebar.classList.add('hidden');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.title = 'Afficher les versions de scène';
        }
        if (toolBtn) {
            toolBtn.classList.remove('active');
        }
    }
}

// [MVVM : Other]
// Force l'état d'affichage et modifie directement la Vue (Mixte ViewModel + View)
function showVersionsSidebar() {
    const sidebar = document.getElementById('sidebarVersions');
    const toggleBtn = document.getElementById('headerVersionsToggle');
    const toolBtn = document.getElementById('toolVersionsBtn');
    sceneVersionsSidebarVisible = true;
    sidebar.classList.remove('hidden');
    if (toggleBtn) {
        toggleBtn.classList.add('active');
    }
    if (toolBtn) {
        toolBtn.classList.add('active');
    }
}

// [MVVM : Model]
// Accès et initialisation des données de modèle (versions d'une scène)
function getSceneVersions(actId, chapterId, sceneId) {
    const act = project.acts.find(a => a.id === actId);
    if (!act) return [];
    const chapter = act.chapters.find(c => c.id === chapterId);
    if (!chapter) return [];
    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return [];

    // Ensure versions array exists
    if (!scene.versions) {
        scene.versions = [];
    }
    return scene.versions;
}

// [MVVM : ViewModel]
// Localise et expose l'act/chapter/scene courant pour la Vue
function getCurrentSceneForVersions() {
    if (!currentActId || !currentChapterId || !currentSceneId) return null;

    const act = project.acts.find(a => a.id === currentActId);
    if (!act) return null;
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    if (!chapter) return null;
    const scene = chapter.scenes.find(s => s.id === currentSceneId);

    return scene ? { act, chapter, scene } : null;
}

// [MVVM : Other]
// Orchestration : lit la Vue, met à jour le Modèle, et rafraîchit la Vue (Mixte)
function createSceneVersion() {
    const current = getCurrentSceneForVersions();
    if (!current) {
        alert('Veuillez d\'abord sélectionner une scène.');
        return;
    }

    const { scene } = current;

    // Ensure versions array exists
    if (!scene.versions) {
        scene.versions = [];
    }

    // Sauvegarder le contenu actuel de l'éditeur dans la version active
    const editor = document.getElementById('sceneEditor');
    const currentContent = editor ? editor.innerHTML : (scene.content || '');

    // Obtenir les annotations de la version active actuelle (pour les copier)
    const currentAnnotations = getVersionAnnotations(scene);

    // Sauvegarder le contenu de la version active actuelle
    const currentActiveVersion = scene.versions.find(v => v.isActive);
    if (currentActiveVersion) {
        currentActiveVersion.content = currentContent;
        currentActiveVersion.wordCount = getWordCount(currentContent);
    }

    // Create version - GARDER les mêmes IDs d'annotations car le HTML contient ces IDs
    const versionNumber = scene.versions.length + 1;
    const version = {
        id: Date.now(),
        number: versionNumber,
        label: '',
        content: currentContent,
        wordCount: getWordCount(currentContent),
        createdAt: new Date().toISOString(),
        isActive: false,
        // Copier les annotations avec les MÊMES IDs (deep copy sans changer les IDs)
        annotations: currentAnnotations.map(a => ({ ...a }))
    };

    // Mark all previous versions as inactive
    scene.versions.forEach(v => v.isActive = false);

    // Add new version as active
    version.isActive = true;
    scene.versions.push(version);

    // Update scene content reference to this version
    scene.activeVersionId = version.id;
    scene.content = currentContent;

    saveProject();
    renderSceneVersionsList();

    // Rafraîchir le panneau d'annotations
    const annotationsPanel = document.getElementById('annotationsPanel');
    if (annotationsPanel && !annotationsPanel.classList.contains('hidden')) {
        renderAnnotationsPanel();
    }
    updateAnnotationsButton(false);

    showNotification(`Version ${versionNumber} créée`);
}

// [MVVM : Other]
// Met à jour l'état du modèle et rafraîchit la Vue (Mixte)
function switchToSceneVersion(versionId) {
    const current = getCurrentSceneForVersions();
    if (!current) return;

    const { scene } = current;
    if (!scene.versions) return;

    const version = scene.versions.find(v => v.id === versionId);
    if (!version) return;

    // Save current editor content to current active version before switching
    const currentActiveVersion = scene.versions.find(v => v.isActive);
    if (currentActiveVersion) {
        const editor = document.getElementById('sceneEditor');
        const currentContent = editor ? editor.innerHTML : (scene.content || '');
        currentActiveVersion.content = currentContent;
        currentActiveVersion.wordCount = getWordCount(currentContent);
    }

    // Mark all versions as inactive
    scene.versions.forEach(v => v.isActive = false);

    // Activate the selected version
    version.isActive = true;
    scene.activeVersionId = version.id;

    // Load version content into scene
    scene.content = version.content;
    scene.wordCount = version.wordCount;

    saveProject();
    renderSceneVersionsList();

    // Refresh editor if this scene is currently open
    if (currentSceneId === scene.id) {
        const act = project.acts.find(a => a.id === currentActId);
        const chapter = act.chapters.find(c => c.id === currentChapterId);
        renderEditor(act, chapter, scene);

        // Réattacher les event listeners sur les marqueurs d'annotation
        setTimeout(() => {
            reattachAnnotationMarkerListeners();
        }, 50);

        // Rafraîchir le panneau d'annotations pour la nouvelle version
        const annotationsPanel = document.getElementById('annotationsPanel');
        if (annotationsPanel && !annotationsPanel.classList.contains('hidden')) {
            renderAnnotationsPanel();
        }
        updateAnnotationsButton(false);
    }
}

// Réattacher les event listeners sur les marqueurs d'annotation après changement de version
// [MVVM : View]
// Rattache des écouteurs DOM aux marqueurs d'annotation
function reattachAnnotationMarkerListeners() {
    const markers = document.querySelectorAll('[data-annotation-id]');
    markers.forEach(marker => {
        const annotationId = parseInt(marker.getAttribute('data-annotation-id'));
        marker.style.cursor = 'pointer';
        marker.onclick = function (e) {
            e.stopPropagation();
            highlightAnnotation(annotationId);
        };
    });
}

// [MVVM : Other]
// Supprime le modèle (versions) et rafraîchit la Vue (Mixte)
function deleteSceneVersion(versionId) {
    const current = getCurrentSceneForVersions();
    if (!current) return;

    const { scene } = current;
    if (!scene.versions || scene.versions.length <= 1) {
        alert('Impossible de supprimer la dernière version.');
        return;
    }

    const version = scene.versions.find(v => v.id === versionId);
    if (!version) return;

    if (!confirm(`Supprimer la version ${version.number} ?`)) return;

    const wasActive = version.isActive;
    scene.versions = scene.versions.filter(v => v.id !== versionId);

    // Renumber remaining versions
    scene.versions.forEach((v, index) => {
        v.number = index + 1;
    });

    // If deleted version was active, activate the last one
    if (wasActive && scene.versions.length > 0) {
        const lastVersion = scene.versions[scene.versions.length - 1];
        lastVersion.isActive = true;
        scene.activeVersionId = lastVersion.id;
        scene.content = lastVersion.content;
        scene.wordCount = lastVersion.wordCount;

        // Refresh editor
        if (currentSceneId === scene.id) {
            const act = project.acts.find(a => a.id === currentActId);
            const chapter = act.chapters.find(c => c.id === currentChapterId);
            renderEditor(act, chapter, scene);
        }
    }

    saveProject();
    renderSceneVersionsList();
}

// [MVVM : Other]
// Met à jour le modèle (label) et demande à la Vue de se rafraîchir (Mixte)
function renameSceneVersion(versionId) {
    const current = getCurrentSceneForVersions();
    if (!current) return;

    const { scene } = current;
    if (!scene.versions) return;

    const version = scene.versions.find(v => v.id === versionId);
    if (!version) return;

    const newLabel = prompt('Nom de la version (optionnel):', version.label || '');
    if (newLabel === null) return; // Cancelled

    version.label = newLabel.trim();
    saveProject();
    renderSceneVersionsList();
}

// [MVVM : View]
// Construit et injecte le HTML pour la liste des versions
function renderSceneVersionsList() {
    const listContainer = document.getElementById('sceneVersionsList');
    const sceneNameEl = document.getElementById('versionsSceneName');
    const btnNewVersion = document.getElementById('btnNewVersion');

    if (!listContainer) return;

    const current = getCurrentSceneForVersions();

    if (!current) {
        // No scene selected
        sceneNameEl.textContent = 'Aucune scène sélectionnée';
        btnNewVersion.disabled = true;
        listContainer.innerHTML = `
                    <div class="versions-no-scene">
                        <div class="versions-no-scene-icon"><i data-lucide="file-text" style="width:48px;height:48px;opacity:0.3;"></i></div>
                        <div class="versions-no-scene-text">
                            Sélectionnez une scène<br>dans la structure<br>pour voir ses versions
                        </div>
                    </div>
                `;
        return;
    }

    const { act, chapter, scene } = current;

    // Update scene name
    sceneNameEl.textContent = `${act.title} › ${chapter.title} › ${scene.title}`;
    btnNewVersion.disabled = false;

    // Ensure versions array exists
    if (!scene.versions) {
        scene.versions = [];
    }

    if (scene.versions.length === 0) {
        listContainer.innerHTML = `
                    <div class="versions-empty">
                        <div class="versions-empty-icon"><i data-lucide="git-branch" style="width:48px;height:48px;"></i></div>
                        <div class="versions-empty-text">
                            Aucune version<br>
                            Créez votre première version pour tester différentes idées
                        </div>
                    </div>
                `;
        return;
    }

    // Sort by most recent first
    const sortedVersions = [...scene.versions].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    let html = '';
    sortedVersions.forEach(version => {
        const date = new Date(version.createdAt);
        const dateStr = date.toLocaleDateString('fr-FR');
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const canCompare = scene.versions.length >= 2;
        const isFinal = version.isFinal === true;
        const finalClass = isFinal ? 'final' : '';
        const activeClass = version.isActive ? 'active' : '';

        html += `
                    <div class="version-card ${activeClass} ${finalClass}" 
                         onclick="switchToSceneVersion(${version.id})">
                        <div class="version-card-header">
                            <span class="version-card-number">
                                ${version.number}
                                ${isFinal ? '<span class="version-card-final-badge">Finale</span>' : ''}
                            </span>
                            <div class="version-card-actions">
                                <button class="version-card-btn final ${isFinal ? 'is-final' : ''}" onclick="event.stopPropagation(); toggleFinalVersion(${version.id})" title="${isFinal ? 'Retirer comme version finale' : 'Marquer comme version finale'}"><i data-lucide="star" style="width:14px;height:14px;"></i></button>
                                ${canCompare ? `<button class="version-card-btn compare" onclick="event.stopPropagation(); openDiffModal(${version.id})" title="Comparer"><i data-lucide="git-compare" style="width:14px;height:14px;"></i></button>` : ''}
                                <button class="version-card-btn" onclick="event.stopPropagation(); renameSceneVersion(${version.id})" title="Renommer"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                                <button class="version-card-btn delete" onclick="event.stopPropagation(); deleteSceneVersion(${version.id})" title="Supprimer"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                            </div>
                        </div>
                        <div class="version-card-date">${dateStr} ${timeStr}</div>
                        <div class="version-card-stats">${version.wordCount.toLocaleString('fr-FR')} mots</div>
                        ${version.label ? `<div class="version-card-label">${version.label}</div>` : ''}
                    </div>
                `;
    });

    listContainer.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Marquer/démarquer une version comme finale
// [MVVM : Other]
// Met à jour le modèle (flag isFinal) puis rafraîchit la Vue (Mixte)
function toggleFinalVersion(versionId) {
    const current = getCurrentSceneForVersions();
    if (!current) return;

    const { scene } = current;
    if (!scene.versions) return;

    const version = scene.versions.find(v => v.id === versionId);
    if (!version) return;

    if (version.isFinal) {
        // Retirer le statut final
        version.isFinal = false;
        showNotification('Version retirée comme finale');
    } else {
        // Retirer le statut final des autres versions
        scene.versions.forEach(v => v.isFinal = false);
        // Marquer cette version comme finale
        version.isFinal = true;
        showNotification(`Version "${version.number}" marquée comme finale`);
    }

    saveProject();
    renderSceneVersionsList();
}

// Obtenir le contenu à exporter pour une scène (version finale si existe, sinon contenu actuel)
// [MVVM : Model]
// Logique d'accès pour l'export (choisit la version finale si présente)
function getSceneExportContent(scene) {
    if (scene.versions && scene.versions.length > 0) {
        const finalVersion = scene.versions.find(v => v.isFinal === true);
        if (finalVersion) {
            return finalVersion.content;
        }
    }
    return scene.content;
}

// Update scene content when editing (also updates active version)
// [MVVM : ViewModel]
// Synchronise le contenu édité (Vue) avec le Modèle et ses versions actives
function updateSceneContentWithVersion(content) {
    const current = getCurrentSceneForVersions();
    if (!current) return;

    const { scene } = current;
    scene.content = content;
    scene.wordCount = getWordCount(content);

    // Also update active version if exists
    if (scene.versions && scene.versions.length > 0) {
        const activeVersion = scene.versions.find(v => v.isActive);
        if (activeVersion) {
            activeVersion.content = content;
            activeVersion.wordCount = scene.wordCount;
        }
    }
}

