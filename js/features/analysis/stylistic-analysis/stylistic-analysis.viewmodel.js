// ============================================================
// stylistic-analysis.viewmodel.js — Préparation des données
// ============================================================

const StylisticAnalysisViewModel = {
    state: {
        sentiment: null,
        connectors: null,
        isAnalyzing: false
    },

    /**
     * Lance l'analyse sur le texte fourni
     */
    analyze(text) {
        this.state.isAnalyzing = true;
        
        try {
            this.state.sentiment = StylisticAnalysisModel.analyzeSentiment(text);
            this.state.connectors = StylisticAnalysisModel.analyzeConnectors(text);
        } catch (e) {
            console.error('[StylisticAnalysis] Error during analysis:', e);
        } finally {
            this.state.isAnalyzing = false;
        }
        
        return this.state;
    },

    /**
     * Analyse la scène courante
     */
    analyzeCurrentScene() {
        const sId = (typeof currentSceneId !== 'undefined') ? currentSceneId : null;
        
        if (!sId) {
            // console.warn('[StylisticAnalysis] No currentSceneId found');
            return null;
        }

        let content = '';
        let sceneTitleEl = document.getElementById('sceneTitle');
        let sceneContentEl = document.getElementById('sceneContent');

        // Try to find the editor in the DOM first (most up-to-date content)
        if (!sceneContentEl) {
            sceneContentEl = document.querySelector(`.editor-textarea[data-scene-id="${sId}"]`);
        }

        if (sceneContentEl) {
            const title = (sceneTitleEl) ? (sceneTitleEl.value || sceneTitleEl.innerText || sceneTitleEl.textContent || '') : '';
            const body = sceneContentEl.value || sceneContentEl.innerText || sceneContentEl.textContent || '';
            content = title + ' ' + body;
        } 
        
        // If DOM fails or is empty, fallback to project data
        if (!content.trim() && typeof project !== 'undefined') {
            const scene = this._findCurrentScene();
            if (scene) {
                content = (scene.title || '') + ' ' + (scene.content || '');
            }
        }

        return this.analyze(content);
    },

    _findCurrentScene() {
        if (typeof project === 'undefined' || typeof currentActId === 'undefined') return null;
        for (const act of project.acts) {
            if (act.id == currentActId) {
                for (const chapter of act.chapters) {
                    if (chapter.id == currentChapterId) {
                        return chapter.scenes.find(s => s.id == currentSceneId);
                    }
                }
            }
        }
        return null;
    },
    
    getState() {
        return this.state;
    },
    
    clearState() {
        this.state.sentiment = null;
        this.state.connectors = null;
        this.state.isAnalyzing = false;
    }
};
