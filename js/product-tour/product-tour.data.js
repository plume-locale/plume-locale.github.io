/**
 * [Product Tour Data]
 * Ce fichier contient les définitions permanentes des tours de l'application.
 * Ces données sont partagées par tous les utilisateurs.
 */

const ProductTourData = {
    // Les tours personnalisés par vue
    // Chaque clé correspond à une valeur possible de la variable globale 'currentView'
    tours: {
        "projects": [
            {
                "element": ".app-logo-icon",
                "popover": {
                    "title": "🪶 Bienvenue dans Plume",
                    "description": "<p>Plume est votre espace d'écriture complet pour créer des histoires captivantes.</p><p>Cette visite guidée vous présentera les fonctionnalités principales en quelques minutes.</p><p><strong>Vous pouvez quitter à tout moment en appuyant sur Échap.</strong></p>",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": ".header-nav",
                "popover": {
                    "title": "📝 Outils d'Écriture",
                    "description": "<p>Organisez et visualisez votre histoire de différentes manières :</p><ul><li><span style=\"color: rgb(255, 152, 0); font-weight: 700;\">Groupe histoire</span></li><li><span style=\"color: rgb(255, 152, 0); font-weight: 700;\">Groupe construction de monde</span></li><li><span style=\"color: rgb(255, 152, 0); font-weight: 700;\">Groupe Visualisation</span></li><li><span style=\"color: rgb(255, 152, 0); font-weight: 700;\">Groupe Stats/analyse</span></li><li><span style=\"color: rgb(255, 152, 0); font-weight: 700;\">Groupe Sauvegarde</span></li></ul>",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#header-tab-projects",
                "popover": {
                    "title": "Projets",
                    "description": "C'est l'écran d'accueil de Plume ! </br> Vous voyez ici vos projets, vous pouvez changer de projet, les sauvegarder, les supprimer.",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#header-tab-editor",
                "popover": {
                    "title": "Structure",
                    "description": "C'est le cœur de Plume, c'est ici que vous écrivez vos histoire !",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-editor"
            },
            {
                "element": "#header-tab-corkboard",
                "popover": {
                    "title": "Tableau",
                    "description": "Visualiser rapidement la structure de votre récit",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-corkboard"
            },
            {
                "element": "#header-tab-plot",
                "popover": {
                    "title": "Intrigue",
                    "description": "Analyser la tension narrative de votre récit",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-plot"
            },
            {
                "element": "#header-tab-plotgrid",
                "popover": {
                    "title": "Grille narrative",
                    "description": "Planifier vote récit avec la grille narrative",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-plotgrid"
            },
            {
                "element": "#header-tab-arcs",
                "popover": {
                    "title": "Arcs narratifs",
                    "description": "Créer vos arcs narratifs",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-arcs"
            },
            {
                "element": "#header-tab-investigation",
                "popover": {
                    "title": "Enquête",
                    "description": "Des outils si vous écrivez un polar ou un thriller.&nbsp;<div>Suivre des indices, des fausses pistes, qui sait quoi, etc...</div>",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-investigation"
            },
            {
                "element": "#header-tab-globalnotes",
                "popover": {
                    "title": "Global Notes",
                    "description": "Un outil complet pour organiser vos idées en tableaux",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-globalnotes"
            },
            {
                "element": "#header-tab-characters",
                "popover": {
                    "title": "Personnages",
                    "description": "Créer vos fiches personnages",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-characters"
            },
            {
                "element": "#header-tab-world",
                "popover": {
                    "title": "Univers",
                    "description": "Créer les lieux qui composent voter univers",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-world"
            },
            {
                "element": "#header-tab-codex",
                "popover": {
                    "title": "Codex",
                    "description": "Consigner le lore de votre univers !",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-codex"
            },
            {
                "element": "#header-tab-notes",
                "popover": {
                    "title": "Notes",
                    "description": "Une autre manière de consigner vos notes",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-notes"
            },
            {
                "element": "#header-tab-mindmap",
                "popover": {
                    "title": "Cartes mentales",
                    "description": "Créer vos cartes mentales.",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-mindmap"
            },
            {
                "element": "#header-tab-relations",
                "popover": {
                    "title": "Relations",
                    "description": "Gérer les relations de vos personnages",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-relations"
            },
            {
                "element": "#header-tab-map",
                "popover": {
                    "title": "Carte",
                    "description": "Visualiser votre univers",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-map"
            },
            {
                "element": "#header-tab-timeline-viz",
                "popover": {
                    "title": "Timeline metro",
                    "description": "Visualiser les recoupements de vos personnages",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-timeline-viz"
            },
            {
                "element": "#header-tab-stats",
                "popover": {
                    "title": "Statistiques",
                    "description": "Consulter les statistiques de vos mots",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-stats"
            },
            {
                "element": "#header-tab-analysis",
                "popover": {
                    "title": "Analyse",
                    "description": "Analyse le texte déjà écrit",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#header-tab-analysis"
            },
            {
                "element": "#header-tab-versions",
                "popover": {
                    "title": "Snapshots",
                    "description": "Faites un instantané sauvegardé de votre projet à l'instant T",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#splitModeToggle",
                "popover": {
                    "title": "Split",
                    "description": "Afficher 2 vues côte à côte",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#splitModeToggle",
                "clickAfter": "#splitModeToggle"
            },
            {
                "element": "#storage-badge",
                "popover": {
                    "title": "Etat du stockage",
                    "description": "Donne une idée de la taille de votre projet.",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#headerUndoBtn",
                "popover": {
                    "title": "Défaire",
                    "description": "Undo",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#headerRedoBtn",
                "popover": {
                    "title": "Refaire",
                    "description": "Redo",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#pomodoroHeaderBtn",
                "popover": {
                    "title": "Timer pomodoro",
                    "description": "Un timer pour gérer vos sessions et faire des pauses !",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#headerShortcutsBtn",
                "popover": {
                    "title": "Raccourcis claviers",
                    "description": "Tout est dit !",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#headerThemesBtn",
                "popover": {
                    "title": "Gestionnaire de thèmes",
                    "description": "Personnaliser les couleurs de votre application",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "div#docDropdown > button",
                "popover": {
                    "title": "Documentation",
                    "description": "La doc de Plume !",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "div#langDropdown > button",
                "popover": {
                    "title": "Sélecteur de langue",
                    "description": "Choisir la langue de l'application",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": "#tourTriggerBtn",
                "popover": {
                    "title": "L'aide visuelle",
                    "description": "Ce que vous êtes en train de regarder ! ;)",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            }
        ],      // Écran d'accueil / Liste des projets
        "editor": [
            {
                "element": "#headerProjectTitle",
                "popover": {
                    "title": "🎉 Visite Terminée !",
                    "description": "<p>Vous connaissez maintenant les bases de Plume !</p><p>Explorez les autres sections pour découvrir encore plus de fonctionnalités :</p><ul><li>Personnages et Univers</li><li>Visualisations et graphiques</li><li>Outils d'analyse et statistiques</li></ul><p><strong>Bon courage pour votre écriture ! ✍️</strong></p>",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null
            },
            {
                "element": ".sidebar",
                "popover": {
                    "title": "📚 Hiérarchie du Récit",
                    "description": "<p>C'est ici que vous organisez votre manuscrit. Vous pouvez voir la structure complète de votre livre en un coup d'œil.</p>",
                    "side": "right",
                    "align": "start"
                }
            },
            {
                "element": ".sidebar-header-actions",
                "popover": {
                    "title": "➕ Organisez votre Histoire",
                    "description": "<p>Utilisez ces boutons pour ajouter de nouveaux <strong>Actes</strong> et <strong>Chapitres</strong> à votre projet.</p>",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": ".tree-toolbar",
                "popover": {
                    "title": "🛠️ Outils de Structure",
                    "description": "<p>Réduisez tout pour une vue d'ensemble ou utilisez les filtres pour retrouver rapidement vos scènes par statut (premier jet, révision, terminé).</p>",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": ".editor-header",
                "popover": {
                    "title": "📍 Navigation & Titre",
                    "description": "<p>Le fil d'Ariane vous indique où vous êtes. Cliquez sur le titre pour renommer la scène actuelle.</p>",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": ".editor-synopsis",
                "popover": {
                    "title": "📝 Résumé de Scène",
                    "description": "<p>Saisissez ici l'idée principale de votre scène. Ce résumé apparaîtra également dans le Tableau (Corkboard) et la Grille d'Intrigue.</p>",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": "#editorToolbar",
                "popover": {
                    "title": "✍️ Mise en Forme",
                    "description": "<p>Tous vos outils d'écriture classiques : gras, italique, listes, et bien plus. Survolez-les pour découvrir les raccourcis clavier.</p>",
                    "side": "top",
                    "align": "center"
                }
            },
            {
                "element": ".editor-textarea",
                "popover": {
                    "title": "📖 Votre Espace d'Écriture",
                    "description": "<p>Écrivez sans distraction. Tout est sauvegardé automatiquement en temps réel.</p>",
                    "side": "top",
                    "align": "center"
                }
            },
            {
                "element": "#toolsSidebar",
                "popover": {
                    "title": "🔍 Outils d'Accompagnement",
                    "description": "<p>Accédez aux versions de scène, gérez vos annotations, ou suivez les arcs narratifs sans quitter votre texte.</p>",
                    "side": "left",
                    "align": "start"
                }
            },
            {
                "element": "#toolVersionsBtn",
                "popover": {
                    "title": "Gestion des versions",
                    "description": "Créer différentes version d'un même texte, des variations, sans perdre ce que vous avez déjà écrit.",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#toolVersionsBtn"
            },
            {
                "element": "#btnNewVersion",
                "popover": {
                    "title": "Créer un version",
                    "description": "Ajoute une capture de votre texte actuel en mémoire, vous pouvez maintenant modifier, faire des tests et si ça na vous plait pas, vous pouvez revenir à la version que vous souhaitez !</br> Etoile : mettez une étoile pour valider cette version dans l'export final.</br> Diff : Utiliser le \"DIFF\" pour comparer les versions de vos textes </br>Stylo : éditer le nom de votre version</br> Corbeille : supprimer cette version",
                    "image": "tour/STR-version.png",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickAfter": "#toolVersionsBtn"
            },
            {
                "element": "#toolAnnotationsBtn",
                "popover": {
                    "title": "Annotations",
                    "description": "Suivez dans cette barre latérale toutes les annotations que vous faites en mode révision",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#toolAnnotationsBtn",
                "clickAfter": "#toolAnnotationsBtn"
            },
            {
                "element": "#toolTodosBtn",
                "popover": {
                    "title": "Todo",
                    "description": "Suivez dans cette barre latérale toutes les TODO que vous faites en mode révision",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#toolTodosBtn",
                "clickAfter": "#toolTodosBtn"
            },
            {
                "element": "#toolArcsBtn",
                "popover": {
                    "title": "Gestions des arcs narratifs",
                    "description": "Dans cette barre, vous pouvez relier la scène en cours à une étape de vos arcs narratifs en indiquant le statut:</br> Introduction </br> Développement </br> Point culminant </br> Résolution. </br> Quelle est la colonne de votre arc avec laquelle cette scène est liée et mettre des notes.",
                    "image": "tour/STR-arc.png",
                    "side": "bottom",
                    "align": "start"
                },
                "onHighlightStarted": null,
                "onHighlighted": null,
                "onDeselected": null,
                "onNext": null,
                "onPrevious": null,
                "clickBefore": "#toolArcsBtn",
                "clickAfter": "#toolArcsBtn"
            },
            {
                "element": "#headerProjectTitle",
                "popover": {
                    "title": "🎉 Visite Terminée !",
                    "description": "<p>Vous connaissez maintenant les bases de Plume !</p><p>Explorez les autres sections pour découvrir encore plus de fonctionnalités :</p><ul><li>Personnages et Univers</li><li>Visualisations et graphiques</li><li>Outils d'analyse et statistiques</li></ul><p><strong>Bon courage pour votre écriture ! ✍️</strong></p>",
                    "side": "bottom",
                    "align": "start"
                }
            }
        ],        // Structure du roman (Actes, Chapitres, Scènes)
        "characters": [],    // Gestion des personnages
        "world": [],         // Worldbuilding / Univers
        "notes": [],         // Notes de projet
        "codex": [],         // Codex / Encyclopédie
        "arcs": [],          // Arcs narratifs
        "plotgrid": [],      // Grille d'intrigue (Plot Grid)
        "timeline": [],      // Frise chronologique
        "timelineviz": [],   // Visualisation temporelle
        "stats": [],         // Statistiques d'écriture
        "analysis": [],      // Analyse de texte
        "investigation": [], // Tableau d'enquête
        "globalnotes": [],   // Tableaux de bord (Global Notes)
        "mindmap": [],       // Carte mentale
        "corkboard": [],     // Tableau de liège
        "map": [],           // Cartographie
        "relations": [],     // Carte des relations
        "storygrid": [],     // Story Grid
        "thriller": [],      // Thriller Board
        "snapshots": [],     // Snapshots / Sauvegardes
        "versions": [],      // Historique des versions
        "todos": [],         // Liste des tâches (TODO)
        "search": []         // Recherche globale
    }
};
