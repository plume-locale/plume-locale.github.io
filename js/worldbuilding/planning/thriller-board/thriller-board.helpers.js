/**
 * [MVVM : Thriller Board Helpers]
 * Fonctions utilitaires et de formatage.
 */

// ============================================
// ID GENERATION
// ============================================

/**
 * Génère un identifiant unique.
 * @param {string} prefix - Préfixe optionnel.
 * @returns {string} L'identifiant.
 */
function generateThrillerBoardId(prefix = '') {
    const now = Date.now();
    const rand = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${now}_${rand}` : `${now}_${rand}`;
}

// ============================================
// VALUE FORMATTING
// ============================================

/**
 * Formate une valeur brute en chaîne lisible.
 * @param {*} value - La valeur à formater.
 * @param {string} type - Le type de la propriété.
 * @returns {string} La valeur formatée.
 */
function formatThrillerPropertyValue(value, type) {
    if (!value && type !== 'boolean') {
        return '<em>Non défini</em>';
    }

    switch (type) {
        case 'boolean':
            return value
                ? '<span style="color: #27ae60;">✓ Vrai</span>'
                : '<span style="color: #e74c3c;">✗ Faux</span>';

        case 'array':
            if (Array.isArray(value)) {
                return value.length > 0
                    ? value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '')
                    : '<em>Aucun</em>';
            }
            return '<em>Aucun</em>';

        case 'character':
        case 'characters':
            if (Array.isArray(value)) {
                return value.length > 0
                    ? value.slice(0, 2).join(', ') + (value.length > 2 ? '...' : '')
                    : '<em>Aucun</em>';
            }
            return value || '<em>Non défini</em>';

        case 'select':
            return THRILLER_VALUE_TRANSLATIONS[value] || value;

        case 'description':
            if (!value) return '<em>Aucune description</em>';
            if (typeof value === 'string' && value.length > 150) {
                return value.substring(0, 150) + '...';
            }
            return value;

        case 'witnesses':
            return formatWitnessesList(value);

        case 'scene':
        case 'scene_link':
            return formatSceneReference(value);

        case 'link':
            // Lien générique vers une entité (à implémenter si besoin de plus de détail)
            return value ? `<span class="badge badge-outline">${value}</span>` : '<em>Non défini</em>';

        case 'dropdown':
            return value || '<em>Non défini</em>';

        default:
            if (typeof value === 'string' && value.length > 80) {
                return value.substring(0, 80) + '...';
            }
            return value;
    }
}

/**
 * Formate la liste des témoins.
 * @param {Array} witnesses - Liste des IDs de témoins.
 * @returns {string} HTML formaté.
 */
function formatWitnessesList(witnesses) {
    if (!witnesses || !Array.isArray(witnesses) || witnesses.length === 0) {
        return '<em>Aucun témoin</em>';
    }

    const names = witnesses.map(witnessId => {
        const char = getCharacterById(witnessId);
        return char ? char.name : 'Inconnu';
    });

    return names.map(name => `<div style="padding: 2px 0;">• ${name}</div>`).join('');
}

/**
 * Formate une référence de scène.
 * @param {string} sceneId - ID de la scène.
 * @returns {string} HTML formaté.
 */
function formatSceneReference(sceneId) {
    if (!sceneId) return '<em>Non défini</em>';
    if (typeof project === 'undefined' || !project.acts) return '<em>Scène introuvable</em>';

    for (const act of project.acts) {
        if (!act.chapters) continue;
        for (const chapter of act.chapters) {
            if (!chapter.scenes) continue;
            const scene = chapter.scenes.find(s => String(s.id) === String(sceneId));
            if (scene) {
                const parts = [];
                if (project.tomes && project.tomes.length > 1) {
                    const tome = project.tomes.find(t => t.acts && t.acts.includes(act.id));
                    if (tome) parts.push(tome.title);
                }
                parts.push(act.title);
                parts.push(chapter.title);
                parts.push(scene.title || 'Scène');
                return `<em>${parts.join(' > ')}</em>`;
            }
        }
    }

    return '<em>Scène introuvable</em>';
}

// ============================================
// CHARACTER HELPERS
// ============================================

/**
 * Récupère un personnage par son ID.
 * @param {string|number} charId - ID du personnage.
 * @returns {Object|null} Le personnage ou null.
 */
function getCharacterById(charId) {
    if (typeof project === 'undefined' || !project.characters) return null;
    return project.characters.find(c => String(c.id) === String(charId)) || null;
}

/**
 * Récupère le nom d'un personnage.
 * @param {string|number} charId - ID du personnage.
 * @returns {string} Le nom ou 'Inconnu'.
 */
function getCharacterName(charId) {
    const char = getCharacterById(charId);
    return char ? char.name : 'Inconnu';
}

// ============================================
// SCENE HELPERS
// ============================================

/**
 * Récupère une scène par son ID.
 * @param {string|number} sceneId - ID de la scène.
 * @returns {Object|null} La scène avec contexte ou null.
 */
function getSceneById(sceneId) {
    if (typeof project === 'undefined' || !project.acts) return null;

    for (const act of project.acts) {
        if (!act.chapters) continue;
        for (const chapter of act.chapters) {
            if (!chapter.scenes) continue;
            const scene = chapter.scenes.find(s => String(s.id) === String(sceneId));
            if (scene) {
                return {
                    scene,
                    chapter,
                    act
                };
            }
        }
    }
    return null;
}

/**
 * Génère le fil d'Ariane d'une scène.
 * @param {string|number} sceneId - ID de la scène.
 * @returns {string} Le fil d'Ariane.
 */
function getSceneBreadcrumb(sceneId) {
    const data = getSceneById(sceneId);
    if (!data) return 'Scène introuvable';

    const { scene, chapter, act } = data;
    return `${act.title} › ${chapter.title} › ${scene.title || 'Scène'}`;
}

/**
 * Génère les options HTML pour un sélecteur de scène.
 * @param {string} selectedSceneId - ID de la scène sélectionnée.
 * @returns {string} HTML des options.
 */
function renderSceneSelectOptions(selectedSceneId) {
    if (typeof project === 'undefined' || !project.acts) return '';

    let options = '';
    project.acts.forEach(act => {
        if (!act.chapters) return;
        act.chapters.forEach(chapter => {
            if (!chapter.scenes) return;
            chapter.scenes.forEach(scene => {
                const selected = String(scene.id) === String(selectedSceneId) ? 'selected' : '';
                const label = `${act.title} > ${chapter.title}: ${scene.title || 'Scène'}`;
                options += `<option value="${scene.id}" ${selected}>${label}</option>`;
            });
        });
    });
    return options;
}

// ============================================
// CARD PROPERTIES HELPERS
// ============================================

/**
 * Récupère les propriétés attendues pour un type de carte.
 * @param {string} cardType - Type de carte.
 * @returns {Array} Liste des propriétés.
 */
function getThrillerCardTypeProperties(cardType) {
    // 1. Chercher dans les constantes prédéfinies
    if (THRILLER_CARD_PROPERTIES[cardType]) {
        return THRILLER_CARD_PROPERTIES[cardType];
    }

    // 2. Chercher dans les types personnalisés via le repository
    if (typeof ThrillerTypeRepository !== 'undefined') {
        const typeDef = ThrillerTypeRepository.getTypeDefinition(cardType);
        if (typeDef && typeDef.fields) {
            return typeDef.fields;
        }
    }

    return [];
}

// ============================================
// SWIMLANE HELPERS
// ============================================

/**
 * Détermine le swimlane approprié pour un élément.
 * @param {Object} element - L'élément.
 * @returns {string|null} L'ID du swimlane ou null.
 */
function getSwimlaneForElement(element) {
    if (!element || !element.data) return null;

    switch (element.type) {
        case 'alibi':
        case 'knowledge_state':
        case 'motive_means_opportunity':
            if (element.data.character_id) {
                return `character_${element.data.character_id}`;
            }
            break;
        case 'secret':
            if (element.data.holder_character_id) {
                return `character_${element.data.holder_character_id}`;
            }
            break;
        case 'backstory':
            if (element.data.characters_involved && element.data.characters_involved.length > 0) {
                return `character_${element.data.characters_involved[0]}`;
            }
            break;
    }

    return null;
}

/**
 * Récupère les scènes référencées par un élément.
 * @param {Object} element - L'élément.
 * @returns {Array} Liste des IDs de scènes.
 */
function getReferencedScenes(element) {
    if (!element || !element.data) return [];

    const sceneFields = [
        'verified_scene', 'broken_scene',
        'planted_scene', 'discovered_scene', 'reader_sees_at',
        'revealed_scene', 'raised_scene', 'answered_scene',
        'introduced_scene', 'debunked_scene', 'reversal_scene_id'
    ];

    const scenes = [];
    sceneFields.forEach(field => {
        if (element.data[field]) {
            scenes.push(element.data[field]);
        }
    });

    // Ajouter les scènes de listes
    const listFields = ['foreshadowing_scenes', 'setup_scenes'];
    listFields.forEach(field => {
        if (element.data[field] && Array.isArray(element.data[field])) {
            scenes.push(...element.data[field]);
        }
    });

    return [...new Set(scenes)]; // Dédoublonner
}

// ============================================
// LIST RENDERING HELPERS
// ============================================

/**
 * Génère le HTML pour les pills de personnages.
 * @param {Array} selectedCharacters - Liste des IDs sélectionnés.
 * @param {string} fieldName - Nom du champ.
 * @returns {string} HTML.
 */
function renderCharacterPillsHTML(selectedCharacters, fieldName) {
    if (typeof project === 'undefined' || !project.characters) return '';

    const pills = selectedCharacters.map(charId => {
        const char = getCharacterById(charId);
        if (!char) return '';
        return `
            <span class="character-pill" data-char-id="${charId}">
                ${char.name}
                <button type="button" onclick="removeCharacterPill('${fieldName}', '${charId}')" class="pill-remove"><i data-lucide="x" style="width:10px;height:10px;"></i></button>
            </span>
        `;
    }).join('');

    // Liste des personnages disponibles
    const availableChars = project.characters.filter(c => !selectedCharacters.includes(String(c.id)));
    const dropdown = `
        <select class="character-pill-dropdown" onchange="addCharacterPill('${fieldName}', this.value); this.value='';">
            <option value="">+ Ajouter...</option>
            ${availableChars.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
    `;

    return pills + dropdown;
}

/**
 * Génère le HTML pour les pills de scènes.
 * @param {Array} selectedScenes - Liste des IDs sélectionnés.
 * @param {string} fieldName - Nom du champ.
 * @returns {string} HTML.
 */
function renderScenePillsHTML(selectedScenes, fieldName) {
    if (typeof project === 'undefined' || !project.acts) return '';

    const pills = selectedScenes.map(sceneId => {
        const breadcrumb = getSceneBreadcrumb(sceneId);
        return `
            <span class="scene-pill" data-scene-id="${sceneId}">
                ${breadcrumb}
                <button type="button" onclick="removeScenePill('${fieldName}', '${sceneId}')" class="pill-remove"><i data-lucide="x" style="width:10px;height:10px;"></i></button>
            </span>
        `;
    }).join('');

    // Liste des scènes disponibles
    let options = '<option value="">+ Ajouter...</option>';
    project.acts.forEach(act => {
        if (!act.chapters) return;
        act.chapters.forEach(chapter => {
            if (!chapter.scenes) return;
            chapter.scenes.forEach(scene => {
                if (!selectedScenes.includes(String(scene.id))) {
                    const label = `${act.title} > ${chapter.title}: ${scene.title || 'Scène'}`;
                    options += `<option value="${scene.id}">${label}</option>`;
                }
            });
        });
    });

    const dropdown = `
        <select class="scene-pill-dropdown" onchange="addScenePill('${fieldName}', this.value); this.value='';">
            ${options}
        </select>
    `;

    return pills + dropdown;
}

/**
 * Génère le HTML pour une liste d'éléments texte modifiables.
 * @param {Array} items - Liste des textes.
 * @param {string} fieldName - Nom du champ.
 * @returns {string} HTML.
 */
function renderListItemsHTML(items, fieldName) {
    if (!items || items.length === 0) return '';

    return items.map((item, index) => `
        <div class="list-item" data-index="${index}">
            <input type="text" class="form-input list-item-input" value="${item}" placeholder="Texte...">
            <button type="button" class="btn-icon-sm" onclick="removeListItem('${fieldName}', ${index})" title="Supprimer">
                <i data-lucide="x"></i>
            </button>
        </div>
    `).join('');
}
// ============================================
// POSITION HELPERS
// ============================================

/**
 * Calcule la position d'un socket par rapport au SVG des connexions.
 * @param {HTMLElement} socket - L'élément socket.
 * @returns {Object} Coordonnées {x, y}.
 */
function getSocketPosition(socket) {
    const svg = document.getElementById('thrillerGridConnections');
    if (!svg) return { x: 0, y: 0 };

    const svgRect = svg.getBoundingClientRect();
    const socketRect = socket.getBoundingClientRect();

    return {
        x: socketRect.left + socketRect.width / 2 - svgRect.left,
        y: socketRect.top + socketRect.height / 2 - svgRect.top
    };
}
