/**
 * [MVVM : Constants]
 * Configuration et types pour le Thriller Board.
 */

// ============================================
// CONFIGURATION
// ============================================

const THRILLER_BOARD_CONFIG = {
    minZoom: 0.25,
    maxZoom: 2,
    zoomStep: 0.1,
    gridSize: 24,
    defaultColumnWidth: 280,
    minColumnWidth: 200,
    maxColumnWidth: 500,
    canvasWidth: 3000,
    canvasHeight: 2000,
    snapToGrid: true,
    // Grid view configuration
    swimlaneHeight: 200,
    minSwimlaneHeight: 120,
    maxSwimlaneHeight: 400,
    cardMinWidth: 240,
    cardMaxWidth: 360,
    cardDefaultWidth: 280
};

// ============================================
// THRILLER ELEMENT TYPES
// ============================================

const THRILLER_TYPES = {
    alibi: {
        label: 'Alibi',
        icon: 'shield-check',
        color: '#27ae60',
        description: 'Alibi de personnage pour un événement'
    },
    backstory: {
        label: 'Événement passé',
        icon: 'history',
        color: '#8e44ad',
        description: 'Informations de contexte du personnage'
    },
    clue: {
        label: 'Indice',
        icon: 'search',
        color: '#e67e22',
        description: 'Preuve ou indice dans le mystère'
    },
    knowledge_state: {
        label: 'État de connaissance',
        icon: 'brain',
        color: '#3498db',
        description: 'Ce qu\'un personnage sait'
    },
    location: {
        label: 'Lieu',
        icon: 'map-pin',
        color: '#16a085',
        description: 'Lieu important dans l\'histoire'
    },
    motive_means_opportunity: {
        label: 'Analyse de suspect',
        icon: 'target',
        color: '#e74c3c',
        description: 'Potentiel du suspect à commettre le crime'
    },
    question: {
        label: 'Question',
        icon: 'help-circle',
        color: '#f39c12',
        description: 'Question mystérieuse à résoudre'
    },
    red_herring: {
        label: 'Fausse piste',
        icon: 'fish',
        color: '#9b59b6',
        description: 'Indice trompeur ou fausse piste'
    },
    reversal: {
        label: 'Révélation',
        icon: 'rotate-ccw',
        color: '#d35400',
        description: 'Rebondissement ou révélation'
    },
    secret: {
        label: 'Secret',
        icon: 'lock',
        color: '#c0392b',
        description: 'Information cachée'
    }
};

// ============================================
// CARD TYPES & STATUS
// ============================================

const THRILLER_CARD_TYPES = {
    note: { label: 'Note', icon: 'file-text' },
    image: { label: 'Image', icon: 'image' },
    link: { label: 'Lien', icon: 'link' },
    todo: { label: 'Tâches', icon: 'check-square' },
    comment: { label: 'Commentaire', icon: 'message-square' },
    table: { label: 'Tableau', icon: 'table' },
    audio: { label: 'Audio', icon: 'music' },
    divider: { label: 'Séparateur', icon: 'minus' }
};

const THRILLER_CARD_STATUS = {
    pending: { label: 'En attente', color: '#95a5a6', icon: 'clock' },
    active: { label: 'Actif', color: '#3498db', icon: 'activity' },
    resolved: { label: 'Résolu', color: '#27ae60', icon: 'check-circle' },
    contradicted: { label: 'Contredit', color: '#e74c3c', icon: 'x-circle' },
    partial: { label: 'Partiel', color: '#f39c12', icon: 'alert-circle' },
    hidden: { label: 'Caché', color: '#34495e', icon: 'eye-off' }
};

// ============================================
// SWIMLANE & COLUMN TYPES
// ============================================

const SWIMLANE_ROW_TYPES = {
    character: { label: 'Personnages', icon: 'user', color: '#3498db' },
    location: { label: 'Lieux', icon: 'map-pin', color: '#16a085' },
    custom: { label: 'Personnalisé', icon: 'tag', color: '#95a5a6' }
};

const COLUMN_MODE_TYPES = {
    free: { label: 'Colonnes libres', icon: 'columns' },
    narrative: { label: 'Structure narrative', icon: 'book-open' }
};

// ============================================
// PROPERTY VALUE TRANSLATIONS
// ============================================

const THRILLER_VALUE_TRANSLATIONS = {
    // Clue types
    physical: 'Physique',
    testimonial: 'Témoignage',
    circumstantial: 'Circonstanciel',
    digital: 'Numérique',
    forensic: 'Médico-légal',
    documentary: 'Documentaire',
    // Importance
    minor: 'Mineur',
    major: 'Majeur',
    critical: 'Critique',
    // Motive strength
    none: 'Aucun',
    weak: 'Faible',
    moderate: 'Modéré',
    strong: 'Fort',
    compelling: 'Convaincant',
    // Guilt
    innocent: 'Innocent',
    guilty: 'Coupable',
    accomplice: 'Complice',
    unknowing_participant: 'Involontaire',
    // Secret types
    relationship: 'Relation',
    identity: 'Identité',
    crime: 'Crime',
    past: 'Passé',
    ability: 'Capacité',
    // Secret status
    hidden: 'Caché',
    partially_revealed: 'Partiellement révélé',
    fully_revealed: 'Révélé',
    // Question types
    whodunit: 'Qui l\'a fait',
    how: 'Comment',
    why: 'Pourquoi',
    when: 'Quand',
    where: 'Où',
    what: 'Quoi',
    // Question status
    open: 'Ouvert',
    answered: 'Répondu',
    partially_answered: 'Partiellement répondu',
    // Reversal types
    motive: 'Mobile',
    victim: 'Victime',
    ally_is_enemy: 'Allié = Ennemi',
    enemy_is_ally: 'Ennemi = Allié',
    timeline: 'Chronologie',
    method: 'Méthode',
    location: 'Lieu',
    // Reversal impact
    twist: 'Rebondissement',
    revelation: 'Révélation',
    game_changer: 'Changement majeur',
    // Backstory types
    other: 'Autre',
    original_crime: 'Crime d\'origine',
    trauma: 'Traumatisme',
    betrayal: 'Trahison',
    relationship_start: 'Début relation',
    death: 'Décès',
    secret_formed: 'Secret formé'
};

