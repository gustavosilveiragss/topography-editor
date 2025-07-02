import { state } from './state.js';
import { i18n } from './i18n.js';
import { colorUtils } from './colorUtils.js';
import { smoothingUtils } from './smoothingUtils.js';
import { transformUtils } from './transformUtils.js';

class ExportModule {
    constructor() {
        this.p = null;
    }

    setP5Instance(p) {
        this.p = p;
    }

    saveCanvas() {
        if (!state.contourLines.length) {
            alert(i18n.t('alerts.loadFileFirst'));
            return;
        }
        this.p.save('topo-arte-export');
    }

    exportSVG() {
        if (!state.contourLines.length) {
            alert(i18n.t('alerts.loadFileFirst'));
            return;
        }

        const svgParts = this.generateSVGParts();
        const svg = svgParts.join('');

        this.downloadSVG(svg);
    }

    generateSVGParts() {
        const svgWidth = 800;
        const svgHeight = 800;
        const translateX = 400 + state.navigation.offsetX;
        const translateY = 400 + state.navigation.offsetY;

        const parts = [
            '<?xml version="1.0" encoding="UTF-8"?>\n',
            `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">\n`,
            `<rect width="${svgWidth}" height="${svgHeight}" fill="white"/>\n`,
            `<g transform="translate(${translateX},${translateY}) rotate(${state.visual.rotation}) scale(${state.navigation.zoom})">\n`,
        ];

        for (let i = 0; i < state.contourLines.length; i += state.visual.density) {
            const elevationGroup = state.contourLines[i];
            const color = colorUtils.getElevationColor(elevationGroup.elevation);
            const colorStr = `rgb(${color[0]},${color[1]},${color[2]})`;
            const strokeWidth = state.visual.lineWeight / state.navigation.zoom;

            for (const lineString of elevationGroup.lines) {
                if (lineString.length < 2) continue;

                const processedLine =
                    state.visual.smoothness > 0
                        ? smoothingUtils.smoothLine(lineString, state.visual.smoothness, this.p)
                        : lineString;

                const pathData =
                    'M' +
                    processedLine
                        .map((p, j) => (j === 0 ? `${p.x},${p.y}` : ` L${p.x},${p.y}`))
                        .join('');

                parts.push(
                    `<path d="${pathData}" fill="none" stroke="${colorStr}" stroke-width="${strokeWidth}"/>\n`,
                );
            }
        }

        parts.push('</g>\n');

        for (const point of state.redPoints) {
            const screenPos = transformUtils.geoToScreen(point.lat, point.lon, this.p);
            parts.push(
                `<circle cx="${screenPos.x}" cy="${screenPos.y}" r="${
                    point.size / 2
                }" fill="red"/>\n`,
            );
        }

        parts.push('</svg>');

        return parts;
    }

    downloadSVG(svg) {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        Object.assign(a, {
            href: url,
            download: 'export.svg',
        });

        a.click();
        URL.revokeObjectURL(url);
    }
}

export const exportModule = new ExportModule();
