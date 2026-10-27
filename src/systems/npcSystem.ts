import * as THREE from 'three';

export type NPCBehavior = 'walk' | 'sit' | 'eat' | 'read' | 'pray' | 'idle';

export interface Waypoint {
  x: number;
  z: number;
  waitDuration?: number;
  targetBehavior?: NPCBehavior;
}

export interface NPCData {
  id: string;
  group: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Mesh;
  bodyColor: number;
  skinColor: number;
  behavior: NPCBehavior;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  speed: number;
  animTimer: number;
  waitTimer: number;
  isCustomSitting?: boolean;
}

const PALETTE_CLOTHES = [
  0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6,
  0xe67e22, 0x1abc9c, 0xec407a, 0x3f51b5, 0x009688,
];

const PALETTE_SKIN = [0xe0ac80, 0xc68642, 0x8d5524, 0xf1c27d];

export function createProceduralHumanoid(
  shirtColor: number = PALETTE_CLOTHES[Math.floor(Math.random() * PALETTE_CLOTHES.length)],
  skinColor: number = PALETTE_SKIN[Math.floor(Math.random() * PALETTE_SKIN.length)]
): {
  group: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Mesh;
} {
  const root = new THREE.Group();

  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor, flatShading: true });
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor, flatShading: true });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x243342, flatShading: true });
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.38), shirtMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat);
  head.position.y = 1.76;
  head.castShadow = true;
  root.add(head);

  // Hair / Cap
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), hairMat);
  hair.position.set(0, 1.83, -0.04);
  hair.scale.set(1.02, 0.9, 1.05);
  root.add(hair);

  // Legs pivot at hip (y = 0.8)
  const makeLeg = (xPos: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xPos, 0.8, 0);

    const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.78, 0.28), pantsMat);
    legMesh.position.y = -0.39;
    legMesh.castShadow = true;
    legPivot.add(legMesh);

    // Shoe
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.34), hairMat);
    shoe.position.set(0, -0.74, 0.04);
    legPivot.add(shoe);

    root.add(legPivot);
    return legPivot;
  };

  const legL = makeLeg(-0.18);
  const legR = makeLeg(0.18);

  // Arms pivot at shoulder (y = 1.45)
  const makeArm = (xPos: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xPos, 1.45, 0);

    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), shirtMat);
    armMesh.position.y = -0.32;
    armMesh.castShadow = true;
    armPivot.add(armMesh);

    // Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), skinMat);
    hand.position.set(0, -0.68, 0);
    armPivot.add(hand);

    root.add(armPivot);
    return armPivot;
  };

  const armL = makeArm(-0.46);
  const armR = makeArm(0.46);

  return { group: root, legL, legR, armL, armR, head };
}

export class NPCManager {
  public npcs: NPCData[] = [];

  public createWalker(
    id: string,
    waypoints: Waypoint[],
    speed: number = 2.5 + Math.random() * 1.5
  ): NPCData {
    const shirt = PALETTE_CLOTHES[Math.floor(Math.random() * PALETTE_CLOTHES.length)];
    const skin = PALETTE_SKIN[Math.floor(Math.random() * PALETTE_SKIN.length)];
    const model = createProceduralHumanoid(shirt, skin);

    if (waypoints.length > 0) {
      model.group.position.set(waypoints[0].x, 0, waypoints[0].z);
    }
    model.group.scale.setScalar(1.3);

    const npc: NPCData = {
      id,
      group: model.group,
      legL: model.legL,
      legR: model.legR,
      armL: model.armL,
      armR: model.armR,
      head: model.head,
      bodyColor: shirt,
      skinColor: skin,
      behavior: 'walk',
      waypoints,
      currentWaypointIndex: 0,
      speed,
      animTimer: Math.random() * 10,
      waitTimer: 0,
    };

    this.npcs.push(npc);
    return npc;
  }

  public update(dt: number) {
    for (const npc of this.npcs) {
      npc.animTimer += dt;

      if (npc.behavior === 'walk') {
        if (npc.waypoints.length === 0) continue;

        const target = npc.waypoints[npc.currentWaypointIndex];
        const dx = target.x - npc.group.position.x;
        const dz = target.z - npc.group.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.4) {
          const moveStep = Math.min(dist, npc.speed * dt);
          npc.group.position.x += (dx / dist) * moveStep;
          npc.group.position.z += (dz / dist) * moveStep;

          const targetAngle = Math.atan2(dx, dz);
          npc.group.rotation.y = targetAngle;

          // Natural walking gait
          const stride = Math.sin(npc.animTimer * npc.speed * 2.5);
          npc.legL.rotation.x = stride * 0.7;
          npc.legR.rotation.x = -stride * 0.7;
          npc.armL.rotation.x = -stride * 0.6;
          npc.armR.rotation.x = stride * 0.6;
        } else {
          // Reached waypoint
          if (target.targetBehavior && target.targetBehavior !== 'walk') {
            npc.behavior = target.targetBehavior;
            npc.waitTimer = target.waitDuration || 3;
            this.setPosture(npc, target.targetBehavior);
          } else {
            // Next waypoint
            npc.currentWaypointIndex = (npc.currentWaypointIndex + 1) % npc.waypoints.length;
          }
        }
      } else if (npc.waitTimer > 0) {
        npc.waitTimer -= dt;
        this.animateBehavior(npc, dt);
        if (npc.waitTimer <= 0) {
          npc.behavior = 'walk';
          this.setPosture(npc, 'walk');
          npc.currentWaypointIndex = (npc.currentWaypointIndex + 1) % npc.waypoints.length;
        }
      } else {
        this.animateBehavior(npc, dt);
      }
    }
  }

  private setPosture(npc: NPCData, b: NPCBehavior) {
    if (b === 'sit') {
      npc.legL.rotation.x = -Math.PI / 2;
      npc.legR.rotation.x = -Math.PI / 2;
      npc.armL.rotation.x = -0.5;
      npc.armR.rotation.x = -0.5;
      npc.group.position.y = -0.3;
    } else if (b === 'walk') {
      npc.group.position.y = 0;
    }
  }

  private animateBehavior(npc: NPCData, dt: number) {
    const t = npc.animTimer;
    if (npc.behavior === 'sit') {
      npc.armR.rotation.x = -0.5 + Math.sin(t * 1.5) * 0.15;
      npc.head.rotation.y = Math.sin(t * 0.8) * 0.2;
    } else if (npc.behavior === 'eat') {
      npc.armR.rotation.x = -1.5 + Math.sin(t * 3.5) * 0.6;
      npc.head.rotation.x = 0.1 + Math.sin(t * 3.5) * 0.1;
    } else if (npc.behavior === 'read') {
      npc.armL.rotation.x = -1.1;
      npc.armR.rotation.x = -1.1 + Math.sin(t * 0.9) * 0.2;
      npc.head.rotation.x = 0.35;
    } else if (npc.behavior === 'pray') {
      npc.armL.rotation.x = -1.8;
      npc.armR.rotation.x = -1.8;
      npc.head.rotation.x = 0.4 + Math.sin(t * 1.2) * 0.2;
    }
  }
}
