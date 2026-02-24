/**
 * [MVVM : ViewModel]
 * Gère la logique métier des thèmes (conversions, application, import/export).
 */
const ThemeManagerViewModel = {
    /**
     * Convertit rgba/rgb/hex en hex
     */
    rgbaToHex: (color) => {
        if (!color) return '#000000';
        if (color.startsWith('#')) return color.length === 7 ? color : color + 'FF';

        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        return '#000000';
    },

    /**
     * Convertit hex en rgb (string "R, G, B")
     */
    hexToRgb: (hex) => {
        if (!hex) return '0, 0, 0';
        if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
            const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            return match ? `${match[1]}, ${match[2]}, ${match[3]}` : '0, 0, 0';
        }
        if (hex.length === 4) {
            const r = parseInt(hex[1] + hex[1], 16);
            const g = parseInt(hex[2] + hex[2], 16);
            const b = parseInt(hex[3] + hex[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    },

    /**
     * Applique un thème au document
     */
    applyTheme: (colors) => {
        const root = document.documentElement;
        // Fusionner avec les défauts pour s'assurer que TOUTES les variables sont réinitialisées
        const fullTheme = { ...ThemeManagerModel.defaultVariables, ...colors };

        Object.entries(fullTheme).forEach(([variable, value]) => {
            root.style.setProperty(variable, value);
            if (!variable.endsWith('-rgb') && !variable.includes('highlight') && !variable.includes('shadow')) {
                try {
                    const rgbValue = ThemeManagerViewModel.hexToRgb(value);
                    root.style.setProperty(`${variable}-rgb`, rgbValue);
                } catch (e) { }
            }
        });
        ThemeManagerRepository.saveCurrentTheme(colors);
    },

    /**
     * Initialise le thème au démarrage
     */
    init: () => {
        const savedTheme = ThemeManagerRepository.getCurrentTheme();
        if (savedTheme) {
            ThemeManagerViewModel.applyTheme(savedTheme);
        } else {
            // Premier chargement: appliquer le thème par défaut (Plume)
            // Cela permet de s'assurer que toutes les variables (y compris -rgb) sont bien initialisées
            ThemeManagerViewModel.applyTheme(ThemeManagerModel.defaultVariables);
        }
    },

    /**
     * Exporte un thème en JSON
     */
    exportTheme: (colors, name) => {
        const theme = { name, colors, version: '1.0' };
        const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-${name.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Importe un thème depuis un fichier
     */
    importTheme: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const theme = JSON.parse(e.target.result);
                    if (theme.colors && theme.name) resolve(theme);
                    else reject(new Error(Localization.t('theme.error.invalid_format')));
                } catch (error) { reject(error); }
            };
            reader.readAsText(file);
        });
    }
};
