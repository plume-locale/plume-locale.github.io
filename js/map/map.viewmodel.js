
/**
 * ViewModel for Map module.
 */
class MapViewModel {
    constructor(repository) {
        this.repository = repository;
        this.activeMapId = null;
    }

    /**
     * Map Lifecycle
     */
    setActiveMap(mapId) {
        this.activeMapId = mapId;
    }

    getActiveMap() {
        const maps = this.repository.getMaps();
        if (maps.length === 0) return null;
        if (!this.activeMapId) this.activeMapId = maps[0].id;
        return this.repository.getMap(this.activeMapId) || maps[0];
    }

    getAllMaps() {
        return this.repository.getMaps();
    }

    /**
     * Location Management
     */
    moveLocation(index, x, y) {
        const mapId = this.activeMapId;
        if (!mapId) return false;

        // Clamp values to 0-100
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        return this.repository.updateLocation(mapId, index, { x: clampedX, y: clampedY });
    }

    saveLocation(data, index = null) {
        if (!this.activeMapId) return false;

        if (index !== null) {
            this.repository.updateLocation(this.activeMapId, index, data);
            if (typeof showNotification === 'function') showNotification(Localization.t('map.notify.location_updated', data.name));
        } else {
            this.repository.addLocation(this.activeMapId, data);
            if (typeof showNotification === 'function') showNotification(Localization.t('map.notify.location_added', data.name));
        }
        return true;
    }

    deleteLocation(index) {
        if (!this.activeMapId) return false;
        const map = this.repository.getMap(this.activeMapId);
        const loc = map.locations[index];

        if (confirm(Localization.t('map.confirm.delete_location', loc.name))) {
            this.repository.deleteLocation(this.activeMapId, index);
            return true;
        }
        return false;
    }

    /**
     * Type & Category Management
     */
    getConfig() {
        return {
            categories: this.repository.getCategories(),
            types: this.repository.getTypes()
        };
    }

    addCustomType(categoryId, name, icon, color) {
        this.repository.addType(categoryId, name, icon, color);
        if (typeof showNotification === 'function') showNotification(Localization.t('map.notify.type_created', name));
        return true;
    }

    updateCustomType(typeId, updates) {
        this.repository.updateType(typeId, updates);
        return true;
    }

    deleteCustomType(typeId) {
        if (confirm(Localization.t('map.confirm.delete_type'))) {
            // Optional: iterate all maps and locations to reset typeId if it matches typeId
            this.repository.deleteType(typeId);
            return true;
        }
        return false;
    }

    addCustomCategory(name) {
        this.repository.addCategory(name);
        return true;
    }

    /**
     * Available Icons for selection
     */
    getAvailableIcons() {
        return [
            'map-pin', 'flag', 'skull', 'search', 'eye-off', 'shield', 'alert-triangle',
            'home', 'building', 'factory', 'hospital', 'shopping-bag', 'tent',
            'castle', 'church', 'tower-control', 'landmark', 'history',
            'mountain', 'trees', 'droplet', 'waves', 'thermometer-snowflake',
            'sun', 'moon', 'star', 'target', 'camera', 'gift', 'coffee', 'utensils'
        ];
    }

    /**
     * Legacy & Image helpers
     */
    async uploadMapImage() {
        const currentMap = this.getActiveMap();
        if (!currentMap) return false;
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.repository.updateMap(currentMap.id, { image: event.target.result });
                        resolve(true);
                    };
                    reader.readAsDataURL(file);
                } else { resolve(false); }
            };
            input.click();
        });
    }

    createNewMap() {
        const name = prompt(Localization.t('map.prompt.map_name'), Localization.t('map.prompt.new_map'));
        if (name) {
            const map = this.repository.addMap(name);
            this.activeMapId = map.id;
            return true;
        }
        return false;
    }

    renameActiveMap() {
        const currentMap = this.getActiveMap();
        if (!currentMap) return;
        const newName = prompt(Localization.t('map.prompt.rename'), currentMap.name);
        if (newName && newName !== currentMap.name) {
            this.repository.updateMap(currentMap.id, { name: newName });
            return true;
        }
        return false;
    }

    deleteActiveMap() {
        const currentMap = this.getActiveMap();
        if (!currentMap) return false;
        if (confirm(Localization.t('map.confirm.delete_map', currentMap.name))) {
            this.repository.deleteMap(currentMap.id);
            this.activeMapId = null;
            return true;
        }
        return false;
    }
}

const mapViewModel = new MapViewModel(mapRepository);
