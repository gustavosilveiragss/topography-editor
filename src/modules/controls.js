import { state } from './state.js';
import { i18n } from './i18n.js';

class ControlsModule {
    setup() {
        this.initializeToolControls();
        this.setupColorControls();
        this.setupSliders();
    }

    initializeToolControls() {
        const toolControls = ['line-width-controls', 'fill-controls'];

        const toolStatus = ['crop-status', 'delete-status', 'line-width-status', 'fill-status'];

        toolControls.forEach((controlId) => {
            const element = document.getElementById(controlId);
            if (element) {
                element.style.display = 'none';
            }
        });

        toolStatus.forEach((statusId) => {
            const element = document.getElementById(statusId);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    setupColorControls() {
        const elevationColorsCheckbox = document.getElementById('elevation-colors');
        if (elevationColorsCheckbox) {
            elevationColorsCheckbox.addEventListener('change', (e) => {
                state.visual.useElevationColors = e.target.checked;
                if (window.redraw) {
                    window.redraw();
                }
            });
        }
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
