/**
 * [MVVM : Stats Module]
 * Ce fichier contient uniquement la logique pure de calcul et de formatage des statistiques.
 */

/**
 * [MVVM : Model]
 * Utilitaire pur pour compter les mots (Logique métier)
 */
function getWordCount(html) {
    if (!html) return 0;
    // Create temporary div to strip HTML tags
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * [MVVM : ViewModel]
 * Formate un nombre pour l'affichage (ex: 1.2k)
 */
function formatWordCount(count) {
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return count.toString();
}

/**
 * [MVVM : ViewModel]
 * Calcule les statistiques d'un chapitre pour la vue
 */
function getChapterStats(chapter) {
    if (!chapter || !chapter.scenes) return { totalScenes: 0, totalWords: 0, completedScenes: 0, progressPercent: 0 };

    const totalScenes = chapter.scenes.length;
    const totalWords = chapter.scenes.reduce((sum, s) => sum + (s.wordCount || 0), 0);
    const completedScenes = chapter.scenes.filter(s => (s.status || 'draft') === 'complete').length;
    const progressPercent = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;
    return { totalScenes, totalWords, completedScenes, progressPercent };
}

/**
 * [MVVM : ViewModel]
 * Calcule les statistiques d'un acte pour la vue
 */
function getActStats(act) {
    if (!act || !act.chapters) return { totalChapters: 0, totalScenes: 0, totalWords: 0 };

    const totalChapters = act.chapters.length;
    const totalScenes = act.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);
    const totalWords = act.chapters.reduce((sum, ch) =>
        sum + ch.scenes.reduce((s, scene) => s + (scene.wordCount || 0), 0), 0);
    return { totalChapters, totalScenes, totalWords };
}

/**
 * [MVVM : View]
 * Met à jour les statistiques globales affichées dans l'interface.
 * Note: Cette fonction dépend de variables globales comme 'project'.
 */
/**
 * [MVVM : View]
 * Met à jour les statistiques globales affichées dans l'interface (Header).
 */
function updateStats() {
    if (typeof project === 'undefined' || !project.acts) return;

    const totalChapters = project.acts.reduce((sum, act) => sum + (act.chapters ? act.chapters.length : 0), 0);

    const totalWords = project.acts.reduce((sum, act) => {
        return sum + (act.chapters ? act.chapters.reduce((chSum, chapter) => {
            return chSum + (chapter.scenes ? chapter.scenes.reduce((sceneSum, scene) => {
                // Prioritize pre-calculated wordCount if available
                return sceneSum + (scene.wordCount || (typeof getWordCount === 'function' ? getWordCount(scene.content) : 0));
            }, 0) : 0);
        }, 0) : 0);
    }, 0);

    // Mettre à jour les stats dans le header
    const headerWords = document.getElementById('headerTotalWords');
    const headerChapters = document.getElementById('headerTotalChapters');
    if (headerWords) headerWords.textContent = `${totalWords.toLocaleString('fr-FR')} mots`;
    if (headerChapters) headerChapters.textContent = `${totalChapters} chapitres`;

    // Mettre à jour le titre du projet dans le header
    const headerTitle = document.getElementById('headerProjectTitle');
    if (headerTitle && project.title) {
        headerTitle.textContent = project.title;
    }

    // Compatibilité avec l'ancien ID si nécessaire (pour d'autres vues refactorisées)
    const totalWordsEl = document.getElementById('totalWordCount');
    if (totalWordsEl) {
        totalWordsEl.textContent = totalWords.toLocaleString('fr-FR');
    }
}
