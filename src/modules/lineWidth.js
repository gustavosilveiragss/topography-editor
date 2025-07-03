import { state } from './state.js';
import { i18n } from './i18n.js';
import { transformUtils } from './transformUtils.js';
import { geometryUtils } from './geometryUtils.js';

class LineWidthModule {
    constructor() {
        this.p = null;
        this.currentWidth = 2.0;
    }

    setP5Instance(p) {
        this.p = p;
    }

    toggleLineWidthMode() {
        if (!state.contourLines.length) {
            alert(i18n.t('alerts.loadFileFirst'));
            return;
        }

        if (state.crop.mode) window.cropModule.toggleCropMode();
        if (state.delete.mode) window.deleteModule.toggleDeleteMode();
        if (state.fill.mode) window.fillModule.toggleFillMode();

        state.lineWidth.mode = !state.lineWidth.mode;
        const btn = document.getElementById('line-width-btn');
        const controls = document.getElementById('line-width-controls');

        if (state.lineWidth.mode) {
            btn.classList.add('active');
            controls.style.display = 'block';
            this.updateStatus(i18n.t('status.lineWidthActive'));
        } else {
            btn.classList.remove('active');
            controls.style.display = 'none';
            this.clearSelection();
            this.hideStatus();
        }

        window.redraw();
    }

    updateHoveredLine() {
        if (!state.lineWidth.mode || !state.contourLines.length) return;

        const worldPos = transformUtils.screenToWorld(
            state.lineWidth.mouseX,
            state.lineWidth.mouseY,
            this.p,
        );

        let minDistance = Infinity;
        let closestLine = null;
        const threshold = 20 / state.navigation.zoom;

        for (
            let elevIdx = 0;
            elevIdx < state.contourLines.length;
            elevIdx += state.visual.density
        ) {
            const elevationGroup = state.contourLines[elevIdx];

            for (let lineIdx = 0; lineIdx < elevationGroup.lines.length; lineIdx++) {
                const lineString = elevationGroup.lines[lineIdx];
                if (lineString.length < 2) continue;

                for (let i = 0; i < lineString.length - 1; i++) {
                    const distance = geometryUtils.distanceToLineSegment(
                        worldPos.x,
                        worldPos.y,
                        lineString[i].x,
                        lineString[i].y,
                        lineString[i + 1].x,
                        lineString[i + 1].y,
                    );

                    if (distance < minDistance && distance < threshold) {
                        minDistance = distance;
                        closestLine = { elevIdx, lineIdx };
                    }
                }
            }
        }

        state.lineWidth.hoveredLine = closestLine;
    }

    handleClick() {
        if (!state.lineWidth.hoveredLine) return;

        const { elevIdx, lineIdx } = state.lineWidth.hoveredLine;
        const lineKey = `${elevIdx}-${lineIdx}`;

        state.lineWidths[lineKey] = this.currentWidth;

        this.updateStatus(i18n.t('status.widthApplied'));
        window.redraw();
    }

    updateWidth() {
        const slider = document.getElementById('line-width-slider');
        const valueDisplay = document.getElementById('line-width-value');

        this.currentWidth = parseFloat(slider.value);
        valueDisplay.textContent = this.currentWidth.toFixed(1);
    }

    clearAllWidths() {
        if (confirm(i18n.t('alerts.confirmClearWidths'))) {
            state.lineWidths = {};
            this.updateStatus(i18n.t('status.widthsCleared'));
            window.redraw();
        }
    }

    clearSelection() {
        state.lineWidth.hoveredLine = null;
    }

    updateStatus(message) {
        const status = document.getElementById('line-width-status');
        if (status) {
            status.textContent = message;
            status.style.display = 'block';
            status.className = 'status-message status-info';
        }
    }

    hideStatus() {
        const status = document.getElementById('line-width-status');
        if (status) {
            status.style.display = 'none';
        }
    }
}

export const lineWidthModule = new LineWidthModule();
