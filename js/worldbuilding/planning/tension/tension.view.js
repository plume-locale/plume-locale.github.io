/**
 * @file tension.view.js
 * @description Vue pour le module de tension. Gère le DOM et l'affichage.
 */

const TensionView = {
    /**
     * Ouvre le modal de l'éditeur de mots de tension.
     */
    openEditor: function () {
        const modal = document.getElementById('tensionWordsModal');
        if (modal) {
            modal.classList.add('active');
            this.loadWords();
        }
    },

    /**
     * Charge et affiche les mots dans l'éditeur.
     */
    loadWords: function () {
        const words = TensionRepository.getTensionWords(); // Accès direct Repository permis pour lecture simple ou via ViewModel

        this.renderList('highTensionList', words.high, 'high');
        this.renderList('mediumTensionList', words.medium, 'medium');
        this.renderList('lowTensionList', words.low, 'low');
    },

    /**
     * Affiche une liste de mots dans un conteneur.
     */
    renderList: function (elementId, wordList, type) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.innerHTML = '';
        wordList.forEach((word, index) => {
            container.innerHTML += this.createWordElement(word, type, index);
        });
    },

    /**
     * Crée le HTML pour un élément mot.
     */
    createWordElement: function (word, type, index) {
        const colors = {
            high: 'var(--accent-red)',
            medium: '#e6a23c',
            low: 'var(--accent-blue)'
        };

        // Note: l'événement onClick appelle une fonction globale qui sera définie dans handlers.js
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-primary); border-radius: 4px; border: 1px solid var(--border-color);">
                <span style="font-size: 0.85rem; color: var(--text-primary);">${word}</span>
                <button onclick="TensionHandlers.onRemoveWord('${type}', ${index})" 
                        style="background: none; border: none; color: ${colors[type]}; cursor: pointer; font-size: 1rem; padding: 0 0.25rem; opacity: 0.7; transition: opacity 0.2s;"
                        onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'"
                        title="${Localization.t('tension.tooltip.remove')}">
                    ×
                </button>
            </div>
        `;
    },

    /**
     * Ferme le modal d'éditeur.
     */
    closeEditor: function () {
        if (typeof closeModal === 'function') {
            closeModal('tensionWordsModal');
        } else {
            document.getElementById('tensionWordsModal')?.classList.remove('active');
        }
    },

    /**
     * Ouvre le modal d'import en masse.
     */
    openBulkImport: function (type) {
        const titleKey = type === 'high' ? 'High' : (type === 'medium' ? 'Medium' : 'Low'); // This logic was implicit in map, but map had French.
        // Better: use the map but with translated values
        const titles = {
            high: Localization.t('tension.modal.import_title', Localization.t('tension.category.high')),
            medium: Localization.t('tension.modal.import_title', Localization.t('tension.category.medium')),
            low: Localization.t('tension.modal.import_title', Localization.t('tension.category.low'))
        };

        document.getElementById('bulkImportTitle').textContent = titles[type] || Localization.t('tension.modal.import_default');
        document.getElementById('bulkImportText').value = '';
        document.getElementById('bulkImportFile').value = '';

        const radioAdd = document.querySelector('input[name="importMode"][value="add"]');
        if (radioAdd) radioAdd.checked = true;

        document.getElementById('bulkImportModal')?.classList.add('active');
    },

    /**
     * Ferme le modal d'import en masse.
     */
    closeBulkImport: function () {
        if (typeof closeModal === 'function') {
            closeModal('bulkImportModal');
        } else {
            document.getElementById('bulkImportModal')?.classList.remove('active');
        }
    },

    /**
     * Injecte le Tension Meter dans le DOM.
     */
    injectTensionMeter: function () {
        if (document.getElementById('liveTensionMeter')) return;

        const div = document.createElement('div');
        div.id = 'liveTensionMeter';
        div.className = 'tension-meter-container';
        div.setAttribute('title', Localization.t('tension.meter.title'));


        div.innerHTML = `
            <div class="tension-meter-bar-bg" id="tensionMeterBar">
                <div class="tension-meter-bar-fill" id="tensionMeterBarFill"></div>
            </div>
            <svg class="tension-meter-svg" viewBox="0 0 50 50">
                <circle class="tension-meter-bg" cx="25" cy="25" r="22"></circle>
                <circle class="tension-meter-fill" id="tensionMeterFill" cx="25" cy="25" r="22" stroke-dasharray="138.2" stroke-dashoffset="138.2"></circle>
            </svg>
            <div class="tension-value-display" id="tensionValueDisplay">--</div>
            <div class="tension-tooltip" id="tensionTooltip"></div>
        `;

        document.body.appendChild(div);

        // Toggle tooltip on click/touch (Mobile & Desktop compatible)
        div.addEventListener('click', (e) => {
            const tooltip = document.getElementById('tensionTooltip');
            if (tooltip) {
                const isActive = tooltip.classList.contains('active');
                // Fermer les autres éventuels tooltips si nécessaire (optionnel)
                tooltip.classList.toggle('active');
                e.stopPropagation();
            }
        });

        // Fermer le tooltip si on clique ailleurs
        document.addEventListener('click', () => {
            const tooltip = document.getElementById('tensionTooltip');
            if (tooltip) tooltip.classList.remove('active');
        });

        if (typeof focusModeActive !== 'undefined' && focusModeActive) {
            div.classList.add('focus-hide');
        }
    },

    /**
     * Met à jour le Tension Meter avec les résultats du calcul.
     */
    updateMeter: function (result) {
        const score = result.score;
        const circle = document.getElementById('tensionMeterFill');

        if (circle) {
            const radius = 22;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = offset;

            if (score > 65) circle.style.stroke = 'var(--accent-red)';
            else if (score > 40) circle.style.stroke = 'var(--accent-gold)';
            else circle.style.stroke = 'var(--accent-blue)';
        }

        // Mise à jour de la barre mobile
        const barFill = document.getElementById('tensionMeterBarFill');
        if (barFill) {
            barFill.style.width = `${score}%`;

            let color = 'var(--accent-blue)';
            if (score > 65) color = 'var(--accent-red)';
            else if (score > 40) color = 'var(--accent-gold)';

            barFill.style.backgroundColor = color;
        }

        const valueDisplay = document.getElementById('tensionValueDisplay');
        if (valueDisplay) valueDisplay.textContent = `${score}%`;

        this.updateTooltip(result);
    },

    /**
     * Met à jour le tooltip.
     */
    updateTooltip: function (result) {
        const tooltip = document.getElementById('tensionTooltip');
        if (!tooltip) return;

        const highTags = result.foundWords.high.slice(0, 5).map(w => `<span class="tension-tag tension-tag-high">${w}</span>`).join('');
        const mediumTags = result.foundWords.medium.slice(0, 5).map(w => `<span class="tension-tag tension-tag-medium">${w}</span>`).join('');

        tooltip.innerHTML = `
            <div class="tension-tooltip-title">
                <i data-lucide="zap" style="width:14px;height:14px;"></i> ${Localization.t('tension.tooltip.direct_tension')}
            </div>
            <div class="tension-tooltip-item">
                <span>${Localization.t('tension.tooltip.intensity_index')}</span>
                <strong>${result.score}%</strong>
            </div>
            <div class="tension-tooltip-item">
                <span>${Localization.t('tension.tooltip.strong_keywords')}</span>
                <span style="color: var(--accent-red)">${result.details.high}</span>
            </div>
            <div class="tension-tooltip-item">
                <span>${Localization.t('tension.tooltip.moderate_keywords')}</span>
                <span style="color: var(--accent-gold)">${result.details.medium}</span>
            </div>
            <div class="tension-tags-container">
                ${highTags}
                ${mediumTags}
            </div>
            <div style="margin-top: 0.75rem; font-size: 0.65rem; color: var(--text-muted); font-style: italic;">
                ${Localization.t('tension.tooltip.analysis_note')}
            </div>
        `;

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    /**
     * Télécharge un fichier texte (pour l'export).
     */
    downloadFile: function (filename, content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Rafraîchit l'affichage lors du changement de langue.
     */
    render: function () {
        // Recharger les listes de mots (met à jour les tooltips des boutons supprimer)
        const modal = document.getElementById('tensionWordsModal');
        if (modal && modal.classList.contains('active')) {
            this.loadWords();
        }

        // Mettre à jour le titre du meter
        const meter = document.getElementById('liveTensionMeter');
        if (meter) {
            meter.setAttribute('title', Localization.t('tension.meter.title'));
        }
    }
};
