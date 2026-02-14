# Corkboard Module - Architecture MVVM & CRUD

## Vue d'ensemble

Le module Corkboard a été refactorisé selon l'architecture **MVVM (Model-View-ViewModel)** avec des opérations **CRUD (Create, Read, Update, Delete)** complètes. Cette refactorisation améliore la maintenabilité, la testabilité et la séparation des responsabilités.

## Structure des fichiers

```
js-refactor/corkboard/
├── corkboard.model.js       # Modèle de données et règles métier
├── corkboard.repository.js  # Accès aux données et opérations CRUD
├── corkboard.viewmodel.js   # Logique métier et coordination
├── corkboard.view.js        # Rendu HTML et présentation
├── corkboard.handlers.js    # Gestionnaires d'événements et drag & drop
├── corkboard.main.js        # Point d'entrée et compatibilité API
└── README.md                # Cette documentation
```

## Architecture MVVM

### 1. Model (`corkboard.model.js`)

**Responsabilité**: Définit les structures de données, constantes et règles de validation.

**Contenu**:
- `CorkBoardModel.KANBAN_STATUSES`: Statuts disponibles pour la vue Kanban
- `CorkBoardModel.CORK_COLORS`: Couleurs disponibles pour les cartes
- `CorkBoardModel.DISPLAY_MODES`: Modes d'affichage (structured/kanban)
- `CorkBoardModel.FILTER_TYPES`: Types de filtres (all/act/chapter)
- Fonctions de création et validation des données

**Exemple**:
```javascript
const filter = CorkBoardModel.createFilter('act', 123, null, 'structured');
const isValid = CorkBoardModel.validateFilter(filter);
```

### 2. Repository (`corkboard.repository.js`)

**Responsabilité**: Gère l'accès aux données et implémente les opérations CRUD.

**Opérations CRUD**:

#### CREATE
- `createAct(title, project)`: Crée un nouvel acte
- `createChapter(actId, title, project)`: Crée un nouveau chapitre
- `createScene(actId, chapterId, title, project)`: Crée une nouvelle scène

#### READ
- `getFilteredScenes(filter, project)`: Récupère les scènes filtrées
- `getActById(actId, project)`: Récupère un acte par ID
- `getChapterById(chapterId, act)`: Récupère un chapitre par ID
- `getSceneById(sceneId, chapter)`: Récupère une scène par ID
- `getScenesByStatus(scenes, status)`: Filtre les scènes par statut

#### UPDATE
- `updateSceneSynopsis(actId, chapterId, sceneId, synopsis, project)`: Met à jour le synopsis
- `updateSceneColor(actId, chapterId, sceneId, color, project)`: Met à jour la couleur
- `reorderScenes(actId, chapterId, fromIndex, toIndex, project)`: Réorganise les scènes

#### DELETE
- Non implémenté (utiliser les fonctions existantes du projet)

**Exemple**:
```javascript
const scenes = CorkBoardRepository.getFilteredScenes(filter, project);
const success = CorkBoardRepository.updateSceneSynopsis(1, 2, 3, "Nouveau synopsis", project);
```

### 3. ViewModel (`corkboard.viewmodel.js`)

**Responsabilité**: Gère la logique métier, l'état de l'application et coordonne Model/Repository/View.

**Fonctionnalités principales**:
- Gestion de l'état du filtre actuel
- Coordination des opérations CRUD avec sauvegarde automatique
- Validation et gestion des erreurs
- Interface entre les handlers et le repository

**Exemple**:
```javascript
CorkBoardViewModel.init();
CorkBoardViewModel.updateActFilter(123);
const result = CorkBoardViewModel.createScene(1, 2, "Nouvelle scène");
if (result.success) {
    console.log(result.message); // "✓ Scène 'Nouvelle scène' créée"
}
```

### 4. View (`corkboard.view.js`)

**Responsabilité**: Génère le HTML et gère l'affichage.

