// ============================================================
// stylistic-analysis.model.js — Moteur d'analyse stylistique
// Analyse de sentiments (lexique local) + Analyse des connecteurs
// ============================================================

const StylisticAnalysisModel = {

    // ─────────────────────────────────────────────────────────
    // SECTION 1 : Analyse des sentiments
    // ─────────────────────────────────────────────────────────

    /**
     * Extrait le texte brut d'un HTML ou string.
     */
    _extractText(htmlOrText) {
        if (!htmlOrText) return '';
        const div = document.createElement('div');
        div.innerHTML = htmlOrText;
        return (div.textContent || div.innerText || '').toLowerCase();
    },

    /**
     * Récupère les données linguistiques selon la langue de l'application
     */
    _getData() {
        const lang = (typeof Localization !== 'undefined') ? Localization.getLocale() : 'fr';
        return StylisticAnalysisData[lang] || StylisticAnalysisData['fr'];
    },

    /**
     * Tokenise le texte en mots (supprime ponctuation).
     */
    _tokenize(text) {
        return text
            .replace(/['']/g, "'") // Normaliser apostrophes
            .split(/[\s\n\r,;:!?«»""()[\]{}<>…]+/)
            .map(w => w.replace(/[.,!?;:"""''«»()\[\]{}]/g, '').trim())
            .filter(w => w.length > 1);
    },

    /**
     * Analyse le ton émotionnel du texte.
     * Retourne un objet { score, label, positive, negative, neutral, wordCount, scoredWords }
     */
    analyzeSentiment(htmlOrText) {
        const data = this._getData();
        const text = this._extractText(htmlOrText);
        const tokens = this._tokenize(text);
        const wordCount = tokens.length;

        if (wordCount === 0) {
            return { score: 0, label: 'neutral', positive: 0, negative: 0, neutral: 100, wordCount: 0, scoredWords: [] };
        }

        let totalScore = 0;
        let scoredCount = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        const scoredWords = [];

        let negationActive = false;
        let amplifierActive = false;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // Détection négation
            if (data.SentimentNegations.has(token)) {
                negationActive = true;
                continue;
            }

            // Détection amplificateur
            if (data.SentimentAmplifiers.has(token)) {
                amplifierActive = true;
                continue;
            }

            // Vérification dans le lexique (mot simple)
            let score = data.SentimentLexicon[token];

            // Vérification bi-gram (ex: "pas bien")
            if (score === undefined && i + 1 < tokens.length) {
                const bigram = token + ' ' + tokens[i + 1];
                score = data.SentimentLexicon[bigram];
            }

            if (score !== undefined) {
                let finalScore = score;

                // Appliquer amplificateur
                if (amplifierActive) {
                    finalScore = finalScore * 1.5;
                    amplifierActive = false;
                }

                // Appliquer négation (inverse + atténue)
                if (negationActive) {
                    finalScore = -finalScore * 0.7;
                    negationActive = false;
                }

                totalScore += finalScore;
                scoredCount++;

                if (finalScore > 0) positiveCount++;
                else if (finalScore < 0) negativeCount++;

                scoredWords.push({ word: token, score: finalScore });
            } else {
                // Réinitialiser négation après 2 mots non trouvés
                negationActive = false;
            }
        }

        // Score normalisé [-1, 1]
        const normalizedScore = scoredCount > 0 ? Math.max(-1, Math.min(1, totalScore / (scoredCount * 3))) : 0;

        // Répartition en %
        const total = positiveCount + negativeCount + Math.max(1, wordCount - scoredCount);
        const positiveRatio = Math.round((positiveCount / Math.max(1, scoredCount)) * 100);
        const negativeRatio = Math.round((negativeCount / Math.max(1, scoredCount)) * 100);
        const neutralRatio = Math.max(0, 100 - positiveRatio - negativeRatio);

        // Label dominant
        let label, dominantLabel;
        if (normalizedScore > 0.15) {
            label = 'positive';
        } else if (normalizedScore < -0.15) {
            label = 'negative';
        } else {
            label = 'neutral';
        }

        // Détail plus fin
        if (normalizedScore > 0.4) dominantLabel = 'very_positive';
        else if (normalizedScore > 0.15) dominantLabel = 'positive';
        else if (normalizedScore < -0.4) dominantLabel = 'very_negative';
        else if (normalizedScore < -0.15) dominantLabel = 'negative';
        else dominantLabel = 'neutral';

        return {
            score: normalizedScore,
            label,
            dominantLabel,
            positive: positiveRatio,
            negative: negativeRatio,
            neutral: neutralRatio,
            wordCount,
            scoredCount,
            scoredWords
        };
    },

    // ─────────────────────────────────────────────────────────
    // SECTION 2 : Analyse des connecteurs
    // ─────────────────────────────────────────────────────────

    /**
     * Analyse les connecteurs logiques dans le texte.
     * Retourne un objet { total, categories, density, warnings }
     */
    analyzeConnectors(htmlOrText) {
        const data = this._getData();
        const text = this._extractText(htmlOrText);
        const wordCount = this._tokenize(text).length;

        if (wordCount < 10) {
            return { total: 0, categories: {}, density: 0, warnings: [], wordCount };
        }

        const results = {};
        const foundAll = []; // { category, item, count }

        for (const [catKey, catDef] of Object.entries(data.ConnectorsData)) {
            const catResult = {
                label: catDef.label,
                icon: catDef.icon,
                color: catDef.color,
                ideal: catDef.ideal,
                count: 0,
                found: {},
                percentage: 0,
                status: 'ok' // 'ok' | 'low' | 'high' | 'missing'
            };

            for (const connector of catDef.items) {
                // Use a more compatible regex (avoid lookbehinds)
                // We use a boundary that includes accented characters
                const escaped = this._escapeRegex(connector);
                const regex = new RegExp(`(^|[^\\wàâéèêëîïôùûüç])${escaped}(?![\\wàâéèêëîïôùûüç])`, 'gi');
                
                let matches;
                while ((matches = regex.exec(text)) !== null) {
                    catResult.count++;
                    catResult.found[connector] = (catResult.found[connector] || 0) + 1;
                }
            }

            results[catKey] = catResult;
        }

        // Calcul du total
        const total = Object.values(results).reduce((sum, cat) => sum + cat.count, 0);

        // Calcul des pourcentages par catégorie
        for (const cat of Object.values(results)) {
            cat.percentage = total > 0 ? Math.round((cat.count / total) * 100) : 0;
        }

        // Densité : connecteurs pour 100 mots
        const density = wordCount > 0 ? (total / wordCount) * 100 : 0;

        // Répétitions : mots utilisés > 3 fois
        const repetitions = [];
        for (const [catKey, cat] of Object.entries(results)) {
            for (const [word, count] of Object.entries(cat.found)) {
                if (count >= 3) {
                    repetitions.push({ word, count, category: cat.label });
                }
            }
        }

        // Génération des warnings
        const warnings = this._generateConnectorWarnings(results, total, density, wordCount, repetitions);

        // Statuts par catégorie
        for (const [catKey, cat] of Object.entries(results)) {
            const catDef = data.ConnectorsData[catKey];
            if (cat.count === 0) {
                cat.status = 'missing';
            } else if (total > 0 && cat.percentage < catDef.ideal.min) {
                cat.status = 'low';
            } else if (total > 0 && cat.percentage > catDef.ideal.max) {
                cat.status = 'high';
            } else {
                cat.status = 'ok';
            }
        }

        return {
            total,
            categories: results,
            density: Math.round(density * 10) / 10,
            wordCount,
            warnings,
            repetitions
        };
    },

    /**
     * Génère les messages d'avertissement pour les connecteurs.
     */
    _generateConnectorWarnings(categories, total, density, wordCount, repetitions) {
        const data = this._getData();
        const warnings = [];

        // Densité globale
        if (wordCount > 50) {
            if (density < 0.5) {
                warnings.push({ type: 'info', key: 'connectors.warning.too_few' });
            } else if (density > 5) {
                warnings.push({ type: 'warning', key: 'connectors.warning.too_many' });
            }
        }

        // Déséquilibre
        if (total >= 5) {
            for (const [catKey, cat] of Object.entries(categories)) {
                const catDef = data.ConnectorsData[catKey];
                if (cat.percentage > catDef.ideal.max) {
                    warnings.push({
                        type: 'warning',
                        key: 'connectors.warning.imbalanced',
                        params: [cat.label]
                    });
                }
            }
        }

        // Opposition manquante (important pour la qualité argumentative)
        if (total >= 8 && categories.opposition && categories.opposition.count === 0) {
            warnings.push({ type: 'tip', key: 'connectors.warning.no_opposition' });
        }

        // Répétitions
        if (repetitions.length > 0) {
            repetitions.slice(0, 2).forEach(r => {
                warnings.push({
                    type: 'tip',
                    key: 'connectors.warning.repetition',
                    params: [r.word, r.count]
                });
            });
        }

        return warnings;
    },

    /**
     * Escape les caractères spéciaux pour une regex.
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "[''']");
    }
};
