const StylisticAnalysis = {
    init() {
        this.setupListeners();
        this.setupSidebarResize();
        console.log('✨ StylisticAnalysis initialized');
    },

    togglePanel() {
        const sidebar = document.getElementById('stylisticAnalysisSidebar');
        const btn = document.getElementById('toolStylisticBtn');

        if (!sidebar) return;

        const isVisible = !sidebar.classList.contains('hidden');

        if (isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    },

    showPanel() {
        const sidebar = document.getElementById('stylisticAnalysisSidebar');
        const btn = document.getElementById('toolStylisticBtn');

        if (!sidebar) return;

        sidebar.classList.remove('hidden');
        if (btn) btn.classList.add('active');

        // Toujours rafraîchir à l'ouverture
        StylisticAnalysisHandlers.onRefresh();
    },

    hidePanel() {
        const sidebar = document.getElementById('stylisticAnalysisSidebar');
        const btn = document.getElementById('toolStylisticBtn');

        if (!sidebar) return;

        sidebar.classList.add('hidden');
        if (btn) btn.classList.remove('active');

        // Nettoyer les surlignages si demandé
        if (typeof StylisticAnalysisViewModel !== 'undefined' && 
            StylisticAnalysisViewModel.getState().stopOnClose && 
            typeof StylisticAnalysisHandlers !== 'undefined') {
            StylisticAnalysisHandlers._clearAllHighlights();
        }
    },

    // S'assurer que l'analyse est rafraîchie si le panneau est ouvert
    refreshIfVisible() {
        const sidebar = document.getElementById('stylisticAnalysisSidebar');
        if (sidebar && !sidebar.classList.contains('hidden')) {
            StylisticAnalysisHandlers.onRefresh();
        }
    },

    setupListeners() {
        // Optionnel : on pourrait écouter d'autres événements ici
    },

    setupSidebarResize() {
        const sidebar = document.getElementById('stylisticAnalysisSidebar');
        const resizeHandle = document.getElementById('stylisticSidebarResize');

        if (!sidebar || !resizeHandle) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = startX - e.clientX;
            const newWidth = Math.max(280, Math.min(600, startWidth + diff));
            sidebar.style.width = newWidth + 'px';
            localStorage.setItem('plume_stylistic_sidebar_width', newWidth);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });

        const savedWidth = localStorage.getItem('plume_stylistic_sidebar_width');
        if (savedWidth) {
            sidebar.style.width = savedWidth + 'px';
        }
    },

    stopAnalysis() {
        if (typeof StylisticAnalysisHandlers !== 'undefined') {
            StylisticAnalysisHandlers._clearAllHighlights();
        }
    }
};

// Expose globally
window.StylisticAnalysis = StylisticAnalysis;
window.toggleStylisticAnalysisPanel = function() { StylisticAnalysis.togglePanel(); };
window.showStylisticAnalysisPanel = function() { StylisticAnalysis.showPanel(); };
window.hideStylisticAnalysisPanel = function() { StylisticAnalysis.hidePanel(); };
window.stopStylisticAnalysis = function() { StylisticAnalysis.stopAnalysis(); };

