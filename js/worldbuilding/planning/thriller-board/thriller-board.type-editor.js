/**
 * [MVVM : Thriller Board Type Editor]
 * Éditeur visuel pour les types de cartes personnalisés.
 */

// ============================================
// STATE & CONFIG
// ============================================

const TypeEditorState = {
    currentType: null, // Données en cours d'édition
    draggedFieldType: null, // Type de champ en drag
    isNew: false // Mode création ou édition
};

const AVAILABLE_FIELD_TYPES = [
    { type: 'text', label: 'Texte court', icon: 'type' },
    { type: 'textarea', label: 'Texte long', icon: 'align-left' },
    { type: 'select', label: 'Liste déroulante', icon: 'list' },
    { type: 'boolean', label: 'Oui / Non', icon: 'check-square' },
    { type: 'character', label: 'Lien Personnage', icon: 'user' },
    { type: 'location', label: 'Lien Lieu', icon: 'map-pin' },
    { type: 'scene', label: 'Lien Scène', icon: 'clapperboard' },
    { type: 'link', label: 'Lien Entité (Générique)', icon: 'link' }
];

// ============================================
// PUBLIC API
// ============================================

/**
 * Ouvre le modal d'éditeur de type.
 * @param {string} typeId - ID du type à éditer (null pour nouveau).
 */
function openTypeEditor(typeId = null) {
    TypeEditorState.isNew = !typeId;

    if (typeId) {
        const typeDef = ThrillerTypeRepository.getTypeDefinition(typeId);
        if (!typeDef) return alert('Type introuvable');

        // Clone profond pour édition
        TypeEditorState.currentType = JSON.parse(JSON.stringify(typeDef));

        // S'assurer que fields existe pour les types système
        if (!TypeEditorState.currentType.fields) {
            TypeEditorState.currentType.fields = [];
        }
    } else {
        // Nouveau type par défaut
        TypeEditorState.currentType = {
            id: '',
            label: 'Nouveau Type',
            icon: 'star',
            color: '#9b59b6',
            description: '',
            fields: []
        };
    }

    renderTypeEditorModal();
}

// ============================================
// RENDERING
// ============================================

