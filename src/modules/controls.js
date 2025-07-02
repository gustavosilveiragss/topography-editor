import { state } from './state.js';
import { i18n } from './i18n.js';

class ControlsModule {
    setup() {
        this.setupElevationCheckbox();
        this.setupSliders();
    }

    setupElevationCheckbox() {
        const elevationCheckbox = document.getElementById('elevation-colors');
        const checkboxVisual = elevationCheckbox.nextElementSibling;
        const checkboxContainer = elevationCheckbox.closest('.checkbox-container');

        if (elevationCheckbox.checked) {
            checkboxVisual.classList.add('checked');
        }

        checkboxContainer.addEventListener('click', (e) => {
            if (e.target !== elevationCheckbox) {
                elevationCheckbox.click();
            }
        });

        elevationCheckbox.addEventListener('change', (e) => {
            state.visual.useElevationColors = e.target.checked;
            checkboxVisual.classList.toggle('checked', e.target.checked);
            window.redraw();
        });
    }

    setupSliders() {
        const sliders = [
            {
                id: 'rotation',
                property: 'rotation',
                valueId: 'rotation-value',
                transform: (val) => val,
                suffix: '°',
            },
            {
                id: 'line-weight',
                property: 'lineWeight',
                valueId: 'line-weight-value',
                transform: parseFloat,
            },
            {
                id: 'smoothness',
                property: 'smoothness',
                valueId: 'smoothness-value',
                transform: parseInt,
            },
            {
                id: 'density',
                property: 'density',
                valueId: 'density-value',
                transform: parseInt,
                customText: (val) =>
                    val === 1
                        ? i18n.t('controls.appearance.densityAll')
                        : `${i18n.t('controls.appearance.densityEvery')} ${val}`,
            },
            {
                id: 'point-size',
                property: 'pointSize',
                valueId: 'point-size-value',
                transform: parseInt,
            },
        ];

        sliders.forEach(({ id, property, valueId, transform, suffix = '', customText }) => {
            document.getElementById(id).addEventListener('input', (e) => {
                const value = transform(e.target.value);
                state.visual[property] = value;

                const displayText = customText ? customText(value) : value + suffix;
                document.getElementById(valueId).textContent = displayText;

                window.redraw();
            });
        });
    }
}

export const controlsModule = new ControlsModule();
