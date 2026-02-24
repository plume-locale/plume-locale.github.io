/**
 * [MVVM : Repository]
 * Narrative Overview - Data extraction from project
 *
 * Extrait tous les passages du projet (livre entier).
 * Parse le contenu HTML de chaque scène pour identifier :
 * - Les blocs de structure (.structure-block)
 * - Le texte régulier (hors blocs de structure)
 */

const NarrativeOverviewRepository = {

    /**
     * Extrait tous les passages de tout le livre
     *
     * @returns {Array} Liste de tous les passages en ordre chronologique
     */
    extractAllPassages() {
        if (typeof project === 'undefined' || !project || !project.acts) {
            console.warn('[NarrativeOverviewRepository] Project not loaded');
            return [];
        }

        const passages = [];
        let globalPosition = 0;

        // Accumulateur global de texte régulier (traverse les scènes)
        let reg = null;

        // [MVVM : Repository] Helpers internes
        const self = this;

        function flushRegular() {
            if (reg && reg.fullContent.trim().length >= 20) {
                passages.push(NarrativeOverviewModel.createPassage(
                    NarrativeOverviewModel.PASSAGE_TYPES.REGULAR,
                    { ...reg, position: globalPosition }
                ));
                globalPosition++;
            }
            reg = null;
        }

        function accumulateText(text, act, chapter, scene) {
            if (!text || text.trim().length === 0) return;
            const trimmed = text.trim();

            if (!reg) {
                reg = {
                    actId: act.id,
                    actTitle: act.title,
                    chapterId: chapter.id,
                    chapterTitle: chapter.title,
                    sceneId: scene.id,
                    sceneTitle: scene.title,
                    content: self.generatePreview(trimmed),
                    fullContent: trimmed,
                    wordCount: self.countWords(trimmed)
                };
            } else {
                reg.fullContent += '\n\n' + trimmed;
                reg.content = self.generatePreview(reg.fullContent);
                reg.wordCount += self.countWords(trimmed);
                // Mettre à jour le titre si scène différente
                if (reg.sceneId !== scene.id) {
                    if (!reg.sceneTitle.includes(' → ')) {
                        reg.sceneTitle = reg.sceneTitle + ' → ' + scene.title;
                    } else {
                        reg.sceneTitle = reg.sceneTitle.replace(/ → [^→]+$/, ' → ' + scene.title);
                    }
                }
            }
        }

        // Passe unique sur tout le contenu du livre
        // Utilise des sentinels pour trouver les SB à TOUTE profondeur du DOM
        const SENTINEL = '\u0000SB\u0000';

        project.acts.forEach(act => {
            if (!act.chapters || !Array.isArray(act.chapters)) return;

            // Flush à chaque frontière d'acte
            flushRegular();

            act.chapters.forEach(chapter => {
                if (!chapter.scenes || !Array.isArray(chapter.scenes)) return;

                chapter.scenes.forEach(scene => {
                    if (!scene.content || scene.content.trim() === '') return;

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = scene.content;

                    // Retirer les éléments système
                    tempDiv.querySelectorAll('.scene-separator, .chapter-separator, .editor-act-separator')
                        .forEach(el => el.remove());

                    // Trouver TOUS les structure blocks (quelle que soit la profondeur)
                    const structureBlocks = Array.from(tempDiv.querySelectorAll('.structure-block'));

                    if (structureBlocks.length === 0) {
                        // Aucun SB : accumuler tout le texte de la scène
                        accumulateText(tempDiv.textContent, act, chapter, scene);
                    } else {
                        // Extraire les données de chaque SB avant de modifier le DOM
                        const sbData = structureBlocks.map(block => {
                            const labelEl = block.querySelector('.structure-block-label');
                            const label = labelEl ? labelEl.textContent.trim() : 'SCENE BEAT';
                            const color = block.style.getPropertyValue('--accent-color') || '#ff8c42';
                            const contentEl = block.querySelector('.structure-block-content');
                            const fullContent = contentEl ? contentEl.textContent.trim() : '';
                            return { label, color, fullContent };
                        });

                        // Remplacer chaque SB par un marqueur sentinel dans le DOM
                        structureBlocks.forEach(block => {
                            const marker = document.createTextNode(SENTINEL);
                            block.parentNode.replaceChild(marker, block);
                        });

                        // Découper le texte résultant par les sentinels
                        const segments = tempDiv.textContent.split(SENTINEL);

                        // Intercaler : texte[0], SB[0], texte[1], SB[1], ..., texte[n]
                        segments.forEach((segment, i) => {
                            accumulateText(segment, act, chapter, scene);

                            if (i < sbData.length) {
                                flushRegular();

                                passages.push(NarrativeOverviewModel.createPassage(
                                    NarrativeOverviewModel.PASSAGE_TYPES.STRUCTURE_BLOCK,
                                    {
                                        actId: act.id,
                                        actTitle: act.title,
                                        chapterId: chapter.id,
                                        chapterTitle: chapter.title,
                                        sceneId: scene.id,
                                        sceneTitle: scene.title,
                                        content: self.generatePreview(sbData[i].fullContent),
                                        fullContent: sbData[i].fullContent,
                                        label: sbData[i].label,
                                        color: sbData[i].color,
                                        position: globalPosition,
                                        wordCount: self.countWords(sbData[i].fullContent)
                                    }
                                ));
                                globalPosition++;
                            }
                        });
                    }
                });
            });
        });

        // Flush le texte régulier restant en fin de livre
        flushRegular();

        return passages;
    },


    /**
     * Génère un aperçu de texte (premiers N caractères)
     *
     * @param {string} text - Texte complet
     * @param {number} maxLength - Longueur maximale de l'aperçu
     * @returns {string} Aperçu tronqué avec ellipse si nécessaire
     */
    generatePreview(text, maxLength = 80) {
        if (!text) return '';

        const cleaned = text.trim();
        if (cleaned.length <= maxLength) return cleaned;

        return cleaned.substring(0, maxLength).trim() + '...';
    },

    /**
     * Compte les mots dans un texte
     *
     * @param {string} text - Texte à analyser
     * @returns {number} Nombre de mots
     */
    countWords(text) {
        if (!text) return 0;

        // Utilise l'expression régulière Unicode pour détecter les mots
        // Supporte les caractères accentués et non-latins
        const matches = text.match(/[\p{L}]+/gu);
        return matches ? matches.length : 0;
    },

    /**
     * Récupère un passage par son ID
     *
     * @param {string} passageId - ID du passage
     * @param {Array} passages - Liste de passages (optionnel, sinon recharge)
     * @returns {Object|null} Passage trouvé ou null
     */
    getPassageById(passageId, passages = null) {
        const allPassages = passages || this.extractAllPassages();
        return allPassages.find(p => p.id === passageId) || null;
    }
};
