import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface HandData {
    detected: boolean;
    position: { x: number, y: number, z: number };
    pinchDistance: number;
    isPinching: boolean;
    gesture: string;
    velocity: { x: number, y: number };
    lastPosition: { x: number, y: number } | null;
    rotationSpeed: { x: number, y: number };
    cursor: { x: number, y: number };
    lastPinchTime: number;
    lastGestureTime: number;
}

export class VisionManager {
    private handLandmarker: HandLandmarker | undefined;
    private video: HTMLVideoElement;
    private lastVideoTime = -1;
    private isWebcamRunning = false;

    public leftHand: HandData;
    public rightHand: HandData;

    // 新增：双手距离相关属性
    private lastHandsDistance: number = 0;
    public handsDistance: number = 0;
    public handsDetectedBoth: boolean = false;

    public get isHandDetected(): boolean { return this.rightHand.detected || this.leftHand.detected; }
    public get gesture(): string { return this.rightHand.gesture; }
    public get cursorPosition(): {x: number, y: number} { return this.rightHand.detected ? this.rightHand.cursor : this.leftHand.cursor; }
    public get pinchDistance(): number { return this.leftHand.detected ? this.leftHand.pinchDistance : 0; }
    public get handRotationSpeed(): {x: number, y: number} { return this.rightHand.rotationSpeed; }
    public get zoomFactor(): number { return this.handsDistance; }

    constructor(videoId: string) {
        this.video = document.getElementById(videoId) as HTMLVideoElement;
        this.leftHand = this.createEmptyHandData();
        this.rightHand = this.createEmptyHandData();
    }

    private createEmptyHandData(): HandData {
        return {
            detected: false,
            position: { x: 0.5, y: 0.5, z: 0 },
            pinchDistance: 0,
            isPinching: false,
            gesture: "NONE",
            velocity: { x: 0, y: 0 },
            lastPosition: null,
            rotationSpeed: { x: 0, y: 0 },
            cursor: { x: 0.5, y: 0.5 },
            lastPinchTime: 0,
            lastGestureTime: 0
        };
    }

