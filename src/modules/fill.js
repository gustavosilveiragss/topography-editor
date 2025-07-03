import { state } from './state.js';
import { i18n } from './i18n.js';
import { transformUtils } from './transformUtils.js';
import { geometryUtils } from './geometryUtils.js';
import { colorUtils } from './colorUtils.js';

class FillModule {
    constructor() {
        this.p = null;
        this.firstLine = null;
        this.currentOpacity = 0.5;
    }

    setP5Instance(p) {
        this.p = p;
    }

    toggleFillMode() {
        if (!state.contourLines.length) {
            alert(i18n.t('alerts.loadFileFirst'));
            return;
        }

        if (state.crop.mode) window.cropModule.toggleCropMode();
        if (state.delete.mode) window.deleteModule.toggleDeleteMode();
        if (state.lineWidth.mode) window.lineWidthModule.toggleLineWidthMode();

        state.fill.mode = !state.fill.mode;
        const btn = document.getElementById('fill-mode-btn');
        const controls = document.getElementById('fill-controls');

        if (state.fill.mode) {
            btn.classList.add('active');
            controls.style.display = 'block';
            this.updateStatus(i18n.t('status.fillSelectFirst'));
            this.clearSelection();
        } else {
            btn.classList.remove('active');
            controls.style.display = 'none';
            this.clearSelection();
            this.hideStatus();
        }

        window.redraw();
    }

    updateHoveredLine() {
        if (!state.fill.mode || !state.contourLines.length) return;

        const worldPos = transformUtils.screenToWorld(state.fill.mouseX, state.fill.mouseY, this.p);

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

                if (
                    this.firstLine &&
                    this.firstLine.elevIdx === elevIdx &&
                    this.firstLine.lineIdx === lineIdx
                ) {
                    continue;
                }

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

        state.fill.hoveredLine = closestLine;
    }

    handleClick() {
        if (!state.fill.hoveredLine) return;

        const { elevIdx, lineIdx } = state.fill.hoveredLine;

        if (!this.firstLine) {
            this.firstLine = { elevIdx, lineIdx };
            const elevation1 = state.contourLines[elevIdx].elevation;
            this.updateStatus(i18n.t('status.fillSelectSecond') + ` (${elevation1}m)`);
        } else {
            this.createFill(this.firstLine, { elevIdx, lineIdx });
            this.clearSelection();
        }

        window.redraw();
    }

    createFill(line1, line2) {
        const key = `${line1.elevIdx}-${line1.lineIdx}_${line2.elevIdx}-${line2.lineIdx}`;
        const reverseKey = `${line2.elevIdx}-${line2.lineIdx}_${line1.elevIdx}-${line1.lineIdx}`;

        const fillData = {
            line1: line1,
            line2: line2,
            opacity: this.currentOpacity,
        };

        delete state.fills[reverseKey];
        state.fills[key] = fillData;

        const elevation1 = state.contourLines[line1.elevIdx].elevation;
        const elevation2 = state.contourLines[line2.elevIdx].elevation;

        this.updateStatus(i18n.t('status.fillApplied') + ` (${elevation1}m ↔ ${elevation2}m)`);
    }

    updateOpacity() {
        const slider = document.getElementById('fill-opacity');
        const valueDisplay = document.getElementById('fill-opacity-value');

        this.currentOpacity = parseFloat(slider.value) / 100;
        valueDisplay.textContent = Math.round(this.currentOpacity * 100) + '%';
    }

    clearSelection() {
        this.firstLine = null;
        state.fill.hoveredLine = null;
        state.fill.selectedLines = [];
    }

    clearAllFills() {
        if (Object.keys(state.fills).length === 0) {
            alert(i18n.t('alerts.noFillsToDelete'));
            return;
        }

        if (confirm(i18n.t('alerts.confirmClearFills'))) {
            const fillCount = Object.keys(state.fills).length;
            state.fills = {};
            this.updateStatus(i18n.t('status.fillsCleared') + ` (${fillCount})`);
            window.redraw();
        }
    }

    drawFills(p) {
        if (!Object.keys(state.fills).length) return;

        for (const [key, fillData] of Object.entries(state.fills)) {
            const { line1, line2, opacity } = fillData;

            const lineString1 = state.contourLines[line1.elevIdx]?.lines[line1.lineIdx];
            const lineString2 = state.contourLines[line2.elevIdx]?.lines[line2.lineIdx];

            if (!lineString1 || !lineString2) continue;

            this.drawSolidFill(p, lineString1, lineString2, opacity, line1.elevIdx, line2.elevIdx);
        }
    }

    drawSolidFill(p, line1, line2, opacity, elev1Idx, elev2Idx) {
        if (line1.length < 2 || line2.length < 2) return;

        const avgElevation =
            (state.contourLines[elev1Idx].elevation + state.contourLines[elev2Idx].elevation) / 2;
        const fillColor = colorUtils.getElevationColor(avgElevation);

        p.push();
        p.fill(fillColor[0], fillColor[1], fillColor[2], opacity * 255);
        p.noStroke();

        p.beginShape();

        for (const point of line1) {
            p.vertex(point.x, point.y);
        }

        for (let i = line2.length - 1; i >= 0; i--) {
            p.vertex(line2[i].x, line2[i].y);
        }

        p.endShape(p.CLOSE);
        p.pop();
    }

    updateStatus(message) {
        const status = document.getElementById('fill-status');
        if (status) {
            status.textContent = message;
            status.style.display = 'block';
            status.className = 'status-message status-info';
        }
    }

    hideStatus() {
        const status = document.getElementById('fill-status');
        if (status) {
            status.style.display = 'none';
        }
    }
}

export const fillModule = new FillModule();
