/**
 * @class MetroTimelineView
 * @description Gère l'affichage de la timeline métro.
 */
class MetroTimelineView {
    /**
     * Rend la liste latérale (sidebar) des événements.
     */
    static renderTimelineVizList() {
        const container = document.getElementById('timelineVizList');
        if (!container) return;

        const events = MetroTimelineRepository.getAll();
        const eventCount = events.length;
        const charCount = project.characters?.length || 0;

        container.innerHTML = `
            <div class="metro-sidebar-content" style="padding: 1.25rem;">
                <h3 style="margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem; font-family: 'Noto Serif JP', serif;">
                    <i data-lucide="train-track" style="width: 22px; height: 22px; color: var(--accent-gold);"></i>
                    ${Localization.t('metro.title')}
                </h3>
                
                <div class="metro-stats" style="font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-secondary); padding: 0.75rem; border-radius: 8px; margin-bottom: 1.25rem;">
                    <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
                        <span><i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:6px; opacity: 0.7;"></i> ${Localization.t('metro.stats.events')}</span>
                        <strong style="color: var(--text-primary);">${eventCount}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:6px; opacity: 0.7;"></i> ${Localization.t('metro.stats.chars')}</span>
                        <strong style="color: var(--text-primary);">${charCount}</strong>
                    </div>
                </div>

                <button class="btn btn-primary" id="btn-new-metro-event-sidebar" style="width: 100%; margin-bottom: 1.5rem; justify-content: center;">
                    <i data-lucide="plus-circle" style="width: 16px; height: 16px; margin-right: 6px;"></i> ${Localization.t('metro.btn.new_event')}
                </button>

                ${eventCount > 0 ? `
                    <div style="margin-top: 1rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color);">
                        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">
                            ${Localization.t('metro.list.title')}
                        </div>
                        <div id="metroEventsList" class="metro-events-sortable">
                            ${events.map((event, i, arr) => `
                                <div class="metro-event-item" data-event-id="${event.id}">
                                    <div class="metro-event-reorder-btns">
                                        <button class="metro-reorder-btn btn-move-event-up" data-id="${event.id}" ${i === 0 ? 'disabled' : ''} title="Monter"><i data-lucide="chevron-up" style="width:14px;height:14px;"></i></button>
                                        <button class="metro-reorder-btn btn-move-event-down" data-id="${event.id}" ${i === arr.length - 1 ? 'disabled' : ''} title="Descendre"><i data-lucide="chevron-down" style="width:14px;height:14px;"></i></button>
                                    </div>
                                    <div class="metro-event-item-content btn-edit-event" data-id="${event.id}">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2px;">
                                                <div class="metro-event-item-title" style="flex: 1;">${event.title}</div>
                                                ${event.sceneId ? `<i data-lucide="file-text" class="btn-open-linked-scene" data-scene-id="${event.sceneId}" style="width: 14px; height: 14px; color: var(--accent-blue); cursor: pointer;" title="${Localization.t('metro.event.linked_scene')}"></i>` : ''}
                                            </div>
                                            <div class="metro-event-item-date">${event.date || Localization.t('metro.event.no_date')}</div>
                                            <div style="display: flex; gap: 4px; margin-top: 6px;">
                                                ${(event.characters || []).map(charId => {
            const char = project.characters.find(c => c.id === charId);
            const color = MetroTimelineRepository.getCharacterColor(charId);
            return char ? `<span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 1px 2px rgba(0,0,0,0.2);" title="${char.name}"></span>` : '';
        }).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        MetroTimelineHandlers.bindSidebarHandlers();
    }

