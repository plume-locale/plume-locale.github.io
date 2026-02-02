// ============================================
// Module: features/analysis
// Généré automatiquement - Plume Writer
// ============================================
// Initialize
// === TENSION WORDS MANAGEMENT ===

// Valeurs par défaut des mots de tension
const DEFAULT_TENSION_WORDS = {
    high: [
        'combat', 'bataille', 'mort', 'tuer', 'danger', 'peur', 'terreur', 'cri', 'hurler',
        'sang', 'blessure', 'fuir', 'course', 'poursuite', 'menace', 'attaque', 'explosion',
        'feu', 'incendie', 'catastrophe', 'urgence', 'panique', 'désespoir', 'tragédie',
        'révélation', 'secret', 'trahison', 'conflit', 'confrontation', 'affrontement',
        'climax', 'crucial', 'décisif', 'critique', 'vital', 'dramatique'
    ],
    medium: [
        'mystère', 'suspense', 'intrigue', 'complot', 'enquête', 'découverte', 'surprise',
        'tension', 'stress', 'angoisse', 'inquiétude', 'doute', 'hésitation', 'dilemme',
        'choix', 'décision', 'tournant', 'changement', 'transformation'
    ],
    low: [
        'calme', 'paix', 'repos', 'détente', 'tranquille', 'paisible', 'serein',
        'conversation', 'discussion', 'réflexion', 'souvenir', 'rêve', 'pensée'
    ]
};

// Récupérer les mots de tension (personnalisés ou par défaut)
// [MVVM : Model]
// Récupère les mots de tension (personnalisés ou par défaut) depuis le localStorage.
function getTensionWords() {
    const stored = localStorage.getItem('tensionWords');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erreur lors du chargement des mots de tension:', e);
            return DEFAULT_TENSION_WORDS;
        }
    }
    return DEFAULT_TENSION_WORDS;
}

// Sauvegarder les mots de tension
// [MVVM : Model]
// Sauvegarde les mots de tension dans le localStorage.
function saveTensionWordsToStorage(words) {
    localStorage.setItem('tensionWords', JSON.stringify(words));
}

// Ouvrir l'éditeur de mots de tension
// [MVVM : View]
// Ouvre le modal de l'éditeur de mots de tension et déclenche le chargement des données.
function openTensionWordsEditor() {
    document.getElementById('tensionWordsModal').classList.add('active');
    loadTensionWordsInEditor();
}

// Charger les mots dans l'éditeur
// [MVVM : ViewModel]
// Récupère les données et met à jour l'affichage de l'éditeur pour les trois catégories de tension.
function loadTensionWordsInEditor() {
    const words = getTensionWords();

    // Charger les mots de haute tension
    const highList = document.getElementById('highTensionList');
    if (highList) {
        highList.innerHTML = '';
        words.high.forEach((word, index) => {
            highList.innerHTML += createWordElement(word, 'high', index);
        });
    }

    // Charger les mots de tension moyenne
    const mediumList = document.getElementById('mediumTensionList');
    if (mediumList) {
        mediumList.innerHTML = '';
        words.medium.forEach((word, index) => {
            mediumList.innerHTML += createWordElement(word, 'medium', index);
        });
    }

    // Charger les mots de faible tension
    const lowList = document.getElementById('lowTensionList');
    if (lowList) {
        lowList.innerHTML = '';
        words.low.forEach((word, index) => {
            lowList.innerHTML += createWordElement(word, 'low', index);
        });
    }
}

