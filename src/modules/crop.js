import { state } from './state.js';
import { i18n } from './i18n.js';
import { transformUtils } from './transformUtils.js';
import { geometryUtils } from './geometryUtils.js';
import { smoothingUtils } from './smoothingUtils.js';

class CropModule {
    constructor() {
        this.p = null;
        this.spatialIndex = new Map();
        this.lastMouseUpdate = 0;
        this.mouseUpdateThrottle = 16;
        this.hoveredLineCache = { x: -1, y: -1, result: null };
    }

    setP5Instance(p) {
        this.p = p;
    }

    buildSpatialIndex() {
        this.spatialIndex.clear();
        const cellSize = 50 / state.navigation.zoom;

        for (let elevIdx = 0; elevIdx < state.contourLines.length; elevIdx++) {
            if (elevIdx % state.visual.density !== 0) continue;

            const elevationGroup = state.contourLines[elevIdx];

            for (let lineIdx = 0; lineIdx < elevationGroup.lines.length; lineIdx++) {
                const lineString = elevationGroup.lines[lineIdx];
                if (lineString.length < 2) continue;

                let minX = Infinity,
                    maxX = -Infinity,
                    minY = Infinity,
                    maxY = -Infinity;
                for (const point of lineString) {
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minY = Math.min(minY, point.y);
                    maxY = Math.max(maxY, point.y);
                }

                const startCellX = Math.floor(minX / cellSize);
                const endCellX = Math.floor(maxX / cellSize);
                const startCellY = Math.floor(minY / cellSize);
                const endCellY = Math.floor(maxY / cellSize);

                for (let cx = startCellX; cx <= endCellX; cx++) {
                    for (let cy = startCellY; cy <= endCellY; cy++) {
                        const key = `${cx},${cy}`;
                        if (!this.spatialIndex.has(key)) {
                            this.spatialIndex.set(key, []);
                        }
                        this.spatialIndex.get(key).push({ elevIdx, lineIdx, lineString });
                    }
                }
            }
        }
    }

    toggleCropMode() {
        if (!state.contourLines.length) {
            alert(i18n.t('alerts.loadFileFirst'));
            return;
        }

        if (state.delete.mode) {
            window.delete.toggleDeleteMode();
        }

        state.crop.mode = !state.crop.mode;
        const btn = document.getElementById('crop-mode-btn');
        const status = document.getElementById('crop-status');

        if (state.crop.mode) {
            btn.innerHTML =
                '<i data-lucide="scissors"></i><span data-i18n="controls.tools.cropDeactivate">' +
                i18n.t('controls.tools.cropDeactivate') +
                '</span>';
            btn.classList.add('crop-active');
            status.style.display = 'block';
            status.className = 'crop-status status-info';
            status.textContent = i18n.t('status.cropActive');
            this.buildSpatialIndex();
        } else {
            btn.innerHTML =
                '<i data-lucide="scissors"></i><span data-i18n="controls.tools.cropActivate">' +
                i18n.t('controls.tools.cropActivate') +
                '</span>';
            btn.classList.remove('crop-active');
            status.style.display = 'none';
        }

        state.crop.hoveredLineIndex = -1;
        state.crop.hoveredElevationIndex = -1;
        lucide.createIcons();
        window.redraw();
    }

