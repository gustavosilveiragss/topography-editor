import { state } from './state.js';

class ColorUtils {
    constructor() {
        this.colorCache = new Map();
        this.colorRanges = [
            { threshold: 0.2, from: [51, 153, 204], to: [51, 170, 204] },
            { threshold: 0.4, from: [51, 170, 204], to: [68, 187, 68] },
            { threshold: 0.6, from: [68, 187, 68], to: [204, 204, 68] },
            { threshold: 0.8, from: [204, 204, 68], to: [204, 136, 68] },
            { threshold: 1.0, from: [204, 136, 68], to: [204, 68, 68] },
        ];
    }

    getElevationColor(elevation) {
        if (!state.visual.useElevationColors || state.elevationRange.min === Infinity) {
            return [0, 0, 0];
        }

        if (this.colorCache.has(elevation)) {
            return this.colorCache.get(elevation);
        }

        const normalizedElevation =
            (elevation - state.elevationRange.min) /
            (state.elevationRange.max - state.elevationRange.min);

        const color = this.calculateColor(normalizedElevation);

        if (this.colorCache.size > 1000) this.colorCache.clear();
        this.colorCache.set(elevation, color);

        return color;
    }

    calculateColor(normalized) {
        let prevThreshold = 0;

        for (const range of this.colorRanges) {
            if (normalized <= range.threshold) {
                const t = (normalized - prevThreshold) / (range.threshold - prevThreshold);
                return this.interpolateColor(range.from, range.to, t);
            }
            prevThreshold = range.threshold;
        }

        return this.colorRanges[this.colorRanges.length - 1].to;
    }

    interpolateColor(from, to, t) {
        return [
            Math.round(from[0] + (to[0] - from[0]) * t),
            Math.round(from[1] + (to[1] - from[1]) * t),
            Math.round(from[2] + (to[2] - from[2]) * t),
        ];
    }
}

export const colorUtils = new ColorUtils();
