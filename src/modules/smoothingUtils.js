import { p5Utils } from './p5Utils.js';

class SmoothingUtils {
    constructor() {
        this.cache = new Map();
    }

    smoothLine(points, smoothFactor, p) {
        if (points.length < 2 || !smoothFactor) return points;

        const cacheKey = `${points.length}_${smoothFactor}_${points[0].x}_${
            points[points.length - 1].x
        }`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let result = [...points];
        
        if (smoothFactor > 0) {
            result = this.applyAgressiveSmoothing(result, smoothFactor);
        }
        
        if (smoothFactor > 60) {
            result = this.createSmoothCurve(result, smoothFactor);
        }
        
        if (result.length < 2) {
            result = [points[0], points[points.length - 1]];
        }

        if (this.cache.size > 500) this.cache.clear();
        this.cache.set(cacheKey, result);

        return result;
    }

    applyAgressiveSmoothing(points, smoothFactor) {
        if (points.length < 3) return points;

        const iterations = Math.floor(smoothFactor / 15) + 1;
        const weight = p5Utils.map(smoothFactor, 0, 100, 0.1, 0.9);
        const windowSize = Math.floor(p5Utils.map(smoothFactor, 0, 100, 1, 8));

        let current = [...points];

        for (let iter = 0; iter < iterations; iter++) {
            current = this.performHeavySmoothing(current, weight, windowSize);
            
            if (smoothFactor > 40 && iter === iterations - 1) {
                const reduction = Math.floor(p5Utils.map(smoothFactor, 40, 100, 1, 4));
                current = this.intelligentPointReduction(current, reduction);
            }
        }

        return current;
    }

    performHeavySmoothing(points, weight, windowSize) {
        if (points.length < 3) return points;

        const newPoints = [];
        
        newPoints.push(points[0]);
        
        for (let i = 1; i < points.length - 1; i++) {
            const avg = this.calculateWeightedAverage(points, i, windowSize);
            const smoothX = p5Utils.lerp(points[i].x, avg.x, weight);
            const smoothY = p5Utils.lerp(points[i].y, avg.y, weight);
            newPoints.push({ x: smoothX, y: smoothY });
        }
        
        newPoints.push(points[points.length - 1]);

        return newPoints;
    }

    calculateWeightedAverage(points, index, windowSize) {
        let avgX = 0,
            avgY = 0,
            totalWeight = 0;

        const start = Math.max(0, index - windowSize);
        const end = Math.min(points.length - 1, index + windowSize);

        for (let j = start; j <= end; j++) {
            const distance = Math.abs(j - index);
            const weight = Math.max(0.1, 1 - distance / windowSize);

            avgX += points[j].x * weight;
            avgY += points[j].y * weight;
            totalWeight += weight;
        }

        return {
            x: avgX / totalWeight,
            y: avgY / totalWeight,
        };
    }

    intelligentPointReduction(points, reduction) {
        if (reduction <= 1 || points.length <= 4) return points;

        const newPoints = [];
        newPoints.push(points[0]);
        
        for (let i = reduction; i < points.length - 1; i += reduction) {
            newPoints.push(points[i]);
        }
        
        newPoints.push(points[points.length - 1]);

        return newPoints;
    }

    createSmoothCurve(points, smoothFactor) {
        if (points.length < 3) return points;
        
        if (smoothFactor > 80) {
            return this.applySuperSmoothing(points, smoothFactor);
        }
        
        const newPoints = [];
        newPoints.push(points[0]);

        for (let i = 1; i < points.length - 1; i++) {
            newPoints.push(points[i]);
            
            if (i < points.length - 2) {
                const curr = points[i];
                const next = points[i + 1];

                newPoints.push({
                    x: (curr.x + next.x) * 0.5,
                    y: (curr.y + next.y) * 0.5,
                });
            }
        }

        newPoints.push(points[points.length - 1]);
        return newPoints;
    }

    applySuperSmoothing(points, smoothFactor) {
        const extraIterations = Math.floor(p5Utils.map(smoothFactor, 80, 100, 3, 8));
        const superWeight = p5Utils.map(smoothFactor, 80, 100, 0.7, 0.95);
        const superWindow = Math.floor(p5Utils.map(smoothFactor, 80, 100, 6, 12));

        let result = [...points];
        
        for (let iter = 0; iter < extraIterations; iter++) {
            result = this.performSuperHeavySmoothing(result, superWeight, superWindow);
        }

        return result;
    }

    performSuperHeavySmoothing(points, weight, windowSize) {
        if (points.length < 3) return points;

        const newPoints = [];
        newPoints.push(points[0]);

        for (let i = 1; i < points.length - 1; i++) {
            const avg = this.calculateSuperWeightedAverage(points, i, windowSize);
            const smoothX = p5Utils.lerp(points[i].x, avg.x, weight);
            const smoothY = p5Utils.lerp(points[i].y, avg.y, weight);
            newPoints.push({ x: smoothX, y: smoothY });
        }

        newPoints.push(points[points.length - 1]);
        return newPoints;
    }

    calculateSuperWeightedAverage(points, index, windowSize) {
        let avgX = 0,
            avgY = 0,
            totalWeight = 0;

        const start = Math.max(0, index - windowSize);
        const end = Math.min(points.length - 1, index + windowSize);

        for (let j = start; j <= end; j++) {
            const distance = Math.abs(j - index);
            const weight = Math.exp(
                -(distance * distance) / (2 * (windowSize / 3) * (windowSize / 3)),
            );

            avgX += points[j].x * weight;
            avgY += points[j].y * weight;
            totalWeight += weight;
        }

        return {
            x: avgX / totalWeight,
            y: avgY / totalWeight,
        };
    }
}

export const smoothingUtils = new SmoothingUtils();
