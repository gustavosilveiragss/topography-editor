import { state } from './state.js';
import { i18n } from './i18n.js';
import { colorUtils } from './colorUtils.js';
import { smoothingUtils } from './smoothingUtils.js';

class DrawingModule {
    constructor() {
        this.colorCache = new Map();
        this.smoothCache = new Map();
    }

    draw(p) {
        p.background(255);

        if (!state.contourLines.length) {
            this.drawNoDataMessage(p);
            return;
        }

        p.push();
        p.translate(
            p.width / 2 + state.navigation.offsetX,
            p.height / 2 + state.navigation.offsetY,
        );
        p.rotate(p.radians(state.visual.rotation));
        p.scale(state.navigation.zoom);

        if (window.fillModule) {
            window.fillModule.drawFills(p);
        }
        this.drawContourLines(p);
        p.pop();

        this.drawRedPoints(p);
        this.setCursor(p);
    }

    drawNoDataMessage(p) {
        p.fill(128);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(i18n.t('canvas.noData').replace('\\n', '\n'), p.width / 2, p.height / 2);
    }

    drawContourLines(p) {
        p.noFill();
        const baseStrokeWeight = state.visual.lineWeight / state.navigation.zoom;

        for (
            let elevIdx = 0;
            elevIdx < state.contourLines.length;
            elevIdx += state.visual.density
        ) {
            const elevationGroup = state.contourLines[elevIdx];
            const elevation = elevationGroup.elevation;

            const colorCacheKey = `${elevation}_${state.visual.useElevationColors}`;
            let color = this.colorCache.get(colorCacheKey);
            if (!color) {
                color = colorUtils.getElevationColor(elevation);
                this.colorCache.set(colorCacheKey, color);
            }

            for (let lineIdx = 0; lineIdx < elevationGroup.lines.length; lineIdx++) {
                const lineString = elevationGroup.lines[lineIdx];
                if (lineString.length < 2) continue;

                const lineKey = `${elevIdx}-${lineIdx}`;
                const individualWeight = state.lineWidths[lineKey] || baseStrokeWeight;

                const isCropHovered =
                    state.crop.mode &&
                    elevIdx === state.crop.hoveredElevationIndex &&
                    lineIdx === state.crop.hoveredLineIndex;

                const isDeleteHovered =
                    state.delete.mode &&
                    elevIdx === state.delete.hoveredElevationIndex &&
                    lineIdx === state.delete.hoveredLineIndex;

                const isLineWidthHovered =
                    state.lineWidth.mode &&
                    state.lineWidth.hoveredLine &&
                    elevIdx === state.lineWidth.hoveredLine.elevIdx &&
                    lineIdx === state.lineWidth.hoveredLine.lineIdx;

                const isFillHovered =
                    state.fill.mode &&
                    state.fill.hoveredLine &&
                    elevIdx === state.fill.hoveredLine.elevIdx &&
                    lineIdx === state.fill.hoveredLine.lineIdx;

                const isFirstLineSelected =
                    state.fill.mode &&
                    window.fillModule &&
                    window.fillModule.firstLine &&
                    elevIdx === window.fillModule.firstLine.elevIdx &&
                    lineIdx === window.fillModule.firstLine.lineIdx;

                if (isCropHovered) {
                    p.stroke(255, 255, 0);
                    p.strokeWeight(individualWeight * 2);
                } else if (isDeleteHovered) {
                    p.stroke(255, 0, 0);
                    p.strokeWeight(individualWeight * 2);
                } else if (isLineWidthHovered) {
                    p.stroke(0, 255, 255);
                    p.strokeWeight(individualWeight * 1.5);
                } else if (isFillHovered) {
                    p.stroke(255, 0, 255);
                    p.strokeWeight(individualWeight * 1.5);
                } else if (isFirstLineSelected) {
                    p.stroke(0, 255, 0);
                    p.strokeWeight(individualWeight * 1.5);
                } else {
                    p.stroke(color[0], color[1], color[2]);
                    p.strokeWeight(individualWeight);
                }

                let finalPoints = lineString;
                if (state.visual.smoothness > 0) {
                    const cacheKey = `${elevation}_${state.visual.smoothness}_${lineString.length}`;
                    let smoothed = this.smoothCache.get(cacheKey);

                    if (!smoothed) {
                        smoothed = smoothingUtils.smoothLine(
                            lineString,
                            state.visual.smoothness,
                            p,
                        );
                        if (this.smoothCache.size > 1000) this.smoothCache.clear();
                        this.smoothCache.set(cacheKey, smoothed);
                    }
                    finalPoints = smoothed;
                }

                this.drawLine(p, finalPoints);
            }
        }
    }

    drawLine(p, points) {
        if (points.length < 2) return;

        p.beginShape();
        p.noFill();
        for (const point of points) {
            p.vertex(point.x, point.y);
        }
        p.endShape();
    }

    drawRedPoints(p) {
        if (!state.redPoints.length) return;

        p.push();
        p.translate(
            p.width / 2 + state.navigation.offsetX,
            p.height / 2 + state.navigation.offsetY,
        );
        p.rotate(p.radians(state.visual.rotation));
        p.scale(state.navigation.zoom);

        p.fill(255, 0, 0);
        p.noStroke();
        for (const point of state.redPoints) {
            if (point.screenX !== undefined && point.screenY !== undefined) {
                p.circle(point.screenX, point.screenY, point.size / state.navigation.zoom);
            }
        }

        p.pop();
    }

    setCursor(p) {
        if (state.crop.mode || state.delete.mode || state.lineWidth.mode || state.fill.mode) {
            p.cursor('crosshair');
        } else {
            p.cursor('default');
        }
    }
}

export const drawingModule = new DrawingModule();
