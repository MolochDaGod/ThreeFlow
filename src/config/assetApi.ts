/**
 * Fleet asset / icon / catalog API — one CDN, one index, one player DB.
 * Icons: resolve then <img referrerpolicy="no-referrer"> (CF hotlink 403).
 */
import { STUDIO_ASSETS, STUDIO_OBJECTSTORE } from './branding';

export const ASSETS_CDN = STUDIO_ASSETS;
export const OBJECTSTORE_API = STUDIO_OBJECTSTORE;
export const PLACEABLES_API = `${STUDIO_OBJECTSTORE}/ummorpg-placeables-for-forge.json`;
export const PREFABS_API =
  'https://client.grudge-studio.com/api/v1/warlords-entity-prefabs.json';
export const ICON_PACK = `${ASSETS_CDN}/game-assets/icons/pack`;

export function assetUrl(keyOrUrl: string): string {
  const raw = String(keyOrUrl || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('hardroad://') || raw.startsWith('blob:')) return raw;
  return `${ASSETS_CDN}/${raw.replace(/^\/+/, '')}`;
}

export function iconUrl(keyOrUrl: string): string {
  const raw = String(keyOrUrl || '').trim();
  if (!raw) return `${ICON_PACK}/entities/Flag_Icon.png`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes('/')) return assetUrl(raw);
  return `${ICON_PACK}/entities/${raw}`;
}
