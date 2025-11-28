import * as THREE from 'three';
import { ExplosionSystem } from './ExplosionSystem';

export type LayoutState = 'CRYSTAL_BALL' | 'SPHERE' | 'DETAIL';

interface PhotoTransform {
    position: THREE.Vector3;
    rotation: THREE.Quaternion;
    scale: THREE.Vector3;
}

export class PhotoSystem {
    public group: THREE.Group;
    public meshes: THREE.Mesh[] = [];
    private geometry: THREE.PlaneGeometry;
    private count: number;
    public state: LayoutState = 'CRYSTAL_BALL';
    private explosionSystem: ExplosionSystem;

    // Transforms
    private targetTransforms: PhotoTransform[] = [];
    private currentTransforms: PhotoTransform[] = [];

    // Layout positions cache
    private spherePositions: THREE.Vector3[] = [];

    // Selection
    private selectedIndex: number = -1;
    private hoveredIndex: number = -1;

    // Interaction Smoothness
    private hoverIntensities: number[] = []; // 0..1 for each photo
    private aspectRatios: number[] = []; // Aspect ratio (width/height) for each photo

    // Interaction
    private sphereRotation: THREE.Euler = new THREE.Euler();
    public sphereScale: number = 1.0;

    // Constants
    private readonly BASE_RADIUS = 15;
    private readonly BASE_PHOTO_SCALE = 3.1;
    private readonly BASE_HEIGHT = 1.5; // Original height

    private loader: THREE.TextureLoader;

    constructor(scene: THREE.Scene, count: number = 130) {
        this.count = count;
        this.explosionSystem = new ExplosionSystem(scene);

        // Create Group
        this.group = new THREE.Group();
        scene.add(this.group);

        // Use 1x1 Geometry to allow custom aspect ratio scaling
        this.geometry = new THREE.PlaneGeometry(1, 1);
        this.loader = new THREE.TextureLoader();

        // Initialize Meshes
        for (let i = 0; i < this.count; i++) {
            // Load real photo textures
            const imgIndex = (i % 130) + 1;
            const texture = this.loader.load(`photos/${imgIndex}.png`, (tex) => {
                if (tex.image) {
                    const width = tex.image.width;
                    const height = tex.image.height;
                    if (height > 0) {
                        this.aspectRatios[i] = width / height;
                    }
                }
            });
            texture.colorSpace = THREE.SRGBColorSpace;

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true
            });

            const mesh = new THREE.Mesh(this.geometry, material);
            mesh.userData = { id: i };

