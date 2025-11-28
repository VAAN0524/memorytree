import * as THREE from 'three';

export class ExplosionSystem {
    private scene: THREE.Scene;
    private mesh: THREE.InstancedMesh;
    private particleCount: number = 300;
    private dummy: THREE.Object3D = new THREE.Object3D();

    private positions: Float32Array;
    private velocities: Float32Array;
    private lives: Float32Array; // 0..1
    private colors: Float32Array;
    private active: boolean = false;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Use SphereGeometry for 3D balls
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.particleCount);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.mesh.visible = false;

        // Custom color attribute for InstancedMesh to support gradients per instance
        this.mesh.setColorAt(0, new THREE.Color());

        this.scene.add(this.mesh);

        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.lives = new Float32Array(this.particleCount);
        this.colors = new Float32Array(this.particleCount * 3);

        // Initialize inactive
        for(let i=0; i<this.particleCount; i++) {
            this.lives[i] = 0;
        }
    }

    public explode() {
        this.active = true;
        this.mesh.visible = true;

        // Initial burst
        for (let i = 0; i < this.particleCount; i++) {
            this.resetParticle(i, true);
        }
    }

    private resetParticle(i: number, force: boolean = false) {
        // Only reset if dead, unless forced
        if (!force && this.lives[i] > 0) return;

        const i3 = i * 3;

        // Start at center (or maybe slightly offset)
        this.positions[i3] = (Math.random() - 0.5) * 2;
        this.positions[i3+1] = (Math.random() - 0.5) * 2;
        this.positions[i3+2] = (Math.random() - 0.5) * 2;

        // Random direction
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.5 + Math.random() * 2.0;

        this.velocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
        this.velocities[i3+1] = speed * Math.sin(phi) * Math.sin(theta);
        this.velocities[i3+2] = speed * Math.cos(phi);

        // Life
        this.lives[i] = 1.0;

        // Color (Gradient)
        // Pick a base color and vary it
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 1.0, 0.6);

        this.mesh.setColorAt(i, color);
        // We need to notify update is handled later
    }

    public update() {
        if (!this.active) return;

        let needsMatrixUpdate = false;

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            if (this.lives[i] > 0) {
                // Physics
                this.positions[i3] += this.velocities[i3];
                this.positions[i3+1] += this.velocities[i3+1];
                this.positions[i3+2] += this.velocities[i3+2];

                this.velocities[i3] *= 0.95; // Drag
                this.velocities[i3+1] *= 0.95;
                this.velocities[i3+2] *= 0.95;

                this.lives[i] -= 0.01 + Math.random() * 0.01;

                // Update Instance Matrix
                this.dummy.position.set(
                    this.positions[i3],
                    this.positions[i3+1],
                    this.positions[i3+2]
                );

                // Scale based on life
                const s = this.lives[i];
                this.dummy.scale.setScalar(s);
                this.dummy.updateMatrix();

                this.mesh.setMatrixAt(i, this.dummy.matrix);
                needsMatrixUpdate = true;

            } else {
                // Respawn immediately to keep "Continuous" effect
                this.resetParticle(i, true); // Force respawn

                // Set matrix for new particle
                this.dummy.position.set(
                    this.positions[i3],
                    this.positions[i3+1],
                    this.positions[i3+2]
                );
                this.dummy.scale.setScalar(1.0);
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);

                // We changed color in resetParticle, so need to update instance color
                this.mesh.instanceColor!.needsUpdate = true;
                needsMatrixUpdate = true;
            }
        }

        if (needsMatrixUpdate) {
            this.mesh.instanceMatrix.needsUpdate = true;
        }
    }
}
