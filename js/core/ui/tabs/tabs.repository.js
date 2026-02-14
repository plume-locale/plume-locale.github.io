/* ==========================================
   TABS SYSTEM - Repository
   ========================================== */

/**
 * [MVVM : Repository]
 * Gère la persistance des presets d'onglets (LocalStorage).
 */
const TabsRepository = {
    KEYS: {
        PRESETS: 'plume_locale_tabs_presets'
    },

    /** Charge tous les presets sauvegardés */
    getPresets() {
        const saved = localStorage.getItem(TabsRepository.KEYS.PRESETS);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Erreur chargement presets onglets', e);
            return [];
        }
    },

    /** Sauvegarde la liste complète des presets */
    savePresets(presets) {
        localStorage.setItem(TabsRepository.KEYS.PRESETS, JSON.stringify(presets));
    },

    /** Ajoute ou met à jour un preset par nom */
    savePreset(name, tabsSnapshot) {
        let presets = TabsRepository.getPresets();
        presets = presets.filter(p => p.name !== name);
        presets.push({ name, tabs: tabsSnapshot, createdAt: Date.now() });
        TabsRepository.savePresets(presets);
    },

    /** Supprime un preset par nom */
    deletePreset(name) {
        let presets = TabsRepository.getPresets();
        presets = presets.filter(p => p.name !== name);
        TabsRepository.savePresets(presets);
    }
};
