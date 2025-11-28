import GUI from 'lil-gui';
import * as THREE from 'three';
import { PhotoSystem } from '../core/PhotoSystem';
import { ShapeType } from '../shapes/ShapeGenerator';

export class UIManager {
    private gui: GUI;
    private photoSystem: PhotoSystem;

    // Cursor
    public cursorElement: HTMLDivElement;

    private params = {
        shape: 'sphere' as ShapeType,
        immersiveCamera: false
    };

    constructor(photoSystem: PhotoSystem) {
        this.photoSystem = photoSystem;
        this.gui = new GUI({ title: 'Controls' });

        this.setupControls();
        this.setupStats();
        this.setupCursor();
    }

    private setupCursor() {
        this.cursorElement = document.createElement('div');
        this.cursorElement.id = 'hand-cursor';
        this.cursorElement.style.position = 'absolute';
        this.cursorElement.style.width = '20px';
        this.cursorElement.style.height = '20px';
        this.cursorElement.style.backgroundColor = 'rgba(0, 255, 255, 0.7)';
        this.cursorElement.style.borderRadius = '50%';
        this.cursorElement.style.pointerEvents = 'none';
        this.cursorElement.style.zIndex = '100';
        this.cursorElement.style.transform = 'translate(-50%, -50%)';
        this.cursorElement.style.boxShadow = '0 0 15px 2px rgba(0, 255, 255, 0.9)';
        this.cursorElement.style.opacity = '0';
        this.cursorElement.style.transition = 'opacity 0.2s';
        document.body.appendChild(this.cursorElement);
    }

    public updateCursor(x: number, y: number, visible: boolean) {
        if (visible) {
            this.cursorElement.style.opacity = '1';
            // x, y are 0..1 normalized
            this.cursorElement.style.left = `${x * 100}%`;
            this.cursorElement.style.top = `${y * 100}%`;
        } else {
            this.cursorElement.style.opacity = '0';
        }
    }

    private setupStats() {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'debug-stats';
        statsDiv.style.position = 'absolute';
        statsDiv.style.bottom = '150px';
        statsDiv.style.left = '20px';
        statsDiv.style.color = '#00ff00';
        statsDiv.style.fontFamily = 'monospace';
        statsDiv.style.fontSize = '14px';
        statsDiv.style.pointerEvents = 'none';
        statsDiv.style.zIndex = '4';
        statsDiv.style.textShadow = '1px 1px 2px black';
        statsDiv.innerHTML = 'Initializing...';
        document.body.appendChild(statsDiv);

        this.statsDiv = statsDiv;
    }

    public updateStats(isHandDetected: boolean, pinchDist: number, gesture: string, state: string) {
        if (this.statsDiv) {
             this.statsDiv.innerHTML = `
             Hand Detected: <span style="color:${isHandDetected?'lime':'red'}">${isHandDetected ? 'YES' : 'NO'}</span><br>
             Zoom (Pinch): ${(pinchDist * 100).toFixed(0)}%<br>
             Gesture: <span style="color:yellow">${gesture}</span><br>
             State: <span style="color:cyan">${state}</span>
             `;
        }
    }

    private statsDiv: HTMLElement | null = null;

    private setupControls() {
        // Shape Selection - Removed as per request and current PhotoSystem implementation doesn't support dynamic shape switching yet
        /*
        this.gui.add(this.params, 'shape', ['sphere', 'heart', 'flower', 'saturn', 'buddha'])
            .name('Shape')
            .onChange((value: ShapeType) => {
                // this.photoSystem.setShape(value);
            });
        */

        // Full Screen Camera
        this.gui.add(this.params, 'immersiveCamera')
            .name('Immersive Camera')
            .onChange((value: boolean) => {
                const videoContainer = document.getElementById('video-container');
                if (videoContainer) {
                    if (value) {
                        videoContainer.classList.add('fullscreen');
                    } else {
                        videoContainer.classList.remove('fullscreen');
                    }
                }
            });
    }
}