**Fonctions de rendu**:
- `renderSidebar()`: Panneau latéral avec filtres
- `renderFullView()`: Vue complète (structured ou kanban)
- `renderStructuredView()`: Vue organisée par actes/chapitres
- `renderKanbanView()`: Vue organisée par statuts
- `renderSceneCard(scene, viewType)`: Carte individuelle de scène
- `showNotification(message)`: Notification temporaire

**Exemple**:
```javascript
CorkBoardView.renderSidebar();
const html = CorkBoardView.renderFullView();
CorkBoardView.showNotification("✓ Opération réussie");
```

### 5. Handlers (`corkboard.handlers.js`)

**Responsabilité**: Gère les événements utilisateur et le drag & drop.

**Gestionnaires d'événements**:
- `onActFilterChange(actId)`: Changement de filtre acte
- `onChapterFilterChange(chapterId)`: Changement de filtre chapitre
- `onOpenFullView()`: Ouverture de la vue complète
- `onSwitchMode(mode)`: Changement de mode (structured/kanban)
- `onCreateAct()`: Création d'un acte
- `onCreateChapter(actId)`: Création d'un chapitre
- `onCreateScene(actId, chapterId)`: Création d'une scène
- `onUpdateSynopsis(...)`: Mise à jour du synopsis
- `onOpenScene(...)`: Ouverture d'une scène dans l'éditeur

**Drag & Drop**:
- `setupDragAndDrop()`: Initialise le drag & drop
- `handleDragStart(e)`: Début du glisser
- `handleDragEnd(e)`: Fin du glisser
- `handleDragOver(e)`: Survol pendant le glisser
- `handleDrop(e)`: Dépôt de la carte

**Exemple**:
```javascript
CorkBoardHandlers.onOpenFullView();
CorkBoardHandlers.setupDragAndDrop();
```

### 6. Main (`corkboard.main.js`)

**Responsabilité**: Point d'entrée et compatibilité avec l'ancienne API.

**Fonctions de compatibilité** (toutes marquées `@deprecated`):
- `renderCorkBoard()` → `CorkBoardView.renderSidebar()`
- `openCorkBoardView()` → `CorkBoardHandlers.onOpenFullView()`
- `updateSceneSynopsis(...)` → `CorkBoardHandlers.onUpdateSynopsis(...)`
- etc.

Ces fonctions maintiennent la compatibilité avec le code existant tout en utilisant la nouvelle architecture.

## Flux de données

```
User Action (HTML)
    ↓
Handlers (corkboard.handlers.js)
    ↓
ViewModel (corkboard.viewmodel.js)
    ↓
Repository (corkboard.repository.js)
    ↓
Model (corkboard.model.js) + Project Data
    ↓
saveProject() + renderActsList()
    ↓
View (corkboard.view.js)
    ↓
Updated HTML
```

## Exemples d'utilisation

### Initialisation
```javascript
// Automatique au chargement de la page
// Ou manuellement:
initCorkBoard();
```

### Affichage du panneau latéral
```javascript
CorkBoardView.renderSidebar();
```

### Ouverture de la vue complète
```javascript
CorkBoardHandlers.onOpenFullView();
```

### Changement de filtre
```javascript
CorkBoardViewModel.updateActFilter(123);
CorkBoardViewModel.updateChapterFilter(456);
```

### Création d'éléments
```javascript
const actResult = CorkBoardViewModel.createAct("Acte 3");
const chapterResult = CorkBoardViewModel.createChapter(123, "Chapitre 5");
const sceneResult = CorkBoardViewModel.createScene(123, 456, "Scène 10");
```

### Mise à jour
```javascript
CorkBoardViewModel.updateSceneSynopsis(1, 2, 3, "Nouveau synopsis");
CorkBoardViewModel.updateSceneColor(1, 2, 3, "blue");
```

### Drag & Drop
```javascript
// Automatiquement configuré lors de l'ouverture de la vue
CorkBoardHandlers.setupDragAndDrop();
```

## Avantages de la refactorisation

### 1. Séparation des responsabilités
- **Model**: Données et règles métier
- **Repository**: Accès aux données
- **ViewModel**: Logique métier
- **View**: Présentation
- **Handlers**: Événements utilisateur

