class I18n {
    constructor() {
        this.currentLocale = 'pt-BR';
        this.translations = {};
    }

    async init() {
        await this.loadLocale(this.currentLocale);
        this.updateDOM();
    }

    async loadLocale(locale) {
        try {
            const response = await fetch(`locales/${locale}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load locale:', locale);
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
    }
}

export const i18n = new I18n();
