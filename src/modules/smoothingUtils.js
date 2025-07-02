import { p5Utils } from './p5Utils.js';

class SmoothingUtils {
    constructor() {
        this.cache = new Map();
    }

    smoothLine(points, smoothFactor, p) {
        if (points.length < 3 || !smoothFactor) return points;

        const cacheKey = `${points.length}_${smoothFactor}_${points[0].x}_${
            points[points.length - 1].x
        }`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let current = [...points];
        const params = this.getOptimalParams(smoothFactor);

        for (let iter = 0; iter < params.iterations; iter++) {
            current = this.performSmoothing(current, params);
            params.weight = Math.min(0.98, params.weight * 1.1);
        }

        if (params.pointReduction > 1) {
            current = this.reducePoints(current, params.pointReduction);
        }

        if (this.cache.size > 500) this.cache.clear();
        this.cache.set(cacheKey, current);

        return current;
    }

    getOptimalParams(smoothFactor) {
        if (smoothFactor <= 30) {
            return {
                iterations: 1,
                weight: p5Utils.map(smoothFactor, 0, 30, 0, 0.3),
                windowSize: 1,
                pointReduction: 1,
            };
        }

        if (smoothFactor <= 60) {
            return {
                iterations: 2,
                weight: p5Utils.map(smoothFactor, 30, 60, 0.3, 0.6),
                windowSize: 2,
                pointReduction: 1,
            };
        }

        if (smoothFactor <= 80) {
            return {
                iterations: 3,
                weight: p5Utils.map(smoothFactor, 60, 80, 0.6, 0.8),
                windowSize: 3,
                pointReduction: Math.floor(p5Utils.map(smoothFactor, 60, 80, 1, 2)),
            };
        }

        return {
            iterations: Math.floor(p5Utils.map(smoothFactor, 80, 100, 4, 8)),
            weight: p5Utils.map(smoothFactor, 80, 100, 0.8, 0.95),
            windowSize: Math.floor(p5Utils.map(smoothFactor, 80, 100, 4, 8)),
            pointReduction: Math.floor(p5Utils.map(smoothFactor, 80, 100, 2, 6)),
        };
    }

    performSmoothing(points, params) {
        const newPoints = [points[0]];

        for (let i = 1; i < points.length - 1; i++) {
            const avg = this.calculateWindowAverage(points, i, params.windowSize);
            const smoothX = p5Utils.lerp(points[i].x, avg.x, params.weight);
            const smoothY = p5Utils.lerp(points[i].y, avg.y, params.weight);
            newPoints.push({ x: smoothX, y: smoothY });
        }

        if (points.length > 1) {
            newPoints.push(points[points.length - 1]);
        }

        return newPoints;
    }

    calculateWindowAverage(points, index, windowSize) {
        let avgX = 0,
            avgY = 0,
            count = 0;

        const start = Math.max(0, index - windowSize);
        const end = Math.min(points.length - 1, index + windowSize);

        for (let j = start; j <= end; j++) {
            avgX += points[j].x;
            avgY += points[j].y;
            count++;
        }

        return { x: avgX / count, y: avgY / count };
    }

    reducePoints(points, reduction) {
        const reduced = [];

        for (let i = 0; i < points.length; i += reduction) {
            reduced.push(points[i]);
        }

        const lastPoint = points[points.length - 1];
        if (reduced.length && reduced[reduced.length - 1] !== lastPoint) {
            reduced.push(lastPoint);
        }

        return reduced;
    }
}

export const smoothingUtils = new SmoothingUtils();
