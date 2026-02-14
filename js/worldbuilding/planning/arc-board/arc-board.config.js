// ============================================
// ARC BOARD - Configuration & Constants
// ============================================

/**
 * Génère un ID unique avec un préfixe
 * @param {string} prefix - Préfixe de l'ID (ex: 'arc', 'item', 'card', 'conn')
 * @returns {string} ID unique
 */
function generateUniqueId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const ArcBoardConfig = {
    canvas: {
        minZoom: 0.25,
        maxZoom: 2,
        zoomStep: 0.1,
        width: 3000,
        height: 2000
    },
    grid: {
        size: 24,
        snapEnabled: true
    },
    column: {
        defaultWidth: 280,
        minWidth: 200,
        maxWidth: 500
    },
    item: {
        noteWidth: 250,
        imageWidth: 300,
        linkWidth: 280,
        todoWidth: 260,
        commentWidth: 220
    }
};

// Catégories d'arcs prédéfinies
const ArcCategories = Object.freeze({
    character: { icon: 'user', get label() { return Localization.t('arc.category.character'); }, color: '#3498db' },
    plot: { icon: 'book-open', get label() { return Localization.t('arc.category.plot'); }, color: '#e74c3c' },
    theme: { icon: 'message-circle', get label() { return Localization.t('arc.category.theme'); }, color: '#9b59b6' },
    subplot: { icon: 'file-text', get label() { return Localization.t('arc.category.subplot'); }, color: '#16a085' },
    relationship: { icon: 'heart', get label() { return Localization.t('arc.category.relationship'); }, color: '#e91e63' },
    mystery: { icon: 'search', get label() { return Localization.t('arc.category.mystery'); }, color: '#607d8b' },
    conflict: { icon: 'swords', get label() { return Localization.t('arc.category.conflict'); }, color: '#ff5722' },
    growth: { icon: 'sprout', get label() { return Localization.t('arc.category.growth'); }, color: '#4caf50' },
    redemption: { icon: 'sparkles', get label() { return Localization.t('arc.category.redemption'); }, color: '#ffd700' },
    vengeance: { icon: 'flame', get label() { return Localization.t('arc.category.vengeance'); }, color: '#d32f2f' },
    quest: { icon: 'map', get label() { return Localization.t('arc.category.quest'); }, color: '#ff9800' },
    discovery: { icon: 'telescope', get label() { return Localization.t('arc.category.discovery'); }, color: '#00bcd4' },
    transformation: { icon: 'butterfly', get label() { return Localization.t('arc.category.transformation'); }, color: '#ab47bc' },
    political: { icon: 'crown', get label() { return Localization.t('arc.category.political'); }, color: '#795548' },
    philosophical: { icon: 'brain', get label() { return Localization.t('arc.category.philosophical'); }, color: '#546e7a' },
    comedic: { icon: 'smile', get label() { return Localization.t('arc.category.comedic'); }, color: '#ffeb3b' },
    tragic: { icon: 'frown', get label() { return Localization.t('arc.category.tragic'); }, color: '#424242' },
    action: { icon: 'zap', get label() { return Localization.t('arc.category.action'); }, color: '#ff6f00' },
    worldbuilding: { icon: 'globe', get label() { return Localization.t('arc.category.worldbuilding'); }, color: '#1976d2' },
    linked_characters: { icon: 'users', get label() { return Localization.t('arc.category.linked_characters'); }, color: '#8e24aa' }
});

// Types de cartes supportés
const CardTypes = Object.freeze({
    note: { get label() { return Localization.t('arc.type.note'); }, icon: 'file-text' },
    image: { get label() { return Localization.t('arc.type.image'); }, icon: 'image' },
    link: { get label() { return Localization.t('arc.type.link'); }, icon: 'link' },
    todo: { get label() { return Localization.t('arc.type.todo'); }, icon: 'check-square' },
    comment: { get label() { return Localization.t('arc.type.comment'); }, icon: 'message-square' },
    table: { get label() { return Localization.t('arc.type.table'); }, icon: 'table' },
    audio: { get label() { return Localization.t('arc.type.audio'); }, icon: 'music' },
    scene: { get label() { return Localization.t('arc.type.scene'); }, icon: 'book-open' }
});

// Types d'items sur le board
const BoardItemTypes = Object.freeze({
    COLUMN: 'column',
    NOTE: 'note',
    IMAGE: 'image',
    LINK: 'link',
    TODO: 'todo',
    COMMENT: 'comment',
    TABLE: 'table',
    SCENE: 'scene'
});

// Outils disponibles
const ToolTypes = Object.freeze({
    SELECT: 'select',
    PAN: 'pan',
    CONNECT: 'connect'
});

// Types de drag
const DragTypes = Object.freeze({
    NONE: null,
    CARD: 'card',
    FLOATING: 'floating',
    COLUMN: 'column',
    UNASSIGNED: 'unassigned',
    TOOLBAR: 'toolbar'
});

// Types d'items disponibles pour création (toolbar et menu)
const CreatableItemTypes = Object.freeze({
    note: { get label() { return Localization.t('arc.type.note'); }, icon: 'file-text', canBeCard: true },
    column: { get label() { return Localization.t('arc.type.column'); }, icon: 'columns-3', canBeCard: false },
    link: { get label() { return Localization.t('arc.type.link'); }, icon: 'link', canBeCard: true },
    todo: { get label() { return Localization.t('arc.type.todo'); }, icon: 'check-square', canBeCard: true },
    comment: { get label() { return Localization.t('arc.type.comment'); }, icon: 'message-square', canBeCard: true },
    table: { get label() { return Localization.t('arc.type.table'); }, icon: 'table', canBeCard: true },
    image: { get label() { return Localization.t('arc.type.image'); }, icon: 'image', canBeCard: true }
});
