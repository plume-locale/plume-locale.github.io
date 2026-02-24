/* ==========================================
   TABS SYSTEM - ViewModel
   ========================================== */

let tabsState = {
    panes: {
        left: {
            tabs: [],
            activeTabId: null
        },
        right: {
            tabs: [],
            activeTabId: null
        }
    },
    activePane: 'left',
    enabled: true,
    isSplit: false
};

/** [MVVM : ViewModel] - Initialise le système d'onglets */
function initTabsSystem() {
    // Si des onglets existent déjà en mémoire, on pourrait les charger ici
    // Pour l'instant on commence vide ou avec la vue actuelle
}

/** [MVVM : ViewModel] - Ouvre un nouvel onglet ou active l'existant */
function openTab(view, params = {}, options = {}) {
    // Si options est une chaîne, c'est l'ancien paneId
    if (typeof options === 'string') options = { paneId: options };

    const { paneId = null, forceNew = false, replaceCurrent = false } = options;

    let targetPaneId = paneId || tabsState.activePane;
    // Si on n'est pas en mode split, on force toujours sur le panneau de gauche
    if (!tabsState.isSplit) targetPaneId = 'left';

    const pane = tabsState.panes[targetPaneId];

    // Créer un ID unique pour l'onglet basé sur la vue et ses paramètres essentiels
    const tabId = generateTabId(view, params);

    // 1. Vérifier si l'onglet EXACT existe déjà dans ce panneau
    let existingTab = pane.tabs.find(t => t.id === tabId);

    if (existingTab) {
        // Mettre à jour les paramètres de l'onglet existant au cas où ils auraient changé
        existingTab.params = { ...params };
        existingTab.title = getTabTitle(view, params);
        pane.activeTabId = tabId;
    } else {
        // 2. Logique de remplacement si non forcé "nouveau"
        let tabToReplaceIndex = -1;

        if (replaceCurrent && pane.activeTabId) {
            tabToReplaceIndex = pane.tabs.findIndex(t => t.id === pane.activeTabId);
        } else if (!forceNew) {
            // Par défaut, si on ouvre une vue du même "type" que l'onglet actif (ex: deux fiches perso)
            // on remplace l'existante pour éviter la pollution d'onglets.
            const activeTab = pane.tabs.find(t => t.id === pane.activeTabId);
            if (activeTab && activeTab.view === view) {
                tabToReplaceIndex = pane.tabs.indexOf(activeTab);
            }
        }

        const newTab = {
            id: tabId,
            view: view,
            params: { ...params },
            title: getTabTitle(view, params),
            icon: viewIcons[view] || 'file',
            paneId: targetPaneId
        };

        if (tabToReplaceIndex !== -1) {
            pane.tabs[tabToReplaceIndex] = newTab;
        } else {
            pane.tabs.push(newTab);
        }
        pane.activeTabId = tabId;
    }

    // Mettre à jour la vue globale pour refléter l'onglet actif
    if (targetPaneId === tabsState.activePane) {
        syncGlobalStateWithTab(pane.tabs.find(t => t.id === pane.activeTabId));
    }

    renderTabs();
    saveTabsState();
}

/** [MVVM : ViewModel] - Ferme un onglet */
function closeTab(tabId, paneId) {
    const pane = tabsState.panes[paneId];
    const index = pane.tabs.findIndex(t => t.id === tabId);

    if (index === -1) return;

    pane.tabs.splice(index, 1);

    // Si on a fermé l'onglet actif, on en active un autre
    if (pane.activeTabId === tabId) {
        if (pane.tabs.length > 0) {
            // On sélectionne l'onglet située à gauche (index - 1)
            // Si c'était le premier (index 0), on prend le nouveau premier (celui qui était à droite)
            const newIndex = Math.max(0, index - 1);
            pane.activeTabId = pane.tabs[newIndex].id;

            // Synchronise les variables globales avec le nouvel onglet (équivalent du switchView)
            syncGlobalStateWithTab(pane.tabs[newIndex]);

            // Lancer le switchview pour cet onglet nouvellement sélectionné comme demandé
            if (typeof switchView === 'function') {
                switchView(pane.tabs[newIndex].view, { skipTabs: true, skipRenderView: true });
            }
        } else {
            pane.activeTabId = null;
        }
    }

    renderTabs();
    saveTabsState();
}

