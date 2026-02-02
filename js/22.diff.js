// ==========================================
// DIFF VIEWER (Comparaison de versions)
// ==========================================

let currentDiffView = 'unified';
let diffVersions = { old: null, new: null };

// [MVVM : View]
// Manipule directement le DOM (sélecteurs, affichage du modal).
function openDiffModal(versionId) {
    const current = getCurrentSceneForVersions();
    if (!current || !current.scene.versions || current.scene.versions.length < 2) {
        alert('Il faut au moins 2 versions pour comparer.');
        return;
    }

    const versions = current.scene.versions;
    const selectOld = document.getElementById('diffVersionOld');
    const selectNew = document.getElementById('diffVersionNew');

    // Remplir les sélecteurs
    selectOld.innerHTML = '';
    selectNew.innerHTML = '';

    versions.forEach((v, index) => {
        const label = v.label || `Version ${v.number}`;
        const date = new Date(v.createdAt).toLocaleDateString('fr-FR');
        const optionText = `${label} (${date})`;

        selectOld.innerHTML += `<option value="${v.id}">${optionText}</option>`;
        selectNew.innerHTML += `<option value="${v.id}">${optionText}</option>`;
    });

    // Sélectionner par défaut : version cliquée vs version active (ou la plus récente)
    const clickedVersion = versions.find(v => v.id === versionId);
    const activeVersion = versions.find(v => v.isActive);

    if (clickedVersion && activeVersion && clickedVersion.id !== activeVersion.id) {
        // Comparer la version cliquée avec l'active
        if (clickedVersion.number < activeVersion.number) {
            selectOld.value = clickedVersion.id;
            selectNew.value = activeVersion.id;
        } else {
            selectOld.value = activeVersion.id;
            selectNew.value = clickedVersion.id;
        }
    } else {
        // Comparer les 2 dernières versions
        const sorted = [...versions].sort((a, b) => b.number - a.number);
        if (sorted.length >= 2) {
            selectOld.value = sorted[1].id;
            selectNew.value = sorted[0].id;
        }
    }

    document.getElementById('diffModal').style.display = 'flex';
    updateDiff();
}

// [MVVM : View]
// Simple action d'interface qui masque le modal.
function closeDiffModal() {
    document.getElementById('diffModal').style.display = 'none';
}

// [MVVM : Other]
// Group: Util / Helper | Naming: DiffUtils
// Met à jour l'état (ViewModel) et modifie des classes DOM (View) (Mixte).
function setDiffView(view) {
    currentDiffView = view;
    document.getElementById('btnDiffUnified').classList.toggle('active', view === 'unified');
    document.getElementById('btnDiffSide').classList.toggle('active', view === 'side');
    updateDiff();
}

// [MVVM : ViewModel]
// Orchestrateur — récupère les données, calcule le diff et appelle le rendu.
function updateDiff() {
    const current = getCurrentSceneForVersions();
    if (!current) return;

    const versions = current.scene.versions;
    const oldId = parseInt(document.getElementById('diffVersionOld').value);
    const newId = parseInt(document.getElementById('diffVersionNew').value);

    const oldVersion = versions.find(v => v.id === oldId);
    const newVersion = versions.find(v => v.id === newId);

    if (!oldVersion || !newVersion) return;

    // Extraire le texte brut du HTML
    const oldText = stripHtml(oldVersion.content || '');
    const newText = stripHtml(newVersion.content || '');

    // Calculer le diff
    const diff = computeDiff(oldText, newText);

    // Afficher les statistiques
    updateDiffStats(diff);

    // Afficher le diff selon le mode
    if (currentDiffView === 'unified') {
        renderUnifiedDiff(diff, oldVersion, newVersion);
    } else {
        renderSideBySideDiff(diff, oldVersion, newVersion);
    }
}

