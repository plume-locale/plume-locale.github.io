/**
 * @class MetroTimelineViewModel
 * @description Gère la logique de présentation et les interactions.
 */
class MetroTimelineViewModel {
    /**
     * Ouvre la modale d'événement.
     * @param {number|null} eventId 
     */
    static openEventModal(eventId = null) {
        const modal = document.getElementById('metroEventModal');
        const titleEl = document.getElementById('metroEventModalTitle');
        const deleteBtn = document.getElementById('metroDeleteBtn');

        // Reset form
        document.getElementById('metroEventId').value = '';
        document.getElementById('metroEventTitle').value = '';
        document.getElementById('metroEventDate').value = '';
        document.getElementById('metroEventOrder').value = '';
        document.getElementById('metroEventDesc').value = '';
        document.getElementById('metroEventScene').value = '';

        // Scene selector
        const sceneSelect = document.getElementById('metroEventScene');
        let sceneOptions = `<option value="">${Localization.t('metro.modal.event.no_scene')}</option>`;
        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                chapter.scenes.forEach(scene => {
                    const scenePath = `${act.title} > ${chapter.title} > ${scene.title}`;
                    sceneOptions += `<option value="${scene.id}">${scenePath}</option>`;
                });
            });
        });
        sceneSelect.innerHTML = sceneOptions;

        // Position selector
        const positionSelect = document.getElementById('metroEventPosition');
        const sortedEvents = MetroTimelineRepository.getAll();

        let positionOptions = `<option value="0">${Localization.t('metro.modal.event.start_timeline')}</option>`;
        sortedEvents.forEach((evt, idx) => {
            if (!eventId || evt.id !== eventId) {
                positionOptions += `<option value="${evt.order || idx + 1}">${Localization.t('metro.modal.event.after', `${evt.title}${evt.date ? ' (' + evt.date + ')' : ''}`)}</option>`;
            }
        });
        positionSelect.innerHTML = positionOptions;

        // Character selector
        const selectorDiv = document.getElementById('metroCharactersSelector');
        selectorDiv.innerHTML = project.characters.map(char => `
            <label class="metro-char-option" data-char-id="${char.id}">
                <input type="checkbox" value="${char.id}" class="metro-char-checkbox">
                <span class="metro-char-color-dot" style="background: ${MetroTimelineRepository.getCharacterColor(char.id)};"></span>
                <span>${char.name}</span>
            </label>
        `).join('');

        if (eventId) {
            const event = MetroTimelineRepository.getById(eventId);
            if (!event) return;

            titleEl.textContent = Localization.t('metro.modal.event.title_edit');
            deleteBtn.style.display = '';

            document.getElementById('metroEventId').value = event.id;
            document.getElementById('metroEventTitle').value = event.title || '';
            document.getElementById('metroEventDate').value = event.date || '';
            document.getElementById('metroEventOrder').value = event.order !== undefined ? event.order : '';
            document.getElementById('metroEventDesc').value = event.description || '';
            document.getElementById('metroEventScene').value = event.sceneId || '';

            const currentIdx = sortedEvents.findIndex(e => e.id === eventId);
            if (currentIdx > 0) {
                const prevEvent = sortedEvents[currentIdx - 1];
                positionSelect.value = prevEvent.order || currentIdx;
            } else {
                positionSelect.value = '0';
            }

            (event.characters || []).forEach(charId => {
                const node = selectorDiv.querySelector(`.metro-char-checkbox[value="${charId}"]`);
                if (node) {
                    node.checked = true;
                    node.closest('.metro-char-option').classList.add('selected');
                }
            });
        } else {
            titleEl.textContent = Localization.t('metro.modal.event.title_new');
            deleteBtn.style.display = 'none';

            if (sortedEvents.length > 0) {
                const lastEvent = sortedEvents[sortedEvents.length - 1];
                positionSelect.value = lastEvent.order || sortedEvents.length;
            } else {
                positionSelect.value = '0';
            }
            document.getElementById('metroEventOrder').value = sortedEvents.length + 1;
        }

        this.updateLinkedCharsUI();
        modal.classList.add('active');
        document.getElementById('metroEventTitle').focus();
    }

    /**
     * Met à jour l'affichage des personnages liés dans la modale.
     */
    static updateLinkedCharsUI() {
        const selectorDiv = document.getElementById('metroCharactersSelector');
        const linkedDiv = document.getElementById('metroLinkedChars');
        const checkboxes = Array.from(selectorDiv.querySelectorAll('.metro-char-checkbox'));

        checkboxes.forEach(cb => {
            cb.closest('.metro-char-option').classList.toggle('selected', cb.checked);
        });

        const checked = checkboxes.filter(cb => cb.checked);
        linkedDiv.innerHTML = checked.map(cb => {
            const charId = parseInt(cb.value);
            const char = project.characters.find(c => c.id === charId);
            if (!char) return '';
            const color = MetroTimelineRepository.getCharacterColor(charId);
            return `
                <span class="metro-linked-char-tag" style="background: ${color};">
                    ${char.name}
                    <span class="remove-char btn-remove-char" data-id="${charId}"><i data-lucide="x" style="width:10px;height:10px;vertical-align:middle;"></i></span>
                </span>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        MetroTimelineHandlers.bindTagHandlers();
    }

    /**
     * Enregistre l'événement.
     */
    static saveEvent() {
        const eventId = document.getElementById('metroEventId').value;
        const title = document.getElementById('metroEventTitle').value.trim();
        const date = document.getElementById('metroEventDate').value.trim();
        const positionAfter = parseFloat(document.getElementById('metroEventPosition').value) || 0;
        const description = document.getElementById('metroEventDesc').value.trim();
        const sceneIdValue = document.getElementById('metroEventScene').value;
        const sceneId = sceneIdValue ? parseInt(sceneIdValue) : null;

        if (!title) {
            alert(Localization.t('metro.modal.event.alert_title'));
            return;
        }

        const characters = Array.from(document.querySelectorAll('.metro-char-checkbox:checked')).map(cb => parseInt(cb.value));

        let newOrder = positionAfter === 0 ? 0.5 : positionAfter + 0.5;

        const model = new MetroTimelineModel({
            id: eventId ? parseInt(eventId) : Date.now(),
            title,
            date,
            order: newOrder,
            description,
            characters,
            sceneId
        });

        MetroTimelineRepository.save(model);
        MetroTimelineRepository.normalizeOrder();

        saveProject();
        closeModal('metroEventModal');
        showNotification(eventId ? Localization.t('metro.notify.updated') : Localization.t('metro.notify.created'));

        this.refreshAll();
    }

    /**
     * Supprime l'événement courant.
     */
    static deleteCurrentEvent() {
        const eventId = document.getElementById('metroEventId').value;
        if (!eventId) return;

        if (!confirm(Localization.t('metro.confirm.delete'))) return;

        MetroTimelineRepository.delete(parseInt(eventId));
        saveProject();
        closeModal('metroEventModal');
        showNotification(Localization.t('metro.notify.deleted'));

        this.refreshAll();
    }

    /**
     * Déplace un événement.
     * @param {number} eventId 
     * @param {number} direction 
     */
    static moveEvent(eventId, direction) {
        const events = MetroTimelineRepository.getAll();
        const currentIndex = events.findIndex(e => e.id === eventId);
        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= events.length) return;

        const temp = events[currentIndex];
        events[currentIndex] = events[newIndex];
        events[newIndex] = temp;

        events.forEach((event, i) => {
            event.order = i + 1;
            MetroTimelineRepository.save(event);
        });

        saveProject();
        this.refreshAll();
    }

    /**
     * Trie par date.
     */
    static sortByDate() {
        const events = MetroTimelineRepository.getAll();
        if (events.length === 0) {
            showNotification(Localization.t('metro.notify.no_events'));
            return;
        }

        events.sort((a, b) => {
            const dateStrA = (a.date || '').trim();
            const dateStrB = (b.date || '').trim();

            if (!dateStrA && !dateStrB) return 0;
            if (!dateStrA) return 1;
            if (!dateStrB) return -1;

            const realDateA = MetroTimelineModel.parseRealDate(dateStrA);
            const realDateB = MetroTimelineModel.parseRealDate(dateStrB);

            if (realDateA && realDateB) return realDateA.getTime() - realDateB.getTime();
            if (realDateA) return -1;
            if (realDateB) return 1;

            const yearA = MetroTimelineModel.extractYearNumber(dateStrA);
            const yearB = MetroTimelineModel.extractYearNumber(dateStrB);

            if (yearA !== null && yearB !== null) return yearA - yearB;
            if (yearA !== null) return -1;
            if (yearB !== null) return 1;

            return dateStrA.localeCompare(dateStrB);
        });

        events.forEach((event, i) => {
            event.order = i + 1;
            MetroTimelineRepository.save(event);
        });

        saveProject();
        showNotification(Localization.t('metro.notify.sorted'));
        this.refreshAll();
    }

    /**
     * Efface tout.
     */
    static clearAll() {
        const events = MetroTimelineRepository.getAll();
        if (events.length === 0) {
            showNotification(Localization.t('metro.notify.already_empty'));
            return;
        }

        if (confirm(Localization.t('metro.confirm.clear', events.length))) {
            MetroTimelineRepository.clear();
            saveProject();
            showNotification(Localization.t('metro.notify.cleared'));
            this.refreshAll();
        }
    }

    /**
     * Exporte en CSV.
     */
    static exportCSV() {
        const events = MetroTimelineRepository.getAll();
        if (events.length === 0) {
            alert(Localization.t('metro.notify.export_error'));
            return;
        }

        let csv = 'Ordre,Titre,Date,Description,Personnages\n';
        events.forEach(event => {
            const charNames = (event.characters || []).map(cId => {
                const char = project.characters.find(c => c.id === cId);
                return char ? char.name : '';
            }).filter(n => n).join('; ');

            csv += `${event.order || ''},${MetroTimelineRepository.escapeCSVField(event.title)},${MetroTimelineRepository.escapeCSVField(event.date || '')},${MetroTimelineRepository.escapeCSVField(event.description || '')},${MetroTimelineRepository.escapeCSVField(charNames)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title}_metro_timeline.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification(Localization.t('metro.notify.exported', events.length));
    }

    /**
     * Ouvre la couleur.
     */
    static openColorPicker(charId) {
        const char = project.characters.find(c => c.id === charId);
        if (!char) return;

        document.getElementById('metroColorCharId').value = charId;
        document.getElementById('metroColorCharName').textContent = Localization.t('metro.modal.color.title', char.name);

        const currentColor = MetroTimelineRepository.getCharacterColor(charId);
        document.getElementById('metroCustomColor').value = currentColor;

        document.querySelectorAll('.metro-color-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === currentColor);
        });

        document.getElementById('metroColorModal').classList.add('active');
    }

    /**
     * Applique la couleur.
     */
    static applyColor() {
        const charId = parseInt(document.getElementById('metroColorCharId').value);
        const color = document.getElementById('metroCustomColor').value;

        MetroTimelineRepository.setCharacterColor(charId, color);
        saveProject();
        closeModal('metroColorModal');
        showNotification(Localization.t('metro.notify.color_updated'));
        this.refreshAll();
    }

    /**
     * Rafraîchit toutes les vues.
     */
    static refreshAll() {
        if (splitViewActive) {
            if (splitViewState.left.view === 'timelineviz') renderSplitPanelViewContent('left');
            if (splitViewState.right.view === 'timelineviz') renderSplitPanelViewContent('right');

            // Refraîchir l'éditeur si une scène est ouverte
            if (splitViewState.left.view === 'editor' && splitViewState.left.sceneId) renderSplitPanelViewContent('left');
            if (splitViewState.right.view === 'editor' && splitViewState.right.sceneId) renderSplitPanelViewContent('right');
        } else if (currentView === 'timelineviz') {
            MetroTimelineView.renderTimelineVizView();
        } else if (currentSceneId && currentView === 'editor') {
            const act = project.acts.find(a => a.id === currentActId);
            const chapter = act?.chapters.find(c => c.id === currentChapterId);
            const scene = chapter?.scenes.find(s => s.id === currentSceneId);
            if (act && chapter && scene) {
                renderEditor(act, chapter, scene);
            }
        }
    }

    /**
     * Ouvre une scène liée après switch de vue.
     */
    static openLinkedScene(sceneId) {
        let found = null;
        for (const act of project.acts) {
            for (const chapter of act.chapters) {
                const scene = chapter.scenes.find(s => s.id === sceneId);
                if (scene) {
                    found = { act, chapter, scene };
                    break;
                }
            }
            if (found) break;
        }

        if (!found) {
            showNotification(Localization.t('metro.notify.scene_not_found'), 'error');
            return;
        }

        switchView('editor');
        setTimeout(() => {
            openScene(found.act.id, found.chapter.id, found.scene.id);
            showNotification(Localization.t('metro.notify.scene_opened', found.scene.title));
        }, 100);
    }
}