function renderTypeEditorModal() {
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('thrillerTypeEditorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'thrillerTypeEditorModal';
        modal.className = 'modal thriller-type-editor-modal';
        document.body.appendChild(modal);
    }

    const type = TypeEditorState.currentType;

    modal.innerHTML = `
        <div class="modal-content large-modal">
            <div class="modal-header">
                <h2>${TypeEditorState.isNew ? 'Créer un type de carte' : 'Modifier le type : ' + type.label}</h2>
                <button class="btn-close" onclick="closeTypeEditorModal()">&times;</button>
            </div>
            <div class="modal-body type-editor-body">
                
                <!-- GAUCHE : PALETTE D'OUTILS -->
                <div class="type-editor-sidebar">
                    <h3>Champs disponibles</h3>
                    <div class="field-palette">
                        ${AVAILABLE_FIELD_TYPES.map(ft => `
                            <div class="field-palette-item" draggable="true" ondragstart="handleFieldDragStart(event, '${ft.type}')">
                                <i data-lucide="${ft.icon}"></i>
                                <span>${ft.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- CENTRE : CANVAS / PREVIEW -->
                <div class="type-editor-canvas">
                    <div class="card-preview-header" style="background-color: ${type.color}">
                        <i data-lucide="${type.icon}"></i>
                        <span class="preview-title" id="previewTitle">${type.label}</span>
                    </div>
                    
                    <div class="card-preview-body" 
                         ondragover="handleCanvasDragOver(event)" 
                         ondrop="handleCanvasDrop(event)">
                        
                        ${type.isSystem || (typeof THRILLER_TYPES !== 'undefined' && THRILLER_TYPES[type.id]) ? `
                            <div class="system-fields-placeholder">
                                <i data-lucide="lock" style="width: 14px; height: 14px;"></i>
                                <span>Champs Système par défaut (Non éditables)</span>
                            </div>
                        ` : ''}

                        ${type.fields.length === 0 && !type.isSystem && (!typeof THRILLER_TYPES !== 'undefined' || !THRILLER_TYPES[type.id]) ? `
                            <div class="empty-canvas-message">
                                <i data-lucide="arrow-left"></i>
                                Glissez des champs ici
                            </div>
                        ` : ''}

                        ${type.fields.map((field, index) => renderPreviewField(field, index)).join('')}

                    </div>
                </div>

                <!-- DROITE : CONFIGURATION -->
                <div class="type-editor-config">
                    <h3>Propriétés du Type</h3>
                    
                    <div class="form-group">
                        <label>Nom du type</label>
                        <input type="text" class="form-input" value="${type.label}" oninput="updateTypeLabel(this.value)">
                    </div>

                    <div class="form-group">
                        <label>Couleur</label>
                        <input type="color" class="form-input" value="${type.color}" onchange="updateTypeColor(this.value)">
                    </div>

                    <div class="form-group">
                        <label>Icône (Lucide)</label>
                        <input type="text" class="form-input" value="${type.icon}" onchange="updateTypeIcon(this.value)">
                        <small>Nom de l'icône Lucide (ex: star, key, book)</small>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-input" oninput="updateTypeDescription(this.value)">${type.description || ''}</textarea>
                    </div>
                </div>

            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between;">
                ${!TypeEditorState.isNew ? `
                    <button class="btn btn-error" onclick="deleteTypeEditor()">Supprimer</button>
                ` : '<div></div>'}
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="closeTypeEditorModal()">Annuler</button>
                    <button class="btn btn-primary" onclick="saveTypeEditor()">Enregistrer</button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderPreviewField(field, index) {
    const fieldType = AVAILABLE_FIELD_TYPES.find(ft => ft.type === field.type) || { label: field.type, icon: 'box' };

    return `
        <div class="preview-field-item">
            <div class="preview-field-socket left"></div>
            <div class="preview-field-content">
                <div class="preview-field-header">
                    <span class="field-label">${field.label || fieldType.label}</span>
                    <div class="field-actions">
                        <button class="btn-icon-xs" onclick="moveFieldUp(${index})"><i data-lucide="arrow-up"></i></button>
                        <button class="btn-icon-xs" onclick="moveFieldDown(${index})"><i data-lucide="arrow-down"></i></button>
                        <button class="btn-icon-xs delete" onclick="removeField(${index})"><i data-lucide="x"></i></button>
                    </div>
                </div>
                <div class="preview-field-input-mock">
                    <input type="text" class="form-input update-field-label" 
                           value="${field.label}" 
                           placeholder="Nom du champ"
                           onchange="updateFieldConfig(${index}, 'label', this.value)">
                    ${field.type === 'select' ? renderSelectOptionsConfig(field, index) : ''}
                </div>
            </div>
            <div class="preview-field-socket right"></div>
        </div>
    `;
}

function renderSelectOptionsConfig(field, index) {
    const options = field.options || [];
    return `
        <div class="select-options-config">
            <small>Options (séparées par des virgules) :</small>
            <input type="text" class="form-input" 
                   value="${options.join(', ')}" 
                   placeholder="Option 1, Option 2..."
                   onchange="updateFieldConfig(${index}, 'options', this.value.split(',').map(s => s.trim()))">
        </div>
    `;
}

// ============================================
// ACTIONS
// ============================================

function closeTypeEditorModal() {
    const modal = document.getElementById('thrillerTypeEditorModal');
    if (modal) modal.style.display = 'none';
}

function handleFieldDragStart(event, type) {
    TypeEditorState.draggedFieldType = type;
    event.dataTransfer.effectAllowed = 'copy';
}

function handleCanvasDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    event.currentTarget.classList.add('drag-over');
}

function handleCanvasDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    if (TypeEditorState.draggedFieldType) {
        addField(TypeEditorState.draggedFieldType);
        TypeEditorState.draggedFieldType = null;
    }
}

function addField(type) {
    const fieldDef = AVAILABLE_FIELD_TYPES.find(ft => ft.type === type);

    const newField = {
        key: `field_${Date.now()}`,
        label: fieldDef.label,
        type: type,
        showEmpty: true // Toujours afficher le champ pour pouvoir le remplir
    };

    TypeEditorState.currentType.fields.push(newField);
    renderTypeEditorModal();
}

function removeField(index) {
    TypeEditorState.currentType.fields.splice(index, 1);
    renderTypeEditorModal();
}

function moveFieldUp(index) {
    if (index > 0) {
        const temp = TypeEditorState.currentType.fields[index];
        TypeEditorState.currentType.fields[index] = TypeEditorState.currentType.fields[index - 1];
        TypeEditorState.currentType.fields[index - 1] = temp;
        renderTypeEditorModal();
    }
}

function moveFieldDown(index) {
    if (index < TypeEditorState.currentType.fields.length - 1) {
        const temp = TypeEditorState.currentType.fields[index];
        TypeEditorState.currentType.fields[index] = TypeEditorState.currentType.fields[index + 1];
        TypeEditorState.currentType.fields[index + 1] = temp;
        renderTypeEditorModal();
    }
}

function updateTypeLabel(value) {
    TypeEditorState.currentType.label = value;
    document.getElementById('previewTitle').textContent = value;
}

function updateTypeColor(value) {
    TypeEditorState.currentType.color = value;
    document.querySelector('.card-preview-header').style.backgroundColor = value;
}