// Créer un élément de mot avec bouton de suppression
// [MVVM : View]
// Génère le fragment HTML représentant un mot avec son bouton de suppression.
function createWordElement(word, type, index) {
    const colors = {
        high: 'var(--accent-red)',
        medium: '#e6a23c',
        low: 'var(--accent-blue)'
    };

    return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-primary); border-radius: 4px; border: 1px solid var(--border-color);">
                    <span style="font-size: 0.85rem; color: var(--text-primary);">${word}</span>
                    <button onclick="removeTensionWord('${type}', ${index})" 
                            style="background: none; border: none; color: ${colors[type]}; cursor: pointer; font-size: 1rem; padding: 0 0.25rem; opacity: 0.7; transition: opacity 0.2s;"
                            onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'"
                            title="Supprimer ce mot">
                        ×
                    </button>
                </div>
            `;
}

// Ajouter un mot de tension
// [MVVM : ViewModel]
// Valide et ajoute un nouveau mot à une catégorie spécifique, puis met à jour le modèle et la vue.
function addTensionWord(type) {
    const input = document.getElementById(`${type}TensionInput`);
    const word = input.value.trim().toLowerCase();

    if (!word) {
        showNotification('⚠️ Veuillez entrer un mot', 'warning');
        return;
    }

    const words = getTensionWords();

    // Vérifier si le mot existe déjà
    if (words[type].includes(word)) {
        showNotification('⚠️ Ce mot existe déjà dans cette catégorie', 'warning');
        return;
    }

    // Vérifier si le mot existe dans une autre catégorie
    for (const category in words) {
        if (category !== type && words[category].includes(word)) {
            showNotification(`⚠️ Ce mot existe déjà dans la catégorie "${category === 'high' ? 'haute' : category === 'medium' ? 'moyenne' : 'faible'} tension"`, 'warning');
            return;
        }
    }

    // Ajouter le mot
    words[type].push(word);
    saveTensionWordsToStorage(words);

    // Recharger la liste
    loadTensionWordsInEditor();

    // Vider l'input
    input.value = '';

    showNotification(`✓ Mot "${word}" ajouté`, 'success');
}

// Supprimer un mot de tension
// [MVVM : ViewModel]
// Supprime un mot par son index dans une catégorie, puis met à jour le modèle et la vue.
function removeTensionWord(type, index) {
    const words = getTensionWords();
    const removedWord = words[type][index];

    words[type].splice(index, 1);
    saveTensionWordsToStorage(words);

    // Recharger la liste
    loadTensionWordsInEditor();

    showNotification(`✓ Mot "${removedWord}" supprimé`, 'success');
}

// Enregistrer les modifications
// [MVVM : View]
// Ferme le modal et informe l'utilisateur que les modifications ont été enregistrées.
function saveTensionWords() {
    closeModal('tensionWordsModal');
    showNotification('✓ Mots de tension enregistrés. Le graphique sera recalculé lors de la prochaine visualisation.', 'success');
}

// Réinitialiser aux valeurs par défaut
// [MVVM : ViewModel]
// Restaure le dictionnaire par défaut après confirmation, puis met à jour le modèle et la vue.
function resetTensionWordsToDefault() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les mots de tension aux valeurs par défaut ? Cette action est irréversible.')) {
        saveTensionWordsToStorage(DEFAULT_TENSION_WORDS);
        loadTensionWordsInEditor();
        showNotification('✓ Mots de tension réinitialisés aux valeurs par défaut', 'success');
    }
}

// Exporter les dictionnaires de mots de tension
// [MVVM : ViewModel]
// Formate les dictionnaires actuels et déclenche le téléchargement d'un fichier texte.
function exportTensionWords() {
    const words = getTensionWords();

    // Créer trois fichiers texte, un par catégorie
    const highWords = words.high.join('\n');
    const mediumWords = words.medium.join('\n');
    const lowWords = words.low.join('\n');

    // Créer un fichier ZIP virtuel avec les trois fichiers
    const content = `=== DICTIONNAIRES DE MOTS DE TENSION ===
Exporté le ${new Date().toLocaleString('fr-FR')}

=== HAUTE TENSION (${words.high.length} mots) ===
${highWords}

=== TENSION MOYENNE (${words.medium.length} mots) ===
${mediumWords}