    updateHoveredLine() {
        if (!state.crop.mode || !state.contourLines.length) return;

        const now = performance.now();
        if (now - this.lastMouseUpdate < this.mouseUpdateThrottle) return;
        this.lastMouseUpdate = now;

        const cacheKey = `${Math.floor(state.crop.mouseCanvasX / 10)},${Math.floor(
            state.crop.mouseCanvasY / 10,
        )}`;
        if (this.hoveredLineCache.key === cacheKey && this.hoveredLineCache.result) {
            const { lineIndex, elevationIndex } = this.hoveredLineCache.result;
            state.crop.hoveredLineIndex = lineIndex;
            state.crop.hoveredElevationIndex = elevationIndex;
            return;
        }

        const worldPos = transformUtils.screenToWorld(
            state.crop.mouseCanvasX,
            state.crop.mouseCanvasY,
            this.p,
        );
        const cellSize = 50 / state.navigation.zoom;
        const cellX = Math.floor(worldPos.x / cellSize);
        const cellY = Math.floor(worldPos.y / cellSize);

        let minDistance = Infinity;
        let closestLineIndex = -1;
        let closestElevationIndex = -1;
        const threshold = 15 / state.navigation.zoom;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                const lines = this.spatialIndex.get(key);
                if (!lines) continue;

                for (const { elevIdx, lineIdx, lineString } of lines) {
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

                        if (distance < minDistance && distance < threshold) {
                            minDistance = distance;
                            closestLineIndex = lineIdx;
                            closestElevationIndex = elevIdx;

                            if (distance < threshold * 0.1) {
                                break;
                            }
                        }
                    }
                }
            }
        }

        state.crop.hoveredLineIndex = minDistance < threshold ? closestLineIndex : -1;
        state.crop.hoveredElevationIndex = minDistance < threshold ? closestElevationIndex : -1;

        this.hoveredLineCache = {
            key: cacheKey,
            result:
                minDistance < threshold
                    ? { lineIndex: closestLineIndex, elevationIndex: closestElevationIndex }
                    : null,
        };
    }

    handleCropClick(e) {
        if (state.crop.hoveredLineIndex === -1 || state.crop.hoveredElevationIndex === -1) return;

        const selectedElevationGroup = state.contourLines[state.crop.hoveredElevationIndex];
        const selectedLine = selectedElevationGroup.lines[state.crop.hoveredLineIndex];

        if (selectedLine.length < 3) {
            alert(i18n.t('alerts.lineTooSmall'));
            return;
        }

        const confirmMessage = i18n
            .t('alerts.confirmCrop')
            .replace('{elevation}', selectedElevationGroup.elevation);
        if (!confirm(confirmMessage)) return;

        this.performCrop(selectedLine);
    }

    performCrop(maskLine) {
        const status = document.getElementById('crop-status');
        status.className = 'crop-status status-info';
        status.textContent = i18n.t('status.cropProcessing');

        let originalCount = 0;
        let keptCount = 0;

        state.contourLines.forEach((group) => (originalCount += group.lines.length));

        const batchSize = 100;
        const processInBatches = () => {
            for (const elevationGroup of state.contourLines) {
                const newLines = [];

                for (let i = 0; i < elevationGroup.lines.length; i += batchSize) {
                    const batch = elevationGroup.lines.slice(i, i + batchSize);
                    for (const line of batch) {
                        if (this.shouldKeepLine(line, maskLine)) {
                            newLines.push(line);
                            keptCount++;
                        }
                    }
                }

                elevationGroup.lines = newLines;
            }
        };

        requestAnimationFrame(() => {
            processInBatches();
            state.contourLines = state.contourLines.filter((group) => group.lines.length > 0);
            this.toggleCropMode();
            window.redraw();

            status.className = 'crop-status status-success';
            status.style.display = 'block';
            status.textContent = i18n
                .t('status.cropSuccess')
                .replace('{kept}', keptCount)
                .replace('{original}', originalCount);

            setTimeout(() => (status.style.display = 'none'), 5000);
        });
    }

    shouldKeepLine(line, maskLine) {
        for (const point of line) {
            if (geometryUtils.pointInPolygon(point, maskLine)) return true;
        }

        for (let i = 0; i < line.length - 1; i++) {
            const p1 = line[i];
            const p2 = line[i + 1];

            for (let j = 0; j < maskLine.length - 1; j++) {
                const m1 = maskLine[j];
                const m2 = maskLine[j + 1];

                if (geometryUtils.lineSegmentsIntersect(p1, p2, m1, m2)) return true;
            }
        }

        return false;
    }
}

export const cropModule = new CropModule();
