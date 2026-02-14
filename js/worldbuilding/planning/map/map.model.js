
/**
 * Represents a category for map types (e.g., "Fantasy", "Police").
 */
class MapCategory {
    constructor(id = '', name = '') {
        this.id = id;
        this.name = name;
    }
}

/**
 * Represents a specific type of location (e.g., "Crime Scene", "Castle").
 */
class MapType {
    constructor(id = '', categoryId = '', name = '', icon = 'map-pin', color = '#d4af37') {
        this.id = id;
        this.categoryId = categoryId;
        this.name = name;
        this.icon = icon;
        this.color = color;
    }
}

/**
 * Represents a location on a specific map.
 */
class MapLocation {
    constructor(name = '', x = 0, y = 0, description = '', typeId = 'default') {
        this.name = name;
        this.x = x; // Percentage 0-100
        this.y = y; // Percentage 0-100
        this.description = description;
        this.typeId = typeId; // Reference to MapType.id
    }
}

/**
 * Represents a specific map (e.g., a house plan, a city, or a continent).
 */
class WorldMap {
    constructor(id = Date.now(), name = 'Nouvelle Carte', image = null, locations = []) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.locations = locations;
    }
}

/**
 * Model for the Map module managing multiple maps and custom types.
 */
class MapModel {
    constructor() {
        this.maps = [];
        this.categories = [];
        this.types = [];
    }

    static DEFAULT_CATEGORIES = [
        { id: 'cat_gen', name: 'Générique' },
        { id: 'cat_polar', name: 'Enquête / Polar / Thriller' },
        { id: 'cat_fantasy', name: 'Médiéval / Fantasy' },
        { id: 'cat_urban', name: 'Urbain / Moderne' },
        { id: 'cat_nature', name: 'Nature' }
    ];

    static DEFAULT_TYPES = [
        { id: 'default', categoryId: 'cat_gen', name: 'Point d\'intérêt', icon: 'map-pin', color: '#d4af37' },
        { id: 'marker', categoryId: 'cat_gen', name: 'Repère / Drapeau', icon: 'flag', color: '#3498db' },
        { id: 'crime-scene', categoryId: 'cat_polar', name: 'Scène de crime', icon: 'skull', color: '#e74c3c' },
        { id: 'clue', categoryId: 'cat_polar', name: 'Indice / Preuve', icon: 'search', color: '#f1c40f' },
        { id: 'hideout', categoryId: 'cat_polar', name: 'Planque', icon: 'eye-off', color: '#f39c12' },
        { id: 'police', categoryId: 'cat_polar', name: 'Commissariat', icon: 'shield', color: '#2980b9' },
        { id: 'castle', categoryId: 'cat_fantasy', name: 'Château', icon: 'castle', color: '#8e44ad' },
        { id: 'village', categoryId: 'cat_fantasy', name: 'Village / Ville', icon: 'tent', color: '#27ae60' },
        { id: 'mountain', categoryId: 'cat_nature', name: 'Montagne', icon: 'mountain', color: '#34495e' }
    ];

    static fromProject(project) {
        const model = new MapModel();

        // Ensure map config structures exist
        if (!project.mapCategories) project.mapCategories = [...MapModel.DEFAULT_CATEGORIES];
        if (!project.mapTypes) project.mapTypes = [...MapModel.DEFAULT_TYPES];

        const maps = project.maps || [];

        model.maps = maps.map(m =>
            new WorldMap(m.id, m.name, m.image, (m.locations || []).map(loc =>
                new MapLocation(loc.name, loc.x, loc.y, loc.description, loc.typeId || loc.type)
            ))
        );

        model.categories = project.mapCategories;
        model.types = project.mapTypes;

        return model;
    }
}
