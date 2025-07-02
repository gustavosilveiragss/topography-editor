import { state } from './state.js';
import { i18n } from './i18n.js';
import { colorUtils } from './colorUtils.js';
import { smoothingUtils } from './smoothingUtils.js';
import { transformUtils } from './transformUtils.js';

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

                const isCropHovered =
                    state.crop.mode &&
                    elevIdx === state.crop.hoveredElevationIndex &&
                    lineIdx === state.crop.hoveredLineIndex;
                const isDeleteHovered =
                    state.delete.mode &&
                    elevIdx === state.delete.hoveredElevationIndex &&
                    lineIdx === state.delete.hoveredLineIndex;

                if (isCropHovered || isDeleteHovered) {
                    this.drawHoveredLine(
                        p,
                        color,
                        isCropHovered ? 'crop' : 'delete',
                        baseStrokeWeight,
                    );
                } else {
                    p.stroke(color[0], color[1], color[2]);
                    p.strokeWeight(baseStrokeWeight);
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

    drawHoveredLine(p, color, mode, baseWeight) {
        if (mode === 'crop') {
            p.stroke(255, 255, 0);
            p.strokeWeight(baseWeight * 2);
        } else {
            p.stroke(255, 0, 0);
            p.strokeWeight(baseWeight * 2);
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

        p.fill(255, 0, 0);
        p.noStroke();
        for (const point of state.redPoints) {
            const screenPos = transformUtils.geoToScreen(point.lat, point.lon, p);
            p.circle(screenPos.x, screenPos.y, point.size);
        }
    }

    setCursor(p) {
        p.cursor(state.crop.mode || state.delete.mode ? 'crosshair' : 'default');
    }
}

export const drawingModule = new DrawingModule();
