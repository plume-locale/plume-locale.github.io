// ============================================
// AUTO-DÉTECTION DES PERSONNAGES ET LIEUX
// ============================================

let autoDetectTimeout = null;

// [MVVM : ViewModel]
// Lance la détection automatique avec un délai (Debounce)
// pour éviter de surcharger pendant la frappe.
function autoDetectLinksDebounced() {
    clearTimeout(autoDetectTimeout);
    autoDetectTimeout = setTimeout(() => {
        autoDetectLinks();
    }, 800); // Délai de 800ms après arrêt de la frappe
}

// [MVVM : ViewModel]
// Accès aux données contextuelles.
// Récupère l'objet "scène" courant depuis le modèle global (project).
function getCurrentScene() {
    if (!currentActId || !currentChapterId || !currentSceneId) return null;

    // On suppose que 'project' est global
    const act = project.acts.find(a => a.id === currentActId);
    if (!act) return null;
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    if (!chapter) return null;

    return chapter.scenes.find(s => s.id === currentSceneId);
}

// [MVVM : Model]
// Utilitaire pur de manipulation de données.
// Modifie un tableau en place (mutation de données).
function removeIdfromArray(arr, id) {
    const index = arr.indexOf(id);
    if (index > -1) {
        arr.splice(index, 1);
        return true;
    }
    return false;
}

