import { state } from './state.js';
import { cropModule } from './crop.js';
import { deleteModule } from './delete.js';
import { p5Utils } from './p5Utils.js';

class NavigationModule {
    constructor() {
        this.throttleFrame = null;
    }

    setup() {
        setTimeout(() => this.setupCanvasNavigation(), 100);
    }

    setupCanvasNavigation() {
        const canvasElement = document.querySelector('#canvas-container canvas');

        const events = [
            ['mousedown', this.handleMouseDown.bind(this)],
            ['mousemove', this.handleMouseMove.bind(this)],
            ['mouseup', this.handleMouseUp.bind(this)],
            ['mouseleave', this.handleMouseLeave.bind(this)],
            ['wheel', this.handleWheel.bind(this)],
        ];

        events.forEach(([event, handler]) => {
            canvasElement.addEventListener(event, handler);
        });
    }

    handleMouseDown(e) {
        if (state.crop.mode) {
            cropModule.handleCropClick(e);
            return;
        }

        if (state.delete.mode) {
            deleteModule.handleDeleteClick(e);
            return;
        }

        if (state.lineWidth.mode) {
            window.lineWidthModule.handleClick();
            return;
        }

        if (state.fill.mode) {
            window.fillModule.handleClick();
            return;
        }

        Object.assign(state.navigation, {
            isDragging: true,
            lastMouseX: e.offsetX,
            lastMouseY: e.offsetY,
        });

        e.preventDefault();
    }

    handleMouseMove(e) {
        const { offsetX, offsetY } = e;

        Object.assign(state.crop, {
            mouseCanvasX: offsetX,
            mouseCanvasY: offsetY,
        });

        Object.assign(state.delete, {
            mouseCanvasX: offsetX,
            mouseCanvasY: offsetY,
        });

        Object.assign(state.lineWidth, {
            mouseX: offsetX,
            mouseY: offsetY,
        });

        Object.assign(state.fill, {
            mouseX: offsetX,
            mouseY: offsetY,
        });

        if (state.crop.mode) {
            this.throttledUpdate(() => {
                cropModule.updateHoveredLine();
                window.redraw();
            });
            return;
        }

        if (state.delete.mode) {
            this.throttledUpdate(() => {
                deleteModule.updateHoveredLine();
                window.redraw();
            });
            return;
        }

        if (state.lineWidth.mode) {
            this.throttledUpdate(() => {
                window.lineWidthModule.updateHoveredLine();
                window.redraw();
            });
            return;
        }

        if (state.fill.mode) {
            this.throttledUpdate(() => {
                window.fillModule.updateHoveredLine();
                window.redraw();
            });
            return;
        }

        if (state.navigation.isDragging) {
            const deltaX = offsetX - state.navigation.lastMouseX;
            const deltaY = offsetY - state.navigation.lastMouseY;

            Object.assign(state.navigation, {
                offsetX: p5Utils.constrain(state.navigation.offsetX + deltaX, -2000, 2000),
                offsetY: p5Utils.constrain(state.navigation.offsetY + deltaY, -2000, 2000),
                lastMouseX: offsetX,
                lastMouseY: offsetY,
            });

            window.redraw();
            e.preventDefault();
        }
    }

    handleMouseUp(e) {
        state.navigation.isDragging = false;
        e.preventDefault();
    }

    handleMouseLeave(e) {
        state.navigation.isDragging = false;

        if (state.crop.mode) {
            Object.assign(state.crop, {
                hoveredLineIndex: -1,
                hoveredElevationIndex: -1,
            });
            window.redraw();
        }

        if (state.delete.mode) {
            Object.assign(state.delete, {
                hoveredLineIndex: -1,
                hoveredElevationIndex: -1,
            });
            window.redraw();
        }

        if (state.lineWidth.mode) {
            state.lineWidth.hoveredLine = null;
            window.redraw();
        }

        if (state.fill.mode) {
            state.fill.hoveredLine = null;
            window.redraw();
        }
    }

    handleWheel(e) {
        if (state.crop.mode || state.delete.mode || state.lineWidth.mode || state.fill.mode) return;

        const factor = e.ctrlKey ? (e.deltaY > 0 ? 0.95 : 1.05) : e.deltaY > 0 ? 0.85 : 1.15;

        state.navigation.zoom = p5Utils.constrain(state.navigation.zoom * factor, 0.1, 10);
        window.redraw();
        e.preventDefault();
    }

    throttledUpdate(callback) {
        if (this.throttleFrame) return;

        this.throttleFrame = requestAnimationFrame(() => {
            callback();
            this.throttleFrame = null;
        });
    }
}

export const navigationModule = new NavigationModule();
