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

                    console.log('Aplicação inicializada com sucesso!');
                } catch (error) {
                    console.error('Erro durante setup:', error);
                }
            };

            p.draw = () => {
                try {
                    drawingModule.draw(p);
                } catch (error) {
                    console.error('Erro durante draw:', error);
                }
            };

            window.redraw = () => p.redraw();
        };

        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            new p5(sketch, canvasContainer);
        } else {
            console.error('Elemento canvas-container não encontrado!');
        }
    } catch (error) {
        console.error('Erro fatal durante inicialização:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red; font-family: Arial;">
                <h2>Erro de Inicialização</h2>
                <p>Ocorreu um erro ao carregar a aplicação:</p>
                <pre>${error.message}</pre>
                <p>Verifique o console para mais detalhes.</p>
            </div>
        `;
    }
}

initializeApp();
