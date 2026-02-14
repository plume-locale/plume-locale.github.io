
/**
 * Repository for Map data with multiple map support and custom configurations.
 */
class MapRepository {
    constructor() { }

    /**
     * Get all maps from project.
     * Includes a migration check for legacy single-map project data.
     */
    getMaps() {
        if (!project.maps || project.maps.length === 0) {
            // Check for legacy data (single map architecture)
            if (project.mapImage || (project.mapLocations && project.mapLocations.length > 0)) {
                console.log('Migrating legacy map to new multi-map structure...');
                project.maps = [{
                    id: 'legacy',
                    name: 'Carte Principale',
                    image: project.mapImage,
                    locations: (project.mapLocations || []).map(loc => ({
                        ...loc,
                        typeId: loc.typeId || loc.type || 'default'
                    }))
                }];
                this.save();
            } else {
                project.maps = [];
            }
        }
        return project.maps;
    }

    /**
     * Get a specific map by ID.
     */
    getMap(mapId) {
        return this.getMaps().find(m => m.id === mapId);
    }

    /**
     * Add a new map.
     */
    addMap(name = 'Nouvelle Carte') {
        const newMap = {
            id: Date.now(),
            name: name,
            image: null,
            locations: []
        };
        project.maps.push(newMap);
        this.save();
        return newMap;
    }

    /**
     * Update a map's basic info.
     */
    updateMap(mapId, updates) {
        const index = project.maps.findIndex(m => m.id === mapId);
        if (index !== -1) {
            project.maps[index] = { ...project.maps[index], ...updates };
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Delete a map.
     */
    deleteMap(mapId) {
        const index = project.maps.findIndex(m => m.id === mapId);
        if (index !== -1) {
            project.maps.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Location CRUD
     */

    addLocation(mapId, location) {
        const map = this.getMap(mapId);
        if (map) {
            if (!map.locations) map.locations = [];
            map.locations.push(location);
            this.save();
            return true;
        }
        return false;
    }

    updateLocation(mapId, locIndex, updates) {
        const map = this.getMap(mapId);
        if (map && map.locations[locIndex]) {
            map.locations[locIndex] = { ...map.locations[locIndex], ...updates };
            this.save();
            return true;
        }
        return false;
    }

    deleteLocation(mapId, locIndex) {
        const map = this.getMap(mapId);
        if (map && map.locations[locIndex]) {
            map.locations.splice(locIndex, 1);
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Custom Configuration (Categories and Types)
     */

    getCategories() {
        if (!project.mapCategories) project.mapCategories = [...MapModel.DEFAULT_CATEGORIES];
        return project.mapCategories;
    }

    getTypes() {
        if (!project.mapTypes) project.mapTypes = [...MapModel.DEFAULT_TYPES];
        return project.mapTypes;
    }

    getType(typeId) {
        return this.getTypes().find(t => t.id === typeId);
    }

    addCategory(name) {
        const categories = this.getCategories();
        const newCat = { id: 'cat_' + Date.now(), name };
        categories.push(newCat);
        this.save();
        return newCat;
    }

    addType(categoryId, name, icon = 'map-pin', color = '#d4af37') {
        const types = this.getTypes();
        const newType = { id: 'type_' + Date.now(), categoryId, name, icon, color };
        types.push(newType);
        this.save();
        return newType;
    }

    updateType(typeId, updates) {
        const types = this.getTypes();
        const index = types.findIndex(t => t.id === typeId);
        if (index !== -1) {
            types[index] = { ...types[index], ...updates };
            this.save();
            return true;
        }
        return false;
    }

    deleteType(typeId) {
        const types = this.getTypes();
        const index = types.findIndex(t => t.id === typeId);
        if (index !== -1) {
            types.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
}

const mapRepository = new MapRepository();
window.mapRepository = mapRepository;
