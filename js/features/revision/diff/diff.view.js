/**
 * DIFF MODULE - VIEW
 * Handles DOM manipulation and rendering of diff results.
 */

const DiffView = {
    /**
     * Opens the diff modal.
     * @param {number} defaultOldId 
     * @param {number} defaultNewId 
     */
    openModal(defaultOldId, defaultNewId) {
        const modal = document.getElementById('diffModal');
        if (!modal) return;

        this.populateVersionSelectors(defaultOldId, defaultNewId);

        modal.style.display = 'flex';

        // Sync active state of view mode buttons
        const currentMode = DiffViewModel.getCurrentViewMode();
        this.updateViewModeButtons(currentMode);
    },

    /**
     * Closes the diff modal.
     */
    closeModal() {
        const modal = document.getElementById('diffModal');
        if (modal) modal.style.display = 'none';
    },

    /**
     * Populates the <select> elements with version options.
     */
    populateVersionSelectors(oldId, newId) {
        const versions = DiffRepository.getVersions();
        const selectOld = document.getElementById('diffVersionOld');
        const selectNew = document.getElementById('diffVersionNew');

        if (!selectOld || !selectNew) return;

        const optionsHtml = versions.map(v => {
            const label = v.label || Localization.t('diff.version_fallback', [v.number]);
            const dateLocale = Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';
            const date = new Date(v.createdAt).toLocaleDateString(dateLocale);
            return `<option value="${v.id}">${label} (${date})</option>`;
        }).join('');

        selectOld.innerHTML = optionsHtml;
        selectNew.innerHTML = optionsHtml;

        selectOld.value = oldId;
        selectNew.value = newId;
    },

    /**
     * Updates the active state of view mode buttons.
     */
    updateViewModeButtons(mode) {
        const btnUnified = document.getElementById('btnDiffUnified');
        const btnSide = document.getElementById('btnDiffSide');

        if (btnUnified) btnUnified.classList.toggle('active', mode === 'unified');
        if (btnSide) btnSide.classList.toggle('active', mode === 'side');
    },

    /**
     * Updates the statistics display in the UI.
     */
    updateStats(diff) {
        const statsContainer = document.getElementById('diffStats');
        if (!statsContainer) return;

        const { added, removed } = DiffViewModel.getStats(diff);

        const sAdded = added > 1 ? 's' : '';
        const sRemoved = removed > 1 ? 's' : '';

        statsContainer.innerHTML = `
            <span class="diff-stat added">${Localization.t('diff.stats.added', [added, sAdded])}</span>
            <span class="diff-stat removed">${Localization.t('diff.stats.removed', [removed, sRemoved])}</span>
        `;
    },

    /**
     * Renders a unified diff view.
     */
    renderUnified(diff) {
        const container = document.getElementById('diffContent');
        if (!container) return;

        if (diff.length === 0 || (diff[0].items && diff[0].items.length === 0)) {
            this.renderEmptyState(container);
            return;
        }

        let html = '<div class="diff-unified">';

        diff.forEach((para, paraIndex) => {
            if (paraIndex > 0) html += '<br><br>';

            const paraClass = para.status === 'added' ? 'diff-paragraph added' :
                para.status === 'removed' ? 'diff-paragraph removed' :
                    'diff-paragraph';

            html += `<div class="${paraClass}">`;

            if (para.items) {
                let needSpace = false;
                para.items.forEach((item) => {
                    if (item.isBreak) {
                        html += '<br>';
                        needSpace = false;
                        return;
                    }

                    const space = needSpace ? ' ' : '';
                    const escapedText = DiffModel.escapeHtml(item.text);

                    if (item.type === 'same') {
                        html += space + escapedText;
                    } else if (item.type === 'added') {
                        html += space + `<span class="diff-word added">${escapedText}</span>`;
                    } else if (item.type === 'removed') {
                        html += space + `<span class="diff-word removed">${escapedText}</span>`;
                    }
                    needSpace = true;
                });
            }

            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = html;

        // Re-inject icons if lucide is used
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders a side-by-side diff view.
     */
    renderSideBySide(diff, oldVersion, newVersion) {
        const container = document.getElementById('diffContent');
        if (!container) return;

        const oldLabel = oldVersion.label || Localization.t('diff.version_fallback', [oldVersion.number]);
        const newLabel = newVersion.label || Localization.t('diff.version_fallback', [newVersion.number]);

        const dateLocale = Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';
        const oldDate = new Date(oldVersion.createdAt).toLocaleDateString(dateLocale);
        const newDate = new Date(newVersion.createdAt).toLocaleDateString(dateLocale);

        let oldHtml = '';
        let newHtml = '';

        diff.forEach((para, paraIndex) => {
            if (paraIndex > 0) {
                oldHtml += '<br><br>';
                newHtml += '<br><br>';
            }

            if (para.status === 'removed') {
                oldHtml += '<div class="diff-paragraph removed">';
                let needSpace = false;
                para.items.forEach((item) => {
                    if (item.isBreak) {
                        oldHtml += '<br>';
                        needSpace = false;
                        return;
                    }
                    const space = needSpace ? ' ' : '';
                    oldHtml += space + `<span class="diff-word removed">${DiffModel.escapeHtml(item.text)}</span>`;
                    needSpace = true;
                });
                oldHtml += '</div>';
            } else if (para.status === 'added') {
                newHtml += '<div class="diff-paragraph added">';
                let needSpace = false;
                para.items.forEach((item) => {
                    if (item.isBreak) {
                        newHtml += '<br>';
                        needSpace = false;
                        return;
                    }
                    const space = needSpace ? ' ' : '';
                    newHtml += space + `<span class="diff-word added">${DiffModel.escapeHtml(item.text)}</span>`;
                    needSpace = true;
                });
                newHtml += '</div>';
            } else if (para.status === 'same') {
                const text = para.items.filter(item => !item.isBreak).map(item => item.text).join(' ');
                const escaped = DiffModel.escapeHtml(text);
                oldHtml += `<div class="diff-paragraph">${escaped}</div>`;
                newHtml += `<div class="diff-paragraph">${escaped}</div>`;
            } else {
                // Modified (mixed items)
                oldHtml += '<div class="diff-paragraph modified">';
                newHtml += '<div class="diff-paragraph modified">';

                let oldNeedSpace = false;
                let newNeedSpace = false;

                para.items.forEach(item => {
                    if (item.isBreak) {
                        if (item.type === 'same' || item.type === 'removed') {
                            oldHtml += '<br>';
                            oldNeedSpace = false;
                        }
                        if (item.type === 'same' || item.type === 'added') {
                            newHtml += '<br>';
                            newNeedSpace = false;
                        }
                        return;
                    }

                    const escaped = DiffModel.escapeHtml(item.text);
                    if (item.type === 'same') {
                        oldHtml += (oldNeedSpace ? ' ' : '') + escaped;
                        newHtml += (newNeedSpace ? ' ' : '') + escaped;
                        oldNeedSpace = true;
                        newNeedSpace = true;
                    } else if (item.type === 'added') {
                        newHtml += (newNeedSpace ? ' ' : '') + `<span class="diff-word added">${escaped}</span>`;
                        newNeedSpace = true;
                    } else if (item.type === 'removed') {
                        oldHtml += (oldNeedSpace ? ' ' : '') + `<span class="diff-word removed">${escaped}</span>`;
                        oldNeedSpace = true;
                    }
                });

                oldHtml += '</div>';
                newHtml += '</div>';
            }
        });

        container.innerHTML = `
            <div class="diff-side-by-side">
                <div class="diff-side">
                    <div class="diff-side-header old">
                        <span>${oldLabel}</span>
                        <span style="font-weight: normal; font-size: 0.75rem;">${oldDate} • ${Localization.t('diff.word_count', [oldVersion.wordCount || 0])}</span>
                    </div>
                    <div class="diff-side-content">${oldHtml}</div>
                </div>
                <div class="diff-side">
                    <div class="diff-side-header new">
                        <span>${newLabel}</span>
                        <span style="font-weight: normal; font-size: 0.75rem;">${newDate} • ${Localization.t('diff.word_count', [newVersion.wordCount || 0])}</span>
                    </div>
                    <div class="diff-side-content">${newHtml}</div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders empty state when no differences are found.
     */
    renderEmptyState(container) {
        container.innerHTML = `
            <div class="diff-empty-state">
                <div class="diff-empty-state-icon"><i data-lucide="check" style="width:48px;height:48px;"></i></div>
                <div>${Localization.t('diff.empty_state')}</div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};
