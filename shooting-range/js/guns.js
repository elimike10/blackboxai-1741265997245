import * as THREE from 'three';

export class Gun {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.clock = new THREE.Clock();
        this.gun = null;
        this.muzzleFlash = null;
        this.isReloading = false;
        this.currentAmmo = 30;
        this.maxAmmo = 30;
        this.raycaster = new THREE.Raycaster();
        
        this.init();
    }

    async init() {
        try {
            // Create a simple gun mesh
            const gunGroup = new THREE.Group();

            // Main body
            const bodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x222222,
                roughness: 0.5,
                metalness: 0.8
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            gunGroup.add(body);

            // Magazine
            const magGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.1);
            const magMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333,
                roughness: 0.7,
                metalness: 0.6
            });
            const magazine = new THREE.Mesh(magGeometry, magMaterial);
            magazine.position.set(0, -0.12, 0);
            gunGroup.add(magazine);

            // Barrel
            const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const barrelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                roughness: 0.4,
                metalness: 0.9
            });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.z = Math.PI / 2;
            barrel.position.set(0, 0, 0.3);
            gunGroup.add(barrel);

            this.gun = gunGroup;
            
            // Position the gun in view
            this.gun.position.set(0.3, -0.3, -0.5);
            this.gun.rotation.y = Math.PI;
            
            // Add gun to camera so it moves with view
            this.camera.add(this.gun);
            
            // Setup muzzle flash
            this.setupMuzzleFlash();
            
            // Update ammo display
            this.updateAmmoDisplay();
            
        } catch (error) {
            console.error('Error creating gun model:', error);
        }
    }

    setupMuzzleFlash() {
        const flashGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.muzzleFlash.position.set(0, 0, 0.4);
        this.gun.add(this.muzzleFlash);
    }

    async shoot() {
        if (this.isReloading || this.currentAmmo <= 0) {
            if (this.currentAmmo <= 0) {
                this.reload();
            }
            return null;
        }

        // Decrease ammo
        this.currentAmmo--;
        this.updateAmmoDisplay();

        // Show muzzle flash
        this.showMuzzleFlash();

        // Add recoil effect
        this.addRecoil();

        // Play sound
        this.playGunSound();

        // Calculate shooting ray
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Return ray intersection for hit detection
        return this.raycaster.ray.origin;
    }

    showMuzzleFlash() {
        if (this.muzzleFlash) {
            this.muzzleFlash.material.opacity = 1;
            
            // Random rotation for variety
            this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
            
            // Hide after short duration
            setTimeout(() => {
                this.muzzleFlash.material.opacity = 0;
            }, 50);
        }
    }

    addRecoil() {
        if (this.gun) {
            // Original position
            const originalPos = this.gun.position.clone();
            
            // Add recoil
            this.gun.position.z += 0.05;
            
            // Return to original position
            setTimeout(() => {
                this.gun.position.copy(originalPos);
            }, 100);
        }
    }

    playGunSound() {
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator for simple gunshot sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set sound parameters
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        // Play sound
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    reload() {
        if (!this.isReloading) {
            this.isReloading = true;
            
            setTimeout(() => {
                this.currentAmmo = this.maxAmmo;
                this.isReloading = false;
                this.updateAmmoDisplay();
            }, 2000); // 2 second reload time
        }
    }

    updateAmmoDisplay() {
        document.getElementById('current-ammo').textContent = this.currentAmmo;
        document.getElementById('max-ammo').textContent = this.maxAmmo;
    }

    update() {
        // Add weapon sway
        if (this.gun) {
            const time = this.clock.getElapsedTime();
            const swayAmount = 0.002;
            
            this.gun.position.y = -0.3 + Math.sin(time * 2) * swayAmount;
            this.gun.position.x = 0.3 + Math.cos(time * 2) * swayAmount;
        }
    }
}
