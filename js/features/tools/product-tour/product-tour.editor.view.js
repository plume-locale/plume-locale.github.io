/**
 * [MVVM : Product Tour Editor View]
 * Interface WYSIWYG pour éditer les étapes du tour.
 */

const ProductTourEditorView = {
    /**
     * Cache des éléments DOM
     */
    elements: {
        overlay: null,
        highlight: null,
        modal: null,
        sidebar: null,
        selectionTarget: 'element' // 'element', 'clickBefore', 'clickAfter'
    },

    /**
     * Initialise l'interface de l'éditeur.
     */
    init: function () {
        this._injectStyles();
        this._createOverlay();
        this._createModal();
        this._createSidebar();
        this._initShortcuts();

        // Privilégier les balises HTML sémantiques (<strong>, <em>, <u>)
        try {
            document.execCommand('styleWithCSS', false, false);
        } catch (e) { }
    },

    /**
     * Injecte dynamiquement le CSS de l'éditeur.
     */
    _injectStyles: function () {
        if (document.getElementById('tour-editor-styles')) return;
        const link = document.createElement('link');
        link.id = 'tour-editor-styles';
        link.rel = 'stylesheet';
        link.href = 'css/product-tour-editor.css';
        document.head.appendChild(link);
    },

    /**
     * Exécute une commande de mise en forme sur l'éditeur riche.
     */
    execCommand: function (command, value = null) {
        const editor = document.getElementById('editor-tour');
        if (editor && editor._lastRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(editor._lastRange);
        }

        // Privilégier les balises HTML sémantiques (<strong>, <em>, <u>)
        // sauf pour les couleurs qui n'ont pas d'équivalent HTML
        const colorCommands = ['foreColor', 'hiliteColor', 'backColor'];
        try {
            document.execCommand('styleWithCSS', false, colorCommands.includes(command));
        } catch (e) { }

        if (command === 'removeFormat') {
            document.execCommand('removeFormat', false, null);
            // Renforcer la gomme pour les couleurs CSS
            document.execCommand('foreColor', false, 'inherit');
            document.execCommand('hiliteColor', false, 'transparent');
        } else {
            document.execCommand(command, false, value);
        }

        if (editor) {
            editor.focus();
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                editor._lastRange = sel.getRangeAt(0).cloneRange();
            }
        }
    },

    /**
     * Crée l'overlay de sélection d'éléments.
     */
    _createOverlay: function () {
        if (document.getElementById('tour-selector-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'tour-selector-overlay';

        const highlight = document.createElement('div');
        highlight.className = 'tour-element-highlight';
        highlight.innerHTML = '<div class="tour-element-label"></div>';

        document.body.appendChild(overlay);
        document.body.appendChild(highlight);

        this.elements.overlay = overlay;
        this.elements.highlight = highlight;

        overlay.addEventListener('mousemove', (e) => this._onMouseMove(e));
        overlay.addEventListener('click', (e) => this._onClick(e));
    },

    /**
     * Crée le modal d'édition de step.
     */
    _createModal: function () {
        if (document.getElementById('tour-editor-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'tour-editor-modal';
        modal.className = 'tour-editor-modal';
        modal.innerHTML = `
            <div class="tour-editor-header">
                <h3>Édition de l'étape</h3>
                <button class="tour-step-btn" onclick="ProductTourEditorView.hideModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="tour-editor-body">
                <div class="tour-editor-field">
                    <label>Sélecteur CSS</label>
                    <input type="text" id="tour-edit-selector" readonly>
                </div>
                <div class="tour-editor-field">
                    <label>Titre de l'étape</label>
                    <input type="text" id="tour-edit-title" placeholder="Ex: Bienvenue sur l'éditeur">
                </div>
                <div class="tour-editor-field">
                    <label>Description</label>
                    <div class="tour-rte-toolbar">
                        <button type="button" class="tour-rte-btn" onmousedown="event.preventDefault()" onclick="ProductTourEditorView.execCommand('bold')" title="Gras">
                            <i data-lucide="bold"></i>
                        </button>
                        <button type="button" class="tour-rte-btn" onmousedown="event.preventDefault()" onclick="ProductTourEditorView.execCommand('italic')" title="Italique">
                            <i data-lucide="italic"></i>
                        </button>
                        <button type="button" class="tour-rte-btn" onmousedown="event.preventDefault()" onclick="ProductTourEditorView.execCommand('insertUnorderedList')" title="Liste à puces">
                            <i data-lucide="list"></i>
                        </button>
                        <button type="button" class="tour-rte-btn" onmousedown="event.preventDefault()" onclick="ProductTourEditorView.execCommand('insertOrderedList')" title="Liste ordonnée">
                            <i data-lucide="list-ordered"></i>
                        </button>
                        <button type="button" class="tour-rte-btn" onmousedown="event.preventDefault()" onclick="ProductTourEditorView.execCommand('createLink')" title="Lien">
                            <i data-lucide="link"></i>
                        </button>
                        <button type="button" class="tour-rte-btn" onmousedown="event.preventDefault()" onclick="ProductTourEditorView.execCommand('removeFormat')" title="Effacer la mise en forme">
                            <i data-lucide="eraser"></i>
                        </button>
                    </div>
                    <div id="editor-tour" class="tour-rte-editor" contenteditable="true"></div>
                </div>
                <div class="tour-editor-field">
                    <label>Image (URL ou chemin local ex: tour/step1.png)</label>
                    <input type="text" id="tour-edit-image" placeholder="tour/mon-image.png">
                </div>
                <div style="display: flex; gap: 1rem;">
                    <div class="tour-editor-field" style="flex: 1;">
                        <label>Position</label>
                        <select id="tour-edit-side">
                            <option value="bottom">En bas</option>
                            <option value="top">En haut</option>
                            <option value="left">À gauche</option>
                            <option value="right">À droite</option>
                        </select>
                    </div>
                    <div class="tour-editor-field" style="flex: 1;">
                        <label>Alignement</label>
                        <select id="tour-edit-align">
                            <option value="start">Début</option>
                            <option value="center">Centre</option>
                            <option value="end">Fin</option>
                        </select>
                    </div>
                </div>
                <div class="tour-editor-field">
                    <label>Action avant : Sélecteur à cliquer (ex: pour ouvrir un menu)</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="tour-edit-click" placeholder="#id-du-bouton-a-cliquer" style="flex: 1;">
                        <button class="tour-step-btn" onclick="ProductTourEditorView.toggleSelectionMode('clickBefore')" title="Choisir l'élément">
                            <i data-lucide="mouse-pointer-2" style="width:14px;"></i>
                        </button>
                    </div>
                </div>
                <div class="tour-editor-field">
                    <label>Action après : Sélecteur à cliquer (ex: pour fermer un menu)</label>
                    <div style="display: flex; gap: 5px;">
                        <input type="text" id="tour-edit-click-after" placeholder="#id-du-bouton-a-fermer" style="flex: 1;">
                        <button class="tour-step-btn" onclick="ProductTourEditorView.toggleSelectionMode('clickAfter')" title="Choisir l'élément">
                            <i data-lucide="mouse-pointer-2" style="width:14px;"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="tour-editor-footer">
                <button class="tour-editor-btn tour-editor-btn-secondary" onclick="ProductTourEditorView.hideModal()">Annuler</button>
                <button class="tour-editor-btn tour-editor-btn-primary" id="tour-save-step">Enregistrer l'étape</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.elements.modal = modal;

        const editor = document.getElementById('editor-tour');
        if (editor) {
            const saveRange = () => {
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    // Vérifier que la sélection est bien dans l'éditeur
                    if (editor.contains(range.commonAncestorContainer)) {
                        editor._lastRange = range.cloneRange();
                    }
                }
            };
            editor.addEventListener('mouseup', saveRange);
            editor.addEventListener('keyup', saveRange);
            editor.addEventListener('focus', saveRange);
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('tour-save-step').addEventListener('click', () => {
            this._saveCurrentStep();
        });
    },

    /**
     * Crée la barre latérale des étapes.
     */
    _createSidebar: function () {
        if (document.getElementById('tour-steps-sidebar')) return;

        const sidebar = document.createElement('div');
        sidebar.id = 'tour-steps-sidebar';
        sidebar.innerHTML = `
            <div class="tour-sidebar-header">
                <span style="font-weight: 600; color: var(--tour-editor-primary);">Étapes du Tour</span>
                <button class="tour-editor-btn tour-editor-btn-primary" style="font-size: 0.8rem; padding: 4px 10px;" onclick="ProductTourEditorView.toggleSelectionMode()">+ Ajouter</button>
            </div>
            <div class="tour-sidebar-list" id="tour-sidebar-list">
                <!-- Les étapes seront injectées ici -->
            </div>
            <div class="tour-editor-footer" style="padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <button class="tour-editor-btn tour-editor-btn-secondary" style="width: 100%;" onclick="ProductTourEditorViewModel.exportTourJSON()">Exporter JSON pour .data.js</button>
                <button class="tour-editor-btn tour-editor-btn-primary" style="width: 100%;" onclick="ProductTourEditorViewModel.saveTour()">Sauvegarder (Temp DB)</button>
            </div>
        `;
        document.body.appendChild(sidebar);
        this.elements.sidebar = sidebar;
    },

    /**
     * Initialise les raccourcis clavier.
     */
    _initShortcuts: function () {
        window.addEventListener('keydown', (e) => {
            // Ctrl + Alt + T pour basculer l'éditeur
            if (false && e.ctrlKey && e.altKey && e.key === 't') {
                e.preventDefault();
                ProductTourEditorViewModel.toggleEditor();
            }

            // Échap pour quitter le mode sélection
            if (e.key === 'Escape' && this.isSelectionModeActive()) {
                this.toggleSelectionMode();
            }
        });
    },

    /**
     * Bascule le mode de sélection.
     * @param {string} target - Le champ cible ('element', 'clickBefore', 'clickAfter')
     */
    toggleSelectionMode: function (target = 'element') {
        this.elements.selectionTarget = target;
        const isActive = this.elements.overlay.classList.toggle('active');

        if (isActive) {
            this.elements.modal.classList.remove('active'); // Cacher le modal pendant la sélection
            ProductTourNotificationView.showInfo("Cliquez sur un élément de l'interface.");
        } else {
            this.elements.highlight.style.display = 'none';
        }
    },

    isSelectionModeActive: function () {
        return this.elements.overlay.classList.contains('active');
    },

    /**
     * Gère le mouvement de la souris en mode sélection.
     */
    _onMouseMove: function (e) {
        if (!this.isSelectionModeActive()) return;

        // Cacher l'overlay temporairement pour trouver l'élément en dessous
        this.elements.overlay.style.pointerEvents = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        this.elements.overlay.style.pointerEvents = 'auto';

        if (el && el !== document.body && el !== document.documentElement) {
            const rect = el.getBoundingClientRect();
            const highlight = this.elements.highlight;

            highlight.style.display = 'block';
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            highlight.style.top = `${rect.top + window.scrollY}px`;
            highlight.style.left = `${rect.left + window.scrollX}px`;

            const selector = ProductTourStepModel.getUniqueSelector(el);
            highlight.querySelector('.tour-element-label').textContent = selector;
        }
    },

    /**
     * Gère le clic en mode sélection.
     */
    _onClick: function (e) {
        if (!this.isSelectionModeActive()) return;

        this.elements.overlay.style.pointerEvents = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        this.elements.overlay.style.pointerEvents = 'auto';

        if (el) {
            const selector = ProductTourStepModel.getUniqueSelector(el);
            const target = this.elements.selectionTarget;
            this.toggleSelectionMode(); // Désactive l'overlay

            if (target === 'element') {
                this.showModal(selector);
            } else if (target === 'clickBefore') {
                this.elements.modal.classList.add('active');
                document.getElementById('tour-edit-click').value = selector;
            } else if (target === 'clickAfter') {
                this.elements.modal.classList.add('active');
                document.getElementById('tour-edit-click-after').value = selector;
            }
        }
    },

    /**
     * Affiche le modal d'édition.
     */
    showModal: function (selector, data = null) {
        document.getElementById('tour-edit-selector').value = selector;
        document.getElementById('tour-edit-title').value = data?.title || '';
        document.getElementById('editor-tour').innerHTML = data?.description || '';
        document.getElementById('tour-edit-image').value = data?.image || '';
        document.getElementById('tour-edit-side').value = data?.side || 'bottom';
        document.getElementById('tour-edit-align').value = data?.align || 'start';
        document.getElementById('tour-edit-click').value = data?.clickBefore || '';
        document.getElementById('tour-edit-click-after').value = data?.clickAfter || '';

        this.elements.modal.classList.add('active');
        document.getElementById('tour-edit-title').focus();
    },

    hideModal: function () {
        this.elements.modal.classList.remove('active');
    },

    /**
     * Envoie les données du step au ViewModel.
     */
    _saveCurrentStep: function () {
        const stepData = {
            element: document.getElementById('tour-edit-selector').value,
            popover: {
                title: document.getElementById('tour-edit-title').value,
                description: document.getElementById('editor-tour').innerHTML,
                image: document.getElementById('tour-edit-image').value,
                side: document.getElementById('tour-edit-side').value,
                align: document.getElementById('tour-edit-align').value
            },
            clickBefore: document.getElementById('tour-edit-click').value,
            clickAfter: document.getElementById('tour-edit-click-after').value
        };

        ProductTourEditorViewModel.addOrUpdateStep(stepData);
        this.hideModal();
    },

    /**
     * Met à jour la liste des étapes dans la sidebar.
     */
    renderSidebar: function (steps) {
        const listContainer = document.getElementById('tour-sidebar-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        steps.forEach((step, index) => {
            const card = document.createElement('div');
            card.className = 'tour-step-card';
            card.innerHTML = `
                <div class="tour-step-card-header">
                    <span class="tour-step-title">${index + 1}. ${step.popover.title || 'Sans titre'}</span>
                    <div class="tour-step-actions">
                        <button class="tour-step-btn" onclick="ProductTourEditorViewModel.previewStep(${index})" title="Prévisualiser"><i data-lucide="eye" style="width:14px;"></i></button>
                        <button class="tour-step-btn" onclick="ProductTourEditorViewModel.moveStepUp(${index})" ${index === 0 ? 'disabled style="opacity: 0.2; cursor: default;"' : ''}>
                            <i data-lucide="chevron-up" style="width:14px;"></i>
                        </button>
                        <button class="tour-step-btn" onclick="ProductTourEditorViewModel.moveStepDown(${index})" ${index === steps.length - 1 ? 'disabled style="opacity: 0.2; cursor: default;"' : ''}>
                            <i data-lucide="chevron-down" style="width:14px;"></i>
                        </button>
                        <button class="tour-step-btn" onclick="ProductTourEditorViewModel.editStep(${index})"><i data-lucide="edit-2" style="width:14px;"></i></button>
                        <button class="tour-step-btn" onclick="ProductTourEditorViewModel.removeStep(${index})"><i data-lucide="trash-2" style="width:14px;"></i></button>
                    </div>
                </div>
                <div class="tour-step-selector">${step.element}</div>
            `;
            listContainer.appendChild(card);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Active/Désactive la barre latérale.
     */
    toggleSidebar: function (show) {
        if (show) {
            this.elements.sidebar.classList.add('active');
        } else {
            this.elements.sidebar.classList.remove('active');
        }
    }
};
