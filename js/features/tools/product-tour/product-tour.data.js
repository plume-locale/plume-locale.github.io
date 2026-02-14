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
                    "title": "tour.projects.welcome.title",
                    "description": "tour.projects.welcome.description",
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
                "element": "#sidebarAccordion",
                "popover": {
                    "title": "tour.projects.sidebar.title",
                    "description": "tour.projects.sidebar.description",
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
                    "title": "tour.projects.tab_projects.title",
                    "description": "tour.projects.tab_projects.description",
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
                    "title": "tour.projects.tab_editor.title",
                    "description": "tour.projects.tab_editor.description",
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
                    "title": "tour.projects.tab_corkboard.title",
                    "description": "tour.projects.tab_corkboard.description",
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
                    "title": "tour.projects.tab_plot.title",
                    "description": "tour.projects.tab_plot.description",
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
                    "title": "tour.projects.tab_plotgrid.title",
                    "description": "tour.projects.tab_plotgrid.description",
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
                    "title": "tour.projects.tab_arcs.title",
                    "description": "tour.projects.tab_arcs.description",
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
                    "title": "tour.projects.tab_investigation.title",
                    "description": "tour.projects.tab_investigation.description",
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
                    "title": "tour.projects.tab_globalnotes.title",
                    "description": "tour.projects.tab_globalnotes.description",
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
                    "title": "tour.projects.tab_characters.title",
                    "description": "tour.projects.tab_characters.description",
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
                    "title": "tour.projects.tab_world.title",
                    "description": "tour.projects.tab_world.description",
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
                    "title": "tour.projects.tab_codex.title",
                    "description": "tour.projects.tab_codex.description",
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
                    "title": "tour.projects.tab_notes.title",
                    "description": "tour.projects.tab_notes.description",
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
                    "title": "tour.projects.tab_mindmap.title",
                    "description": "tour.projects.tab_mindmap.description",
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
                    "title": "tour.projects.tab_relations.title",
                    "description": "tour.projects.tab_relations.description",
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
                    "title": "tour.projects.tab_map.title",
                    "description": "tour.projects.tab_map.description",
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
                    "title": "tour.projects.tab_timeline_viz.title",
                    "description": "tour.projects.tab_timeline_viz.description",
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
                    "title": "tour.projects.tab_stats.title",
                    "description": "tour.projects.tab_stats.description",
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
                    "title": "tour.projects.tab_analysis.title",
                    "description": "tour.projects.tab_analysis.description",
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
                    "title": "tour.projects.tab_versions.title",
                    "description": "tour.projects.tab_versions.description",
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
                    "title": "tour.projects.split.title",
                    "description": "tour.projects.split.description",
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
                    "title": "tour.projects.storage.title",
                    "description": "tour.projects.storage.description",
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
                    "title": "tour.projects.undo.title",
                    "description": "tour.projects.undo.description",
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
                    "title": "tour.projects.redo.title",
                    "description": "tour.projects.redo.description",
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
                    "title": "tour.projects.pomodoro.title",
                    "description": "tour.projects.pomodoro.description",
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
                    "title": "tour.projects.shortcuts.title",
                    "description": "tour.projects.shortcuts.description",
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
                    "title": "tour.projects.themes.title",
                    "description": "tour.projects.themes.description",
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
                    "title": "tour.projects.doc.title",
                    "description": "tour.projects.doc.description",
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
                    "title": "tour.projects.lang.title",
                    "description": "tour.projects.lang.description",
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
                    "title": "tour.projects.tour.title",
                    "description": "tour.projects.tour.description",
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
                "element": ".sidebar",
                "popover": {
                    "title": "tour.editor.sidebar.title",
                    "description": "tour.editor.sidebar.description",
                    "side": "right",
                    "align": "start"
                }
            },
            {
                "element": ".sidebar-header-actions",
                "popover": {
                    "title": "tour.editor.sidebar_header.title",
                    "description": "tour.editor.sidebar_header.description",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": ".tree-toolbar",
                "popover": {
                    "title": "tour.editor.tree_toolbar.title",
                    "description": "tour.editor.tree_toolbar.description",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": ".editor-header",
                "popover": {
                    "title": "tour.editor.header.title",
                    "description": "tour.editor.header.description",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": ".editor-synopsis",
                "popover": {
                    "title": "tour.editor.synopsis.title",
                    "description": "tour.editor.synopsis.description",
                    "side": "bottom",
                    "align": "start"
                }
            },
            {
                "element": "#editorToolbar",
                "popover": {
                    "title": "tour.editor.toolbar.title",
                    "description": "tour.editor.toolbar.description",
                    "side": "top",
                    "align": "center"
                }
            },
            {
                "element": ".editor-textarea",
                "popover": {
                    "title": "tour.editor.textarea.title",
                    "description": "tour.editor.textarea.description",
                    "side": "top",
                    "align": "center"
                }
            },
            {
                "element": "#toolsSidebar",
                "popover": {
                    "title": "tour.editor.tools_sidebar.title",
                    "description": "tour.editor.tools_sidebar.description",
                    "side": "left",
                    "align": "start"
                }
            },
            {
                "element": "#toolVersionsBtn",
                "popover": {
                    "title": "tour.editor.tool_versions.title",
                    "description": "tour.editor.tool_versions.description",
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
                    "title": "tour.editor.new_version.title",
                    "description": "tour.editor.new_version.description",
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
                    "title": "tour.editor.annotations.title",
                    "description": "tour.editor.annotations.description",
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
                    "title": "tour.editor.todos.title",
                    "description": "tour.editor.todos.description",
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
                    "title": "tour.editor.arcs.title",
                    "description": "tour.editor.arcs.description",
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
                    "title": "tour.editor.finish.title",
                    "description": "tour.editor.finish.description",
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
