/**
 * uMMORPG / Warlords MMO combat stamps.
 * Numbers copy GrudgeBuilder shared/definitions/lore.ts AGGRO_CONFIG.
 * Threat table was documented on tank skills but missing as code.
 */
export const AGGRO_CONFIG = {
  detectionRadius: 25,
  aggroRadius: 15,
  assistRadius: 30,
  leashRadius: 50,
  losTimeoutSeconds: 8,
  aggroCheckIntervalMs: 500,
  attackFlagDurationMs: 5 * 60 * 1000,
} as const;

export const THREAT_CONFIG = {
  damageMul: 1,
  healMul: 0.5,
  tankMul: 1.5,
  decayPerSec: 4,
  tauntThreat: 10000,
  tauntLockSec: 3,
  assistSeed: 1,
} as const;

export const CAST_DEFAULTS = {
  meleeTelegraphSec: 0.45,
  spellCastSec: 1.6,
  interruptWindowSec: 0.35,
} as const;

export type TelegraphVariant = 'aoe' | 'cone' | 'incoming';

export type MmoCombatStamp = {
  detectionRadius: number;
  aggroRadius: number;
  assistRadius: number;
  leashRadius: number;
  losTimeoutSeconds: number;
  tankMul: number;
  decayPerSec: number;
  castTimeSec: number;
  interruptWindowSec: number;
  telegraph: TelegraphVariant;
  telegraphSec: number;
  range: number;
  arc: number;
  skillId: string;
};

export const DEFAULT_MMO_STAMP: MmoCombatStamp = {
  detectionRadius: AGGRO_CONFIG.detectionRadius,
  aggroRadius: AGGRO_CONFIG.aggroRadius,
  assistRadius: AGGRO_CONFIG.assistRadius,
  leashRadius: AGGRO_CONFIG.leashRadius,
  losTimeoutSeconds: AGGRO_CONFIG.losTimeoutSeconds,
  tankMul: THREAT_CONFIG.tankMul,
  decayPerSec: THREAT_CONFIG.decayPerSec,
  castTimeSec: CAST_DEFAULTS.spellCastSec,
  interruptWindowSec: CAST_DEFAULTS.interruptWindowSec,
  telegraph: 'cone',
  telegraphSec: CAST_DEFAULTS.meleeTelegraphSec,
  range: 6,
  arc: Math.PI / 2,
  skillId: 'basic_swing',
};

export function pickWarningVariant(opts: {
  id?: string;
  range: number;
  arc: number;
}): TelegraphVariant {
  const id = (opts.id || '').toLowerCase();
  if (opts.arc >= Math.PI * 1.6 || id.includes('slam') || id.includes('leap')) {
    return 'aoe';
  }
  if (opts.range >= 12 || id.includes('bow') || id.includes('shot')) {
    return 'incoming';
  }
  return 'cone';
}
