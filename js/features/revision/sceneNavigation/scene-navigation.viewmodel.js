/**
 * [ViewModel : Scene Navigation]
 * Logique métier pour la navigation entre scènes.
 */

const sceneNavigationViewModel = {
    /**
     * Détecte le contexte de la scène à partir de l'éditeur.
     */
    detectSceneContext(editor) {
        // Resolve global variables (support 'let' scope vs 'window' property)
        const gSceneId = (typeof currentSceneId !== 'undefined') ? currentSceneId : (window.currentSceneId || null);
        const gChapterId = (typeof currentChapterId !== 'undefined') ? currentChapterId : (window.currentChapterId || null);
        const gActId = (typeof currentActId !== 'undefined') ? currentActId : (window.currentActId || null);

        // Mode scène unique : utiliser les variables globales si définies
        if (gSceneId && gChapterId && gActId) {
            return {
                sceneId: gSceneId,
                chapterId: gChapterId,
                actId: gActId
            };
        }

        // Mode chapitre ou acte : récupérer depuis les attributs data-*
        const sceneId = editor.getAttribute('data-scene-id');
        const chapterId = editor.getAttribute('data-chapter-id') || gChapterId;
        const actId = editor.getAttribute('data-act-id') || gActId;

        if (sceneId && chapterId && actId) {
            return {
                sceneId: parseInt(sceneId, 10),
                chapterId: parseInt(chapterId, 10),
                actId: parseInt(actId, 10)
            };
        }

        // Essayer de trouver via le parent
        const sceneBlock = editor.closest('[data-scene-id]');
        if (sceneBlock) {
            const blockSceneId = sceneBlock.getAttribute('data-scene-id');
            const blockChapterId = sceneBlock.getAttribute('data-chapter-id') || gChapterId;
            const blockActId = sceneBlock.getAttribute('data-act-id') || gActId;

            if (blockSceneId && blockChapterId && blockActId) {
                return {
                    sceneId: parseInt(blockSceneId, 10),
                    chapterId: parseInt(blockChapterId, 10),
                    actId: parseInt(blockActId, 10)
                };
            }
        }

        return null;
    },

    /**
     * Obtient les scènes adjacentes basées sur le contexte actuel.
     */
    getAdjacentScenes(ctx) {
        const result = {
            previous: null,
            next: null,
            prevLocation: null,
            nextLocation: null
        };

        if (!ctx) return result;

        const allScenes = window.sceneNavigationRepository.getFlatScenes();
        console.log('[SceneNavModel] Scenes:', allScenes.length, 'Target:', ctx);
        if (allScenes.length > 0) console.log('[SceneNavModel] First:', allScenes[0]);

        const currentIndex = allScenes.findIndex(
            s => s.actId == ctx.actId &&
                s.chapterId == ctx.chapterId &&
                s.scene.id == ctx.sceneId
        );
        console.log('[SceneNavModel] Index:', currentIndex);

        if (currentIndex === -1) return result;

        if (currentIndex > 0) {
            const prev = allScenes[currentIndex - 1];
            result.previous = prev.scene;
            result.prevLocation = { actId: prev.actId, chapterId: prev.chapterId };
        }

        if (currentIndex < allScenes.length - 1) {
            const next = allScenes[currentIndex + 1];
            result.next = next.scene;
            result.nextLocation = { actId: next.actId, chapterId: next.chapterId };
        }

        return result;
    },

    /**
     * Compte les mots d'un texte.
     */
    countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        const trimmed = text.trim();
        if (trimmed === '') return 0;
        return trimmed.split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Extrait le texte avant ou après le curseur.
     */
    extractTextAtCursor(editor, range, type = 'before') {
        try {
            const extractRange = document.createRange();
            if (type === 'before') {
                extractRange.setStart(editor, 0);
                extractRange.setEnd(range.startContainer, range.startOffset);
            } else {
                extractRange.setStart(range.endContainer, range.endOffset);
                if (editor.lastChild) {
                    extractRange.setEndAfter(editor.lastChild);
                } else {
                    extractRange.setEnd(editor, editor.childNodes.length);
                }
            }

            const fragment = extractRange.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);

            return {
                html: tempDiv.innerHTML,
                text: tempDiv.textContent || '',
                range: extractRange
            };
        } catch (e) {
            console.error("Error extracting text:", e);
            return null;
        }
    },

    /**
     * Déplace le texte vers la scène précédente.
     */
    moveTextToPrevious(editor, range) {
        const ctx = window.sceneNavigationModel.activeSceneContext;
        const adjacent = this.getAdjacentScenes(ctx);
        if (!adjacent.previous) return { success: false, message: Localization.t('sceneNav.noPrevScene') };

        const extraction = this.extractTextAtCursor(editor, range, 'before');
        if (!extraction || !extraction.html.trim() || extraction.html.trim() === '<br>') {
            return { success: false, message: Localization.t('sceneNav.noTextBefore') };
        }

        window.sceneNavigationRepository.saveToHistory();

        // Supprimer du DOM
        extraction.range.deleteContents();
        window.sceneNavigationView.cleanEditorStart(editor);

        // Mettre à jour les données
        const currentScene = window.sceneNavigationRepository.findScene(ctx.actId, ctx.chapterId, ctx.sceneId);
        if (currentScene) {
            window.sceneNavigationRepository.updateSceneContent(currentScene, editor.innerHTML);
        }

        const prevScene = adjacent.previous;
        const separator = this.getSeparator(prevScene.content, extraction.html, 'end');
        window.sceneNavigationRepository.updateSceneContent(prevScene, prevScene.content + separator + extraction.html);

        // Sync UI
        window.sceneNavigationRepository.saveProject();
        window.sceneNavigationRepository.refreshUI();
        window.sceneNavigationView.updateAdjacentEditor(prevScene.id, prevScene.content);

        return { success: true, sceneTitle: prevScene.title };
    },

    /**
     * Déplace le texte vers la scène suivante.
     */
    moveTextToNext(editor, range) {
        const ctx = window.sceneNavigationModel.activeSceneContext;
        const adjacent = this.getAdjacentScenes(ctx);
        if (!adjacent.next) return { success: false, message: Localization.t('sceneNav.noNextScene') };

        const extraction = this.extractTextAtCursor(editor, range, 'after');
        if (!extraction || !extraction.html.trim() || extraction.html.trim() === '<br>') {
            return { success: false, message: Localization.t('sceneNav.noTextAfter') };
        }

        window.sceneNavigationRepository.saveToHistory();

        // Supprimer du DOM
        extraction.range.deleteContents();
        window.sceneNavigationView.cleanEditorEnd(editor);

        // Mettre à jour les données
        const currentScene = window.sceneNavigationRepository.findScene(ctx.actId, ctx.chapterId, ctx.sceneId);
        if (currentScene) {
            window.sceneNavigationRepository.updateSceneContent(currentScene, editor.innerHTML);
        }

        const nextScene = adjacent.next;
        const separator = this.getSeparator(nextScene.content, extraction.html, 'start');
        window.sceneNavigationRepository.updateSceneContent(nextScene, extraction.html + separator + nextScene.content);

        // Sync UI
        window.sceneNavigationRepository.saveProject();
        window.sceneNavigationRepository.refreshUI();
        window.sceneNavigationView.updateAdjacentEditor(nextScene.id, nextScene.content);

        return { success: true, sceneTitle: nextScene.title };
    },

    /**
     * Détermine le séparateur HTML approprié.
     */
    getSeparator(existingContent, newContent, position) {
        if (!existingContent) return '';

        const endsWithBlock = existingContent.endsWith('<br>') || existingContent.endsWith('</p>') || existingContent.endsWith('</div>');
        const startsWithBlock = existingContent.startsWith('<br>') || existingContent.startsWith('<p>') || existingContent.startsWith('<div>');

        if (position === 'end') {
            return endsWithBlock ? '' : '<br><br>';
        } else {
            return startsWithBlock ? '' : '<br><br>';
        }
    }
};

window.sceneNavigationViewModel = sceneNavigationViewModel;
