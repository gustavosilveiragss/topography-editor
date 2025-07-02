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
    lucide.createIcons();
    await i18n.init();
    
    Object.assign(window, {
        state,
        canvasModule,
        fileModule,
        exportModule,
        cropModule,
        deleteModule,
        pointsModule
    });
    
    const sketch = (p) => {
        p.setup = () => {
            canvasModule.setup(p);
            controlsModule.setup();
            navigationModule.setup();
            fileModule.setup();
            
            cropModule.setP5Instance(p);
            deleteModule.setP5Instance(p);
            exportModule.setP5Instance(p);
        };
        
        p.draw = () => drawingModule.draw(p);
        window.redraw = () => p.redraw();
    };
    
    new p5(sketch, document.getElementById('canvas-container'));
}

initializeApp();