/** [MVVM : ViewModel] - Déplace un onglet */
function moveTab(tabId, fromPaneId, toPaneId, targetIndex = -1) {
    const fromPane = tabsState.panes[fromPaneId];
    const toPane = tabsState.panes[toPaneId];
    const tabIndex = fromPane.tabs.findIndex(t => t.id === tabId);

    if (tabIndex === -1) return;

    const tab = fromPane.tabs[tabIndex];

    // Remove from source
    fromPane.tabs.splice(tabIndex, 1);

    // Update source active tab if needed
    if (fromPane.activeTabId === tabId) {
        fromPane.activeTabId = fromPane.tabs.length > 0 ? fromPane.tabs[Math.max(0, tabIndex - 1)].id : null;
    }

    // Add to target
    tab.paneId = toPaneId; // Update tab owner
    if (targetIndex !== -1 && targetIndex <= toPane.tabs.length) {
        toPane.tabs.splice(targetIndex, 0, tab);
    } else {
        toPane.tabs.push(tab);
    }

    // Update target active tab
    toPane.activeTabId = tab.id;
    tabsState.activePane = toPaneId;

    // Si on a déplacé vers le panneau de droite, on active le split
    if (toPaneId === 'right' && toPane.tabs.length > 0) {
        tabsState.isSplit = true;
    }

    renderTabs();
    saveTabsState();

    // Sync global state because we switched focus to the moved tab
    syncGlobalStateWithTab(tab);
}

/** [MVVM : ViewModel] - Génère un ID unique pour un onglet */
function generateTabId(view, params) {
    if (view === 'editor') {
        if (params.sceneId) return `editor-scene-${params.sceneId}`;
        if (params.chapterId) return `editor-chapter-${params.chapterId}`;
        if (params.actId) return `editor-act-${params.actId}`;
        return 'view-editor-full';
    }
    if (view === 'characters' && params.characterId) return `char-${params.characterId}`;
    if (view === 'world' && params.worldId) return `world-${params.worldId}`;
    if (view === 'notes' && params.noteId) return `note-${params.noteId}`;
    if (view === 'codex' && params.codexId) return `codex-${params.codexId}`;

    // Pour les vues globales sans ID spécifique
    return `view-${view}`;
}

/** [MVVM : ViewModel] - Récupère le titre de l'onglet */
function getTabTitle(view, params) {
    if (view === 'editor') {
        if (params.sceneId) {
            const scene = findSceneById(params.sceneId);
            return scene ? scene.title : Localization.t('nav.ecriture');
        }
        if (params.chapterId) {
            const act = project.acts.find(a => a.id == params.actId);
            const chapter = act ? act.chapters.find(c => c.id == params.chapterId) : null;
            return chapter ? chapter.title : Localization.t('nav.ecriture');
        }
        if (params.actId && params.actId !== 'all') {
            const act = project.acts.find(a => a.id == params.actId);
            return act ? act.title : Localization.t('nav.ecriture');
        }
        if (params.actId === 'all') return Localization.t('structure.all_book') || 'Tout le livre';
        return Localization.t('nav.ecriture');
    }
    if (view === 'characters' && params.characterId) {
        const char = project.characters.find(c => c.id === params.characterId);
        return char ? (char.name || char.firstName) : Localization.t('nav.characters');
    }
    if (view === 'world' && params.worldId) {
        const elem = project.world.find(e => e.id === params.worldId);
        return elem ? elem.name : Localization.t('nav.world');
    }
    if (view === 'notes' && params.noteId) {
        const note = project.notes.find(n => n.id === params.noteId);
        return note ? note.title : Localization.t('nav.notes');
    }

    return viewLabels[view] || view;
}

/** [MVVM : ViewModel] - Synchronise les variables globales avec l'onglet actif */
function syncGlobalStateWithTab(tab, deferRender = false) {
    if (!tab) return;

    currentView = tab.view;
    if (tab.params.sceneId) {
        currentSceneId = tab.params.sceneId;
        currentActId = tab.params.actId;
        currentChapterId = tab.params.chapterId;
    } else if (tab.view === 'editor') {
        // En cas de vue éditeur sans scène (ex: acte complet), on garde les IDs s'ils existent
    }

    // Mettre à jour la sidebar (Synchronisation complète des listes)
    if (typeof syncSidebarWithView === 'function') {
        syncSidebarWithView(tab.view);
    }
    if (typeof updateSidebarActions === 'function') {
        updateSidebarActions(tab.view);
    }

    // Highlight sidebar items
    document.querySelectorAll('.accordion-nav-item, .sidebar-shortcut-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === `nav-item-${tab.view}` || item.dataset.id === tab.view) {
            item.classList.add('active');
        }
    });

    // Update scene highlight in sidebar
    if (tab.view === 'editor' && tab.params.sceneId) {
        document.querySelectorAll('.scene-item').forEach(el => {
            el.classList.toggle('active', el.dataset.sceneId == tab.params.sceneId);
        });
    }

    // Rendu du contenu de l'onglet si demandé (souvent géré par renderTabs)
    if (!deferRender) {
        // renderViewContent('editorView', tab.view); // Dépend de si on est en split ou non
    }
}

