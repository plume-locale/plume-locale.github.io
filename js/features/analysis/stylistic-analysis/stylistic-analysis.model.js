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
        if (!text) return [];
        return text
            .replace(/['’‘]/g, "'") // Normaliser apostrophes
            // Insérer un espace après les élisions françaises pour forcer le split
            // On cible l', d', j', n', s', m', t', c', qu'
            .replace(/\b(l|d|j|n|s|m|t|c|qu)'/g, "$1' ")
            .split(/[\s\n\r,;:!?«»""()[\]{}<>…]+/)
            .map(w => w.replace(/[.,!?;:«»"()[\]{}]/g, '').trim())
            .filter(w => w.length > 0);
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

            // Vérification dans le lexique (n-grams de 4 à 1 mots)
            let matchedScore = undefined;
            let matchedLength = 0;

            for (let n = 4; n >= 1; n--) {
                if (i + n <= tokens.length) {
                    const ngram = tokens.slice(i, i + n).join(' ');
                    const score = data.SentimentLexicon[ngram];
                    if (score !== undefined) {
                        matchedScore = score;
                        matchedLength = n;
                        break;
                    }
                }
            }

            if (matchedScore !== undefined) {
                let finalScore = matchedScore;

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
                scoredCount += matchedLength;

                if (finalScore > 0) positiveCount++;
                else if (finalScore < 0) negativeCount++;

                scoredWords.push({ 
                    word: tokens.slice(i, i + matchedLength).join(' '), 
                    score: finalScore 
                });
                
                i += (matchedLength - 1); // Sauter les mots suivants car déjà traités
            } else {
                // Réinitialiser négation après 2 mots non trouvés
                negationActive = false;
            }
        }

        // Score normalisé [-1, 1]
        // On divise par scoredCount * 2 au lieu de 3 pour être moins conservateur
        const normalizedScore = scoredCount > 0 ? Math.max(-1, Math.min(1, totalScore / (scoredCount * 2))) : 0;

        // Densité sentimentale (proportion de mots émotionnels)
        const sentimentIntensity = wordCount > 0 ? scoredCount / wordCount : 0;

        // Répartition en % (parmi les mots analysés)
        const positiveRatio = Math.round((positiveCount / Math.max(1, scoredCount)) * 100);
        const negativeRatio = Math.round((negativeCount / Math.max(1, scoredCount)) * 100);
        const neutralRatio = Math.max(0, 100 - positiveRatio - negativeRatio);

        // Label dominant (avec pondération par l'intensité)
        // Si l'intensité est trop faible (< 0.5%), on considère le ton comme neutre globalement
        const INTENSITY_THRESHOLD = 0.005; 
        
        let label, dominantLabel;
        if (sentimentIntensity < INTENSITY_THRESHOLD) {
            label = 'neutral';
            dominantLabel = 'neutral';
        } else {
            // Label principal (plus sensible)
            if (normalizedScore > 0.05) {
                label = 'positive';
            } else if (normalizedScore < -0.05) {
                label = 'negative';
            } else {
                label = 'neutral';
            }
            
            // Label détaillé (dominantLabel)
            // Seuils ajustés pour être plus naturels
            if (normalizedScore > 0.45) dominantLabel = 'very_positive';
            else if (normalizedScore > 0.12) dominantLabel = 'positive';
            else if (normalizedScore > 0.05) dominantLabel = 'slightly_positive';
            else if (normalizedScore < -0.45) dominantLabel = 'very_negative';
            else if (normalizedScore < -0.12) dominantLabel = 'negative';
            else if (normalizedScore < -0.05) dominantLabel = 'slightly_negative';
            else dominantLabel = 'neutral';
        }


        return {
            score: normalizedScore,
            label,
            dominantLabel,
            intensity: Math.round(sentimentIntensity * 1000) / 10, // en pour mille ou %
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
    analyzeConnectors(htmlOrText, styleId = 'hybrid') {
        const data = this._getData();
        const presets = StylisticAnalysisData.ConnectorPresets;
        const selectedStyle = presets[styleId] || presets['hybrid'];
        const text = this._extractText(htmlOrText);
        const wordCount = this._tokenize(text).length;

        if (wordCount < 10) {
            return { total: 0, categories: {}, density: 0, warnings: [], wordCount };
        }

        const results = {};
        const foundAll = []; // { category, item, count }

        for (const [catKey, catDef] of Object.entries(data.ConnectorsData)) {
            // Récupérer le seuil idéal selon le style sélectionné
            const ideal = selectedStyle.thresholds[catKey] || catDef.ideal;

            const catResult = {
                label: catDef.label,
                icon: catDef.icon,
                color: catDef.color,
                ideal: ideal,
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
        let repetitions = [];
        for (const [catKey, cat] of Object.entries(results)) {
            for (const [word, count] of Object.entries(cat.found)) {
                if (count >= 3) {
                    repetitions.push({ word, count, category: cat.label });
                }
            }
        }

        // Trier par fréquence décroissante pour afficher les répétitions les plus graves en premier
        repetitions.sort((a, b) => b.count - a.count);

        // Génération des warnings
        // Génération des warnings
        const warnings = this._generateConnectorWarnings(results, total, density, wordCount, repetitions, selectedStyle);

        // Statuts par catégorie
        for (const [catKey, cat] of Object.entries(results)) {
            const catDef = data.ConnectorsData[catKey];
            if (cat.count === 0) {
                cat.status = 'missing';
            } else if (total > 0 && cat.percentage < cat.ideal.min) {
                cat.status = 'low';
            } else if (total > 0 && cat.percentage > cat.ideal.max) {
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
    _generateConnectorWarnings(categories, total, density, wordCount, repetitions, selectedStyle) {
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
                const ideal = selectedStyle.thresholds[catKey] || data.ConnectorsData[catKey].ideal;
                if (cat.percentage > ideal.max) {
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
