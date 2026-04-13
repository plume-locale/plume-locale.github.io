
/**
 * StructureBlocksUI
 * Allows wrapping selected text in a customizable styled block with a label.
 * Full CRUD: Create, Read (Render), Update (Edit label/color), Delete (Remove/Unwrap).
 *
 * v2 — Narrative Frameworks: dynamic presets per narrative methodology
 *       (3 Acts, Save the Cat, Story Circle, Hero's Journey, Free)
 */
const StructureBlockUI = {
    lastRange: null,
    editingBlock: null,

    // Configuration
    STORAGE_KEY: 'plume_structure_recent_colors',
    FRAMEWORK_KEY: 'plume_structure_framework',
    DEFAULT_COLORS: ['#ff8c42', '#ff6b6b', '#ffd93d', '#51cf66', '#4a9eff', '#a78bfa'],
    recentColors: [],
    currentFramework: 'free',
    _beatHintTimer: null,

    // ---------------------------------------------------------------------------
    // NARRATIVE FRAMEWORKS
    // ---------------------------------------------------------------------------
    NARRATIVE_FRAMEWORKS: {
        free: {
            id: 'free',
            icon: 'pencil',
            labelKey: 'modal.structure_block.framework.free',
            labelFallback: 'Free',
            beats: [
                { textKey: 'narrative_fw.free.beat.0', color: '#ff8c42' },
                { textKey: 'narrative_fw.free.beat.1', color: '#ffd93d' },
                { textKey: 'narrative_fw.free.beat.2', color: '#ffd93d' },
                { textKey: 'narrative_fw.free.beat.3', color: '#ff8c42' },
                { textKey: 'narrative_fw.free.beat.4', color: '#ff8c42' },
                { textKey: 'narrative_fw.free.beat.5', color: '#ff6b6b' },
                { textKey: 'narrative_fw.free.beat.6', color: '#ff6b6b' },
                { textKey: 'narrative_fw.free.beat.7', color: '#a78bfa' },
                { textKey: 'narrative_fw.free.beat.8', color: '#ff6b6b' },
                { textKey: 'narrative_fw.free.beat.9', color: '#51cf66' },
                { textKey: 'narrative_fw.free.beat.10', color: '#4a9eff' },
                { textKey: 'narrative_fw.free.beat.11', color: '#4a9eff' },
                { textKey: 'narrative_fw.free.beat.12', color: '#51cf66' },
            ]
        },

        acts3: {
            id: 'acts3',
            icon: 'layout-template',
            labelKey: 'modal.structure_block.framework.acts3',
            labelFallback: '3 Acts',
            beats: [
                { textKey: 'narrative_fw.acts3.beat.0', color: '#4a9eff', descKey: 'narrative_fw.acts3.beat.0.desc' },
                { textKey: 'narrative_fw.acts3.beat.1', color: '#ffd93d', descKey: 'narrative_fw.acts3.beat.1.desc' },
                { textKey: 'narrative_fw.acts3.beat.2', color: '#ff8c42', descKey: 'narrative_fw.acts3.beat.2.desc' },
                { textKey: 'narrative_fw.acts3.beat.3', color: '#ff6b6b', descKey: 'narrative_fw.acts3.beat.3.desc' },
                { textKey: 'narrative_fw.acts3.beat.4', color: '#a78bfa', descKey: 'narrative_fw.acts3.beat.4.desc' },
                { textKey: 'narrative_fw.acts3.beat.5', color: '#ff6b6b', descKey: 'narrative_fw.acts3.beat.5.desc' },
                { textKey: 'narrative_fw.acts3.beat.6', color: '#51cf66', descKey: 'narrative_fw.acts3.beat.6.desc' },
            ]
        },

        save_the_cat: {
            id: 'save_the_cat',
            icon: 'cat',
            labelKey: 'modal.structure_block.framework.stc',
            labelFallback: 'Save the Cat',
            beats: [
                { textKey: 'narrative_fw.stc.beat.0',  color: '#4a9eff', descKey: 'narrative_fw.stc.beat.0.desc' },
                { textKey: 'narrative_fw.stc.beat.1',  color: '#4a9eff', descKey: 'narrative_fw.stc.beat.1.desc' },
                { textKey: 'narrative_fw.stc.beat.2',  color: '#4a9eff', descKey: 'narrative_fw.stc.beat.2.desc' },
                { textKey: 'narrative_fw.stc.beat.3',  color: '#ffd93d', descKey: 'narrative_fw.stc.beat.3.desc' },
                { textKey: 'narrative_fw.stc.beat.4',  color: '#ffd93d', descKey: 'narrative_fw.stc.beat.4.desc' },
                { textKey: 'narrative_fw.stc.beat.5',  color: '#ff8c42', descKey: 'narrative_fw.stc.beat.5.desc' },
                { textKey: 'narrative_fw.stc.beat.6',  color: '#51cf66', descKey: 'narrative_fw.stc.beat.6.desc' },
                { textKey: 'narrative_fw.stc.beat.7',  color: '#51cf66', descKey: 'narrative_fw.stc.beat.7.desc' },
                { textKey: 'narrative_fw.stc.beat.8',  color: '#ffd93d', descKey: 'narrative_fw.stc.beat.8.desc' },
                { textKey: 'narrative_fw.stc.beat.9',  color: '#ff6b6b', descKey: 'narrative_fw.stc.beat.9.desc' },
                { textKey: 'narrative_fw.stc.beat.10', color: '#ff6b6b', descKey: 'narrative_fw.stc.beat.10.desc' },
                { textKey: 'narrative_fw.stc.beat.11', color: '#a78bfa', descKey: 'narrative_fw.stc.beat.11.desc' },
                { textKey: 'narrative_fw.stc.beat.12', color: '#a78bfa', descKey: 'narrative_fw.stc.beat.12.desc' },
                { textKey: 'narrative_fw.stc.beat.13', color: '#ff8c42', descKey: 'narrative_fw.stc.beat.13.desc' },
                { textKey: 'narrative_fw.stc.beat.14', color: '#4a9eff', descKey: 'narrative_fw.stc.beat.14.desc' },
            ]
        },

        story_circle: {
            id: 'story_circle',
            icon: 'circle',
            labelKey: 'modal.structure_block.framework.circle',
            labelFallback: 'Story Circle',
            beats: [
                { textKey: 'narrative_fw.circle.beat.0', color: '#4a9eff', descKey: 'narrative_fw.circle.beat.0.desc' },
                { textKey: 'narrative_fw.circle.beat.1', color: '#ffd93d', descKey: 'narrative_fw.circle.beat.1.desc' },
                { textKey: 'narrative_fw.circle.beat.2', color: '#ff8c42', descKey: 'narrative_fw.circle.beat.2.desc' },
                { textKey: 'narrative_fw.circle.beat.3', color: '#ff8c42', descKey: 'narrative_fw.circle.beat.3.desc' },
                { textKey: 'narrative_fw.circle.beat.4', color: '#51cf66', descKey: 'narrative_fw.circle.beat.4.desc' },
                { textKey: 'narrative_fw.circle.beat.5', color: '#ff6b6b', descKey: 'narrative_fw.circle.beat.5.desc' },
                { textKey: 'narrative_fw.circle.beat.6', color: '#a78bfa', descKey: 'narrative_fw.circle.beat.6.desc' },
                { textKey: 'narrative_fw.circle.beat.7', color: '#51cf66', descKey: 'narrative_fw.circle.beat.7.desc' },
            ]
        },

        hero_journey: {
            id: 'hero_journey',
            icon: 'sword',
            labelKey: 'modal.structure_block.framework.hero',
            labelFallback: "Hero's Journey",
            beats: [
                { textKey: 'narrative_fw.hero.beat.0',  color: '#4a9eff', descKey: 'narrative_fw.hero.beat.0.desc' },
                { textKey: 'narrative_fw.hero.beat.1',  color: '#ffd93d', descKey: 'narrative_fw.hero.beat.1.desc' },
                { textKey: 'narrative_fw.hero.beat.2',  color: '#ff8c42', descKey: 'narrative_fw.hero.beat.2.desc' },
                { textKey: 'narrative_fw.hero.beat.3',  color: '#51cf66', descKey: 'narrative_fw.hero.beat.3.desc' },
                { textKey: 'narrative_fw.hero.beat.4',  color: '#ff8c42', descKey: 'narrative_fw.hero.beat.4.desc' },
                { textKey: 'narrative_fw.hero.beat.5',  color: '#ff8c42', descKey: 'narrative_fw.hero.beat.5.desc' },
                { textKey: 'narrative_fw.hero.beat.6',  color: '#ffd93d', descKey: 'narrative_fw.hero.beat.6.desc' },
                { textKey: 'narrative_fw.hero.beat.7',  color: '#ff6b6b', descKey: 'narrative_fw.hero.beat.7.desc' },
                { textKey: 'narrative_fw.hero.beat.8',  color: '#51cf66', descKey: 'narrative_fw.hero.beat.8.desc' },
                { textKey: 'narrative_fw.hero.beat.9',  color: '#a78bfa', descKey: 'narrative_fw.hero.beat.9.desc' },
                { textKey: 'narrative_fw.hero.beat.10', color: '#ff6b6b', descKey: 'narrative_fw.hero.beat.10.desc' },
                { textKey: 'narrative_fw.hero.beat.11', color: '#51cf66', descKey: 'narrative_fw.hero.beat.11.desc' },
            ]
        }
    },

    // ---------------------------------------------------------------------------
    // ENTRY POINTS
    // ---------------------------------------------------------------------------

    /**
     * Entry point: Wrap selected text
     */
    wrapSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('editor.structure_block.no_selection'), 'info');
            } else {
                alert(Localization.t('editor.structure_block.no_selection'));
            }
            return;
        }

        this.lastRange = selection.getRangeAt(0).cloneRange();
        this.editingBlock = null;
        this.openModal();
    },

    /**
     * Entry point: Edit existing block
     */
    editBlock(block) {
        this.editingBlock = block;
        this.lastRange = null;

        const label = block.querySelector('.structure-block-label').textContent;
        const color = block.style.getPropertyValue('--accent-color');

        this.openModal(label, color);
    },

    // ---------------------------------------------------------------------------
    // MODAL LIFECYCLE
    // ---------------------------------------------------------------------------

    /**
     * Open the configuration modal
     */
    openModal(label = 'SCENE BEAT', color = '#ff8c42') {
        if (typeof openModal === 'function') {
            openModal('structureBlockModal');
        } else {
            const modal = document.getElementById('structureBlockModal');
            if (modal) modal.classList.add('active');
        }

        // Load persisted state
        this.loadRecentColors();
        this.loadFramework();

        // Render all dynamic sections
        this.renderFrameworks();
        this.renderPresets();

        const inputLabel = document.getElementById('structureBlockLabel');
        const inputColor = document.getElementById('structureBlockColor');

        if (inputLabel) {
            inputLabel.value = label;
            setTimeout(() => {
                inputLabel.focus();
                inputLabel.select();
            }, 100);
        }
        if (inputColor) {
            this.setColor(color);
        }

        // Hide beat hint on open
        this.hideBeatHint();

        // Update modal title depending on mode
        const titleEl = document.querySelector('#structureBlockModal h2 [data-i18n]');
        if (titleEl) {
            titleEl.textContent = this.editingBlock
                ? (Localization.t('modal.structure_block.title_edit') || 'Modifier le bloc')
                : (Localization.t('modal.structure_block.title') || 'Créer un bloc structurel');
        }
    },

    closeModal() {
        if (typeof closeModal === 'function') {
            closeModal('structureBlockModal');
        } else {
            const modal = document.getElementById('structureBlockModal');
            if (modal) modal.classList.remove('active');
        }
        this.editingBlock = null;
        this.hideBeatHint();
    },

    // ---------------------------------------------------------------------------
    // FRAMEWORK SELECTOR
    // ---------------------------------------------------------------------------

    /**
     * Render the framework pill buttons
     */
    renderFrameworks() {
        const container = document.getElementById('structureBlockFrameworks');
        if (!container) return;

        container.innerHTML = '';

        Object.values(this.NARRATIVE_FRAMEWORKS).forEach(fw => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'framework-pill' + (this.currentFramework === fw.id ? ' active' : '');
            btn.dataset.frameworkId = fw.id;
            btn.title = Localization.t(fw.labelKey) || fw.labelFallback;

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', fw.icon);
            icon.style.cssText = 'width:13px;height:13px;flex-shrink:0;';

            const span = document.createElement('span');
            span.textContent = Localization.t(fw.labelKey) || fw.labelFallback;

            btn.appendChild(icon);
            btn.appendChild(span);
            btn.onclick = () => this.selectFramework(fw.id);
            container.appendChild(btn);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Select a narrative framework — updates presets & persists choice
     */
    selectFramework(id) {
        if (!this.NARRATIVE_FRAMEWORKS[id]) return;
        this.currentFramework = id;
        localStorage.setItem(this.FRAMEWORK_KEY, id);

        // Update pill active states
        document.querySelectorAll('.framework-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.frameworkId === id);
        });

        this.renderPresets();
        this.hideBeatHint();
    },

    loadFramework() {
        const saved = localStorage.getItem(this.FRAMEWORK_KEY);
        this.currentFramework = saved && this.NARRATIVE_FRAMEWORKS[saved] ? saved : 'free';
    },

    // ---------------------------------------------------------------------------
    // PRESETS (Labels + Colors)
    // ---------------------------------------------------------------------------

    /**
     * Render label presets and color presets for the current framework
     */
    renderPresets() {
        const fw = this.NARRATIVE_FRAMEWORKS[this.currentFramework] || this.NARRATIVE_FRAMEWORKS.free;
        const labelContainer = document.getElementById('structureBlockLabelPresets');

        // --- Labels ---
        if (labelContainer) {
            labelContainer.innerHTML = '';
            fw.beats.forEach(beat => {
                const label = Localization.t(beat.textKey) || beat.textKey;
                const desc  = beat.descKey ? Localization.t(beat.descKey) : null;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'preset-btn';
                btn.textContent = label;
                // Color dot if beat has a specific color
                if (beat.color && this.currentFramework !== 'free') {
                    btn.style.setProperty('--preset-dot', beat.color);
                    btn.classList.add('has-color-dot');
                }
                btn.onclick = () => {
                    const input = document.getElementById('structureBlockLabel');
                    if (input) input.value = label;
                    // Auto-apply suggested color for structured frameworks
                    if (beat.color && this.currentFramework !== 'free') {
                        this.setColor(beat.color);
                    }
                    // Show description
                    if (desc) {
                        this.showBeatHint(desc);
                    } else {
                        this.hideBeatHint();
                    }
                };
                labelContainer.appendChild(btn);
            });
        }

        // --- Colors ---
        const colorContainer = document.getElementById('structureBlockColorPresets');
        if (colorContainer) {
            colorContainer.innerHTML = '';

            let colorsToShow;
            if (this.currentFramework !== 'free') {
                // Show unique colors from the framework beats
                const fwColors = [...new Set(fw.beats.map(b => b.color).filter(Boolean))];
                const uniqueRecent = this.recentColors.filter(c => !fwColors.includes(c.toLowerCase()));
                colorsToShow = [...fwColors, ...uniqueRecent].slice(0, 12);
            } else {
                const uniqueRecent = this.recentColors.filter(c => !this.DEFAULT_COLORS.includes(c.toLowerCase()));
                colorsToShow = [...this.DEFAULT_COLORS, ...uniqueRecent].slice(0, 12);
            }

            colorsToShow.forEach(c => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = c;
                swatch.onclick = () => this.setColor(c);
                colorContainer.appendChild(swatch);
            });
        }
    },

    // ---------------------------------------------------------------------------
    // BEAT HINT
    // ---------------------------------------------------------------------------

    showBeatHint(text) {
        const hint = document.getElementById('structureBlockBeatHint');
        if (!hint) return;
        hint.textContent = text;
        hint.style.display = 'block';

        // Clear previous timer
        if (this._beatHintTimer) clearTimeout(this._beatHintTimer);
        this._beatHintTimer = setTimeout(() => this.hideBeatHint(), 8000);
    },

    hideBeatHint() {
        const hint = document.getElementById('structureBlockBeatHint');
        if (hint) hint.style.display = 'none';
        if (this._beatHintTimer) {
            clearTimeout(this._beatHintTimer);
            this._beatHintTimer = null;
        }
    },

    // ---------------------------------------------------------------------------
    // COLOR HELPERS
    // ---------------------------------------------------------------------------

    loadRecentColors() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            this.recentColors = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.recentColors = [];
        }
    },

    saveColorToHistory(color) {
        if (!color) return;
        color = color.toLowerCase();

        // Don't save if it's a default color
        if (this.DEFAULT_COLORS.map(c => c.toLowerCase()).includes(color)) return;

        // Add to start, unique only
        this.recentColors = [color, ...this.recentColors.filter(c => c !== color)].slice(0, 6);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentColors));
    },

    /**
     * Helper: Sets the color in the modal and updates preview
     */
    setColor(color) {
        const inputColor = document.getElementById('structureBlockColor');
        const previewEl = document.getElementById('colorPreview');
        if (inputColor) inputColor.value = color;
        if (previewEl) previewEl.style.background = color;

        // Mark active swatch
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            const swatchColor = this.rgbToHex(swatch.style.backgroundColor);
            swatch.classList.toggle('active', swatchColor.toLowerCase() === color.toLowerCase());
        });
    },

    // ---------------------------------------------------------------------------
    // CONFIRM / APPLY
    // ---------------------------------------------------------------------------

    /**
     * Confirms modal action
     */
    confirm() {
        const labelText = document.getElementById('structureBlockLabel').value || 'SCENE BEAT';
        const color = document.getElementById('structureBlockColor').value || '#ff8c42';

        this.saveColorToHistory(color);

        if (this.editingBlock) {
            this.update(this.editingBlock, labelText, color);
        } else {
            this.apply(labelText, color);
        }

        this.closeModal();
    },

    // ---------------------------------------------------------------------------
    // CRUD
    // ---------------------------------------------------------------------------

    /**
     * Create a new block
     */
    apply(labelText, color) {
        if (!this.lastRange) return;

        const container = document.createElement('div');
        container.className = 'structure-block';

        this.updateStyles(container, color);

        const header = this.createHeader(labelText, container);

        const content = document.createElement('div');
        content.className = 'structure-block-content';
        content.contentEditable = 'true';
        content.setAttribute('data-placeholder', 'Contenu du bloc...');

        try {
            content.appendChild(this.lastRange.extractContents());
        } catch (e) {
            console.error("Error extracting contents:", e);
        }

        container.appendChild(header);
        container.appendChild(content);

        this.lastRange.insertNode(container);

        // Clean up
        const selection = window.getSelection();
        selection.removeAllRanges();

        this.onChanged();
    },

    /**
     * Update an existing block
     */
    update(block, labelText, color) {
        this.updateStyles(block, color);
        const labelEl = block.querySelector('.structure-block-label');
        if (labelEl) labelEl.textContent = labelText;

        this.onChanged();
    },

    /**
     * Deletes the block
     */
    removeBlock(block, unwrap = true) {
        const parent = block.parentNode;
        const nextSibling = block.nextSibling;
        
        let movedNodes = [];
        const content = block.querySelector('.structure-block-content');
        
        if (unwrap) {
            if (content) {
                while (content.firstChild) {
                    const child = content.firstChild;
                    movedNodes.push(child);
                    parent.insertBefore(child, block);
                }
            }
        }
        
        block.remove();
        this.onChanged();
        
        const msg = unwrap 
            ? (Localization.t('toast.structure_block.unwrapped') || 'Bloc retiré') 
            : (Localization.t('toast.structure_block.deleted') || 'Bloc supprimé');

        this.showUndoToast(msg, () => {
            if (unwrap && content) {
                // Remettre les nœuds dans le content
                movedNodes.forEach(node => content.appendChild(node));
            }
            // Remettre le bloc à sa place
            parent.insertBefore(block, nextSibling);
            this.onChanged();
        });
    },

    showUndoToast(message, undoAction) {
        // Supprimer l'ancien toast s'il existe
        const existingToast = document.querySelector('.sb-undo-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'sb-undo-toast';
        toast.innerHTML = `
            <span>${message}</span>
            <button class="sb-toast-undo-btn">${Localization.t('btn.undo') || 'Annuler'}</button>
        `;
        document.body.appendChild(toast);

        // Styling inline custom
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-secondary, #2d2d2d)',
            color: 'var(--text-primary, #ffffff)',
            border: '1px solid var(--border-color)',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: '9999',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            animation: 'sbToastSlideUp 0.3s ease forwards'
        });

        // Add keyframe if not exists
        if (!document.getElementById('sbToastStyles')) {
            const style = document.createElement('style');
            style.id = 'sbToastStyles';
            style.textContent = `
                @keyframes sbToastSlideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                @keyframes sbToastFadeOut { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, 10px); } }
                .sb-toast-undo-btn { background: none; border: none; color: var(--accent-gold, #ffb703); font-weight: bold; cursor: pointer; padding: 0; font-size: 14px; }
                .sb-toast-undo-btn:hover { text-decoration: underline; }
            `;
            document.head.appendChild(style);
        }

        let timeout = setTimeout(() => {
            toast.style.animation = 'sbToastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        toast.querySelector('.sb-toast-undo-btn').addEventListener('click', () => {
            clearTimeout(timeout);
            toast.style.animation = 'sbToastFadeOut 0.2s ease forwards';
            setTimeout(() => toast.remove(), 200);
            if (undoAction) undoAction();
        });
    },

    upgradeLegacyBlocks() {
        const blocks = document.querySelectorAll('.structure-block');
        let upgraded = false;

        blocks.forEach(block => {
            const header = block.querySelector('.structure-block-header');
            if (header && !header.querySelector('.structure-block-actions')) {
                const labelEl = header.querySelector('.structure-block-label');
                const labelText = labelEl ? labelEl.textContent : 'SCENE BEAT';
                const newHeader = this.createHeader(labelText, block);
                header.replaceWith(newHeader);
                upgraded = true;
            }
        });

        if (upgraded && typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    /**
     * UI Helper: Create the header with actions
     */
    createHeader(labelText, container) {
        const header = document.createElement('div');
        header.className = 'structure-block-header';
        header.contentEditable = 'false';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', this._getIconForLabel(labelText));
        icon.style.width = '14px';
        icon.style.height = '14px';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'structure-block-label';
        labelSpan.textContent = labelText;

        const actions = document.createElement('div');
        actions.className = 'structure-block-actions';

        // Edit Button (Pencil)
        const editBtn = document.createElement('button');
        editBtn.className = 'structure-block-btn action-edit';
        editBtn.title = Localization.t('btn.edit') || 'Modifier';
        editBtn.innerHTML = '<i data-lucide="pencil" style="width:12px;height:12px;"></i>';

        // Unwrap Button (Scissors)
        const unwrapBtn = document.createElement('button');
        unwrapBtn.className = 'structure-block-btn action-unwrap';
        unwrapBtn.title = Localization.t('toolbar.structure_block.unwrap') || 'Détacher';
        unwrapBtn.innerHTML = '<i data-lucide="scissors" style="width:12px;height:12px;"></i>';

        // Delete Button (Trash)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'structure-block-btn delete action-delete';
        deleteBtn.title = Localization.t('toolbar.structure_block.delete') || 'Supprimer';
        deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width:12px;height:12px;"></i>';

        // Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'structure-block-toggle action-toggle';
        toggleBtn.textContent = Localization.t('btn.hide') || 'Masquer';

        header.appendChild(icon);
        header.appendChild(labelSpan);
        actions.appendChild(editBtn);
        actions.appendChild(unwrapBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(toggleBtn);
        header.appendChild(actions);

        return header;
    },

    /**
     * Returns the appropriate Lucide icon name for a given label text
     */
    _getIconForLabel(label) {
        if (!label) return 'layers';
        const upper = label.toUpperCase();
        if (upper.includes('CLIMAX'))       return 'flame';
        if (upper.includes('BEAT'))         return 'zap';
        if (upper.includes('FLASHBACK'))    return 'rewind';
        if (upper.includes('PROLOGUE'))     return 'book-open';
        if (upper.includes('ÉPILOGUE') || upper.includes('EPILOGUE')) return 'book-open';
        if (upper.includes('RÉSOLUTION') || upper.includes('RESOLUTION')) return 'sunset';
        if (upper.includes('INCIDENT'))     return 'alert-circle';
        if (upper.includes('MENTOR'))       return 'user-check';
        if (upper.includes('CRISE') || upper.includes('CRISIS')) return 'alert-triangle';
        if (upper.includes('RETOUR') || upper.includes('RETURN')) return 'corner-up-left';
        if (upper.includes('SEUIL') || upper.includes('PASSAGE')) return 'door-open';
        if (upper.includes('HÉROS') || upper.includes('HEROS'))  return 'sword';
        return 'layers';
    },

    // ---------------------------------------------------------------------------
    // INIT & EVENT DELEGATION
    // ---------------------------------------------------------------------------

    /**
     * Initialize event delegation
     */
    init() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.structure-block-btn, .structure-block-toggle');
            if (!btn) return;

            const block = btn.closest('.structure-block');
            if (!block) return;

            e.preventDefault();
            e.stopPropagation();

            if (btn.classList.contains('action-edit')) {
                this.editBlock(block);
            } else if (btn.classList.contains('action-unwrap')) {
                this.removeBlock(block, true);
            } else if (btn.classList.contains('action-delete')) {
                this.removeBlock(block, false);
            } else if (btn.classList.contains('action-toggle')) {
                block.classList.toggle('collapsed');
                const isCollapsed = block.classList.contains('collapsed');
                btn.textContent = isCollapsed
                    ? (Localization.t('btn.show') || 'Afficher')
                    : (Localization.t('btn.hide') || 'Masquer');
                this.onChanged();
            }
        });

        // Add real-time color preview in modal
        const inputColor = document.getElementById('structureBlockColor');
        if (inputColor) {
            inputColor.addEventListener('input', (e) => {
                this.setColor(e.target.value);
            });
        }

        this.upgradeLegacyBlocks();

        // Prevent Backspace/Delete from breaking structure blocks
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e), true);
    },

    /**
     * Prevent merging content outside of structure blocks or deleting them
     * in a way that breaks the UI (merging with previous paragraph).
     */
    handleGlobalKeyDown(e) {
        if (e.key !== 'Backspace' && e.key !== 'Delete') return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;

        // --- BACKSPACE PROTECTION --- (Prevent merging out of a block)
        if (e.key === 'Backspace') {
            const blockContent = this.getClosestBlockContent(container);
            if (blockContent) {
                // If we are at the very beginning of the block content, stop backspace
                if (offset === 0 && this.isAtStartOfElement(container, blockContent)) {
                    e.preventDefault();
                    return;
                }
            }
        }

        // --- DELETE PROTECTION --- (Prevent merging a block into previous text)
        if (e.key === 'Delete') {
            const editorTextarea = document.querySelector('.editor-textarea');
            if (!editorTextarea || !editorTextarea.contains(container)) return;

            // Simple check: am I at the end of an element and the next sibling is a structure-block?
            if (this.isAtEndOfElement(container, offset)) {
                let currentNode = (container.nodeType === Node.TEXT_NODE) ? container.parentElement : container;
                // Walk up to find the direct child of editor-textarea or the closest block-level element
                while (currentNode && currentNode.parentElement !== editorTextarea && currentNode !== editorTextarea) {
                    currentNode = currentNode.parentElement;
                }

                if (currentNode && currentNode.nextElementSibling && currentNode.nextElementSibling.classList.contains('structure-block')) {
                    e.preventDefault();
                    return;
                }
            }
        }
    },

    getClosestBlockContent(node) {
        if (!node) return null;
        let curr = (node.nodeType === Node.TEXT_NODE) ? node.parentElement : node;
        return curr.closest('.structure-block-content');
    },

    isAtStartOfElement(node, element) {
        if (node === element) return true;
        let curr = node;
        while (curr && curr !== element) {
            if (curr.previousSibling) return false;
            curr = curr.parentNode;
        }
        return curr === element;
    },

    isAtEndOfElement(node, offset) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (offset < node.textContent.length) return false;
        } else {
            if (offset < node.childNodes.length) return false;
        }

        // Now check if there are any following visible siblings
        let curr = node;
        while (curr) {
            // Found a next sibling? Then we're not at the very end of this branch
            if (curr.nextSibling) return false;

            // Move up but don't go beyond the containing block or editor
            const parent = curr.parentElement;
            if (!parent || parent.classList.contains('editor-textarea') || parent.classList.contains('structure-block-content')) {
                break;
            }
            curr = parent;
        }
        return true;
    },

    updateStyles(block, color) {
        block.style.setProperty('--accent-color', color);
        const rgb = this.hexToRgb(color);
        if (rgb) {
            block.style.setProperty('--accent-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
    },

    onChanged() {
        this.upgradeLegacyBlocks();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof updateSceneContent === 'function') updateSceneContent();
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHex(rgb) {
        if (!rgb) return '#000000';
        if (rgb.startsWith('#')) return rgb;
        const parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!parts) return '#000000';
        delete (parts[0]);
        for (let i = 1; i <= 3; ++i) {
            parts[i] = parseInt(parts[i]).toString(16);
            if (parts[i].length === 1) parts[i] = '0' + parts[i];
        }
        return '#' + parts.join('');
    }
};
