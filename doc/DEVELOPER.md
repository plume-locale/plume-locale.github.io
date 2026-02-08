# Guide Développeur

Ce document détaille l'architecture technique, les choix de conception et les processus de développement de l'application Plume.

## 1. Architecture Technique

Plume est une application **Vanilla JavaScript** (ES6+) construite sur le pattern **MVVM (Model-View-ViewModel)**. Elle ne dépend d'aucun framework majeur (React, Vue, Angular) ni de bundler complexe (Webpack, Vite), ce qui la rend extrêmement portable et pérenne.

### Pattern MVVM

Chaque module fonctionnel (situé dans `js-refactor/`) suit rigoureusement cette séparation :

*   **MODEL (`*.model.js`)** :
    *   Contient la structure des données (factory functions).
    *   Héberge la "business logic" pure (ex: calculs de stats, validation).
    *   Ne manipule JAMAIS le DOM.
    *   Agit comme un "Repository" de données local.

*   **VIEW MODEL (`*.viewmodel.js`)** :
    *   Fait le pont entre le Model et la View.
    *   Gère l'état de l'interface (ce qui est sélectionné, ouvert, filtré).
    *   Expose des méthodes pour les interactions utilisateur (ex: `addCharacter`, `selectScene`).
    *   Appelle les méthodes du Model pour mettre à jour les données.
    *   Notifie la View qu'elle doit se rafraîchir.

*   **VIEW (`*.view.js`)** :
    *   Gère le DOM (génération HTML, événements).
    *   S'abonne aux changements (souvent via un simple appel `refresh()` déclenché par le ViewModel).
    *   Capture les interactions utilisateur et appelle les méthodes du ViewModel.

### Gestion de l'État (State Management)

L'état global de l'application est centralisé dans un objet global `window.project` (défini dans `js-refactor/01.app.refactor.js`).

```javascript
window.project = {
    id: 123456789,
    title: "Mon Roman",
    acts: [],          // Structure narrative (Actes -> Chapitres -> Scènes)
    characters: [],    // Base de données des personnages
    world: [],         // Lieux, objets
    timeline: [],      // Événements chronologiques
    investigationBoard: { ... } // Données d'enquête
    // ...
};
```

Il n'y a pas de bibliothèque de gestion d'état comme Redux. Les modules accèdent directement à `project` ou via des accesseurs.

## 2. Structure du Code

L'application est en cours de refactorisation. Le code moderne se trouve dans `js-refactor/`.

```text
/
├── css/                  # Styles globaux
├── html/                 # Fragments HTML (head, body, footer)
├── js-refactor/          # Cœur de l'application (Modules)
│   ├── 00.app.view.js    # Vue principale (Layout)
│   ├── 01.app.refactor.js # État global & init
│   ├── investigation-board/ # Module d'enquête
│   ├── timeline-metro/   # Module Timeline
│   ├── characters/       # Module Personnages
│   ├── localization/     # Système i18n
│   ├── undo-redo/        # Système d'historique
│   └── ...
├── build.light.py        # Script de build (Production)
└── deploy-to-live.py     # Script de déploiement (Dev)
```

## 3. Modèle de Données (Data Schema)

Voici les structures de données clés utilisées dans `window.project`.

### Structure Narrative (`project.acts`)
La hiérarchie est stricte : **Acte > Chapitre > Scène**.

```javascript
[
    {
        id: "act_1",
        title: "Acte 1",
        chapters: [
            {
                id: "ch_1",
                title: "Chapitre 1",
                scenes: [
                    {
                        id: "sc_1",
                        title: "L'incident déclencheur",
                        content: "<p>Il pleuvait...</p>", // Contenu HTML
                        summary: "...",
                        povCharacterId: "char_1", // Point de vue
                        locationId: "loc_1",
                        status: "draft" // draft, written, edited
                    }
                ]
            }
        ]
    }
]
```

### Investigation Board (`project.investigationBoard`)
Ce module gère un graphe complexe de preuves et de connaissances.

*   **Case** : Une affaire à résoudre.
*   **Fact** : Un fait objectif (`type: 'clue'|'event'|'testimony'`). Possède un `truthStatus` (vrai, contesté, faux/leurre).
*   **Knowledge** : Ce qu'un personnage sait d'un fait dans une scène donnée (`state: 'ignorant'|'suspicious'|'knows'`).
*   **SuspectLink (MMO)** : Lien entre un suspect et une victime avec 3 axes :
    *   **Motive** (Mobile)
    *   **Means** (Moyen)
    *   **Opportunity** (Opportunité)

## 4. Système de Build & Déploiement

Le projet n'utilise pas `npm`. Tout est géré par Python.

### Build Light (`build.light.py`)
Ce script génère un **Single Page Application (SPA)** contenue dans un fichier HTML unique.
1.  Concatène tous les CSS (définis dans `CSS_ORDER`).
2.  Concatène tous les JS (définis dans `JS_ORDER`).
3.  Injecte le tout dans le template HTML.
4.  C'est le format de distribution finale (facile à partager par email/drive).

### Deploy Live (`deploy-to-live.py`)
Ce script déploie une version "éclatée" pour le développement.
1.  Copie les fichiers individuellement dans `live/css/` et `live/js/`.
2.  Génère un `index.html` avec des balises `<script src="...">` multiples.
3.  Permet de débugger dans le navigateur avec les vrais numéros de ligne et fichiers sources.

## 5. Ajouter une Fonctionnalité

Pour créer un nouveau module "MonModule" :

1.  Créer le dossier `js-refactor/mon-module/`.
2.  Créer les fichiers :
    *   `mon-module.model.js` : Structures de données.
    *   `mon-module.viewmodel.js` : Logique d'interaction.
    *   `mon-module.view.js` : Rendu DOM.
    *   `mon-module.css` : Styles spécifiques.
3.  Ajouter ces fichiers dans les listes `JS_ORDER` et `CSS_ORDER` de **`build.light.py`**.
4.  Initialiser le module dans `04.init.js` ou via un fichier `mon-module.main.js` auto-exécuté.

## 6. Internationalisation (i18n)

Utiliser `Localization.t('key')` pour tout texte visible.
*   Fichiers : `js-refactor/localization/locales/{fr,en,es,de}.js`
*   Le changement de langue recharge l'interface dynamiquement via `LocalizationManager`.