    /**
     * Rend la vue principale.
     */
    static renderTimelineVizView() {
        this.renderTimelineVizList();

        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        const characters = project.characters || [];
        if (characters.length === 0) {
            editorView.innerHTML = `
                <div class="metro-empty-state">
                    <i data-lucide="users" style="width: 64px; height: 64px; opacity: 0.3;"></i>
                    <h3 style="margin: 1rem 0 0.5rem;">${Localization.t('metro.empty.chars.title')}</h3>
                    <p style="margin-bottom: 1.5rem;">${Localization.t('metro.empty.chars.desc')}</p>
                    <button class="btn btn-primary" onclick="switchView('characters')">${Localization.t('metro.empty.chars.btn')}</button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        editorView.innerHTML = `
            <div style="padding: 2rem;">
                <div class="metro-toolbar">
                    <button class="btn btn-primary" id="btn-new-metro-event-main">
                        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                        ${Localization.t('metro.btn.new_event')}
                    </button>
                    <button class="btn" id="btn-sort-metro-date">
                        <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                        ${Localization.t('metro.toolbar.sort_date')}
                    </button>
                    <button class="btn" id="btn-export-metro-csv">
                        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                        ${Localization.t('metro.toolbar.export_csv')}
                    </button>
                    <button class="btn" id="btn-clear-metro-timeline" style="margin-left: auto;">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                        ${Localization.t('metro.toolbar.clear_all')}
                    </button>
                </div>
                
                <div class="metro-timeline-container" id="metroTimelineContainer">
                    ${this.renderMetroSVG()}
                </div>
                
                <div class="metro-legend">
                    ${characters.map(char => {
            const color = MetroTimelineRepository.getCharacterColor(char.id);
            return `
                            <div class="metro-legend-item btn-color-picker" data-id="${char.id}" style="cursor: pointer;" title="${Localization.t('metro.legend.color_help')}">
                                <div class="metro-legend-line" style="background: ${color};"></div>
                                <span>${char.name}</span>
                            </div>
                        `;
        }).join('')}
                </div>
                
                <div class="metro-help-box" style="margin-top: 2rem; padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--accent-gold); box-shadow: 0 4px 12px var(--shadow);">
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                        <i data-lucide="info" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 8px; color: var(--accent-gold);"></i>
                        <strong>${Localization.t('metro.tips.title')}</strong>
                        ${Localization.t('metro.tips.desc')}
                    </p>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        MetroTimelineHandlers.bindMainViewHandlers();
    }

    /**
     * Génère le code SVG.
     */
    static renderMetroSVG() {
        const events = MetroTimelineRepository.getAll();
        const characters = project.characters || [];

        if (events.length === 0) {
            return `
                <div class="metro-empty-state">
                    <i data-lucide="train-track" style="width: 64px; height: 64px; opacity: 0.3;"></i>
                    <h3 style="margin: 1rem 0 0.5rem;">${Localization.t('metro.empty.events.title')}</h3>
                    <p style="margin-bottom: 1.5rem;">${Localization.t('metro.empty.events.desc')}</p>
                    <button class="btn btn-primary" id="btn-create-first-event">${Localization.t('metro.empty.events.btn')}</button>
                </div>
            `;
        }

        const rowHeight = 60;
        const eventWidth = 180;
        const leftMargin = 180;
        const topMargin = 40;
        const nodeRadius = 10;

        const svgWidth = leftMargin + (events.length * eventWidth) + 100;
        const svgHeight = Math.max(200, topMargin + (characters.length * rowHeight) + 60);

        let pathsHTML = '';
        let nodesHTML = '';
        let labelsHTML = '';
        let characterLabelsHTML = '';

        characters.forEach((char, charIndex) => {
            const y = topMargin + (charIndex * rowHeight) + (rowHeight / 2);
            const color = MetroTimelineRepository.getCharacterColor(char.id);

            characterLabelsHTML += `
                <g class="metro-char-label btn-color-picker" data-id="${char.id}" style="cursor: pointer;" title="${Localization.t('metro.legend.color_help')}">
                    <rect x="5" y="${y - 15}" width="160" height="30" fill="transparent"/>
                    <circle cx="25" cy="${y}" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                    <text x="42" y="${y + 5}" font-size="13" fill="var(--text-primary)" font-weight="500">${char.name.substring(0, 18)}${char.name.length > 18 ? '...' : ''}</text>
                </g>
            `;

            const charEvents = events.filter(e => (e.characters || []).includes(char.id));

            if (charEvents.length === 0) {
                pathsHTML += `<line x1="${leftMargin}" y1="${y}" x2="${svgWidth - 50}" y2="${y}" stroke="${color}" stroke-width="3" stroke-dasharray="5,5" opacity="0.3"/>`;
            } else {
                let pathD = '';
                let lastX = leftMargin;

                charEvents.forEach((event, eventIdx) => {
                    const eventGlobalIdx = events.indexOf(events.find(e => e.id === event.id));
                    const eventX = leftMargin + (eventGlobalIdx * eventWidth) + (eventWidth / 2);
                    const eventChars = event.characters || [];

                    const avgY = eventChars.reduce((sum, cId) => {
                        const cIdx = characters.findIndex(c => c.id === cId);
                        return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
                    }, 0) / eventChars.length;

                    const eventY = avgY;

                    if (eventIdx === 0) {
                        pathD = `M ${lastX} ${y}`;
                        const midX = (lastX + eventX) / 2;
                        pathD += ` C ${midX} ${y}, ${midX} ${eventY}, ${eventX} ${eventY}`;
                    } else {
                        const prevEvent = charEvents[eventIdx - 1];
                        const prevEventIdx = events.indexOf(events.find(e => e.id === prevEvent.id));
                        const prevX = leftMargin + (prevEventIdx * eventWidth) + (eventWidth / 2);
                        const prevEventChars = prevEvent.characters || [];
                        const prevAvgY = prevEventChars.reduce((sum, cId) => {
                            const cIdx = characters.findIndex(c => c.id === cId);
                            return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
                        }, 0) / prevEventChars.length;

                        const midX = (prevX + eventX) / 2;
                        pathD += ` C ${midX} ${prevAvgY}, ${midX} ${eventY}, ${eventX} ${eventY}`;
                    }
                    lastX = eventX;
                });

                const lastEvent = charEvents[charEvents.length - 1];
                const lastEventIdx = events.indexOf(events.find(e => e.id === lastEvent.id));
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

        events.forEach((event, eventIdx) => {
            const eventX = leftMargin + (eventIdx * eventWidth) + (eventWidth / 2);
            const eventChars = event.characters || [];

            if (eventChars.length > 0) {
                const avgY = eventChars.reduce((sum, cId) => {
                    const cIdx = characters.findIndex(c => c.id === cId);
                    return sum + (cIdx >= 0 ? topMargin + (cIdx * rowHeight) + (rowHeight / 2) : 0);
                }, 0) / eventChars.length;

                nodesHTML += `
                    <g class="metro-event-node btn-edit-event" data-id="${event.id}">
                        <circle cx="${eventX}" cy="${avgY}" r="${nodeRadius + 2}" fill="white" stroke="var(--border-color)" stroke-width="2"/>
                        <circle cx="${eventX}" cy="${avgY}" r="${nodeRadius - 2}" fill="var(--text-primary)"/>
                    </g>
                    ${event.sceneId ? `
                        <g class="btn-open-linked-scene" data-scene-id="${event.sceneId}" style="cursor: pointer;" title="${Localization.t('metro.svg.open_scene')}">
                            <circle cx="${eventX + nodeRadius + 8}" cy="${avgY - nodeRadius - 8}" r="8" fill="var(--accent-blue)" stroke="white" stroke-width="1.5"/>
                            <foreignObject x="${eventX + nodeRadius + 1}" y="${avgY - nodeRadius - 15}" width="14" height="14">
                                <div xmlns="http://www.w3.org/1999/xhtml" style="color:white; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="file-text" style="width:10px;height:10px;"></i>
                                </div>
                            </foreignObject>
                        </g>
                    ` : ''}
                `;

                const labelY = avgY < svgHeight / 2 ? avgY - 25 : avgY + 30;
                labelsHTML += `
                    <g class="metro-event-label-group btn-edit-event" data-id="${event.id}" style="cursor: pointer;">
                        <text x="${eventX}" y="${labelY}" text-anchor="middle" class="metro-event-label" font-weight="600">${event.title.substring(0, 20)}${event.title.length > 20 ? '...' : ''}</text>
                        <text x="${eventX}" y="${labelY + 14}" text-anchor="middle" class="metro-event-label" font-size="10" fill="var(--text-muted)">${event.date || ''}</text>
                    </g>
                `;
            } else {
                const floatingY = topMargin - 10;
                nodesHTML += `
                    <g class="metro-event-node btn-edit-event" data-id="${event.id}">
                        <circle cx="${eventX}" cy="${floatingY}" r="${nodeRadius}" fill="var(--text-muted)" stroke="white" stroke-width="2"/>
                    </g>
                `;
                labelsHTML += `
                    <g class="btn-edit-event" data-id="${event.id}" style="cursor: pointer;">
                        <text x="${eventX}" y="${floatingY - 15}" text-anchor="middle" class="metro-event-label" fill="var(--text-muted)">${event.title.substring(0, 15)}...</text>
                    </g>
                `;
            }
        });

        return `
            <svg width="${svgWidth}" height="${svgHeight}" class="metro-svg-container">
                <rect width="100%" height="100%" fill="var(--bg-primary)"/>
                ${characters.map((_, i) => {
            const y = topMargin + (i * rowHeight) + (rowHeight / 2);
            return `<line x1="${leftMargin}" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="var(--border-color)" stroke-width="1" opacity="0.3" stroke-dasharray="2,4"/>`;
        }).join('')}
                ${characterLabelsHTML}
                ${pathsHTML}
                ${nodesHTML}
                ${labelsHTML}
            </svg>
        `;
    }
}
