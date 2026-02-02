// ============================================
// MOBILE SIDEBAR VIEWS
// ============================================

// [MVVM : Other]
// Group: Coordinator | Naming: MobileCoordinator
// Gère le rendu des vues de la barre latérale pour la version mobile.
// Cette fonction fait le pont entre les données du projet (Model) et l'interface utilisateur (View)
// en affichant soit un état vide avec un bouton d'action, soit un résumé du nombre d'éléments pour chaque catégorie.
function renderMobileSidebarView(view) {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    const viewConfig = {
        editor: {
            icon: '📝',
            title: 'Structure de votre roman',
            description: 'Organisez votre roman en actes, chapitres et scènes',
            emptyMessage: 'Aucun acte créé',
            emptySubMessage: 'Commencez par créer votre premier acte pour structurer votre histoire',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddActModal()">+ Créer un acte</button>',
            sidebarHint: 'Utilisez la poignée dorée sur le bord gauche pour naviguer dans votre structure'
        },
        characters: {
            icon: '👥',
            title: 'Personnages',
            description: 'Gérez vos personnages et leurs caractéristiques',
            emptyMessage: 'Aucun personnage créé',
            emptySubMessage: 'Créez votre premier personnage pour donner vie à votre histoire',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddCharacterModal()">+ Créer un personnage</button>',
            sidebarHint: 'Utilisez la poignée dorée sur le bord gauche pour voir la liste complète'
        },
        world: {
            icon: '🌍',
            title: 'Univers',
            description: 'Créez les éléments de votre monde (lieux, objets, concepts)',
            emptyMessage: 'Aucun élément créé',
            emptySubMessage: 'Ajoutez des lieux, objets ou concepts pour enrichir votre univers',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddWorldModal()">+ Créer un élément</button>',
            sidebarHint: 'Utilisez la poignée dorée sur le bord gauche pour voir tous vos éléments'
        },
        notes: {
            icon: '📋',
            title: 'Notes',
            description: 'Prenez des notes et organisez vos recherches',
            emptyMessage: 'Aucune note créée',
            emptySubMessage: 'Créez des notes pour garder vos idées et recherches organisées',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddNoteModal()">+ Créer une note</button>',
            sidebarHint: 'Utilisez la poignée dorée sur le bord gauche pour voir toutes vos notes'
        },
        codex: {
            icon: '📖',
            title: 'Codex',
            description: 'Wiki de votre univers - glossaire et encyclopédie',
            emptyMessage: 'Aucune entrée dans le codex',
            emptySubMessage: 'Créez des entrées pour documenter votre univers',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddCodexModal()">+ Créer une entrée</button>',
            sidebarHint: 'Utilisez la poignée dorée sur le bord gauche pour parcourir le codex'
        }
    };

    const config = viewConfig[view];
    if (!config) return;

    // Vérifier si vide
    let isEmpty = false;
    let count = 0;

    if (view === 'editor') {
        isEmpty = !project.acts || project.acts.length === 0;
        count = project.acts ? project.acts.length : 0;
    } else if (view === 'characters') {
        isEmpty = !project.characters || project.characters.length === 0;
        count = project.characters ? project.characters.length : 0;
    } else if (view === 'world') {
        isEmpty = !project.world || project.world.length === 0;
        count = project.world ? project.world.length : 0;
    } else if (view === 'notes') {
        isEmpty = !project.notes || project.notes.length === 0;
        count = project.notes ? project.notes.length : 0;
    } else if (view === 'codex') {
        isEmpty = !project.codex || project.codex.length === 0;
        count = project.codex ? project.codex.length : 0;
    }

    let html = `
                <div class="empty-state" style="padding: 2rem 1.5rem; text-align: center;">
                    <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1rem;">
                        ${config.icon}
                    </div>
                    <div class="empty-state-title" style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                        ${config.title}
                    </div>
                    <div class="empty-state-text" style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
                        ${config.description}
                    </div>
            `;

    if (isEmpty) {
        html += `
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 3px solid var(--accent-gold);">
                        <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                            ${config.emptyMessage}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.95rem;">
                            ${config.emptySubMessage}
                        </div>
                    </div>
                    ${config.actionButton}
                `;
    } else {
        html += `
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--accent-gold); margin-bottom: 0.5rem;">
                            ${count}
                        </div>
                        <div style="color: var(--text-secondary);">
                            ${count === 1 ? 'élément' : 'éléments'}
                        </div>
                    </div>
                    ${config.actionButton}
                `;
    }

    html += `
                    <div style="margin-top: 2rem; padding: 1rem; background: rgba(212, 175, 55, 0.1); border-radius: 8px; border: 1px solid var(--accent-gold);">
                        <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">💡</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
                            ${config.sidebarHint}
                        </div>
                    </div>
                </div>
            `;

    editorView.innerHTML = html;
}

// ============================================
// END MOBILE SIDEBAR VIEWS
// ============================================