// ============================================
// ============================================
// ============================================
// TIMELINE VIZ FUNCTIONS
// ============================================

// [MVVM : View]
// Rend la liste latérale (sidebar) des évènements de la timeline.
function renderTimelineVizList() {
    const container = document.getElementById('timelineVizList');
    if (!container) {
        console.error('timelineVizList container not found');
        return;
    }

    // S'assurer que metroTimeline et characterColors existent
    if (!project.metroTimeline) {
        project.metroTimeline = [];
    }
    if (!project.characterColors) {
        project.characterColors = {};
    }

    // Assigner des couleurs par défaut aux personnages qui n'en ont pas
    const defaultColors = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#FFB300', '#D81B60', '#5E35B1', '#00897B'];
    project.characters.forEach((char, i) => {
        if (!project.characterColors[char.id]) {
            project.characterColors[char.id] = defaultColors[i % defaultColors.length];
        }
    });

    // Compter les évènements
    const eventCount = project.metroTimeline.length;
    const charCount = project.characters.length;

    // Sidebar avec personnages et liste d'évènements
    container.innerHTML = `
                <div style="padding: 1rem;">
                    <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="train-track" style="width: 20px; height: 20px;"></i>
                        Timeline Métro
                    </h3>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                        <div style="margin-bottom: 0.5rem;"><i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${eventCount} évènement(s)</div>
                        <div style="margin-bottom: 0.5rem;"><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${charCount} personnage(s)</div>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="openMetroEventModal()" style="width: 100%;">
                                + Nouvel évènement
                            </button>
                        </div>
                    </div>
                    ${eventCount > 0 ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">
                                <span>évènements:</span>
                            </div>
                            <div id="metroEventsList" class="metro-events-sortable">
                                ${project.metroTimeline.sort((a, b) => (a.order || 0) - (b.order || 0)).map((event, i, arr) => `
                                    <div class="metro-event-item" data-event-id="${event.id}">
                                        <div class="metro-event-reorder-btns">
                                            <button class="metro-reorder-btn" onclick="moveMetroEvent(${event.id}, -1)" ${i === 0 ? 'disabled' : ''} title="Monter"><i data-lucide="chevron-up" style="width:12px;height:12px;"></i></button>
                                            <button class="metro-reorder-btn" onclick="moveMetroEvent(${event.id}, 1)" ${i === arr.length - 1 ? 'disabled' : ''} title="Descendre"><i data-lucide="chevron-down" style="width:12px;height:12px;"></i></button>
                                        </div>
                                        <div class="metro-event-item-content" onclick="openMetroEventModal(${event.id})">
                                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                <div style="font-weight: 600; flex: 1;">${event.title}</div>
                                                ${event.sceneId ? `<i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--accent-blue); cursor: pointer;" onclick="event.stopPropagation(); openMetroLinkedScene(${event.sceneId})" title="Scène liée"></i>` : ''}
                                            </div>
                                            <div style="color: var(--text-muted); font-size: 0.75rem;">${event.date || 'Sans date'}</div>
                                            <div style="display: flex; gap: 2px; margin-top: 4px;">
                                                ${(event.characters || []).map(charId => {
        const char = project.characters.find(c => c.id === charId);
        return char ? `<span style="width: 12px; height: 12px; border-radius: 50%; background: ${project.characterColors[charId] || '#999'};" title="${char.name}"></span>` : '';
    }).join('')}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

    // Rafraîchir les icônes Lucide pour la sidebar
    if (eventCount > 0) {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// [MVVM : View]
// Rend la vue principale de la timeline métro.
function renderTimelineVizView() {
    // Render sidebar first
    renderTimelineVizList();

    // Render main view
    const editorView = document.getElementById('editorView');
    if (!editorView) {
        console.error('editorView not found for metro timeline');
        return;
    }

    const charCount = project.characters?.length || 0;

    if (charCount === 0) {
        editorView.innerHTML = `
                    <div class="metro-empty-state">
                        <i data-lucide="users" style="width: 64px; height: 64px; opacity: 0.3;"></i>
                        <h3 style="margin: 1rem 0 0.5rem;">Aucun personnage</h3>
                        <p style="margin-bottom: 1.5rem;">Créez d'abord des personnages dans l'onglet "Personnages" pour pouvoir les lier aux évènements de votre timeline.</p>
                        <button class="btn btn-primary" onclick="switchView('characters')">Créer des personnages</button>
                    </div>
                `;
        lucide.createIcons();
        return;
    }

    editorView.innerHTML = `
                <div style="padding: 2rem;">
                    <div class="metro-toolbar">
                        <button class="btn btn-primary" onclick="openMetroEventModal()">
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                            Nouvel évènement
                        </button>
                        <button class="btn" onclick="sortMetroByDate()">
                            <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                            Trier par date
                        </button>
                        <button class="btn" onclick="exportMetroTimelineCSV()">
                            <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                            Exporter CSV
                        </button>
                        <button class="btn" onclick="clearMetroTimeline()" style="margin-left: auto;">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                            Tout effacer
                        </button>
                    </div>
                    
                    <div class="metro-timeline-container" id="metroTimelineContainer">
                        ${renderMetroSVG()}
                    </div>
                    
                    <div class="metro-legend">
                        ${project.characters.map(char => `
                            <div class="metro-legend-item" onclick="openMetroColorPicker(${char.id})" style="cursor: pointer;" title="Cliquer pour changer la couleur">
                                <div class="metro-legend-line" style="background: ${project.characterColors[char.id] || '#999'};"></div>
                                <span>${char.name}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 4px;">
                        <p style="font-size: 0.9rem; color: var(--text-secondary);">
                            💡 <strong>Utilisation:</strong> Cliquez sur les cercles pour éditer les évènements. Les petites icônes bleues 📄 permettent d'ouvrir directement la scène liée. Cliquez sur les couleurs dans la légende pour les personnaliser. Les lignes se rejoignent quand des personnages partagent un évènement.
                        </p>
                    </div>
                </div>
            `;

    lucide.createIcons();
}

// [MVVM : View]
// Génère le code SVG pour la visualisation de la timeline métro.
function renderMetroSVG() {
    const events = (project.metroTimeline || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    const characters = project.characters || [];

    if (events.length === 0) {
        return `
                    <div class="metro-empty-state">
                        <i data-lucide="train-track" style="width: 64px; height: 64px; opacity: 0.3;"></i>
                        <h3 style="margin: 1rem 0 0.5rem;">Aucun évènement</h3>
                        <p style="margin-bottom: 1.5rem;">Créez votre premier évènement pour commencer à visualiser les interactions entre personnages.</p>
                        <button class="btn btn-primary" onclick="openMetroEventModal()">+ Créer un évènement</button>
                    </div>
                `;
    }

    // Calculer les dimensions
    const rowHeight = 60;
    const eventWidth = 180;
    const leftMargin = 180;
    const topMargin = 40;
    const nodeRadius = 10;

    const svgWidth = leftMargin + (events.length * eventWidth) + 100;
    const svgHeight = Math.max(200, topMargin + (characters.length * rowHeight) + 60);

    // Générer les lignes horizontales et les paths courbes
    let pathsHTML = '';
    let nodesHTML = '';
    let labelsHTML = '';
    let characterLabelsHTML = '';

    // Pour chaque personnage, dessiner sa ligne
    characters.forEach((char, charIndex) => {
        const y = topMargin + (charIndex * rowHeight) + (rowHeight / 2);
        const color = project.characterColors[char.id] || '#999';

        // Label du personnage à gauche
        characterLabelsHTML += `
                    <g class="metro-char-label" onclick="openMetroColorPicker(${char.id})" style="cursor: pointer;">
                        <rect x="5" y="${y - 15}" width="160" height="30" fill="transparent"/>
                        <circle cx="25" cy="${y}" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                        <text x="42" y="${y + 5}" font-size="13" fill="var(--text-primary)" font-weight="500">${char.name.substring(0, 18)}${char.name.length > 18 ? '...' : ''}</text>
                    </g>
                `;

        // Trouver les évènements où ce personnage participe
        const charEvents = events.filter(e => (e.characters || []).includes(char.id));

        if (charEvents.length === 0) {
            // Ligne en pointillés si pas d'évènements
            pathsHTML += `<line x1="${leftMargin}" y1="${y}" x2="${svgWidth - 50}" y2="${y}" stroke="${color}" stroke-width="3" stroke-dasharray="5,5" opacity="0.3"/>`;
        } else {
            // Dessiner le chemin entre les évènements
            let pathD = '';
            let lastX = leftMargin;

            charEvents.forEach((event, eventIdx) => {
                const eventGlobalIdx = events.indexOf(event);
                const eventX = leftMargin + (eventGlobalIdx * eventWidth) + (eventWidth / 2);

                // Calculer Y pour cet évènement (converger vers le centre si plusieurs personnages)
                const eventChars = event.characters || [];
                const charPosInEvent = eventChars.indexOf(char.id);
                const totalCharsInEvent = eventChars.length;

                // Y central de l'évènement (moyenne des Y de tous les personnages présents)
                const avgY = eventChars.reduce((sum, cId) => {
                    const cIdx = characters.findIndex(c => c.id === cId);
                    return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
                }, 0) / totalCharsInEvent;

                const eventY = avgY;

                if (eventIdx === 0) {
                    // Premier segment: de la ligne de base vers le premier évènement
                    pathD = `M ${lastX} ${y}`;

                    // Courbe vers le point de convergence
                    const midX = (lastX + eventX) / 2;
                    pathD += ` C ${midX} ${y}, ${midX} ${eventY}, ${eventX} ${eventY}`;
                } else {
                    // Segments intermédiaires
                    const prevEvent = charEvents[eventIdx - 1];
                    const prevEventIdx = events.indexOf(prevEvent);
                    const prevX = leftMargin + (prevEventIdx * eventWidth) + (eventWidth / 2);

                    // Y du précédent évènement
                    const prevEventChars = prevEvent.characters || [];
                    const prevAvgY = prevEventChars.reduce((sum, cId) => {
                        const cIdx = characters.findIndex(c => c.id === cId);
                        return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
                    }, 0) / prevEventChars.length;

                    // Courbe du précédent vers l'actuel
                    const midX = (prevX + eventX) / 2;
                    pathD += ` C ${midX} ${prevAvgY}, ${midX} ${eventY}, ${eventX} ${eventY}`;
                }

                lastX = eventX;
            });

            // Prolonger la ligne après le dernier évènement
            const lastEvent = charEvents[charEvents.length - 1];
            const lastEventIdx = events.indexOf(lastEvent);
            const lastEventX = leftMargin + (lastEventIdx * eventWidth) + (eventWidth / 2);
            const lastEventChars = lastEvent.characters || [];
            const lastAvgY = lastEventChars.reduce((sum, cId) => {
                const cIdx = characters.findIndex(c => c.id === cId);
                return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
            }, 0) / lastEventChars.length;

            const endX = svgWidth - 50;
            const midX = (lastEventX + endX) / 2;
            pathD += ` C ${midX} ${lastAvgY}, ${midX} ${y}, ${endX} ${y}`;

            pathsHTML += `<path d="${pathD}" class="metro-line" stroke="${color}" fill="none"/>`;
        }
    });

    // Dessiner les nœuds d'évènements (par-dessus les lignes)
    events.forEach((event, eventIdx) => {
        const eventX = leftMargin + (eventIdx * eventWidth) + (eventWidth / 2);
        const eventChars = event.characters || [];

        if (eventChars.length > 0) {
            // Calculer le Y moyen
            const avgY = eventChars.reduce((sum, cId) => {
                const cIdx = characters.findIndex(c => c.id === cId);
                return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
            }, 0) / eventChars.length;

            // Nœud principal
            nodesHTML += `
                        <g class="metro-event-node" onclick="openMetroEventModal(${event.id})">
                            <circle cx="${eventX}" cy="${avgY}" r="${nodeRadius + 2}" fill="white" stroke="var(--border-color)" stroke-width="2"/>
                            <circle cx="${eventX}" cy="${avgY}" r="${nodeRadius - 2}" fill="var(--text-primary)"/>
                        </g>
                        ${event.sceneId ? `
                            <g onclick="event.stopPropagation(); openMetroLinkedScene(${event.sceneId})" style="cursor: pointer;" title="Ouvrir la scène">
                                <circle cx="${eventX + nodeRadius + 8}" cy="${avgY - nodeRadius - 8}" r="8" fill="var(--accent-blue)" stroke="white" stroke-width="1.5"/>
                                <foreignObject x="${eventX + nodeRadius + 1}" y="${avgY - nodeRadius - 15}" width="14" height="14">
                                    <div xmlns="http://www.w3.org/1999/xhtml" style="color:white; display:flex; align-items:center; justify-content:center;">
                                        <i data-lucide="file-text" style="width:10px;height:10px;"></i>
                                    </div>
                                </foreignObject>
                            </g>
                        ` : ''}
                    `;

            // Label de l'évènement
            const labelY = avgY < svgHeight / 2 ? avgY - 25 : avgY + 30;
            labelsHTML += `
                        <g class="metro-event-label-group" onclick="openMetroEventModal(${event.id})" style="cursor: pointer;">
                            <text x="${eventX}" y="${labelY}" text-anchor="middle" class="metro-event-label" font-weight="600">${event.title.substring(0, 20)}${event.title.length > 20 ? '...' : ''}</text>
                            <text x="${eventX}" y="${labelY + 14}" text-anchor="middle" class="metro-event-label" font-size="10" fill="var(--text-muted)">${event.date || ''}</text>
                        </g>
                    `;
        } else {
            // évènement sans personnages - afficher en haut
            const floatingY = topMargin - 10;
            nodesHTML += `
                        <g class="metro-event-node" onclick="openMetroEventModal(${event.id})">
                            <circle cx="${eventX}" cy="${floatingY}" r="${nodeRadius}" fill="var(--text-muted)" stroke="white" stroke-width="2"/>
                        </g>
                    `;
            labelsHTML += `
                        <g onclick="openMetroEventModal(${event.id})" style="cursor: pointer;">
                            <text x="${eventX}" y="${floatingY - 15}" text-anchor="middle" class="metro-event-label" fill="var(--text-muted)">${event.title.substring(0, 15)}...</text>
                        </g>
                    `;
        }
    });

    return `
                <svg width="${svgWidth}" height="${svgHeight}" class="metro-svg-container">
                    <!-- Fond -->
                    <rect width="100%" height="100%" fill="var(--bg-primary)"/>
                    
                    <!-- Lignes de grille légères -->
                    ${characters.map((_, i) => {
        const y = topMargin + (i * rowHeight) + (rowHeight / 2);
        return `<line x1="${leftMargin}" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="var(--border-color)" stroke-width="1" opacity="0.3" stroke-dasharray="2,4"/>`;
    }).join('')}
                    
                    <!-- Labels personnages -->
                    ${characterLabelsHTML}
                    
                    <!-- Chemins des lignes de métro -->
                    ${pathsHTML}
                    
                    <!-- Nœuds des évènements -->
                    ${nodesHTML}
                    
                    <!-- Labels des évènements -->
                    ${labelsHTML}
                </svg>
            `;
}

// [MVVM : ViewModel]
// Ouvre la modale de création ou d'édition d'un évènement métro.
function openMetroEventModal(eventId = null) {
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

    // Populate scene selector
    const sceneSelect = document.getElementById('metroEventScene');
    let sceneOptions = '<option value="">Aucune scène</option>';
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const scenePath = `${act.title} > ${chapter.title} > ${scene.title}`;
                sceneOptions += `<option value="${scene.id}">${scenePath}</option>`;
            });
        });
    });
    sceneSelect.innerHTML = sceneOptions;

    // Populate position selector
    const positionSelect = document.getElementById('metroEventPosition');
    const sortedEvents = (project.metroTimeline || []).sort((a, b) => (a.order || 0) - (b.order || 0));

    let positionOptions = '<option value="0">🔼 Au début de la timeline</option>';
    sortedEvents.forEach((evt, idx) => {
        if (!eventId || evt.id !== eventId) {
            positionOptions += `<option value="${evt.order || idx + 1}">↳ Après: ${evt.title}${evt.date ? ' (' + evt.date + ')' : ''}</option>`;
        }
    });
    positionSelect.innerHTML = positionOptions;

    // Populate character selector
    const selectorDiv = document.getElementById('metroCharactersSelector');
    selectorDiv.innerHTML = project.characters.map(char => `
                <label class="metro-char-option" data-char-id="${char.id}">
                    <input type="checkbox" value="${char.id}" onchange="updateMetroLinkedChars()">
                    <span class="metro-char-color-dot" style="background: ${project.characterColors[char.id] || '#999'};"></span>
                    <span>${char.name}</span>
                </label>
            `).join('');

    if (eventId) {
        // Edit mode
        const event = project.metroTimeline.find(e => e.id === eventId);
        if (!event) return;

        titleEl.textContent = 'Modifier l\'évènement';
        deleteBtn.style.display = '';

        document.getElementById('metroEventId').value = event.id;
        document.getElementById('metroEventTitle').value = event.title || '';
        document.getElementById('metroEventDate').value = event.date || '';
        document.getElementById('metroEventOrder').value = event.order !== undefined ? event.order : '';
        document.getElementById('metroEventDesc').value = event.description || '';
        document.getElementById('metroEventScene').value = event.sceneId || '';

        // Select current position (the event just before this one)
        const currentIdx = sortedEvents.findIndex(e => e.id === eventId);
        if (currentIdx > 0) {
            const prevEvent = sortedEvents[currentIdx - 1];
            positionSelect.value = prevEvent.order || currentIdx;
        } else {
            positionSelect.value = '0';
        }

        // Check characters
        (event.characters || []).forEach(charId => {
            const checkbox = selectorDiv.querySelector(`input[value="${charId}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.metro-char-option').classList.add('selected');
            }
        });
    } else {
        // Create mode
        titleEl.textContent = 'Nouvel évènement';
        deleteBtn.style.display = 'none';

        // Default position = at the end
        if (sortedEvents.length > 0) {
            const lastEvent = sortedEvents[sortedEvents.length - 1];
            positionSelect.value = lastEvent.order || sortedEvents.length;
        } else {
            positionSelect.value = '0';
        }
        document.getElementById('metroEventOrder').value = sortedEvents.length + 1;
    }

    updateMetroLinkedChars();
    modal.classList.add('active');
    document.getElementById('metroEventTitle').focus();
}