// [MVVM : ViewModel]
// Cœur de la logique de détection (Business Logic).
// Analyse le texte et met à jour les listes (Suggérés, Présents, Absents)
function autoDetectLinks() {
    const scene = getCurrentScene();
    if (!scene) return;

    // Obtenir le texte brut de la scène depuis l'éditeur
    let editor = null;
    if (typeof currentSceneId !== 'undefined' && currentSceneId) {
        editor = document.querySelector(`.editor-textarea[data-scene-id="${currentSceneId}"]`);
    }
    // Fallback si pas de sélecteur spécifique ou pas trouvé (ex: vue simple)
    if (!editor) {
        editor = document.querySelector('.editor-textarea');
    }

    if (!editor) return;

    const temp = document.createElement('div');
    temp.innerHTML = editor.innerHTML;
    const sceneText = temp.textContent || temp.innerText || '';

    // Normaliser le texte pour la recherche (sans accents, minuscule)
    const normalizedText = normalizeForSearch(sceneText);

    // Initialiser les tableaux si nécessaire (Migration de données ou création)
    if (!scene.confirmedPresentCharacters) scene.confirmedPresentCharacters = [];
    if (!scene.suggestedCharacters) scene.suggestedCharacters = [];
    if (!scene.confirmedAbsentCharacters) scene.confirmedAbsentCharacters = [];

    // Rétro-compatibilité : si linkedCharacters existe mais pas confirmedPresentCharacters
    if (scene.linkedCharacters && scene.linkedCharacters.length > 0 && scene.confirmedPresentCharacters.length === 0) {
        scene.confirmedPresentCharacters = [...scene.linkedCharacters];
        scene.linkedCharacters = []; // On vide l'ancien tableau
    }

    if (!scene.linkedElements) scene.linkedElements = [];

    let hasChanges = false;

    // ===============================================
    // LOGIQUE PERSONNAGES (3 ÉTATS)
    // ===============================================

    // 1. Identifier les noms de famille ambigus (partagés par plusieurs persos)
    const lastNameCounts = {};
    project.characters.forEach(char => {
        const normalizedLastName = normalizeForSearch(char.lastName || '');
        if (normalizedLastName) {
            lastNameCounts[normalizedLastName] = (lastNameCounts[normalizedLastName] || 0) + 1;
        }
    });

    const ambiguousLastNames = new Set(
        Object.keys(lastNameCounts).filter(name => lastNameCounts[name] > 1)
    );

    // 2. Boucle sur chaque personnage
    project.characters.forEach(char => {

        // --- Construction des patterns de recherche ---
        const namesToDetect = [];

        // A. Nom complet (Priorité haute)
        if (char.name && char.name.trim()) namesToDetect.push(char.name.trim());

        // B. Prénom (Priorité haute)
        if (char.firstName && char.firstName.trim()) namesToDetect.push(char.firstName.trim());

        // C. Surnom (Priorité haute)
        if (char.nickname && char.nickname.trim()) namesToDetect.push(char.nickname.trim());

        // D. Nom de famille (Conditionnel : Seulement si unique)
        if (char.lastName && char.lastName.trim()) {
            const normalizedLastName = normalizeForSearch(char.lastName);
            if (!ambiguousLastNames.has(normalizedLastName)) {
                namesToDetect.push(char.lastName.trim());
            }
        }

        // Nettoyage et normalisation des noms à chercher
        const uniqueNamesNormalized = [...new Set(namesToDetect)]
            .filter(n => n && n.trim())
            .map(name => normalizeForSearch(name));

        // --- Vérification de présence ---
        let isInText = false;
        for (const name of uniqueNamesNormalized) {
            // Regex : \b pour mot entier, 'i' pour insensible à la casse
            const regex = new RegExp('\\b' + escapeRegex(name) + '\\b', 'i');
            if (regex.test(normalizedText)) {
                isInText = true;
                break; // Trouvé ! Pas besoin de chercher les autres variantes
            }
        }

        // --- Gestion des États ---
        const isConfirmedPresent = scene.confirmedPresentCharacters.includes(char.id);
        const isSuggested = scene.suggestedCharacters.includes(char.id);
        const isConfirmedAbsent = scene.confirmedAbsentCharacters.includes(char.id);

        if (isInText) {
            // CAS : Le personnage est DÉTECTÉ dans le texte

            if (!isConfirmedPresent && !isConfirmedAbsent && !isSuggested) {
                // S'il n'est nulle part, on le met en SUGGESTION
                scene.suggestedCharacters.push(char.id);
                hasChanges = true;
            }
            // S'il est déjà confirmé présent ou absent, on ne touche à rien (décision humaine prioritaire)

        } else {
            // CAS : Le personnage n'est PAS DÉTECTÉ

            // S'il était suggéré, on retire la suggestion (c'était un faux positif ou le texte a changé)
            if (isSuggested) {
                removeIdfromArray(scene.suggestedCharacters, char.id);
                hasChanges = true;
            }

            // S'il était confirmé absent (parce que détecté précédemment), on retire cette confirmation
            // pour qu'il puisse être re-suggéré si le nom réapparaît plus tard.
            //if (isConfirmedAbsent) {
            //    removeIdfromArray(scene.confirmedAbsentCharacters, char.id);
            //    hasChanges = true;
            //}

            // Note: S'il est confirmé PRÉSENT, on le laisse. 
            // L'utilisateur peut vouloir lier un perso qui n'est pas explicitement nommé (sous-entendu).
        }
    });

    // ===============================================
    // LOGIQUE LIEUX/ÉLÉMENTS (Classique)
    // ===============================================
    project.world.forEach(elem => {
        const elemNameNormalized = normalizeForSearch(elem.name);
        const regex = new RegExp('\\b' + escapeRegex(elemNameNormalized) + '\\b', 'i');
        const isInText = regex.test(normalizedText);
        const isLinked = scene.linkedElements.includes(elem.id);

        if (isInText && !isLinked) {
            scene.linkedElements.push(elem.id);
            hasChanges = true;
        } else if (!isInText && isLinked) {
            const index = scene.linkedElements.indexOf(elem.id);
            if (index > -1) {
                scene.linkedElements.splice(index, 1);
                hasChanges = true;
            }
        }
    });

    // Mettre à jour si changements détectés
    if (hasChanges) {
        saveProject(); // Important pour IndexedDB
        refreshLinksPanel();
    }
}

// ============================================
// GESTION MANUELLE DES ÉTATS (ACTIONS UTILISATEUR)
// ============================================

// [MVVM : ViewModel]
// Action utilisateur (Command) : L'utilisateur valide la présence (Check)
// Déplace de Suggéré/Absent vers Présent
function confirmCharacterPresence(charId) {
    const scene = getCurrentScene();
    if (!scene) return;

    // 1. Nettoyer les autres listes
    removeIdfromArray(scene.suggestedCharacters, charId);
    removeIdfromArray(scene.confirmedAbsentCharacters, charId);

    // 2. Ajouter aux présents si pas déjà là
    if (!scene.confirmedPresentCharacters.includes(charId)) {
        scene.confirmedPresentCharacters.push(charId);
    }

    saveProject();
    refreshLinksPanel();
}

// [MVVM : ViewModel]
// Action utilisateur (Command) : L'utilisateur refuse la présence (Croix)
// Déplace de Suggéré/Présent vers Absent
function confirmCharacterAbsence(charId) {
    const scene = getCurrentScene();
    if (!scene) return;

    // 1. Nettoyer les autres listes
    removeIdfromArray(scene.suggestedCharacters, charId);
    removeIdfromArray(scene.confirmedPresentCharacters, charId);

    // 2. Ajouter aux absents (liste noire pour cette scène)
    if (!scene.confirmedAbsentCharacters.includes(charId)) {
        scene.confirmedAbsentCharacters.push(charId);
    }

    saveProject();
    refreshLinksPanel();
}

