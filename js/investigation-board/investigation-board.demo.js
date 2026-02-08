
// Demo Data Cleanup Script
function clearDemoData() {
    console.log("🧹 Clearing Demo Data...");

    if (confirm(Localization.t('investigation.warning.clear_demo'))) {
        // 1. Clear Investigation Store
        if (window.InvestigationStore) {
            InvestigationStore.state.cases = [];
            InvestigationStore.state.activeCaseId = null;
            InvestigationStore.state.facts = [];
            InvestigationStore.state.knowledge = [];
            InvestigationStore.state.suspectLinks = [];
            InvestigationStore.save();
            console.log("✅ Investigation Board data cleared.");
        }

        // 2. Clear Demo Characters
        // Remove characters matching specific demo names
        if (window.project && window.project.characters) {
            const demoNames = [
                "The Butler", "The Heir",
                "Alfred (Majordome)", "Baron Sterling",
                "Dr. Aris", "Julian (Héritier)",
                "M. Vane (Rival)", "Miss Scarlet",
                "Sarah Jenkins", "Victor Blackwood"
            ];

            const initialLength = window.project.characters.length;

            // Filter by ID (101, 102) or Name (exact or partial matches for robustness)
            window.project.characters = window.project.characters.filter(c => {
                const isDemoId = [101, 102].includes(c.id);
                const isDemoName = demoNames.some(name => c.name === name || c.name.includes(name));
                return !isDemoId && !isDemoName;
            });

            if (window.project.characters.length < initialLength) {
                console.log("✅ Demo characters removed.");
                // Trigger save if possible
                if (typeof saveProjectToDB === 'function') {
                    saveProjectToDB(window.project);
                }
            }
        }

        console.log("✨ Cleanup complete. Reloading...");
        window.location.reload();
    }
}

// Expose globally
window.clearDemoData = clearDemoData;

// Keep inject function for compatibility but make it do nothing or alert
window.injectDemoData = function () {
    alert("Demo injection is disabled. Use clearDemoData() to clean up.");
};
