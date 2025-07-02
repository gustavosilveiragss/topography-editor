import { state } from './state.js';
import { i18n } from './i18n.js';
import { utils } from './utils.js';

class GeoProcessing {
    processGeoJSON(data) {
        if (!data || data.type !== 'FeatureCollection' || !data.features) {
            throw new Error(i18n.t('status.invalidGeoJSON'));
        }

        if (!data.features.length) {
            throw new Error(i18n.t('status.emptyGeoJSON'));
        }

        this.initializeState();

        const elevationGroups = new Map();
        let processedFeatures = 0;

        for (const feature of data.features) {
            if (!feature.geometry?.coordinates) continue;

            const elevation = parseFloat(feature.properties?.elevation ?? 0);

            state.elevationRange.min = Math.min(state.elevationRange.min, elevation);
            state.elevationRange.max = Math.max(state.elevationRange.max, elevation);

            if (!elevationGroups.has(elevation)) {
                elevationGroups.set(elevation, []);
            }

            const group = elevationGroups.get(elevation);

            if (feature.geometry.type === 'MultiLineString') {
                for (const lineString of feature.geometry.coordinates) {
                    const processedLine = this.processLineString(lineString);
                    if (processedLine.length > 1) group.push(processedLine);
                }
                processedFeatures++;
            } else if (feature.geometry.type === 'LineString') {
                const processedLine = this.processLineString(feature.geometry.coordinates);
                if (processedLine.length > 1) {
                    group.push(processedLine);
                    processedFeatures++;
                }
            }
        }

        this.validateProcessing(processedFeatures);

        const elevations = Array.from(elevationGroups.keys()).sort((a, b) => a - b);
        this.convertCoordinates(elevationGroups, elevations);
        this.updateElevationInfo();
        this.enableExportButtons();

        redraw();
    }

    initializeState() {
        Object.assign(state, {
            contourLines: [],
            bounds: { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
            elevationRange: { min: Infinity, max: -Infinity },
        });
    }

    processLineString(coordinates) {
        const processedLine = [];

        for (const coord of coordinates) {
            if (coord.length < 2) continue;

            const [x, y] = coord;
            const bounds = state.bounds;

            bounds.minX = Math.min(bounds.minX, x);
            bounds.maxX = Math.max(bounds.maxX, x);
            bounds.minY = Math.min(bounds.minY, y);
            bounds.maxY = Math.max(bounds.maxY, y);

            processedLine.push({ x, y });
        }

        return processedLine;
    }

    validateProcessing(processedFeatures) {
        if (!processedFeatures) {
            throw new Error(i18n.t('status.noGeometry'));
        }

        if (state.bounds.minX === Infinity) {
            throw new Error(i18n.t('status.noCoordinates'));
        }
    }

    convertCoordinates(elevationGroups, elevations) {
        const padding = 50;
        const rangeX = state.bounds.maxX - state.bounds.minX;
        const rangeY = state.bounds.maxY - state.bounds.minY;

        if (!rangeX || !rangeY) {
            throw new Error(i18n.t('status.invalidDimensions'));
        }

        const aspectRatio = rangeX / rangeY;
        const canvasWidth = state.canvas.width - 2 * padding;
        const canvasHeight = state.canvas.height - 2 * padding;

        const scale =
            aspectRatio > canvasWidth / canvasHeight ? canvasWidth / rangeX : canvasHeight / rangeY;

        Object.assign(state, {
            coordinateScale: scale,
            coordinateOffsetX: -canvasWidth / 2,
            coordinateOffsetY: canvasHeight / 2,
            contourLines: [],
        });

        const halfCanvasWidth = canvasWidth / 2;
        const halfCanvasHeight = canvasHeight / 2;

        for (const elevation of elevations) {
            const convertedLines = [];

            for (const line of elevationGroups.get(elevation)) {
                const convertedLine = line.map((p) => ({
                    x: (p.x - state.bounds.minX) * scale - halfCanvasWidth,
                    y: -(p.y - state.bounds.minY) * scale + halfCanvasHeight,
                }));
                convertedLines.push(convertedLine);
            }

            state.contourLines.push({ elevation, lines: convertedLines });
        }
    }

    updateElevationInfo() {
        const infoDiv = document.getElementById('elevation-info');

        if (state.elevationRange.min === Infinity) {
            infoDiv.innerHTML = i18n.t('controls.colors.loadFile');
            return;
        }

        const min = state.elevationRange.min.toFixed(1);
        const max = state.elevationRange.max.toFixed(1);
        const range = (state.elevationRange.max - state.elevationRange.min).toFixed(1);

        infoDiv.innerHTML =
            i18n.t('status.elevation').replace('{min}', min).replace('{max}', max) +
            '<br>' +
            i18n.t('status.variation').replace('{range}', range);
    }

    enableExportButtons() {
        const buttons = ['save-png-btn', 'export-svg-btn', 'crop-mode-btn', 'delete-mode-btn'];
        buttons.forEach((id) => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    }
}

export const geoProcessing = new GeoProcessing();
