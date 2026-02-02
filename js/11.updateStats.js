
(function () {
    if (typeof window === 'undefined') return;
    if (typeof window.updateStats === 'function') return; // migrated implementation present

    // [MVVM : Other]
    // Calcul des statistiques globales (Logique métier) et mise à jour directe de l'interface (View).
    window.updateStats = function () {
        const totalActs = project.acts.length;
        const totalChapters = project.acts.reduce((sum, act) => sum + act.chapters.length, 0);
        const totalWords = project.acts.reduce((sum, act) => {
            return sum + act.chapters.reduce((chSum, chapter) => {
                return chSum + chapter.scenes.reduce((sceneSum, scene) => {
                    return sceneSum + getWordCount(scene.content);
                }, 0);
            }, 0);
        }, 0);

        // Mettre à jour les stats dans le header
        const headerWords = document.getElementById('headerTotalWords');
        const headerChapters = document.getElementById('headerTotalChapters');
        if (headerWords) headerWords.textContent = `${totalWords} mots`;
        if (headerChapters) headerChapters.textContent = `${totalChapters} chapitres`;

        // Mettre à jour le titre du projet dans le header
        const headerTitle = document.getElementById('headerProjectTitle');
        if (headerTitle) headerTitle.textContent = project.title;
    };
})();