export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: Vector3D;
  max: Vector3D;
  name: string;
  isDoor?: boolean;
}

export type InteractionType = 'door' | 'light_switch' | 'drawer' | 'chair' | 'note' | 'radio' | 'window';

export interface InteractableObject {
  id: string;
  type: InteractionType;
  name: string;
  actionText: string;
  position: Vector3D;
  radius: number;
  isOpen?: boolean;
  isOn?: boolean;
  data?: any;
}

export interface HorrorEventTrigger {
  id: string;
  name: string;
  triggerPosition: Vector3D;
  triggerRadius: number;
  hasTriggered: boolean;
  isOneShot: boolean;
  onTrigger: () => void;
}

export interface DiaryNote {
  id: string;
  title: string;
  content: string;
  date?: string;
}

export interface ControlState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  running: boolean;
}

export interface TelemetryData {
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

