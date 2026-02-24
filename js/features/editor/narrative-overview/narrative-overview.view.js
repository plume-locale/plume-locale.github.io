/**
 * [MVVM : View]
 * Narrative Overview - DOM rendering and manipulation
 *
 * Génère et met à jour le HTML du sidebar d'aperçu narratif (300px).
 * Affiche les passages en ordre chronologique avec :
 * - Groupes d'actes repliables
 * - Cartes de passages cliquables
 * - Distinction visuelle structure blocks vs passages réguliers
 */

class NarrativeOverviewView {
    /**
     * Constructeur de la vue
     *
     * @param {NarrativeOverviewViewModel} viewModel - Instance du ViewModel
     */
    constructor(viewModel) {
        this.viewModel = viewModel;
        this.containerId = 'narrativeOverviewSidebar';
    }

    /**
     * Génère et injecte le HTML complet du sidebar
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('[NarrativeOverviewView] Container not found:', this.containerId);
            return;
        }

        const passagesByAct = this.viewModel.getPassagesByAct();
        const stats = this.viewModel.getStatistics();

        let html = `
            <div class="narrative-overview-header">
                <div class="narrative-overview-title-row">
                    <h3 class="narrative-overview-title">
                        <i data-lucide="book-open" style="width:18px;height:18px;"></i>
                        Aperçu Narratif
                    </h3>
                    <div class="narrative-overview-actions">
                        <button class="narrative-overview-btn ${this.viewModel.compactMode ? 'active' : ''}"
                                onclick="NarrativeOverviewHandlers.toggleCompactMode()"
                                title="${this.viewModel.compactMode ? 'Vue détaillée' : 'Vue compacte'}">
                            <i data-lucide="${this.viewModel.compactMode ? 'list' : 'rows-3'}" style="width:14px;height:14px;"></i>
                        </button>
                        <button class="narrative-overview-btn" onclick="NarrativeOverviewMain.refresh()" title="Rafraîchir">
                            <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i>
                        </button>
                        <button class="narrative-overview-btn" onclick="NarrativeOverviewMain.hide()" title="Fermer">
                            <i data-lucide="x" style="width:14px;height:14px;"></i>
                        </button>
                    </div>
                </div>
                <div class="narrative-overview-stats">
                    ${stats.total} passage${stats.total > 1 ? 's' : ''}
                    (${stats.structureBlocks} structuré${stats.structureBlocks > 1 ? 's' : ''})
                </div>
            </div>
            <div class="narrative-overview-content">
        `;

        if (passagesByAct.length === 0) {
            html += `
                <div class="narrative-empty-state">
                    <i data-lucide="inbox" style="width:48px;height:48px;opacity:0.3;"></i>
                    <p style="margin-top:1rem;color:var(--text-muted);">Aucun passage trouvé</p>
                </div>
            `;
        } else if (passagesByAct.length === 1) {
            // Un seul acte : afficher les passages directement sans wrapper d'acte
            passagesByAct[0].passages.forEach(p => {
                html += this.viewModel.compactMode ? this.renderPassageCompact(p) : this.renderPassage(p);
            });
        } else {
            passagesByAct.forEach(actGroup => {
                const isCollapsed = this.viewModel.isActCollapsed(actGroup.actId);
                html += this.renderActGroup(actGroup, isCollapsed);
            });
        }

        html += `</div>`;
        container.innerHTML = html;

        // Initialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Génère le HTML d'un groupe d'acte
     *
     * @param {Object} actGroup - Objet { actId, actTitle, passages }
     * @param {boolean} isCollapsed - État de collapse
     * @returns {string} HTML du groupe
     */
    renderActGroup(actGroup, isCollapsed) {
        const iconName = isCollapsed ? 'chevron-right' : 'chevron-down';

        return `
            <div class="narrative-act-group" data-act-id="${actGroup.actId}">
                <div class="narrative-act-header" onclick="NarrativeOverviewHandlers.toggleAct(${actGroup.actId})">
                    <i data-lucide="${iconName}" style="width:14px;height:14px;"></i>
                    <span class="narrative-act-title">${this.escapeHtml(actGroup.actTitle)}</span>
                    <span class="narrative-act-count">(${actGroup.passages.length})</span>
                </div>
                <div class="narrative-passages-list ${isCollapsed ? 'collapsed' : ''}">
                    ${actGroup.passages.map(p => this.viewModel.compactMode ? this.renderPassageCompact(p) : this.renderPassage(p)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Génère le HTML d'un passage individuel
     *
     * @param {Object} passage - Objet passage
     * @returns {string} HTML du passage
     */
    renderPassage(passage) {
        const isActive = this.viewModel.activePassageId === passage.id;
        const typeClass = passage.type === NarrativeOverviewModel.PASSAGE_TYPES.STRUCTURE_BLOCK
            ? 'passage-structure-block'
            : 'passage-regular';

        let passageStyle = '';
        if (passage.color) {
            passageStyle = `style="--passage-color: ${passage.color};"`;
        }

        return `
            <div class="narrative-passage ${typeClass} ${isActive ? 'active' : ''}"
                 data-passage-id="${passage.id}"
                 data-scene-id="${passage.sceneId}"
                 data-chapter-id="${passage.chapterId}"
                 data-act-id="${passage.actId}"
                 data-position="${passage.position}"
                 ${passageStyle}
                 onclick="NarrativeOverviewHandlers.navigateToPassage('${passage.id}')">

                ${passage.label ? `
                    <div class="passage-label" style="color: ${passage.color || '#ff8c42'};">
                        ${this.escapeHtml(passage.label)}
                    </div>
                ` : ''}

                <div class="passage-context">
                    ${this.escapeHtml(passage.sceneTitle)} • ${this.escapeHtml(passage.chapterTitle)}
                </div>

                <div class="passage-preview">
                    ${this.escapeHtml(passage.content)}
                </div>

                <div class="passage-meta">
                    <span>${passage.wordCount} mot${passage.wordCount > 1 ? 's' : ''}</span>
                </div>
            </div>
        `;
    }

    /**
     * Génère le HTML compact d'un passage (label + mots uniquement)
     *
     * @param {Object} passage - Objet passage
     * @returns {string} HTML compact du passage
     */
    renderPassageCompact(passage) {
        const isActive = this.viewModel.activePassageId === passage.id;
        const isStructure = passage.type === NarrativeOverviewModel.PASSAGE_TYPES.STRUCTURE_BLOCK;
        const typeClass = isStructure ? 'passage-structure-block' : 'passage-regular';
        const color = passage.color || '#ff8c42';
        const label = passage.label || 'TEXTE';

        let passageStyle = '';
        if (passage.color) {
            passageStyle = `style="--passage-color: ${passage.color};"`;
        }

        return `
            <div class="narrative-passage-compact ${typeClass} ${isActive ? 'active' : ''}"
                 data-passage-id="${passage.id}"
                 data-scene-id="${passage.sceneId}"
                 data-chapter-id="${passage.chapterId}"
                 data-act-id="${passage.actId}"
                 data-position="${passage.position}"
                 ${passageStyle}
                 onclick="NarrativeOverviewHandlers.navigateToPassage('${passage.id}')">
                <span class="compact-label" style="color: ${isStructure ? color : 'var(--text-muted)'};">
                    ${this.escapeHtml(label)}
                </span>
                <span class="compact-words">${passage.wordCount} mots</span>
            </div>
        `;
    }

    /**
     * Met à jour l'indicateur de passage actif
     *
     * @param {string} passageId - ID du passage à activer
     */
    updateActivePassage(passageId) {
        // Retirer l'état actif de tous les passages
        const allPassages = document.querySelectorAll('.narrative-passage');
        allPassages.forEach(el => el.classList.remove('active'));

        // Ajouter l'état actif au passage ciblé
        const activeEl = document.querySelector(`[data-passage-id="${passageId}"]`);
        if (activeEl) {
            activeEl.classList.add('active');

            // Scroll pour rendre visible (si pas déjà visible)
            activeEl.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    /**
     * Met à jour uniquement l'icône d'un groupe d'acte
     *
     * @param {number} actId - ID de l'acte
     * @param {boolean} isExpanded - Nouvel état
     */
    updateActIcon(actId, isExpanded) {
        const actGroup = document.querySelector(`[data-act-id="${actId}"]`);
        if (!actGroup) return;

        const icon = actGroup.querySelector('.narrative-act-header i');
        const passesList = actGroup.querySelector('.narrative-passages-list');

        if (icon) {
            icon.setAttribute('data-lucide', isExpanded ? 'chevron-down' : 'chevron-right');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        if (passesList) {
            if (isExpanded) {
                passesList.classList.remove('collapsed');
            } else {
                passesList.classList.add('collapsed');
            }
        }
    }

    /**
     * Met à jour les statistiques dans le header
     */
    updateStats() {
        const stats = this.viewModel.getStatistics();
        const statsEl = document.querySelector('.narrative-overview-stats');

        if (statsEl) {
            statsEl.textContent =
                `${stats.total} passage${stats.total > 1 ? 's' : ''} ` +
                `(${stats.structureBlocks} structuré${stats.structureBlocks > 1 ? 's' : ''})`;
        }
    }

    /**
     * Échappe les caractères HTML pour éviter les injections
     *
     * @param {string} text - Texte à échapper
     * @returns {string} Texte échappé
     */
    escapeHtml(text) {
        if (!text) return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Affiche un message temporaire dans le sidebar
     *
     * @param {string} message - Message à afficher
     * @param {string} type - Type de message (info, success, error)
     */
    showMessage(message, type = 'info') {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `narrative-message narrative-message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: absolute;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            padding: 0.75rem 1rem;
            background: var(--bg-accent);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-size: 0.85rem;
        `;

        container.appendChild(messageEl);

        // Retirer après 3 secondes
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}