/** [MVVM : ViewModel] - Sauvegarde l'état des onglets */
function saveTabsState() {
    localStorage.setItem('plume_tabs_state', JSON.stringify(tabsState));
}

/** [MVVM : ViewModel] - Bascule le mode split pour les onglets */
function toggleTabsSplit() {
    tabsState.isSplit = !tabsState.isSplit;

    if (!tabsState.isSplit) {
        // Si on désactive le split, on rapatrié tout à gauche
        const rightTabs = [...tabsState.panes.right.tabs];
        if (rightTabs.length > 0) {
            rightTabs.forEach(tab => {
                tab.paneId = 'left';
                // Avoid duplicates if tab already exists in left pane
                if (!tabsState.panes.left.tabs.some(t => t.id === tab.id)) {
                    tabsState.panes.left.tabs.push(tab);
                }
            });

            // Focus the active tab from the right pane in the left pane
            if (tabsState.panes.right.activeTabId) {
                tabsState.panes.left.activeTabId = tabsState.panes.right.activeTabId;
            }

            // Clear right pane
            tabsState.panes.right.tabs = [];
            tabsState.panes.right.activeTabId = null;
        }
        tabsState.activePane = 'left';
    } else {
        // Si on active le split et que le panneau de droite est vide, on peut copier l'onglet actif
        if (tabsState.panes.right.tabs.length === 0) {
            // Optionnel : ne rien faire ou copier
        }
    }

    renderTabs();
    saveTabsState();
}

/** [MVVM : ViewModel] - Sauvegarde la disposition actuelle comme preset */
function saveTabsPreset() {
    const name = prompt(Localization.t('tabs.preset_prompt_name'));
    if (!name || !name.trim()) return;

    const snapshot = {
        panes: {
            left: { tabs: tabsState.panes.left.tabs.map(t => ({ ...t })), activeTabId: tabsState.panes.left.activeTabId },
            right: { tabs: tabsState.panes.right.tabs.map(t => ({ ...t })), activeTabId: tabsState.panes.right.activeTabId }
        },
        isSplit: tabsState.isSplit,
        activePane: tabsState.activePane
    };

    TabsRepository.savePreset(name.trim(), snapshot);
    if (typeof showNotification === 'function') showNotification(Localization.t('tabs.preset_saved', [name.trim()]));
    renderTabs();
}

/** [MVVM : ViewModel] - Charge un preset de disposition d'onglets */
function loadTabsPreset(name) {
    const presets = TabsRepository.getPresets();
    const preset = presets.find(p => p.name === name);
    if (!preset) return;

    const snapshot = preset.tabs;
    tabsState.panes.left.tabs = snapshot.panes.left.tabs.map(t => ({ ...t }));
    tabsState.panes.left.activeTabId = snapshot.panes.left.activeTabId;
    tabsState.panes.right.tabs = snapshot.panes.right.tabs.map(t => ({ ...t }));
    tabsState.panes.right.activeTabId = snapshot.panes.right.activeTabId;
    tabsState.isSplit = snapshot.isSplit;
    tabsState.activePane = snapshot.activePane;

    // Rafraîchir les titres avec les données du projet courant
    ['left', 'right'].forEach(paneId => {
        tabsState.panes[paneId].tabs.forEach(tab => {
            tab.title = getTabTitle(tab.view, tab.params);
        });
    });

    saveTabsState();
    renderTabs();

    // Synchroniser l'état global avec l'onglet actif
    const activePane = tabsState.panes[tabsState.activePane];
    const activeTab = activePane.tabs.find(t => t.id === activePane.activeTabId);
    if (activeTab) syncGlobalStateWithTab(activeTab);
}

/** [MVVM : ViewModel] - Supprime un preset */
function deleteTabsPreset(name) {
    TabsRepository.deletePreset(name);
    if (typeof showNotification === 'function') showNotification(Localization.t('tabs.preset_deleted', [name]));
    renderTabs();
}

/** [MVVM : ViewModel] - Utilitaire pour trouver une scène */
function findSceneById(sceneId) {
    if (!project || !project.acts) return null;
    for (const act of project.acts) {
        for (const chapter of act.chapters) {
            const scene = chapter.scenes.find(s => s.id === sceneId);
            if (scene) return scene;
        }
    }
    return null;
}
