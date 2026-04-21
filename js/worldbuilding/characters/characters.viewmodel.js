/**
 * [MVVM : Characters ViewModel]
 * Logique métier et préparation des données pour l'interface des personnages.
 */

/**
 * [MVVM : Purpose] 
 * Centraliser la logique de manipulation des personnages et isoler la Vue des détails du Repository.
 */

/**
 * Coordination pour ajouter un personnage.
 */
function addCharacterViewModel(name, role, description) {
    if (!name) return { success: false, message: Localization.t('char.error.name_required') };

    const characterData = {
        name: name,
        role: role,
        physicalDescription: description
    };

    const newCharacter = CharacterModel.create(characterData);
    CharacterRepository.add(newCharacter);

    return {
        success: true,
        character: newCharacter,
        sideEffects: {
            shouldSave: true,
            shouldOpen: newCharacter.id
        }
    };
}

/**
 * Coordination pour supprimer un personnage.
 */
function deleteCharacterViewModel(id) {
    CharacterRepository.remove(id);
    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldResetView: true
        }
    };
}

/**
 * Groupement des personnages pour l'affichage dans la liste.
 * Retourne un objet contenant les groupements par race et par groupe personnalisé.
 */
function getGroupedCharactersViewModel() {
    const characters = CharacterRepository.getAll();
    const races = CharacterRepository.getRaces();
    const customGroups = CharacterRepository.getGroups();

    const byRace = {};
    races.forEach(race => byRace[race] = []);
    byRace[Localization.t('char.list.no_race')] = [];

    const byGroup = {};
    customGroups.forEach(g => byGroup[g] = []);
    byGroup[Localization.t('char.list.no_group')] = [];

    characters.forEach(char => {
        const migrated = CharacterModel.migrate(char);

        // Groupement par race
        const raceKey = (migrated.race && races.includes(migrated.race)) ? migrated.race : Localization.t('char.list.no_race');
        if (!byRace[raceKey]) byRace[raceKey] = [];
        byRace[raceKey].push(migrated);

        // Groupement par groupe perso
        const groupKey = (migrated.group && customGroups.includes(migrated.group)) ? migrated.group : Localization.t('char.list.no_group');
        if (!byGroup[groupKey]) byGroup[groupKey] = [];
        byGroup[groupKey].push(migrated);
    });

    // Tri alphabétique dans chaque groupe
    const sortFn = (a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'fr');
    };

    [byRace, byGroup].forEach(container => {
        Object.keys(container).forEach(key => container[key].sort(sortFn));
    });

    return { byRace, byGroup };
}

/**
 * Prépare les données pour la fiche détaillée d'un personnage.
 */
function getCharacterDetailViewModel(id) {
    const rawChar = CharacterRepository.getById(id);
    if (!rawChar) return null;

    const character = CharacterModel.migrate(rawChar);
    const races = CharacterRepository.getRaces();
    const groups = CharacterRepository.getGroups();
    const linkedScenes = getLinkedScenesViewModel(id);

    return {
        character,
        races,
        groups,
        linkedScenes
    };
}

/**
 * Récupère les scènes où le personnage apparaît.
 */
function getLinkedScenesViewModel(characterId) {
    if (typeof findScenesWithCharacter !== 'function') return [];

    // findScenesWithCharacter utilise probablement déjà project, 
    // mais on l'encapsule ici pour que la Vue n'ait pas à le savoir.
    const scenes = findScenesWithCharacter(characterId);

    return scenes.map(scene => {
        const acts = typeof ActRepository !== 'undefined' ? ActRepository.getAll() : (project.acts || []);
        const actIndex = acts.findIndex(a => a.id === scene.actId);

        return {
            actId: scene.actId,
            chapterId: scene.chapterId,
            sceneId: scene.sceneId,
            sceneTitle: scene.sceneTitle,
            actTitle: scene.actTitle,
            chapterTitle: scene.chapterTitle,
            actNumber: actIndex !== -1 ? (actIndex + 1) : '?',
            chapterNumber: scene.chapterId ? '?' : '?' // On pourrait affiner en cherchant dans l'acte
        };
    });
}

/**
 * Mise à jour générique d'un champ.
 */
