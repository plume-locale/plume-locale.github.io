// ==========================================
// SPLIT VIEW SYSTEM - Handlers
// ==========================================

/** [Mixte] - Synchronise le contenu du DOM (View) vers les données du projet (Model) */
function updateSplitSceneContent(editor) {
    const sceneId = parseInt(editor.dataset.sceneId);
    const chapterId = parseInt(editor.dataset.chapterId);
    const actId = parseInt(editor.dataset.actId);
    const panel = editor.dataset.panel;

    const act = project.acts.find(a => a.id === actId);
    if (!act) return;
    const chapter = act.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    scene.content = editor.innerHTML;
    const wordCount = typeof getWordCount === 'function' ? getWordCount(editor.innerHTML) : 0;
    scene.wordCount = wordCount;

    // Update word count display
    const wcDisplay = document.querySelector(`.split-word-count-${panel}`);
    if (wcDisplay) wcDisplay.textContent = Localization.t('editor.word_count', [wordCount]);

    // Update Live Tension Meter
    if (typeof updateLiveTensionMeter === 'function') {
        const textContent = editor.innerText || editor.textContent || '';
        updateLiveTensionMeter(textContent, { sceneId, chapterId, actId });
    }

    if (typeof saveProject === 'function') {
        saveProject();
    }
}

/** [Mixte] - Synchronise le contenu du textarea (View) vers les données de la note (Model) */
function updateSplitNoteContent(textarea) {
    const noteId = parseInt(textarea.dataset.noteId);
    const note = project.notes?.find(n => n.id === noteId);
    if (note) {
        note.content = textarea.value;
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
}

/** [Mixte/ViewModel] - Met à jour un champ personnage et déclenche rendu/sauvegarde */
function updateCharacterField(id, field, value) {
    const character = project.characters.find(c => c.id === id);
    if (character) {
        character[field] = value;
        if (typeof saveProject === 'function') saveProject();
        if (typeof renderCharactersList === 'function') renderCharactersList();
    }
}
