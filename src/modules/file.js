import { state } from './state.js';
import { i18n } from './i18n.js';
import { geoProcessing } from './geoprocessing.js';
import { utils } from './utils.js';

class FileModule {
    setup() {
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    triggerFileInput() {
        document.getElementById('file-input').click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (
            !file.name.toLowerCase().endsWith('.geojson') &&
            !file.name.toLowerCase().endsWith('.json')
        ) {
            utils.showStatus(i18n.t('status.invalidFile'), 'error');
            return;
        }

        utils.showLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                geoProcessing.processGeoJSON(data);
                utils.showLoading(false);
            } catch (error) {
                utils.showLoading(false);
                utils.showStatus(
                    i18n.t('status.fileError').replace('{error}', error.message),
                    'error',
                );
                console.error(error);
            }
        };

        reader.onerror = () => {
            utils.showLoading(false);
            utils.showStatus(i18n.t('status.readError'), 'error');
        };

        reader.readAsText(file);
    }
}

export const fileModule = new FileModule();
