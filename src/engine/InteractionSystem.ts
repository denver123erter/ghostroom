import * as THREE from 'three';
import { InteractableObject } from '../types';
import { soundSystem } from '../audio/SoundSystem';

export interface InteractionCallbackOptions {
  onShowNote?: (note: { title: string; content: string; date?: string }) => void;
  onMessage?: (msg: string) => void;
}

export class InteractionSystem {
  private interactables: InteractableObject[] = [];
  private currentTarget: InteractableObject | null = null;
  private camera: THREE.PerspectiveCamera;
  private doorPivot: THREE.Group | null = null;
  private drawerGroup: THREE.Group | null = null;
  private bulbMesh: THREE.Mesh | null = null;
  private lampLight: THREE.PointLight | null = null;

  // Animation states
  private isDoorAnimating = false;
  private targetDoorAngle = 0;
  private isDrawerAnimating = false;
  private targetDrawerX = 0;

  private callbacks: InteractionCallbackOptions = {};

  constructor(camera: THREE.PerspectiveCamera, callbacks: InteractionCallbackOptions = {}) {
    this.camera = camera;
    this.callbacks = callbacks;
  }

  public init(
    interactables: InteractableObject[],
    doorPivot: THREE.Group,
    drawerGroup: THREE.Group,
    bulbMesh: THREE.Mesh,
    lampLight: THREE.PointLight
  ) {
    this.interactables = interactables;
    this.doorPivot = doorPivot;
    this.drawerGroup = drawerGroup;
    this.bulbMesh = bulbMesh;
    this.lampLight = lampLight;
  }

  public update(delta: number): InteractableObject | null {
    // Check distance and line of sight from camera to interactable positions
    const camPos = this.camera.position;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    let closestObj: InteractableObject | null = null;
    let closestDist = Infinity;

    for (const obj of this.interactables) {
      const objPos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
      const dist = camPos.distanceTo(objPos);

      if (dist <= obj.radius) {
        // Check if player is facing roughly towards the object
        const dirToObj = objPos.clone().sub(camPos).normalize();
        const dot = forward.dot(dirToObj);

        if (dot > 0.45 && dist < closestDist) {
          closestDist = dist;
          closestObj = obj;
        }
      }
    }

    this.currentTarget = closestObj;

    // Animate door
    if (this.doorPivot && this.isDoorAnimating) {
      this.doorPivot.rotation.y = THREE.MathUtils.lerp(
        this.doorPivot.rotation.y,
        this.targetDoorAngle,
        6 * delta
      );
      if (Math.abs(this.doorPivot.rotation.y - this.targetDoorAngle) < 0.01) {
        this.doorPivot.rotation.y = this.targetDoorAngle;
        this.isDoorAnimating = false;
      }
    }

    // Animate drawer
    if (this.drawerGroup && this.isDrawerAnimating) {
      this.drawerGroup.position.x = THREE.MathUtils.lerp(
        this.drawerGroup.position.x,
        this.targetDrawerX,
        7 * delta
      );
      if (Math.abs(this.drawerGroup.position.x - this.targetDrawerX) < 0.005) {
        this.drawerGroup.position.x = this.targetDrawerX;
        this.isDrawerAnimating = false;
      }
    }

    return this.currentTarget;
  }

  public triggerCurrentInteraction() {
    if (!this.currentTarget) return;
    this.interact(this.currentTarget);
  }

  public interact(obj: InteractableObject) {
    switch (obj.type) {
      case 'door':
        this.toggleDoor(obj);
        break;
      case 'drawer':
        this.toggleDrawer(obj);
        break;
      case 'light_switch':
        this.toggleLight(obj);
        break;
      case 'radio':
        this.toggleRadio(obj);
        break;
      case 'note':
        if (obj.data && this.callbacks.onShowNote) {
          soundSystem.playSound('paper');
          this.callbacks.onShowNote(obj.data);
        }
        break;
      case 'chair':
        if (this.callbacks.onMessage) {
          soundSystem.playSound('creak');
          this.callbacks.onMessage("The chair is cold as ice. The wood feels recently worn...");
        }
        break;
      case 'window':
        if (this.callbacks.onMessage) {
          soundSystem.playSound('creak');
          this.callbacks.onMessage("A thick freezing fog coats the glass. You cannot see what's watching outside.");
        }
        break;
    }
  }

  private toggleDoor(obj: InteractableObject) {
    obj.isOpen = !obj.isOpen;
    this.targetDoorAngle = obj.isOpen ? -Math.PI * 0.45 : 0;
    this.isDoorAnimating = true;
    soundSystem.playDoorCreak(obj.isOpen);
  }

  private toggleDrawer(obj: InteractableObject) {
    obj.isOpen = !obj.isOpen;
    this.targetDrawerX = obj.isOpen ? -0.42 : 0;
    this.isDrawerAnimating = true;
    soundSystem.playDrawerSlide();
    if (obj.isOpen && this.callbacks.onMessage) {
      this.callbacks.onMessage("You opened the drawer. An old rusted key rests on yellowed felt.");
    }
  }

  private toggleLight(obj: InteractableObject) {
    obj.isOn = !obj.isOn;
    soundSystem.playSwitchClick();

    if (this.lampLight) {
      this.lampLight.visible = !!obj.isOn;
    }
    if (this.bulbMesh) {
      const mat = this.bulbMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = obj.isOn ? 0.8 : 0.02;
      }
    }
  }

  private toggleRadio(obj: InteractableObject) {
    obj.isOn = !obj.isOn;
    soundSystem.playSwitchClick();
    if (obj.isOn) {
      soundSystem.playGhostWhisper();
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage("The radio emits a faint distorted music box tune through heavy static...");
      }
    } else {
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage("Radio switched off.");
      }
    }
  }
}
