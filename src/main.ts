import * as THREE from 'three';
import { ThreeScene } from './core/ThreeScene';
import { PhotoSystem } from './core/PhotoSystem';
import { VisionManager } from './vision/VisionManager';
import { UIManager } from './ui/UIManager';

const init = async () => {
    try {
        const threeScene = new ThreeScene('canvas-container');
        const photoSystem = new PhotoSystem(threeScene.scene);
        const visionManager = new VisionManager('webcam');
        const uiManager = new UIManager(photoSystem);

        const raycaster = new THREE.Raycaster();

        // Initial setup for camera position
        threeScene.camera.position.z = 60;

        // Set a timeout for vision initialization
        const visionPromise = visionManager.initialize();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Vision load timeout")), 8000)
        );

        try {
            await Promise.race([visionPromise, timeoutPromise]);
            console.log('Vision loaded successfully');
        } catch (err) {
            console.warn('Vision initialization failed or timed out:', err);
            const loading = document.getElementById('loading');
            if (loading) {
                loading.innerText = "⚠️ Vision Load Failed (Network Issue?)\nRunning in Demo Mode";
                loading.style.color = "orange";
                setTimeout(() => { loading.style.opacity = '0'; }, 3000);
            }
        }

        // Start game loop
        threeScene.start(() => {
            visionManager.update();

            const leftHand = visionManager.leftHand;
            const rightHand = visionManager.rightHand;

            // Cursor driven by Right Hand (or Left if Right missing, for fallback)
            const activeHandForCursor = rightHand.detected ? rightHand : leftHand;
            const cursorX = activeHandForCursor.cursor.x;
            const cursorY = activeHandForCursor.cursor.y;
            const isHandDetected = leftHand.detected || rightHand.detected;

            // Update UI Cursor
            uiManager.updateCursor(cursorX, cursorY, isHandDetected);

            // --- RAYCASTING (Right Hand for selection) ---
            let hoveredIndex = -1;
            if (rightHand.detected && photoSystem.state === 'SPHERE') {
                const ndc = new THREE.Vector2(
                    (rightHand.cursor.x * 2) - 1,
                    -(rightHand.cursor.y * 2) + 1
                );

                raycaster.setFromCamera(ndc, threeScene.camera);
                const intersects = raycaster.intersectObjects(photoSystem.meshes);

                if (intersects.length > 0) {
                    hoveredIndex = intersects[0].object.userData.id;
                }
            }
            photoSystem.setHovered(hoveredIndex);

            // --- INTERACTION LOGIC ---

            // 1. Crystal Ball / Initial State
            if (photoSystem.state === 'CRYSTAL_BALL') {
                // Any pinch triggers explosion to Sphere
                if (leftHand.gesture === 'PINCH_START' || rightHand.gesture === 'PINCH_START') {
                    photoSystem.setSphereLayout();
                }
            }

            // 2. Sphere Mode (Main Exploration)
            else if (photoSystem.state === 'SPHERE') {
                // 双手合掌缩放控制 (Both Hands: Zoom / Scale)
                if (visionManager.handsDetectedBoth) {
                    // 双手距离控制缩放：合掌(小) -> 分开(大)
                    photoSystem.setExpansion(visionManager.zoomFactor);
                }

                // Right Hand: Rotation (Movement)
                if (rightHand.detected) {
                    // Only rotate if NOT selecting/pinching (to avoid accidental rotation while clicking)
                    if (!rightHand.isPinching) {
                        // Apply rotation based on hand position relative to center
                        // Deadzone is handled in VisionManager, giving us rotationSpeed x/y

                        // Map right hand movements to sphere rotation
                        // X movement -> Y axis rotation
                        // Y movement -> X axis rotation
                        // Invert Y for natural feel (Move up -> Tilt up)
                        photoSystem.rotateSphere(
                            rightHand.rotationSpeed.x * 0.05,
                            rightHand.rotationSpeed.y * 0.05
                        );
                    }

                    // Double Pinch -> Enter Detail Mode
                    if (rightHand.gesture === 'DOUBLE_PINCH' && hoveredIndex !== -1) {
                         photoSystem.setDetailLayout(hoveredIndex);
                    }

                    // Single Pinch/Click -> Also convenient for selection?
                    if (rightHand.gesture === 'PINCH_START' && hoveredIndex !== -1) {
                        // Optional: Drag mode? Or just Enter?
                        // Let's Enter for now as per "Enlarge this image"
                        photoSystem.setDetailLayout(hoveredIndex);
                    }
                } else {
                    // Auto rotate if no right hand control
                    // But if Left Hand is zooming, maybe stop auto rotate?
                    if (!leftHand.detected || leftHand.pinchDistance < 0.2) {
                         // Only auto-rotate if not actively zooming/holding
                         photoSystem.rotateSphere(0.002, 0);
                    }
                }
            }

            // 3. Detail Mode (Single Image View)
            else if (photoSystem.state === 'DETAIL') {
                // Right Hand:
                // Swipe -> Next/Prev
                // Fist -> Close (Back to Sphere)

                if (rightHand.detected) {
                    if (rightHand.gesture === 'SWIPE_LEFT') {
                        photoSystem.nextPhoto();
                    } else if (rightHand.gesture === 'SWIPE_RIGHT') {
                        photoSystem.prevPhoto();
                    } 

                    if (rightHand.gesture === 'FIST') {
                        photoSystem.setSphereLayout();
                    }
                }
            }

            photoSystem.update();

            uiManager.updateStats(
                isHandDetected,
                visionManager.handsDistance, // Hands distance zoom level
                rightHand.gesture,      // Active gesture
                photoSystem.state
            );
        });

        console.log('Scene initialized');

        if (visionManager['handLandmarker']) {
            const loading = document.getElementById('loading');
            if (loading) loading.style.opacity = '0';
        }

    } catch (error) {
        console.error('Failed to initialize app:', error);
        const loading = document.getElementById('loading');
        if (loading) {
             loading.innerText = 'Error: ' + (error instanceof Error ? error.message : String(error));
             loading.style.color = "red";
        }
    }
};

init();
