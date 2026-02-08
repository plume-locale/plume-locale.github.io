/**
 * ViewModel pour le module Plot
 * Gère la logique de présentation et les interactions utilisateur.
 */
/**
 * ViewModel pour le module Plot
 * Gère la logique de présentation et les interactions utilisateur.
 */
class PlotViewModel {
    constructor(repository, view) {
        this.repository = repository;
        this.view = view;

        // Initialiser l'état
        this.isInitialized = false;
        this.currentTab = 'overview'; // 'overview', 'analysis', 'suggestions'
        this.analysisData = null;
        this.suggestionsData = null;
    }

    /**
     * Initialise le ViewModel et rend la vue si nécessaire.
     */
    init() {
        if (this.isInitialized) return;

        // Initialiser les bindings de la vue
        this.view.bindRecalculate(() => this.resetPoints());
        this.view.bindAnalyze(() => this.analyzeCurve());
        this.view.bindSuggestions(() => this.showSuggestions());
        this.view.bindExport(() => this.exportPlot());

        // Ajouter un binding pour revenir à la vue d'ensemble
        // Note: La vue devra appeler window.showPlotOverview() ou une méthode liée

        this.isInitialized = true;
    }

    /**
     * Charge les données et met à jour la vue.
     */
    loadAndRender() {
        // Reset tab on full reload
        this.currentTab = 'overview';
        const points = this.repository.getAll();

        // Si aucun point n'existe mais qu'on a un projet, on génère
        if (points.length === 0 && typeof project !== 'undefined' && project.acts && project.acts.length > 0) {
            this.repository.generateFromProject(project);
        }

        this._refreshView();
    }

    /**
     * Rafraîchit la vue en fonction de l'état actuel
     */
    _refreshView() {
        const points = this.repository.getAll();
        this.view.render(points, this.currentTab, {
            analysis: this.analysisData,
            suggestions: this.suggestionsData
        });
    }

    /**
     * Ouvre une scène spécifique.
     */
    openPoint(actId, chapterId, sceneId) {
        if (typeof switchView === 'function') switchView('editor');
        if (typeof openScene === 'function') openScene(actId, chapterId, sceneId);
    }

    /**
     * Réinitialise et recalcule les points.
     */
    resetPoints() {
        if (confirm(Localization.t('plot.messages.recalculateConfirm'))) {
            if (typeof project !== 'undefined') {
                this.repository.generateFromProject(project);
                this.analysisData = null; // Reset cached analysis
                this.suggestionsData = null; // Reset cached suggestions
                this._refreshView();
                if (typeof showNotification === 'function') {
                    showNotification(Localization.t('plot.messages.recalculateSuccess'));
                }
            }
        }
    }

    /**
     * Bascule vers l'onglet Vue d'ensemble
     */
    showOverview() {
        this.currentTab = 'overview';
        this._refreshView();
    }

    /**
     * Lance l'analyse de la courbe et affiche l'onglet Analyse.
     */
    analyzeCurve() {
        const points = this.repository.getAll();
        if (points.length === 0) {
            alert(Localization.t('plot.messages.noPointsAnalyze'));
            return;
        }

        const stats = this._computeStats(points);
        this.analysisData = this._generateAnalysisData(points, stats);
        this.currentTab = 'analysis';
        this._refreshView();
    }

    /**
     * Affiche les suggestions d'amélioration dans l'onglet Suggestions.
     */
    showSuggestions() {
        const points = this.repository.getAll();
        if (points.length === 0) {
            alert(Localization.t('plot.messages.noPointsSuggest'));
            return;
        }

        const stats = this._computeStats(points);
        this.suggestionsData = this._generateSuggestionsData(points, stats);
        this.currentTab = 'suggestions';
        this._refreshView();
    }

    /**
     * Exporte le graphique en SVG.
     */
    exportPlot() {
        // L'export ne fonctionne que si le SVG est visible (onglet overview)
        // Mais on permet l'export depuis n'importe quel onglet si on peut grabber les données
        // Ici on suppose qu'on doit être sur l'onglet graph pour grabber le SVG du DOM
        if (this.currentTab !== 'overview') {
            if (confirm(Localization.t('plot.messages.exportConfirm'))) {
                this.showOverview();
                // Petit délai pour laisser le DOM se mettre à jour
                setTimeout(() => this.exportPlot(), 100);
            }
            return;
        }

        const svgElement = document.getElementById('plotSvg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title || 'projet'}_plot.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- Méthodes privées d'analyse ---

    _computeStats(points) {
        const tensions = points.map(p => p.intensity);
        if (tensions.length === 0) return null;

        const avg = tensions.reduce((a, b) => a + b, 0) / tensions.length;
        const max = Math.max(...tensions);
        const min = Math.min(...tensions);
        const maxIndex = tensions.indexOf(max);
        const minIndex = tensions.indexOf(min);

        // Variance et écart-type
        const variance = tensions.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / tensions.length;
        const stdDev = Math.sqrt(variance);

        return { tensions, avg, max, min, maxIndex, minIndex, stdDev, count: points.length };
    }

    _generateAnalysisData(points, stats) {
        if (!stats) return null;
        const { avg, max, min, maxIndex, minIndex, stdDev, tensions, count } = stats;

        // Détection du climax
        const lastThird = Math.floor(count * 0.66);
        const climaxInLastThird = maxIndex >= lastThird;

        // Analyse progression
        const firstHalf = tensions.slice(0, Math.floor(count / 2));
        const secondHalf = tensions.slice(Math.floor(count / 2));
        const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
        const isRising = secondAvg > firstAvg;

        // Pics
        let peaks = 0;
        for (let i = 1; i < tensions.length - 1; i++) {
            if (tensions[i] > tensions[i - 1] + 20 && tensions[i] > tensions[i + 1] + 20) {
                peaks++;
            }
        }

        return {
            stats: {
                avg, max, min, maxIndex, minIndex, stdDev, peaks,
                amplitude: max - min,
                maxTitle: points[maxIndex].title,
                minTitle: points[minIndex].title
            },
            narrative: {
                avgLow: avg < 40,
                avgHigh: avg > 70,
                climaxGood: climaxInLastThird,
                climaxPercent: Math.round((maxIndex / count) * 100),
                isRising,
                flatCurve: stdDev < 10,
                irregularCurve: stdDev > 25,
                noPeaks: peaks === 0,
                tooManyPeaks: peaks > count / 3
            }
        };
    }

    _generateSuggestionsData(points, stats) {
        if (!stats) return null;
        const { avg, tensions } = stats;

        // Zones plates
        let flatZones = [];
        for (let i = 0; i < tensions.length - 2; i++) {
            const range = tensions.slice(i, i + 3);
            const rangeAvg = range.reduce((a, b) => a + b, 0) / range.length;
            const rangeVariance = range.reduce((sum, t) => sum + Math.pow(t - rangeAvg, 2), 0) / range.length;
            if (rangeVariance < 5) flatZones.push(i);
        }

        return {
            flatZonesCount: flatZones.length,
            avgLow: avg < 40,
            avgHigh: avg > 70
        };
    }
}