function updateTypeIcon(value) {
    TypeEditorState.currentType.icon = value;
    const iconContainer = document.querySelector('.card-preview-header i');
    if (iconContainer) {
        iconContainer.setAttribute('data-lucide', value);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function updateTypeDescription(value) {
    TypeEditorState.currentType.description = value;
}

function updateFieldConfig(index, key, value) {
    TypeEditorState.currentType.fields[index][key] = value;
    // Si on change le label, mettre à jour la clé automatiquement pour être consistant
    if (key === 'label') {
        const safeKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
        TypeEditorState.currentType.fields[index].key = safeKey + '_' + Date.now().toString().slice(-4);
    }
}

function saveTypeEditor() {
    const typeData = TypeEditorState.currentType;

    if (!typeData.label) return alert("Le nom du type est requis");

    // Générer un ID si nécessaire (cas création)
    if (!typeData.id) {
        typeData.id = 'custom_' + typeData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    let result;
    if (TypeEditorState.isNew) {
        result = addCustomTypeVM(typeData);
    } else {
        result = updateCustomTypeVM(typeData.id, typeData);
    }

    if (!result.success) return alert(result.error);

    // Gérer les effets de bord
    if (result.sideEffects) {
        if (result.sideEffects.shouldSave && typeof saveProject === 'function') saveProject();
        if (result.sideEffects.shouldRenderList && typeof renderThrillerList === 'function') renderThrillerList();
        if (result.sideEffects.shouldRender && typeof renderThrillerBoard === 'function') renderThrillerBoard();
    }

    if (!result.success) return alert(result.error);

    // Gérer les effets de bord
    if (result.sideEffects) {
        if (result.sideEffects.shouldSave && typeof saveProject === 'function') saveProject();
        if (result.sideEffects.shouldRenderList && typeof renderThrillerList === 'function') renderThrillerList();
        if (result.sideEffects.shouldRender && typeof renderThrillerBoard === 'function') renderThrillerBoard();
    }

    closeTypeEditorModal();
}

function deleteTypeEditor() {
    const typeId = TypeEditorState.currentType.id;
    if (!confirm('Voulez-vous vraiment supprimer ce type personnalisé ?')) return;

    const result = deleteCustomTypeVM(typeId);
    if (!result.success) return alert(result.error);

    // Gérer les effets de bord
    if (result.sideEffects) {
        if (result.sideEffects.shouldSave && typeof saveProject === 'function') saveProject();
        if (result.sideEffects.shouldRenderList && typeof renderThrillerList === 'function') renderThrillerList();
    }

    closeTypeEditorModal();
}

// ============================================
// STYLES CSS INJECTES
// ============================================

const style = document.createElement('style');
style.innerHTML = `
.thriller-type-editor-modal .modal-content {
    width: 90%;
    max-width: 1200px;
    height: 80vh;
    display: flex;
    flex-direction: column;
}

.type-editor-body {
    display: flex;
    flex: 1;
    gap: 20px;
    padding: 20px;
    overflow: hidden;
}

/* SIDEBAR */
.type-editor-sidebar {
    width: 250px;
    background: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.field-palette {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
    overflow-y: auto;
}

.field-palette-item {
    padding: 10px;
    background: white;
    border: 1px solid #eee;
    border-radius: 4px;
    cursor: grab;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s;
}

.field-palette-item:hover {
    background: #e9ecef;
    transform: translateX(5px);
}

/* CANVAS */
.type-editor-canvas {
    flex: 1;
    background: #e9ecef;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    overflow-y: auto;
}

.card-preview-header {
    width: 320px;
    padding: 10px 15px;
    border-radius: 8px 8px 0 0;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
}

.card-preview-body {
    width: 320px;
    min-height: 400px;
    background: white;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: background 0.2s;
}

.card-preview-body.drag-over {
    background: #e8f0fe;
    border: 2px dashed #3498db;
}

.empty-canvas-message {
    text-align: center;
    color: #999;
    margin-top: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

/* PREVIEW ITEM */
.preview-field-item {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    position: relative;
    /* Pour simuler les sockets */
}

.preview-field-socket {
    width: 8px;
    height: 8px;
    background: #ccc;
    border-radius: 50%;
}

.preview-field-content {
    flex: 1;
}

.preview-field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    font-size: 0.85rem;
    font-weight: bold;
    color: #555;
}

.field-actions {
    display: flex;
    gap: 2px;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.preview-field-item:hover .field-actions {
    opacity: 1;
}

.update-field-label {
    width: 100%;
    font-size: 0.8rem;
    border: 1px dashed transparent;
    padding: 2px 5px;
}

.update-field-label:hover {
    border-color: #ddd;
    background: #fdfdfd;
}

/* CONFIG */
.type-editor-config {
    width: 300px;
    background: white;
    border-left: 1px solid #ddd;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    font-size: 0.9rem;
}

.form-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.btn-icon-xs {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    color: #666;
}

.btn-icon-xs:hover {
    color: #000;
}

.btn-icon-xs.delete:hover {
    color: #e74c3c;
}

.system-fields-placeholder {
    padding: 10px;
    background: #f8f9fa;
    border: 1px dashed #ccc;
    border-radius: 4px;
    color: #666;
    font-size: 0.9em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 10px;
}
`;
document.head.appendChild(style);
