
// Focus Mode Management
let focusModeActive = false;
let focusPanelOpen = false;
let focusStartWordCount = 0;
let linksPanelVisible = true; // État de visibilité du linksPanel

// Objectif de mots pour le projet (peut être configuré)
let projectWordGoal = 50000;

// [MVVM : ViewModel]
// Calcule les données de progression et met à jour la vue.
function updateWritingProgress() {
    if (!currentSceneId) return;

    const act = project.acts.find(a => a.id === currentActId);
    if (!act) return;
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    if (!chapter) return;
    const scene = chapter.scenes.find(s => s.id === currentSceneId);
    if (!scene) return;

    const currentWords = getWordCount(scene.content || '');

    // Calculer le total de mots du projet
    const totalProjectWords = project.acts.reduce((sum, a) =>
        sum + a.chapters.reduce((s, ch) =>
            s + ch.scenes.reduce((sc, scene) => sc + (scene.wordCount || 0), 0), 0), 0);

    // Mettre à jour la barre de progression
    const progressPercent = Math.min((totalProjectWords / projectWordGoal) * 100, 100);
    const progressFill = document.getElementById('writingProgressFill');
    if (progressFill) {
        progressFill.style.width = progressPercent + '%';
    }

    // Mettre à jour l'indicateur de position
    const positionIndicator = document.getElementById('positionIndicator');
    if (positionIndicator) {
        positionIndicator.textContent = `Mot ${currentWords.toLocaleString()} • Total: ${totalProjectWords.toLocaleString()} / ${projectWordGoal.toLocaleString()}`;
    }
}

// [MVVM : Other]
// Group: Use Case | Naming: ToggleFocusUseCase
// Gère l'état logique et manipule les classes CSS/affichage (Mixte).
function toggleFocusMode() {
    console.log('toggleFocusMode called, current state:', focusModeActive);

    focusModeActive = !focusModeActive;
    const appContainer = document.querySelector('.app-container');
    const focusBtn = document.querySelector('.focus-toggle-btn');

    console.log('App container found:', !!appContainer);
    console.log('Focus button found:', !!focusBtn);

    if (focusModeActive) {
        console.log('ACTIVATING FOCUS MODE');
        appContainer.classList.add('focus-mode');

        // Hide left sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.style.display = 'none';

        // Ensure tools sidebar and its panels are visible and accessible
        const toolsSidebar = document.getElementById('toolsSidebar');
        if (toolsSidebar) {
            toolsSidebar.style.display = 'flex';
            toolsSidebar.style.zIndex = '105'; // Above editor
        }

        // Configure sidebars to be visible over the fullscreen editor
        const panels = [
            'sidebarVersions',
            'annotationsPanel',
            'todosPanel',
            'linksPanel',
            'arcScenePanel',
            'sidebarPlot'
        ];

        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Ensure they have higher z-index to show on top of fullscreen mode
                el.style.zIndex = '110';
                // We don't force display here, as their specific toggle functions manage .hidden class
                // But we act as if they are part of the focus layout
                el.style.position = 'relative'; // Or keep default flex behavior if parent allows
            }
        });

        // Track starting word count
        if (currentSceneId) {
            const act = project.acts.find(a => a.id === currentActId);
            const chapter = act.chapters.find(c => c.id === currentChapterId);
            const scene = chapter.scenes.find(s => s.id === currentSceneId);
            focusStartWordCount = getWordCount(scene.content);
        }

        // Mettre à jour les indicateurs
        updateWritingProgress();

        // Request fullscreen on app-container
        if (appContainer.requestFullscreen) {
            appContainer.requestFullscreen().catch((err) => {
                console.log('Fullscreen not available or denied:', err);
            });
        }
    } else {
        console.log('DEACTIVATING FOCUS MODE');
        appContainer.classList.remove('focus-mode');

        // Forcer la réinitialisation des styles inline si nécessaire
        const sidebar = document.querySelector('.sidebar');
        const toolsSidebar = document.getElementById('toolsSidebar');
        const sidebarVersions = document.querySelector('.sidebar-versions');
        const appContent = document.querySelector('.app-content');
        const editorContainer = document.querySelector('.editor-container');

        if (sidebar) sidebar.style.cssText = '';
        if (toolsSidebar) toolsSidebar.style.cssText = '';

        // Reset panels styles
        const panels = [
            'sidebarVersions',
            'annotationsPanel',
            'todosPanel',
            'linksPanel',
            'arcScenePanel',
            'sidebarPlot'
        ];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.zIndex = '';
        });

        if (sidebarVersions && !sidebarVersions.classList.contains('hidden')) {
            sidebarVersions.style.cssText = '';
        }
        if (appContent) appContent.style.cssText = '';
        if (editorContainer) editorContainer.style.cssText = '';

        // Exit fullscreen
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
        }
        focusPanelOpen = false;
        document.getElementById('focusPanel').classList.remove('active');
    }

    // Gestion visuelle du Tension Meter en mode Focus
    const tensionMeter = document.getElementById('liveTensionMeter');
    if (tensionMeter) {
        if (focusModeActive) tensionMeter.classList.add('focus-hide');
        else tensionMeter.classList.remove('focus-hide');
    }
}

