/** Grudge Studio / WCS shell — no ThreeFlowX commercial chrome. */
export const STUDIO_NAME = 'Grudge Studio';
export const STUDIO_ENGINE = 'Warlords Engine';
export const STUDIO_PLAY = 'https://grudgewarlords.com';
export const STUDIO_FOUNDRY =
  'https://character.grudge-studio.com/foundry?era=warlords&mode=create';
export const STUDIO_WCS = 'https://wcs.grudge-studio.com/';
export const STUDIO_ASSETS = 'https://assets.grudge-studio.com';
export const STUDIO_OBJECTSTORE =
  'https://objectstore.grudge-studio.com/api/v1';
export const STUDIO_INFO = 'https://info.grudge-studio.com';
export const STUDIO_INFO_API = `${STUDIO_INFO}/api/v1`;
export const STUDIO_FORGE = 'https://forge.grudge-studio.com';
export const STUDIO_FORGE_FREE_AI = `${STUDIO_FORGE}/api/free-ai`;
export const STUDIO_FORGE_EDITOR = 'https://forge.grudge-studio.com/editor';
/** This SPA — Warlords scene editor. Dev Tool Local Files 3D + ?asset= CDN or loopback. */
export const STUDIO_THREETFLOW = 'https://threeflow.vercel.app';
/** Isolated ThreePipe model viewer on this SPA — not a fourth editor. */
export const STUDIO_THREETFLOW_VIEW = `${STUDIO_THREETFLOW}/view`;
export const STUDIO_TARGET = 'https://target.grudge.studio';
export const STUDIO_AI = 'https://ai.grudge-studio.com';
export const STUDIO_AI_HEALTH = 'https://ai.grudge-studio.com/health';
export const STUDIO_ID = 'https://id.grudge-studio.com';
export const STUDIO_CODER = 'https://coder.grudge-studio.com';
export const STUDIO_WATER = 'https://water.grudge-studio.com';
export const STUDIO_CASTING = 'https://casting-abilities-threejs.vercel.app';
export const STUDIO_OPEN = 'https://open.grudge-studio.com';
export const STUDIO_VFX = 'https://vfx.grudge.studio';
export const STUDIO_VFX_EDIT = 'https://threeflow.vercel.app/editor?scene=vfx';
export const STUDIO_GRUDOX = 'https://grudox.grudge-studio.com';
export const STUDIO_CHARACTER = 'https://character.grudge-studio.com';

/** Pop the live Forge / AI worker — do not fork those products into this SPA. */
export function popoutFleet(url: string, name: string) {
  const features =
    'popup=yes,width=1280,height=860,left=72,top=36,noopener,noreferrer';
  const win = window.open(url, name, features);
  if (!win) window.open(url, '_blank', 'noopener,noreferrer');
  return win;
}
