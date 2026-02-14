/**
 * [MVVM : Coordinator] Localization Manager
 * Central singleton that orchestrates localization.
 */
class LocalizationManager {
    constructor() {
        this.model = new LocalizationModel();
        this.view = new LocalizationView();

        // Initialize
        this.model.subscribe((newLocale) => {
            this.handleLocaleChange(newLocale);
        });
    }

    /**
     * Initialize the manager.
     * Can optionally load a saved preference.
     */
    init() {
        // Here we could load from localStorage
        const savedLocale = localStorage.getItem('plume_locale') || 'fr';
        this.setLocale(savedLocale);

        console.log(`Localization Manager initialized. Locale: ${savedLocale}`);

        // Add listener to close dropdown on outside click
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('langDropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    /**
     * Change the language.
     * @param {string} localeCode 
     */
    setLocale(localeCode) {
        this.model.setLocale(localeCode);
        localStorage.setItem('plume_locale', localeCode);
    }

    /**
     * Get the current language.
     * @returns {string}
     */
    getLocale() {
        return this.model.getLocale();
    }

    /**
     * Translate a key.
     * Supports both t(key, [p1, p2]) and t(key, p1, p2)
     * @param {string} key 
     * @param {...any} args - Variable arguments or a single array
     * @returns {string}
     */
    t(key, ...args) {
        let params;
        // Check if the first argument is an array and it's the only argument
        if (args.length === 1 && Array.isArray(args[0])) {
            params = args[0];
        } else {
            params = args;
        }
        return this.model.translate(key, params);
    }

    /**
     * Handle the change event (update view).
     */
    handleLocaleChange(locale) {
        this.view.updateInterface(locale, (key) => this.t(key));

        // Dispatch a global event for other components if needed
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));
        console.log(`Locale changed to: ${locale}`);
    }

    /**
     * Toggle between available locales (deprecated - use dropdown instead).
     * Kept for backward compatibility.
     */
    toggleLocale() {
        // With 4 languages, use the dropdown instead
        console.warn('toggleLocale is deprecated. Please use the language dropdown.');
    }
}

// Global Instance
const Localization = new LocalizationManager();

// Expose globally for usage in other modules
window.Localization = Localization;
