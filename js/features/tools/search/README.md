# Module de Recherche Globale - Refactoring MVVM/CRUD

## 📋 Vue d'ensemble

Le module de recherche globale a été **entièrement refactorisé** selon une architecture **MVVM (Model-View-ViewModel)** professionnelle avec des principes CRUD pour une meilleure maintenabilité et extensibilité.

## 🗂️ Structure des fichiers

```
js-refactor/search/
├── search.model.js          # Modèles de données et factories
├── search.repository.js     # Accès aux données et recherche
├── search.viewmodel.js      # Logique métier et gestion d'état
├── search.view.js           # Rendu DOM et affichage
├── search.handlers.js       # Gestionnaires d'événements
├── search.main.js           # Point d'entrée et API publique
└── README.md                # Cette documentation
```

## ✨ Fonctionnalités

### Recherche dans TOUTES les sources de l'application

✅ **Scènes** - Titre + contenu HTML  
✅ **Personnages** - Nom, rôle, description, personnalité, background  
✅ **Univers** - Nom, description, détails, type  
✅ **Chronologie** - Titre, description, lieu, personnages, date  
✅ **Notes** - Titre, contenu, catégorie  
✅ **Codex** - Titre, résumé, contenu, catégorie  

### Fonctionnalités UI

- ⚡ **Recherche en temps réel** avec debounce (300ms)
- 🎯 **Surlignage** des termes de recherche
- 📄 **Aperçu contextuel** des résultats
- 🔢 **Tri intelligent** par pertinence
- ⌨️ **Navigation clavier** (Échap, Entrée)
- 🖱️ **Fermeture au clic extérieur**
- 🚫 **Minimum 2 caractères** pour déclencher la recherche

## 🏗️ Architecture MVVM

### 1. **Model** (`search.model.js`)
Définit les structures de données.

```javascript
// Factory pour créer des résultats
SearchResultModel.create(params)
SearchResultModel.createSceneResult(scene, act, chapter, query, matchIndex, preview)
SearchResultModel.createCharacterResult(character, query, preview)
// ... autres factories

// État de la recherche
SearchStateModel.create()
```

### 2. **Repository** (`search.repository.js`)
Gère l'accès aux données.

```javascript
SearchRepository.searchAll(query)           // Recherche dans toutes les sources
SearchRepository.searchScenes(lowerQuery, originalQuery)
SearchRepository.searchCharacters(lowerQuery, originalQuery)
SearchRepository.searchWorld(lowerQuery, originalQuery)
SearchRepository.searchTimeline(lowerQuery, originalQuery)
SearchRepository.searchNotes(lowerQuery, originalQuery)
SearchRepository.searchCodex(lowerQuery, originalQuery)
SearchRepository.extractTextFromHTML(html)
SearchRepository.getPreview(text, matchIndex, queryLength)
```

### 3. **ViewModel** (`search.viewmodel.js`)
Gère la logique métier et l'état.

```javascript
SearchViewModel.init()
SearchViewModel.performSearch(query)        // Avec debounce
SearchViewModel.executeSearch(query)        // Recherche réelle
SearchViewModel.sortResults(results, query) // Tri par pertinence
SearchViewModel.executeResultAction(index)
SearchViewModel.closeSearch()
SearchViewModel.getState()
SearchViewModel.getResults()
```

**Tri des résultats** (par ordre de priorité) :
1. Correspondance exacte dans le titre
2. Titre commence par la requête
3. Type de résultat (Scènes > Personnages > Univers > Chronologie > Notes > Codex)
4. Ordre alphabétique par titre

### 4. **View** (`search.view.js`)
Gère le rendu DOM.

```javascript
SearchView.init()
SearchView.displayResults(results, query)
SearchView.renderResultItem(result, index, query)
SearchView.highlightQuery(text, query)
SearchView.showNoResults()
SearchView.showError(message)
SearchView.hideResults()
SearchView.clearInput()
```

### 5. **Handlers** (`search.handlers.js`)
Gère les événements utilisateur.

```javascript
SearchHandlers.init()
SearchHandlers.attachInputHandler()
SearchHandlers.attachClickHandlers()
SearchHandlers.attachKeyboardHandlers()
SearchHandlers.attachOutsideClickHandler()
```

**Raccourcis clavier** :
- **Échap** : Ferme la recherche
- **Entrée** : Sélectionne le premier résultat
- **Flèches** : Navigation (prévu pour future amélioration)

### 6. **Main** (`search.main.js`)
Point d'entrée et API publique.

