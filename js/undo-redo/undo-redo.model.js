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
        'Act.add': 'Ajout d\'un acte',
        'Act.delete': 'Suppression d\'un acte',
        'Act.reorder': 'Réordonnancement des actes',
        'Chapter.add': 'Ajout d\'un chapitre',
        'Chapter.delete': 'Suppression d\'un chapitre',
        'Chapter.reorder': 'Réordonnancement des chapitres',
        'Scene.add': 'Ajout d\'une scène',
        'Scene.delete': 'Suppression d\'une scène',
        'Scene.reorder': 'Réordonnancement des scènes',
        'Scene.move': 'Déplacement d\'une scène',
        'Character.add': 'Nouveau personnage',
        'Character.delete': 'Suppression d\'un personnage',
        'World.add': 'Nouvel élément de monde',
        'World.delete': 'Suppression d\'un élément',
        'Codex.add': 'Ajout au codex',
        'Codex.delete': 'Suppression du codex',
        'Codex.update': 'Modification du codex',
        'text-edit': 'Modification de texte',
        'text-edit-start': 'Début d\'édition',
        'text-edit-end': 'Fin d\'édition',
        'Arc.create': 'Nouvel arc narratif',
        'Arc.delete': 'Suppression d\'un arc',
        'BoardItem.create': 'Nouvel élément sur le tableau',
        'BoardItem.delete': 'Suppression d\'un élément',
        'Card.create': 'Nouvelle carte',
        'Card.delete': 'Suppression d\'une carte',
        'Card.move': 'Déplacement d\'une carte',
        'Connection.create': 'Nouvelle connexion',
        'Connection.delete': 'Suppression de connexion',
        'toggleTodo': 'Changement d\'état TODO',
        'Scene.update': 'Modification de scène',
        'Chapter.update': 'Modification de chapitre',
        'Act.update': 'Modification d\'acte',
        'Map.updateLocation': 'Déplacement d\'un point sur la carte',
        'Map.addLocation': 'Nouvel emplacement sur la carte',
        'Map.deleteLocation': 'Suppression d\'un emplacement',
        'RelationMap.updateCharacterPosition': 'Déplacement de personnage',
        'RelationMap.addRelation': 'Nouvelle relation',
        'RelationMap.deleteRelation': 'Suppression de relation',
        'edit': 'Modification',
        'change': 'Changement de valeur',
        'select-change': 'Changement de sélection'
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
