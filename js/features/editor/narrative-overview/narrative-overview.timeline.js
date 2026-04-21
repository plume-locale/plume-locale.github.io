class="character-section"/**
 * Narrative Overview - Horizontal Visual Timeline
 * 
 * Visualizes the story structure (Acts and Beats) proportionally 
 * to word counts in a horizontal bar below the header.
 */

const NarrativeOverviewTimeline = {
    containerId: 'narrativeVisualTimeline',
    wrapperId: 'narrativeVisualTimelineWrapper',

    /**
     * Initializes the timeline visibility state
     */
    init() {
        const savedVisibility = localStorage.getItem('plume_narrative_timeline_visible');
        // Par défaut, afficher la timeline si pas encore de préférence
        const isCollapsed = savedVisibility === 'false';

        const wrapper = document.getElementById(this.wrapperId);
        if (wrapper && isCollapsed) {
            wrapper.classList.add('collapsed');
        }

        this.refresh();
    },

    /**
     * Toggles the collapse state of the timeline
     */
    toggle() {
        const wrapper = document.getElementById(this.wrapperId);
        if (!wrapper) {
            console.error('[Timeline] Wrapper not found:', this.wrapperId);
            return;
        }

        const isCollapsed = wrapper.classList.toggle('collapsed');
        localStorage.setItem('plume_narrative_timeline_visible', (!isCollapsed).toString());

        console.log('[Timeline] Toggled. Collapsed:', isCollapsed);
    },

    /**
     * Renders the timeline based on current project data
     */
    refresh() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const viewModel = window.narrativeOverviewViewModel;
        if (!viewModel) return;

        const passagesByAct = viewModel.getPassagesByAct();

        // Calculate total words from what we have to be sure it's consistent
        let totalWordsCalculated = 0;
        let totalChapters = 0;
        passagesByAct.forEach(act => {
            act.passages.forEach(p => {
                totalWordsCalculated += (p.wordCount || 0);
            });
            // Approximate chapters
            const chapterIds = new Set(act.passages.filter(p => p.chapterId).map(p => p.chapterId));
            totalChapters += chapterIds.size;
        });

        const totalWords = totalWordsCalculated || 1;

        // Render Container
        let html = `
            <div class="timeline-header">
                <span class="timeline-title">
                    <i data-lucide="map" class="timeline-title-icon"></i>
                    Structure Narrative
                </span>
                <span class="timeline-stats">${totalWords} mots</span>
            </div>
            
            <div class="timeline-visual-container">
                <!-- Row 1: Act Segments -->
                <div class="timeline-acts-row">
        `;

        const actColors = [
            'rgba(186, 230, 253, 0.4)', // Light Blue
            'rgba(254, 240, 138, 0.4)', // Yellow
            'rgba(254, 215, 170, 0.4)', // Orange
            'rgba(187, 247, 208, 0.4)', // Green
            'rgba(254, 202, 202, 0.4)', // Red
            'rgba(233, 213, 255, 0.4)', // Purple
            'rgba(191, 219, 254, 0.4)'  // Blue
        ];

        let currentWordOffset = 0;

        passagesByAct.forEach((actGroup, index) => {
            const actWordCount = actGroup.passages.reduce((sum, p) => sum + (p.wordCount || 0), 0);
            const widthPercent = (actWordCount / totalWords) * 100;
            const color = actColors[index % actColors.length];

            html += `
                <div class="timeline-act-segment" style="width: ${widthPercent}%; background-color: ${color};">
                    <span class="timeline-act-label" title="${this.escapeHtml(actGroup.actTitle)}">
                        ${this.escapeHtml(actGroup.actTitle)}
                    </span>
                    ${this.renderChapterMarkers(actGroup.passages, currentWordOffset, totalWords)}
                </div>
            `;

            currentWordOffset += actWordCount;
        });

        html += `
                </div>
                
                <!-- Row 2: Beats/Markers Track -->
                <div class="timeline-beats-row">
                    <div class="timeline-percent-indicator start">0%</div>
                    <div class="timeline-beats-track">
        `;

        // Render all beats across all acts
        currentWordOffset = 0;
        passagesByAct.forEach(actGroup => {
            html += this.renderBeats(actGroup.passages, currentWordOffset, totalWords);
            const actWordCount = actGroup.passages.reduce((sum, p) => sum + (p.wordCount || 0), 0);
            currentWordOffset += actWordCount;
        });

        html += `
                    </div>
                    <div class="timeline-percent-indicator end">100%</div>
                </div>
                
                <!-- Legend -->
                <div class="timeline-legend">
                    ${totalChapters} chapitres - Story structure timeline
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    },

    /**
     * Renders chapter start markers as subtle vertical ticks
     */
    renderChapterMarkers(passages, actStartOffset, totalWords) {
        const chaptersRendered = new Set();
        let html = '';
        let currentOffset = actStartOffset;

        passages.forEach(passage => {
            if (passage.chapterId && !chaptersRendered.has(passage.chapterId)) {
                chaptersRendered.add(passage.chapterId);

                // Position relative au début de l'acte (puisqu'on est dans le segment d'acte)
                const relativeOffset = currentOffset - actStartOffset;
                const actWordCount = passages.reduce((sum, p) => sum + (p.wordCount || 0), 0);
                const leftPercent = (relativeOffset / (actWordCount || 1)) * 100;

                html += `
                    <div class="timeline-chapter-marker" 
                         style="left: ${leftPercent}%;" 
                         title="${this.escapeHtml(passage.chapterTitle || 'Chapitre')}">
                    </div>
                `;
            }
            currentOffset += (passage.wordCount || 0);
        });

        return html;
    },

    /**
     * Renders beat markers (structure blocks)
     */
    renderBeats(passages, actStartOffset, totalWords) {
        let html = '';
        let currentOffset = actStartOffset;

        passages.forEach(passage => {
            if (passage.type === NarrativeOverviewModel.PASSAGE_TYPES.STRUCTURE_BLOCK) {
                const leftPercent = (currentOffset / (totalWords || 1)) * 100;
                const markerColor = this.getMarkerColor(passage.label);

                html += `
                    <div class="timeline-beat-marker" 
                         style="left: ${leftPercent}%; --marker-color: ${markerColor};" 
                         title="${this.escapeHtml(passage.label)} - ${this.escapeHtml(passage.content.substring(0, 100))}..."
                         onclick="event.stopPropagation(); NarrativeOverviewHandlers.navigateToPassage('${passage.id}')">
                         <span class="timeline-beat-label">${this.escapeHtml(this.getShortLabel(passage.label))}</span>
                    </div>
                `;
            }
            currentOffset += (passage.wordCount || 0);
        });

        return html;
    },

    /**
     * Returns a short label for the beat (e.g. "Cl" for Climax)
     */
    getShortLabel(label) {
        if (!label) return '';
        if (label.toLowerCase().includes('climax')) return 'CX';
        if (label.toLowerCase().includes('incident')) return 'ID';
        if (label.toLowerCase().includes('déclencheur')) return 'ID';
        if (label.toLowerCase().includes('péri')) return 'PE';
        if (label.toLowerCase().includes('action')) return 'AC';
        if (label.toLowerCase().includes('beat')) return 'BT';
        return label.substring(0, 2).toUpperCase();
    },

    /**
     * Returns a color for the marker based on its label
     */
    getMarkerColor(label) {
        if (!label) return 'var(--accent-gold)';
        const l = label.toLowerCase();
        if (l.includes('climax')) return '#ff4757';
        if (l.includes('incident') || l.includes('déclencheur')) return '#3742fa';
        if (l.includes('périripétie') || l.includes('action')) return '#2ed573';
        if (l.includes('beat')) return '#eccc68';
        if (l.includes('résolution')) return '#7bed9f';
        return 'var(--accent-gold)';
    },

    /**
     * Escapes HTML for security
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
