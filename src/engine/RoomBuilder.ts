import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureGenerator } from './TextureGenerator';
import { BoundingBox3D, InteractableObject } from '../types';

export interface RoomBuildResult {
  group: THREE.Group;
  colliders: BoundingBox3D[];
  interactables: InteractableObject[];
  doorPivot: THREE.Group;
  drawerGroup: THREE.Group;
  lightFixture: THREE.Group;
  bulbMesh: THREE.Mesh;
  smilingWomanGroup: THREE.Group;
  dustParticles: THREE.Points;
  chairGroup: THREE.Group;
  curtains: THREE.Mesh[];
  lampLight: THREE.PointLight;
}

/**
 * Builds the complete 8m x 8m horror room using detailed 3D geometry
 * and procedural horror textures, with GLTF loader integration.
 */
export class RoomBuilder {
  private static gltfLoader = new GLTFLoader();

  public static buildRoom(scene: THREE.Scene): RoomBuildResult {
    const roomGroup = new THREE.Group();
    roomGroup.name = 'HorrorRoom';

    const colliders: BoundingBox3D[] = [];
    const interactables: InteractableObject[] = [];
    const curtains: THREE.Mesh[] = [];

    // Materials
    const floorMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodPlankTexture(),
      roughness: 0.85,
      metalness: 0.1,
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createCrackedWallTexture(),
      roughness: 0.9,
      metalness: 0.05,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createCeilingTexture(),
      roughness: 0.95,
      metalness: 0.0,
    });

    const woodDarkMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createFurnitureWoodTexture('#1e1610'),
      roughness: 0.75,
      metalness: 0.1,
    });

    const woodWarmMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createFurnitureWoodTexture('#2e2117'),
      roughness: 0.7,
      metalness: 0.08,
    });

    const rustyIronMat = new THREE.MeshStandardMaterial({
      color: 0x332822,
      roughness: 0.65,
      metalness: 0.7,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      map: TextureGenerator.createWindowGlassTexture(),
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.5,
    });

    // ==========================================
    // 1. FLOOR, CEILING & WALLS (8m x 8m x 3.2m)
    // ==========================================
    const roomWidth = 8.0;
    const roomLength = 8.0;
    const roomHeight = 3.2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    ceiling.receiveShadow = true;
    roomGroup.add(ceiling);

    // Ceiling wooden support beams
    for (let bx = -3; bx <= 3; bx += 2) {
      const beamGeo = new THREE.BoxGeometry(0.2, 0.25, roomLength);
      const beam = new THREE.Mesh(beamGeo, woodDarkMat);
      beam.position.set(bx, roomHeight - 0.125, 0);
      beam.castShadow = true;
      roomGroup.add(beam);
    }

    // --- North Wall (with Window cutout) ---
    // Left part
    const nwLeft = new THREE.Mesh(new THREE.BoxGeometry(2.8, roomHeight, 0.2), wallMat);
    nwLeft.position.set(-2.6, roomHeight / 2, -roomLength / 2);
    nwLeft.receiveShadow = true;
    roomGroup.add(nwLeft);

    // Right part
    const nwRight = new THREE.Mesh(new THREE.BoxGeometry(2.8, roomHeight, 0.2), wallMat);
    nwRight.position.set(2.6, roomHeight / 2, -roomLength / 2);
    nwRight.receiveShadow = true;
    roomGroup.add(nwRight);

    // Top part above window
    const nwTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.2), wallMat);
    nwTop.position.set(0, roomHeight - 0.45, -roomLength / 2);
    nwTop.receiveShadow = true;
    roomGroup.add(nwTop);

    // Bottom part below window
    const nwBottom = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.2), wallMat);
    nwBottom.position.set(0, 0.4, -roomLength / 2);
    nwBottom.receiveShadow = true;
    roomGroup.add(nwBottom);

    // --- South Wall (with Doorway cutout) ---
    // Left part
    const swLeft = new THREE.Mesh(new THREE.BoxGeometry(3.3, roomHeight, 0.2), wallMat);
    swLeft.position.set(-2.35, roomHeight / 2, roomLength / 2);
    swLeft.receiveShadow = true;
    roomGroup.add(swLeft);

    // Right part
    const swRight = new THREE.Mesh(new THREE.BoxGeometry(3.3, roomHeight, 0.2), wallMat);
    swRight.position.set(2.35, roomHeight / 2, roomLength / 2);
    swRight.receiveShadow = true;
    roomGroup.add(swRight);

    // Top part above door
    const swTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.2), wallMat);
    swTop.position.set(0, roomHeight - 0.5, roomLength / 2);
    swTop.receiveShadow = true;
    roomGroup.add(swTop);

    // --- East Wall ---
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, roomHeight, roomLength), wallMat);
    eastWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    eastWall.receiveShadow = true;
    roomGroup.add(eastWall);

    // --- West Wall ---
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, roomHeight, roomLength), wallMat);
    westWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    westWall.receiveShadow = true;
    roomGroup.add(westWall);

    // Baseboards around the room perimeter
    const baseboardMat = woodDarkMat;
    const addBaseboard = (w: number, d: number, x: number, z: number) => {
      const bb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), baseboardMat);
      bb.position.set(x, 0.07, z);
      roomGroup.add(bb);
    };
    addBaseboard(roomWidth, 0.05, 0, -3.95);
    addBaseboard(0.05, roomLength, -3.95, 0);
    addBaseboard(0.05, roomLength, 3.95, 0);
    addBaseboard(3.2, 0.05, -2.4, 3.95);
    addBaseboard(3.2, 0.05, 2.4, 3.95);

    // Wall Colliders
    colliders.push({ min: { x: -4.2, y: 0, z: -4.2 }, max: { x: 4.2, y: 3.5, z: -3.8 }, name: 'NorthWall' });
    colliders.push({ min: { x: -4.2, y: 0, z: 3.8 }, max: { x: -0.65, y: 3.5, z: 4.2 }, name: 'SouthWallLeft' });
    colliders.push({ min: { x: 0.65, y: 0, z: 3.8 }, max: { x: 4.2, y: 3.5, z: 4.2 }, name: 'SouthWallRight' });
    colliders.push({ min: { x: 3.8, y: 0, z: -4.2 }, max: { x: 4.2, y: 3.5, z: 4.2 }, name: 'EastWall' });
    colliders.push({ min: { x: -4.2, y: 0, z: -4.2 }, max: { x: -3.8, y: 3.5, z: 4.2 }, name: 'WestWall' });

    // ==========================================
    // 2. WINDOW & CURTAINS (North Wall)
    // ==========================================
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 1.55, -3.98);

    // Outer Wooden Frame
    const winFrameGeo = new THREE.BoxGeometry(2.3, 1.6, 0.08);
    const winFrame = new THREE.Mesh(winFrameGeo, woodDarkMat);
    windowGroup.add(winFrame);

    // Window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.25), woodDarkMat);
    sill.position.set(0, -0.8, 0.08);
    windowGroup.add(sill);

    // Glass panes (6-pane grid)
    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.4), glassMat);
    glassPane.position.z = 0.01;
    windowGroup.add(glassPane);

    // Window muntins (crossbars)
    const vBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.04), woodDarkMat);
    vBar1.position.set(-0.35, 0, 0.02);
    windowGroup.add(vBar1);
    const vBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.04), woodDarkMat);
    vBar2.position.set(0.35, 0, 0.02);
    windowGroup.add(vBar2);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 0.04), woodDarkMat);
    hBar.position.set(0, 0, 0.02);
    windowGroup.add(hBar);

    // Curtains on left and right
    const curtainMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createFabricTexture('#38322c', 0.8),
      roughness: 0.95,
      side: THREE.DoubleSide,
    });

    const curtainGeo = new THREE.PlaneGeometry(0.65, 2.1, 8, 8);
    // Deform vertices slightly to give crumpled/wind look
    const posAttr = curtainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = (posAttr.getX(i) + 0.325) / 0.65;
      const v = (posAttr.getY(i) + 1.05) / 2.1;
      posAttr.setZ(i, Math.sin(u * Math.PI * 3) * 0.06 + Math.sin(v * Math.PI * 2) * 0.03);
    }
    curtainGeo.computeVertexNormals();

    const leftCurtain = new THREE.Mesh(curtainGeo, curtainMat);
    leftCurtain.position.set(-1.15, 0, 0.14);
    windowGroup.add(leftCurtain);
    curtains.push(leftCurtain);

    const rightCurtain = new THREE.Mesh(curtainGeo, curtainMat);
    rightCurtain.position.set(1.15, 0, 0.14);
    windowGroup.add(rightCurtain);
    curtains.push(rightCurtain);

    // Curtain Rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.7), rustyIronMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 0.95, 0.15);
    windowGroup.add(rod);

    roomGroup.add(windowGroup);

    // Interactable Window
    interactables.push({
      id: 'window_north',
      type: 'window',
      name: 'Fogged Window',
      actionText: 'Inspect foggy glass',
      position: { x: 0, y: 1.55, z: -3.8 },
      radius: 1.8,
    });

    // ==========================================
    // 3. WOODEN DOOR ON HINGE (South Wall)
    // ==========================================
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.25, 0.22), woodDarkMat);
    doorFrame.position.set(0, 1.1, 3.98);
    roomGroup.add(doorFrame);

    // Door Pivot Group (hinged at left side x = -0.55)
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.55, 0, 3.98);

    const doorLeafGeo = new THREE.BoxGeometry(1.1, 2.15, 0.06);
    const doorLeafMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createFurnitureWoodTexture('#231a14'),
      roughness: 0.8,
      metalness: 0.1,
    });
    const doorLeaf = new THREE.Mesh(doorLeafGeo, doorLeafMat);
    doorLeaf.position.set(0.55, 1.08, 0);
    doorLeaf.castShadow = true;
    doorLeaf.receiveShadow = true;
    doorPivot.add(doorLeaf);

    // Door Panels (recessed molding detail)
    for (let py of [0.55, 1.45]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.015), woodDarkMat);
      panel.position.set(0.55, py, 0.035);
      doorPivot.add(panel);
      const panelBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.015), woodDarkMat);
      panelBack.position.set(0.55, py, -0.035);
      doorPivot.add(panelBack);
    }

    // Door Knob & Keyhole Plate
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), rustyIronMat);
    knob.position.set(1.0, 1.05, 0.055);
    doorPivot.add(knob);

    const knobBack = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), rustyIronMat);
    knobBack.position.set(1.0, 1.05, -0.055);
    doorPivot.add(knobBack);

    roomGroup.add(doorPivot);

    // Door collider
    colliders.push({
      min: { x: -0.65, y: 0, z: 3.8 },
      max: { x: 0.65, y: 2.2, z: 4.15 },
      name: 'DoorCollider',
      isDoor: true,
    });

    interactables.push({
      id: 'door_main',
      type: 'door',
      name: 'Heavy Wooden Door',
      actionText: 'Open / Close Door',
      position: { x: 0, y: 1.1, z: 3.8 },
      radius: 1.9,
      isOpen: false,
    });

    // ==========================================
    // 4. VINTAGE BED (West Wall: x = -2.7, z = -1.8)
    // ==========================================
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-2.7, 0, -1.8);

    // Bed Wooden Frame
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 1.6), woodDarkMat);
    bedFrame.position.set(0, 0.25, 0);
    bedFrame.castShadow = true;
    bedFrame.receiveShadow = true;
    bedGroup.add(bedFrame);

    // 4 Carved Corner Posts
    for (let px of [-1.1, 1.1]) {
      for (let pz of [-0.75, 0.75]) {
        const postH = pz < 0 ? 1.4 : 0.8;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, postH, 8), woodDarkMat);
        post.position.set(px, postH / 2, pz);
        post.castShadow = true;
        bedGroup.add(post);
      }
    }

    // Carved Headboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1.55), woodDarkMat);
    headboard.position.set(-1.1, 0.8, 0);
    headboard.castShadow = true;
    bedGroup.add(headboard);

    // Stained Mattress
    const mattressMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createFabricTexture('#423c34', 0.7),
      roughness: 0.9,
    });
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 1.45), mattressMat);
    mattress.position.set(0, 0.48, 0);
    mattress.castShadow = true;
    bedGroup.add(mattress);

    // Wrinkled Dark Blanket
    const blanketMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createFabricTexture('#281f1d', 0.9),
      roughness: 0.92,
    });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.48), blanketMat);
    blanket.position.set(0.35, 0.5, 0);
    blanket.castShadow = true;
    bedGroup.add(blanket);

    // Dirty Pillow
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.75), mattressMat);
    pillow.position.set(-0.8, 0.65, 0);
    pillow.rotation.z = -0.1;
    pillow.castShadow = true;
    bedGroup.add(pillow);

    roomGroup.add(bedGroup);

    // Bed collider & interactable
    colliders.push({
      min: { x: -3.9, y: 0, z: -2.7 },
      max: { x: -1.5, y: 1.4, z: -0.9 },
      name: 'Bed',
    });

    interactables.push({
      id: 'bed_inspect',
      type: 'note',
      name: 'Stained Mattress',
      actionText: 'Examine Bloodstained Diary Page',
      position: { x: -2.7, y: 0.8, z: -1.8 },
      radius: 1.6,
      data: {
        title: "TORN JOURNAL - OCTOBER 14",
        content: "I hear her breathing inside the walls. Every night at 3:17 AM, the floorboards outside my door begin to creak. She sits on the corner chair and waits for me to blink.",
        date: "October 14, 1894"
      }
    });

    // ==========================================
    // 5. NIGHTSTAND WITH CANDLE (West Wall: x = -2.7, z = 0.0)
    // ==========================================
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.65), woodWarmMat);
    nightstand.position.set(-3.5, 0.375, -0.1);
    nightstand.castShadow = true;
    nightstand.receiveShadow = true;
    roomGroup.add(nightstand);

    // Brass Candlestick
    const candleStick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.25, 8), rustyIronMat);
    candleStick.position.set(-3.5, 0.88, -0.1);
    roomGroup.add(candleStick);

    // Wax Candle
    const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0xd4cca8, roughness: 0.6 });
    const candleWax = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), candleWaxMat);
    candleWax.position.set(-3.5, 1.05, -0.1);
    roomGroup.add(candleWax);

    // Dim Flickering Candle Flame
    const candleFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const candleFlame = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), candleFlameMat);
    candleFlame.position.set(-3.5, 1.14, -0.1);
    roomGroup.add(candleFlame);

    const candleLight = new THREE.PointLight(0xff7722, 0.6, 2.5);
    candleLight.position.set(-3.5, 1.2, -0.1);
    roomGroup.add(candleLight);

    colliders.push({
      min: { x: -3.9, y: 0, z: -0.5 },
      max: { x: -3.1, y: 1.0, z: 0.3 },
      name: 'Nightstand',
    });

    // ==========================================
    // 6. LARGE WARDROBE / CABINET WITH OPENABLE DRAWER (East Wall: x = 3.3, z = -1.5)
    // ==========================================
    const wardrobeGroup = new THREE.Group();
    wardrobeGroup.position.set(3.3, 0, -1.5);

    // Main Body
    const cabinetBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 1.7), woodDarkMat);
    cabinetBody.position.set(0, 1.2, 0);
    cabinetBody.castShadow = true;
    cabinetBody.receiveShadow = true;
    wardrobeGroup.add(cabinetBody);

    // Top Crown Molding
    const crown = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.8), woodDarkMat);
    crown.position.set(0, 2.45, 0);
    wardrobeGroup.add(crown);

    // Double Door Paneling on front (facing west x = -0.46)
    for (let pz of [-0.38, 0.38]) {
      const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.68), woodWarmMat);
      doorPanel.position.set(-0.46, 1.45, pz);
      wardrobeGroup.add(doorPanel);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12), rustyIronMat);
      handle.position.set(-0.48, 1.45, pz < 0 ? -0.1 : 0.1);
      wardrobeGroup.add(handle);
    }

    // Openable Bottom Drawer (slides along X axis)
    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0, 0.35, 0);

    const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 1.55), woodWarmMat);
    drawerFront.position.set(-0.46, 0, 0);
    drawerGroup.add(drawerFront);

    const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 1.45), woodDarkMat);
    drawerBox.position.set(-0.1, -0.04, 0);
    drawerGroup.add(drawerBox);

    const drawerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.18), rustyIronMat);
    drawerHandle.position.set(-0.49, 0, 0);
    drawerGroup.add(drawerHandle);

    // Creepy Key / Note inside drawer
    const creepyKeyMat = new THREE.MeshStandardMaterial({ color: 0x8c7853, metalness: 0.8, roughness: 0.3 });
    const creepyKey = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.14), creepyKeyMat);
    creepyKey.position.set(-0.1, 0.05, 0);
    drawerGroup.add(creepyKey);

    wardrobeGroup.add(drawerGroup);
    roomGroup.add(wardrobeGroup);

    colliders.push({
      min: { x: 2.8, y: 0, z: -2.4 },
      max: { x: 3.9, y: 2.5, z: -0.6 },
      name: 'Wardrobe',
    });

    interactables.push({
      id: 'cabinet_drawer',
      type: 'drawer',
      name: 'Old Wardrobe Drawer',
      actionText: 'Open / Close Drawer',
      position: { x: 2.9, y: 0.5, z: -1.5 },
      radius: 1.8,
      isOpen: false,
    });

    // ==========================================
    // 7. STUDY DESK WITH VINTAGE RADIO & BOOKS (East Wall: x = 3.2, z = 1.6)
    // ==========================================
    const deskGroup = new THREE.Group();
    deskGroup.position.set(3.2, 0, 1.6);

    // Desktop
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 1.7), woodWarmMat);
    deskTop.position.set(0, 0.78, 0);
    deskTop.castShadow = true;
    deskGroup.add(deskTop);

    // 4 Desk Legs
    for (let lx of [-0.35, 0.35]) {
      for (let lz of [-0.75, 0.75]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.07), woodDarkMat);
        leg.position.set(lx, 0.39, lz);
        leg.castShadow = true;
        deskGroup.add(leg);
      }
    }

    // Vintage Radio on Desk
    const radioBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.45), woodDarkMat);
    radioBody.position.set(-0.1, 0.94, -0.4);
    radioBody.castShadow = true;
    deskGroup.add(radioBody);

    const radioDial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), rustyIronMat);
    radioDial.rotation.z = Math.PI / 2;
    radioDial.position.set(-0.26, 0.94, -0.4);
    deskGroup.add(radioDial);

    // Stack of Old Books
    const bookColors = [0x541818, 0x1f3b25, 0x222238];
    bookColors.forEach((color, i) => {
      const bookMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.32), bookMat);
      book.position.set(0.05, 0.84 + i * 0.045, 0.3);
      book.rotation.y = (i * 0.15);
      book.castShadow = true;
      deskGroup.add(book);
    });

    // Scattered Diary Papers on Desk
    const paperMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createPaperTexture('DESK NOTE'),
      roughness: 0.9,
    });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), paperMat);
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = 0.3;
    paper.position.set(-0.15, 0.825, 0.05);
    deskGroup.add(paper);

    roomGroup.add(deskGroup);

    colliders.push({
      min: { x: 2.7, y: 0, z: 0.7 },
      max: { x: 3.9, y: 1.1, z: 2.5 },
      name: 'Desk',
    });

    interactables.push({
      id: 'desk_radio',
      type: 'radio',
      name: 'Antique Rotary Radio',
      actionText: 'Turn Radio Dial',
      position: { x: 2.9, y: 0.9, z: 1.2 },
      radius: 1.6,
      isOn: false,
    });

    interactables.push({
      id: 'desk_note',
      type: 'note',
      name: 'Doctor’s Final Letter',
      actionText: 'Read Doctor’s Letter',
      position: { x: 3.0, y: 0.85, z: 1.6 },
      radius: 1.6,
      data: {
        title: "CLINICAL OBSERVATION - CASE 94",
        content: "Patient Eleanor claims she is bound to the wooden chair. She smiles whenever we turn our backs. When we look into her eyes, the electric lamps flicker and die.",
        date: "November 2, 1894"
      }
    });

    // ==========================================
    // 8. THE HAUNTED CHAIR (South-West Corner: x = -2.2, z = 2.0)
    // ==========================================
    const chairGroup = new THREE.Group();
    chairGroup.name = 'HauntedChair';
    chairGroup.position.set(-2.2, 0, 2.0);
    chairGroup.rotation.y = Math.PI * 0.25; // angled facing towards room center / player entrance

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.07, 0.65), woodWarmMat);
    seat.position.set(0, 0.45, 0);
    seat.castShadow = true;
    chairGroup.add(seat);

    // 4 Chair Legs
    for (let cx of [-0.26, 0.26]) {
      for (let cz of [-0.26, 0.26]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.45, 8), woodDarkMat);
        leg.position.set(cx, 0.225, cz);
        leg.castShadow = true;
        chairGroup.add(leg);
      }
    }

    // Backrest Pillars & Slats
    const backPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), woodDarkMat);
    backPillarL.position.set(-0.28, 0.825, -0.28);
    chairGroup.add(backPillarL);

    const backPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), woodDarkMat);
    backPillarR.position.set(0.28, 0.825, -0.28);
    chairGroup.add(backPillarR);

    const topArch = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.05), woodDarkMat);
    topArch.position.set(0, 1.18, -0.28);
    chairGroup.add(topArch);

    for (let s = -0.18; s <= 0.18; s += 0.09) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.02), woodWarmMat);
      slat.position.set(s, 0.78, -0.28);
      chairGroup.add(slat);
    }

    // Armrests
    for (let ax of [-0.29, 0.29]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.55), woodDarkMat);
      arm.position.set(ax, 0.72, 0);
      chairGroup.add(arm);

      const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), woodDarkMat);
      armPost.position.set(ax, 0.58, 0.22);
      chairGroup.add(armPost);
    }

    roomGroup.add(chairGroup);

    colliders.push({
      min: { x: -2.8, y: 0, z: 1.4 },
      max: { x: -1.6, y: 1.3, z: 2.6 },
      name: 'HauntedChair',
    });

    interactables.push({
      id: 'haunted_chair',
      type: 'chair',
      name: 'Empty Wooden Chair',
      actionText: 'Examine eerie wooden chair',
      position: { x: -2.2, y: 0.6, z: 2.0 },
      radius: 1.8,
    });

    // ==========================================
    // 9. THE "SMILING WOMAN" 3D HORROR ENTITY
    // Positioned seated precisely in the chair!
    // Initially invisible until event triggers!
    // ==========================================
    const smilingWomanGroup = new THREE.Group();
    smilingWomanGroup.name = 'SmilingWomanEntity';
    smilingWomanGroup.position.set(-2.2, 0, 2.0);
    smilingWomanGroup.rotation.y = Math.PI * 0.25; // Matching chair orientation facing forward
    smilingWomanGroup.visible = false; // Hidden initially!

    // Pale skin material
    const paleSkinMat = new THREE.MeshStandardMaterial({
      color: 0xd9d3c5,
      roughness: 0.8,
      metalness: 0.05,
    });

    // Vintage black Victorian funeral dress
    const blackDressMat = new THREE.MeshStandardMaterial({
      color: 0x11100f,
      roughness: 0.9,
    });

    // Seated Dress Skirt (draped over chair seat down to floor)
    const skirtGeo = new THREE.CylinderGeometry(0.24, 0.46, 0.55, 16);
    const skirt = new THREE.Mesh(skirtGeo, blackDressMat);
    skirt.position.set(0, 0.28, 0.08);
    skirt.castShadow = true;
    smilingWomanGroup.add(skirt);

    // Torso / Bodice (rigid upright unnatural posture)
    const torsoGeo = new THREE.BoxGeometry(0.32, 0.45, 0.22);
    const torso = new THREE.Mesh(torsoGeo, blackDressMat);
    torso.position.set(0, 0.68, -0.04);
    torso.castShadow = true;
    smilingWomanGroup.add(torso);

    // Pale Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12), paleSkinMat);
    neck.position.set(0, 0.94, -0.04);
    smilingWomanGroup.add(neck);

    // Pale Head (tilted slightly, unnerving)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.08, -0.04);
    headGroup.rotation.z = 0.08; // Subtle uncanny tilt

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), paleSkinMat);
    head.scale.set(1.0, 1.25, 1.05);
    head.castShadow = true;
    headGroup.add(head);

    // Long dark straggly hair framing face
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x050404, roughness: 0.95 });
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), hairMat);
    hairBack.position.set(0, 0.02, -0.03);
    headGroup.add(hairBack);

    for (let hx of [-0.11, 0.11]) {
      const hairStrand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.45, 6), hairMat);
      hairStrand.position.set(hx, -0.15, 0.04);
      headGroup.add(hairStrand);
    }

    // Sunken Hollow Black Eye Sockets
    const eyeSocketMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeSocketMat);
    leftEye.position.set(-0.048, 0.02, 0.11);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeSocketMat);
    rightEye.position.set(0.048, 0.02, 0.11);
    headGroup.add(rightEye);

    // Tiny glint in eyes (creepy reflection)
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glintL = new THREE.Mesh(new THREE.SphereGeometry(0.005, 4, 4), glintMat);
    glintL.position.set(-0.046, 0.025, 0.13);
    headGroup.add(glintL);
    const glintR = new THREE.Mesh(new THREE.SphereGeometry(0.005, 4, 4), glintMat);
    glintR.position.set(0.05, 0.025, 0.13);
    headGroup.add(glintR);

    // The Uncanny Wide Smile (stitched / stretched dark line)
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.055, -0.06, 0.105),
      new THREE.Vector3(0, -0.09, 0.12),
      new THREE.Vector3(0.055, -0.06, 0.105)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 12, 0.006, 6, false);
    const smileMesh = new THREE.Mesh(smileGeo, new THREE.MeshBasicMaterial({ color: 0x1a0505 }));
    headGroup.add(smileMesh);

    smilingWomanGroup.add(headGroup);

    // Hands resting unnaturally flat on knees
    for (let armX of [-0.18, 0.18]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.38, 8), blackDressMat);
      arm.position.set(armX, 0.65, 0.05);
      arm.rotation.x = 0.7;
      smilingWomanGroup.add(arm);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.32, 8), blackDressMat);
      forearm.position.set(armX, 0.48, 0.22);
      forearm.rotation.x = 1.4;
      smilingWomanGroup.add(forearm);

      // Pale elongated fingers
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.1), paleSkinMat);
      hand.position.set(armX, 0.46, 0.35);
      smilingWomanGroup.add(hand);
    }

    roomGroup.add(smilingWomanGroup);

    // ==========================================
    // 10. WALL PAINTINGS & DECOR
    // ==========================================
    const createFramedPainting = (texIndex: number, width: number, height: number, pos: THREE.Vector3, rotY: number) => {
      const paintGroup = new THREE.Group();
      paintGroup.position.copy(pos);
      paintGroup.rotation.y = rotY;

      // Ornate dark frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.12, height + 0.12, 0.04), woodDarkMat);
      paintGroup.add(frame);

      // Canvas
      const canvasMat = new THREE.MeshStandardMaterial({
        map: TextureGenerator.createVintagePaintingTexture(texIndex),
        roughness: 0.8,
      });
      const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), canvasMat);
      canvasMesh.position.z = 0.025;
      paintGroup.add(canvasMesh);

      roomGroup.add(paintGroup);
    };

    // Painting 1: Victorian Lady on East Wall
    createFramedPainting(0, 0.8, 1.1, new THREE.Vector3(3.9, 1.9, 0), -Math.PI / 2);
    // Painting 2: Abandoned House Landscape on West Wall above bed
    createFramedPainting(1, 1.2, 0.8, new THREE.Vector3(-3.9, 2.1, -1.8), Math.PI / 2);
    // Painting 3: Blurred Family on South Wall
    createFramedPainting(2, 0.9, 0.9, new THREE.Vector3(-2.2, 1.9, 3.9), Math.PI);

    // ==========================================
    // 11. TATTERED RUG & SCATTERED OBJECTS
    // ==========================================
    // Area Rug on Floor
    const rugMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createRugTexture(),
      roughness: 0.95,
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.8), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.2, 0.005, 0.2);
    rug.receiveShadow = true;
    roomGroup.add(rug);

    // Toppled broken stool in corner
    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12), woodDarkMat);
    stoolSeat.position.set(2.4, 0.15, -3.2);
    stoolSeat.rotation.z = 1.1;
    roomGroup.add(stoolSeat);

    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), woodDarkMat);
    stoolLeg.position.set(2.3, 0.08, -3.05);
    stoolLeg.rotation.y = 0.6;
    roomGroup.add(stoolLeg);

    // Loose broken floor planks
    for (let i = 0; i < 3; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.9), woodDarkMat);
      plank.position.set(-1.0 + i * 0.4, 0.012, -2.8 + i * 0.2);
      plank.rotation.y = 0.2 + i * 0.3;
      roomGroup.add(plank);
    }

    // ==========================================
    // 12. HANGING CEILING LIGHT FIXTURE
    // ==========================================
    const lightFixture = new THREE.Group();
    lightFixture.position.set(0, roomHeight, 0);

    // Dangling black wire
    const wireGeo = new THREE.CylinderGeometry(0.006, 0.006, 1.2, 8);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.y = -0.6;
    lightFixture.add(wire);

    // Rusty metal cone lampshade
    const shadeGeo = new THREE.ConeGeometry(0.3, 0.2, 16, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x221a14,
      roughness: 0.7,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = -1.2;
    lightFixture.add(shade);

    // Light socket & bulb
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08), rustyIronMat);
    socket.position.y = -1.22;
    lightFixture.add(socket);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffebad,
      emissive: 0xffaa22,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), bulbMat);
    bulbMesh.position.y = -1.28;
    lightFixture.add(bulbMesh);

    // PointLight attached to bulb
    const lampLight = new THREE.PointLight(0xffb84d, 1.2, 9.0);
    lampLight.position.y = -1.32;
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.width = 1024;
    lampLight.shadow.mapSize.height = 1024;
    lampLight.shadow.bias = -0.002;
    lightFixture.add(lampLight);

    roomGroup.add(lightFixture);

    interactables.push({
      id: 'ceiling_light',
      type: 'light_switch',
      name: 'Hanging Lamp',
      actionText: 'Toggle Room Light',
      position: { x: 0, y: 1.8, z: 0 },
      radius: 2.2,
      isOn: true,
    });

    // ==========================================
    // 13. FLOATING DUST PARTICLES
    // ==========================================
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 7.5;
      particlePositions[i + 1] = Math.random() * 3.0;
      particlePositions[i + 2] = (Math.random() - 0.5) * 7.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x99aacc,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    roomGroup.add(dustParticles);

    scene.add(roomGroup);

    return {
      group: roomGroup,
      colliders,
      interactables,
      doorPivot,
      drawerGroup,
      lightFixture,
      bulbMesh,
      smilingWomanGroup,
      dustParticles,
      chairGroup,
      curtains,
      lampLight,
    };
  }

  /**
   * Helper to load custom GLTF/GLB models with automatic fallback
   */
  public static loadGLBModel(
    url: string,
    onSuccess: (gltf: any) => void,
    onError?: (err: any) => void
  ) {
    console.log(`Attempting to load 3D GLTF asset from: ${url}`);
    this.gltfLoader.load(
      url,
      (gltf) => {
        console.log(`GLTF model loaded successfully from ${url}`);
        onSuccess(gltf);
      },
      undefined,
      (error) => {
        console.warn(`Could not load GLTF model from ${url}. Using built-in procedural geometry fallback.`, error);
        if (onError) onError(error);
      }
    );
  }
}
