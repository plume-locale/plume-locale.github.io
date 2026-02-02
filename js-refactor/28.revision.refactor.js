// ============================================
// REVISION MODE FUNCTIONS - REFACTORED
// ============================================

// [MVVM : Other]
// Group: Use Case | Naming: ToggleRevisionUseCase
// Bascule l'état du mode révision et met à jour l'interface de la barre d'outils.
function toggleRevisionMode() {
    // Vérifier qu'une scène est ouverte
    if (!currentSceneId) {
        alert('Veuillez d\'abord ouvrir une scène pour activer le mode révision.');
        return;
    }

    revisionMode = !revisionMode;
    let toolbar = document.getElementById('editorToolbar');
    if (!toolbar) {
        toolbar = document.querySelector('.editor-toolbar, .revision-toolbar');
    }
    if (!toolbar) {
        console.error('Toolbar not found!');
        alert('Erreur: Barre d\'outils introuvable. Rechargez la page.');
        return;
    }
    const editor = document.querySelector('.editor-textarea');
    const panel = document.getElementById('annotationsPanel');

    if (revisionMode) {
        // Activer le mode révision
        toolbar.className = 'editor-toolbar revision-toolbar';
        toolbar.innerHTML = `
                    <span class="revision-badge"><i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>MODE RÉVISION</span>
                    <button class="highlight-btn yellow ${selectedHighlightColor === 'yellow' ? 'active' : ''}" 
                            onclick="selectHighlightColor('yellow')">Jaune</button>
                    <button class="highlight-btn green ${selectedHighlightColor === 'green' ? 'active' : ''}" 
                            onclick="selectHighlightColor('green')">Vert</button>
                    <button class="highlight-btn blue ${selectedHighlightColor === 'blue' ? 'active' : ''}" 
                            onclick="selectHighlightColor('blue')">Bleu</button>
                    <button class="highlight-btn red ${selectedHighlightColor === 'red' ? 'active' : ''}" 
                            onclick="selectHighlightColor('red')">Rouge</button>
                    <button class="highlight-btn purple ${selectedHighlightColor === 'purple' ? 'active' : ''}" 
                            onclick="selectHighlightColor('purple')">Violet</button>
                    <button class="btn" onclick="applyHighlight()"><i data-lucide="highlighter" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Surligner</button>
                    <button class="btn" onclick="removeHighlight()"><i data-lucide="trash-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Retirer</button>
                    <button class="btn" onclick="openAnnotationPopup()"><i data-lucide="message-square" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Annoter</button>
                    <div style="flex: 1;"></div>
                    <button class="btn btn-primary" onclick="toggleRevisionMode()"><i data-lucide="check" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Quitter</button>
                `;
        if (editor) editor.contentEditable = 'false';
        // Ne pas afficher automatiquement le panneau
        // L'utilisateur cliquera sur "Voir annotations" s'il le souhaite
    } else {
        // Désactiver le mode révision
        toolbar.className = 'editor-toolbar';
        // USE CENTRALIZED TOOLBAR
        toolbar.innerHTML = getEditorToolbarHTML();
        if (editor) editor.contentEditable = 'true';
        if (panel) panel.classList.remove('visible');

        // Réinitialiser les color pickers après reconstruction de la toolbar
        initializeColorPickers();
    }

    // Refresh Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// [MVVM : ViewModel]
// Gère la sélection de la couleur de surlignage dans l'interface.
function selectHighlightColor(color) {
    selectedHighlightColor = color;
    document.querySelectorAll('.highlight-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.highlight-btn.${color}`).classList.add('active');
}

// [MVVM : Other]
// Group: Use Case | Naming: ApplyHighlightUseCase
// Applique un surlignage à la sélection de texte et met à jour le contenu de la scène.
function applyHighlight() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
        alert('Sélectionnez du texte à surligner');
        return;
    }

    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `highlight-${selectedHighlightColor}`;

    try {
        range.surroundContents(span);
        updateSceneContent();
    } catch (e) {
        alert('Impossible de surligner cette sélection (essayez une sélection plus simple)');
    }

    sel.removeAllRanges();
}

