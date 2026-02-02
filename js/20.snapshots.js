
// Version Control Management

// [MVVM : ViewModel]
// Coordonne la création d'un snapshot du project, persiste et demande la mise à jour de la vue.
function createVersion() {
    const label = prompt('Nom de la version (ex: "Version 1.0", "Avant révision", etc.)');
    if (!label || !label.trim()) return;

    const totalWords = project.acts.reduce((sum, act) => {
        return sum + act.chapters.reduce((chSum, chapter) => {
            return chSum + chapter.scenes.reduce((sceneSum, scene) => {
                return sceneSum + getWordCount(scene.content);
            }, 0);
        }, 0);
    }, 0);

    const version = {
        id: Date.now(),
        label: label.trim(),
        timestamp: new Date().toISOString(),
        wordCount: totalWords,
        snapshot: JSON.parse(JSON.stringify({
            acts: project.acts,
            characters: project.characters,
            world: project.world,
            timeline: project.timeline,
            notes: project.notes,
            codex: project.codex
        }))
    };

    project.versions.push(version);
    saveProject();
    renderVersionsList();
    alert('Version créée avec succès !');
}

// [MVVM : ViewModel]
// Modifie le project (Model) en supprimant une version, persiste et notifie la vue.
function deleteVersion(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette version ?')) return;
    project.versions = project.versions.filter(v => v.id !== id);
    saveProject();
    renderVersionsList();
}

// [MVVM : ViewModel]
// Restaure l'état du project (Model) depuis un snapshot.
function restoreVersion(id) {
    if (!confirm('?? ATTENTION: Restaurer cette version va remplacer votre travail actuel. Voulez-vous créer une sauvegarde avant de continuer ?')) {
        return;
    }

    // Create backup of current state
    createVersion();

    const version = project.versions.find(v => v.id === id);
    if (!version) return;

    // Restore snapshot
    project.acts = JSON.parse(JSON.stringify(version.snapshot.acts));
    project.characters = JSON.parse(JSON.stringify(version.snapshot.characters || []));
    project.world = JSON.parse(JSON.stringify(version.snapshot.world || []));
    project.timeline = JSON.parse(JSON.stringify(version.snapshot.timeline || []));
    project.notes = JSON.parse(JSON.stringify(version.snapshot.notes || []));
    project.codex = JSON.parse(JSON.stringify(version.snapshot.codex || []));

    saveProject();
    switchView('editor');
    renderActsList();
    alert('Version restaurée avec succès !');
}

// [MVVM : View]
// Génère directement du HTML et manipule le DOM (Vue).
function renderVersionsList() {
    const editorView = document.getElementById('editorView');
    if (!editorView) {
        console.error('editorView not found');
        return;
    }

    // Sort by most recent first
    const sortedVersions = [...project.versions].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    editorView.innerHTML = `
                <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2 style="color: var(--accent-gold);"><i data-lucide="history" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>Gestion des Versions</h2>
                        <button class="btn btn-primary" onclick="createVersion()">
                            + Créer une version
                        </button>
                    </div>
                    
                    ${project.versions.length === 0 ? `
                        <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">??</div>
                            <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">Aucune version sauvegardée</div>
                            <div style="font-size: 0.9rem; margin-bottom: 2rem;">
                                Les versions vous permettent de créer des snapshots de votre projet<br>
                                pour revenir à un état antérieur si nécessaire.
                            </div>
                            <button class="btn btn-primary" onclick="createVersion()">
                                Créer votre première version
                            </button>
                        </div>
                    ` : `
                        <div style="display: grid; gap: 1rem;">
                            ${sortedVersions.map(version => `
                                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                        <div>
                                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                                                ${version.label}
                                            </div>
                                            <div style="font-size: 0.85rem; color: var(--text-muted);">
                                                ${new Date(version.timestamp).toLocaleString('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short'
    })}
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-gold);">
                                                ${version.wordCount.toLocaleString('fr-FR')}
                                            </div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">
                                                mots
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                        <button class="btn btn-small" onclick="restoreVersion(${version.id})" 
                                                style="background: var(--accent-gold); color: white; border: none;">
                                            <i data-lucide="undo" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> 
                                            Restaurer
                                        </button>
                                        <button class="btn btn-small" onclick="compareVersion(${version.id})">
                                            <i data-lucide="git-compare" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                                            Comparer
                                        </button>
                                        <button class="btn btn-small" onclick="deleteVersion(${version.id})" 
                                                style="background: var(--accent-red); color: white; border: none;">
                                            <i data-lucide="trash-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> 
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
}

// [MVVM : Other]
// Calcule une différence (ViewModel) et l'affiche via alert (View).
function compareVersion(id) {
    const version = project.versions.find(v => v.id === id);
    if (!version) return;

    const currentWords = project.acts.reduce((sum, act) => {
        return sum + act.chapters.reduce((chSum, chapter) => {
            return chSum + chapter.scenes.reduce((sceneSum, scene) => {
                return sceneSum + getWordCount(scene.content);
            }, 0);
        }, 0);
    }, 0);

    const diff = currentWords - version.wordCount;
    const diffText = diff > 0 ? `+${diff}` : diff;

    alert(`Comparaison avec "${version.label}":\n\nVersion sauvegardée: ${version.wordCount.toLocaleString('fr-FR')} mots\nVersion actuelle: ${currentWords.toLocaleString('fr-FR')} mots\nDifférence: ${diffText} mots`);
}