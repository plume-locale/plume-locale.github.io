// ==========================================
// SPLIT VIEW SYSTEM - Model
// ==========================================

const viewLabels = {
    get editor() { return Localization.t('nav.structure'); },
    get characters() { return Localization.t('nav.characters'); },
    get world() { return Localization.t('nav.world'); },
    get notes() { return Localization.t('nav.notes'); },
    get codex() { return Localization.t('nav.codex'); },
    get stats() { return Localization.t('nav.stats'); },
    get analysis() { return Localization.t('nav.analysis'); },
    get versions() { return Localization.t('nav.snapshots'); },
    get todos() { return Localization.t('tool.todos'); },
    get corkboard() { return Localization.t('nav.corkboard'); },
    get mindmap() { return Localization.t('nav.mindmap'); },
    get plot() { return Localization.t('nav.plot'); },
    get plotgrid() { return Localization.t('nav.plotgrid'); },
    get relations() { return Localization.t('nav.relations'); },
    get map() { return Localization.t('nav.map'); },
    get timelineviz() { return Localization.t('nav.timeline'); },
    get investigation() { return Localization.t('nav.investigation'); },
    get globalnotes() { return Localization.t('nav.globalnotes'); },
    get front_matter() { return Localization.t('nav.front_matter'); },
    get changelog() { return Localization.t('nav.changelog') || 'Changelog'; }
};

const viewIcons = {
    'editor': 'pen-line',
    'characters': 'users',
    'world': 'globe',
    'notes': 'sticky-note',
    'codex': 'book-open',
    'stats': 'bar-chart-3',
    'analysis': 'scan-search',
    'versions': 'history',
    'todos': 'check-square',
    'corkboard': 'layout-grid',
    'mindmap': 'git-branch',
    'plot': 'trending-up',
    'plotgrid': 'grid-3x3',
    'relations': 'link',
    'map': 'map',
    'timelineviz': 'clock',
    'investigation': 'search',
    'globalnotes': 'layout',
    'front_matter': 'book-open-check',
    'changelog': 'scroll'
};