// [MVVM : Other]
// Group: Use Case | Naming: RemoveHighlightUseCase
// Retire le surlignage de la sélection et met à jour le contenu de la scène.
function removeHighlight() {
    const sel = window.getSelection();
    if (!sel.rangeCount) {
        alert('Sélectionnez un texte surligné à retirer');
        return;
    }

    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;

    if (node.nodeType === 3) {
        node = node.parentElement;
    }

    if (node.className && node.className.includes('highlight-')) {
        const parent = node.parentNode;
        while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        updateSceneContent();
    } else {
        alert('Sélectionnez un texte surligné');
    }

    sel.removeAllRanges();
}

// [MVVM : View]
// Ouvre la fenêtre contextuelle de création d' annotation.
function openAnnotationPopup() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
        alert('Sélectionnez du texte à annoter');
        return;
    }

    currentSelection = {
        text: sel.toString(),
        range: sel.getRangeAt(0).cloneRange()
    };

    document.getElementById('annotationPopup').classList.add('visible');
    document.getElementById('annotationText').value = '';
    document.getElementById('annotationText').focus();
}

// [MVVM : View]
// Ferme la fenêtre contextuelle de création d' annotation.
function closeAnnotationPopup() {
    document.getElementById('annotationPopup').classList.remove('visible');
    currentSelection = null;
}

