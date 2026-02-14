class MetroTimelineHandlers {
    /**
     * Bind les événements de la sidebar.
     */
    static bindSidebarHandlers() {
        const list = document.getElementById('timelineVizList');
        if (!list) return;

        // Nouvel événement (sidebar)
        const btnNew = list.querySelector('#btn-new-metro-event-sidebar');
        if (btnNew) btnNew.onclick = () => MetroTimelineViewModel.openEventModal();

        // Monter un événement
        list.querySelectorAll('.btn-move-event-up').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.moveEvent(parseInt(btn.dataset.id), -1);
            };
        });

        // Descendre un événement
        list.querySelectorAll('.btn-move-event-down').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.moveEvent(parseInt(btn.dataset.id), 1);
            };
        });

        // Éditer un événement (clic sur le contenu de l'item)
        list.querySelectorAll('.btn-edit-event').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.openEventModal(parseInt(btn.dataset.id));
            };
        });

        // Ouvrir scène liée
        list.querySelectorAll('.btn-open-linked-scene').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.openLinkedScene(parseInt(btn.dataset.sceneId));
            };
        });
    }

    /**
     * Bind les événements de la vue principale.
     */
    static bindMainViewHandlers() {
        const view = document.getElementById('editorView');
        if (!view) return;

        // Nouvel événement (main toolbar)
        const btnNew = view.querySelector('#btn-new-metro-event-main');
        if (btnNew) btnNew.onclick = () => MetroTimelineViewModel.openEventModal();

        // Trier par date
        const btnSort = view.querySelector('#btn-sort-metro-date');
        if (btnSort) btnSort.onclick = () => MetroTimelineViewModel.sortByDate();

        // Exporter CSV
        const btnExport = view.querySelector('#btn-export-metro-csv');
        if (btnExport) btnExport.onclick = () => MetroTimelineViewModel.exportCSV();

        // Tout effacer
        const btnClear = view.querySelector('#btn-clear-metro-timeline');
        if (btnClear) btnClear.onclick = () => MetroTimelineViewModel.clearAll();

        // Color picker (legend + character labels in SVG)
        view.querySelectorAll('.btn-color-picker').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.openColorPicker(parseInt(btn.dataset.id));
            };
        });

        // Éditer un événement (cercles + labels dans SVG)
        view.querySelectorAll('.btn-edit-event').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.openEventModal(parseInt(btn.dataset.id));
            };
        });

        // Ouvrir scène liée dans SVG
        view.querySelectorAll('.btn-open-linked-scene').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                MetroTimelineViewModel.openLinkedScene(parseInt(btn.dataset.sceneId));
            };
        });

        // Bouton vide state
        const btnFirst = view.querySelector('#btn-create-first-event');
        if (btnFirst) btnFirst.onclick = () => MetroTimelineViewModel.openEventModal();
    }

    /**
     * Bind les événements à l'intérieur de la modale d'événement (tags).
     */
    static bindTagHandlers() {
        const modal = document.getElementById('metroEventModal');
        if (!modal) return;

        modal.querySelectorAll('.btn-remove-char').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const charId = parseInt(btn.dataset.id);
                const checkbox = modal.querySelector(`.metro-char-checkbox[value="${charId}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                    MetroTimelineViewModel.updateLinkedCharsUI();
                }
            };
        });

        modal.querySelectorAll('.metro-char-checkbox').forEach(cb => {
            cb.onchange = () => MetroTimelineViewModel.updateLinkedCharsUI();
        });
    }

    /**
     * Initialise les handlers globaux (ceux appelés directement par le HTML legacy).
     */
    static initGlobalMappers() {
        // Rediriger les appels du HTML vers les classes MVVM
        window.openMetroEventModal = (id) => MetroTimelineViewModel.openEventModal(id);
        window.saveMetroEvent = () => MetroTimelineViewModel.saveEvent();
        window.deleteMetroEvent = () => MetroTimelineViewModel.deleteCurrentEvent();
        window.closeModal = window.closeModal || ((id) => document.getElementById(id).classList.remove('active'));

        window.selectMetroColor = (color) => {
            document.getElementById('metroCustomColor').value = color;
            document.querySelectorAll('.metro-color-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.color === color);
            });
        };

        window.applyMetroColor = () => MetroTimelineViewModel.applyColor();
        window.sortMetroByDate = () => MetroTimelineViewModel.sortByDate();
        window.clearMetroTimeline = () => MetroTimelineViewModel.clearAll();
        window.exportMetroTimelineCSV = () => MetroTimelineViewModel.exportCSV();

        // Navigation / Split view
        window.openMetroEventFromScene = (eventId) => {
            document.getElementById('metroViewChoiceEventId').value = eventId;
            document.getElementById('metroViewChoiceModal').classList.add('active');

            // Internationalize modal choice buttons
            const modal = document.getElementById('metroViewChoiceModal');
            if (modal) {
                const title = modal.querySelector('h3');
                if (title) title.textContent = Localization.t('metro.modal.choice.title');

                const btnFull = modal.querySelector('#btn-choice-full-view');
                if (btnFull) btnFull.innerHTML = `<i data-lucide="maximize" style="width: 16px; height: 16px;"></i> ${Localization.t('metro.modal.choice.full')}`;

                const btnSplit = modal.querySelector('#btn-choice-split-view');
                if (btnSplit) btnSplit.innerHTML = `<i data-lucide="columns" style="width: 16px; height: 16px;"></i> ${Localization.t('metro.modal.choice.split')}`;
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        window.openMetroEventFullView = () => {
            const eventId = parseInt(document.getElementById('metroViewChoiceEventId').value);
            closeModal('metroViewChoiceModal');
            currentView = 'timelineviz';

            // UI Update
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            // Find timeline button - this is a bit hacky as it depends on DOM
            const timelineBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn =>
                btn.textContent.includes('Timeline') || (btn.onclick && btn.onclick.toString().includes('timelineviz'))
            );
            if (timelineBtn) timelineBtn.classList.add('active');

            const sidebarLists = ['chaptersList', 'charactersList', 'worldList', 'timelineList', 'notesList', 'codexList', 'statsList', 'versionsList', 'analysisList', 'todosList', 'corkboardList', 'mindmapList', 'plotList', 'relationsList', 'mapList', 'timelineVizList'];
            sidebarLists.forEach(l => { const el = document.getElementById(l); if (el) el.style.display = 'none'; });
            const tvList = document.getElementById('timelineVizList');
            if (tvList) tvList.style.display = 'block';

            MetroTimelineView.renderTimelineVizView();
            setTimeout(() => MetroTimelineViewModel.openEventModal(eventId), 200);
        };

        window.openMetroEventSplitView = () => {
            const eventId = parseInt(document.getElementById('metroViewChoiceEventId').value);
            closeModal('metroViewChoiceModal');
            if (!splitViewActive) toggleSplitView();
            splitViewState.right.view = 'timelineviz';
            splitActivePanel = 'right';
            updateSplitPanelHeader('right');
            renderSplitPanelViewContent('right');
            setTimeout(() => MetroTimelineViewModel.openEventModal(eventId), 200);
            saveSplitViewState();
        };

        // Legacy support
        window.renderTimelineVizView = () => MetroTimelineView.renderTimelineVizView();
        window.renderTimelineVizList = () => MetroTimelineView.renderTimelineVizList();
        window.moveMetroEvent = (id, dir) => MetroTimelineViewModel.moveEvent(id, dir);
        window.openMetroLinkedScene = (id) => MetroTimelineViewModel.openLinkedScene(id);
    }
}
