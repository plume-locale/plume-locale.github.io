/**
 * @file sidebar-view.model.js
 * @description Modèle contenant la configuration statique pour les vues de la barre latérale.
 */

const SidebarViewModelData = {
    // Configuration des différentes vues
    VIEW_CONFIG: {
        editor: {
            icon: '📝',
            titleKey: 'sidebar_view.editor.title',
            descriptionKey: 'sidebar_view.editor.description',
            emptyMessageKey: 'sidebar_view.editor.empty_message',
            emptySubMessageKey: 'sidebar_view.editor.empty_sub_message',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddActModal()">${Localization.t("sidebar_view.editor.action_btn")}</button>',
            sidebarHintKey: 'sidebar_view.editor.hint'
        },
        characters: {
            icon: '👥',
            titleKey: 'sidebar_view.characters.title',
            descriptionKey: 'sidebar_view.characters.description',
            emptyMessageKey: 'sidebar_view.characters.empty_message',
            emptySubMessageKey: 'sidebar_view.characters.empty_sub_message',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddCharacterModal()">${Localization.t("sidebar_view.characters.action_btn")}</button>',
            sidebarHintKey: 'sidebar_view.characters.hint'
        },
        world: {
            icon: '🌍',
            titleKey: 'sidebar_view.world.title',
            descriptionKey: 'sidebar_view.world.description',
            emptyMessageKey: 'sidebar_view.world.empty_message',
            emptySubMessageKey: 'sidebar_view.world.empty_sub_message',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddWorldModal()">${Localization.t("sidebar_view.world.action_btn")}</button>',
            sidebarHintKey: 'sidebar_view.world.hint'
        },
        notes: {
            icon: '📋',
            titleKey: 'sidebar_view.notes.title',
            descriptionKey: 'sidebar_view.notes.description',
            emptyMessageKey: 'sidebar_view.notes.empty_message',
            emptySubMessageKey: 'sidebar_view.notes.empty_sub_message',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddNoteModal()">${Localization.t("sidebar_view.notes.action_btn")}</button>',
            sidebarHintKey: 'sidebar_view.notes.hint'
        },
        codex: {
            icon: '📖',
            titleKey: 'sidebar_view.codex.title',
            descriptionKey: 'sidebar_view.codex.description',
            emptyMessageKey: 'sidebar_view.codex.empty_message',
            emptySubMessageKey: 'sidebar_view.codex.empty_sub_message',
            actionButton: '<button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="openAddCodexModal()">${Localization.t("sidebar_view.codex.action_btn")}</button>',
            sidebarHintKey: 'sidebar_view.codex.hint'
        }
    }
};
