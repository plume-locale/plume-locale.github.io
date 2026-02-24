/**
 * @file front-matter.repository.js
 * @description Repository pour gérer la persistance des éléments liminaires et annexes.
 */

class FrontMatterRepository {
    constructor() {
        // Au chargement, on s'assure que le tableau existe dans le projet
        if (!window.project) {
            console.warn('Project not initialized yet');
        }
    }

    /**
     * Récupère tous les éléments, triés par ordre.
     * @returns {Array} Liste des éléments
     */
    getAll() {
        if (!window.project) return [];
        if (!window.project.frontMatter) {
            window.project.frontMatter = [];
        }
        return window.project.frontMatter.sort((a, b) => a.order - b.order);
    }

    /**
     * Récupère un élément par son ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getById(id) {
        const items = this.getAll();
        return items.find(item => item.id === id) || null;
    }

    /**
     * Ajoute un nouvel élément.
     * @param {string} type 
     * @param {string} title 
     * @returns {Object} Le nouvel élément
     */
    add(type, title = null) {
        const items = this.getAll();
        const newItem = FrontMatterModel.create({
            type: type,
            title: title || FrontMatterModel.getDefaultTitle(type),
            order: items.length
        });

        window.project.frontMatter.push(newItem);
        this._recalibrateOrders(); // Assure la propreté des ordres
        return newItem;
    }

    /**
     * Met à jour un élément existant.
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Object|null} L'élément mis à jour
     */
    update(id, updates) {
        const item = this.getById(id);
        if (!item) return null;

        Object.assign(item, updates);
        item.updatedAt = Date.now();
        this._save();
        return item;
    }

    /**
     * Supprime un élément.
     * @param {string} id 
     * @returns {boolean} Succès
     */
    delete(id) {
        if (!window.project || !window.project.frontMatter) return false;

        const initialLength = window.project.frontMatter.length;
        window.project.frontMatter = window.project.frontMatter.filter(item => item.id !== id);

        const success = window.project.frontMatter.length < initialLength;
        if (success) {
            this._recalibrateOrders();
        }
        return success;
    }

    /**
     * Réordonne les éléments.
     * @param {Array<string>} orderedIds Liste des IDs dans le nouvel ordre
     */
    reorder(orderedIds) {
        const items = this.getAll();
        const itemMap = new Map(items.map(item => [item.id, item]));

        window.project.frontMatter = orderedIds
            .map((id, index) => {
                const item = itemMap.get(id);
                if (item) {
                    item.order = index;
                    return item;
                }
                return null;
            })
            .filter(item => item !== null);

        this._save();
    }

    /**
     * Déplace un élément d'un cran.
     * @param {string} id 
     * @param {number} direction -1 pour monter, 1 pour descendre
     */
    move(id, direction) {
        const items = this.getAll();
        const currentIndex = items.findIndex(item => item.id === id);
        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        // Échanger les ordres
        const tempOrder = items[currentIndex].order;
        items[currentIndex].order = items[newIndex].order;
        items[newIndex].order = tempOrder;

        this._recalibrateOrders();
    }

    _recalibrateOrders() {
        const items = this.getAll();
        items.forEach((item, index) => {
            item.order = index;
        });
        this._save();
    }

    /**
     * Sauvegarde le projet global.
     * @private
     */
    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        } else {
            console.warn('saveProject function not available');
        }
    }
}
