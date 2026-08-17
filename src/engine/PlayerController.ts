import * as THREE from 'three';
import { BoundingBox3D, ControlState } from '../types';
import { soundSystem } from '../audio/SoundSystem';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private colliders: BoundingBox3D[] = [];

  // Movement parameters
  public walkSpeed = 2.8;
  public eyeHeight = 1.65;
  private playerRadius = 0.28;

  // Camera look rotation (in radians)
  // yaw = 0 faces North (Z = -4), pitch = 0 is horizontal level
  public pitch = 0;
  public yaw = 0;

  // Controls state
  public controls: ControlState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    running: false,
  };

  // Mouse drag look state (works with or without pointer lock)
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Touch look state
  private isTouching = false;
  private lastTouchX = 0;
  private lastTouchY = 0;

  // Head bobbing & footsteps
  private distanceTraveled = 0;
  private stepDistanceThreshold = 1.5;
  private bobTimer = 0;

  // Pointer lock state
  public isPointerLocked = false;
  private domElement: HTMLElement | null = null;

  constructor(camera: THREE.PerspectiveCamera, startPos = new THREE.Vector3(0, 1.65, 2.6)) {
    this.camera = camera;
    this.position = startPos.clone();
    this.velocity = new THREE.Vector3();
    this.updateCameraTransform();
  }

  public setColliders(colliders: BoundingBox3D[]) {
    this.colliders = colliders;
  }

  public initListeners(domElement: HTMLElement) {
    this.domElement = domElement;

    // Keyboard controls
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Pointer lock listener
    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    // Mouse look listeners (works with pointer lock OR mouse drag)
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);

    // Touch look on canvas (multi-touch supported)
    domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    domElement.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  public cleanup() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);

    if (this.domElement) {
      this.domElement.removeEventListener('touchstart', this.onTouchStart);
      this.domElement.removeEventListener('touchmove', this.onTouchMove);
      this.domElement.removeEventListener('touchend', this.onTouchEnd);
    }
  }

  public requestPointerLock() {
    if (this.domElement && !this.isPointerLocked) {
      try {
        this.domElement.requestPointerLock();
      } catch (e) {
        console.warn('Pointer lock request notice:', e);
      }
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  };

  private onMouseDown = (e: MouseEvent) => {
    // Only engage drag if clicking inside canvas or game container (not on buttons)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.glass-button') || target.closest('input')) {
      return;
    }
    this.isMouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    let deltaX = 0;
    let deltaY = 0;

    if (this.isPointerLocked) {
      deltaX = e.movementX || 0;
      deltaY = e.movementY || 0;
    } else if (this.isMouseDown) {
      deltaX = e.clientX - this.lastMouseX;
      deltaY = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    } else {
      return;
    }

    const sensitivity = this.isPointerLocked ? 0.0024 : 0.0035;
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;

    // Clamp pitch to avoid neck snapping (-82 deg to +82 deg)
    const maxPitch = (Math.PI / 2) * 0.90;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.updateCameraTransform();
  };

  private onTouchStart = (e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      // Only track if touch is in look area (upper or right side)
      if (touch.clientY < window.innerHeight * 0.75 || touch.clientX > window.innerWidth * 0.5) {
        this.isTouching = true;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        break;
      }
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.isTouching) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.clientY < window.innerHeight * 0.75 || touch.clientX > window.innerWidth * 0.5) {
        const deltaX = touch.clientX - this.lastTouchX;
        const deltaY = touch.clientY - this.lastTouchY;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;

        const touchSensitivity = 0.004;
        this.yaw -= deltaX * touchSensitivity;
        this.pitch -= deltaY * touchSensitivity;

        const maxPitch = (Math.PI / 2) * 0.90;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        this.updateCameraTransform();
        break;
      }
    }
  };

  private onTouchEnd = () => {
    this.isTouching = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.controls.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.controls.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.controls.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.controls.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.controls.running = true;
        break;
      default:
        // Key-based fallback
        if (key === 'w' || key === 'arrowup') this.controls.forward = true;
        else if (key === 's' || key === 'arrowdown') this.controls.backward = true;
        else if (key === 'a' || key === 'arrowleft') this.controls.left = true;
        else if (key === 'd' || key === 'arrowright') this.controls.right = true;
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.controls.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.controls.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.controls.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.controls.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.controls.running = false;
        break;
      default:
        // Key-based fallback
        if (key === 'w' || key === 'arrowup') this.controls.forward = false;
        else if (key === 's' || key === 'arrowdown') this.controls.backward = false;
        else if (key === 'a' || key === 'arrowleft') this.controls.left = false;
        else if (key === 'd' || key === 'arrowright') this.controls.right = false;
        break;
    }
  };

  /**
   * Updates player position with collision detection and smooth sliding
   */
  public update(delta: number) {
    // Forward vector facing horizontally based on camera yaw
    // When yaw = 0, camera faces -Z (North)
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveVector = new THREE.Vector3(0, 0, 0);

    if (this.controls.forward) moveVector.add(forward);
    if (this.controls.backward) moveVector.sub(forward);
    if (this.controls.right) moveVector.add(right);
    if (this.controls.left) moveVector.sub(right);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      const currentSpeed = this.walkSpeed * (this.controls.running ? 1.4 : 1.0);
      const targetVel = moveVector.multiplyScalar(currentSpeed);
      this.velocity.lerp(targetVel, Math.min(1.0, 14 * delta));
    } else {
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, 16 * delta));
    }

    // Step calculation & collision detection on separate X and Z axes for smooth wall sliding
    const stepX = this.velocity.x * delta;
    const stepZ = this.velocity.z * delta;

    // Test X movement
    if (Math.abs(stepX) > 0.0001) {
      const testPosX = this.position.clone();
      testPosX.x += stepX;
      if (!this.checkCollision(testPosX)) {
        this.position.x = testPosX.x;
      }
    }

    // Test Z movement
    if (Math.abs(stepZ) > 0.0001) {
      const testPosZ = this.position.clone();
      testPosZ.z += stepZ;
      if (!this.checkCollision(testPosZ)) {
        this.position.z = testPosZ.z;
      }
    }

    // Measure movement for footsteps & head bobbing
    const actualStep = Math.sqrt(stepX * stepX + stepZ * stepZ);
    if (this.velocity.lengthSq() > 0.05) {
      this.distanceTraveled += actualStep;
      this.bobTimer += delta * (this.controls.running ? 10 : 7.5);

      if (this.distanceTraveled >= this.stepDistanceThreshold) {
        soundSystem.playFootstep();
        this.distanceTraveled = 0;
      }
    } else {
      // Return bob smoothly to neutral
      this.bobTimer = 0;
    }

    this.updateCameraTransform();
  }

  /**
   * Collision check against all room bounding boxes
   */
  private checkCollision(targetPos: THREE.Vector3): boolean {
    const r = this.playerRadius;
    const pMin = { x: targetPos.x - r, y: 0.1, z: targetPos.z - r };
    const pMax = { x: targetPos.x + r, y: 1.8, z: targetPos.z + r };

    for (const box of this.colliders) {
      // Simple AABB overlap check
      const overlapX = pMin.x <= box.max.x && pMax.x >= box.min.x;
      const overlapY = pMin.y <= box.max.y && pMax.y >= box.min.y;
      const overlapZ = pMin.z <= box.max.z && pMax.z >= box.min.z;

      if (overlapX && overlapY && overlapZ) {
        return true; // Collision detected!
      }
    }
    return false;
  }

  /**
   * Update Three.js camera position and rotation with subtle head-bobbing
   */
  public updateCameraTransform() {
    const bobOffset = Math.sin(this.bobTimer) * 0.025;

    this.camera.position.set(
      this.position.x,
      this.eyeHeight + bobOffset,
      this.position.z
    );

    // Apply Euler rotation (Yaw around Y, Pitch around X)
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.y = this.yaw;
    euler.x = this.pitch;
    this.camera.quaternion.setFromEuler(euler);
  }

  public getForwardVector(): THREE.Vector3 {
    const vector = new THREE.Vector3();
    this.camera.getWorldDirection(vector);
    return vector;
  }

  public setLookAt(target: THREE.Vector3) {
    const dir = target.clone().sub(this.camera.position).normalize();
    this.yaw = Math.atan2(-dir.x, -dir.z);
    this.pitch = Math.asin(dir.y);
    this.updateCameraTransform();
  }
}
