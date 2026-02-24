
/**
 * StructureBlocksUI
 * Allows wrapping selected text in a customizable styled block with a label.
 * Full CRUD: Create, Read (Render), Update (Edit label/color), Delete (Remove/Unwrap).
 */
const StructureBlockUI = {
    lastRange: null,
    editingBlock: null,

    // Configuration
    STORAGE_KEY: 'plume_structure_recent_colors',
    PRESET_LABELS: [
        'BEAT', 'INCIDENT', 'DÉCLENCHEUR', 'PONT 1', 'PONT 2',
        'POINT MÉDIAN', 'BASCULE', 'CRISE', 'CLIMAX',
        'RÉSOLUTION', 'FLASHBACK', 'PROLOGUE', 'ÉPILOGUE'
    ],
    DEFAULT_COLORS: ['#ff8c42', '#ff6b6b', '#ffd93d', '#51cf66', '#4a9eff', '#a78bfa'],
    recentColors: [],

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

        this.loadRecentColors();
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

        // Update modal title depending on mode
        const titleEl = document.querySelector('#structureBlockModal h2 [data-i18n]');
        if (titleEl) {
            titleEl.textContent = this.editingBlock
                ? (Localization.t('modal.structure_block.title_edit') || 'Modifier le bloc')
                : (Localization.t('modal.structure_block.title') || 'Créer un bloc structurel');
        }
    },

    /**
     * Hydrates the presets in the modal
     */
    renderPresets() {
        // Render Labels
        const labelContainer = document.getElementById('structureBlockLabelPresets');
        if (labelContainer) {
            labelContainer.innerHTML = '';
            this.PRESET_LABELS.forEach(text => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'preset-btn';
                btn.textContent = text;
                btn.onclick = () => {
                    const input = document.getElementById('structureBlockLabel');
                    if (input) input.value = text;
                };
                labelContainer.appendChild(btn);
            });
        }

        // Render Colors (Standard + Recent)
        const colorContainer = document.getElementById('structureBlockColorPresets');
        if (colorContainer) {
            colorContainer.innerHTML = '';
            // Only show unique colors, with recent ones first excluding standard ones
            const uniqueRecent = this.recentColors.filter(c => !this.DEFAULT_COLORS.includes(c.toLowerCase()));
            const allToDisplay = [...this.DEFAULT_COLORS, ...uniqueRecent].slice(0, 12); // Max 12 swatches

            allToDisplay.forEach(c => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = c;
                swatch.onclick = () => this.setColor(c);
                colorContainer.appendChild(swatch);
            });
        }
    },

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

    closeModal() {
        if (typeof closeModal === 'function') {
            closeModal('structureBlockModal');
        } else {
            const modal = document.getElementById('structureBlockModal');
            if (modal) modal.classList.remove('active');
        }
        this.editingBlock = null;
    },

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
        if (unwrap) {
            const content = block.querySelector('.structure-block-content');
            if (content) {
                while (content.firstChild) {
                    block.parentNode.insertBefore(content.firstChild, block);
                }
            }
        }
        block.remove();
        this.onChanged();
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
        icon.setAttribute('data-lucide', 'layers');
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
                if (confirm(Localization.t('modal.structure_block.confirm_unwrap') || 'Retirer le bloc ?')) {
                    this.removeBlock(block, true);
                }
            } else if (btn.classList.contains('action-delete')) {
                if (confirm(Localization.t('modal.structure_block.confirm_delete') || 'Supprimer le bloc ET son contenu ?')) {
                    this.removeBlock(block, false);
                }
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
