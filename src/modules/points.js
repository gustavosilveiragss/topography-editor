import { state } from './state.js';
import { i18n } from './i18n.js';
import { transformUtils } from './transformUtils.js';

class PointsModule {
    constructor() {
        this.p5Instance = null;
    }

    setP5Instance(p) {
        this.p5Instance = p;
    }
    addPoint() {
        const lat = parseFloat(document.getElementById('point-lat').value);
        const lon = parseFloat(document.getElementById('point-lon').value);

        if (!this.validateCoordinates(lat, lon)) return;
        if (!this.validateBounds(lat, lon)) return;

        const point = { lat, lon, size: state.visual.pointSize };
        
        if (this.p5Instance) {
            const centerX = (state.bounds.minX + state.bounds.maxX) / 2;
            const centerY = (state.bounds.minY + state.bounds.maxY) / 2;
            
            point.screenX = (lon - centerX) * state.coordinateScale;
            point.screenY = -(lat - centerY) * state.coordinateScale;
        }
        
        state.redPoints.push(point);
        this.updatePointList();
        redraw();

        this.clearInputs();
    }

    validateCoordinates(lat, lon) {
        if (isNaN(lat) || isNaN(lon)) {
            alert(i18n.t('alerts.invalidCoordinates'));
            return false;
        }
        return true;
    }

    validateBounds(lat, lon) {
        if (state.bounds.minX === Infinity) {
            alert(i18n.t('alerts.loadFileFirst'));
            return false;
        }

        const { minY, maxY, minX, maxX } = state.bounds;

        if (lat < minY || lat > maxY || lon < minX || lon > maxX) {
            const message = i18n
                .t('alerts.coordinatesOutOfBounds')
                .replace('{minLat}', minY.toFixed(4))
                .replace('{maxLat}', maxY.toFixed(4))
                .replace('{minLon}', minX.toFixed(4))
                .replace('{maxLon}', maxX.toFixed(4));
            alert(message);
            return false;
        }

        return true;
    }

    clearInputs() {
        document.getElementById('point-lat').value = '';
        document.getElementById('point-lon').value = '';
    }

    clearPoints() {
        state.redPoints = [];
        this.updatePointList();
        redraw();
    }

    updatePointList() {
        const list = document.getElementById('point-list');

        if (!state.redPoints.length) {
            list.innerHTML = i18n.t('controls.markers.noPoints');
            return;
        }

        list.innerHTML = state.redPoints
            .map(
                (p, i) =>
                    `${i18n.t('controls.markers.point')} ${i + 1}: (${p.lat.toFixed(
                        4,
                    )}, ${p.lon.toFixed(4)})`,
            )
            .join('<br>');
    }
}

export const pointsModule = new PointsModule();
