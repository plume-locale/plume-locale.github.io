// ============================================
// ARC BOARD - Module Index
// ============================================
// Ordre de chargement des fichiers:
// 1. arc-board.config.js   - Configuration et constantes
// 2. arc-board.models.js   - Factories pour les modèles de données
// 3. arc-board.repository.js - Opérations CRUD
// 4. arc-board.viewmodel.js  - État et logique de coordination
// 5. arc-board.services.js   - Services (DragDrop, Connection, etc.)
// 6. arc-board.views.js      - Rendu HTML
// 7. arc-board.handlers.js   - Gestionnaires d'événements
// 8. arc-board.main.js       - Point d'entrée et API publique
// ============================================

// Note: Pour un projet sans bundler (Webpack, Rollup, etc.),
// les fichiers doivent être inclus manuellement dans le HTML
// dans l'ordre ci-dessus.

// Si vous utilisez un bundler:
// import './arc-board.config.js';
// import './arc-board.models.js';
// import './arc-board.repository.js';
// import './arc-board.viewmodel.js';
// import './arc-board.services.js';
// import './arc-board.views.js';
// import './arc-board.handlers.js';
// import './arc-board.main.js';

console.log('Arc Board MVVM system loaded');
