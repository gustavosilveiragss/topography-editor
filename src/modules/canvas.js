import { state } from './state.js';

class CanvasModule {
    setup(p) {
        const canvas = p.createCanvas(state.canvas.width, state.canvas.height);
        canvas.parent('canvas-container');
        p.noLoop();
    }
}

export const canvasModule = new CanvasModule();