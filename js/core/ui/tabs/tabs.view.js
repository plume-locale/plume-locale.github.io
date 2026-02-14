/* ==========================================
   TABS SYSTEM - View
   ========================================== */

/** [MVVM : View] - Rendu principal du système d'onglets */
function renderTabs() {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    // Si aucun onglet n'est ouvert (et pas de mode split legacy actif)
    if (tabsState.panes.left.tabs.length === 0 && tabsState.panes.right.tabs.length === 0 && !splitViewActive) {
        // Optionnel : Restaurer la vue par défaut ou afficher un message
        return;
    }

    // Le mode split est actif si le flag isSplit est vrai OU si on a des onglets à droite
    const isSplit = tabsState.isSplit || tabsState.panes.right.tabs.length > 0;

    if (isSplit) {
        renderSplitTabs(editorView);
    } else {
        renderSinglePaneTabs(editorView);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [MVVM : View] - Génère le HTML du bouton preset dans la barre d'onglets */
function renderTabsPresetButtonHTML() {
    return `
        <div class="tab-preset-wrapper">
            <button class="tab-preset-btn" onclick="toggleTabsPresetMenu(event)" title="${Localization.t('tabs.preset_tooltip')}">
                <i data-lucide="bookmark" style="width:14px;height:14px;"></i>
            </button>
        </div>
    `;
}

/** [MVVM : View] - Affiche/masque le menu de presets */
function toggleTabsPresetMenu(event) {
    event.stopPropagation();
    const existing = document.querySelector('.tab-preset-menu');
    if (existing) { existing.remove(); return; }

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    const presets = typeof TabsRepository !== 'undefined' ? TabsRepository.getPresets() : [];

    const menu = document.createElement('div');
    menu.className = 'tab-preset-menu';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';

    const hasTabs = tabsState.panes.left.tabs.length > 0 || tabsState.panes.right.tabs.length > 0;

    menu.innerHTML = `
        ${hasTabs ? `<div class="tab-preset-menu-item tab-preset-save" onclick="saveTabsPreset(); document.querySelector('.tab-preset-menu')?.remove();">
            <i data-lucide="save" style="width:14px;height:14px;"></i>
            <span>${Localization.t('tabs.preset_save')}</span>
        </div>` : ''}
        ${presets.length > 0 ? `<div class="tab-preset-menu-divider"></div>` : ''}
        ${presets.map(p => `
            <div class="tab-preset-menu-item" onclick="loadTabsPreset('${p.name.replace(/'/g, "\\'")}'); document.querySelector('.tab-preset-menu')?.remove();">
                <i data-lucide="layout" style="width:14px;height:14px;"></i>
                <span>${p.name}</span>
                <button class="tab-preset-delete" onclick="event.stopPropagation(); deleteTabsPreset('${p.name.replace(/'/g, "\\'")}'); document.querySelector('.tab-preset-menu')?.remove();">
                    <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                </button>
            </div>
        `).join('')}
        ${presets.length === 0 ? `<div class="tab-preset-menu-empty">${Localization.t('tabs.preset_empty')}</div>` : ''}
    `;

    document.body.appendChild(menu);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Fermer au clic extérieur
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

/** [MVVM : View] - Rendu d'un panneau unique d'onglets */
function renderSinglePaneTabs(container) {
    const pane = tabsState.panes.left;
    const activeTab = pane.tabs.find(t => t.id === pane.activeTabId);

    container.innerHTML = `
        <div class="tabs-container">
            <div class="tab-strip" id="tab-strip-left" ondragover="allowDrop(event)" ondrop="dropTab(event, 'left')">
                ${pane.tabs.map(tab => renderTabItemHTML(tab, pane.activeTabId)).join('')}
                ${renderTabsPresetButtonHTML()}
            </div>
            <div class="tab-content-area" id="tab-content-left">
                <!-- Content will be injected here -->
            </div>
        </div>
    `;

    if (activeTab) {
        const contentContainer = document.getElementById('tab-content-left');
        renderTabContent(activeTab, contentContainer, 'left');
    } else {
        // État vide
        document.getElementById('tab-content-left').innerHTML = `
            <div class="empty-state">
                <i data-lucide="layout" style="width:48px;height:48px;opacity:0.2;"></i>
                <p>${Localization.t('tabs.empty_state') || 'Ouvrez un document pour commencer'}</p>
            </div>
        `;
    }
}

/** [MVVM : View] - Rendu de deux panneaux d'onglets side-by-side */
function renderSplitTabs(container) {
    const ratio = splitViewState.ratio || 50;

    container.innerHTML = `
        <div class="split-view-container" id="splitViewContainer">
            <div class="split-panel split-pane ${tabsState.activePane === 'left' ? 'active' : ''}" 
                 id="splitPanelLeft" style="flex: ${ratio};" onclick="switchActivePane('left')">
                <div class="tab-strip" id="tab-strip-left" ondragover="allowDrop(event)" ondrop="dropTab(event, 'left')">
                    ${tabsState.panes.left.tabs.map(tab => renderTabItemHTML(tab, tabsState.panes.left.activeTabId)).join('')}
                    ${renderTabsPresetButtonHTML()}
                </div>
                <div class="tab-content-area" id="tab-content-left"></div>
            </div>
            
            <div class="split-resizer horizontal" id="splitResizer" onmousedown="startSplitResize(event)"></div>
            
            <div class="split-panel split-pane ${tabsState.activePane === 'right' ? 'active' : ''}" 
                 id="splitPanelRight" style="flex: ${100 - ratio};" onclick="switchActivePane('right')">
                <div class="tab-strip" id="tab-strip-right" ondragover="allowDrop(event)" ondrop="dropTab(event, 'right')">
                    ${tabsState.panes.right.tabs.map(tab => renderTabItemHTML(tab, tabsState.panes.right.activeTabId)).join('')}
                </div>
                <div class="tab-content-area" id="tab-content-right"></div>
            </div>
        </div>
    `;

    // Render active tabs for both panes
    ['left', 'right'].forEach(paneId => {
        const pane = tabsState.panes[paneId];
        const activeTab = pane.tabs.find(t => t.id === pane.activeTabId);
        const contentContainer = document.getElementById(`tab-content-${paneId}`);
        if (activeTab && contentContainer) {
            renderTabContent(activeTab, contentContainer, paneId);
        }
    });
}

/** [MVVM : View] - Génère le HTML pour un item d'onglet */
function renderTabItemHTML(tab, activeTabId) {
    const isActive = tab.id === activeTabId;
    return `
        <div class="tab-item ${isActive ? 'active' : ''}" 
             draggable="true" ondragstart="dragTab(event, '${tab.id}', '${tab.paneId}')"
             onclick="activateTab('${tab.id}', '${tab.paneId}'); event.stopPropagation();">
            <div class="tab-icon"><i data-lucide="${tab.icon}"></i></div>
            <div class="tab-label">${tab.title}</div>
            <div class="tab-close" onclick="closeTab('${tab.id}', '${tab.paneId}'); event.stopPropagation();">
                <i data-lucide="x"></i>
            </div>
        </div>
    `;
}

/** [MVVM : View] - Rendu du contenu d'un onglet spécifique */
function renderTabContent(tab, container, paneId) {
    // Réutiliser la logique du split view coordinator qui est déjà robuste
    if (typeof renderViewInSplitPanel === 'function') {
        const state = {
            view: tab.view,
            ...tab.params
        };
        renderViewInSplitPanel(tab.view, container, state, paneId);
    }
}

/** [MVVM : View] - Action de basculement de panneau */
function switchActivePane(paneId) {
    tabsState.activePane = paneId;
    document.querySelectorAll('.split-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(paneId === 'left' ? 'splitPanelLeft' : 'splitPanelRight')?.classList.add('active');

    // Sync global state with the active tab of this pane
    const pane = tabsState.panes[paneId];
    const activeTab = pane.tabs.find(t => t.id === pane.activeTabId);
    if (activeTab) syncGlobalStateWithTab(activeTab);
}

/** [MVVM : View] - Active un onglet spécifique */
function activateTab(tabId, paneId) {
    tabsState.panes[paneId].activeTabId = tabId;
    tabsState.activePane = paneId;
    renderTabs();

    const activeTab = tabsState.panes[paneId].tabs.find(t => t.id === tabId);
    if (activeTab) syncGlobalStateWithTab(activeTab);
}

/** [MVVM : View] - Gestion du Drag & Drop des onglets */
function dragTab(ev, tabId, paneId) {
    ev.dataTransfer.setData("text/plain", JSON.stringify({ tabId, paneId }));
    ev.dataTransfer.effectAllowed = "move";
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dropTab(ev, targetPaneId) {
    ev.preventDefault();
    const dataStr = ev.dataTransfer.getData("text/plain");
    if (!dataStr) return;

    try {
        const data = JSON.parse(dataStr);
        if (data && data.tabId && data.paneId) {
            let targetIndex = -1;
            const targetElement = ev.target.closest('.tab-item');

            // Calculer l'index cible si on dépose sur un onglet existant
            if (targetElement) {
                const paneTabsContainer = document.getElementById(`tab-strip-${targetPaneId}`);
                if (paneTabsContainer) { // Safety check
                    const paneTabs = Array.from(paneTabsContainer.querySelectorAll('.tab-item'));
                    targetIndex = paneTabs.indexOf(targetElement);
                }
            } else {
                // Si on dépose dans l'espace vide, ajouter à la fin
                const paneTabsContainer = document.getElementById(`tab-strip-${targetPaneId}`);
                if (paneTabsContainer) {
                    targetIndex = paneTabsContainer.querySelectorAll('.tab-item').length;
                }
            }

            // Appel au ViewModel pour effectuer le déplacement
            if (typeof moveTab === 'function') {
                moveTab(data.tabId, data.paneId, targetPaneId, targetIndex);
            }
        }
    } catch (e) {
        console.error("Error dropTab:", e);
    }
}
