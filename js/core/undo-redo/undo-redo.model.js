/**
 * [MVVM : Model]
 * Modèles et configuration pour le système d'Undo/Redo
 */

const UndoRedoConfig = {
    maxHistorySize: 50,           // Nombre maximum d'etats dans l'historique
    debounceDelay: 1000,          // Delai de debounce en ms (1 seconde)
    excludeKeys: [                // Cles a exclure des snapshots (etat UI temporaire)
        'updatedAt'               // Les timestamps ne declenchent pas de changements
    ],
    // Actions qui necessitent une sauvegarde immediate (pas de debounce)
    immediateActions: [
        'add', 'remove', 'delete', 'create', 'reorder', 'move', 'toggle'
    ],
    // Traduction des types d'actions en libellés lisibles
    actionLabels: {
        'Act.add': 'undoredo.label.Act.add',
        'Act.delete': 'undoredo.label.Act.delete',
        'Act.reorder': 'undoredo.label.Act.reorder',
        'Chapter.add': 'undoredo.label.Chapter.add',
        'Chapter.delete': 'undoredo.label.Chapter.delete',
        'Chapter.reorder': 'undoredo.label.Chapter.reorder',
        'Scene.add': 'undoredo.label.Scene.add',
        'Scene.delete': 'undoredo.label.Scene.delete',
        'Scene.reorder': 'undoredo.label.Scene.reorder',
        'Scene.move': 'undoredo.label.Scene.move',
        'Character.add': 'undoredo.label.Character.add',
        'Character.delete': 'undoredo.label.Character.delete',
        'World.add': 'undoredo.label.World.add',
        'World.delete': 'undoredo.label.World.delete',
        'Codex.add': 'undoredo.label.Codex.add',
        'Codex.delete': 'undoredo.label.Codex.delete',
        'Codex.update': 'undoredo.label.Codex.update',
        'text-edit': 'undoredo.label.text-edit',
        'text-edit-start': 'undoredo.label.text-edit-start',
        'text-edit-end': 'undoredo.label.text-edit-end',
        'Arc.create': 'undoredo.label.Arc.create',
        'Arc.delete': 'undoredo.label.Arc.delete',
        'BoardItem.create': 'undoredo.label.BoardItem.create',
        'BoardItem.delete': 'undoredo.label.BoardItem.delete',
        'Card.create': 'undoredo.label.Card.create',
        'Card.delete': 'undoredo.label.Card.delete',
        'Card.move': 'undoredo.label.Card.move',
        'Connection.create': 'undoredo.label.Connection.create',
        'Connection.delete': 'undoredo.label.Connection.delete',
        'toggleTodo': 'undoredo.label.toggleTodo',
        'Scene.update': 'undoredo.label.Scene.update',
        'Chapter.update': 'undoredo.label.Chapter.update',
        'Act.update': 'undoredo.label.Act.update',
        'Map.updateLocation': 'undoredo.label.Map.updateLocation',
        'Map.addLocation': 'undoredo.label.Map.addLocation',
        'Map.deleteLocation': 'undoredo.label.Map.deleteLocation',
        'RelationMap.updateCharacterPosition': 'undoredo.label.RelationMap.updateCharacterPosition',
        'RelationMap.addRelation': 'undoredo.label.RelationMap.addRelation',
        'RelationMap.deleteRelation': 'undoredo.label.RelationMap.deleteRelation',
        'edit': 'undoredo.label.edit',
        'change': 'undoredo.label.change',
        'select-change': 'undoredo.label.select-change'
    }
};

/**
 * Classe représentant un snapshot de l'état du projet
 */
class UndoRedoSnapshot {
    constructor(label = 'Action', projectState, navigationState, thrillerState = null) {
        this.timestamp = Date.now();
        this.label = label;
        this.project = projectState;
        this.navigation = navigationState;
        this.thrillerBoardState = thrillerState;
    }
}

/**
 * Utilitaires pour la manipulation des snapshots
 */
const UndoRedoModel = {
    /**
     * Deep clone d'un objet (gere les objets complexes, Set, Map, etc.)
     * @param {*} obj - L'objet a cloner
     * @returns {*} - Le clone profond
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Set) {
            return new Set([...obj].map(item => this.deepClone(item)));
        }

        if (obj instanceof Map) {
            const clonedMap = new Map();
            obj.forEach((value, key) => {
                clonedMap.set(this.deepClone(key), this.deepClone(value));
            });
            return clonedMap;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * Compare deux objets pour detecter des changements significatifs
     * @param {Object} obj1 - Premier objet
     * @param {Object} obj2 - Deuxieme objet
     * @returns {boolean} - True si les objets sont differents
     */
    hasSignificantChanges(obj1, obj2) {
        if (obj1 === obj2) return false;
        if (obj1 === null || obj2 === null) return true;
        if (typeof obj1 !== typeof obj2) return true;

        if (typeof obj1 !== 'object') {
            return obj1 !== obj2;
        }

        if (Array.isArray(obj1)) {
            if (!Array.isArray(obj2)) return true;
            if (obj1.length !== obj2.length) return true;
            for (let i = 0; i < obj1.length; i++) {
                if (this.hasSignificantChanges(obj1[i], obj2[i])) return true;
            }
            return false;
        }

        const keys1 = Object.keys(obj1).filter(k => !UndoRedoConfig.excludeKeys.includes(k));
        const keys2 = Object.keys(obj2).filter(k => !UndoRedoConfig.excludeKeys.includes(k));

        if (keys1.length !== keys2.length) return true;

        for (const key of keys1) {
            if (!keys2.includes(key)) return true;
            if (this.hasSignificantChanges(obj1[key], obj2[key])) return true;
        }

        return false;
    }
};