// [MVVM : ViewModel]
// Met à jour l'affichage des personnages liés dans la modale d'évènement.
function updateMetroLinkedChars() {
    const selectorDiv = document.getElementById('metroCharactersSelector');
    const linkedDiv = document.getElementById('metroLinkedChars');

    const checked = Array.from(selectorDiv.querySelectorAll('input:checked'));

    // Update visual selection
    selectorDiv.querySelectorAll('.metro-char-option').forEach(opt => {
        const checkbox = opt.querySelector('input');
        opt.classList.toggle('selected', checkbox.checked);
    });

    // Update linked tags
    linkedDiv.innerHTML = checked.map(cb => {
        const charId = parseInt(cb.value);
        const char = project.characters.find(c => c.id === charId);
        if (!char) return '';
        const color = project.characterColors[charId] || '#999';
        return `
                    <span class="metro-linked-char-tag" style="background: ${color};">
                        ${char.name}
                        <span class="remove-char" onclick="removeMetroCharFromEvent(${charId})"><i data-lucide="x" style="width:10px;height:10px;vertical-align:middle;"></i></span>
                    </span>
                `;
    }).join('');
}

// [MVVM : ViewModel]
// Retire un personnage de la sélection dans la modale d'évènement.
function removeMetroCharFromEvent(charId) {
    const selectorDiv = document.getElementById('metroCharactersSelector');
    const checkbox = selectorDiv.querySelector(`input[value="${charId}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateMetroLinkedChars();
    }
}

// [MVVM : ViewModel]
// Enregistre les modifications d'un évènement métro.
function saveMetroEvent() {
    const eventId = document.getElementById('metroEventId').value;
    const title = document.getElementById('metroEventTitle').value.trim();
    const date = document.getElementById('metroEventDate').value.trim();
    const positionAfter = parseFloat(document.getElementById('metroEventPosition').value) || 0;
    const description = document.getElementById('metroEventDesc').value.trim();
    const sceneIdValue = document.getElementById('metroEventScene').value;
    const sceneId = sceneIdValue ? parseInt(sceneIdValue) : null;

    if (!title) {
        alert('Le titre est obligatoire');
        return;
    }

    // Get selected characters
    const selectorDiv = document.getElementById('metroCharactersSelector');
    const characters = Array.from(selectorDiv.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));

    if (!project.metroTimeline) {
        project.metroTimeline = [];
    }

    // Calculate new order based on position selection
    // positionAfter = 0 means "at the beginning"
    // positionAfter = N means "after the event with order N"
    let newOrder;
    if (positionAfter === 0) {
        newOrder = 0.5; // Will be normalized to 1 after reordering
    } else {
        newOrder = positionAfter + 0.5; // Insert after the selected event
    }

    if (eventId) {
        // Update existing
        const event = project.metroTimeline.find(e => e.id === parseInt(eventId));
        if (event) {
            event.title = title;
            event.date = date;
            event.order = newOrder;
            event.description = description;
            event.characters = characters;
            event.sceneId = sceneId;
        }
        showNotification('✓ évènement mis à jour');
    } else {
        // Create new
        project.metroTimeline.push({
            id: Date.now(),
            title,
            date,
            order: newOrder,
            description,
            characters,
            sceneId: sceneId
        });
        showNotification('✓ évènement créé');
    }

    // Reorder all events to have clean sequential numbers
    normalizeMetroEventOrder();

    saveProject();
    closeModal('metroEventModal');

    // Check if we're in split-view mode
    if (splitViewActive && (splitViewState.left.view === 'timelineviz' || splitViewState.right.view === 'timelineviz')) {
        // Refresh the split panel(s) showing timeline
        if (splitViewState.left.view === 'timelineviz') {
            renderSplitPanelViewContent('left');
        }
        if (splitViewState.right.view === 'timelineviz') {
            renderSplitPanelViewContent('right');
        }
        // Also refresh the editor panel if it's showing a scene (to update the timeline badge)
        if (splitViewState.left.view === 'editor' && splitViewState.left.sceneId) {
            renderSplitPanelViewContent('left');
        }
        if (splitViewState.right.view === 'editor' && splitViewState.right.sceneId) {
            renderSplitPanelViewContent('right');
        }
    } else if (currentView === 'timelineviz') {
        // Normal full-screen timeline view
        renderTimelineVizView();
    } else if (currentSceneId && currentView === 'editor') {
        // Normal full-screen editor view - refresh to show the new link
        const act = project.acts.find(a => a.id === currentActId);
        const chapter = act?.chapters.find(c => c.id === currentChapterId);
        const scene = chapter?.scenes.find(s => s.id === currentSceneId);
        if (act && chapter && scene) {
            renderEditor(act, chapter, scene);
        }
    }
}

// [MVVM : Model]
// Réorganise les ordres des évènements pour qu'ils soient séquentiels.
function normalizeMetroEventOrder() {
    // Sort by current order
    project.metroTimeline.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Reassign clean sequential numbers (1, 2, 3, ...)
    project.metroTimeline.forEach((event, i) => {
        event.order = i + 1;
    });
}

// [MVVM : ViewModel]
// Déplace un évènement vers le haut ou le bas dans l'ordre.
function moveMetroEvent(eventId, direction) {
    // direction: -1 = monter, 1 = descendre
    const sortedEvents = project.metroTimeline.sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sortedEvents.findIndex(e => e.id === eventId);

    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;

    // Vérifier les limites
    if (newIndex < 0 || newIndex >= sortedEvents.length) return;

    // Échanger les positions
    const temp = sortedEvents[currentIndex];
    sortedEvents[currentIndex] = sortedEvents[newIndex];
    sortedEvents[newIndex] = temp;

    // Mettre à jour les ordres
    sortedEvents.forEach((event, i) => {
        event.order = i + 1;
    });

    project.metroTimeline = sortedEvents;

    saveProject();
    refreshTimelineView();
}

// [MVVM : ViewModel]
// Supprime un évènement de la timeline métro.
function deleteMetroEvent() {
    const eventId = document.getElementById('metroEventId').value;
    if (!eventId) return;

    if (!confirm('Supprimer cet évènement ?')) return;

    project.metroTimeline = project.metroTimeline.filter(e => e.id !== parseInt(eventId));
    saveProject();
    closeModal('metroEventModal');

    // Check if we're in split-view mode
    if (splitViewActive && (splitViewState.left.view === 'timelineviz' || splitViewState.right.view === 'timelineviz')) {
        // Refresh the split panel(s) showing timeline
        if (splitViewState.left.view === 'timelineviz') {
            renderSplitPanelViewContent('left');
        }
        if (splitViewState.right.view === 'timelineviz') {
            renderSplitPanelViewContent('right');
        }
    } else if (currentView === 'timelineviz') {
        // Normal full-screen timeline view
        renderTimelineVizView();
    }

    showNotification('✓ évènement supprimé');
}

// [MVVM : ViewModel]
// Ouvre la scène liée à un évènement dans l'éditeur.
function openMetroLinkedScene(sceneId) {
    // Find the scene
    let foundScene = null;
    let foundChapter = null;
    let foundAct = null;

    for (const act of project.acts) {
        for (const chapter of act.chapters) {
            const scene = chapter.scenes.find(s => s.id === sceneId);
            if (scene) {
                foundScene = scene;
                foundChapter = chapter;
                foundAct = act;
                break;
            }
        }
        if (foundScene) break;
    }

    if (!foundScene) {
        showNotification('❌ Scène introuvable', 'error');
        return;
    }

    // Switch to editor view and open the scene
    switchView('editor');

    // Use the proper openScene function which handles everything
    setTimeout(() => {
        openScene(foundAct.id, foundChapter.id, foundScene.id);
        showNotification(`📄 Scène ouverte : ${foundScene.title}`);
    }, 100);
}

// [MVVM : ViewModel]
// Affiche la modale de choix de vue lors de l'ouverture d'un évènement depuis l'éditeur.
function openMetroEventFromScene(eventId) {
    // Store the event ID and show the choice modal
    document.getElementById('metroViewChoiceEventId').value = eventId;
    document.getElementById('metroViewChoiceModal').classList.add('active');

    // Refresh icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 50);
}

// [MVVM : ViewModel]
// Bascule vers la vue complète de la timeline pour un évènement donné.
function openMetroEventFullView() {
    const eventId = parseInt(document.getElementById('metroViewChoiceEventId').value);
    closeModal('metroViewChoiceModal');

    // Switch to timeline viz view properly
    currentView = 'timelineviz';

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const timelineBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn =>
        btn.textContent.includes('Timeline') || btn.onclick?.toString().includes('timelineviz')
    );
    if (timelineBtn) timelineBtn.classList.add('active');

    // Hide all sidebar lists
    const sidebarLists = [
        'chaptersList', 'charactersList', 'worldList', 'timelineList',
        'notesList', 'codexList', 'statsList', 'versionsList', 'analysisList',
        'todosList', 'corkboardList', 'mindmapList', 'plotList',
        'relationsList', 'mapList', 'timelineVizList'
    ];

    sidebarLists.forEach(listId => {
        const el = document.getElementById(listId);
        if (el) el.style.display = 'none';
    });

    // Show the timelineVizList sidebar
    const timelineVizList = document.getElementById('timelineVizList');
    if (timelineVizList) timelineVizList.style.display = 'block';

    // Render the timeline viz view completely
    renderTimelineVizView();

    // Wait for rendering to complete, then open the modal
    setTimeout(() => {
        // Ensure icons are rendered
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        // Open the event modal
        setTimeout(() => {
            openMetroEventModal(eventId);
        }, 100);
    }, 300);
}

// [MVVM : ViewModel]
// Ouvre la timeline métro en vue partagée (split view).
function openMetroEventSplitView() {
    const eventId = parseInt(document.getElementById('metroViewChoiceEventId').value);
    closeModal('metroViewChoiceModal');

    // Enable split view if not already active
    if (!splitViewActive) {
        toggleSplitView();
    }

    // Set the right panel to show timeline viz
    splitViewState.right.view = 'timelineviz';
    splitActivePanel = 'right';

    // Update the header to show "Timeline" instead of "Vide"
    updateSplitPanelHeader('right');

    // Render the right panel with timeline
    renderSplitPanelViewContent('right');

    // Wait for rendering, then open the event modal
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        setTimeout(() => {
            openMetroEventModal(eventId);
        }, 100);
    }, 300);

    saveSplitViewState();
}

// [MVVM : ViewModel]
// Ouvre le sélecteur de couleur pour un personnage.
function openMetroColorPicker(charId) {
    const char = project.characters.find(c => c.id === charId);
    if (!char) return;

    document.getElementById('metroColorCharId').value = charId;
    document.getElementById('metroColorCharName').textContent = char.name;

    const currentColor = project.characterColors[charId] || '#999';
    document.getElementById('metroCustomColor').value = currentColor;

    // Highlight current color
    document.querySelectorAll('.metro-color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === currentColor);
    });

    document.getElementById('metroColorModal').classList.add('active');
}

// [MVVM : ViewModel]
// Sélectionne une couleur dans le sélecteur de couleur.
function selectMetroColor(color) {
    document.getElementById('metroCustomColor').value = color;
    document.querySelectorAll('.metro-color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === color);
    });
}

// [MVVM : ViewModel]
// Applique la couleur sélectionnée au personnage et met à jour le modèle.
function applyMetroColor() {
    const charId = parseInt(document.getElementById('metroColorCharId').value);
    const color = document.getElementById('metroCustomColor').value;

    if (!project.characterColors) {
        project.characterColors = {};
    }

    project.characterColors[charId] = color;
    saveProject();
    closeModal('metroColorModal');
    refreshTimelineView();
    showNotification('✓ Couleur mise à jour');
}

// Helper function to refresh timeline view (works in both normal and split view)
// [MVVM : ViewModel]
// Rafraîchit l'affichage de la timeline (vue normale ou partagée).
function refreshTimelineView() {
    if (splitViewActive) {
        // In split view, refresh the active panel
        if (splitActivePanel === 'left' && splitViewState.left.view === 'timelineviz') {
            renderSplitPanelViewContent('left');
        } else if (splitActivePanel === 'right' && splitViewState.right.view === 'timelineviz') {
            renderSplitPanelViewContent('right');
        } else {
            // If neither panel is showing timeline, just render normally
            renderTimelineVizView();
        }
    } else {
        // Normal view
        renderTimelineVizView();
    }
}

// [MVVM : ViewModel]
// Trie la timeline métro par date.
function sortMetroByDate() {
    if (!project.metroTimeline || project.metroTimeline.length === 0) {
        showNotification('Aucun évènement à trier');
        return;
    }

    // Helper function to parse date in DD/MM/YYYY format
    // [MVVM : Other]
    // Group: Util / Helper | Naming: DateUtils
    // Analyse une date réelle au format JJ/MM/AAAA.
    function parseRealDate(dateStr) {
        if (!dateStr || !dateStr.trim()) return null;

        const trimmed = dateStr.trim();
        const parts = trimmed.split('/');

        if (parts.length < 2 || parts.length > 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parts[2] ? parseInt(parts[2], 10) : null;

        if (isNaN(day) || isNaN(month)) return null;
        if (year === null) return null;

        // Handle 2-digit years (assume 1900-1999 for < 50, 2000-2099 for >= 50)
        if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
        }

        // Create date object (month is 0-indexed in JavaScript Date)
        const date = new Date(year, month - 1, day);

        // Validate the date
        if (isNaN(date.getTime())) return null;

        return date;
    }

    // Helper function to extract a numeric value from fictional dates
    // Handles: "An 2157", "Année 5", "Year 42", "2157", "-500" (BCE), etc.
    // [MVVM : Other]
    // Group: Util / Helper | Naming: DateUtils
    // Extrait l'année d'une chaîne de caractères (pour calendriers fictifs).
    function extractYearNumber(dateStr) {
        if (!dateStr || !dateStr.trim()) return null;

        const trimmed = dateStr.trim();

        // Try to match patterns like "An 2157", "Année 5", "Year 42"
        const yearMatch = trimmed.match(/(?:an|année|year|yr)\s*[:\-]?\s*(-?\d+)/i);
        if (yearMatch) {
            return parseInt(yearMatch[1], 10);
        }

        // Try to match pure numbers (with optional negative for BCE)
        const numberMatch = trimmed.match(/^(-?\d+)/);
        if (numberMatch) {
            return parseInt(numberMatch[1], 10);
        }

        return null;
    }

    // Sort by date (events without valid dates go to the end)
    project.metroTimeline.sort((a, b) => {
        const dateStrA = (a.date || '').trim();
        const dateStrB = (b.date || '').trim();

        // Without date = at the end
        if (!dateStrA && !dateStrB) return 0;
        if (!dateStrA) return 1;
        if (!dateStrB) return -1;

        // Try to parse as real dates first (DD/MM/YYYY)
        const realDateA = parseRealDate(dateStrA);
        const realDateB = parseRealDate(dateStrB);

        if (realDateA && realDateB) {
            return realDateA.getTime() - realDateB.getTime();
        }

        // If one is real date and other is not, real date comes first
        if (realDateA) return -1;
        if (realDateB) return 1;

        // Try to extract year numbers for fictional calendars
        const yearA = extractYearNumber(dateStrA);
        const yearB = extractYearNumber(dateStrB);

        if (yearA !== null && yearB !== null) {
            return yearA - yearB;
        }

        // If one has a year number and other doesn't, number comes first
        if (yearA !== null) return -1;
        if (yearB !== null) return 1;

        // Fallback to alphabetical sorting
        return dateStrA.localeCompare(dateStrB);
    });

    // Reassign orders sequentially
    project.metroTimeline.forEach((event, i) => {
        event.order = i + 1;
    });

    saveProject();
    refreshTimelineView();
    showNotification('✓ Timeline triée par date');
}

// [MVVM : ViewModel]
// Efface tous les évènements de la timeline métro.
function clearMetroTimeline() {
    if (!project.metroTimeline || project.metroTimeline.length === 0) {
        showNotification('La timeline est déjà vide');
        return;
    }

    if (confirm(`Effacer les ${project.metroTimeline.length} évènement(s) de la timeline ?`)) {
        project.metroTimeline = [];
        saveProject();
        refreshTimelineView();
        showNotification('✓ Timeline effacée');
    }
}

// [MVVM : ViewModel]
// Exporte la timeline métro au format CSV.
function exportMetroTimelineCSV() {
    if (!project.metroTimeline || project.metroTimeline.length === 0) {
        alert('Aucun évènement à exporter');
        return;
    }

    let csv = 'Ordre,Titre,Date,Description,Personnages\n';

    project.metroTimeline.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(event => {
        const charNames = (event.characters || []).map(cId => {
            const char = project.characters.find(c => c.id === cId);
            return char ? char.name : '';
        }).filter(n => n).join('; ');

        csv += `${event.order || ''},${escapeCSVField(event.title)},${escapeCSVField(event.date || '')},${escapeCSVField(event.description || '')},${escapeCSVField(charNames)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}_metro_timeline.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification(`✓ ${project.metroTimeline.length} évènement(s) exporté(s)`);
}

// Legacy functions for old timeline (keeping for backward compatibility)
// [MVVM : ViewModel]
// Ajoute un évènement (legacy).
function addTimelineVizEvent() {
    openMetroEventModal();
}

// [MVVM : ViewModel]
// Modifie un évènement (legacy).
function editTimelineVizEvent(id) {
    // Try to find in new metro timeline first
    if (project.metroTimeline && project.metroTimeline.find(e => e.id === id)) {
        openMetroEventModal(id);
        return;
    }
    // Fallback to old visual timeline
    const event = project.visualTimeline?.find(e => e.id === id);
    if (!event) return;

    const newTitle = prompt('Modifier le titre:', event.title);
    if (newTitle === null) return;

    if (newTitle.trim() !== '') {
        event.title = newTitle.trim();

        const newDate = prompt('Modifier la date:', event.date);
        if (newDate !== null) {
            event.date = newDate.trim();
        }

        const newDesc = prompt('Modifier la description:', event.description);
        if (newDesc !== null) {
            event.description = newDesc.trim();
        }

        saveProject();
        refreshTimelineView();
        showNotification('✓ évènement mis à jour');
    }
}

// [MVVM : ViewModel]
// Trie par date (legacy).
function sortTimelineByDate() {
    sortMetroTimeline();
}

// [MVVM : ViewModel]
// Efface la timeline (legacy).
function clearTimeline() {
    clearMetroTimeline();
}

// [MVVM : ViewModel]
// Exporte la timeline (legacy).
function exportTimelineViz() {
    exportMetroTimelineCSV();
}

// ============================================
// IMPORT/EXPORT CSV POUR TIMELINE (Legacy)
// ============================================

// [MVVM : ViewModel]
// Importe des évènements depuis un fichier CSV.
function importTimelineCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                parseMetroTimelineCSV(event.target.result);
            } catch (error) {
                alert('Erreur lors de la lecture du fichier CSV:\n' + error.message);
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// [MVVM : ViewModel]
// Analyse le contenu d'un CSV d'importation.
function parseMetroTimelineCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        alert('Le fichier CSV est vide');
        return;
    }

    // Skip header if present
    const header = lines[0].toLowerCase();
    if (header.includes('titre') || header.includes('title') || header.includes('ordre') || header.includes('order')) {
        lines.shift();
    }

    if (lines.length === 0) {
        alert('Le fichier CSV ne contient aucun évènement');
        return;
    }

    if (!confirm(`Importer ${lines.length} évènement(s) ? Les évènements existants seront conservés.`)) {
        return;
    }

    if (!project.metroTimeline) {
        project.metroTimeline = [];
    }

    let imported = 0;
    const maxOrder = Math.max(0, ...project.metroTimeline.map(e => e.order || 0));

    lines.forEach((line, idx) => {
        const parts = parseCSVLine(line);
        const title = parts[1]?.trim() || parts[0]?.trim() || '';

        if (title) {
            project.metroTimeline.push({
                id: Date.now() + idx,
                order: maxOrder + idx + 1,
                title: title,
                date: parts[2]?.trim() || '',
                description: parts[3]?.trim() || '',
                characters: []
            });
            imported++;
        }
    });

    saveProject();
    refreshTimelineView();
    showNotification(`✓ ${imported} évènement(s) importé(s)`);
}

// [MVVM : Other]
// Group: Util / Helper | Naming: CSVUtils
// Analyse une ligne CSV en tenant compte des guillemets.
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

// [MVVM : ViewModel]
// Exporte au format CSV (legacy).
function exportTimelineCSV() {
    exportMetroTimelineCSV();
}

// [MVVM : Other]
// Group: Util / Helper | Naming: CSVUtils
// Échappe les champs pour l'exportation CSV.
function escapeCSVField(field) {
    if (!field) return '""';

    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        field = field.replace(/"/g, '""');
        return `"${field}"`;
    }

    return field;
}
