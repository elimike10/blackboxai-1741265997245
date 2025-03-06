import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Gun } from './guns.js';
import { TargetSystem } from './targets.js';

class ShootingRange {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.gun = null;
        this.targetSystem = null;
        this.isGameActive = false;
        this.score = 0;

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 1.6, 0); // Average human height
        
        // Setup controls
        this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
        
        // Setup lighting
        this.setupLighting();
        
        // Setup environment
        this.setupEnvironment();
        
        // Initialize gun and targets
        this.gun = new Gun(this.scene, this.camera);
        this.targetSystem = new TargetSystem(this.scene);

        // Event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        this.scene.add(sunLight);
    }

    setupEnvironment() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3c3c3c,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Walls
        this.createWall(0, 5, -50, 100, 10, 1); // Back wall
        this.createWall(-50, 5, 0, 1, 10, 100); // Left wall
        this.createWall(50, 5, 0, 1, 10, 100); // Right wall
    }

    createWall(x, y, z, width, height, depth) {
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.2
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
    }

    setupEventListeners() {
        // Click to start
        const blocker = document.getElementById('blocker');
        const instructions = document.getElementById('instructions');

        instructions.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
            document.getElementById('hud').classList.remove('hidden');
            this.isGameActive = true;
        });

        this.controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
            document.getElementById('hud').classList.add('hidden');
            this.isGameActive = false;
        });

        // Shooting
        document.addEventListener('click', () => {
            if (this.isGameActive && this.gun) {
                this.gun.shoot().then(intersection => {
                    if (intersection && this.targetSystem.checkHit(intersection)) {
                        this.updateScore(10);
                    }
                });
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isGameActive) {
            if (this.gun) this.gun.update();
            if (this.targetSystem) this.targetSystem.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the shooting range when the page loads
window.addEventListener('load', () => {
    try {
        new ShootingRange();
    } catch (error) {
        console.error('Failed to initialize shooting range:', error);
        document.getElementById('instructions').innerHTML = `
            <h1>Error</h1>
            <p>Failed to initialize the shooting range. Please ensure your browser supports WebGL.</p>
        `;
    }
});
