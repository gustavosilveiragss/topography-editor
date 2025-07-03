import { state } from './state.js';
import { i18n } from './i18n.js';
import { utils } from './utils.js';

class FileModule {
    constructor() {
        this.allowedFormats = ['geojson', 'json'];
    }

    setup() {
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }

    triggerFileInput() {
        document.getElementById('file-input')?.click();
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.validateFile(file)) {
            return;
        }

        utils.showLoading(true);
        utils.showStatus(i18n.t('status.processing'), 'info');

        try {
            const fileContent = await this.readFile(file);
            const geojsonData = JSON.parse(fileContent);

            this.validateGeoJSON(geojsonData);
            this.processGeoJSONData(geojsonData);

            const totalLines = this.getTotalLineCount();
            utils.showStatus(
                i18n
                    .t('status.fileLoaded')
                    .replace('{lines}', totalLines)
                    .replace('{levels}', state.contourLines.length),
                'success',
            );

            this.enableButtons();
            this.updateElevationInfo();

            if (window.redraw) {
                window.redraw();
            }
        } catch (error) {
            console.error(i18n.t('debug.fileProcessingError'), error);
            utils.showStatus(i18n.t('status.fileError').replace('{error}', error.message), 'error');
            this.resetState();
        } finally {
            utils.showLoading(false);
            event.target.value = '';
        }
    }

    validateFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        if (!this.allowedFormats.includes(extension)) {
            utils.showStatus(i18n.t('status.invalidFile'), 'error');
            return false;
        }

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            utils.showStatus(i18n.t('status.fileTooLarge'), 'error');
            return false;
        }

        return true;
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error(i18n.t('status.readError')));
            reader.readAsText(file);
        });
    }

    validateGeoJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error(i18n.t('status.invalidGeoJSON'));
        }

        if (data.type !== 'FeatureCollection' && data.type !== 'Feature') {
            throw new Error(i18n.t('status.invalidGeoJSON'));
        }

        const features = data.type === 'FeatureCollection' ? data.features : [data];

        if (!features || features.length === 0) {
            throw new Error(i18n.t('status.emptyGeoJSON'));
        }

        const hasLineStrings = features.some(
            (feature) =>
                feature.geometry &&
                (feature.geometry.type === 'LineString' ||
                    feature.geometry.type === 'MultiLineString'),
        );

        if (!hasLineStrings) {
            throw new Error(i18n.t('status.noGeometry'));
        }
    }

    processGeoJSONData(geojsonData) {
        this.resetState();

        const features =
            geojsonData.type === 'FeatureCollection' ? geojsonData.features : [geojsonData];

        for (const feature of features) {
            this.processFeature(feature);
        }

        this.finalizeProcessing();
    }

    resetState() {
        state.geojsonData = null;
        state.contourLines = [];
        state.bounds = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
        };
        state.elevationRange = { min: Infinity, max: -Infinity };
        state.redPoints = [];
        state.lineWidths = {};
        state.widthGradients = {};
        state.fills = {};
    }

    processFeature(feature) {
        if (!feature.geometry) return;

        const { geometry, properties } = feature;
        const elevation = this.extractElevation(properties);

        switch (geometry.type) {
            case 'LineString':
                this.processLineString(geometry.coordinates, elevation);
                break;
            case 'MultiLineString':
                for (const lineCoords of geometry.coordinates) {
                    this.processLineString(lineCoords, elevation);
                }
                break;
            case 'Point':
                this.processPoint(geometry.coordinates);
                break;
        }
    }

    extractElevation(properties) {
        if (!properties) return 0;

        const elevationKeys = [
            'elevation',
            'ELEVATION',
            'elev',
            'ELEV',
            'height',
            'HEIGHT',
            'z',
            'Z',
        ];

        for (const key of elevationKeys) {
            if (properties[key] !== undefined) {
                const value = parseFloat(properties[key]);
                return isNaN(value) ? 0 : value;
            }
        }

        return 0;
    }

    processLineString(coordinates, elevation) {
        if (coordinates.length < 2) return;

        const linePoints = coordinates.map((coord) => {
            const [lon, lat] = coord;

            state.bounds.minX = Math.min(state.bounds.minX, lon);
            state.bounds.maxX = Math.max(state.bounds.maxX, lon);
            state.bounds.minY = Math.min(state.bounds.minY, lat);
            state.bounds.maxY = Math.max(state.bounds.maxY, lat);

            return { x: lon, y: lat };
        });

        let elevationGroup = state.contourLines.find(
            (group) => Math.abs(group.elevation - elevation) < 0.001,
        );

        if (!elevationGroup) {
            elevationGroup = { elevation, lines: [] };
            state.contourLines.push(elevationGroup);

            state.elevationRange.min = Math.min(state.elevationRange.min, elevation);
            state.elevationRange.max = Math.max(state.elevationRange.max, elevation);
        }

        elevationGroup.lines.push(linePoints);
    }

    processPoint(coordinates) {
        const [lon, lat] = coordinates;
        state.redPoints.push({
            lat,
            lon,
            size: state.visual.pointSize,
        });
    }

    finalizeProcessing() {
        if (state.contourLines.length === 0) {
            throw new Error(i18n.t('status.noLinesProcessed'));
        }

        state.contourLines.sort((a, b) => a.elevation - b.elevation);
        this.calculateTransformation();
        this.transformCoordinates();

        state.geojsonData = {
            bounds: { ...state.bounds },
            elevationRange: { ...state.elevationRange },
            lineCount: this.getTotalLineCount(),
            elevationCount: state.contourLines.length,
        };
    }

    calculateTransformation() {
        if (state.bounds.minX === Infinity) return;

        const width = state.bounds.maxX - state.bounds.minX;
        const height = state.bounds.maxY - state.bounds.minY;

        if (width === 0 || height === 0) {
            return;
        }

        const padding = 50;
        const canvasWidth = state.canvas.width - 2 * padding;
        const canvasHeight = state.canvas.height - 2 * padding;

        const scaleX = canvasWidth / width;
        const scaleY = canvasHeight / height;
        const scale = Math.min(scaleX, scaleY);

        state.coordinateScale = scale;
        state.coordinateOffsetX = -canvasWidth / 2;
        state.coordinateOffsetY = canvasHeight / 2;
    }

    transformCoordinates() {
        const centerX = (state.bounds.minX + state.bounds.maxX) / 2;
        const centerY = (state.bounds.minY + state.bounds.maxY) / 2;

        for (const elevationGroup of state.contourLines) {
            for (const line of elevationGroup.lines) {
                for (const point of line) {
                    point.x = (point.x - centerX) * state.coordinateScale;
                    point.y = -(point.y - centerY) * state.coordinateScale;
                }
            }
        }

        for (const point of state.redPoints) {
            const transformedX = (point.lon - centerX) * state.coordinateScale;
            const transformedY = -(point.lat - centerY) * state.coordinateScale;
            point.screenX = transformedX;
            point.screenY = transformedY;
        }
    }

    getTotalLineCount() {
        return state.contourLines.reduce((total, group) => total + group.lines.length, 0);
    }

    enableButtons() {
        const buttonIds = [
            'crop-mode-btn',
            'delete-mode-btn',
            'line-width-btn',
            'fill-mode-btn',
            'save-png-btn',
            'export-svg-btn',
        ];

        buttonIds.forEach((buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = false;
            }
        });
    }

    updateElevationInfo() {
        const elevationInfo = document.getElementById('elevation-info');
        if (!elevationInfo) return;

        if (state.contourLines.length === 0) {
            elevationInfo.textContent = i18n.t('controls.colors.loadFile');
            return;
        }

        const { min, max } = state.elevationRange;
        const range = max - min;

        elevationInfo.innerHTML =
            i18n
                .t('status.elevation')
                .replace('{min}', min.toFixed(1))
                .replace('{max}', max.toFixed(1)) +
            '<br>' +
            i18n.t('status.variation').replace('{range}', range.toFixed(1));
    }
}

export const fileModule = new FileModule();
