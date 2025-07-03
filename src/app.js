import p5 from 'p5';
import { i18n } from './modules/i18n.js';
import { state } from './modules/state.js';
import { canvasModule } from './modules/canvas.js';
import { controlsModule } from './modules/controls.js';
import { navigationModule } from './modules/navigation.js';
import { fileModule } from './modules/file.js';
import { drawingModule } from './modules/drawing.js';
import { exportModule } from './modules/export.js';
import { cropModule } from './modules/crop.js';
import { deleteModule } from './modules/delete.js';
import { pointsModule } from './modules/points.js';
import { fillModule } from './modules/fill.js';
import { lineWidthModule } from './modules/lineWidth.js';

async function initializeApp() {
    try {
        if (document.readyState === 'loading') {
            await new Promise((resolve) => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        await i18n.init();

        Object.assign(window, {
            state,
            canvasModule,
            fileModule,
            exportModule,
            cropModule,
            deleteModule,
            pointsModule,
            fillModule,
            lineWidthModule,
        });

        const sketch = (p) => {
            p.setup = () => {
                try {
                    canvasModule.setup(p);
                    controlsModule.setup();
                    navigationModule.setup();
                    fileModule.setup();

                    cropModule.setP5Instance(p);
                    deleteModule.setP5Instance(p);
                    exportModule.setP5Instance(p);
                    fillModule.setP5Instance(p);
                    lineWidthModule.setP5Instance(p);

                    console.log(i18n.t('debug.appInitialized'));
                } catch (error) {
                    console.error(i18n.t('errors.setupError'), error);
                }
            };

            p.draw = () => {
                try {
                    drawingModule.draw(p);
                } catch (error) {
                    console.error(i18n.t('errors.drawError'), error);
                }
            };

            window.redraw = () => p.redraw();
        };

        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            new p5(sketch, canvasContainer);
        } else {
            console.error(i18n.t('errors.canvasContainerNotFound'));
        }
    } catch (error) {
        console.error(i18n.t('errors.fatalInitializationError'), error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red; font-family: Arial;">
                <h2>${i18n.t('errors.initializationError')}</h2>
                <p>${i18n.t('errors.appLoadError')}</p>
                <pre>${error.message}</pre>
                <p>${i18n.t('errors.checkConsole')}</p>
            </div>
        `;
    }
}

initializeApp();