=== FAIBLE TENSION (${words.low.length} mots) ===
${lowWords}
`;

    // Créer et télécharger le fichier
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictionnaires-tension-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('✓ Dictionnaires exportés avec succès', 'success');
}

// === BULK IMPORT FOR TENSION WORDS ===

let currentBulkImportType = null;

// Ouvrir le modal d'import en masse
// [MVVM : View]
// Configure et affiche le modal d'importation en masse pour une catégorie donnée.
function openBulkImport(type) {
    currentBulkImportType = type;

    const titles = {
        high: '📥 Import en masse - Haute tension',
        medium: '📥 Import en masse - Tension moyenne',
        low: '📥 Import en masse - Faible tension'
    };

    document.getElementById('bulkImportTitle').textContent = titles[type];
    document.getElementById('bulkImportText').value = '';
    document.getElementById('bulkImportFile').value = '';
    document.querySelector('input[name="importMode"][value="add"]').checked = true;

    document.getElementById('bulkImportModal').classList.add('active');
}

// Traiter l'import en masse
// [MVVM : ViewModel]
// Récupère la source d'importation (texte ou fichier) et orchestre le processus de lecture.
function processBulkImport() {
    if (!currentBulkImportType) return;

    const textarea = document.getElementById('bulkImportText');
    const fileInput = document.getElementById('bulkImportFile');
    const mode = document.querySelector('input[name="importMode"]:checked').value;

    // Vérifier si un fichier est sélectionné
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const content = e.target.result;
            importWordsFromText(content, currentBulkImportType, mode);
        };

        reader.onerror = function () {
            showNotification('❌ Erreur lors de la lecture du fichier', 'error');
        };

        reader.readAsText(file);
    } else if (textarea.value.trim()) {
        // Utiliser le texte collé
        importWordsFromText(textarea.value, currentBulkImportType, mode);
    } else {
        showNotification('⚠️ Veuillez coller du texte ou sélectionner un fichier', 'warning');
    }
}

// Importer les mots depuis du texte
// [MVVM : ViewModel]
// Analyse le texte brut, filtre les doublons et les mots vides, puis intègre les résultats au modèle.
function importWordsFromText(text, type, mode) {
    // Nettoyer et parser le texte
    let words = [];

    // Séparer par retours à la ligne ET par virgules
    const lines = text.split(/\r?\n/);
    lines.forEach(line => {
        // Pour chaque ligne, séparer aussi par virgules
        const wordsInLine = line.split(',');
        wordsInLine.forEach(word => {
            const cleaned = word.trim().toLowerCase();
            if (cleaned && cleaned.length > 0) {
                words.push(cleaned);
            }
        });
    });

    // Supprimer les doublons
    words = [...new Set(words)];

    if (words.length === 0) {
        showNotification('⚠️ Aucun mot valide trouvé', 'warning');
        return;
    }

    // Récupérer les mots existants
    const tensionWords = getTensionWords();

    if (mode === 'replace') {
        // Remplacer tous les mots
        tensionWords[type] = words;
        showNotification(`✓ ${words.length} mots importés (remplacement)`, 'success');
    } else {
        // Ajouter aux mots existants (sans doublons)
        const existingWords = new Set(tensionWords[type]);
        let addedCount = 0;

        words.forEach(word => {
            if (!existingWords.has(word)) {
                tensionWords[type].push(word);
                addedCount++;
            }
        });

        const skippedCount = words.length - addedCount;
        if (addedCount > 0) {
            showNotification(`✓ ${addedCount} mot(s) ajouté(s)${skippedCount > 0 ? ` (${skippedCount} doublon(s) ignoré(s))` : ''}`, 'success');
        } else {
            showNotification(`⚠️ Tous les mots existent déjà (${skippedCount} doublon(s))`, 'warning');
        }
    }

    // Sauvegarder et recharger
    saveTensionWordsToStorage(tensionWords);
    loadTensionWordsInEditor();

    // Fermer le modal
    closeModal('bulkImportModal');
}

// Gestionnaire pour le changement de fichier
// [MVVM : View]
// Initialise les écouteurs d'événements pour la gestion interactive du modal d'importation en masse.
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('bulkImportFile');
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                // Vider le textarea si un fichier est sélectionné
                document.getElementById('bulkImportText').value = '';
            }
        });
    }

    const textarea = document.getElementById('bulkImportText');
    if (textarea) {
        textarea.addEventListener('input', function () {
            if (this.value.trim()) {
                // Vider le file input si du texte est saisi
                document.getElementById('bulkImportFile').value = '';
            }
        });
    }
});

/**
 * [MVVM : Model]
 * Calcule la tension en temps réel pour un bloc de texte donné.
 * @param {string} text - Le contenu HTML ou brut à analyser.
 * @param {Object} [context] - Contexte narratif optionnel {actId, chapterId, sceneId}
 * @returns {Object} Un objet contenant le score (0-100) et le détail des mots trouvés.
 */
function calculateLiveTension(text, context = null) {
    if (!text || text.trim() === '' || text === '<p><br></p>') {
        return { score: 0, details: { high: 0, medium: 0, low: 0 }, foundWords: { high: [], medium: [], low: [] } };
    }

    // Nettoyer le HTML de manière consistante
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    // Remplacer les blocks par des espaces pour éviter les mots collés lors du stripping
    const blocks = tempDiv.querySelectorAll('p, div, br, h1, h2, h3');
    blocks.forEach(b => {
        if (b.tagName === 'BR') b.after(' ');
        else b.after(' ');
    });

    const cleanText = tempDiv.textContent.toLowerCase();
    const tensionWords = getTensionWords();
    const foundWords = { high: [], medium: [], low: [] };
    let lexicalScore = 0;

    // 1. ANALYSE LEXICALE
    tensionWords.high.forEach(word => {
        if (!word) return;
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) {
            lexicalScore += matches.length * 8;
            foundWords.high.push(word);
        }
    });

    tensionWords.medium.forEach(word => {
        if (!word) return;
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) {
            lexicalScore += matches.length * 4;
            foundWords.medium.push(word);
        }
    });

    tensionWords.low.forEach(word => {
        if (!word) return;
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) {
            lexicalScore -= matches.length * 5;
            foundWords.low.push(word);
        }
    });

    // 2. ANALYSE PONCTUATION
    const exclamations = (cleanText.match(/!/g) || []).length;
    const questions = (cleanText.match(/\?/g) || []).length;
    const suspensions = (cleanText.match(/\.\.\./g) || []).length;
    lexicalScore += (exclamations * 1.5 + questions * 0.5 + suspensions * 2);

    // 3. FACTEUR DE DENSITÉ
    const wordCount = typeof getWordCount === 'function' ? getWordCount(text) : (cleanText.split(/\s+/).filter(w => w.length > 0).length || 1);

    // Formule de base pour l'intensité textuelle (0-60 points environ)
    let textIntensity = (lexicalScore / Math.sqrt(Math.max(50, wordCount))) * 5.2;

    // 4. BASELINE NARRATIVE
    let narrativeBaseline = 25; // Défaut si pas de contexte
    let structureBonus = 0;

    if (context && typeof project !== 'undefined') {
        const structuralData = getNarrativeContextData(context);
        if (structuralData) {
            narrativeBaseline = structuralData.baseline;
            if (structuralData.isCliffhanger) structureBonus = 5;
        }
    }

    // Calcul final : Baseline + Intensité textuelle + Bonus
    let finalScore = narrativeBaseline + textIntensity + structureBonus;

    // Normalisation 5-95
    finalScore = Math.max(5, Math.min(95, finalScore));

    return {
        score: Math.round(finalScore),
        details: {
            high: foundWords.high.length,
            medium: foundWords.medium.length,
            low: foundWords.low.length
        },
        foundWords: foundWords
    };
}

/**
 * [MVVM : Model]
 * Calcule la baseline narrative basée sur la position dans le récit.
 * Réutilise la même logique que le graphique d'intrigue.
 */
function getNarrativeContextData(context) {
    const { actId, chapterId, sceneId } = context;
    if (!project || !project.acts) return null;

    const actIndex = project.acts.findIndex(a => a.id === actId);
    if (actIndex === -1) return null;
    const act = project.acts[actIndex];
    const totalActs = project.acts.length;

    const chapterIndex = act.chapters.findIndex(c => c.id === chapterId);
    if (chapterIndex === -1) return null;
    const chapter = act.chapters[chapterIndex];
    const totalChapters = act.chapters.length;

    const sceneIndex = chapter.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return null;
    const totalScenes = chapter.scenes.length;

    const chapterProgress = chapterIndex / Math.max(totalChapters - 1, 1);
    const sceneProgress = sceneIndex / Math.max(totalScenes - 1, 1);
    const actProgress = actIndex / Math.max(totalActs - 1, 1);

    let baseline = 0;

    // Structure classique en 3 actes (reprise de 33.plot.refactor.js)
    if (totalActs >= 3) {
        if (actIndex === 0) {
            baseline = 10 + (chapterProgress * 15);
        } else if (actIndex === totalActs - 1) {
            if (sceneProgress < 0.7) {
                baseline = 35 + (sceneProgress * 5);
            } else {
                baseline = 40 - ((sceneProgress - 0.7) * 50);
            }
        } else {
            baseline = 20 + (actProgress * 15);
        }
    } else if (totalActs === 2) {
        if (actIndex === 0) {
            baseline = 15 + (chapterProgress * 15);
        } else {
            baseline = 30 + (sceneProgress * 10);
        }
    } else {
        baseline = 20 + (sceneProgress * 20);
    }

    return {
        baseline: baseline,
        isCliffhanger: sceneIndex === totalScenes - 1
    };
}

/**
 * [MVVM : View]
 * Met à jour le "Tension Meter" dans l'UI.
 * @param {string} text - Contenu de la scène.
 * @param {Object} [context] - Contexte {actId, chapterId, sceneId}.
 */
function updateLiveTensionMeter(text, context = null) {
    const meter = document.getElementById('liveTensionMeter');
    if (!meter) {
        injectTensionMeter();
        // On ne retourne pas, injectTensionMeter crée l'élément
    }

    const result = calculateLiveTension(text, context);
    const score = result.score;

    const circle = document.getElementById('tensionMeterFill');
    if (circle) {
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;

        if (score > 65) circle.style.stroke = 'var(--accent-red)';
        else if (score > 40) circle.style.stroke = 'var(--accent-gold)';
        else circle.style.stroke = 'var(--accent-blue)';
    }

    const valueDisplay = document.getElementById('tensionValueDisplay');
    if (valueDisplay) valueDisplay.textContent = `${score}%`;

    updateTensionTooltip(result);
}

/**
 * [MVVM : View]
 * Met à jour le contenu du tooltip de tension.
 */
function updateTensionTooltip(result) {
    const tooltip = document.getElementById('tensionTooltip');
    if (!tooltip) return;

    const highTags = result.foundWords.high.slice(0, 5).map(w => `<span class="tension-tag tension-tag-high">${w}</span>`).join('');
    const mediumTags = result.foundWords.medium.slice(0, 5).map(w => `<span class="tension-tag tension-tag-medium">${w}</span>`).join('');

    tooltip.innerHTML = `
        <div class="tension-tooltip-title">
            <i data-lucide="zap" style="width:14px;height:14px;"></i> Tension Directe
        </div>
        <div class="tension-tooltip-item">
            <span>Indice d'intensité</span>
            <strong>${result.score}%</strong>
        </div>
        <div class="tension-tooltip-item">
            <span>Mots-clés forts</span>
            <span style="color: var(--accent-red)">${result.details.high}</span>
        </div>
        <div class="tension-tooltip-item">
            <span>Mots-clés modérés</span>
            <span style="color: var(--accent-gold)">${result.details.medium}</span>
        </div>
        <div class="tension-tags-container">
            ${highTags}
            ${mediumTags}
        </div>
        <div style="margin-top: 0.75rem; font-size: 0.65rem; color: var(--text-muted); font-style: italic;">
            Analyse la scène active (sous le curseur ou visible à l'écran).
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * [MVVM : View]
 * Injecte le composant Tension Meter dans le DOM s'il n'existe pas.
 */
function injectTensionMeter() {
    if (document.getElementById('liveTensionMeter')) return;

    const div = document.createElement('div');
    div.id = 'liveTensionMeter';
    div.className = 'tension-meter-container';
    div.setAttribute('title', 'Tension dramatique en temps réel');

    div.innerHTML = `
        <svg class="tension-meter-svg" viewBox="0 0 50 50">
            <circle class="tension-meter-bg" cx="25" cy="25" r="22"></circle>
            <circle class="tension-meter-fill" id="tensionMeterFill" cx="25" cy="25" r="22" stroke-dasharray="138.2" stroke-dashoffset="138.2"></circle>
        </svg>
        <div class="tension-value-display" id="tensionValueDisplay">--</div>
        <div class="tension-tooltip" id="tensionTooltip"></div>
    `;

    document.body.appendChild(div);

    if (typeof focusModeActive !== 'undefined' && focusModeActive) {
        div.classList.add('focus-hide');
    }
}
