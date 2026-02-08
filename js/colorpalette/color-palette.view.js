/**
 * [MVVM : View]
 * Gère le rendu UI des sélecteurs de couleurs et le redimensionnement
 */
const ColorPaletteView = {
    /**
     * Initialise les grilles de couleurs dans le DOM
     * @param {string|null} panel 
     */
    initializeColorPickers: (panel = null) => {
        const idSuffix = panel ? `-${panel}` : '';
        const textColorGrid = document.getElementById(`textColorGrid${idSuffix}`);
        const bgColorGrid = document.getElementById(`backgroundColorGrid${idSuffix}`);

        if (!textColorGrid || !bgColorGrid) {
            console.log(`Color pickers ${idSuffix} not found in DOM, skipping initialization`);
            return;
        }

        textColorGrid.innerHTML = '';
        bgColorGrid.innerHTML = '';

        const colors = ColorPaletteViewModel.getAvailableColors();

        colors.forEach(color => {
            // Text color swatch
            const textSwatch = document.createElement('div');
            textSwatch.className = 'color-swatch';
            textSwatch.style.backgroundColor = color;
            textSwatch.title = color;
            textSwatch.onmousedown = (e) => {
                e.preventDefault();
                ColorPaletteViewModel.applyTextColor(color, panel);
            };
            textColorGrid.appendChild(textSwatch);

            // Background color swatch
            const bgSwatch = document.createElement('div');
            bgSwatch.className = 'color-swatch';
            bgSwatch.style.backgroundColor = color;
            bgSwatch.title = color;
            bgSwatch.onmousedown = (e) => {
                e.preventDefault();
                ColorPaletteViewModel.applyBackgroundColor(color, panel);
            };
            bgColorGrid.appendChild(bgSwatch);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Alterne la visibilité des menus de sélection de couleur
     * @param {string} type 
     * @param {Event} event 
     * @param {string|null} panel 
     */
    toggleColorPicker: (type, event, panel = null) => {
        const idSuffix = panel ? `-${panel}` : '';
        const textPicker = document.getElementById(`textColorPicker${idSuffix}`);
        const bgPicker = document.getElementById(`backgroundColorPicker${idSuffix}`);

        if (!textPicker || !bgPicker) return;

        const button = event ? event.currentTarget : null;

        if (type === 'text') {
            const wasActive = textPicker.classList.contains('active');
            bgPicker.classList.remove('active');

            if (!wasActive && button) {
                const rect = button.getBoundingClientRect();
                textPicker.style.top = (rect.bottom + 5) + 'px';
                textPicker.style.left = rect.left + 'px';
            }
            textPicker.classList.toggle('active');
        } else {
            const wasActive = bgPicker.classList.contains('active');
            textPicker.classList.remove('active');

            if (!wasActive && button) {
                const rect = button.getBoundingClientRect();
                bgPicker.style.top = (rect.bottom + 5) + 'px';
                bgPicker.style.left = rect.left + 'px';
            }
            bgPicker.classList.toggle('active');
        }
    },

    /**
     * Initialise la logique de redimensionnement de la sidebar
     */
    initSidebarResize: () => {
        const sidebar = document.querySelector('.sidebar');
        const resizeHandle = document.getElementById('sidebarResizeHandle');
        const appContainer = document.querySelector('.app-container');

        if (!sidebar || !resizeHandle) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;

            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = e.clientX - startX;
            const newWidth = startWidth + diff;

            if (newWidth >= 200 && newWidth <= 600) {
                sidebar.style.width = newWidth + 'px';
                if (appContainer) {
                    appContainer.style.gridTemplateColumns = `${newWidth}px 1fr`;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                ColorPaletteViewModel.updateSidebarWidth(sidebar.offsetWidth);
            }
        });

        // Load saved width
        const savedWidth = ColorPaletteViewModel.getSavedSidebarWidth();
        if (savedWidth && savedWidth >= 200 && savedWidth <= 600) {
            sidebar.style.width = savedWidth + 'px';
            if (appContainer) {
                appContainer.style.gridTemplateColumns = `${savedWidth}px 1fr`;
            }
        }
    }
};

/**
 * Fonctions globales pour compatibilité descendante
 */
function initializeColorPickers(panel = null) {
    ColorPaletteView.initializeColorPickers(panel);
}

function toggleColorPicker(type, event, panel = null) {
    ColorPaletteView.toggleColorPicker(type, event, panel);
}

function initSidebarResize() {
    ColorPaletteView.initSidebarResize();
}