// [MVVM : ViewModel]
// Gère le changement de type d' annotation dans l'interface.
function selectAnnotationType(type) {
    selectedAnnotationType = type;
    document.querySelectorAll('.annotation-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.annotation-type-btn.${type}`).classList.add('active');
}

// [MVVM : Other]
// Group: Use Case | Naming: SaveAnnotationUseCase
// Enregistre une nouvelle annotation dans le modèle et l'insère visuellement dans l'éditeur.
function saveAnnotation() {
    const text = document.getElementById('annotationText').value.trim();
    if (!text) {
        alert('Veuillez entrer une annotation');
        return;
    }

    const act = project.acts.find(a => a.id === currentActId);
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    const scene = chapter.scenes.find(s => s.id === currentSceneId);

    const annotationId = Date.now();

    // Ajouter l'annotation à la version active
    addVersionAnnotation(scene, {
        id: annotationId,
        type: selectedAnnotationType,
        text: text,
        context: currentSelection ? currentSelection.text : '',
        completed: false,
        createdAt: new Date().toISOString()
    });

    // Wrapper le texte sélectionné avec un marqueur
    if (currentSelection && currentSelection.range) {
        try {
            const span = document.createElement('span');
            span.id = `annotation-${annotationId}`;
            span.className = `annotation-marker ${selectedAnnotationType}`;
            span.setAttribute('data-annotation-id', annotationId);
            span.style.cursor = 'pointer';
            span.title = `${getAnnotationTypeLabel(selectedAnnotationType)}: ${text}`;

            // Définir les styles selon le type
            const styles = {
                comment: 'background: rgba(255, 235, 59, 0.3); border-bottom: 2px solid #FBC02D;',
                question: 'background: rgba(33, 150, 243, 0.3); border-bottom: 2px solid #1976D2;',
                todo: 'background: rgba(244, 67, 54, 0.3); border-bottom: 2px solid #D32F2F;'
            };
            span.style.cssText = styles[selectedAnnotationType] || '';

            // Wrapper le contenu
            currentSelection.range.surroundContents(span);

            // Ajouter un event listener pour cliquer sur le marqueur
            span.onclick = function (e) {
                e.stopPropagation();
                highlightAnnotation(annotationId);
            };

            // IMPORTANT: Mettre à jour le contenu de la scène ET de la version active avec le nouveau HTML
            const editor = document.getElementById('sceneEditor') || document.querySelector('.editor-textarea');
            if (editor) {
                scene.content = editor.innerHTML;
                // Mettre à jour aussi le contenu de la version active
                const activeVersion = getActiveVersion(scene);
                if (activeVersion) {
                    activeVersion.content = editor.innerHTML;
                }
            }
        } catch (e) {
            console.warn('Impossible de wrapper le texte:', e);
        }
    }

    saveProject();
    closeAnnotationPopup();
    renderAnnotationsPanel();
    renderActsList();
}

// [MVVM : View]
// Génère et affiche la liste des annotations de la scène dans le panneau latéral.
function renderAnnotationsPanel() {
    const panel = document.getElementById('annotationsPanelContent');
    const parentPanel = document.getElementById('annotationsPanel');

    if (!panel || !parentPanel) {
        console.error('Panneau annotations introuvable');
        return;
    }

    // Vérifier qu'une scène est sélectionnée
    if (!currentSceneId || !currentChapterId || !currentActId) {
        panel.innerHTML = `
                    <div class="annotations-panel-header">
                        <h3 style="margin: 0;">Annotations</h3>
                        <span class="annotations-panel-close" onclick="closeAnnotationsPanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
                    </div>
                    <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Sélectionnez une scène pour voir ses annotations</p>
                `;
        parentPanel.classList.add('visible');
        return;
    }

    const act = project.acts.find(a => a.id === currentActId);
    const chapter = act ? act.chapters.find(c => c.id === currentChapterId) : null;
    const scene = chapter ? chapter.scenes.find(s => s.id === currentSceneId) : null;

    if (!scene) {
        panel.innerHTML = `
                    <div class="annotations-panel-header">
                        <h3 style="margin: 0;">Annotations</h3>
                        <span class="annotations-panel-close" onclick="closeAnnotationsPanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
                    </div>
                    <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Scène introuvable</p>
                `;
        parentPanel.classList.add('visible');
        return;
    }

    // Migrer les anciennes annotations si nécessaire
    migrateSceneAnnotationsToVersion(scene);

    // Obtenir les annotations de la version active
    const annotations = getVersionAnnotations(scene);
    const activeVersion = getActiveVersion(scene);
    const versionLabel = activeVersion ? (activeVersion.label || `Version ${activeVersion.number}`) : '';

    if (!annotations || annotations.length === 0) {
        panel.innerHTML = `
                    <div class="annotations-panel-header">
                        <h3 style="margin: 0;">Annotations (0)</h3>
                        <span class="annotations-panel-close" onclick="closeAnnotationsPanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
                    </div>
                    ${versionLabel ? `<div style="font-size: 0.75rem; color: var(--text-muted); padding: 0.5rem 1rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);"><i data-lucide="pin" style="width:12px;height:12px;vertical-align:middle;margin-right:6px;"></i> ${versionLabel}</div>` : ''}
                    <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucune annotation pour cette version</p>
                `;
    } else {
        panel.innerHTML = `
                    <div class="annotations-panel-header">
                        <h3 style="margin: 0;">Annotations (${annotations.length})</h3>
                        <span class="annotations-panel-close" onclick="closeAnnotationsPanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
                    </div>
                    ${versionLabel ? `<div style="font-size: 0.75rem; color: var(--text-muted); padding: 0.5rem 1rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);"><i data-lucide="pin" style="width:12px;height:12px;vertical-align:middle;margin-right:6px;"></i> ${versionLabel}</div>` : ''}
                    ${annotations.map(a => `
                        <div class="annotation-card ${a.type}" onclick="scrollToAnnotation(${a.id})">
                            <div class="annotation-type ${a.type}">${getAnnotationTypeLabel(a.type)}</div>
                            <div class="annotation-content">${a.text}</div>
                            ${a.context ? `<div class="annotation-context">"${a.context}"</div>` : ''}
                            ${a.type === 'todo' ? `
                                <button class="btn btn-small ${a.completed ? 'btn-primary' : ''}" 
                                        onclick="event.stopPropagation(); toggleAnnotationComplete(${a.id})" 
                                        style="margin-top: 0.5rem;">
                                    ${a.completed ? '<i data-lucide="check" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>Terminé' : '<i data-lucide="circle" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>À faire'}
                                </button>
                            ` : ''}
                            <button class="btn btn-small" onclick="event.stopPropagation(); deleteAnnotation(${a.id})" 
                                    style="margin-top: 0.5rem;"><i data-lucide="trash-2" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>Supprimer</button>
                        </div>
                    `).join('')}
                `;
    }

    // Afficher le panneau
    parentPanel.classList.remove('hidden');
}



// [MVVM : ViewModel]
// Alterne l'affichage du panneau des annotations.
function toggleAnnotationsPanel() {
    const panel = document.getElementById('annotationsPanel');
    if (panel.classList.contains('hidden')) {
        renderAnnotationsPanel();
        updateAnnotationsButton(true);
    } else {
        panel.classList.add('hidden');
        updateAnnotationsButton(false);
    }
}

// [MVVM : View]
// Masque le panneau des annotations.
function closeAnnotationsPanel() {
    const panel = document.getElementById('annotationsPanel');
    if (panel) {
        panel.classList.add('hidden');
        updateAnnotationsButton(false);
    }
}

// [MVVM : View]
// Met à jour les compteurs et l'état visuel des boutons d' accès aux annotations.
function updateAnnotationsButton(isOpen) {
    const sidebarBtn = document.getElementById('sidebarAnnotationsBtn');
    const sidebarBadge = document.getElementById('annotationsBadge');
    const todosBadge = document.getElementById('todosBadge');

    // Compter les annotations et TODOs de la scène courante (version active)
    let annotationCount = 0;
    let todoCount = 0;

    if (currentSceneId) {
        const act = project.acts.find(a => a.id === currentActId);
        if (act) {
            const chapter = act.chapters.find(c => c.id === currentChapterId);
            if (chapter) {
                const scene = chapter.scenes.find(s => s.id === currentSceneId);
                if (scene) {
                    const annotations = getVersionAnnotations(scene);
                    annotationCount = annotations.length;
                    todoCount = annotations.filter(a => a.type === 'todo' && !a.completed).length;
                }
            }
        }
    }

    // Compter tous les TODOs non complétés du projet (toutes versions actives)
    let totalTodos = 0;
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const annotations = getVersionAnnotations(scene);
                totalTodos += annotations.filter(a => a.type === 'todo' && !a.completed).length;
            });
        });
    });


    // Mettre à jour le bouton sidebar annotations
    if (sidebarBtn) {
        if (isOpen) {
            sidebarBtn.classList.add('active');
        } else {
            sidebarBtn.classList.remove('active');
        }
    }

    // Mettre à jour le badge sidebar annotations
    if (sidebarBadge) {
        if (annotationCount > 0) {
            sidebarBadge.style.display = 'inline';
            sidebarBadge.textContent = annotationCount > 9 ? '9+' : annotationCount;
        } else {
            sidebarBadge.style.display = 'none';
        }
    }

    // Mettre à jour le badge sidebar TODOs
    if (todosBadge) {
        if (totalTodos > 0) {
            todosBadge.style.display = 'inline';
            todosBadge.textContent = totalTodos > 9 ? '9+' : totalTodos;
        } else {
            todosBadge.style.display = 'none';
        }
    }

    // Mettre à jour les nouveaux badges de la toolbar verticale
    const toolAnnotationsBtn = document.getElementById('toolAnnotationsBtn');
    const toolAnnotationsBadge = document.getElementById('toolAnnotationsBadge');
    const toolTodosBtn = document.getElementById('toolTodosBtn');
    const toolTodosBadge = document.getElementById('toolTodosBadge');

    // Badge annotations de la toolbar verticale
    if (toolAnnotationsBadge) {
        if (annotationCount > 0) {
            toolAnnotationsBadge.style.display = 'inline';
            toolAnnotationsBadge.textContent = annotationCount > 9 ? '9+' : annotationCount;
        } else {
            toolAnnotationsBadge.style.display = 'none';
        }
    }

    // Badge TODOs de la toolbar verticale
    if (toolTodosBadge) {
        if (totalTodos > 0) {
            toolTodosBadge.style.display = 'inline';
            toolTodosBadge.textContent = totalTodos > 9 ? '9+' : totalTodos;
        } else {
            toolTodosBadge.style.display = 'none';
        }
    }

    // État actif des boutons de la toolbar
    if (toolAnnotationsBtn) {
        if (isOpen) {
            toolAnnotationsBtn.classList.add('active');
        } else {
            toolAnnotationsBtn.classList.remove('active');
        }
    }
}