// [MVVM : View]
// Bascule la visibilité d'un élément d'interface (panneau focus).
function toggleFocusPanel() {
    focusPanelOpen = !focusPanelOpen;
    const panel = document.getElementById('focusPanel');

    if (focusPanelOpen) {
        panel.classList.add('active');
        console.log('Focus panel opened');
    } else {
        panel.classList.remove('active');
        console.log('Focus panel closed');
    }
}

// [MVVM : View]
// Bascule l'affichage d'un composant UI (barre d'outils).
function toggleToolbar() {
    const toolbar = document.getElementById('editorToolbar');
    if (toolbar) {
        toolbar.style.display = document.getElementById('hideToolbar').checked ? 'none' : 'flex';
    }
}

// [MVVM : View]
// Bascule l'affichage d'un composant UI (panneau des liens).
function toggleLinksPanelVisibility() {
    const linksPanel = document.getElementById('linksPanel');
    const toolBtn = document.getElementById('toolLinksPanelBtn');
    const checkbox = document.getElementById('hideLinksPanel');

    if (!linksPanel) return;

    const isCurrentlyHidden = linksPanel.classList.contains('hidden');

    if (isCurrentlyHidden) {
        // Afficher le panneau
        if (typeof renderLinksPanelSidebar === 'function') {
            renderLinksPanelSidebar();
        }
        linksPanel.classList.remove('hidden');
        linksPanelVisible = true;
        if (toolBtn) toolBtn.classList.add('active');
        if (checkbox) checkbox.checked = false;
    } else {
        // Masquer le panneau
        linksPanel.classList.add('hidden');
        linksPanelVisible = false;
        if (toolBtn) toolBtn.classList.remove('active');
        if (checkbox) checkbox.checked = true;
    }
}

// [MVVM : ViewModel]
// Met à jour les statistiques affichées dans le mode focus.
function updateFocusStats() {
    if (!focusModeActive || !currentSceneId) return;

    const act = project.acts.find(a => a.id === currentActId);
    const chapter = act.chapters.find(c => c.id === currentChapterId);
    const scene = chapter.scenes.find(s => s.id === currentSceneId);

    const currentWordCount = getWordCount(scene.content);
    const wordsWritten = Math.max(0, currentWordCount - focusStartWordCount);

    document.getElementById('focusWordCount').textContent = wordsWritten;
}

// Pomodoro Timer
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let pomodoroInterval = null;
let pomodoroRunning = false;
let pomodorosCompleted = 0;

// [MVVM : View]
// Affiche ou masque la popup du timer Pomodoro.
function togglePomodoroPopup() {
    const popup = document.getElementById('pomodoroPopup');
    popup.classList.toggle('active');
}

// Fermer la popup si on clique ailleurs
document.addEventListener('click', function (event) {
    const popup = document.getElementById('pomodoroPopup');
    const btn = document.getElementById('pomodoroHeaderBtn');
    if (popup && btn && !popup.contains(event.target) && !btn.contains(event.target)) {
        popup.classList.remove('active');
    }
});

// [MVVM : ViewModel]
// Gère la logique de démarrage du timer Pomodoro.
function startPomodoro() {
    if (pomodoroRunning) return;

    pomodoroRunning = true;
    // Ajouter indicateur visuel sur le bouton header
    const headerBtn = document.getElementById('pomodoroHeaderBtn');
    if (headerBtn) headerBtn.classList.add('pomodoro-active');

    pomodoroInterval = setInterval(() => {
        if (pomodoroTime > 0) {
            pomodoroTime--;
            updatePomodoroDisplay();
        } else {
            // Pomodoro completed
            completedPomodoro();
        }
    }, 1000);
}

// [MVVM : ViewModel]
// Gère la logique de pause du timer Pomodoro.
function pausePomodoro() {
    pomodoroRunning = false;
    // Retirer indicateur visuel
    const headerBtn = document.getElementById('pomodoroHeaderBtn');
    if (headerBtn) headerBtn.classList.remove('pomodoro-active');

    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
}

// [MVVM : ViewModel]
// Réinitialise l'état logique du timer Pomodoro.
function resetPomodoro() {
    pausePomodoro();
    pomodoroTime = 25 * 60;
    updatePomodoroDisplay();
}

// [MVVM : ViewModel]
// Gère la fin d'un cycle Pomodoro (logique métier et notification).
function completedPomodoro() {
    pausePomodoro();
    pomodorosCompleted++;
    document.getElementById('pomodorosCompleted').textContent = pomodorosCompleted;

    // Play notification sound (simple beep)
    playNotificationSound();

    // Alert user
    alert('Pomodoro terminé ! Temps de faire une pause de 5 minutes.');

    // Reset for next session
    pomodoroTime = 25 * 60;
    updatePomodoroDisplay();
}

// [MVVM : View]
// Met à jour l'affichage textuel du timer dans l'interface.
function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    document.getElementById('pomodoroDisplay').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// [MVVM : Other]
// Group: Service | Naming: AudioService
// Produit une sortie audio (Feedback UI).
function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Update focus stats on content change
// [MVVM : Other]
// Group: Util / Helper | Naming: FocusUtils
// Décore une fonction pour déclencher une mise à jour du ViewModel (Mixte).
const originalUpdateSceneContent = updateSceneContent;
updateSceneContent = function () {
    originalUpdateSceneContent();
    updateFocusStats();
};