// ============================================
// RENDU VISUEL DU PANNEAU
// ============================================

// Fichier 08.auto-detect.js - REMPLACEMENT TOTAL DE function refreshLinksPanel()

// [MVVM : View]
// Fonction de rendu pur. Construit le DOM du panneau latéral basé sur l'état du Modèle.
function refreshLinksPanel() {
    const linksPanel = document.getElementById('linksPanel');
    if (!linksPanel) return;

    // Si c'est la nouvelle sidebar, utiliser renderLinksPanelSidebar
    if (linksPanel.classList.contains('links-panel-sidebar')) {
        if (typeof renderLinksPanelSidebar === 'function') {
            renderLinksPanelSidebar();
        }
        return;
    }

    const scene = getCurrentScene();
    if (!scene) return;

    const flexDivs = linksPanel.querySelectorAll('[style*="flex: 1"]');

    // --- 1. Rafraîchir les Personnages ---
    if (flexDivs.length >= 1) {
        const charDiv = flexDivs[0];
        const quickLinks = charDiv.querySelector('.quick-links');

        if (quickLinks) {

            // Obtenir les listes de personnages pour le rendu
            const allCharacters = project.characters || [];
            const confirmedIds = scene.confirmedPresentCharacters || [];
            const suggestedIds = scene.suggestedCharacters || [];
            const absentIds = scene.confirmedAbsentCharacters || [];

            // Filtrer les objets personnages complets
            const presentList = allCharacters.filter(c => confirmedIds.includes(c.id));
            const suggestedList = allCharacters.filter(c => suggestedIds.includes(c.id));
            const absentList = allCharacters.filter(c => absentIds.includes(c.id));

            let html = '';

            // ZONE 1 : PRÉSENTS (Validés)
            // L'en-tête est affiché, même si la liste est vide.
            html += '<h4 style="margin: 0 0 8px 0; font-size: 0.8rem; opacity: 0.8; text-align: left;"><i data-lucide="check-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> Confirmés Présents</h4>';
            if (presentList.length > 0) {
                html += presentList.map(char => `
                    <div class="link-item present" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${getAvatarHTML(char)}
                            <span>${char.name}</span>
                        </div>
                        <button onclick="confirmCharacterAbsence(${char.id})" title="Retirer (Marquer absent)" class="btn-icon">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                `).join('');
            } else {
                html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucun personnage confirmé présent.</p>';
            }


            // ZONE 2 : SUGGÉRÉS (En attente)
            // L'en-tête est affiché, même si la liste est vide.
            html += '<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8; color: var(--accent-color); text-align: left;"><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> Suggestions</h4>';
            if (suggestedList.length > 0) {
                html += suggestedList.map(char => `
                    <div class="link-item suggested" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${getAvatarHTML(char)}
                            <span>${char.name}</span>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="confirmCharacterAbsence(${char.id})" title="Ignorer" class="btn-icon">
                                <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                            </button>
                            <button onclick="confirmCharacterPresence(${char.id})" title="Valider" class="btn-icon">
                                <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucune suggestion.</p>';
            }


            // ZONE 3 : ABSENTS (Ignorés manuellement)
            // L'en-tête est affiché, même si la liste est vide.
            html += '<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8; text-align: left;"><i data-lucide="x-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> Confirmés Absents</h4>';
            if (absentList.length > 0) {
                html += absentList.map(char => `
                    <div class="link-item absent" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${getAvatarHTML(char)}
                            <span style="text-decoration: line-through;">${char.name}</span>
                        </div>
                        <button onclick="confirmCharacterPresence(${char.id})" title="Rétablir" class="btn-icon">
                            <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                `).join('');
            } else {
                html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucun personnage ignoré manuellement.</p>';
            }

            // Bouton d'ajout manuel
            html += `
                <div style="margin-top: 10px; text-align: center;">
                    <button class="btn btn-small" onclick="openCharacterLinker(${currentActId}, ${currentChapterId}, ${currentSceneId})" style="font-size: 0.75rem; padding: 4px 8px; width: 100%;">
                        <i data-lucide="plus" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> Lier manuellement
                    </button>
                </div>
            `;

            quickLinks.innerHTML = html;
        }
    }

    // --- 2. Rafraîchir les Lieux/Éléments (Nouveau Design) ---
    if (flexDivs.length >= 2) {
        const locationDiv = flexDivs[1];
        const quickLinks = locationDiv.querySelector('.quick-links');

        if (quickLinks) {

            // Les éléments n'ont qu'un seul état (lié ou non)
            const linkedIds = scene.linkedElements || [];
            const linkedElements = (project.world || []).filter(e => linkedIds.includes(e.id));

            let html = '';

            // En-tête + Bouton de liaison
            html += `
                <h4 style="margin: 0 0 8px 0; font-size: 0.8rem; opacity: 0.8; text-align: left;"><i data-lucide="globe" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;"></i> Éléments Liés</h4>
            `;

            if (linkedElements.length > 0) {
                html += linkedElements.map(elem => {
                    const iconName = getElementIcon(elem.type);
                    return `
                        <div class="link-item present" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                                <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${elem.name} (${elem.type})">${elem.name}</span>
                            </div>
                            <button onclick="toggleElementInScene(${currentActId}, ${currentChapterId}, ${currentSceneId}, ${elem.id}); openScene(${currentActId}, ${currentChapterId}, ${currentSceneId});" title="Délier" class="btn-icon">
                                <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                            </button>
                        </div>
                    `;
                }).join('');
            } else {
                html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucun lieu ou élément lié.</p>';
            }

            // Bouton d'ajout manuel
            html += `
                <div style="margin-top: 10px; text-align: center;">
                    <button class="btn btn-small" onclick="openElementLinker(${currentActId}, ${currentChapterId}, ${currentSceneId})" style="font-size: 0.75rem; padding: 4px 8px; width: 100%;">
                        <i data-lucide="plus" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> Lier manuellement
                    </button>
                </div>
            `;

            quickLinks.innerHTML = html;
        }
    }

    // Réinitialiser les icônes Lucide après injection HTML
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// [MVVM : View]
// Helper de rendu UI. Détermine l'icône Lucide à utiliser pour un type d'élément.
function getElementIcon(type) {
    switch (type.toLowerCase()) {
        case 'lieu':
        case 'place':
            return 'map-pin';
        case 'objet':
        case 'artifact':
            return 'box';
        case 'organisation':
        case 'group':
        case 'organization': // Ajout sécurité
            return 'landmark';
        case 'concept':
        case 'idée':
            return 'lightbulb';
        default:
            return 'globe'; // Icône par défaut
    }
}

// [MVVM : ViewModel]
// Action utilisateur (Command) : Gère la déliaison d'un personnage (Bascule l'état).
function toggleCharacterLinkerAction(charId) {
    const scene = getCurrentScene();
    if (!scene) return;

    const isConfirmedPresent = scene.confirmedPresentCharacters.includes(charId);

    if (isConfirmedPresent) {
        // Délien: Le retirer de la liste des présents confirmés
        removeIdfromArray(scene.confirmedPresentCharacters, charId);
    } else {
        // Lien: L'ajouter aux présents confirmés
        scene.confirmedPresentCharacters.push(charId);

        // S'assurer qu'il n'est ni suggéré ni absent (la liaison manuelle est prioritaire)
        removeIdfromArray(scene.suggestedCharacters, charId);
        removeIdfromArray(scene.confirmedAbsentCharacters, charId);
    }

    saveProject();

    // Appel au NOUVEAU moteur de rendu pour mettre à jour le panneau des liens principal.
    refreshLinksPanel();
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Helper pour générer le petit avatar HTML (Image ou Icône)
// [MVVM : View]
// Helper de rendu UI pour les avatars.
function getAvatarHTML(char) {
    if (char.avatarImage) {
        return `<img src="${char.avatarImage}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">`;
    } else {
        return `<i data-lucide="user" style="width: 16px; height: 16px;"></i>`;
    }
}

// Normaliser le texte pour la recherche (retirer accents, minuscule)
// [MVVM : Model]
// Utilitaire pur de manipulation de string (Normalisation pour recherche)
function normalizeForSearch(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Retire les accents
}

// Échapper les caractères spéciaux regex
// [MVVM : Model]
// Utilitaire pur : Échappe les caractères spéciaux regex.
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Rich Text Formatting (inchangé)
// [MVVM : View]
// Manipulation directe du DOM/API du navigateur pour le formatage.
function formatText(command, value = null) {
    // Cibler l'éditeur spécifique de la scène courante pour éviter le scroll jump
    let selector = '.editor-textarea';
    if (typeof currentSceneId !== 'undefined' && currentSceneId) {
        selector = `.editor-textarea[data-scene-id="${currentSceneId}"]`;
    }

    const editor = document.querySelector(selector);
    if (editor) editor.focus();

    document.execCommand(command, false, value);
}
// [MVVM : View]
// Fonction de rendu pour le panneau des liens en mode sidebar
function renderLinksPanelSidebar() {
    const linksPanelContent = document.getElementById('linksPanelContent');
    if (!linksPanelContent) return;

    const scene = getCurrentScene();
    if (!scene) {
        linksPanelContent.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Sélectionnez une scène</p>';
        return;
    }

    // Construire le HTML pour les trois sections
    let html = '';

    // SECTION 1 : PERSONNAGES
    html += '<div style="margin-bottom: 1.5rem;">';
    html += '<div class="quick-links-title" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);"><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Personnages</div>';

    const allCharacters = project.characters || [];
    const confirmedIds = scene.confirmedPresentCharacters || [];
    const suggestedIds = scene.suggestedCharacters || [];
    const absentIds = scene.confirmedAbsentCharacters || [];

    const presentList = allCharacters.filter(c => confirmedIds.includes(c.id));
    const suggestedList = allCharacters.filter(c => suggestedIds.includes(c.id));
    const absentList = allCharacters.filter(c => absentIds.includes(c.id));

    // Présents confirmés
    html += '<h4 style="margin: 0 0 8px 0; font-size: 0.8rem; opacity: 0.8;"><i data-lucide="check-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> Confirmés Présents</h4>';
    if (presentList.length > 0) {
        html += presentList.map(char => `
            <div class="link-item present" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${getAvatarHTML(char)}
                    <span>${char.name}</span>
                </div>
                <button onclick="confirmCharacterAbsence(${char.id})" title="Retirer" class="btn-icon">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        `).join('');
    } else {
        html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucun personnage confirmé présent.</p>';
    }

    // Suggestions
    html += '<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8; color: var(--accent-color);"><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> Suggestions</h4>';
    if (suggestedList.length > 0) {
        html += suggestedList.map(char => `
            <div class="link-item suggested" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${getAvatarHTML(char)}
                    <span>${char.name}</span>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button onclick="confirmCharacterAbsence(${char.id})" title="Ignorer" class="btn-icon">
                        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button onclick="confirmCharacterPresence(${char.id})" title="Valider" class="btn-icon">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucune suggestion.</p>';
    }

    // Absents
    html += '<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8;"><i data-lucide="x-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> Confirmés Absents</h4>';
    if (absentList.length > 0) {
        html += absentList.map(char => `
            <div class="link-item absent" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${getAvatarHTML(char)}
                    <span style="text-decoration: line-through;">${char.name}</span>
                </div>
                <button onclick="confirmCharacterPresence(${char.id})" title="Rétablir" class="btn-icon">
                    <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        `).join('');
    } else {
        html += '<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">Aucun personnage ignoré.</p>';
    }

    html += '</div>';

    // SECTION 2 : UNIVERS
    html += '<div style="margin-bottom: 1.5rem;">';
    html += '<div class="quick-links-title" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);"><i data-lucide="globe" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Univers</div>';
    const locations = (scene.locations || []).map(loc => {
        const locData = project.locations ? project.locations.find(l => l.id === loc.id) : null;
        return locData ? `<div class="link-item" style="margin-bottom: 4px;"><i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>${locData.name}</div>` : '';
    }).join('');
    html += locations || '<p class="text-muted small" style="font-size: 0.75rem; opacity: 0.7;">Aucun lieu.</p>';
    html += '</div>';

    // SECTION 3 : TIMELINE
    html += '<div>';
    html += '<div class="quick-links-title" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);"><i data-lucide="train-track" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Timeline</div>';
    const events = (scene.events || []).map(ev => {
        const evData = project.events ? project.events.find(e => e.id === ev.id) : null;
        return evData ? `<div class="link-item" style="margin-bottom: 4px;"><i data-lucide="calendar" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>${evData.title}</div>` : '';
    }).join('');
    html += events || '<p class="text-muted small" style="font-size: 0.75rem; opacity: 0.7;">Aucun événement.</p>';
    html += '</div>';

    linksPanelContent.innerHTML = html;

    // Rafraîchir les icônes Lucide
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 10);
}