    public async initialize() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            });

            await this.startWebcam();
        } catch (error) {
            console.error("Error initializing VisionManager:", error);
            throw error;
        }
    }

    private async startWebcam() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn("Browser API navigator.mediaDevices.getUserMedia not available");
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720
            }
        });

        this.video.srcObject = stream;
        this.video.addEventListener("loadeddata", () => {
            this.isWebcamRunning = true;
        });
    }

    public update() {
        if (!this.handLandmarker || !this.isWebcamRunning) return;

        let startTimeMs = performance.now();
        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;

            const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);

            this.leftHand.detected = false;
            this.rightHand.detected = false;

            if (results.landmarks && results.handedness && results.landmarks.length > 0) {
                for (let i = 0; i < results.landmarks.length; i++) {
                    const landmarks = results.landmarks[i];
                    const handedness = results.handedness[i][0];
                    let targetHand = handedness.categoryName === "Right" ? this.rightHand : this.leftHand;
                    targetHand.detected = true;
                    this.updateHandData(targetHand, landmarks);
                }
            }

            if (!this.leftHand.detected) this.resetHand(this.leftHand);
            if (!this.rightHand.detected) this.resetHand(this.rightHand);

            // 计算双手距离用于缩放控制
            this.calculateHandsDistance();
        }
    }

    private calculateHandsDistance() {
        if (this.leftHand.detected && this.rightHand.detected) {
            // 计算双手之间的3D距离
            const dx = this.leftHand.position.x - this.rightHand.position.x;
            const dy = this.leftHand.position.y - this.rightHand.position.y;
            const dz = this.leftHand.position.z - this.rightHand.position.z;

            const currentDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);

            // 平滑距离变化，避免抖动
            const smoothingFactor = 0.3;
            this.handsDistance = this.handsDistance * (1 - smoothingFactor) + currentDistance * smoothingFactor;

            this.handsDetectedBoth = true;

            // 根据双手距离计算缩放因子
            // 距离越近，缩放因子越小；距离越远，缩放因子越大
            const minDistance = 0.15;  // 双手合掌时的最小距离
            const maxDistance = 0.8;   // 双手分开时的最大距离

            let normalizedDistance = (this.handsDistance - minDistance) / (maxDistance - minDistance);
            normalizedDistance = Math.max(0, Math.min(1, normalizedDistance)); // 限制在0-1范围

            // 反转映射：近距离(合掌) = 小缩放(缩小)，远距离(分开) = 大缩放(放大)
            this.handsDistance = normalizedDistance;

        } else {
            this.handsDetectedBoth = false;
            // 当只有一只手或没有手时，保持当前缩放状态，不做改变
        }
    }

    private updateHandData(hand: HandData, landmarks: any[]) {
        const wrist = landmarks[0];
        const indexMCP = landmarks[5];
        const pinkyMCP = landmarks[17];

        hand.position = {
            x: (wrist.x + indexMCP.x + pinkyMCP.x) / 3,
            y: (wrist.y + indexMCP.y + pinkyMCP.y) / 3,
            z: (wrist.z + indexMCP.z + pinkyMCP.z) / 3
        };

        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const targetCursorX = 1 - indexTip.x;
        const targetCursorY = indexTip.y;
        // Smooth cursor (was 0.5, now 0.2 for less jitter)
        hand.cursor.x += (targetCursorX - hand.cursor.x) * 0.2;
        hand.cursor.y += (targetCursorY - hand.cursor.y) * 0.2;

        if (hand.lastPosition) {
            const vx = hand.position.x - hand.lastPosition.x;
            const vy = hand.position.y - hand.lastPosition.y;
            hand.velocity.x = hand.velocity.x * 0.5 + vx * 0.5;
            hand.velocity.y = hand.velocity.y * 0.5 + vy * 0.5;
        }
        hand.lastPosition = { ...hand.position };

        const dx = hand.position.x - 0.5;
        const dy = hand.position.y - 0.5;
        hand.rotationSpeed.x = Math.abs(dx) > 0.1 ? (dx > 0 ? dx - 0.1 : dx + 0.1) * 2 : 0;
        hand.rotationSpeed.y = Math.abs(dy) > 0.1 ? (dy > 0 ? dy - 0.1 : dy + 0.1) * 2 : 0;

        const dx_pinch = thumbTip.x - indexTip.x;
        const dy_pinch = thumbTip.y - indexTip.y;
        const dz_pinch = thumbTip.z - indexTip.z;
        const rawDist = Math.sqrt(dx_pinch*dx_pinch + dy_pinch*dy_pinch + dz_pinch*dz_pinch);

        const minP = 0.03;
        const maxP = 0.25;
        hand.pinchDistance = Math.min(Math.max((rawDist - minP) / (maxP - minP), 0), 1);

        const currentlyPinching = hand.pinchDistance < 0.1;
        const now = performance.now();
        hand.gesture = "NONE";

        if (currentlyPinching && !hand.isPinching) {
            hand.isPinching = true;
            hand.gesture = "PINCH_START";
            if (now - hand.lastPinchTime < 400) {
                hand.gesture = "DOUBLE_PINCH";
            }
            hand.lastPinchTime = now;
        } else if (!currentlyPinching && hand.isPinching) {
            hand.isPinching = false;
            hand.gesture = "PINCH_END";
        }

        const tips = [8, 12, 16, 20];
        let closedFingers = 0;
        const palmCenter = landmarks[0];

        for (const idx of tips) {
            const tip = landmarks[idx];
            const d = Math.sqrt(Math.pow(tip.x - palmCenter.x, 2) + Math.pow(tip.y - palmCenter.y, 2));
            if (d < 0.15) closedFingers++;
        }

        if (closedFingers >= 3) {
            hand.gesture = "FIST";
        }

        if (hand.gesture === "NONE" && !hand.isPinching && closedFingers < 3 && now - hand.lastGestureTime > 400) {
            const speedX = hand.velocity.x * 100;
            const speedY = hand.velocity.y * 100;
            const threshold = 1.5;

            if (Math.abs(speedX) > threshold || Math.abs(speedY) > threshold) {
                if (Math.abs(speedX) > Math.abs(speedY)) {
                    hand.gesture = speedX > 0 ? "SWIPE_RIGHT" : "SWIPE_LEFT";
                } else {
                    hand.gesture = speedY > 0 ? "SWIPE_DOWN" : "SWIPE_UP";
                }
                hand.lastGestureTime = now;
            }
        }
    }

    private resetHand(hand: HandData) {
        hand.velocity = { x: 0, y: 0 };
        hand.rotationSpeed = { x: 0, y: 0 };
        hand.pinchDistance = 0;
    }
}
