import { state } from './state.js';
import { i18n } from './i18n.js';
import { transformUtils } from './transformUtils.js';
import { geometryUtils } from './geometryUtils.js';
import { smoothingUtils } from './smoothingUtils.js';

class DeleteModule {
    constructor() {
        this.p = null;
        this.lastMouseUpdate = 0;
        this.mouseUpdateThrottle = 16;
    }

    setP5Instance(p) {
        this.p = p;
    }

    toggleDeleteMode() {
        if (!state.contourLines.length) {
            alert(i18n.t('alerts.loadFileFirst'));
            return;
        }

        if (state.crop.mode) {
            window.cropModule.toggleCropMode();
        }

        state.delete.mode = !state.delete.mode;
        const btn = document.getElementById('delete-mode-btn');
        const status = document.getElementById('delete-status');

        if (state.delete.mode) {
            btn.innerHTML =
                '<i data-lucide="trash-2"></i><span data-i18n="controls.tools.deleteDeactivate">' +
                i18n.t('controls.tools.deleteDeactivate') +
                '</span>';
            btn.classList.add('delete-active');
            status.style.display = 'block';
            status.className = 'delete-status status-info';
            status.textContent = i18n.t('status.deleteActive');
        } else {
            btn.innerHTML =
                '<i data-lucide="trash-2"></i><span data-i18n="controls.tools.deleteActivate">' +
                i18n.t('controls.tools.deleteActivate') +
                '</span>';
            btn.classList.remove('delete-active');
            status.style.display = 'none';
        }

        state.delete.hoveredLineIndex = -1;
        state.delete.hoveredElevationIndex = -1;
        lucide.createIcons();
        window.redraw();
    }

    updateHoveredLine() {
        if (!state.delete.mode || !state.contourLines.length) return;

        const now = performance.now();
        if (now - this.lastMouseUpdate < this.mouseUpdateThrottle) return;
        this.lastMouseUpdate = now;

        let minDistance = Infinity;
        let closestLineIndex = -1;
        let closestElevationIndex = -1;
        const threshold = 15 / state.navigation.zoom;

        const worldPos = transformUtils.screenToWorld(
            state.delete.mouseCanvasX,
            state.delete.mouseCanvasY,
            this.p,
        );

        for (
            let elevIdx = 0;
            elevIdx < state.contourLines.length;
            elevIdx += state.visual.density
        ) {
            const elevationGroup = state.contourLines[elevIdx];

            for (let lineIdx = 0; lineIdx < elevationGroup.lines.length; lineIdx++) {
                const lineString = elevationGroup.lines[lineIdx];
                if (lineString.length < 2) continue;

                const processedLine =
                    state.visual.smoothness > 0
                        ? smoothingUtils.smoothLine(lineString, state.visual.smoothness, this.p)
                        : lineString;

                for (let i = 0; i < processedLine.length - 1; i++) {
                    const p1 = processedLine[i];
                    const p2 = processedLine[i + 1];

                    const distance = geometryUtils.distanceToLineSegment(
                        worldPos.x,
                        worldPos.y,
                        p1.x,
                        p1.y,
                        p2.x,
                        p2.y,
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestLineIndex = lineIdx;
                        closestElevationIndex = elevIdx;

                        if (distance < threshold * 0.1) break;
                    }
                }
                if (minDistance < threshold * 0.1) break;
            }
            if (minDistance < threshold * 0.1) break;
        }

        state.delete.hoveredLineIndex = minDistance < threshold ? closestLineIndex : -1;
        state.delete.hoveredElevationIndex = minDistance < threshold ? closestElevationIndex : -1;
    }

    handleDeleteClick(e) {
        if (state.delete.hoveredLineIndex === -1 || state.delete.hoveredElevationIndex === -1)
            return;

        const selectedElevationGroup = state.contourLines[state.delete.hoveredElevationIndex];
        const confirmMessage = i18n
            .t('alerts.confirmDelete')
            .replace('{elevation}', selectedElevationGroup.elevation);

        if (!confirm(confirmMessage)) return;
        this.performDelete();
    }

    performDelete() {
        const status = document.getElementById('delete-status');
        status.className = 'delete-status status-info';
        status.textContent = i18n.t('status.deleteProcessing');

        const elevationGroup = state.contourLines[state.delete.hoveredElevationIndex];
        elevationGroup.lines.splice(state.delete.hoveredLineIndex, 1);

        if (!elevationGroup.lines.length) {
            state.contourLines.splice(state.delete.hoveredElevationIndex, 1);
        }

        state.delete.hoveredLineIndex = -1;
        state.delete.hoveredElevationIndex = -1;

        window.redraw();

        status.className = 'delete-status status-success';
        status.style.display = 'block';
        status.textContent = i18n.t('status.deleteSuccess');

        setTimeout(() => {
            if (!state.delete.mode) status.style.display = 'none';
        }, 3000);
    }
}

export const deleteModule = new DeleteModule();
