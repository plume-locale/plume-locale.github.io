/**
 * Vue pour le module Plot
 * Gère le rendu SVG et HTML du graphique.
 */
class PlotView {
    constructor() {
        this.containerId = 'editorView';
        // Callbacks
        this.onRecalculate = null;
        this.onAnalyze = null;
        this.onSuggestions = null;
        this.onExport = null;
    }

    bindRecalculate(handler) { this.onRecalculate = handler; }
    bindAnalyze(handler) { this.onAnalyze = handler; }
    bindSuggestions(handler) { this.onSuggestions = handler; }
    bindExport(handler) { this.onExport = handler; }

    /**
     * Rend l'interface complète du graphique.
     * @param {Array<PlotPoint>} plotPoints 
     * @param {string} activeTab - 'overview', 'analysis', 'suggestions'
     * @param {Object} data - Données pour les onglets (analysis, suggestions)
     */
    render(plotPoints, activeTab = 'overview', data = {}) {
        let container = null;

        // [MVVM : View] Quand le plot est affiché dans un onglet, le conteneur réel
        // est un splitPanelContent-{paneId} à l'intérieur du tab-content-area.
        // On doit le cibler pour ne pas écraser le système d'onglets.
        if (typeof tabsState !== 'undefined' && tabsState.panes) {
            for (const paneId of ['left', 'right']) {
                const pane = tabsState.panes[paneId];
                if (pane.activeTabId === 'view-plot') {
                    container = document.getElementById(`splitPanelContent-${paneId}`);
                    break;
                }
            }
        }

        if (!container) {
            container = document.getElementById(this.containerId);
        }

        if (!container) {
            console.error('PlotView: container not found');
            return;
        }

        let mainContent = '';

        switch (activeTab) {
            case 'overview':
                mainContent = this._renderGraph(plotPoints);
                break;
            case 'analysis':
                mainContent = this._renderAnalysis(data.analysis);
                break;
            case 'suggestions':
                mainContent = this._renderSuggestions(data.suggestions);
                break;
            default:
                mainContent = this._renderGraph(plotPoints);
        }

        container.innerHTML = `
            <div style="padding: 2rem; height: 100%; display: flex; flex-direction: column;">
                ${this._renderHeader(plotPoints)}
                ${this._renderToolbar(activeTab)}
                <div class="visualization-canvas" style="flex: 1; overflow: auto; min-height: 0;">
                    ${mainContent}
                </div>
            </div>
        `;

        // Rendre les icônes lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    _renderGraph(plotPoints) {
        // Configuration SVG
        const svgWidth = 1000;
        const svgHeight = 700;
        const paddingX = 60;
        const paddingYTop = 40;
        const paddingYBottom = 180;

        const plotWidth = svgWidth - paddingX * 2;
        const plotHeight = svgHeight - paddingYTop - paddingYBottom;
        const axisY = svgHeight - paddingYBottom;

        // Génération composant par composant
        const gridLines = this._generateGridLines(svgWidth, paddingX, paddingYTop, plotHeight);
        const { pathData, pointsHTML, structuralLabels } = this._generateCurveAndPoints(plotPoints, plotWidth, plotHeight, paddingX, paddingYTop, axisY);

        return `
            <div class="plot-graph">
                <svg width="100%" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" id="plotSvg">
                    ${gridLines}
                    <path d="${pathData}" fill="none" stroke="var(--accent-gold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    ${pointsHTML}
                    <line x1="${paddingX}" y1="${axisY}" x2="${svgWidth - paddingX}" y2="${axisY}" stroke="var(--text-primary)" stroke-width="2"/>
                    <line x1="${paddingX}" y1="${paddingYTop}" x2="${paddingX}" y2="${axisY}" stroke="var(--text-primary)" stroke-width="2"/>
                    ${structuralLabels}
                    <text x="${svgWidth / 2}" y="${svgHeight - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="11" opacity="0.4">${Localization.t('plot.progression')}</text>
                    <text x="20" y="${axisY / 2}" text-anchor="middle" fill="var(--text-muted)" font-size="13" transform="rotate(-90 20 ${axisY / 2})">${Localization.t('plot.dramaticTension')}</text>
                </svg>
            </div>
            ${this._renderFooter()}
        `;
    }