// [MVVM : Model]
// Transformation de données (HTML -> texte brut).
function stripHtml(html) {
    // Remplacer les balises de bloc par des sauts de ligne
    let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/tr>/gi, '\n');

    // Supprimer toutes les autres balises HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    text = tmp.textContent || tmp.innerText || '';

    // Normaliser les sauts de ligne multiples
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

// [MVVM : Model]
// Calcule la différence entre deux textes (logique métier).
function computeDiff(oldText, newText) {
    // Normaliser les textes - préserver les sauts de ligne comme marqueurs
    const oldWords = tokenizeText(oldText);
    const newWords = tokenizeText(newText);

    // Utiliser l'algorithme de Myers (comme git)
    const diff = myersDiff(oldWords, newWords);

    // Convertir en format paragraphe unique pour le rendu
    return [{ type: 'paragraph', items: diff }];
}

// [MVVM : Model]
// Prépare les données (tokenisation) pour l'algorithme de diff.
function tokenizeText(text) {
    // Diviser le texte en tokens (mots + marqueurs de saut de ligne)
    const tokens = [];
    const lines = text.split(/\n/);

    lines.forEach((line, lineIndex) => {
        const words = line.split(/\s+/).filter(w => w.length > 0);
        words.forEach(word => {
            tokens.push({ word: word, isBreak: false });
        });
        // Ajouter un marqueur de saut de ligne (sauf pour la dernière ligne)
        if (lineIndex < lines.length - 1) {
            tokens.push({ word: '\n', isBreak: true });
        }
    });

    return tokens;
}

// Algorithme de Myers - le même que git utilise
// [MVVM : Model]
// Implémentation de l'algorithme de diff (Myers).
function myersDiff(oldTokens, newTokens) {
    const N = oldTokens.length;
    const M = newTokens.length;
    const MAX = N + M;

    // Fonction pour comparer deux tokens
    const tokensEqual = (a, b) => {
        if (a.isBreak && b.isBreak) return true;
        if (a.isBreak || b.isBreak) return false;
        return a.word === b.word;
    };

    // Cas simples
    if (N === 0 && M === 0) return [];
    if (N === 0) return newTokens.map(t => ({ type: 'added', text: t.word, isBreak: t.isBreak }));
    if (M === 0) return oldTokens.map(t => ({ type: 'removed', text: t.word, isBreak: t.isBreak }));

    // V contient les endpoints les plus éloignés pour chaque diagonale
    const V = new Map();
    V.set(1, 0);

    // Trace garde l'historique pour reconstruire le chemin
    const trace = [];

    // Chercher le chemin le plus court
    let found = false;
    for (let D = 0; D <= MAX && !found; D++) {
        trace.push(new Map(V));

        for (let k = -D; k <= D; k += 2) {
            // Décider si on va vers le bas ou vers la droite
            let x;
            if (k === -D || (k !== D && (V.get(k - 1) || 0) < (V.get(k + 1) || 0))) {
                x = V.get(k + 1) || 0; // Aller vers le bas (insertion)
            } else {
                x = (V.get(k - 1) || 0) + 1; // Aller vers la droite (suppression)
            }

            let y = x - k;

            // Suivre la diagonale (éléments identiques)
            while (x < N && y < M && tokensEqual(oldTokens[x], newTokens[y])) {
                x++;
                y++;
            }

            V.set(k, x);

            // Vérifier si on a atteint la fin
            if (x >= N && y >= M) {
                found = true;
                break;
            }
        }
    }

    // Reconstruire le chemin (backtrack)
    const result = [];
    let x = N;
    let y = M;

    for (let d = trace.length - 1; d >= 0; d--) {
        const V = trace[d];
        const k = x - y;

        let prevK;
        if (k === -d || (k !== d && (V.get(k - 1) || 0) < (V.get(k + 1) || 0))) {
            prevK = k + 1;
        } else {
            prevK = k - 1;
        }

        const prevX = V.get(prevK) || 0;
        const prevY = prevX - prevK;

        // Ajouter les diagonales (éléments identiques)
        while (x > prevX && y > prevY) {
            x--;
            y--;
            result.unshift({ type: 'same', text: oldTokens[x].word, isBreak: oldTokens[x].isBreak });
        }

        // Ajouter l'insertion ou la suppression
        if (d > 0) {
            if (x === prevX) {
                // Insertion
                y--;
                result.unshift({ type: 'added', text: newTokens[y].word, isBreak: newTokens[y].isBreak });
            } else {
                // Suppression
                x--;
                result.unshift({ type: 'removed', text: oldTokens[x].word, isBreak: oldTokens[x].isBreak });
            }
        }
    }

    return result;
}

