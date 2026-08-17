import * as THREE from 'three';
import { HorrorEventTrigger } from '../types';
import { soundSystem } from '../audio/SoundSystem';

export interface EventSystemCallbacks {
  onMessage?: (msg: string) => void;
  onFlickerStateChange?: (flickering: boolean) => void;
  onHeartbeatChange?: (active: boolean) => void;
  onJumpScareEffect?: () => void;
}

export class EventSystem {
  private triggers: HorrorEventTrigger[] = [];
  private callbacks: EventSystemCallbacks = {};
  private lampLight: THREE.PointLight | null = null;
  private bulbMesh: THREE.Mesh | null = null;
  private smilingWomanGroup: THREE.Group | null = null;
  private curtains: THREE.Mesh[] = [];

  // Smiling Woman Event State Machine
  public smilingWomanState: 'idle' | 'triggered' | 'flickering' | 'seated' | 'looked_away' | 'vanished' = 'idle';
  private chairPosition = new THREE.Vector3(-2.2, 0.6, 2.0);
  private hasLookedAwayFromWoman = false;

  // Light flicker state
  private isFlickering = false;
  private flickerTimer = 0;
  private originalLightIntensity = 1.2;

  constructor(callbacks: EventSystemCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public init(
    lampLight: THREE.PointLight,
    bulbMesh: THREE.Mesh,
    smilingWomanGroup: THREE.Group,
    curtains: THREE.Mesh[]
  ) {
    this.lampLight = lampLight;
    this.bulbMesh = bulbMesh;
    this.smilingWomanGroup = smilingWomanGroup;
    this.curtains = curtains;

    this.registerDefaultHorrorTriggers();
  }

  /**
   * Register horror triggers across the room
   */
  private registerDefaultHorrorTriggers() {
    // 1. Smiling Woman Chair Trigger (South-West area near chair)
    this.triggers.push({
      id: 'smiling_woman_trigger',
      name: 'The Smiling Woman on the Chair',
      triggerPosition: { x: -1.6, y: 1.65, z: 1.4 },
      triggerRadius: 2.5,
      hasTriggered: false,
      isOneShot: true,
      onTrigger: () => this.startSmilingWomanSequence(),
    });

    // 2. Window Cold Breeze & Ghost Shadow Trigger (North window)
    this.triggers.push({
      id: 'window_shadow_trigger',
      name: 'Window Shadow & Cold Gust',
      triggerPosition: { x: 0, y: 1.65, z: -2.8 },
      triggerRadius: 1.6,
      hasTriggered: false,
      isOneShot: true,
      onTrigger: () => {
        soundSystem.playGhostWhisper();
        this.triggerCurtainShiver();
        this.showMessage("A sudden icy draft sweeps through the locked window panes...");
      },
    });

    // 3. Center Room Floorboard Groan Trigger
    this.triggers.push({
      id: 'center_creak_trigger',
      name: 'Center Creaking Floorboard',
      triggerPosition: { x: 0.3, y: 1.65, z: 0.1 },
      triggerRadius: 1.4,
      hasTriggered: false,
      isOneShot: true,
      onTrigger: () => {
        soundSystem.playCreak(1.0);
        this.triggerLightFlicker(0.8);
      },
    });

    // 4. Wardrobe Secret Trigger
    this.triggers.push({
      id: 'wardrobe_approach_trigger',
      name: 'Wardrobe Knock',
      triggerPosition: { x: 2.2, y: 1.65, z: -1.5 },
      triggerRadius: 1.5,
      hasTriggered: false,
      isOneShot: true,
      onTrigger: () => {
        soundSystem.playSound('creak');
        this.showMessage("You hear a faint muffled scratch from behind the wardrobe doors...");
      },
    });
  }

  /**
   * Evaluates proximity to triggers and updates active horror events
   */
  public update(playerPos: THREE.Vector3, cameraDir: THREE.Vector3, delta: number) {
    // Check all spatial triggers
    for (const trigger of this.triggers) {
      if (trigger.hasTriggered && trigger.isOneShot) continue;

      const triggerVec = new THREE.Vector3(
        trigger.triggerPosition.x,
        trigger.triggerPosition.y,
        trigger.triggerPosition.z
      );

      if (playerPos.distanceTo(triggerVec) <= trigger.triggerRadius) {
        trigger.hasTriggered = true;
        trigger.onTrigger();
      }
    }

    // Light flickering animation
    if (this.isFlickering && this.lampLight) {
      this.flickerTimer -= delta;
      if (this.flickerTimer <= 0) {
        this.isFlickering = false;
        this.setLightState(true, this.originalLightIntensity);
        if (this.callbacks.onFlickerStateChange) {
          this.callbacks.onFlickerStateChange(false);
        }
      } else {
        // High frequency erratic flicker
        const on = Math.random() > 0.45;
        const randIntensity = on ? (0.2 + Math.random() * this.originalLightIntensity) : 0.02;
        this.setLightState(on, randIntensity);
      }
    }

    // Handle Smiling Woman "Look-Away & Look-Back" disappear logic
    if (this.smilingWomanState === 'seated' && this.smilingWomanGroup) {
      const dirToChair = this.chairPosition.clone().sub(playerPos).normalize();
      const dot = cameraDir.dot(dirToChair);

      // Player turned away from the chair (dot < 0.2)
      if (dot < 0.2) {
        this.hasLookedAwayFromWoman = true;
      }

      // Player looked BACK at the chair after having looked away (dot > 0.7)
      if (this.hasLookedAwayFromWoman && dot > 0.7) {
        this.vanishSmilingWoman();
      }
    }
  }

  /**
   * The Smiling Woman Sequence:
   * 1. Suspense pause
   * 2. Sudden bulb flicker & electrical spark
   * 3. 0.7s total blackout
   * 4. Lights snap back on -> Woman is sitting completely still in the chair!
   * 5. Jump scare stinger & heartbeat starts
   */
  public startSmilingWomanSequence() {
    if (this.smilingWomanState !== 'idle') return;
    this.smilingWomanState = 'triggered';

    // 1. Brief pause for suspense
    setTimeout(() => {
      this.smilingWomanState = 'flickering';
      soundSystem.playLightFlickerSound();
      this.triggerLightFlicker(1.6);

      // 2. Blackout moment
      setTimeout(() => {
        this.setLightState(false, 0);

        // 3. Spawn entity on chair during blackout
        setTimeout(() => {
          if (this.smilingWomanGroup) {
            this.smilingWomanGroup.visible = true;
          }
          this.smilingWomanState = 'seated';

          // Snap light back on
          this.setLightState(true, this.originalLightIntensity);

          // Audio stinger & heartbeat
          soundSystem.playJumpScareStinger();
          soundSystem.setHeartbeatActive(true);

          if (this.callbacks.onJumpScareEffect) {
            this.callbacks.onJumpScareEffect();
          }

          if (this.callbacks.onHeartbeatChange) {
            this.callbacks.onHeartbeatChange(true);
          }

          this.showMessage("A pale woman is sitting in the chair... staring straight through you.");
        }, 600);
      }, 1000);
    }, 800);
  }

  /**
   * When the visitor looks away and looks back, she silently vanishes
   */
  private vanishSmilingWoman() {
    this.smilingWomanState = 'vanished';
    if (this.smilingWomanGroup) {
      this.smilingWomanGroup.visible = false;
    }

    soundSystem.playGhostWhisper();
    soundSystem.setHeartbeatActive(false);

    if (this.callbacks.onHeartbeatChange) {
      this.callbacks.onHeartbeatChange(false);
    }

    this.showMessage("She is gone... only cold stillness remains on the chair.");
  }

  /**
   * Reusable function: Trigger light flicker for specified duration
   */
  public triggerLightFlicker(duration = 1.2) {
    this.isFlickering = true;
    this.flickerTimer = duration;
    soundSystem.playLightFlickerSound();
    if (this.callbacks.onFlickerStateChange) {
      this.callbacks.onFlickerStateChange(true);
    }
  }

  /**
   * Reusable function: Set room light state and emissive bulb
   */
  public setLightState(enabled: boolean, intensity = 1.2) {
    if (this.lampLight) {
      this.lampLight.intensity = intensity;
      this.lampLight.visible = enabled;
    }
    if (this.bulbMesh) {
      const mat = this.bulbMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = enabled ? (intensity / this.originalLightIntensity) * 0.8 : 0.01;
      }
    }
  }

  /**
   * Shiver curtains animation when ghost breeze passes
   */
  private triggerCurtainShiver() {
    if (this.curtains.length > 0) {
      let count = 0;
      const shiverInterval = setInterval(() => {
        count++;
        this.curtains.forEach((c) => {
          c.rotation.y = Math.sin(count * 0.8) * 0.12;
        });
        if (count > 25) {
          clearInterval(shiverInterval);
          this.curtains.forEach((c) => {
            c.rotation.y = 0;
          });
        }
      }, 40);
    }
  }

  /**
   * Reusable function: Show atmospheric message in HUD
   */
  public showMessage(text: string) {
    if (this.callbacks.onMessage) {
      this.callbacks.onMessage(text);
    }
  }

  /**
   * Reusable function: Add custom horror event trigger
   */
  public addTrigger(trigger: HorrorEventTrigger) {
    this.triggers.push(trigger);
  }
}