### 2. Testabilité
Chaque composant peut être testé indépendamment:
```javascript
// Test du Model
const filter = CorkBoardModel.createFilter('act', 123);
assert(CorkBoardModel.validateFilter(filter) === true);

// Test du Repository
const scenes = CorkBoardRepository.getFilteredScenes(filter, mockProject);
assert(scenes.length > 0);
```

### 3. Maintenabilité
- Code organisé en modules logiques
- Fonctions courtes et ciblées
- Documentation JSDoc complète
- Nommage cohérent et explicite

### 4. Réutilisabilité
Les composants peuvent être réutilisés dans d'autres contextes:
```javascript
// Utiliser le Repository ailleurs
const allScenes = CorkBoardRepository.getFilteredScenes(
    CorkBoardModel.createFilter('all'), 
    project
);
```

### 5. Évolutivité
Facile d'ajouter de nouvelles fonctionnalités:
- Nouveau mode d'affichage → Ajouter dans Model et View
- Nouveau filtre → Ajouter dans Model et Repository
- Nouvelle action → Ajouter dans Handlers et ViewModel

## Migration depuis l'ancienne API

Le fichier `corkboard.main.js` fournit une compatibilité complète avec l'ancienne API. Aucune modification du code existant n'est nécessaire.

### Ancienne API (toujours fonctionnelle)
```javascript
renderCorkBoard();
openCorkBoardView();
updateSceneSynopsis(1, 2, 3, "Synopsis");
```

### Nouvelle API (recommandée)
```javascript
CorkBoardView.renderSidebar();
CorkBoardHandlers.onOpenFullView();
CorkBoardHandlers.onUpdateSynopsis(1, 2, 3, "Synopsis");
```

## Intégration dans le build

Les fichiers sont chargés dans l'ordre suivant dans `build.test.py` et `build.light.py`:

```python
'js-refactor/corkboard/corkboard.model.js',
'js-refactor/corkboard/corkboard.repository.js',
'js-refactor/corkboard/corkboard.viewmodel.js',
'js-refactor/corkboard/corkboard.view.js',
'js-refactor/corkboard/corkboard.handlers.js',
'js-refactor/corkboard/corkboard.main.js',
```

Cet ordre garantit que les dépendances sont chargées correctement.

## Dépendances

Le module Corkboard dépend de:
- `project` (variable globale contenant les données du projet)
- `saveProject()` (fonction de sauvegarde)
- `renderActsList()` (fonction de rendu de la sidebar)
- `switchView()` (fonction de changement de vue)
- `openScene()` (fonction d'ouverture de scène)
- `lucide` (bibliothèque d'icônes, optionnelle)

## Notes techniques

### Performance
- Les scènes sont filtrées à la demande (pas de cache)
- Le drag & drop est optimisé avec des event listeners ciblés
- Le rendu HTML utilise des template strings pour la performance

### Sécurité
- Validation des entrées utilisateur dans le Model
- Vérification des IDs avant les opérations
- Gestion des erreurs avec messages explicites

### Accessibilité
- Utilisation de boutons sémantiques
- Labels explicites pour les contrôles
- Support du clavier (via les boutons)

## Améliorations futures possibles

1. **Cache intelligent**: Mettre en cache les scènes filtrées
2. **Undo/Redo**: Intégrer avec le système d'undo/redo existant
3. **Recherche**: Ajouter une recherche de scènes
4. **Tri**: Permettre le tri des scènes (par date, titre, etc.)
5. **Export**: Exporter la vue Corkboard en PDF/image
6. **Personnalisation**: Permettre de personnaliser les couleurs et statuts
7. **Raccourcis clavier**: Ajouter des raccourcis pour les actions courantes
8. **Tests unitaires**: Ajouter une suite de tests complète

## Support

Pour toute question ou problème, référez-vous à:
- Cette documentation
- Les commentaires JSDoc dans le code
- L'historique des conversations (conversation 758d9f2a et suivantes)
