import * as THREE from 'three';

export class TargetSystem {
    constructor(scene) {
        this.scene = scene;
        this.targets = [];
        this.targetPositions = [
            { x: -8, y: 1.5, z: -20 },
            { x: 0, y: 1.5, z: -25 },
            { x: 8, y: 1.5, z: -20 },
            { x: -15, y: 1.5, z: -30 },
            { x: 15, y: 1.5, z: -30 },
            { x: -4, y: 1.5, z: -35 },
            { x: 4, y: 1.5, z: -35 }
        ];
        
        this.init();
    }

    init() {
        // Create targets
        this.targetPositions.forEach(position => {
            this.createTarget(position);
        });
    }

    createTarget(position) {
        // Create target group
        const targetGroup = new THREE.Group();
        
        // Create target stand
        const standGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
        const standMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a,
            roughness: 0.7,
            metalness: 0.3
        });
        const stand = new THREE.Mesh(standGeometry, standMaterial);
        stand.position.y = 1.5;
        stand.castShadow = true;
        targetGroup.add(stand);

        // Create target plate
        const plateGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
        const plateMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.2
        });
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        plate.position.y = 2.5;
        plate.position.z = 0.1;
        plate.castShadow = true;
        targetGroup.add(plate);

        // Create target circles
        this.createTargetCircles(plate);

        // Set target position
        targetGroup.position.set(position.x, position.y, position.z);

        // Add to scene and targets array
        this.scene.add(targetGroup);
        this.targets.push({
            group: targetGroup,
            plate: plate,
            isHit: false,
            originalRotation: plate.rotation.x,
            hitTime: 0
        });
    }

    createTargetCircles(plate) {
        const circles = [
            { radius: 0.6, color: 0x000000 },
            { radius: 0.45, color: 0xffffff },
            { radius: 0.3, color: 0x000000 },
            { radius: 0.15, color: 0xff0000 }
        ];

        circles.forEach(circle => {
            const circleGeometry = new THREE.CircleGeometry(circle.radius, 32);
            const circleMaterial = new THREE.MeshStandardMaterial({ 
                color: circle.color,
                side: THREE.DoubleSide,
                roughness: 0.8
            });
            const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
            circleMesh.position.z = 0.06;
            plate.add(circleMesh);
        });
    }

    checkHit(rayOrigin) {
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.scene.camera.quaternion);
        raycaster.set(rayOrigin, direction);

        for (let target of this.targets) {
            if (!target.isHit) {
                const intersects = raycaster.intersectObject(target.plate, true);
                if (intersects.length > 0) {
                    this.hitTarget(target, intersects[0].point);
                    return true;
                }
            }
        }
        return false;
    }

    hitTarget(target, hitPoint) {
        if (!target.isHit) {
            target.isHit = true;
            target.hitTime = Date.now();

            // Animate target on hit
            this.animateHit(target);

            // Create hit effect
            this.createHitEffect(target.plate, hitPoint);

            // Reset target after delay
            setTimeout(() => {
                this.resetTarget(target);
            }, 2000);
        }
    }

    animateHit(target) {
        // Rotate target plate backwards
        const hitRotation = -Math.PI / 2;
        target.plate.rotation.x = hitRotation;
    }

    createHitEffect(plate, hitPoint) {
        // Create particle effect for hit
        const particleCount = 15;
        const particles = new THREE.Group();

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.05, 0.05),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );

            // Position particles around hit point
            particle.position.copy(hitPoint);
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += (Math.random() - 0.5) * 0.5;
            particle.position.z += 0.1;

            // Add random velocity
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.1
            );

            particles.add(particle);
        }

        plate.add(particles);

        // Remove particles after animation
        setTimeout(() => {
            plate.remove(particles);
        }, 1000);
    }

    resetTarget(target) {
        target.isHit = false;
        target.plate.rotation.x = target.originalRotation;
    }

    update() {
        // Update particle effects
        this.targets.forEach(target => {
            if (target.isHit) {
                const particles = target.plate.children.find(child => child instanceof THREE.Group);
                if (particles) {
                    particles.children.forEach(particle => {
                        particle.position.add(particle.userData.velocity);
                        particle.userData.velocity.y -= 0.001; // gravity
                    });
                }
            }
        });
    }
}
