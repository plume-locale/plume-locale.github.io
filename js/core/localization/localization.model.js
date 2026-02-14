/**
 * [MVVM : Model] Localization Model
 * Stores the current locale and the loaded translation dictionaries.
 */
class LocalizationModel {
    constructor() {
        this.currentLocale = 'fr'; // Default
        this.locales = {
            'fr': (typeof LOCALE_FR !== 'undefined' ? LOCALE_FR : (typeof window.LOCALE_FR !== 'undefined' ? window.LOCALE_FR : {})),
            'en': (typeof LOCALE_EN !== 'undefined' ? LOCALE_EN : (typeof window.LOCALE_EN !== 'undefined' ? window.LOCALE_EN : {})),
            'de': (typeof LOCALE_DE !== 'undefined' ? LOCALE_DE : (typeof window.LOCALE_DE !== 'undefined' ? window.LOCALE_DE : {})),
            'es': (typeof LOCALE_ES !== 'undefined' ? LOCALE_ES : (typeof window.LOCALE_ES !== 'undefined' ? window.LOCALE_ES : {}))
        };
        this.observers = [];
    }

    /**
     * Set the current locale.
     * @param {string} localeCode - 'fr' or 'en'
     */
    setLocale(localeCode) {
        if (this.locales[localeCode]) {
            this.currentLocale = localeCode;
            this.notifyObservers();
        } else {
            console.warn(`Localization: Locale '${localeCode}' not found.`);
        }
    }

    /**
     * Get the current locale code.
     * @returns {string}
     */
    getLocale() {
        return this.currentLocale;
    }

    /**
     * Get a translation for a specific key.
     * @param {string} key 
     * @param {Array} params - Optional parameters for substitution
     * @returns {string} The translated string or the key if not found.
     */
    translate(key, params = []) {
        const dictionary = this.locales[this.currentLocale];
        let text = dictionary[key] || key;

        if (params && params.length > 0) {
            params.forEach((param, index) => {
                text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), param);
            });
        }

        return text;
    }

    /**
     * Add an observer to be notified of locale changes.
     * @param {function} callback 
     */
    subscribe(callback) {
        this.observers.push(callback);
    }

    /**
     * Notify all observers.
     */
    notifyObservers() {
        this.observers.forEach(callback => callback(this.currentLocale));
    }
}
