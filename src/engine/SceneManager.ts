import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { RoomBuilder, RoomBuildResult } from './RoomBuilder';
import { InteractionSystem, InteractionCallbackOptions } from './InteractionSystem';
import { EventSystem, EventSystemCallbacks } from './EventSystem';
import { InteractableObject } from '../types';
import { soundSystem } from '../audio/SoundSystem';

export interface SceneManagerTelemetry {
  x: number;
  y: number;
  z: number;
  camX: number;
  camY: number;
  camZ: number;
  heading: string;
  fov: number;
  fps: number;
  frames: number;
  objectCount: number;
  collidersCount: number;
  webglOk: boolean;
  renderLoopRunning: boolean;
}

export interface SceneManagerOptions {
  container: HTMLElement;
  onInteractTargetChange?: (target: InteractableObject | null) => void;
  onShowNote?: (note: { title: string; content: string; date?: string }) => void;
  onMessage?: (msg: string) => void;
  onFlickerChange?: (flickering: boolean) => void;
  onHeartbeatChange?: (active: boolean) => void;
  onJumpScare?: () => void;
  onTelemetry?: (telemetry: SceneManagerTelemetry) => void;
}

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public player: PlayerController;
  public interaction: InteractionSystem;
  public events: EventSystem;

  private container: HTMLElement;
  private roomData: RoomBuildResult | null = null;
  private flashlight: THREE.SpotLight | null = null;
  private flashlightTarget: THREE.Object3D | null = null;
  public isFlashlightOn = true;

  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isRunning = false;
  private options: SceneManagerOptions;

  // Frame & Debug diagnostics
  private frames = 0;
  private fps = 60;
  private lastFpsUpdate = 0;
  private frameCountSinceFps = 0;

  // Visual effects
  private moonLight: THREE.DirectionalLight | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: SceneManagerOptions) {
    this.options = options;
    this.container = options.container;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030406);
    this.scene.fog = new THREE.FogExp2(0x05070a, 0.075);

    // 2. Camera (70 FOV, 1.65m human eye height)
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, Math.max(0.1, width / (height || 1)), 0.08, 40.0);

    // 3. Renderer with shadow maps & cinematic tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);

    // 4. Player & Systems
    this.player = new PlayerController(this.camera, new THREE.Vector3(0, 1.65, 2.6));
    this.player.initListeners(this.renderer.domElement);

    const interactionCallbacks: InteractionCallbackOptions = {
      onShowNote: options.onShowNote,
      onMessage: options.onMessage,
    };
    this.interaction = new InteractionSystem(this.camera, interactionCallbacks);

    const eventCallbacks: EventSystemCallbacks = {
      onMessage: options.onMessage,
      onFlickerStateChange: options.onFlickerChange,
      onHeartbeatChange: options.onHeartbeatChange,
      onJumpScareEffect: options.onJumpScare,
    };
    this.events = new EventSystem(eventCallbacks);

    // 5. Lighting
    this.setupLighting();

    // 6. Build Room
    this.buildRoom();

    // 7. Event listeners & observer
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.onWindowResize();
      });
      this.resizeObserver.observe(this.container);
    }

    // Diagnostics log
    console.log('WEBGL INITIALIZED');
    console.log('CANVAS SIZE', width, height);
    console.log('PLAYER POSITION', this.player.position);

    // Attach development debug hook
    if (typeof window !== 'undefined') {
      (window as any).__HORROR_DEBUG__ = {
        sceneManager: this,
        player: this.player,
        renderer: this.renderer,
        frames: 0,
        fps: 60,
      };
    }

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  private setupLighting() {
    // Dim ambient light
    const ambientLight = new THREE.AmbientLight(0x0d121c, 0.3);
    this.scene.add(ambientLight);

    // Cold blue moonlight shining into the room through North window
    const moonLight = new THREE.DirectionalLight(0x4a6d96, 0.85);
    moonLight.position.set(0, 4.2, -6.5);
    moonLight.target.position.set(0, 0.5, 0);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 15;
    moonLight.shadow.camera.left = -4;
    moonLight.shadow.camera.right = 4;
    moonLight.shadow.camera.top = 4;
    moonLight.shadow.camera.bottom = -4;
    moonLight.shadow.bias = -0.0015;

    this.scene.add(moonLight);
    this.scene.add(moonLight.target);
    this.moonLight = moonLight;

    // Player Flashlight
    const flashlight = new THREE.SpotLight(0xfff1db, 1.4, 11, Math.PI / 6, 0.55, 1.2);
    flashlight.position.set(0, 0, 0);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.shadow.bias = -0.001;

    const flashTarget = new THREE.Object3D();
    flashTarget.position.set(0, 0, -3);

    this.camera.add(flashlight);
    this.camera.add(flashTarget);
    flashlight.target = flashTarget;

    this.scene.add(this.camera);
    this.flashlight = flashlight;
    this.flashlightTarget = flashTarget;
  }

  private buildRoom() {
    this.roomData = RoomBuilder.buildRoom(this.scene);

    this.player.setColliders(this.roomData.colliders);

    this.interaction.init(
      this.roomData.interactables,
      this.roomData.doorPivot,
      this.roomData.drawerGroup,
      this.roomData.bulbMesh,
      this.roomData.lampLight
    );

    this.events.init(
      this.roomData.lampLight,
      this.roomData.bulbMesh,
      this.roomData.smilingWomanGroup,
      this.roomData.curtains
    );
  }

  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    if (this.flashlight) {
      this.flashlight.visible = this.isFlashlightOn;
    }
    soundSystem.playFlashlightClick();
    return this.isFlashlightOn;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    } else if (e.code === 'KeyE') {
      this.interaction.triggerCurrentInteraction();
    }
  };

  private animate = () => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    this.frames++;
    this.frameCountSinceFps++;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Compute FPS every 0.5s
    if (elapsedTime - this.lastFpsUpdate >= 0.5) {
      this.fps = Math.round((this.frameCountSinceFps / (elapsedTime - this.lastFpsUpdate)));
      this.frameCountSinceFps = 0;
      this.lastFpsUpdate = elapsedTime;

      if (typeof window !== 'undefined' && (window as any).__HORROR_DEBUG__) {
        (window as any).__HORROR_DEBUG__.frames = this.frames;
        (window as any).__HORROR_DEBUG__.fps = this.fps;
        (window as any).__HORROR_DEBUG__.playerPos = this.player.position;
        (window as any).__HORROR_DEBUG__.cameraPos = this.camera.position;
      }
    }

    // 1. Update player movement and collision
    this.player.update(delta);

    // Report player telemetry (heading, coordinates, debug metrics)
    if (this.options.onTelemetry) {
      const normalizedYaw = ((this.player.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let heading = 'N';
      const deg = (normalizedYaw * 180) / Math.PI;
      if (deg >= 337.5 || deg < 22.5) heading = 'N';
      else if (deg >= 22.5 && deg < 67.5) heading = 'NW';
      else if (deg >= 67.5 && deg < 112.5) heading = 'W';
      else if (deg >= 112.5 && deg < 157.5) heading = 'SW';
      else if (deg >= 157.5 && deg < 202.5) heading = 'S';
      else if (deg >= 202.5 && deg < 247.5) heading = 'SE';
      else if (deg >= 247.5 && deg < 292.5) heading = 'E';
      else heading = 'NE';

      this.options.onTelemetry({
        x: Math.round(this.player.position.x * 100) / 100,
        y: Math.round(this.player.position.y * 100) / 100,
        z: Math.round(this.player.position.z * 100) / 100,
        camX: Math.round(this.camera.position.x * 100) / 100,
        camY: Math.round(this.camera.position.y * 100) / 100,
        camZ: Math.round(this.camera.position.z * 100) / 100,
        heading,
        fov: 70,
        fps: this.fps,
        frames: this.frames,
        objectCount: this.scene.children.length,
        collidersCount: (this.roomData?.colliders?.length || 0),
        webglOk: true,
        renderLoopRunning: this.isRunning,
      });
    }

    // 2. Update interaction detection
    const currentTarget = this.interaction.update(delta);
    if (this.options.onInteractTargetChange) {
      this.options.onInteractTargetChange(currentTarget);
    }

    // 3. Update horror events
    this.events.update(this.player.position, this.player.getForwardVector(), delta);

    // 4. Floating dust particles animation
    if (this.roomData?.dustParticles) {
      const positions = this.roomData.dustParticles.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        let x = positions.getX(i);
        let z = positions.getZ(i);

        y -= delta * 0.04;
        x += Math.sin(elapsedTime * 0.5 + i) * 0.001;
        z += Math.cos(elapsedTime * 0.4 + i) * 0.001;

        if (y < 0) y = 3.1;
        positions.setY(i, y);
        positions.setX(i, x);
        positions.setZ(i, z);
      }
      positions.needsUpdate = true;
    }

    // 5. Light fixture subtle natural swing
    if (this.roomData?.lightFixture) {
      this.roomData.lightFixture.rotation.z = Math.sin(elapsedTime * 0.8) * 0.02;
      this.roomData.lightFixture.rotation.x = Math.cos(elapsedTime * 0.6) * 0.015;
    }

    // 6. Window curtains gentle draft sway
    if (this.roomData?.curtains) {
      this.roomData.curtains.forEach((curtain, idx) => {
        curtain.rotation.z = Math.sin(elapsedTime * 1.2 + idx) * 0.015;
      });
    }

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  public cleanup() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.player.cleanup();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