// [MVVM : Other]
// Group: Util / Helper | Naming: AnnotationUtils
// Fonction utilitaire retournant le libellé lisible d' un type d' annotation.
function getAnnotationTypeLabel(type) {
    const labels = {
        comment: 'Commentaire',
        todo: 'TODO',
        note: 'Note',
        question: 'Question'
    };
    return labels[type] || type;
}

// ============ ANNOTATIONS LIÉES AUX VERSIONS ============

// Obtenir la version active d'une scène (ou créer une version par défaut)
// [MVVM : Model]
// Récupère la version active d' une scène.
function getActiveVersion(scene) {
    if (!scene.versions || scene.versions.length === 0) {
        return null;
    }
    return scene.versions.find(v => v.isActive) || scene.versions[scene.versions.length - 1];
}

// Obtenir les annotations de la version active
// [MVVM : Model]
// Récupère la liste des annotations pour la version active d' une scène.
function getVersionAnnotations(scene) {
    const activeVersion = getActiveVersion(scene);
    if (activeVersion) {
        if (!activeVersion.annotations) {
            activeVersion.annotations = [];
        }
        return activeVersion.annotations;
    }
    // Fallback: annotations au niveau scène (anciennes données)
    if (!scene.annotations) {
        scene.annotations = [];
    }
    return scene.annotations;
}

