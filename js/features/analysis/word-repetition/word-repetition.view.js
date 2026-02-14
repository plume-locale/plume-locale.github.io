// ============================================================
// word-repetition.view.js - Vue de l'analyseur de répétitions
// ============================================================

/**
 * [MVVM : View]
 * Gestion de l'affichage de l'analyseur de répétitions
 */
const WordRepetitionView = {
    /**
     * [MVVM : View]
     * Rend le panneau complet de l'analyseur
     * @param {HTMLElement} container - Conteneur cible
     */
    renderPanel(container) {
        if (!container) return;

        const report = WordRepetitionViewModel.getCurrentReport();
        const prefs = WordRepetitionRepository.getPreferences();
        const state = WordRepetitionViewModel.getState();

        let html = `
            <div class="word-repetition-panel" id="wordRepetitionPanel">
                ${this._renderScopeSelector(state.currentScope)}
                ${this._renderSettingsPanel(prefs)}
                ${state.isAnalyzing ? this._renderLoading() : ''}
                ${report ? this._renderReport(report) : this._renderEmptyState()}
            </div>
        `;

        container.innerHTML = html;

        // Initialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 10);
        }
    },

    /**
     * [MVVM : View]
     * Rend le sélecteur de scope
     * @param {string} currentScope - Scope actuel
     * @returns {string} HTML
     * @private
     */
    _renderScopeSelector(currentScope) {
        const scopes = [
            { value: 'scene', label: Localization.t('repetition.scope.scene'), icon: 'file-text' },
            { value: 'chapter', label: Localization.t('repetition.scope.chapter'), icon: 'book-open' },
            { value: 'act', label: Localization.t('repetition.scope.act'), icon: 'layers' },
            { value: 'project', label: Localization.t('repetition.scope.project'), icon: 'folder' }
        ];

        return `
            <div class="word-rep-scope-selector">
                ${scopes.map(scope => `
                    <button class="scope-btn ${currentScope === scope.value ? 'active' : ''}"
                            onclick="WordRepetitionHandlers.onScopeChange('${scope.value}')"
                            title="${Localization.t('repetition.scope.analyze_title', scope.label.toLowerCase())}">
                        <i data-lucide="${scope.icon}" style="width: 12px; height: 12px;"></i>
                        <span>${scope.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend le panneau de paramètres
     * @param {Object} prefs - Préférences
     * @returns {string} HTML
     * @private
     */
    _renderSettingsPanel(prefs) {
        return `
            <div class="word-rep-settings" id="wordRepSettings" style="display: none;">
                <div class="settings-row">
                    <label>${Localization.t('repetition.settings.min_length')}</label>
                    <input type="number" id="prefMinWordLength" value="${prefs.minWordLength}" min="2" max="10"
                           onchange="WordRepetitionHandlers.onPrefChange('minWordLength', parseInt(this.value))">
                </div>
                <div class="settings-row">
                    <label>${Localization.t('repetition.settings.min_occurrences')}</label>
                    <input type="number" id="prefMinOccurrences" value="${prefs.minOccurrences}" min="2" max="20"
                           onchange="WordRepetitionHandlers.onPrefChange('minOccurrences', parseInt(this.value))">
                </div>
                <div class="settings-row">
                    <label>
                        <input type="checkbox" id="prefShowLow" ${prefs.showLowSeverity ? 'checked' : ''}
                               onchange="WordRepetitionHandlers.onPrefChange('showLowSeverity', this.checked)">
                        ${Localization.t('repetition.settings.show_low')}
                    </label>
                </div>
                <div class="settings-row">
                    <label>
                        <input type="checkbox" id="prefIgnoreNames" ${prefs.ignoreCharacterNames ? 'checked' : ''}
                               onchange="WordRepetitionHandlers.onPrefChange('ignoreCharacterNames', this.checked)">
                        ${Localization.t('repetition.settings.ignore_names')}
                    </label>
                </div>
                ${this._renderIgnoredWordsList(prefs.customIgnoredWords)}
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend la liste des mots ignorés personnalisés
     * @param {Array} words - Mots ignorés
     * @returns {string} HTML
     * @private
     */
    _renderIgnoredWordsList(words) {
        return `
            <div class="ignored-words-section">
                <div class="ignored-words-header">
                    <span>${Localization.t('repetition.settings.ignored_words_title', words.length)}</span>
                    <button class="btn btn-icon btn-small" onclick="WordRepetitionHandlers.onAddIgnoredWord()" title="${Localization.t('repetition.settings.add_ignored')}">
                        <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
                    </button>
                </div>
                <div class="ignored-words-list">
                    ${words.length > 0 ? words.map(word => `
                        <span class="ignored-word-tag">
                            ${word}
                            <i data-lucide="x" style="width: 10px; height: 10px; cursor: pointer;"
                               onclick="WordRepetitionHandlers.onRemoveIgnoredWord('${word}')"></i>
                        </span>
                    `).join('') : `<span class="text-muted" style="font-size: 0.75rem;">${Localization.t('repetition.settings.no_custom_ignored')}</span>`}
                </div>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend l'indicateur de chargement
     * @returns {string} HTML
     * @private
     */
    _renderLoading() {
        return `
            <div class="word-rep-loading">
                <div class="loading-spinner"></div>
                <span>${Localization.t('repetition.loading')}</span>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend l'état vide
     * @returns {string} HTML
     * @private
     */
    _renderEmptyState() {
        return `
            <div class="word-rep-empty">
                <i data-lucide="search" style="width: 32px; height: 32px; opacity: 0.3;"></i>
                <p>${Localization.t('repetition.empty_state', '<i data-lucide="refresh-cw" style="width: 12px; height: 12px; vertical-align: middle;"></i>')}</p>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend le rapport d'analyse
     * @param {Object} report - Rapport d'analyse
     * @returns {string} HTML
     * @private
     */
    _renderReport(report) {
        return `
            <div class="word-rep-report">
                ${this._renderStats(report.stats)}
                ${this._renderRepetitionsList(report.repetitions)}
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend les statistiques
     * @param {Object} stats - Statistiques
     * @returns {string} HTML
     * @private
     */
    _renderStats(stats) {
        return `
            <div class="word-rep-stats">
                <div class="stat-item">
                    <span class="stat-value">${stats.totalWords.toLocaleString()}</span>
                    <span class="stat-label">${Localization.t('repetition.stats.words')}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.repetitionsCount}</span>
                    <span class="stat-label">${Localization.t('repetition.stats.repetition_count')}</span>
                </div>
                <div class="stat-badges">
                    ${stats.criticalCount > 0 ? `<span class="severity-badge critical">${stats.criticalCount}</span>` : ''}
                    ${stats.highCount > 0 ? `<span class="severity-badge high">${stats.highCount}</span>` : ''}
                    ${stats.mediumCount > 0 ? `<span class="severity-badge medium">${stats.mediumCount}</span>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend la liste des répétitions
     * @param {Array} repetitions - Liste des répétitions
     * @returns {string} HTML
     * @private
     */
    _renderRepetitionsList(repetitions) {
        if (repetitions.length === 0) {
            return `
                <div class="word-rep-success">
                    <i data-lucide="check-circle" style="width: 24px; height: 24px; color: var(--accent-green);"></i>
                    <p>${Localization.t('repetition.success')}</p>
                </div>
            `;
        }

        return `
            <div class="word-rep-list">
                ${repetitions.filter(r => !r.isIgnored).map(rep => this._renderRepetitionItem(rep)).join('')}
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend un élément de répétition
     * @param {Object} rep - Répétition
     * @returns {string} HTML
     * @private
     */
    _renderRepetitionItem(rep) {
        const severityColors = {
            critical: 'var(--accent-red)',
            high: 'var(--accent-gold)',
            medium: 'var(--accent-blue)',
            low: 'var(--text-muted)'
        };

        const severityLabels = {
            critical: Localization.t('repetition.severity.critical'),
            high: Localization.t('repetition.severity.high'),
            medium: Localization.t('repetition.severity.medium'),
            low: Localization.t('repetition.severity.low')
        };

        return `
            <div class="word-rep-item ${rep.severity}" data-rep-id="${rep.id}" onclick="WordRepetitionHandlers.onSelectRepetition('${rep.id}')">
                <div class="rep-item-header">
                    <span class="rep-word">${rep.word}</span>
                    <span class="rep-count" style="color: ${severityColors[rep.severity]};">${rep.count}x</span>
                </div>
                <div class="rep-item-meta">
                    <span class="rep-density">${rep.densityPercent}%</span>
                    <span class="rep-severity" style="background: ${severityColors[rep.severity]};">${severityLabels[rep.severity]}</span>
                    ${rep.proximityCount > 0 ? `<span class="rep-proximity" title="Répétitions proches"><i data-lucide="alert-triangle" style="width: 10px; height: 10px;"></i> ${rep.proximityCount}</span>` : ''}
                </div>
                <div class="rep-item-actions">
                    ${rep.suggestions.length > 0 ? `
                        <button class="btn btn-icon btn-tiny" onclick="event.stopPropagation(); WordRepetitionHandlers.onShowSuggestions('${rep.id}')" title="${Localization.t('repetition.actions.view_suggestions')}">
                            <i data-lucide="lightbulb" style="width: 12px; height: 12px;"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-icon btn-tiny" onclick="event.stopPropagation(); WordRepetitionHandlers.onIgnoreWord('${rep.word}')" title="${Localization.t('repetition.actions.ignore_word')}">
                        <i data-lucide="eye-off" style="width: 12px; height: 12px;"></i>
                    </button>
                    <button class="btn btn-icon btn-tiny" onclick="event.stopPropagation(); WordRepetitionHandlers.onShowOccurrences('${rep.id}')" title="${Localization.t('repetition.actions.view_occurrences')}">
                        <i data-lucide="list" style="width: 12px; height: 12px;"></i>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend le panneau de détail d'une répétition
     * @param {Object} rep - Répétition sélectionnée
     * @returns {string} HTML
     */
    renderDetailPanel(rep) {
        if (!rep) return '';

        return `
            <div class="word-rep-detail" id="wordRepDetail">
                <div class="detail-header">
                    <button class="btn btn-icon btn-small" onclick="WordRepetitionHandlers.onCloseDetail()">
                        <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
                    </button>
                    <span class="detail-word">"${rep.word}"</span>
                    <span class="detail-count">${Localization.t('repetition.detail.occurrences_unit', rep.count)}</span>
                </div>

                ${rep.suggestions.length > 0 ? this._renderSuggestions(rep) : ''}

                <div class="detail-occurrences">
                    <h4>${Localization.t('repetition.detail.occurrences_title', rep.occurrences.length)}</h4>
                    <div class="occurrences-list">
                        ${rep.occurrences.map((occ, idx) => this._renderOccurrence(occ, idx)).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend les suggestions de synonymes
     * @param {Object} rep - Répétition
     * @returns {string} HTML
     * @private
     */
    _renderSuggestions(rep) {
        return `
            <div class="detail-suggestions">
                <h4><i data-lucide="lightbulb" style="width: 14px; height: 14px;"></i> ${Localization.t('repetition.detail.suggestions_title')}</h4>
                <div class="suggestions-list">
                    ${rep.suggestions.map(sug => `
                        <span class="suggestion-tag" onclick="WordRepetitionHandlers.onCopySuggestion('${sug.suggestion}')" title="${Localization.t('repetition.detail.copy_suggestion')}">
                            ${sug.suggestion}
                        </span>
                    `).join('')}
                </div>
                <button class="btn btn-small btn-secondary" onclick="WordRepetitionHandlers.onLoadMoreSuggestions('${rep.word}')" style="margin-top: 0.5rem; width: 100%;">
                    <i data-lucide="plus" style="width: 12px; height: 12px;"></i> ${Localization.t('repetition.detail.more_synonyms')}
                </button>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Rend une occurrence
     * @param {Object} occ - Occurrence
     * @param {number} idx - Index
     * @returns {string} HTML
     * @private
     */
    _renderOccurrence(occ, idx) {
        const loc = occ.location;
        const locationText = loc.sceneTitle
            ? `${loc.actTitle} > ${loc.chapterTitle} > ${loc.sceneTitle}`
            : Localization.t('repetition.detail.not_localized');

        // Mettre en évidence le mot dans le contexte
        const highlightedContext = occ.context.replace(
            new RegExp(`(${this._escapeHtml(occ.word)})`, 'gi'),
            '<mark>$1</mark>'
        );

        // Préparer les données de l'occurrence pour le click
        const occData = {
            word: occ.word,
            position: occ.position,
            location: occ.location,
            idx: idx
        };

        return `
            <div class="occurrence-item" data-occ-idx="${idx}" onclick="WordRepetitionHandlers.onNavigateToOccurrence(${idx})">
                <div class="occurrence-location">
                    <i data-lucide="map-pin" style="width: 10px; height: 10px;"></i>
                    <span>${locationText}</span>
                </div>
                <div class="occurrence-context">${highlightedContext}</div>
            </div>
        `;
    },

    /**
     * [MVVM : View]
     * Échappe les caractères HTML
     * @param {string} str - Chaîne à échapper
     * @returns {string} Chaîne échappée
     * @private
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * [MVVM : View]
     * Affiche le panneau de détail
     * @param {Object} rep - Répétition
     */
    showDetail(rep) {
        const panel = document.getElementById('wordRepetitionPanel');
        if (!panel) return;

        // Masquer la liste
        const list = panel.querySelector('.word-rep-list');
        if (list) list.style.display = 'none';

        // Afficher le détail
        let detailContainer = panel.querySelector('#wordRepDetail');
        if (!detailContainer) {
            detailContainer = document.createElement('div');
            panel.querySelector('.word-rep-report').appendChild(detailContainer);
        }
        detailContainer.outerHTML = this.renderDetailPanel(rep);

        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 10);
        }
    },

    /**
     * [MVVM : View]
     * Ferme le panneau de détail
     */
    closeDetail() {
        const panel = document.getElementById('wordRepetitionPanel');
        if (!panel) return;

        const detail = panel.querySelector('#wordRepDetail');
        if (detail) detail.remove();

        const list = panel.querySelector('.word-rep-list');
        if (list) list.style.display = '';
    },

    /**
     * [MVVM : View]
     * Toggle les paramètres
     */
    toggleSettings() {
        const settings = document.getElementById('wordRepSettings');
        if (settings) {
            settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
        }
    },

    /**
     * [MVVM : View]
     * Met à jour un élément de répétition comme ignoré
     * @param {string} word - Mot ignoré
     */
    markAsIgnored(word) {
        const items = document.querySelectorAll('.word-rep-item');
        items.forEach(item => {
            const wordEl = item.querySelector('.rep-word');
            if (wordEl && wordEl.textContent === word) {
                item.style.display = 'none';
            }
        });
    },

    /**
     * [MVVM : View]
     * Affiche une notification
     * @param {string} message - Message
     * @param {string} type - Type (success, error, info)
     */
    notify(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        }
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WordRepetitionView };
}