            this.group.add(mesh);
            this.meshes.push(mesh);
            this.hoverIntensities.push(0);
            this.aspectRatios.push(0.8); // Default aspect ratio (1.2/1.5 = 0.8)
        }

        this.initTransforms();
        this.generateSphereLayout();
        this.setCrystalBallLayout(); // Start as Crystal Ball
    }

    private initTransforms() {
        for (let i = 0; i < this.count; i++) {
            this.targetTransforms.push({
                position: new THREE.Vector3(),
                rotation: new THREE.Quaternion(),
                scale: new THREE.Vector3(1, 1, 1)
            });
            this.currentTransforms.push({
                position: new THREE.Vector3(),
                rotation: new THREE.Quaternion(),
                scale: new THREE.Vector3(1, 1, 1)
            });
        }
    }

    private generateSphereLayout() {
        // Fibonacci Sphere
        const phi = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < this.count; i++) {
            const y = 1 - (i / (this.count - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;

            // Base sphere positions (Radius 1.0)
            this.spherePositions.push(new THREE.Vector3(x, y, z));
        }
    }

    // --- State Transitions ---

    public setCrystalBallLayout() {
        this.state = 'CRYSTAL_BALL';
        this.selectedIndex = -1;
        this.sphereScale = 0.2; // Small sphere
    }

    public setSphereLayout() {
        if (this.state === 'CRYSTAL_BALL') {
            this.explosionSystem.explode();
        }
        this.state = 'SPHERE';
        this.selectedIndex = -1;
        this.sphereScale = 1.0; // Normal size
    }

    public setDetailLayout(index: number) {
        if (index < 0 || index >= this.count) return;
        this.state = 'DETAIL';
        this.selectedIndex = index;

        const centerTarget = this.targetTransforms[index];
        // Position right in front of camera
        centerTarget.position.set(0, 0, 32);
        centerTarget.rotation.setFromEuler(new THREE.Euler(0, 0, 0));

        // Scale for Detail view
        // Previously 24. Now we need to account for Aspect Ratio.
        // Height = 24 * 1 (geometry height) = 24 units?
        // No, geometry is 1x1. Previous geometry was 1.5 height.
        // So previous height was 24 * 1.5 = 36.
        // New height should be 36. So Scale Y = 36.
        // Let's use a multiplier of 24 * 1.5 = 36.
        const detailScale = 36;

        // We set the SCALE component here, but we need to know aspect ratio.
        // We can fetch it from the array.
        const ar = this.aspectRatios[index];
        centerTarget.scale.set(detailScale * ar, detailScale, 1);

        // Others scatter/fade/background
        for (let i = 0; i < this.count; i++) {
            if (i === index) continue;
            // Keep in background sphere but pushed back/dimmed
            const pos = this.spherePositions[i].clone().multiplyScalar(this.BASE_RADIUS * 2.0);
            this.targetTransforms[i].position.copy(pos);
            this.targetTransforms[i].scale.setScalar(0); // Hide others
        }
    }

    // --- Interaction ---

    public setHovered(index: number) {
        if (this.state !== 'SPHERE') return;
        this.hoveredIndex = index;
    }

    public rotateSphere(deltaX: number, deltaY: number) {
        // Apply to sphereRotation
        this.sphereRotation.y += deltaX;
        this.sphereRotation.x += deltaY;
    }

    public nextPhoto() {
        if (this.state !== 'DETAIL') return;
        let next = this.selectedIndex + 1;
        if (next >= this.count) next = 0;
        this.setDetailLayout(next);
    }

    public prevPhoto() {
        if (this.state !== 'DETAIL') return;
        let prev = this.selectedIndex - 1;
        if (prev < 0) prev = this.count - 1;
        this.setDetailLayout(prev);
    }

    public setExpansion(factor: number) {
        // Factor 0..1 (Pinch distance)
        if (this.state === 'SPHERE') {
             // Reduced max size by 15%
             this.sphereScale = 0.5 + factor * 2.05;
        }
    }

    public update() {
        // Lowered lerpFactor from 0.1 to 0.05 for smoother general movement
        const lerpFactor = 0.05;
        const time = Date.now() * 0.001;

        this.explosionSystem.update();

        // Auto Rotation
        if (this.state === 'CRYSTAL_BALL') {
            this.sphereRotation.y += 0.05; // Fast spin
            this.sphereRotation.z = Math.sin(time) * 0.1;
        } else if (this.state === 'SPHERE') {
            this.sphereRotation.y += 0.002; // Slow spin
        }

        // Update Transforms
        for (let i = 0; i < this.count; i++) {
            const current = this.currentTransforms[i];
            const target = this.targetTransforms[i];
            const ar = this.aspectRatios[i];

            if (this.state === 'SPHERE' || this.state === 'CRYSTAL_BALL') {
                const r = this.BASE_RADIUS * this.sphereScale;
                const basePos = this.spherePositions[i];

                // Position
                const p = basePos.clone().multiplyScalar(r);
                p.applyEuler(this.sphereRotation);

                // Smooth Hover State Update
                const isHovered = (i === this.hoveredIndex && this.state === 'SPHERE');
                const targetIntensity = isHovered ? 1.0 : 0.0;
                // Smoothly lerp current hover intensity (0.15 speed)
                this.hoverIntensities[i] += (targetIntensity - this.hoverIntensities[i]) * 0.15;

                const hoverEffect = this.hoverIntensities[i];

                // Apply Hover Effect to Position (Pop out)
                // Position push: 1.0 -> 1.1 (1 + 0.1 * hoverEffect)
                if (hoverEffect > 0.001) {
                    p.multiplyScalar(1.0 + 0.1 * hoverEffect);
                }

                target.position.copy(p);

                // Rotation
                const dummy = new THREE.Object3D();
                dummy.position.copy(p);
                dummy.lookAt(p.clone().multiplyScalar(2));
                target.rotation.copy(dummy.quaternion);

                // Scale Calculation
                // Original: s * BASE_PHOTO_SCALE (3.1).
                // Geometry was 1.2 x 1.5.
                // Width = 1.2 * 3.1 = 3.72. Height = 1.5 * 3.1 = 4.65.
                // New Geometry 1x1.
                // New Height should be ~4.65.
                // BASE_PHOTO_SCALE * BASE_HEIGHT = 3.1 * 1.5 = 4.65.

                let s = this.BASE_PHOTO_SCALE * this.sphereScale;
                const baseH = this.BASE_HEIGHT * s;

                // Apply Hover Scale
                // 1.0 -> 1.2 (1 + 0.2 * hoverEffect)
                let scaleMult = 1.0;
                if (hoverEffect > 0.001) {
                    scaleMult = (1.0 + 0.2 * hoverEffect);
                }

                const finalH = baseH * scaleMult;
                const finalW = finalH * ar;

                target.scale.set(finalW, finalH, 1);
            }

            // DETAIL mode animation
            if (this.state === 'DETAIL' && i === this.selectedIndex) {
                target.position.y = Math.sin(time * 2) * 0.5;
            }

            // Apply Interpolation
            current.position.lerp(target.position, lerpFactor);
            current.rotation.slerp(target.rotation, lerpFactor);
            current.scale.lerp(target.scale, lerpFactor);

            // Update individual Mesh
            const mesh = this.meshes[i];
            mesh.position.copy(current.position);
            mesh.quaternion.copy(current.rotation);
            mesh.scale.copy(current.scale);
        }
    }
}