// Ajouter une annotation à la version active
// [MVVM : Model]
// Ajoute une annotation à la version désirée.
function addVersionAnnotation(scene, annotation) {
    const activeVersion = getActiveVersion(scene);
    if (activeVersion) {
        if (!activeVersion.annotations) {
            activeVersion.annotations = [];
        }
        activeVersion.annotations.push(annotation);
    } else {
        // Fallback si pas de version
        if (!scene.annotations) {
            scene.annotations = [];
        }
        scene.annotations.push(annotation);
    }
}

// Supprimer une annotation de la version active
// [MVVM : Model]
// Supprime une annotation de la version.
function removeVersionAnnotation(scene, annotationId) {
    const activeVersion = getActiveVersion(scene);
    if (activeVersion && activeVersion.annotations) {
        activeVersion.annotations = activeVersion.annotations.filter(a => a.id !== annotationId);
    } else if (scene.annotations) {
        scene.annotations = scene.annotations.filter(a => a.id !== annotationId);
    }
}

// Trouver une annotation dans la version active
// [MVVM : Model]
// Recherche une annotation spécifique par son ID.
function findVersionAnnotation(scene, annotationId) {
    const annotations = getVersionAnnotations(scene);
    return annotations.find(a => a.id === annotationId);
}

// Migrer les annotations d'une scène vers sa version active (migration one-time)
// [MVVM : Model]
// Assure la compatibilité en migrant les anciennes annotations vers le nouveau système de versions.
function migrateSceneAnnotationsToVersion(scene) {
    if (scene.annotations && scene.annotations.length > 0) {
        const activeVersion = getActiveVersion(scene);
        if (activeVersion) {
            if (!activeVersion.annotations) {
                activeVersion.annotations = [];
            }
            // Migrer seulement si la version n'a pas déjà ces annotations
            scene.annotations.forEach(ann => {
                if (!activeVersion.annotations.find(a => a.id === ann.id)) {
                    activeVersion.annotations.push(ann);
                }
            });
            // Vider les annotations au niveau scène après migration
            scene.annotations = [];
            return true; // Migration effectuée
        }
    }
    return false;
}

// ============ FIN ANNOTATIONS LIÉES AUX VERSIONS ============

// [MVVM : Other]
// Group: Use Case | Naming: ToggleAnnotationCompleteUseCase
// Alterne l' état d' achèvement d' une annotation et rafraîchit l' interface.
function toggleAnnotationComplete(annotationId) {
    const act = project.acts.find(a => a.id === currentActId);
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    const scene = chapter.scenes.find(s => s.id === currentSceneId);
    const annotation = findVersionAnnotation(scene, annotationId);

    if (annotation) {
        annotation.completed = !annotation.completed;
        saveProject();
        renderAnnotationsPanel();
        renderActsList();
    }
}

