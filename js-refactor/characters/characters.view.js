/**
 * [MVVM : Characters View]
 * Gestion de l'affichage et des interactions utilisateur pour les personnages.
 */

/**
 * [MVVM : View]
 * Affiche la modale d'ajout de personnage.
 */
function openAddCharacterModal() {
    const modal = document.getElementById('addCharacterModal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => {
            const input = document.getElementById('characterNameInput');
            if (input) input.focus();
        }, 100);
    }
}

/**
 * [MVVM : View]
 * Action utilisateur : Ajouter un personnage.
 */
function addCharacter() {
    const nameInput = document.getElementById('characterNameInput');
    const roleInput = document.getElementById('characterRoleInput');
    const descInput = document.getElementById('characterDescInput');

    if (!nameInput) return;

    const result = addCharacterViewModel(
        nameInput.value.trim(),
        roleInput ? roleInput.value.trim() : '',
        descInput ? descInput.value.trim() : ''
    );

    if (result.success) {
        nameInput.value = '';
        if (roleInput) roleInput.value = '';
        if (descInput) descInput.value = '';

        closeModal('addCharacterModal');
        processCharacterSideEffects(result);
    }
}

/**
 * [MVVM : View]
 * Action utilisateur : Supprimer un personnage.
 */
function deleteCharacter(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce personnage ?')) return;

    const result = deleteCharacterViewModel(id);
    processCharacterSideEffects(result);
}

/**
 * [MVVM : View]
 * Rendu de la liste latérale des personnages.
 */
