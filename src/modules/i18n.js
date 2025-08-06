import { state } from './state.js';

class I18n {
    constructor() {
        this.currentLocale = state.settings.locale;
        this.translations = {};
    }

    async init() {
        await this.loadLocale(this.currentLocale);
        this.updateDOM();
    }

    async switchLanguage(locale) {
        this.currentLocale = locale;
        state.settings.locale = locale;
        localStorage.setItem('topography-editor-locale', locale);
        
        await this.loadLocale(locale);
        this.updateDOM();
        this.updateLanguageSwitcher();
    }

    updateLanguageSwitcher() {
        document.querySelectorAll('.flag-button').forEach(button => {
            const buttonLocale = button.getAttribute('data-locale');
            if (buttonLocale === this.currentLocale) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    async loadLocale(locale) {
        try {
            const response = await fetch(`locales/${locale}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error(this.t('errors.localeLoadFailed'), locale);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            value = value[k];
            if (!value) return key;
        }

        return value;
    }

    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        const title = document.querySelector('title[data-i18n]');
        if (title) {
            title.textContent = this.t(title.getAttribute('data-i18n'));
        }
        
        this.updateLanguageSwitcher();
    }
}

export const i18n = new I18n();
