/**
 * [MVVM : View]
 * Gère l'interface utilisateur du gestionnaire de thèmes.
 */
const ThemeManagerView = {
    /**
     * Ouvre la modale du gestionnaire de thèmes
     */
    open: () => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10000';

        const currentColors = ThemeManagerView._getCurrentColorsFromDoc();

        modal.innerHTML = `
            <div class="modal-content theme-manager-modal">
                <div class="modal-header">
                    <h2><i data-lucide="palette"></i> ${Localization.t('theme.modal.title')}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i data-lucide="x"></i></button>
                </div>
                
                <div class="theme-manager-body">
                    <!-- Sidebar: Thèmes Prédéfinis -->
                    <div class="theme-presets-sidebar">
                        <div class="section-header" style="margin-bottom: 1.5rem;">
                            <i data-lucide="layers" style="width:16px; color: var(--accent-gold);"></i>
                            <span style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${Localization.t('theme.section.presets')}</span>
                        </div>
                        <div id="presetThemesList"></div>
                        
                        <div class="section-header" style="margin-top: 2.5rem; margin-bottom: 1.5rem;">
                            <i data-lucide="sparkles" style="width:16px; color: var(--accent-gold);"></i>
                            <span style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${Localization.t('theme.section.custom')}</span>
                        </div>
                        <div id="customThemesList"></div>
                    </div>

                    <!-- Main: Éditeur -->
                    <div class="theme-editor-main">
                        <section class="editor-section">
                            <div class="section-header">
                                <i data-lucide="sliders-horizontal"></i>
                                <span class="section-title">${Localization.t('theme.section.colors')}</span>
                            </div>
                            
                            <div class="color-controls-grid">
                                ${Object.entries(ThemeManagerModel.defaultVariables).map(([variable, defaultValue]) => {
            const label = variable.replace('--', '').replace(/-/g, ' ');
            const currentValue = currentColors[variable] || defaultValue;
            const hexValue = ThemeManagerViewModel.rgbaToHex(currentValue);
            return `
                                        <div class="color-control-item" data-var="${variable}">
                                            <label class="color-label">${label}</label>
                                            <div class="color-inputs">
                                                <input type="color" class="color-box" data-variable="${variable}" value="${hexValue}">
                                                <input type="text" class="color-hex" data-variable-text="${variable}" value="${currentValue}">
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </section>
                    </div>
                </div>

                <!-- Global Footer Actions -->
                <div class="theme-manager-footer">
                    <button onclick="ThemeManagerView.reset()" class="theme-btn theme-btn-danger-ghost">
                        <i data-lucide="refresh-cw"></i> ${Localization.t('theme.btn.reset')}
                    </button>
                    
                    <div style="display: flex; gap: 0.75rem;">
                        <button onclick="ThemeManagerView.export()" class="theme-btn theme-btn-ghost">
                            <i data-lucide="share-2"></i> ${Localization.t('theme.btn.export')}
                        </button>
                        <button onclick="ThemeManagerView.import()" class="theme-btn theme-btn-ghost">
                            <i data-lucide="download"></i> ${Localization.t('theme.btn.import')}
                        </button>
                        <button onclick="ThemeManagerView.saveTheme()" class="theme-btn theme-btn-main">
                            <i data-lucide="save"></i> ${Localization.t('theme.btn.save')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        ThemeManagerView.renderPresets();
        ThemeManagerView.renderCustoms();
        ThemeManagerView._bindEvents(modal);

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Rendu des thèmes prédéfinis dans la sidebar
     */
    renderPresets: () => {
        const container = document.getElementById('presetThemesList');
        if (!container) return;

        container.innerHTML = Object.entries(ThemeManagerModel.presetThemes).map(([name, colors]) => {
            return ThemeManagerView._generateThemeCard(name, colors, false);
        }).join('');
    },

    /**
     * Rendu des thèmes personnalisés
     */
    renderCustoms: () => {
        const container = document.getElementById('customThemesList');
        if (!container) return;

        const customs = ThemeManagerRepository.getCustomThemes();
        if (customs.length === 0) {
            container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; text-align: center; padding: 1rem; border: 1px dashed var(--border-color); border-radius: 12px;">${Localization.t('theme.custom.empty')}</p>`;
            return;
        }

        container.innerHTML = customs.map(theme => {
            return ThemeManagerView._generateThemeCard(theme.name, theme.colors, true);
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _generateThemeCard: (name, colors, isCustom) => {
        const palette = [
            colors['--bg-primary'],
            colors['--bg-secondary'],
            colors['--bg-accent'],
            colors['--primary-color'],
            colors['--accent-red']
        ].filter(Boolean);

        return `
            <div class="theme-card" onclick="ThemeManagerView.applyThemeByName('${name}', ${isCustom})">
                ${isCustom ? `<button class="delete-theme-btn" onclick="event.stopPropagation(); ThemeManagerView.deleteTheme('${name}')"><i data-lucide="trash-2" style="width:12px; height:12px;"></i></button>` : ''}
                <div class="theme-card-title">${name}</div>
                <div class="theme-swatch-grid">
                    ${palette.map(c => `<div class="theme-swatch" style="background: ${c}"></div>`).join('')}
                    ${new Array(Math.max(0, 5 - palette.length)).fill(0).map(() => `<div class="theme-swatch" style="background: transparent; border: 1px dashed var(--border-color);"></div>`).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Logique de clic sur un thème
     */
    applyThemeByName: (name, isCustom) => {
        let colors;
        if (isCustom) {
            const themes = ThemeManagerRepository.getCustomThemes();
            colors = themes.find(t => t.name === name)?.colors;
        } else {
            colors = ThemeManagerModel.presetThemes[name];
        }

        if (colors) {
            ThemeManagerViewModel.applyTheme(colors);
            ThemeManagerView._updateInputs(colors);
            if (typeof showNotification === 'function') showNotification(Localization.t('theme.notify.applied', [name]));
        }
    },

    deleteTheme: (name) => {
        if (confirm(Localization.t('theme.confirm.delete', [name]))) {
            let themes = ThemeManagerRepository.getCustomThemes();
            themes = themes.filter(t => t.name !== name);
            ThemeManagerRepository.saveCustomThemes(themes);
            ThemeManagerView.renderCustoms();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    saveTheme: () => {
        const name = prompt(Localization.t('theme.prompt.name'));
        if (!name) return;

        const colors = ThemeManagerView._getCurrentColorsFromInputs();
        let themes = ThemeManagerRepository.getCustomThemes();

        // Remove existing if same name
        themes = themes.filter(t => t.name !== name);
        themes.push({ name, colors });

        ThemeManagerRepository.saveCustomThemes(themes);
        ThemeManagerView.renderCustoms();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof showNotification === 'function') showNotification(Localization.t('theme.notify.saved', [name]));
    },

    export: () => {
        const name = prompt(Localization.t('theme.prompt.export_name'), 'MonThème');
        if (!name) return;
        const colors = ThemeManagerView._getCurrentColorsFromInputs();
        ThemeManagerViewModel.exportTheme(colors, name);
    },

    import: async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const theme = await ThemeManagerViewModel.importTheme(e.target.files[0]);
                const apply = confirm(Localization.t('theme.confirm.apply', [theme.name]));
                if (apply) {
                    ThemeManagerViewModel.applyTheme(theme.colors);
                    ThemeManagerView._updateInputs(theme.colors);
                }

                const save = confirm(Localization.t('theme.confirm.save_import', [theme.name]));
                if (save) {
                    let themes = ThemeManagerRepository.getCustomThemes();
                    themes = themes.filter(t => t.name !== theme.name);
                    themes.push(theme);
                    ThemeManagerRepository.saveCustomThemes(themes);
                    ThemeManagerView.renderCustoms();
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            } catch (err) {
                alert(Localization.t('theme.error.invalid_file'));
            }
        };
        input.click();
    },

    reset: () => {
        if (confirm(Localization.t('theme.confirm.reset'))) {
            ThemeManagerViewModel.applyTheme(ThemeManagerModel.defaultVariables);
            ThemeManagerView._updateInputs(ThemeManagerModel.defaultVariables);
        }
    },

    _bindEvents: (modal) => {
        modal.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const variable = e.target.dataset.variable;
                const color = e.target.value;
                const textInput = modal.querySelector(`input[data-variable-text="${variable}"]`);
                if (textInput) textInput.value = color;
                document.documentElement.style.setProperty(variable, color);
            });
        });

        modal.querySelectorAll('input[data-variable-text]').forEach(input => {
            input.addEventListener('change', (e) => {
                const variable = e.target.dataset.variableText;
                const color = e.target.value;
                document.documentElement.style.setProperty(variable, color);
                const colorInput = modal.querySelector(`input[data-variable="${variable}"]`);
                if (colorInput) {
                    const hex = ThemeManagerViewModel.rgbaToHex(color);
                    if (hex.match(/^#[0-9A-F]{6}$/i)) colorInput.value = hex;
                }
            });
        });
    },

    _updateInputs: (colors) => {
        Object.entries(colors).forEach(([variable, value]) => {
            const colorInput = document.querySelector(`input[data-variable="${variable}"]`);
            const textInput = document.querySelector(`input[data-variable-text="${variable}"]`);
            if (colorInput) {
                const hex = ThemeManagerViewModel.rgbaToHex(value);
                if (hex.match(/^#[0-9A-F]{6}$/i)) colorInput.value = hex;
            }
            if (textInput) textInput.value = value;
        });
    },

    _getCurrentColorsFromDoc: () => {
        const colors = {};
        Object.keys(ThemeManagerModel.defaultVariables).forEach(variable => {
            const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
            colors[variable] = value.trim();
        });
        return colors;
    },

    _getCurrentColorsFromInputs: () => {
        const colors = {};
        document.querySelectorAll('input[data-variable-text]').forEach(input => {
            colors[input.dataset.variableText] = input.value;
        });
        return colors;
    }
};
