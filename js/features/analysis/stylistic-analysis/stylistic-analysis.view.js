// ============================================================
// stylistic-analysis.view.js — Rendu du panneau d'analyse stylistique
// ============================================================

const StylisticAnalysisView = {
    renderPanel(container) {
        if (!container) {
            console.error('[StylisticAnalysisView] No container provided to renderPanel');
            return;
        }

        try {
            const state = StylisticAnalysisViewModel.getState();
            // console.log('[StylisticAnalysisView] Rendering state:', state);

            if (state.isAnalyzing) {
                container.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                        <i data-lucide="loader-2" class="spin" style="margin-bottom: 1rem; width: 24px; height: 24px;"></i>
                        <p>${Localization.t('stylistic.analyzing') || 'Analyse en cours...'}</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
                return;
            }

        if (!state.sentiment || !state.connectors) {
            const noDataMsg = (typeof currentSceneId === 'undefined' || !currentSceneId) 
                ? "Aucune scène sélectionnée." 
                : "Impossible de récupérer le contenu de la scène.";
            
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i data-lucide="sparkles" style="margin-bottom: 1rem; width: 32px; height: 32px; opacity: 0.5;"></i>
                    <p>${Localization.t('stylistic.empty') || noDataMsg}</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="StylisticAnalysisHandlers.onRefresh()">
                        <i data-lucide="refresh-cw"></i> ${Localization.t('stylistic.btn_analyze') || 'Réessayer'}
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
            return;
        }

            const sentiment = state.sentiment;
            const connectors = state.connectors;

            // Sentiments UI
            const sentimentHtml = this._renderSentiment(sentiment);
            
            // Connecteurs UI
            const connectorsHtml = this._renderConnectors(connectors);

            container.innerHTML = `
                <div class="stylistic-analysis-content" style="padding: 1.5rem; height: 100%; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); font-size: 1.1rem;">
                            <i data-lucide="sparkles" style="color: var(--accent-gold); width: 18px; height: 18px;"></i> 
                            ${Localization.t('stylistic.title') || 'Analyse Stylistique'}
                        </h3>
                        <button class="btn btn-icon" onclick="StylisticAnalysisHandlers.onRefresh()" title="${Localization.t('tool.refresh') || 'Rafraîchir'}">
                            <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>

                    ${sentimentHtml}
                    
                    <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 2rem 0;" />
                    
                    ${connectorsHtml}
                    
                </div>
            `;

            if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
        } catch (error) {
            console.error('[StylisticAnalysisView] Render error:', error);
            container.innerHTML = `<div class="error-state" style="padding:1rem; color:var(--accent-red)">Error: ${error.message}</div>`;
        }
    },

    _renderSentiment(sentiment) {
        if (sentiment.wordCount === 0) return `<p class="text-muted">${Localization.t('stylistic.no_words') || 'Pas assez de texte pour analyser le sentiment.'}</p>`;

        let emoji = '😐';
        let color = 'var(--text-muted)';
        let bgStr = 'var(--bg-secondary)';
        
        const locMap = {
            'very_positive': Localization.t('stylistic.sentiment.very_positive') || 'Très Positif',
            'positive': Localization.t('stylistic.sentiment.positive') || 'Positif',
            'neutral': Localization.t('stylistic.sentiment.neutral') || 'Neutre',
            'negative': Localization.t('stylistic.sentiment.negative') || 'Négatif',
            'very_negative': Localization.t('stylistic.sentiment.very_negative') || 'Très Négatif'
        };

        const labelText = locMap[sentiment.dominantLabel] || sentiment.dominantLabel;

        if (sentiment.label === 'positive') { emoji = '😊'; color = 'var(--accent-green, #4ade80)'; bgStr = 'rgba(74, 222, 128, 0.1)'; }
        else if (sentiment.label === 'negative') { emoji = '😟'; color = 'var(--accent-red, #f87171)'; bgStr = 'rgba(248, 113, 113, 0.1)'; }

        // Mots marquants (top positifs et top négatifs)
        const topPos = [...sentiment.scoredWords].filter(w => w.score > 0).sort((a,b) => b.score - a.score).slice(0, 3);
        const topNeg = [...sentiment.scoredWords].filter(w => w.score < 0).sort((a,b) => a.score - b.score).slice(0, 3);
        
        const wordsHtml = [];
        if (topPos.length) {
            const tags = topPos.map(w => `<span class="sentiment-tag positive" onclick="StylisticAnalysisHandlers.onHighlightWord('${w.word.replace(/'/g, "\\'")}')">${w.word}</span>`).join(' ');
            wordsHtml.push(`<div style="font-size: 0.8rem; margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center;"><span style="color:var(--accent-green, #4ade80)">+</span> ${tags}</div>`);
        }
        if (topNeg.length) {
            const tags = topNeg.map(w => `<span class="sentiment-tag negative" onclick="StylisticAnalysisHandlers.onHighlightWord('${w.word.replace(/'/g, "\\'")}')">${w.word}</span>`).join(' ');
            wordsHtml.push(`<div style="font-size: 0.8rem; margin-top: 0.25rem; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center;"><span style="color:var(--accent-red, #f87171)">-</span> ${tags}</div>`);
        }

        return `
            <div class="sentiment-section">
                <h4 style="margin: 0 0 1rem 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
                    ${Localization.t('stylistic.sentiment.title') || 'Ton Émotionnel'}
                </h4>
                
                <div style="background: ${bgStr}; border: 1px solid ${color}; border-radius: 8px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="font-size: 2.5rem; line-height: 1;">${emoji}</div>
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem; color: ${color};">${labelText}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Score global : ${Math.round(sentiment.score * 100)}%</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.25rem; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                    <div style="background: var(--accent-green, #4ade80); width: ${sentiment.positive}%;" title="Positif: ${sentiment.positive}%"></div>
                    <div style="background: var(--bg-tertiary, #4b5563); width: ${sentiment.neutral}%;" title="Neutre: ${sentiment.neutral}%"></div>
                    <div style="background: var(--accent-red, #f87171); width: ${sentiment.negative}%;" title="Négatif: ${sentiment.negative}%"></div>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
                    <span>${sentiment.positive}% Positif</span>
                    <span>${sentiment.neutral}% Neutre</span>
                    <span>${sentiment.negative}% Négatif</span>
                </div>
                
                ${wordsHtml.length ? `<div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: 6px; margin-top: 1rem;">${wordsHtml.join('')}</div>` : ''}
            </div>
        `;
    },

    _renderConnectors(connectors) {
        if (connectors.wordCount < 10) return `<p class="text-muted">${Localization.t('stylistic.no_words') || 'Pas assez de texte pour analyser les connecteurs.'}</p>`;

        const warningsHtml = connectors.warnings.map(w => {
            let icon = 'info';
            let color = 'var(--text-primary)';
            if (w.type === 'warning') { icon = 'alert-triangle'; color = 'var(--accent-red, #f87171)'; }
            else if (w.type === 'tip') { icon = 'lightbulb'; color = 'var(--accent-gold, #fbbf24)'; }
            
            // i18n
            let text = '';
            if (w.key === 'connectors.warning.too_few') text = Localization.t('stylistic.connectors.too_few') || 'Votre texte manque de structure (peu de connecteurs).';
            else if (w.key === 'connectors.warning.too_many') text = Localization.t('stylistic.connectors.too_many') || 'Trop de connecteurs détectés, le texte peut sembler mécanique.';
            else if (w.key === 'connectors.warning.imbalanced') text = Localization.t('stylistic.connectors.imbalanced', w.params) || `Déséquilibre : sur-utilisation de la catégorie "${w.params[0]}".`;
            else if (w.key === 'connectors.warning.no_opposition') text = Localization.t('stylistic.connectors.no_opposition') || "Aucun connecteur d'opposition détecté. Pensez à nuancer.";
            else if (w.key === 'connectors.warning.repetition') text = Localization.t('stylistic.connectors.repetition', w.params) || `Répétition : "${w.params[0]}" utilisé ${w.params[1]} fois.`;

            const isRepetition = w.key === 'connectors.warning.repetition';
            const clickAttr = isRepetition ? `onclick="StylisticAnalysisHandlers.onHighlightWord('${w.params[0].replace(/'/g, "\\'")}')" style="cursor:pointer;"` : '';

            return `
                <div class="connector-warning" ${clickAttr} style="display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.5rem; font-size: 0.85rem; background: var(--bg-secondary); padding: 0.75rem; border-radius: 6px; border-left: 3px solid ${color}; transition: transform 0.2s;">
                    <i data-lucide="${icon}" style="width: 16px; height: 16px; color: ${color}; flex-shrink: 0; margin-top: 2px;"></i>
                    <span>${text}</span>
                    ${isRepetition ? `<i data-lucide="eye" style="width: 12px; height: 12px; margin-left: auto; opacity: 0.5;"></i>` : ''}
                </div>
            `;
        }).join('');

        const catHtml = Object.entries(connectors.categories).sort((a,b) => b[1].count - a[1].count).map(([key, cat]) => {
            if (cat.count === 0) return '';
            
            let statusIcon = '';
            if (cat.status === 'low') statusIcon = '<i data-lucide="arrow-down" style="width:12px;height:12px;color:var(--text-muted)" title="Sous-représenté"></i>';
            else if (cat.status === 'high') statusIcon = '<i data-lucide="arrow-up" style="width:12px;height:12px;color:var(--accent-red, #f87171)" title="Sur-représenté"></i>';
            
            const wordsListHtml = Object.entries(cat.found).sort((a,b) => b[1]-a[1]).map(w => {
                return `<span class="connector-tag" onclick="StylisticAnalysisHandlers.onHighlightWord('${w[0].replace(/'/g, "\\'")}')">${w[0]} <small style="opacity:0.6">(${w[1]})</small></span>`;
            }).join(' ');

            return `
                <div style="margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; font-size: 0.85rem;">
                        <span style="display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="${cat.icon}" style="width: 14px; height: 14px; color: ${cat.color};"></i>
                            ${cat.label} ${statusIcon}
                        </span>
                        <span style="font-weight: 600;">${cat.count} <span style="color:var(--text-muted); font-weight:normal; font-size: 0.75rem;">(${cat.percentage}%)</span></span>
                    </div>
                    <div style="background: var(--bg-primary); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem;">
                        <div style="background: ${cat.color}; height: 100%; width: ${cat.percentage}%;"></div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                        ${wordsListHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="connectors-section">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem;">
                    <h4 style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
                        ${Localization.t('stylistic.connectors.title') || 'Connecteurs Logiques'}
                    </h4>
                    <span style="font-size: 0.8rem; font-weight: 600; background: var(--bg-secondary); padding: 0.2rem 0.5rem; border-radius: 10px;">
                        ${connectors.total} détectés
                    </span>
                </div>
                
                ${warningsHtml ? `<div style="margin-bottom: 1.5rem;">${warningsHtml}</div>` : ''}
                
                <div class="connectors-bars">
                    ${catHtml}
                </div>
                
                ${connectors.total === 0 ? `<p class="text-muted" style="font-size:0.85rem; text-align:center;">${Localization.t('stylistic.connectors.none_found') || 'Aucun connecteur détecté.'}</p>` : ''}
            </div>
        `;
    }
};