function updateCharacterFieldViewModel(id, field, value) {
    const updates = { [field]: value };
    const char = CharacterRepository.getById(id);
    if (!char) return { success: false };

    const migrated = CharacterModel.migrate(char);

    // Logique spéciale pour le nom complet -> split
    if (field === 'name') {
        const parts = (value || '').trim().split(' ');
        updates.firstName = parts[0] || '';
        updates.lastName = parts.slice(1).join(' ') || '';
    }
    // Logique spéciale pour les composants du nom -> join
    else if (field === 'firstName' || field === 'lastName') {
        const fName = field === 'firstName' ? value : migrated.firstName;
        const lName = field === 'lastName' ? value : migrated.lastName;
        updates.name = `${fName || ''} ${lName || ''}`.trim() || Localization.t('char.list.no_name');
    }

    // Logique spéciale pour les nombres
    if (field === 'height' || field === 'weight') {
        if (value === '') {
            updates[field] = '';
        } else {
            const num = parseFloat(value);
            if (!isNaN(num)) updates[field] = num;
        }
    }

    const nextValue = CharacterRepository.update(id, updates);
    return {
        success: !!nextValue,
        data: nextValue,
        sideEffects: {
            shouldSave: true,
            shouldRefreshList: (field === 'firstName' || field === 'lastName' || field === 'race' || field === 'group' || field === 'name')
        }
    };
}

/**
 * Ajout d'un nouveau regroupement personnalisé.
 */
function addGroupViewModel(groupName, charIdToAssign) {
    if (!groupName || !groupName.trim()) return { success: false };

    const formatted = groupName.trim();
    const added = CharacterRepository.addGroup(formatted);

    if (added && charIdToAssign) {
        CharacterRepository.update(charIdToAssign, { group: formatted });
    }

    return {
        success: true,
        alreadyExists: !added,
        sideEffects: {
            shouldSave: true,
            shouldRefreshAll: true
        }
    };
}

/**
 * Gestion des traits (toggle).
 */
function toggleCharacterTraitViewModel(id, trait) {
    const char = CharacterRepository.getById(id);
    if (!char) return { success: false, message: Localization.t('char.error.not_found') };

    const currentTraits = char.traits || [];
    let newTraits;

    if (currentTraits.includes(trait)) {
        newTraits = currentTraits.filter(t => t !== trait);
    } else {
        newTraits = [...currentTraits, trait];
    }

    const updatedChar = CharacterRepository.update(id, { traits: newTraits });

    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: {
            shouldSave: true,
            shouldRefreshTraits: true
        }
    };
}

/**
 * Ajout d'une nouvelle race.
 */
function addRaceViewModel(raceName, charIdToAssign) {
    if (!raceName || !raceName.trim()) return { success: false };

    const formatted = raceName.trim();
    const added = CharacterRepository.addRace(formatted);

    if (added && charIdToAssign) {
        CharacterRepository.update(charIdToAssign, { race: formatted });
    }

    return {
        success: true,
        alreadyExists: !added,
        sideEffects: {
            shouldSave: true,
            shouldRefreshAll: true
        }
    };
}

/**
 * Inventaire.
 */
function addInventoryItemViewModel(id, listType) {
    const char = CharacterRepository.getById(id);
    if (!char) return { success: false, message: Localization.t('char.error.not_found') };

    const currentList = char[listType] || [];
    const newList = [...currentList, {
        id: Date.now(),
        name: '',
        quantity: 1,
        description: ''
    }];

    const updatedChar = CharacterRepository.update(id, { [listType]: newList });
    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: {
            shouldSave: true,
            shouldRefreshInventory: listType
        }
    };
}

function removeInventoryItemViewModel(id, listType, index) {
    const char = CharacterRepository.getById(id);
    if (!char || !char[listType]) return { success: false, message: Localization.t('char.error.list_not_found') };

    const newList = char[listType].filter((_, i) => i !== index);
    const updatedChar = CharacterRepository.update(id, { [listType]: newList });

    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: {
            shouldSave: true,
            shouldRefreshInventory: listType
        }
    };
}

function updateInventoryItemViewModel(id, listType, index, field, value) {
    const char = CharacterRepository.getById(id);
    if (!char || !char[listType] || !char[listType][index]) return { success: false };

    const newList = char[listType].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
    );

    const updatedChar = CharacterRepository.update(id, { [listType]: newList });
    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: {
            shouldSave: true
        }
    };
}

function addInventoryEventViewModel(charId, itemIndex) {
    const char = CharacterRepository.getById(charId);
    if (!char || !char.inventory || !char.inventory[itemIndex]) return { success: false };

    const item = char.inventory[itemIndex];
    if (!item.history) item.history = [];

    item.history.push({
        id: Date.now().toString(),
        action: '',
        sceneId: null,
        description: '',
        createdAt: Date.now()
    });

    const updatedChar = CharacterRepository.update(charId, { inventory: char.inventory });
    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: { shouldSave: true, shouldRefreshInventory: 'inventory' }
    };
}

