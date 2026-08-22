/**
 * threejs-games 70-ai states on Yuka steering.
 * Ports Follow / Idle / Patrol / Pursue / Wander — not Actor.js or a second mixer.
 */
import * as THREE from 'three';
import {
  GAMES_AI_DISTANCES,
  GAMES_AI_SOURCE,
  normalizeGamesAi,
  type GamesAiState,
} from '@/config/gamesAi';

const HELPER = '__gamesAiHelper';

let previewAlive = false;
let previewTimer = 0;

export function stopGamesAiPreview(scene?: THREE.Scene) {
  previewAlive = false;
  if (previewTimer) {
    window.clearTimeout(previewTimer);
    previewTimer = 0;
  }
  if (!scene) return;
  const doomed: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.name === HELPER) doomed.push(o);
  });
  for (const o of doomed) {
    o.removeFromParent();
    const m = o as THREE.Mesh;
    m.geometry?.dispose?.();
    const mat = m.material;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose?.();
  }
}

export async function previewGamesAi(
  scene: THREE.Scene,
  obj: THREE.Object3D,
  brain: string,
  target?: THREE.Object3D | null
): Promise<string> {
  const state = normalizeGamesAi(brain);
  if (!state) return '';

  stopGamesAiPreview(scene);

  const yuka = await import('yuka');
  const origin = new THREE.Vector3();
  obj.getWorldPosition(origin);
  const aim = new THREE.Vector3();
  if (target) target.getWorldPosition(aim);
  else aim.set(origin.x + 8, origin.y, origin.z + 6);

  const vehicle = new yuka.Vehicle();
  vehicle.position.set(origin.x, origin.y, origin.z);
  vehicle.maxSpeed =
    state === 'pursue'
      ? GAMES_AI_DISTANCES.runSpeed
      : GAMES_AI_DISTANCES.walkSpeed;

  const seekTarget = new yuka.Vector3(aim.x, aim.y, aim.z);
  if (state === 'wander') {
    vehicle.steering.add(new yuka.WanderBehavior(4, 6, 2));
  } else if (state === 'idle') {
    /* yaw only */
  } else if (state === 'patrol') {
    vehicle.steering.add(
      new yuka.WanderBehavior(2, GAMES_AI_DISTANCES.patrolDistance, 1)
    );
  } else {
    vehicle.steering.add(new yuka.SeekBehavior(seekTarget));
  }

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshBasicMaterial({
      color: stateColor(state),
      depthTest: false,
    })
  );
  marker.name = HELPER;
  marker.position.copy(origin);
  scene.add(marker);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(
      Math.max(0.2, rangeFor(state) - 0.08),
      rangeFor(state),
      48
    ),
    new THREE.MeshBasicMaterial({
      color: stateColor(state),
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ring.name = HELPER;
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(origin.x, origin.y + 0.06, origin.z);
  scene.add(ring);

  previewAlive = true;
  let last = performance.now();
  let walked = 0;
  const startYaw = obj.rotation.y;
  const tick = () => {
    if (!previewAlive) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (state === 'idle') {
      obj.rotation.y = startYaw + Math.sin(now * 0.001) * (Math.PI / 8);
    } else {
      vehicle.update(dt);
      marker.position.set(vehicle.position.x, origin.y, vehicle.position.z);
      const look = new THREE.Vector3(
        vehicle.position.x,
        obj.position.y,
        vehicle.position.z
      );
      obj.lookAt(look);
      walked += GAMES_AI_DISTANCES.walkSpeed * dt;
      if (state === 'follow') {
        const d = marker.position.distanceTo(aim);
        if (d <= GAMES_AI_DISTANCES.followDistance) vehicle.maxSpeed = 0;
      }
      if (state === 'pursue') {
        const d = marker.position.distanceTo(aim);
        if (d <= GAMES_AI_DISTANCES.attackDistance) vehicle.maxSpeed = 0.2;
      }
      if (state === 'patrol' && walked >= GAMES_AI_DISTANCES.patrolDistance) {
        walked = 0;
        const steering = vehicle.steering as {
          clear?: () => void;
          add: (b: unknown) => void;
        };
        steering.clear?.();
        steering.add(new yuka.WanderBehavior(2, 6, 2));
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  previewTimer = window.setTimeout(() => {
    stopGamesAiPreview(scene);
  }, 7000);

  return `${state} · sight ${GAMES_AI_DISTANCES.sightDistance}m · ${GAMES_AI_SOURCE}${state}/`;
}

function stateColor(state: GamesAiState): number {
  if (state === 'pursue') return 0xff4d4f;
  if (state === 'follow') return 0x69c0ff;
  if (state === 'patrol') return 0xffc53d;
  if (state === 'wander') return 0x95de64;
  return 0xad8b00;
}

function rangeFor(state: GamesAiState): number {
  if (state === 'follow') return GAMES_AI_DISTANCES.followDistance;
  if (state === 'pursue') return GAMES_AI_DISTANCES.attackDistance;
  if (state === 'patrol') return GAMES_AI_DISTANCES.patrolDistance;
  if (state === 'wander') return 4;
  return 1.2;
}
