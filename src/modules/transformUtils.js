import { state } from './state.js';
import { p5Utils } from './p5Utils.js';

class TransformUtils {
    constructor() {
        this.cosCache = new Map();
        this.sinCache = new Map();
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

    worldToScreen(worldX, worldY, p) {
        const rotation = state.visual.rotation;
        const rad = p5Utils.radians(rotation);

        let cos_r = this.cosCache.get(rotation);
        let sin_r = this.sinCache.get(rotation);

        if (cos_r === undefined) {
            cos_r = Math.cos(rad);
            sin_r = Math.sin(rad);

            if (this.cosCache.size > 100) {
                this.cosCache.clear();
                this.sinCache.clear();
            }

            this.cosCache.set(rotation, cos_r);
            this.sinCache.set(rotation, sin_r);
        }

        const rotX = worldX * cos_r - worldY * sin_r;
        const rotY = worldX * sin_r + worldY * cos_r;

        return {
            x: rotX * state.navigation.zoom + p.width / 2 + state.navigation.offsetX,
            y: rotY * state.navigation.zoom + p.height / 2 + state.navigation.offsetY,
        };
    }

    geoToScreen(lat, lon, p) {
        if (state.bounds.minX === Infinity) {
            return { x: 0, y: 0 };
        }

        const centerX = (state.bounds.minX + state.bounds.maxX) / 2;
        const centerY = (state.bounds.minY + state.bounds.maxY) / 2;

        const worldX = (lon - centerX) * state.coordinateScale;
        const worldY = -(lat - centerY) * state.coordinateScale;

        return this.worldToScreen(worldX, worldY, p);
    }
}

export const transformUtils = new TransformUtils();
