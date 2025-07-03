import { i18n } from './i18n.js';

class Utils {
    showStatus(message, type) {
        const statusDiv = document.getElementById('file-status');
        if (!statusDiv) {
            console.warn(i18n.t('errors.statusDivNotFound'));
            return;
        }

        statusDiv.textContent = message;
        statusDiv.className = `status-message status-${type}`;
        statusDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }

        console.log(`Status: ${type} - ${message}`);
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loading');
        if (!loadingDiv) {
            console.warn(i18n.t('errors.loadingDivNotFound'));
            return;
        }

        loadingDiv.style.display = show ? 'block' : 'none';
        console.log(`Loading: ${show ? i18n.t('debug.loadingShow') : i18n.t('debug.loadingHide')}`);
    }
}

export const utils = new Utils();