```javascript
GlobalSearch.init()
GlobalSearch.search(query)
GlobalSearch.close()
GlobalSearch.getResults()
GlobalSearch.getState()
GlobalSearch.focus()
```

## 🔄 Flux de données

```
Utilisateur saisit du texte
    ↓
SearchHandlers (input event)
    ↓
SearchViewModel.performSearch() [debounce 300ms]
    ↓
SearchRepository.searchAll()
    ├→ searchScenes()
    ├→ searchCharacters()
    ├→ searchWorld()
    ├→ searchTimeline()
    ├→ searchNotes()
    └→ searchCodex()
    ↓
SearchViewModel.sortResults()
    ↓
SearchView.displayResults()
    ↓
DOM mis à jour
```

## 💻 Utilisation

### API moderne

```javascript
// Effectuer une recherche
GlobalSearch.search('terme de recherche');

// Fermer la recherche
GlobalSearch.close();

// Obtenir les résultats
const results = GlobalSearch.getResults();

// Obtenir l'état
const state = GlobalSearch.getState();

// Focus sur le champ
GlobalSearch.focus();
```

### API legacy (compatibilité rétroactive)

```javascript
// Ces fonctions continuent de fonctionner
performGlobalSearch('terme');
closeSearchResults();
executeSearchAction(0);
```

## 🔧 Intégration dans le build

### build.light.py & build.test.py

```python
# Search refactored files (order: model -> repository -> viewmodel -> view -> handlers -> main)
'js-refactor/search/search.model.js',
'js-refactor/search/search.repository.js',
'js-refactor/search/search.viewmodel.js',
'js-refactor/search/search.view.js',
'js-refactor/search/search.handlers.js',
'js-refactor/search/search.main.js',
```

L'ancien fichier `js/25.globalSearch.js` est maintenant dans `IGNORED_ORIGINALS`.

## ✅ Avantages du refactoring

1. **Séparation des responsabilités** - Chaque module a un rôle clair
2. **Maintenabilité** - Code organisé et documenté
3. **Testabilité** - Modules isolés et testables indépendamment
4. **Extensibilité** - Facile d'ajouter de nouvelles sources de recherche
5. **Performance** - Debounce, cache DOM, délégation d'événements
6. **Compatibilité** - API legacy maintenue pour éviter les régressions
7. **Qualité** - Gestion d'erreurs et validation

## 📊 Comparaison

| Aspect | Avant | Après |
|--------|-------|-------|
| **Fichiers** | 1 monolithique | 6 modules spécialisés |
| **Lignes** | 211 | ~895 (mieux organisées) |
| **Fonctions** | 7 | 45+ |
| **Testabilité** | ⭐ | ⭐⭐⭐⭐⭐ |
| **Maintenabilité** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Extensibilité** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🚀 Tests de build

### Build Light
```
✅ 107 fichiers JS trouvés
✅ Build terminé avec succès
📄 build/plume-light-search-refactor.html
```

### Build Test
```
✅ 104 fichiers JS trouvés
✅ Build terminé avec succès
📄 build/plume-test-search-refactor.html
📊 Taille : 2,421,550 octets
```

## 🔍 Dépendances

Le module dépend des fonctions globales suivantes :
- `openScene(actId, chapterId, sceneId)`
- `switchView(viewName)`
- `openCharacterDetail(characterId)`
- `openWorldDetail(elementId)`
- `openTimelineDetail(eventId)`
- `openNoteDetail(noteId)`
- `openCodexDetail(entryId)`
- `generateId()`

## 📝 Notes techniques

- **Debounce** : 300ms pour optimiser les performances
- **Minimum** : 2 caractères requis pour déclencher une recherche
- **Cache DOM** : Éléments mis en cache pour éviter les requêtes répétées
- **Délégation d'événements** : Utilisée pour les clics sur les résultats
- **Extraction HTML** : Utilise un élément DOM temporaire
- **Échappement regex** : Caractères spéciaux échappés pour le surlignage

## 🎯 Améliorations futures possibles

- [ ] Navigation au clavier avec flèches (ArrowUp/ArrowDown)
- [ ] Historique des recherches
- [ ] Recherche avancée avec filtres
- [ ] Recherche par expressions régulières
- [ ] Export des résultats
- [ ] Statistiques de recherche

## 📅 Historique

- **2026-02-03** : Refactoring complet en architecture MVVM/CRUD
- **Avant** : Fichier monolithique `25.globalSearch.js`

---

**Statut** : ✅ Production-ready  
**Version** : 2.0 (Refactorisé)  
**Architecture** : MVVM/CRUD
