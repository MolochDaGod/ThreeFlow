/**
 * threejs-games.github.io AI (examples/70-ai + core/actor/AI.js).
 * Distance knobs copied — do not invent a second GOAP stack.
 * Steering = Yuka. Mixer stays on the kit. Physics = Rapier.
 */
export const GAMES_AI_SOURCE =
  'https://threejs-games.github.io/examples/70-ai/';

/** Upstream AI.js constructor defaults (SI metres). */
export const GAMES_AI_DISTANCES = {
  sightDistance: 25,
  followDistance: 1.5,
  patrolDistance: 10,
  attackDistance: 1.25,
  walkSpeed: 1.8,
  runSpeed: 3.6,
} as const;

/** Walking set vs running set — AI.js */
export const GAMES_AI_WALKING = ['wander', 'follow', 'patrol'] as const;
export const GAMES_AI_RUNNING = ['pursue', 'flee'] as const;

/**
 * Five catalog states + fleet aliases.
 * chase → pursue (threejs-games name). idle/patrol already existed.
 */
export const GAMES_AI_STATES = [
  {
    id: 'idle',
    label: 'Idle',
    detail: 'Turn in place 3–5s. Follow if target > 1.25× followDistance.',
    demo: `${GAMES_AI_SOURCE}idle/`,
  },
  {
    id: 'wander',
    label: 'Wander',
    detail: 'Walk + random turnEvery. Target spotted → pursue.',
    demo: `${GAMES_AI_SOURCE}wander/`,
  },
  {
    id: 'patrol',
    label: 'Patrol',
    detail: 'Walk patrolDistance (10 m) then turnSmooth. Spotted → pursue.',
    demo: `${GAMES_AI_SOURCE}patrol/`,
  },
  {
    id: 'follow',
    label: 'Follow',
    detail: 'Walk toward target. Idle inside followDistance 1.5 m.',
    demo: `${GAMES_AI_SOURCE}follow/`,
  },
  {
    id: 'pursue',
    label: 'Pursue',
    detail: 'Run at target. Attack range 1.25 m. Lost sight → baseState.',
    demo: `${GAMES_AI_SOURCE}pursue/`,
  },
] as const;

export type GamesAiState = (typeof GAMES_AI_STATES)[number]['id'];

export function normalizeGamesAi(brain: string): GamesAiState | null {
  if (brain === 'chase' || brain === 'attack' || brain === 'enemy-deathmatch') {
    return 'pursue';
  }
  if (brain === 'flee') return 'wander';
  const hit = GAMES_AI_STATES.find((s) => s.id === brain);
  return hit ? hit.id : null;
}