function removeInventoryEventViewModel(charId, itemIndex, eventId) {
    const char = CharacterRepository.getById(charId);
    if (!char || !char.inventory || !char.inventory[itemIndex]) return { success: false };

    const item = char.inventory[itemIndex];
    if (item.history) {
        item.history = item.history.filter(e => e.id !== eventId);
    }

    const updatedChar = CharacterRepository.update(charId, { inventory: char.inventory });
    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: { shouldSave: true, shouldRefreshInventory: 'inventory' }
    };
}

function updateInventoryEventViewModel(charId, itemIndex, eventId, updates) {
    const char = CharacterRepository.getById(charId);
    if (!char || !char.inventory || !char.inventory[itemIndex]) return { success: false };

    const item = char.inventory[itemIndex];
    const event = (item.history || []).find(e => e.id === eventId);
    if (!event) return { success: false };

    Object.assign(event, updates);
    event.updatedAt = Date.now();

    const updatedChar = CharacterRepository.update(charId, { inventory: char.inventory });
    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: { shouldSave: true }
    };
}

/**
 * Mise à jour des stats de personnalité.
 */
function updatePersonalityStatViewModel(id, stat, value) {
    const character = CharacterRepository.getById(id);
    if (!character || !character.personality) return { success: false };

    const newPersonality = {
        ...character.personality,
        [stat]: parseInt(value)
    };

    const updatedChar = CharacterRepository.update(id, { personality: newPersonality });
    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: {
            shouldSave: true,
            shouldRefreshRadar: true
        }
    };
}

/**
 * Mise à jour de l'avatar.
 */
function updateAvatarViewModel(id, choice, position, zoom) {
    const updates = {};
    
    // Si choice est fourni, on met à jour l'image/emoji
    if (choice !== undefined) {
        if (choice && (choice.startsWith('http') || choice.startsWith('data:image'))) {
            updates.avatarImage = choice;
            updates.avatarEmoji = '';
        } else if (choice === '') {
            updates.avatarImage = '';
            updates.avatarEmoji = '';
        } else if (choice) {
            updates.avatarEmoji = choice;
            updates.avatarImage = '';
        }
    }

    // Mise à jour de la position sil fournie
    if (position) {
        updates.avatarPosition = position;
    }

    // Mise à jour du zoom si fourni
    if (zoom !== undefined) {
        updates.avatarZoom = zoom;
    }

    const nextValue = CharacterRepository.update(id, updates);
    return { 
        success: !!nextValue, 
        data: nextValue,
        sideEffects: { shouldSave: true, shouldRefreshAll: true } 
    };
}

/**
 * Gestion de l'évolution (Timeline)
 */

function addEvolutionStageViewModel(charId, period) {
    const char = CharacterRepository.getById(charId);
    if (!char) return { success: false };

    if (!char.evolution) char.evolution = { past: [], present: [], future: [] };
    if (!char.evolution[period]) char.evolution[period] = [];

    const newStage = {
        id: Date.now().toString(),
        sceneId: null,
        text: '',
        createdAt: Date.now()
    };

    char.evolution[period].push(newStage);

    const updatedChar = CharacterRepository.update(charId, { evolution: char.evolution });

    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: { shouldSave: true, shouldRefreshEvolution: true }
    };
}

function removeEvolutionStageViewModel(charId, period, stageId) {
    const char = CharacterRepository.getById(charId);
    if (!char || !char.evolution || !char.evolution[period]) return { success: false };

    char.evolution[period] = char.evolution[period].filter(s => s.id !== stageId);

    const updatedChar = CharacterRepository.update(charId, { evolution: char.evolution });

    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: { shouldSave: true, shouldRefreshEvolution: true }
    };
}

function updateEvolutionStageViewModel(charId, period, stageId, updates) {
    const char = CharacterRepository.getById(charId);
    if (!char || !char.evolution || !char.evolution[period]) return { success: false };

    const stage = char.evolution[period].find(s => s.id === stageId);
    if (!stage) return { success: false };

    Object.assign(stage, updates);
    stage.updatedAt = Date.now();

    const updatedChar = CharacterRepository.update(charId, { evolution: char.evolution });

    return {
        success: !!updatedChar,
        data: updatedChar,
        sideEffects: { shouldSave: true, shouldRefreshEvolution: true }
    };
}