function renderCharactersList() {
    const container = document.getElementById('charactersList');
    if (!container) return;

    const { byRace, byGroup } = getGroupedCharactersViewModel();
    const hasAnyByRace = Object.values(byRace).some(group => group.length > 0);
    const hasAnyByGroup = Object.values(byGroup).some(group => group.length > 0);

    if (!hasAnyByRace && !hasAnyByGroup) {
        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Aucun personnage</div>';
        return;
    }

    let html = '<div class="treeview-children" style="margin-left: 0; border-left: none; padding-left: 0;">';

    // Helper pour générer une section (Race ou Groupe)
    const renderSection = (title, groupedData) => {
        let sectionHtml = `
            <div style="padding: 12px 12px 6px 12px; color: var(--primary-color); font-size: 0.8rem; font-weight: bold; border-top: 2px solid var(--primary-color); margin-top: 15px;">
                ${title}
            </div>
        `;

        Object.entries(groupedData).forEach(([headerName, chars]) => {
            if (chars.length === 0) return;

            sectionHtml += `
                <div class="treeview-race-header" style="
                    padding: 6px 12px;
                    background: var(--bg-secondary, rgba(255,255,255,0.05));
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    border-top: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                    margin-top: 8px;
                    margin-bottom: 4px;
                    display: flex; 
                    justify-content: space-between;
                ">
                    <span>${headerName}</span>
                    <span style="opacity: 0.6;">${chars.length}</span>
                </div>
            `;

            chars.forEach(char => {
                const displayName = char.name || char.firstName || 'Sans nom';
                sectionHtml += `
                    <div class="treeview-item" onclick="openCharacterDetail(${char.id})">
                        <span class="treeview-item-icon">
                            <i data-lucide="user" style="width:14px;height:14px;vertical-align:middle;"></i>
                        </span>
                        <span class="treeview-item-label">${displayName}</span>
                        <button class="treeview-item-delete" onclick="event.stopPropagation(); deleteCharacter(${char.id})" title="Supprimer"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
                    </div>
                `;
            });
        });
        return sectionHtml;
    };

    // Toujours afficher le groupement par race
    html += renderSection('PAR RACE', byRace);

    // N'afficher le groupement par groupe que s'il y a des groupes personnalisés (ou si au moins un perso a un groupe)
    const hasRealGroups = Object.keys(byGroup).length > 1 || (byGroup['Sans groupe'] && byGroup['Sans groupe'].length < Object.values(byRace).flat().length);
    if (hasRealGroups) {
        html += renderSection('PAR REGROUPEMENT', byGroup);
    }

    html += '</div>';
    container.innerHTML = html;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * [MVVM : View]
 * Ouvre la fiche détaillée d'un personnage.
 */
function openCharacterDetail(id) {
    const data = getCharacterDetailViewModel(id);
    if (!data) return;

    const { character, races, groups, linkedScenes } = data;

    // Orchestration globale si on est en split view
    if (typeof splitViewActive !== 'undefined' && splitViewActive) {
        const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;
        if (state.view === 'characters') {
            state.characterId = id;
            if (typeof renderSplitPanelViewContent === 'function') {
                renderSplitPanelViewContent(splitActivePanel);
            }
            if (typeof saveSplitViewState === 'function') saveSplitViewState();
            return;
        }
    }

    const editorView = document.getElementById('editorView');
    if (editorView) {
        editorView.innerHTML = renderCharacterSheet(character, races, groups, linkedScenes);

        // Post-rendu
        setTimeout(() => {
            initCharacterRadar(character);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 50);
    }
}

/**
 * [MVVM : View]
 * Template de la fiche personnage complet (Fidèle à l'original).
 */
function renderCharacterSheet(character, racesList, groupsList, linkedScenes) {
    const metaInfo = [];
    if (character.age) metaInfo.push(`${character.age}${character.birthPlace ? ', né à ' + character.birthPlace : ''}`);
    if (character.residence) metaInfo.push(character.residence);

    const raceOptions = (racesList || []).map(r =>
        `<option value="${r}" ${character.race === r ? 'selected' : ''}>${r}</option>`
    ).join('');

    const groupOptions = (groupsList || []).map(g =>
        `<option value="${g}" ${character.group === g ? 'selected' : ''}>${g}</option>`
    ).join('');

    return `
        <div class="character-sheet" data-character-id="${character.id}">
            <!-- Header -->
            <div class="character-sheet-header">
                <div class="character-avatar" onclick="changeCharacterAvatar(${character.id}, '${character.avatarEmoji || ''}', '${character.avatarImage || ''}')" title="Changer l'avatar">
                    ${character.avatarImage
            ? `<img src="${character.avatarImage}" alt="${character.name}">`
            : (character.avatarEmoji && character.avatarEmoji !== '👤' ? `<div class="emoji-avatar" style="font-size: 40px; line-height: 80px; text-align: center;">${character.avatarEmoji}</div>` : `<i data-lucide="user" style="width:80px;height:80px;"></i>`)}
                </div>
                <div class="character-header-info">
                    <h2 contenteditable="true" onblur="updateCharacterName(${character.id}, this.textContent)">${character.firstName}${character.lastName ? ' ' + character.lastName : ''}</h2>
                    <ul class="character-meta">
                        ${metaInfo.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
                <button class="character-close-btn" onclick="switchView('editor')" title="Fermer"><i data-lucide="x" style="width:20px;height:20px;"></i></button>
            </div>
            

            <!-- Grille des sections -->
            <div class="character-sections-grid">
            
            ${renderCharacterLinkedScenes(linkedScenes)}

            <!-- État Civil -->
            <div class="character-section" id="section-etat-civil">
                <div class="character-section-header" onclick="toggleCharacterSection('etat-civil')">
                    <div class="character-section-title">État Civil</div>
                    <span class="character-section-toggle">
                        <i data-lucide="chevron-down" style="width:18px;height:18px;"></i>
                    </span>
                </div>
                <div class="character-section-content">
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Prénom</label>
                            <input type="text" value="${character.firstName || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'firstName', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Nom de famille</label>
                            <input type="text" value="${character.lastName || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'lastName', this.value)">
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Surnom</label>
                            <input type="text" value="${character.nickname || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'nickname', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Pronoms</label>
                            <input type="text" value="${character.pronouns || ''}" placeholder="il/lui, elle/elle, iel..."
                                   onchange="updateCharacterField(${character.id}, 'pronouns', this.value)">
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Sexe</label>
                            <div class="character-radio-group">
                                <label><input type="radio" name="sex-${character.id}" value="F" ${character.sex === 'F' ? 'checked' : ''} onchange="updateCharacterField(${character.id}, 'sex', 'F')"> Femme</label>
                                <label><input type="radio" name="sex-${character.id}" value="M" ${character.sex === 'M' ? 'checked' : ''} onchange="updateCharacterField(${character.id}, 'sex', 'M')"> Homme</label>
                                <label><input type="radio" name="sex-${character.id}" value="A" ${character.sex === 'A' ? 'checked' : ''} onchange="updateCharacterField(${character.id}, 'sex', 'A')"> Autre</label>
                            </div>
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Race</label>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <select class="detail-input" style="flex-grow: 1;"
                                    onchange="updateCharacterField(${character.id}, 'race', this.value)">
                                    <option value="">Sélectionner...</option>
                                    ${raceOptions}
                                </select>
                                <button onclick="addNewRace(${character.id})" class="btn-icon" title="Créer une nouvelle race">
                                    <i data-lucide="plus" style="width:14px;height:14px;"></i>
                                </button>
                            </div>
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Regroupement (Famille, Clan, etc.)</label>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <select class="detail-input" style="flex-grow: 1;"
                                    onchange="updateCharacterField(${character.id}, 'group', this.value)">
                                    <option value="">Aucun</option>
                                    ${groupOptions}
                                </select>
                                <button onclick="addNewGroup(${character.id})" class="btn-icon" title="Créer un nouveau regroupement">
                                    <i data-lucide="plus" style="width:14px;height:14px;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field" style="max-width: 100px;">
                            <label class="character-field-label">Âge</label>
                            <input type="text" value="${character.age || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'age', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Date de naissance</label>
                            <input type="text" value="${character.birthDate || ''}" placeholder="JJ/MM/AAAA"
                                   onchange="updateCharacterField(${character.id}, 'birthDate', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Lieu de naissance</label>
                            <input type="text" value="${character.birthPlace || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'birthPlace', this.value)">
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field" style="max-width: 100px;"></div>
                        <div class="character-field">
                            <label class="character-field-label">Date de décès</label>
                            <input type="text" value="${character.deathDate || ''}" placeholder="JJ/MM/AAAA"
                                   onchange="updateCharacterField(${character.id}, 'deathDate', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Lieu de décès</label>
                            <input type="text" value="${character.deathPlace || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'deathPlace', this.value)">
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Lieu de résidence</label>
                            <input type="text" value="${character.residence || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'residence', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Occupation</label>
                            <input type="text" value="${character.occupation || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'occupation', this.value)">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Physique -->
            <div class="character-section" id="section-physique">
                <div class="character-section-header" onclick="toggleCharacterSection('physique')">
                    <div class="character-section-title">Physique</div>
                        <span class="character-section-toggle"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>
                    </div>
                <div class="character-section-content">
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Taille</label>
                            <input type="text" value="${character.height || ''}" placeholder="cm"
                                   onchange="updateCharacterField(${character.id}, 'height', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Poids</label>
                            <input type="text" value="${character.weight || ''}" placeholder="kg"
                                   onchange="updateCharacterField(${character.id}, 'weight', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Corpulence</label>
                            <input type="text" value="${character.bodyType || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'bodyType', this.value)">
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Couleur des cheveux</label>
                            <input type="text" value="${character.hairColor || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'hairColor', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Couleur des yeux</label>
                            <input type="text" value="${character.eyeColor || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'eyeColor', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Voix / Manière de parler</label>
                            <input type="text" value="${character.voice || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'voice', this.value)">
                        </div>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Tenue</label>
                            <textarea rows="3" onchange="updateCharacterField(${character.id}, 'clothing', this.value)">${character.clothing || ''}</textarea>
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Accessoires</label>
                            <textarea rows="3" onchange="updateCharacterField(${character.id}, 'accessories', this.value)">${character.accessories || ''}</textarea>
                        </div>
                    </div>
                    <div class="character-field">
                        <label class="character-field-label">Description</label>
                        <textarea rows="4" onchange="updateCharacterField(${character.id}, 'physicalDescription', this.value)">${character.physicalDescription || ''}</textarea>
                    </div>
                </div>
            </div>

            <!-- Radar Chart -->
            <div class="character-section" id="section-radar">
                <div class="character-section-header">
                    <div class="character-section-title">Statistiques de Personnalité</div>
                </div>
                <div class="character-section-content" style="display: flex; flex-direction: column; align-items: center;">
                    <canvas id="radarChart-${character.id}" width="300" height="300"></canvas>
                    <div class="radar-controls">
                        ${Object.entries(character.personality).map(([stat, val]) => `
                            <div class="radar-control-item" style="display: flex; align-items: center; gap: 10px; width: 100%; margin-bottom: 5px;">
                                <label style="flex: 1; font-size: 0.8rem;">${stat.charAt(0).toUpperCase() + stat.slice(1)}</label>
                                <input type="range" min="0" max="20" value="${val}" style="flex: 2;" onchange="updatePersonalityStat(${character.id}, '${stat}', this.value)">
                                <span class="radar-value" style="width: 25px; text-align: right; font-weight: bold;">${val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Évolution - Full width -->
            <div class="character-section full-width" id="section-evolution">
                <div class="character-section-header" onclick="toggleCharacterSection('evolution')">
                    <div class="character-section-title">Évolution</div>
                    <span class="character-section-toggle"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>
                </div>
                <div class="character-section-content">
                    <div class="character-field">
                        <label class="character-field-label">Buts / Objectifs</label>
                        <textarea rows="3" onchange="updateCharacterField(${character.id}, 'goals', this.value)">${character.goals || ''}</textarea>
                    </div>
                        
                    <div class="character-timeline">
                        <div class="timeline-card">
                            <div class="timeline-card-title">Passé</div>
                            <textarea placeholder="Enfance, passé..." onchange="updateCharacterField(${character.id}, 'past', this.value)">${character.past || ''}</textarea>
                        </div>
                        <div class="timeline-card">
                            <div class="timeline-card-title">Présent</div>
                            <textarea placeholder="État actuel..." onchange="updateCharacterField(${character.id}, 'present', this.value)">${character.present || ''}</textarea>
                        </div>
                        <div class="timeline-card">
                            <div class="timeline-card-title">Futur</div>
                            <textarea placeholder="Devenir..." onchange="updateCharacterField(${character.id}, 'future', this.value)">${character.future || ''}</textarea>
                        </div>
                    </div>
                </div>
            </div>



            <!-- Caractère - Full width -->
            <div class="character-section full-width" id="section-caractere">
                <div class="character-section-header" onclick="toggleCharacterSection('caractere')">
                    <div class="character-section-title">Traits de Caractère</div>
                    <span class="character-section-toggle"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>
                </div>
                <div class="character-section-content">
                    <!-- Traits sélectionnés -->
                    <div class="character-field">
                        <label class="character-field-label">Traits sélectionnés</label>
                        <div class="selected-traits-container" id="selectedTraits-${character.id}">
                            ${(character.traits || []).map((t, i) => `
                                <span class="selected-trait">${t}<span class="trait-remove" onclick="removeCharacterTrait(${character.id}, ${i})"><i data-lucide="x" style="width:10px;height:10px;"></i></span></span>
                            `).join('') || '<span class="no-traits">Cliquez sur les traits ci-dessous pour les ajouter</span>'}
                        </div>
                    </div>
                    
                    <!-- Catégories de traits -->
                    <div class="traits-categories">
                        ${renderTraitsCategories(character.id, character.traits || [])}
                    </div>
                    
                    <div class="character-field" style="margin-top: 1rem;">
                        <label class="character-field-label">Goûts</label>
                        <textarea rows="2" onchange="updateCharacterField(${character.id}, 'tastes', this.value)">${character.tastes || ''}</textarea>
                    </div>
                    <div class="character-field">
                        <label class="character-field-label">Tics, manies, habitudes</label>
                        <textarea rows="2" onchange="updateCharacterField(${character.id}, 'habits', this.value)">${character.habits || ''}</textarea>
                    </div>
                    <div class="character-field">
                        <label class="character-field-label">Peurs et doutes</label>
                        <textarea rows="2" onchange="updateCharacterField(${character.id}, 'fears', this.value)">${character.fears || ''}</textarea>
                    </div>
                </div>
            </div>
            
            <!-- Profil -->
            <div class="character-section" id="section-profil">
                <div class="character-section-header" onclick="toggleCharacterSection('profil')">
                    <div class="character-section-title">Profil</div>
                    <span class="character-section-toggle"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>
                </div>
                <div class="character-section-content">
                    <div class="character-field">
                        <label class="character-field-label">Éducation</label>
                        <textarea rows="3" onchange="updateCharacterField(${character.id}, 'education', this.value)">${character.education || ''}</textarea>
                    </div>
                    <div class="character-field">
                        <label class="character-field-label">Secrets</label>
                        <textarea rows="3" onchange="updateCharacterField(${character.id}, 'secrets', this.value)">${character.secrets || ''}</textarea>
                    </div>
                    <div class="character-field">
                        <label class="character-field-label">Croyances et idéologies</label>
                        <textarea rows="2" onchange="updateCharacterField(${character.id}, 'beliefs', this.value)">${character.beliefs || ''}</textarea>
                    </div>
                    <div class="character-field-row">
                        <div class="character-field">
                            <label class="character-field-label">Lieux marquants</label>
                            <input type="text" value="${character.importantPlaces || ''}" 
                                   onchange="updateCharacterField(${character.id}, 'importantPlaces', this.value)">
                        </div>
                        <div class="character-field">
                            <label class="character-field-label">Phrases ou expressions typiques</label>
                            <textarea rows="3" onchange="updateCharacterField(${character.id}, 'catchphrases', this.value)">${character.catchphrases || ''}</textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inventaire -->
            <div class="character-section" id="section-inventaire">
                <div class="character-section-header" onclick="toggleCharacterSection('inventaire')">
                    <div class="character-section-title">Inventaire</div>
                    <span class="character-section-toggle"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>
                </div>
                <div class="character-section-content">
                    <div id="inventory-list-${character.id}">
                        ${(character.inventory || []).map((item, i) => renderInventoryItem(character.id, 'inventory', item, i)).join('')}
                    </div>
                    <button class="inventory-add-btn" onclick="addInventoryItem(${character.id}, 'inventory')">
                        Ajouter <i data-lucide="plus-circle" style="width:16px;height:16px;"></i>
                    </button>
                </div>
            </div>
            
            <!-- Autres -->
            <div class="character-section" id="section-autres">
                <div class="character-section-header" onclick="toggleCharacterSection('autres')">
                    <div class="character-section-title">Autres</div>
                    <span class="character-section-toggle"><i data-lucide="chevron-down" style="width:18px;height:18px;"></i></span>
                </div>
                <div class="character-section-content">
                    <div class="character-field">
                        <textarea rows="5" placeholder="Notes diverses..." 
                                  onchange="updateCharacterField(${character.id}, 'notes', this.value)">${character.notes || ''}</textarea>
                    </div>
                </div>
            </div>
            
            </div><!-- Fin de character-sections-grid -->
            

        </div>
    `;
}

/**
 * [MVVM : View]
 * Traitement centralisé des effets de bord.
 */
function processCharacterSideEffects(result) {
    if (!result || !result.success) return;

    const effects = result.sideEffects || {};

    if (effects.shouldSave && typeof saveProject === 'function') {
        saveProject();
    }

    if (effects.shouldRefreshList) {
        renderCharactersList();
    }

    if (effects.shouldRefreshAll) {
        renderCharactersList();
        if (result.character) openCharacterDetail(result.character.id);
    }

    if (effects.shouldResetView && typeof showEmptyState === 'function') {
        showEmptyState();
    }

    if (effects.shouldOpen) {
        openCharacterDetail(effects.shouldOpen);
    }

    if (effects.shouldRefreshTraits && result.data) {
        refreshTraitsDisplay(result.data);
    }

    if (effects.shouldRefreshInventory && result.data) {
        refreshInventoryList(result.data, effects.shouldRefreshInventory);
    }

    if (effects.shouldRefreshRadar && result.data) {
        // Mise à jour locale rapide
        const id = result.data.id;
        const charSheet = document.querySelector(`.character-sheet[data-character-id="${id}"]`);
        if (charSheet) {
            Object.entries(result.data.personality).forEach(([stat, val]) => {
                const valueSpan = charSheet.querySelector(`.radar-control-item[data-stat="${stat}"] .radar-value`);
                if (valueSpan) valueSpan.textContent = val;
            });
            initCharacterRadar(result.data);
        }
    }
}

/**
 * [MVVM : View]
 * Redirection des actions utilisateur vers le ViewModel et traitement des effets.
 */
function updateCharacterField(id, field, value) {
    const result = updateCharacterFieldViewModel(id, field, value);
    if (result.success) {
        processCharacterSideEffects(result);

        // Mise à jour du header si nécessaire
        if (field === 'firstName' || field === 'lastName' || field === 'name') {
            const headerTitle = document.querySelector(`.character-sheet[data-character-id="${id}"] h2`);
            if (headerTitle && result.data) headerTitle.textContent = result.data.name;
        }
    }
}

function updateCharacterName(id, newName) {
    updateCharacterField(id, 'name', newName.trim());
}

function toggleCharacterTrait(id, trait) {
    const result = toggleCharacterTraitViewModel(id, trait);
    processCharacterSideEffects(result);
}

function removeCharacterTrait(id, trait) {
    const result = toggleCharacterTraitViewModel(id, trait);
    processCharacterSideEffects(result);
}

function updatePersonalityStat(id, stat, value) {
    const result = updatePersonalityStatViewModel(id, stat, value);
    processCharacterSideEffects(result);
}

function addNewRace(charId) {
    const newRace = prompt("Nom de la nouvelle race :");
    if (newRace && newRace.trim()) {
        const result = addRaceViewModel(newRace, charId);
        if (result.success) {
            if (result.alreadyExists) alert("Cette race existe déjà !");
            processCharacterSideEffects(result);
            if (result.sideEffects.shouldRefreshAll) openCharacterDetail(charId);
        }
    }
}

function addNewGroup(charId) {
    const newGroup = prompt("Nom du nouveau regroupement (Famille, Clan, Groupe...) :");
    if (newGroup && newGroup.trim()) {
        const result = addGroupViewModel(newGroup, charId);
        if (result.success) {
            if (result.alreadyExists) alert("Ce regroupement existe déjà !");
            processCharacterSideEffects(result);
            if (result.sideEffects.shouldRefreshAll) openCharacterDetail(charId);
        }
    }
}

function addInventoryItem(id, listType) {
    const result = addInventoryItemViewModel(id, listType);
    processCharacterSideEffects(result);
}

function removeInventoryItem(id, listType, index) {
    const result = removeInventoryItemViewModel(id, listType, index);
    processCharacterSideEffects(result);
}

function updateInventoryItem(id, listType, index, field, value) {
    const result = updateInventoryItemViewModel(id, listType, index, field, value);
    processCharacterSideEffects(result);
}

function refreshInventoryList(character, listType) {
    const container = document.getElementById(`inventory-list-${character.id}`);
    if (container) {
        container.innerHTML = (character[listType] || []).map((item, i) => renderInventoryItem(character.id, listType, item, i)).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function renderInventoryItem(charId, listType, item, index) {
    return `
        <div class="inventory-item">
            <button class="inventory-item-delete" onclick="removeInventoryItem(${charId}, '${listType}', ${index})"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
            <div class="character-field-row">
                <input type="text" value="${item.name || ''}" placeholder="Nom" onchange="updateInventoryItem(${charId}, '${listType}', ${index}, 'name', this.value)">
                <input type="number" value="${item.quantity || 1}" style="width: 50px;" onchange="updateInventoryItem(${charId}, '${listType}', ${index}, 'quantity', parseInt(this.value))">
            </div>
            <input type="text" value="${item.description || ''}" placeholder="Description" onchange="updateInventoryItem(${charId}, '${listType}', ${index}, 'description', this.value)">
        </div>
    `;
}

/**
 * [MVVM : View]
 * Radar Chart & Traits Helpers.
 */
function initCharacterRadar(character) {
    const canvas = document.getElementById(`radarChart-${character.id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 50;

    const stats = character.personality;
    const labels = ['Intelligence', 'Force', 'Robustesse', 'Empathie', 'Perception', 'Agilité', 'Sociabilité'];
    const values = [stats.intelligence, stats.force, stats.robustesse, stats.empathie, stats.perception, stats.agilite, stats.sociabilite];
    const numPoints = labels.length;
    const angleStep = (Math.PI * 2) / numPoints;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid circles
    ctx.strokeStyle = '#e0e0e0';
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        const r = (radius / 4) * i;
        for (let j = 0; j <= numPoints; j++) {
            const angle = (angleStep * j) - Math.PI / 2;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Data polygon
    ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
    ctx.strokeStyle = 'var(--primary-color)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
        const angle = (angleStep * i) - Math.PI / 2;
        const val = (values[i] / 20) * radius;
        const x = centerX + Math.cos(angle) * val;
        const y = centerY + Math.sin(angle) * val;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < numPoints; i++) {
        const angle = (angleStep * i) - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius + 25);
        const y = centerY + Math.sin(angle) * (radius + 25);
        ctx.fillText(labels[i], x, y);
    }
}

function renderTraitsCategories(charId, selectedTraits) {
    return Object.entries(TRAIT_SECTIONS).map(([sectionKey, section]) => `
        <div class="trait-section" id="trait-section-${sectionKey}">
            <div class="trait-section-header" onclick="toggleTraitSection('${sectionKey}')">
                <span><i data-lucide="${section.icon}" style="width:16px; height:16px; vertical-align: middle; margin-right:8px;"></i>${section.label}</span>
            </div>
            <div class="trait-section-content">
                ${Object.entries(section.categories).map(([catKey, category]) => `
                    <div class="trait-category">
                        <div class="trait-category-header">${category.label}</div>
                        <div class="trait-category-content">
                            ${category.traits.map(trait => `
                                <span class="trait-option ${selectedTraits.includes(trait) ? 'selected' : ''}" 
                                    onclick="toggleCharacterTrait(${charId}, '${trait.replace(/'/g, "\\'")}')">${trait}</span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function toggleTraitSection(key) {
    const el = document.getElementById(`trait-section-${key}`);
    if (el) el.classList.toggle('collapsed');
}

function toggleCharacterSection(key) {
    const el = document.getElementById(`section-${key}`);
    if (el) el.classList.toggle('collapsed');
}

function refreshTraitsDisplay(character) {
    const traits = character.traits || [];
    const container = document.getElementById(`selectedTraits-${character.id}`);

    if (container) {
        container.innerHTML = traits.length > 0
            ? traits.map((t, i) => `<span class="selected-trait">${t}<span class="trait-remove" onclick="removeCharacterTrait(${character.id}, '${t.replace(/'/g, "\\'")}')"><i data-lucide="x" style="width:10px;height:10px;"></i></span></span>`).join('')
            : '<span class="no-traits">Cliquez sur les traits ci-dessous pour les ajouter</span>';
    }

    document.querySelectorAll('.trait-option').forEach(opt => {
        opt.classList.toggle('selected', traits.includes(opt.textContent));
    });
}

function changeCharacterAvatar(id, currentEmoji, currentImage) {
    const defaultValue = currentImage || currentEmoji || '';
    const choice = prompt('Emoji ou URL d\'image :', defaultValue);
    if (choice === null) return;

    const result = updateAvatarViewModel(id, choice);
    processCharacterSideEffects(result);
}

// Génération du HTML pour les scènes liées
function renderCharacterLinkedScenes(linkedScenes) {
    if (!linkedScenes || linkedScenes.length === 0) return '';

    return `
        <div class="detail-section" style="margin-bottom: 20px;">
            <div class="detail-section-title"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Apparaît dans ${linkedScenes.length} scène(s)</div>
            <div class="quick-links" style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                ${linkedScenes.map(scene => {
        const actNumNum = scene.actNumber || '?';
        const breadcrumb = `Acte ${actNumNum} › Chapitre ${scene.chapterNumber || '?'} › ${scene.sceneTitle}`;

        return `
                    <span class="link-badge" onclick="openScene(${scene.actId}, ${scene.chapterId}, ${scene.sceneId})" 
                            title="${scene.actTitle} - ${scene.chapterTitle}"
                            style="padding: 4px 8px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
                        ${breadcrumb}
                    </span>
                `;
    }).join('')}
            </div>
        </div>
    `;
}