    _renderAnalysis(data) {
        if (!data) return `<div class="empty-state">${Localization.t('plot.analysis.noData')}</div>`;

        const { stats, narrative } = data;

        return `
            <div class="analysis-container" style="max-width: 800px; margin: 0 auto; padding: 1rem;">
                <h2 style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                    <i data-lucide="scan-search" style="vertical-align: middle; margin-right: 10px;"></i> ${Localization.t('plot.analysis.title')}
                </h2>

                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="stat-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${Localization.t('plot.analysis.avgTension')}</div>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--accent-gold);">${Math.round(stats.avg)}%</div>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem;">
                            ${narrative.avgLow ? `<span style="color: #e67e22;"><i data-lucide="alert-triangle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.analysis.low')}</span>` : narrative.avgHigh ? `<span style="color: #e74c3c;"><i data-lucide="alert-triangle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.analysis.high')}</span>` : `<span style="color: #2ecc71;"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.analysis.balanced')}</span>`}
                        </div>
                    </div>
                    <div class="stat-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${Localization.t('plot.analysis.amplitude')}</div>
                        <div style="font-size: 2rem; font-weight: bold;">${Math.round(stats.amplitude)}%</div>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-secondary);">Max: ${Math.round(stats.max)}% / Min: ${Math.round(stats.min)}%</div>
                    </div>
                    <div class="stat-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${Localization.t('plot.analysis.variation')}</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${narrative.flatCurve ? Localization.t('plot.analysis.lowVar') : narrative.irregularCurve ? Localization.t('plot.analysis.highVar') : Localization.t('plot.analysis.moderateVar')}</div>
                        <div style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-secondary);">Écart-type: ${Math.round(stats.stdDev)}</div>
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">${Localization.t('plot.analysis.narrativeEval')}</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: start; gap: 1rem;">
                            ${narrative.climaxGood ? '<i data-lucide="check-circle" style="color: #2ecc71;"></i>' : '<i data-lucide="alert-triangle" style="color: #e67e22;"></i>'}
                            <div>
                                <strong>${Localization.t('plot.analysis.climaxPos')}</strong><br>
                                ${narrative.climaxGood ? Localization.t('plot.analysis.climaxGood') : Localization.t('plot.analysis.climaxEarly', [narrative.climaxPercent])}
                            </div>
                        </li>
                        <li style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: start; gap: 1rem;">
                            ${narrative.isRising ? '<i data-lucide="check-circle" style="color: #2ecc71;"></i>' : '<i data-lucide="alert-triangle" style="color: #e67e22;"></i>'}
                            <div>
                                <strong>${Localization.t('plot.analysis.tensionProg')}</strong><br>
                                ${narrative.isRising ? Localization.t('plot.analysis.tensionRising') : Localization.t('plot.analysis.tensionFalling')}
                            </div>
                        </li>
                        <li style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: start; gap: 1rem;">
                            ${!narrative.noPeaks && !narrative.tooManyPeaks ? '<i data-lucide="check-circle" style="color: #2ecc71;"></i>' : '<i data-lucide="alert-triangle" style="color: #e67e22;"></i>'}
                            <div>
                                <strong>${Localization.t('plot.analysis.rhythmPeaks')}</strong><br>
                                ${narrative.noPeaks ? Localization.t('plot.analysis.noPeaks') : narrative.tooManyPeaks ? Localization.t('plot.analysis.manyPeaks') : Localization.t('plot.analysis.appropriatePeaks', [stats.peaks])}
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }

    _renderSuggestions(data) {
        if (!data) return `<div class="empty-state">${Localization.t('plot.suggestions.noData')}</div>`;

        return `
            <div class="suggestions-container" style="max-width: 800px; margin: 0 auto; padding: 1rem;">
                <h2 style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                    <i data-lucide="lightbulb" style="vertical-align: middle; margin-right: 10px;"></i> ${Localization.t('plot.suggestions.title')}
                </h2>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h3 style="color: var(--accent-gold); margin-bottom: 1rem;">${Localization.t('plot.suggestions.diagnostic')}</h3>
                        ${data.flatZonesCount > 0 ? `
                            <div class="suggestion-card" style="background: rgba(230, 126, 34, 0.1); border-left: 4px solid #e67e22; padding: 1rem; margin-bottom: 1rem;">
                                <strong><i data-lucide="trending-down" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.suggestions.flatZones')}</strong>
                                <p>${Localization.t('plot.suggestions.flatZonesDesc', [data.flatZonesCount])}</p>
                            </div>
                        ` : ''}
                        
                        ${data.avgLow ? `
                            <div class="suggestion-card" style="background: rgba(231, 76, 60, 0.1); border-left: 4px solid #e74c3c; padding: 1rem; margin-bottom: 1rem;">
                                <strong><i data-lucide="flame" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.suggestions.lowTension')}</strong>
                                <p>${Localization.t('plot.suggestions.lowTensionDesc')}</p>
                            </div>
                        ` : ''}

                         ${data.avgHigh ? `
                            <div class="suggestion-card" style="background: rgba(52, 152, 219, 0.1); border-left: 4px solid #3498db; padding: 1rem; margin-bottom: 1rem;">
                                <strong><i data-lucide="coffee" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.suggestions.highTension')}</strong>
                                <p>${Localization.t('plot.suggestions.highTensionDesc')}</p>
                            </div>
                        ` : ''}
                    </div>

                    <div>
                        <h3 style="color: var(--text-primary); margin-bottom: 1rem;">${Localization.t('plot.suggestions.toolbox')}</h3>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <strong>${Localization.t('plot.suggestions.increaseTension')}</strong>
                            <ul style="margin-top: 0.5rem; color: var(--text-secondary);">
                                <li>${Localization.t('plot.suggestions.increaseTips.deadline')}</li>
                                <li>${Localization.t('plot.suggestions.increaseTips.danger')}</li>
                                <li>${Localization.t('plot.suggestions.increaseTips.secret')}</li>
                                <li>${Localization.t('plot.suggestions.increaseTips.dilemma')}</li>
                            </ul>
                        </div>

                        <div>
                            <strong>${Localization.t('plot.suggestions.decreaseTension')}</strong>
                            <ul style="margin-top: 0.5rem; color: var(--text-secondary);">
                                <li>${Localization.t('plot.suggestions.decreaseTips.resolve')}</li>
                                <li>${Localization.t('plot.suggestions.decreaseTips.victory')}</li>
                                <li>${Localization.t('plot.suggestions.decreaseTips.intimacy')}</li>
                                <li>${Localization.t('plot.suggestions.decreaseTips.contemplation')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px;">
                    <h3 style="margin-bottom: 1rem;">${Localization.t('plot.suggestions.structure')}</h3>
                    <div style="display: flex; height: 20px; width: 100%; border-radius: 10px; overflow: hidden; margin-bottom: 1rem;">
                        <div style="width: 25%; background: #3498db; opacity: 0.6;" title="${Localization.t('plot.structure.start')}"></div>
                        <div style="width: 40%; background: #f1c40f; opacity: 0.6;" title="${Localization.t('plot.structure.middle')}"></div>
                        <div style="width: 25%; background: #e74c3c; opacity: 0.8;" title="${Localization.t('plot.structure.climax')}"></div>
                        <div style="width: 10%; background: #2ecc71; opacity: 0.6;" title="${Localization.t('plot.structure.resolution')}"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
                        <span>${Localization.t('plot.structure.start')} (20-40%)</span>
                        <span>${Localization.t('plot.structure.middle')} (40-60%)</span>
                        <span>${Localization.t('plot.structure.climax')} (60-90%)</span>
                        <span>${Localization.t('plot.structure.end')}</span>
                    </div>
                </div>
            </div>
        `;
    }

    _renderToolbar(activeTab) {
        return `
            <div class="visualization-toolbar">
                <button class="viz-tool-btn ${activeTab === 'overview' ? 'active' : ''}" onclick="window.plumePlot.showOverview()">${Localization.t('plot.toolbar.overview')}</button>
                <button class="viz-tool-btn ${activeTab === 'analysis' ? 'active' : ''}" onclick="analyzePlotCurve()"><i data-lucide="scan-search" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('plot.toolbar.analyze')}</button>
                <button class="viz-tool-btn ${activeTab === 'suggestions' ? 'active' : ''}" onclick="showPlotSuggestions()"><i data-lucide="lightbulb" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('plot.toolbar.suggestions')}</button>
                <button class="viz-tool-btn" onclick="resetPlotPoints()"><i data-lucide="refresh-cw" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('plot.toolbar.recalculate')}</button>
                <button class="viz-tool-btn" onclick="exportPlot()"><i data-lucide="upload" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('plot.toolbar.export')}</button>
            </div>
        `;
    }


    // _attachEventListeners supprimé car on utilise les attributs onclick globaux pour plus de robustesse avec innerHTML
    _generateGridLines(width, paddingX, startY, height) {
        let lines = '';
        for (let i = 0; i <= 4; i++) {
            const y = startY + (height / 4) * i;
            lines += `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="var(--border-color)" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>`;
            lines += `<text x="${paddingX - 10}" y="${y + 5}" text-anchor="end" font-size="12" fill="var(--text-muted)">${100 - i * 25}%</text>`;
        }
        return lines;
    }

    _generateCurveAndPoints(points, width, height, paddingX, startY, axisY) {
        let pathData = '';
        let pointsHTML = '';
        let structuralLabels = '';
        let currentActRef = null;
        let currentChapterRef = null;

        if (points.length > 0) {
            points.forEach((point, index) => {
                const x = paddingX + (width / Math.max(points.length - 1, 1)) * index;
                const y = startY + height - (point.intensity / 100) * height;

                if (index === 0) pathData = `M ${x} ${y}`;
                else pathData += ` L ${x} ${y}`;

                // Labels structurels
                const structuralInfo = point.description.split(' > ');
                const actTitle = structuralInfo[0];
                const chapterTitle = structuralInfo[1];

                if (actTitle !== currentActRef) {
                    structuralLabels += `
                        <line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 40}" stroke="var(--accent-gold)" stroke-width="2" />
                        <text x="${x + 5}" y="${axisY + 15}" fill="var(--accent-gold)" font-weight="bold" font-size="12" transform="rotate(45 ${x + 5} ${axisY + 15})">${actTitle}</text>
                    `;
                    currentActRef = actTitle;
                }

                if (chapterTitle !== currentChapterRef) {
                    structuralLabels += `
                        <line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 10}" stroke="var(--border-color)" stroke-width="1" />
                        <text x="${x}" y="${axisY + 50}" fill="var(--text-muted)" font-size="10" transform="rotate(60 ${x} ${axisY + 50})">${chapterTitle}</text>
                    `;
                    currentChapterRef = chapterTitle;
                }

                pointsHTML += `
                    <g style="cursor: pointer;" onclick="window.plumePlot.openPoint('${point.actId}', '${point.chapterId}', '${point.sceneId}')" oncontextmenu="event.preventDefault(); window.plumePlot.openPoint('${point.actId}', '${point.chapterId}', '${point.sceneId}')">
                        <circle cx="${x}" cy="${y}" r="12" fill="transparent" />
                        <circle cx="${x}" cy="${y}" r="6" fill="var(--accent-gold)" stroke="white" stroke-width="2" class="plot-point-dot" />
                        <title>${Localization.t('plot.point.tooltip', [point.description, Math.round(point.intensity)])}</title>
                    </g>
                `;
            });
        }
        return { pathData, pointsHTML, structuralLabels };
    }

    _renderHeader(points) {
        const avgTension = points.length > 0 ? Math.round(points.reduce((sum, p) => sum + p.intensity, 0) / points.length) : 0;

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <h3 style="margin: 0;"><i data-lucide="trending-up" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('plot.title')}</h3>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                        <i data-lucide="bar-chart-3" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${points.length} ${Localization.t('plot.plotPoints')} • <i data-lucide="target" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('plot.averageTension')}: ${avgTension}%
                    </div>
                </div>
                <!-- Le bouton "Personnaliser" utilise une fonction globale externe à ce module (openTensionWordsEditor) -->
                <button onclick="if(typeof openTensionWordsEditor === 'function') openTensionWordsEditor()" 
                        style="padding: 10px 18px; background: #3a7bc8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                        onmouseover="this.style.background='#2d6bb3'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                        onmouseout="this.style.background='#3a7bc8'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                    <i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('plot.customizeTensionWords')}
                </button>
            </div>
        `;
    }

    _renderFooter() {
        return `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
                            <i data-lucide="lightbulb" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;color:var(--accent-gold);"></i> <strong>${Localization.t('plot.usage')}</strong><br>
                            • <strong>Clic</strong> ${Localization.t('plot.clickAction').substring(5)}<br>
                            • <strong>Affichage</strong> ${Localization.t('plot.hoverAction').substring(10)}<br>
                            • <strong>Intégration</strong> ${Localization.t('plot.integrationAction').substring(12)}<br>
                            • <strong>Analyser</strong> ${Localization.t('plot.analyzeAction').substring(9)}<br>
                            • <strong>Suggestions</strong> ${Localization.t('plot.suggestionsAction').substring(12)}
                        </p>
                    </div>
                    <div style="padding: 0.75rem; background: var(--bg-primary); border-radius: 4px; border: 1px solid var(--border-color);">
                        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">${Localization.t('plot.tensionCalculation')}</div>
                        <div style="font-size: 0.75rem; line-height: 1.6; color: var(--text-secondary);">
                            • ${Localization.t('plot.lexicalAnalysis')}<br>
                            • ${Localization.t('plot.sceneLength')}<br>
                            • ${Localization.t('plot.expressivePunctuation')}<br>
                            • ${Localization.t('plot.narrativePosition')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
