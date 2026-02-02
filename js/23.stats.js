
// Statistics Management
// [MVVM : Other]
// Calcule des métriques (ViewModel) et injecte du HTML (View).
function renderStats() {
    const editorView = document.getElementById('editorView');
    if (!editorView) {
        console.error('editorView not found');
        return;
    }

    // Calculate total words
    const totalWords = project.acts.reduce((sum, act) => {
        return sum + act.chapters.reduce((chSum, chapter) => {
            return chSum + chapter.scenes.reduce((sceneSum, scene) => {
                return sceneSum + getWordCount(scene.content);
            }, 0);
        }, 0);
    }, 0);

    // Calculate today's words
    const today = new Date().toDateString();
    const todaySession = project.stats.writingSessions.find(s => new Date(s.date).toDateString() === today);
    const todayWords = todaySession ? todaySession.words : 0;

    // Progress percentages
    const dailyProgress = Math.min((todayWords / project.stats.dailyGoal) * 100, 100);
    const totalProgress = Math.min((totalWords / project.stats.totalGoal) * 100, 100);

    editorView.innerHTML = `
                <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                    <h2 style="margin-bottom: 2rem; color: var(--accent-gold);"><i data-lucide="bar-chart-3" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>Statistiques</h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                        <div class="stat-box" style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Total de mots</div>
                            <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.5rem;">${totalWords.toLocaleString('fr-FR')}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">sur ${project.stats.totalGoal.toLocaleString('fr-FR')} mots</div>
                            <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: var(--accent-gold); height: 100%; width: ${totalProgress}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                                <input type="number" class="form-input" value="${project.stats.totalGoal}" 
                                       id="totalGoalInput"
                                       style="flex: 1;" placeholder="Objectif total">
                                <button class="btn btn-small" onclick="updateGoal('totalGoal', document.getElementById('totalGoalInput').value)">Mettre à jour</button>
                            </div>
                        </div>

                        <div class="stat-box" style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; border-left: 4px solid var(--accent-red);">
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Aujourd'hui</div>
                            <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-red); margin-bottom: 0.5rem;">${todayWords}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">sur ${project.stats.dailyGoal} mots</div>
                            <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: var(--accent-red); height: 100%; width: ${dailyProgress}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center;">
                                <input type="number" class="form-input" value="${project.stats.dailyGoal}" 
                                       id="dailyGoalInput"
                                       style="flex: 1;" placeholder="Objectif quotidien">
                                <button class="btn btn-small" onclick="updateGoal('dailyGoal', document.getElementById('dailyGoalInput').value)">Mettre à jour</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Par acte</h3>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                            ${project.acts.map(act => {
        const actWords = act.chapters.reduce((sum, chapter) => {
            return sum + chapter.scenes.reduce((sceneSum, scene) => {
                return sceneSum + getWordCount(scene.content);
            }, 0);
        }, 0);
        return `
                                    <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                                        <span style="color: var(--text-primary);">${act.title}</span>
                                        <span style="font-weight: 600; color: var(--accent-gold);">${actWords.toLocaleString('fr-FR')} mots</span>
                                    </div>
                                `;
    }).join('')}
                        </div>
                    </div>

                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Historique (7 derniers jours)</h3>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                            ${renderWritingHistory()}
                        </div>
                    </div>
                </div>
            `;
}

// [MVVM : View]
// Transforme les données d'historique en fragments HTML.
function renderWritingHistory() {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date);
    }

    return last7Days.map(date => {
        const dateStr = date.toDateString();
        const session = project.stats.writingSessions.find(s => new Date(s.date).toDateString() === dateStr);
        const words = session ? session.words : 0;
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

        return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
                        <span style="font-size: 0.85rem;">${dayName}</span>
                        <div style="flex: 1; margin: 0 1rem;">
                            <div class="progress-bar" style="height: 4px;">
                                <div class="progress-fill" style="width: ${Math.min((words / project.stats.dailyGoal) * 100, 100)}%; background: ${words >= project.stats.dailyGoal ? 'var(--accent-gold)' : 'var(--text-muted)'}"></div>
                            </div>
                        </div>
                        <span style="font-size: 0.85rem; font-weight: 600; font-family: 'Source Code Pro', monospace;">${words}</span>
                    </div>
                `;
    }).join('');
}

// [MVVM : ViewModel]
// Met à jour le modèle (project.stats), persiste et déclenche un re-render.
function updateGoal(type, value) {
    const numValue = parseInt(value);
    if (numValue && numValue > 0) {
        project.stats[type] = numValue;
        saveProject();
        renderStats();
    }
}

// [MVVM : ViewModel]
// Suit et modifie l'état du modèle (writingSessions), calculs métier.
function trackWritingSession() {
    // Track writing session for stats
    const today = new Date().toDateString();
    const totalWords = project.acts.reduce((sum, act) => {
        return sum + act.chapters.reduce((chSum, chapter) => {
            return chSum + chapter.scenes.reduce((sceneSum, scene) => {
                return sceneSum + getWordCount(scene.content);
            }, 0);
        }, 0);
    }, 0);

    const sessionIndex = project.stats.writingSessions.findIndex(s => new Date(s.date).toDateString() === today);

    if (sessionIndex >= 0) {
        project.stats.writingSessions[sessionIndex].words = totalWords - (project.stats.writingSessions[sessionIndex].startWords || 0);
    } else {
        project.stats.writingSessions.push({
            date: new Date().toISOString(),
            words: 0,
            startWords: totalWords
        });
    }
}