// [MVVM : Model]
// Aide à construire la structure de donnée de sortie (utilitaire).
function addParagraphToResult(result, text, type) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const items = words.map(word => ({ type: type, text: word }));
    result.push({ type: 'paragraph', status: type, items: items });
}

// [MVVM : View]
// Met à jour le DOM pour afficher des statistiques.
function updateDiffStats(diff) {
    let added = 0;
    let removed = 0;

    diff.forEach(para => {
        if (para.items) {
            para.items.forEach(item => {
                if (item.isBreak) return; // Ignorer les sauts de ligne
                if (item.type === 'added' && item.text.trim()) added++;
                if (item.type === 'removed' && item.text.trim()) removed++;
            });
        }
    });

    document.getElementById('diffStats').innerHTML = `
                <span class="diff-stat added">+${added} mot${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''}</span>
                <span class="diff-stat removed">−${removed} mot${removed > 1 ? 's' : ''} supprimé${removed > 1 ? 's' : ''}</span>
            `;
}

// [MVVM : View]
// Génère et injecte du HTML pour la vue unifiée.
function renderUnifiedDiff(diff, oldVersion, newVersion) {
    const container = document.getElementById('diffContent');

    if (diff.length === 0) {
        container.innerHTML = `
                    <div class="diff-empty-state">
                        <div class="diff-empty-state-icon"><i data-lucide="check" style="width:48px;height:48px;"></i></div>
                        <div>Les deux versions sont identiques</div>
                    </div>
                `;
        return;
    }

    let html = '<div class="diff-unified">';

    diff.forEach((para, paraIndex) => {
        if (paraIndex > 0) html += '<br><br>';

        const paraClass = para.status === 'added' ? 'diff-paragraph added' :
            para.status === 'removed' ? 'diff-paragraph removed' :
                'diff-paragraph';

        html += `<div class="${paraClass}">`;

        if (para.items) {
            let needSpace = false;
            para.items.forEach((item) => {
                // Gérer les sauts de ligne
                if (item.isBreak) {
                    html += '<br>';
                    needSpace = false;
                    return;
                }

                const space = needSpace ? ' ' : '';

                if (item.type === 'same') {
                    html += space + escapeHtml(item.text);
                } else if (item.type === 'added') {
                    html += space + `<span class="diff-word added">${escapeHtml(item.text)}</span>`;
                } else if (item.type === 'removed') {
                    html += space + `<span class="diff-word removed">${escapeHtml(item.text)}</span>`;
                }
                needSpace = true;
            });
        }

        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// [MVVM : View]
// Génère et injecte le HTML pour l'affichage côte-à-côte.
function renderSideBySideDiff(diff, oldVersion, newVersion) {
    const container = document.getElementById('diffContent');

    const oldLabel = oldVersion.label || `Version ${oldVersion.number}`;
    const newLabel = newVersion.label || `Version ${newVersion.number}`;
    const oldDate = new Date(oldVersion.createdAt).toLocaleDateString('fr-FR');
    const newDate = new Date(newVersion.createdAt).toLocaleDateString('fr-FR');

    let oldHtml = '';
    let newHtml = '';

    diff.forEach((para, paraIndex) => {
        if (paraIndex > 0) {
            oldHtml += '<br><br>';
            newHtml += '<br><br>';
        }

        if (para.status === 'removed') {
            // Paragraphe supprimé - seulement à gauche
            oldHtml += '<div class="diff-paragraph removed">';
            let needSpace = false;
            para.items.forEach((item) => {
                if (item.isBreak) {
                    oldHtml += '<br>';
                    needSpace = false;
                    return;
                }
                const space = needSpace ? ' ' : '';
                oldHtml += space + `<span class="diff-word removed">${escapeHtml(item.text)}</span>`;
                needSpace = true;
            });
            oldHtml += '</div>';
        } else if (para.status === 'added') {
            // Paragraphe ajouté - seulement à droite
            newHtml += '<div class="diff-paragraph added">';
            let needSpace = false;
            para.items.forEach((item) => {
                if (item.isBreak) {
                    newHtml += '<br>';
                    needSpace = false;
                    return;
                }
                const space = needSpace ? ' ' : '';
                newHtml += space + `<span class="diff-word added">${escapeHtml(item.text)}</span>`;
                needSpace = true;
            });
            newHtml += '</div>';
        } else if (para.status === 'same') {
            // Paragraphe identique
            const text = para.items.filter(item => !item.isBreak).map(item => item.text).join(' ');
            oldHtml += `<div class="diff-paragraph">${escapeHtml(text)}</div>`;
            newHtml += `<div class="diff-paragraph">${escapeHtml(text)}</div>`;
        } else {
            // Paragraphe modifié - afficher le diff mot par mot
            oldHtml += '<div class="diff-paragraph modified">';
            newHtml += '<div class="diff-paragraph modified">';

            let oldNeedSpace = false;
            let newNeedSpace = false;

            para.items.forEach(item => {
                if (item.isBreak) {
                    if (item.type === 'same' || item.type === 'removed') {
                        oldHtml += '<br>';
                        oldNeedSpace = false;
                    }
                    if (item.type === 'same' || item.type === 'added') {
                        newHtml += '<br>';
                        newNeedSpace = false;
                    }
                    return;
                }

                if (item.type === 'same') {
                    const oldSpace = oldNeedSpace ? ' ' : '';
                    const newSpace = newNeedSpace ? ' ' : '';
                    oldHtml += oldSpace + escapeHtml(item.text);
                    newHtml += newSpace + escapeHtml(item.text);
                    oldNeedSpace = true;
                    newNeedSpace = true;
                } else if (item.type === 'added') {
                    const space = newNeedSpace ? ' ' : '';
                    newHtml += space + `<span class="diff-word added">${escapeHtml(item.text)}</span>`;
                    newNeedSpace = true;
                } else if (item.type === 'removed') {
                    const space = oldNeedSpace ? ' ' : '';
                    oldHtml += space + `<span class="diff-word removed">${escapeHtml(item.text)}</span>`;
                    oldNeedSpace = true;
                }
            });

            oldHtml += '</div>';
            newHtml += '</div>';
        }
    });

    container.innerHTML = `
                <div class="diff-side-by-side">
                    <div class="diff-side">
                        <div class="diff-side-header old">
                            <span>${oldLabel}</span>
                            <span style="font-weight: normal; font-size: 0.75rem;">${oldDate} • ${oldVersion.wordCount} mots</span>
                        </div>
                        <div class="diff-side-content">${oldHtml}</div>
                    </div>
                    <div class="diff-side">
                        <div class="diff-side-header new">
                            <span>${newLabel}</span>
                            <span style="font-weight: normal; font-size: 0.75rem;">${newDate} • ${newVersion.wordCount} mots</span>
                        </div>
                        <div class="diff-side-content">${newHtml}</div>
                    </div>
                </div>
            `;
}

// [MVVM : View]
// Sécurise le texte inséré dans le DOM (utilitaire).
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

