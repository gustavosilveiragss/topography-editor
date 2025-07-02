import { state } from './state.js';
import { p5Utils } from './p5Utils.js';

class TransformUtils {
    constructor() {
        this.cosCache = new Map();
        this.sinCache = new Map();
    }

    geoToScreen(lat, lon, p) {
        const x = (lon - state.bounds.minX) * state.coordinateScale + state.coordinateOffsetX;
        const y = -(lat - state.bounds.minY) * state.coordinateScale + state.coordinateOffsetY;
        return this.applyTransformations(x, y, p);
    }

    applyTransformations(x, y, p) {
        const rotation = state.visual.rotation;

        let cos_r = this.cosCache.get(rotation);
        let sin_r = this.sinCache.get(rotation);

        if (cos_r === undefined) {
            const rad = p5Utils.radians(rotation);
            cos_r = Math.cos(rad);
            sin_r = Math.sin(rad);

            if (this.cosCache.size > 100) {
                this.cosCache.clear();
                this.sinCache.clear();
            }

            this.cosCache.set(rotation, cos_r);
            this.sinCache.set(rotation, sin_r);
        }

        const rotX = x * cos_r - y * sin_r;
        const rotY = x * sin_r + y * cos_r;

        return {
            x: rotX * state.navigation.zoom + p.width / 2 + state.navigation.offsetX,
            y: rotY * state.navigation.zoom + p.height / 2 + state.navigation.offsetY,
        };
    }

    screenToWorld(screenX, screenY, p) {
        const centeredX = screenX - p.width / 2 - state.navigation.offsetX;
        const centeredY = screenY - p.height / 2 - state.navigation.offsetY;

        const scaledX = centeredX / state.navigation.zoom;
        const scaledY = centeredY / state.navigation.zoom;

        const rotation = -state.visual.rotation;
        const rad = p5Utils.radians(rotation);
        const cos_r = Math.cos(rad);
        const sin_r = Math.sin(rad);

        return {
            x: scaledX * cos_r - scaledY * sin_r,
            y: scaledX * sin_r + scaledY * cos_r,
        };
    }
}

export const transformUtils = new TransformUtils();