// [MVVM : Other]
// Group: Use Case | Naming: DeleteAnnotationUseCase
// Supprime une annotation du modèle et retire son marqueur visuel de l' éditeur.
function deleteAnnotation(annotationId) {
    if (!confirm('Supprimer cette annotation ?')) return;

    const act = project.acts.find(a => a.id === currentActId);
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    const scene = chapter.scenes.find(s => s.id === currentSceneId);

    // Supprimer le marqueur visuel dans l'éditeur
    const marker = document.getElementById(`annotation-${annotationId}`);
    if (marker) {
        // Remplacer le span par son contenu textuel
        const textContent = marker.textContent;
        const textNode = document.createTextNode(textContent);
        marker.parentNode.replaceChild(textNode, marker);

        // Mettre à jour le contenu de la scène avec le HTML nettoyé
        const editor = document.querySelector('.editor-textarea');
        if (editor) {
            scene.content = editor.innerHTML;
            // Mettre à jour aussi la version active
            const activeVersion = getActiveVersion(scene);
            if (activeVersion) {
                activeVersion.content = editor.innerHTML;
            }
        }
    }

    // Aussi nettoyer dans scene.content si le marqueur est sauvegardé (fallback)
    if (scene.content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = scene.content;
        const savedMarker = tempDiv.querySelector(`#annotation-${annotationId}, [data-annotation-id="${annotationId}"]`);
        if (savedMarker) {
            const textContent = savedMarker.textContent;
            const textNode = document.createTextNode(textContent);
            savedMarker.parentNode.replaceChild(textNode, savedMarker);
            scene.content = tempDiv.innerHTML;
        }
    }

    // Supprimer l'annotation de la version active
    removeVersionAnnotation(scene, annotationId);

    // Mettre à jour aussi le contenu de la version active (fallback)
    const activeVersion = getActiveVersion(scene);
    if (activeVersion && activeVersion.content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = activeVersion.content;
        const versionMarker = tempDiv.querySelector(`#annotation-${annotationId}, [data-annotation-id="${annotationId}"]`);
        if (versionMarker) {
            const textContent = versionMarker.textContent;
            const textNode = document.createTextNode(textContent);
            versionMarker.parentNode.replaceChild(textNode, versionMarker);
            activeVersion.content = tempDiv.innerHTML;
        }
    }

    saveProject();
    renderAnnotationsPanel();
    renderActsList();
    showNotification('✓ Annotation supprimée');
}

// [MVVM : View]
// Fait défiler l' éditeur pour centrer une annotation spécifique.
function scrollToAnnotation(annotationId) {
    // NE PAS fermer le panneau - l'utilisateur veut peut-être voir plusieurs annotations

    // Trouver le marqueur dans le texte
    const marker = document.getElementById(`annotation-${annotationId}`);

    if (marker) {
        // Trouver le conteneur scrollable de l'éditeur
        const editorWorkspace = document.querySelector('.editor-workspace');

        if (editorWorkspace) {
            // Calculer la position relative du marqueur
            const markerRect = marker.getBoundingClientRect();
            const workspaceRect = editorWorkspace.getBoundingClientRect();

            // Calculer le scroll nécessaire pour centrer le marqueur
            const targetScroll = editorWorkspace.scrollTop + (markerRect.top - workspaceRect.top) - (workspaceRect.height / 2);

            editorWorkspace.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: 'smooth'
            });
        }

        // Highlighter temporairement
        highlightAnnotation(annotationId);
    } else {
        // Si le marqueur n'existe pas (ancienne annotation), juste informer
        console.warn(`Marqueur annotation-${annotationId} introuvable`);
        showNotification('Annotation non localisée dans le texte');
    }
}

// [MVVM : View]
// Crée une animation visuelle pour mettre en évidence une annotation dans le texte.
function highlightAnnotation(annotationId) {
    const marker = document.getElementById(`annotation-${annotationId}`);
    if (!marker) return;

    // Sauvegarder le style original
    const originalStyle = marker.style.cssText;

    // Ajouter une animation de highlight
    marker.style.cssText = originalStyle + ' background: rgba(212, 175, 55, 0.8) !important; transition: background 0.3s;';

    // Pulser 3 fois
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
        if (pulseCount >= 6) {
            clearInterval(pulseInterval);
            // Restaurer le style original
            marker.style.cssText = originalStyle;
            return;
        }

        if (pulseCount % 2 === 0) {
            marker.style.cssText = originalStyle + ' background: rgba(212, 175, 55, 0.8) !important;';
        } else {
            marker.style.cssText = originalStyle;
        }
        pulseCount++;
    }, 400);
}