// ============================================
// CARD PROPERTY DEFINITIONS
// ============================================

const THRILLER_CARD_PROPERTIES = {
    alibi: [
        { key: 'description', label: 'Description', type: 'description', showEmpty: false },
        { key: 'for_event', label: 'Événement', type: 'text', showEmpty: false },
        { key: 'witnesses', label: 'Témoin(s)', type: 'witnesses', showEmpty: false },
        { key: 'verified_scene', label: 'Vérifié dans', type: 'scene', showEmpty: false },
        { key: 'broken_scene', label: 'Brisé dans', type: 'scene', showEmpty: false }
    ],
    clue: [
        { key: 'clue_type', label: 'Type', type: 'select', showEmpty: false },
        { key: 'significance', label: 'Importance', type: 'select', showEmpty: false },
        { key: 'what_it_suggests', label: 'Ce que ça suggère', type: 'text', showEmpty: false },
        { key: 'is_genuine', label: 'Preuve authentique', type: 'boolean', showEmpty: true },
        { key: 'points_to_characters', label: 'Pointe vers', type: 'characters', showEmpty: false }
    ],
    motive_means_opportunity: [
        { key: 'character_name', label: 'Suspect', type: 'character', showEmpty: true },
        { key: 'for_crime', label: 'Pour crime', type: 'text', showEmpty: false },
        { key: 'actual_guilt', label: 'Culpabilité', type: 'select', showEmpty: false },
        { key: 'motive_strength', label: 'Mobile', type: 'select', showEmpty: false },
        { key: 'has_means', label: 'A les moyens', type: 'boolean', showEmpty: true },
        { key: 'has_opportunity', label: 'A l\'opportunité', type: 'boolean', showEmpty: true }
    ],
    red_herring: [
        { key: 'what_it_suggests', label: 'Ce que ça suggère', type: 'text', showEmpty: false },
        { key: 'misdirects_to_name', label: 'Dirige vers', type: 'character', showEmpty: false },
        { key: 'misleading_clues', label: 'Indices trompeurs', type: 'array', showEmpty: false },
        { key: 'intended_reader_impact', label: 'Impact lecteur', type: 'text', showEmpty: false }
    ],
    secret: [
        { key: 'secret_type', label: 'Type', type: 'select', showEmpty: false },
        { key: 'importance', label: 'Importance', type: 'select', showEmpty: false },
        { key: 'holder_name', label: 'Détenu par', type: 'character', showEmpty: false },
        { key: 'about_name', label: 'Concernant', type: 'character', showEmpty: false },
        { key: 'current_status', label: 'Statut', type: 'select', showEmpty: false }
    ],
    question: [
        { key: 'question', label: 'Question', type: 'text', showEmpty: false },
        { key: 'question_type', label: 'Type', type: 'select', showEmpty: false },
        { key: 'importance', label: 'Importance', type: 'select', showEmpty: false },
        { key: 'status', label: 'Statut', type: 'select', showEmpty: false },
        { key: 'answer', label: 'Réponse', type: 'text', showEmpty: false }
    ],
    knowledge_state: [
        { key: 'character_name', label: 'Personnage', type: 'character', showEmpty: true },
        { key: 'about', label: 'Concernant', type: 'text', showEmpty: false },
        { key: 'details', label: 'Détails', type: 'text', showEmpty: false }
    ],
    reversal: [
        { key: 'reversal_type', label: 'Type', type: 'select', showEmpty: false },
        { key: 'setup_belief', label: 'Croyance établie', type: 'text', showEmpty: false },
        { key: 'actual_truth', label: 'Vérité réelle', type: 'text', showEmpty: false },
        { key: 'impact', label: 'Impact', type: 'select', showEmpty: false }
    ],
    backstory: [
        { key: 'when_it_happened', label: 'Quand', type: 'text', showEmpty: false },
        { key: 'event_type', label: 'Type', type: 'select', showEmpty: false },
        { key: 'importance', label: 'Importance', type: 'select', showEmpty: false },
        { key: 'characters_involved', label: 'Personnages', type: 'characters', showEmpty: false }
    ],
    location: [
        { key: 'name', label: 'Nom', type: 'text', showEmpty: true },
        { key: 'coordinates', label: 'Coordonnées', type: 'text', showEmpty: false },
        { key: 'description', label: 'Description', type: 'text', showEmpty: false }
    ]
};
