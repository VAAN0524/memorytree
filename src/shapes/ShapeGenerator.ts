import * as THREE from 'three';

export type ShapeType = 'sphere' | 'heart' | 'flower' | 'saturn' | 'buddha';

export class ShapeGenerator {

    public static generate(type: ShapeType, count: number, radius: number = 10): Float32Array {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            let p = new THREE.Vector3();

            switch (type) {
                case 'sphere':
                    p = this.getSpherePoint(radius);
                    break;
                case 'heart':
                    p = this.getHeartPoint(radius);
                    break;
                case 'flower':
                    p = this.getFlowerPoint(radius);
                    break;
                case 'saturn':
                    p = this.getSaturnPoint(radius);
                    break;
                case 'buddha':
                    // Simplified procedural Buddha (meditating figure approximation)
                    p = this.getBuddhaPoint(radius);
                    break;
            }

            positions[i3] = p.x;
            positions[i3 + 1] = p.y;
            positions[i3 + 2] = p.z;
        }

        return positions;
    }

    private static getSpherePoint(radius: number): THREE.Vector3 {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random()) * radius; // Uniform distribution

        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }

    private static getHeartPoint(scale: number): THREE.Vector3 {
        // Heart surface equation
        // x = 16sin^3(t)
        // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // extended to 3D with z

        let x, y, z;
        // Rejection sampling for better volume fill
        while (true) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI;

            // Parametric heart formula variation
            const r = scale * 0.5;

            // Basic 2D heart extruded/rotated
            // Using a specific 3D heart formula
            // (x^2 + 9/4y^2 + z^2 - 1)^3 - x^2z^3 - 9/80y^2z^3 = 0 is implicit, hard to sample.
            // Let's use a simpler parametric approach.

            const t = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI; // slice

            // 2D Heart outline
            const hx = 16 * Math.pow(Math.sin(t), 3);
            const hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);

            // Give it some thickness
            const thickness = (Math.random() - 0.5) * 5;

            x = hx * (scale / 16);
            y = hy * (scale / 16);
            z = thickness * (scale / 10) * Math.sin(t); // slight curve

            // Add some random volume
            x += (Math.random() - 0.5);
            y += (Math.random() - 0.5);
            z += (Math.random() - 0.5) * 4;

            return new THREE.Vector3(x, y, z);
        }
    }

    private static getFlowerPoint(scale: number): THREE.Vector3 {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;

        // Rose/Flower parametric
        const k = 5; // 5 petals
        const r = scale * Math.cos(k * u) * Math.sin(v);

        const x = r * Math.cos(u) * Math.sin(v) * 2;
        const y = r * Math.sin(u) * Math.sin(v) * 2;
        const z = scale * Math.cos(v) * 0.5;

        return new THREE.Vector3(x, y, z);
    }

    private static getSaturnPoint(radius: number): THREE.Vector3 {
        // Mix of sphere (planet) and disk (rings)
        const isPlanet = Math.random() > 0.6; // 40% planet, 60% rings

        if (isPlanet) {
            return this.getSpherePoint(radius * 0.6);
        } else {
            // Ring
            const angle = Math.random() * Math.PI * 2;
            // Ring radius range
            const minR = radius * 0.8;
            const maxR = radius * 1.5;
            const r = minR + Math.random() * (maxR - minR);

            return new THREE.Vector3(
                r * Math.cos(angle),
                (Math.random() - 0.5) * 0.5, // Thin disk
                r * Math.sin(angle)
            ).applyAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), Math.PI * 0.2); // Tilt
        }
    }

    private static getBuddhaPoint(scale: number): THREE.Vector3 {
        // Procedural approximation of a seated figure (Head, Body, Legs)
        const rand = Math.random();

        if (rand < 0.2) {
            // Head (Sphere at top)
            const p = this.getSpherePoint(scale * 0.25);
            p.y += scale * 0.6;
            return p;
        } else if (rand < 0.6) {
            // Body (Ellipsoid center)
            const p = this.getSpherePoint(scale * 0.4);
            p.y += scale * 0.1;
            p.x *= 1.2; // wider shoulders
            return p;
        } else {
            // Legs (Wide base/Lotus)
            const p = this.getSpherePoint(scale * 0.5);
            p.y -= scale * 0.3;
            p.x *= 1.8; // Wide knees
            p.z *= 1.2;
            return p;
        }
    }
}