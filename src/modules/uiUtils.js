import { state } from './state.js';
import { i18n } from './i18n.js';

class UIUtils {
    constructor() {
        this.toolButtons = ['crop-mode-btn', 'delete-mode-btn', 'line-width-btn', 'fill-mode-btn'];
        this.exportButtons = ['save-png-btn', 'export-svg-btn'];
    }

    enableDataDependentButtons() {
        this.toolButtons.forEach((buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = false;
                button.classList.remove('disabled');
            }
        });

        this.exportButtons.forEach((buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = false;
                button.classList.remove('disabled');
            }
        });
    }

    disableDataDependentButtons() {
        this.toolButtons.forEach((buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true;
                button.classList.add('disabled');
            }
        });

        this.exportButtons.forEach((buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true;
                button.classList.add('disabled');
            }
        });
    }

    updateDataDependentControls() {
        this.updateElevationInfo();
        this.updatePointBounds();
    }

    updateElevationInfo() {
        const elevationInfo = document.getElementById('elevation-info');
        if (!elevationInfo) return;

        if (state.contourLines.length === 0) {
            elevationInfo.textContent = i18n.t('info.loadFileForInfo');
            return;
        }

        const { min, max } = state.elevationRange;
        const lineCount = state.contourLines.reduce(
            (total, group) => total + group.lines.length,
            0,
        );

        elevationInfo.innerHTML = `
            <div class="elevation-stats">
                <div>${i18n
                    .t('info.elevationRange')
                    .replace('{min}', min.toFixed(1))
                    .replace('{max}', max.toFixed(1))}</div>
                <div>${i18n.t('info.levels').replace('{count}', state.contourLines.length)}</div>
                <div>${i18n.t('info.lines').replace('{count}', lineCount)}</div>
            </div>
        `;
    }

    updatePointBounds() {
        if (state.bounds.minX === Infinity) return;

        const latInput = document.getElementById('point-lat');
        const lonInput = document.getElementById('point-lon');

        if (latInput) {
            latInput.placeholder = `Lat (${state.bounds.minY.toFixed(
                4,
            )} - ${state.bounds.maxY.toFixed(4)})`;
        }

        if (lonInput) {
            lonInput.placeholder = `Lon (${state.bounds.minX.toFixed(
                4,
            )} - ${state.bounds.maxX.toFixed(4)})`;
        }
    }

    resetUI() {
        this.disableDataDependentButtons();
        this.resetElevationInfo();
        this.resetControlModes();
    }

    resetElevationInfo() {
        const elevationInfo = document.getElementById('elevation-info');
        if (elevationInfo) {
            elevationInfo.textContent = i18n.t('info.loadGeoJSONForInfo');
        }
    }

    resetControlModes() {
        if (state.crop.mode && window.cropModule) {
            window.cropModule.toggleCropMode();
        }
        if (state.delete.mode && window.deleteModule) {
            window.deleteModule.toggleDeleteMode();
        }
        if (state.lineWidth.mode && window.lineWidthModule) {
            window.lineWidthModule.toggleLineWidthMode();
        }
        if (state.fill.mode && window.fillModule) {
            window.fillModule.toggleFillMode();
        }
    }

    setupControlEventListeners() {
        const fillOpacitySlider = document.getElementById('fill-opacity');
        const fillOpacityValue = document.getElementById('fill-opacity-value');

        if (fillOpacitySlider && fillOpacityValue) {
            fillOpacitySlider.addEventListener('input', (e) => {
                fillOpacityValue.textContent = e.target.value + '%';
                if (window.fillModule) {
                    window.fillModule.updateOpacityValue();
                }
            });
        }

        const fillGradientCheckbox = document.getElementById('fill-gradient');
        if (fillGradientCheckbox) {
            fillGradientCheckbox.addEventListener('change', () => {
                if (window.fillModule) {
                    window.fillModule.toggleGradient();
                }
            });
        }

        const lineWidthSlider = document.getElementById('individual-line-width');
        const lineWidthValue = document.getElementById('individual-width-value');

        if (lineWidthSlider && lineWidthValue) {
            lineWidthSlider.addEventListener('input', (e) => {
                lineWidthValue.textContent = parseFloat(e.target.value).toFixed(1);
            });
        }

        const widthGradientSlider = document.getElementById('width-gradient');
        const gradientValue = document.getElementById('gradient-value');

        if (widthGradientSlider && gradientValue) {
            widthGradientSlider.addEventListener('input', (e) => {
                gradientValue.textContent = parseFloat(e.target.value).toFixed(1);
            });
        }
    }

    showTemporaryStatus(message, type = 'info', duration = 3000) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `temporary-status status-${type}`;
        statusDiv.textContent = message;

        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${
                type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'
            };
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(statusDiv);

        setTimeout(() => {
            statusDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(statusDiv);
            }, 300);
        }, duration);
    }

    validateDataLoaded(action, errorMessage = null) {
        if (state.contourLines.length === 0) {
            this.showTemporaryStatus(errorMessage || i18n.t('errors.loadGeoJSONFirst'), 'error');
            return false;
        }
        return true;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'c':
                        e.preventDefault();
                        if (this.validateDataLoaded()) {
                            window.cropModule?.toggleCropMode();
                        }
                        break;
                    case 'd':
                        e.preventDefault();
                        if (this.validateDataLoaded()) {
                            window.deleteModule?.toggleDeleteMode();
                        }
                        break;
                    case 'w':
                        e.preventDefault();
                        if (this.validateDataLoaded()) {
                            window.lineWidthModule?.toggleLineWidthMode();
                        }
                        break;
                    case 'f':
                        e.preventDefault();
                        if (this.validateDataLoaded()) {
                            window.fillModule?.toggleFillMode();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.validateDataLoaded()) {
                            window.exportModule?.saveCanvas();
                        }
                        break;
                }
            }

            if (e.key === 'Escape') {
                if (state.crop.mode) window.cropModule?.toggleCropMode();
                if (state.delete.mode) window.deleteModule?.toggleDeleteMode();
                if (state.lineWidth.mode) window.lineWidthModule?.toggleLineWidthMode();
                if (state.fill.mode) window.fillModule?.toggleFillMode();
            }
        });
    }
}

export const uiUtils = new UIUtils();
