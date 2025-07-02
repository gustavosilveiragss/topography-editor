class GeometryUtils {
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;

        if (!lenSq) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));

        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        const distX = px - projX;
        const distY = py - projY;

        return Math.sqrt(distX * distX + distY * distY);
    }

    pointInPolygon(point, polygon) {
        const { x, y } = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const { x: xi, y: yi } = polygon[i];
            const { x: xj, y: yj } = polygon[j];

            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }

        return inside;
    }

    lineSegmentsIntersect(p1, p2, p3, p4) {
        const d1 = this.crossProduct(p4.x - p3.x, p4.y - p3.y, p1.x - p3.x, p1.y - p3.y);
        const d2 = this.crossProduct(p4.x - p3.x, p4.y - p3.y, p2.x - p3.x, p2.y - p3.y);
        const d3 = this.crossProduct(p2.x - p1.x, p2.y - p1.y, p3.x - p1.x, p3.y - p1.y);
        const d4 = this.crossProduct(p2.x - p1.x, p2.y - p1.y, p4.x - p1.x, p4.y - p1.y);

        if (
            ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
        ) {
            return true;
        }

        return (
            (d1 === 0 && this.onSegment(p3, p1, p4)) ||
            (d2 === 0 && this.onSegment(p3, p2, p4)) ||
            (d3 === 0 && this.onSegment(p1, p3, p2)) ||
            (d4 === 0 && this.onSegment(p1, p4, p2))
        );
    }

    crossProduct(ux, uy, vx, vy) {
        return ux * vy - uy * vx;
    }

    onSegment(p, q, r) {
        return (
            q.x <= Math.max(p.x, r.x) &&
            q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) &&
            q.y >= Math.min(p.y, r.y)
        );
    }
}

export const geometryUtils = new GeometryUtils();
