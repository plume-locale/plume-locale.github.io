/**
 * [MVVM : View] Localization View
 * Handles updating the DOM when the locale changes.
 */
class LocalizationView {
    constructor() {
        // No specific state needed here
    }

    /**
     * Update all elements with data-i18n attribute.
     * @param {string} currentLocale 
     * @param {function} translateFn - The translation function from the manager
     */
    updateInterface(currentLocale, translateFn) {
        const elements = document.querySelectorAll('[data-i18n], [data-i18n-title], [data-i18n-placeholder], [data-i18n-tooltip]');
        elements.forEach(el => {
            // Update content if data-i18n is present
            if (el.hasAttribute('data-i18n')) {
                const key = el.getAttribute('data-i18n');
                const translation = translateFn(key);

                if (el.children.length > 0) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translation;
                    } else {
                        let textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
                        if (textNode) {
                            textNode.textContent = translation;
                        }
                    }
                } else {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        if (el.type === 'button' || el.type === 'submit') {
                            el.value = translation;
                        } else {
                            el.placeholder = translation;
                        }
                    } else if (el.hasAttribute('title') && !el.hasAttribute('data-i18n-title')) {
                        el.title = translation;
                    } else {
                        el.textContent = translation;
                    }
                }
            }

            // Also update Title attribute if data-i18n-title is present
            if (el.hasAttribute('data-i18n-title')) {
                const titleKey = el.getAttribute('data-i18n-title');
                el.title = translateFn(titleKey);
            }

            // Also update Placeholder attribute if data-i18n-placeholder is present
            if (el.hasAttribute('data-i18n-placeholder')) {
                const placeholderKey = el.getAttribute('data-i18n-placeholder');
                el.placeholder = translateFn(placeholderKey);
            }

            // Update data-tooltip attribute for rich CSS tooltips (used by tool-btn)
            if (el.hasAttribute('data-i18n-tooltip')) {
                const tooltipKey = el.getAttribute('data-i18n-tooltip');
                el.dataset.tooltip = translateFn(tooltipKey);
            }
        });

        // Update active class on language options
        const langOptions = document.querySelectorAll('.lang-option');
        langOptions.forEach(opt => {
            const lang = opt.getAttribute('data-lang');
            if (lang === currentLocale) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // Update the main button icon with the current flag
        const langToggleBtn = document.querySelector('.lang-dropdown .header-action-btn');
        if (langToggleBtn) {
            const flags = {
                'fr': '🇫🇷',
                'en': '🇬🇧',
                'de': '🇩🇪',
                'es': '🇪🇸'
            };
            const currentFlag = flags[currentLocale] || '🌐';
            langToggleBtn.innerHTML = `<span style="font-size: 1.2rem; line-height: 1;">${currentFlag}</span>`;
        }
    }
}
