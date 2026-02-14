/**
 * [MVVM : ViewModel]
 * MentionHelpViewModel - Orchestration de la logique entre Vue et Repository.
 */

const MentionHelpViewModel = {
    state: {
        active: false,
        trigger: '',
        query: '',
        suggestions: [],
        selectedIndex: 0,
        activeElement: null,
        cursorPos: 0,
        triggerPos: 0,
        savedRange: null
    },

    /**
     * Analyse l'input pour détecter un déclencheur de mention.
     */
    handleInput(element) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;

        // On ne travaille que si on est dans un node texte
        if (node.nodeType !== Node.TEXT_NODE) {
            this.close();
            return;
        }

        // On récupère le texte du node actuel jusqu'au curseur
        const textBefore = node.textContent.substring(0, range.startOffset);

        // Trouver le dernier trigger double avant le curseur dans ce node
        let trigger = null;
        let lastTriggerIndex = -1;

        const possibleTriggers = ['@@', '##', '!!', '??'];
        for (const pt of possibleTriggers) {
            const idx = textBefore.lastIndexOf(pt);
            if (idx > lastTriggerIndex) {
                lastTriggerIndex = idx;
                trigger = pt;
            }
        }

        if (lastTriggerIndex !== -1) {
            const charBefore = lastTriggerIndex > 0 ? textBefore[lastTriggerIndex - 1] : null;

            // On autorise : début de node, espace, ponctuation
            const isValidPrefix = !charBefore || /[\s\(\[\{\.\,\;\:\!\?\-\"\']/.test(charBefore);

            if (isValidPrefix) {
                const query = textBefore.substring(lastTriggerIndex + trigger.length);

                // Si on a un espace après le trigger + texte, on ferme (query finie)
                if (query.includes(' ')) {
                    this.close();
                    return;
                }

                this.state.trigger = trigger;
                this.state.query = query;
                this.state.activeElement = element;
                this.state.triggerPos = lastTriggerIndex;
                this.state.cursorPos = range.startOffset;

                // Important: sauvegarder le range actuel du node texte
                this.state.savedRange = range.cloneRange();

                this.updateSuggestions();
                return;
            }
        }

        this.close();
    },

    /**
     * Met à jour la liste des suggestions basées sur la recherche.
     */
    updateSuggestions() {
        // Contexte pour le scoring
        const context = {
            sceneId: typeof currentSceneId !== 'undefined' ? currentSceneId : null,
            presentIds: this.getPresentEntitiesInCurrentScene()
        };

        this.state.suggestions = MentionHelpRepository.search(this.state.trigger, this.state.query, context);

        if (this.state.suggestions.length > 0) {
            this.state.active = true;
            this.state.selectedIndex = 0;
            MentionHelpView.render(this.state.suggestions, this.state.selectedIndex, this.state.activeElement);
        } else {
            // Option "Créer rapidement" si aucun résultat
            if (this.state.query.length > 2) {
                this.state.active = true;
                MentionHelpView.renderQuickCreate(this.state.trigger, this.state.query, this.state.activeElement);
            } else {
                this.close();
            }
        }
    },

    /**
     * Gère la navigation au clavier.
     */
    handleKeyDown(e) {
        if (!this.state.active) return false;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.state.selectedIndex = (this.state.selectedIndex + 1) % this.state.suggestions.length;
                MentionHelpView.updateSelection(this.state.selectedIndex);
                return true;
            case 'ArrowUp':
                e.preventDefault();
                this.state.selectedIndex = (this.state.selectedIndex - 1 + this.state.suggestions.length) % this.state.suggestions.length;
                MentionHelpView.updateSelection(this.state.selectedIndex);
                return true;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                if (this.state.suggestions[this.state.selectedIndex]) {
                    this.selectSuggestion(this.state.suggestions[this.state.selectedIndex]);
                } else if (this.state.query.length > 2) {
                    this.performQuickCreate();
                }
                return true;
            case 'Escape':
                e.preventDefault();
                this.close();
                return true;
        }
        return false;
    },

    /**
     * Sélectionne une suggestion et l'insère dans l'élément actif.
     */
    selectSuggestion(suggestion) {
        console.log("MentionHelp: Selecting suggestion", suggestion);
        const el = this.state.activeElement;
        if (!el) return;
        const name = suggestion.name;

        if (el.isContentEditable) {
            this.insertIntoContentEditable(el, name, suggestion);
        } else {
            this.insertIntoInput(el, name, suggestion);
        }

        this.close();
    },

    /**
     * Exécute la création rapide.
     */
    performQuickCreate() {
        const newItem = MentionHelpRepository.quickCreate(this.state.trigger, this.state.query);
        if (newItem) {
            this.selectSuggestion({ name: newItem.name || newItem.title });
        }
    },

    /**
     * Insère le texte dans un input/textarea classique.
     */
    insertIntoInput(el, name, suggestion) {
        const query = this.state.query;
        const trigger = this.state.trigger;
        const totalLength = query.length + trigger.length;
        const value = el.value;

        const before = value.substring(0, this.state.cursorPos - totalLength);
        const after = value.substring(this.state.cursorPos);

        el.value = before + name + ' ' + after;

        // Repositionner le curseur
        const newPos = before.length + name.length + 1;
        el.setSelectionRange(newPos, newPos);
        el.focus();

        el.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /**
     * Inserts the text into an element contentEditable.
     */
    insertIntoContentEditable(el, name, suggestion) {
        // Créer un élément de mention structuré
        // On ne met PAS de préfixe (@, #) car l'utilisateur veut juste le texte pur
        const mentionHtml = `<span class="mention" data-mention-id="${suggestion.id}" data-mention-type="${suggestion.type}" contenteditable="false">${name}</span>&nbsp;`;

        this.insertHtmlAtCursor(mentionHtml);

        el.dispatchEvent(new Event('input', { bubbles: true }));
    },

    insertHtmlAtCursor(html) {
        const sel = window.getSelection();
        let range = this.state.savedRange || (sel.rangeCount > 0 ? sel.getRangeAt(0) : null);

        if (range) {
            try {
                const trigger = this.state.trigger;
                const totalLength = this.state.query.length + trigger.length;

                // 1. Restaurer la sélection sur le range sauvegardé
                sel.removeAllRanges();
                sel.addRange(range);

                // 2. Reculer le début du range pour englober "@@query"
                // On s'assure de modifier le range existant
                const startOffset = Math.max(0, range.startOffset - totalLength);
                range.setStart(range.startContainer, startOffset);

                // 3. Supprimer le texte
                range.deleteContents();

                // 4. Insérer le HTML proprement via un fragment
                // Note: insertNode insère au début du range, ce qui est exactement ce qu'on veut
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;
                const fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }

                const lastNode = fragment.lastChild;
                range.insertNode(fragment);

                // 5. Placer le curseur après l'élément inséré
                if (lastNode) {
                    const newRange = document.createRange();
                    newRange.setStartAfter(lastNode);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }

                // 6. Notifier l'éditeur
                if (this.state.activeElement) {
                    this.state.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                }

            } catch (e) {
                console.error("MentionHelp: Manual insertion failed", e);
                document.execCommand('insertHTML', false, html);
            }
        }
    },

    /**
     * Ferme la popup.
     */
    close() {
        this.state.active = false;
        this.state.suggestions = [];
        MentionHelpView.hide();
    },

    /**
     * Utilitaires de curseur.
     */
    getCursorPosition(el) {
        if (el.selectionStart !== undefined) return el.selectionStart;

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(el);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            return preCaretRange.toString().length;
        }
        return 0;
    },

    setCursorAtPosition(el, pos) {
        const selection = window.getSelection();
        const range = document.createRange();

        // Simplification pour texte plat dans contenteditable
        if (el.firstChild) {
            const node = el.firstChild;
            const length = node.textContent.length;
            range.setStart(node, Math.min(pos, length));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    },

    /**
     * Récupère les IDs des entités présentes dans la scène actuelle.
     */
    getPresentEntitiesInCurrentScene() {
        if (typeof project === 'undefined' || typeof currentSceneId === 'undefined') return [];

        // Chercher la scène
        let currentScene = null;
        project.acts.forEach(a => {
            a.chapters.forEach(c => {
                const s = c.scenes.find(sc => sc.id === currentSceneId);
                if (s) currentScene = s;
            });
        });

        if (!currentScene) return [];

        return [
            ...(currentScene.confirmedPresentCharacters || []),
            ...(currentScene.linkedElements || [])
        ];
    }
};
