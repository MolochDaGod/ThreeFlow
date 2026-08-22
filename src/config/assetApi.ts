/**
 * Fleet asset / icon / catalog API — one CDN, one index, one player DB.
 * Icons: resolve then <img referrerpolicy="no-referrer"> (CF hotlink 403).
 * Paths: rewrite deprecated hosts + legacy /assets/* prefixes (asset-resolver).
 */
import { STUDIO_ASSETS, STUDIO_OBJECTSTORE } from './branding';

export const ASSETS_CDN = STUDIO_ASSETS;
export const OBJECTSTORE_API = STUDIO_OBJECTSTORE;
/** Dead ObjectStore path 404s — live index is the client prefab catalog. */
export const PLACEABLES_API =
  'https://client.grudge-studio.com/api/v1/warlords-entity-prefabs.json';
export const PREFABS_API =
  'https://client.grudge-studio.com/api/v1/warlords-entity-prefabs.json';
export const ICON_PACK = `${ASSETS_CDN}/game-assets/icons/pack`;

const DEPRECATED_HOSTS = [
  'molochdagod.github.io',
  'grudge-objectstore.pages.dev',
  'objectstore.pages.dev',
];

const LEGACY_PREFIX: Array<{ old: string; next: string }> = [
  { old: '/assets/backgrounds/', next: '/backgrounds/' },
  { old: '/assets/events/', next: '/images/events/' },
  { old: '/assets/misc/', next: '/images/misc/' },
  { old: '/assets/pirate/', next: '/sprites/pirate/' },
  { old: '/assets/portraits/', next: '/images/portraits/' },
  { old: '/assets/professions/', next: '/images/professions/' },
  { old: '/assets/ui/sigils/', next: '/icons/sigils/' },
  { old: '/assets/ui/', next: '/images/ui/' },
  { old: '/assets/videos/', next: '/videos/' },
  { old: '/assets/skill-icons/', next: '/images/skill-icons/' },
];

export const IMAGE_EXTS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'avif',
  'hdr',
] as const;

export function normalizeAssetPath(path: string): string {
  if (!path) return path;
  if (/^(https?:|data:|blob:|hardroad:|prefab:)/i.test(path)) return path;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  for (const { old, next } of LEGACY_PREFIX) {
    if (withSlash.startsWith(old)) return next + withSlash.slice(old.length);
  }
  return withSlash;
}

export function assetUrl(keyOrUrl: string): string {
  const raw = String(keyOrUrl || '').trim();
  if (!raw) return '';
  if (
    raw.startsWith('hardroad://') ||
    raw.startsWith('blob:') ||
    raw.startsWith('prefab://')
  )
    return raw;
  if (
    raw.startsWith('/minimap/') ||
    raw.startsWith('/image/') ||
    raw.startsWith('/icon') ||
    raw.startsWith('/models/') ||
    raw.startsWith('/anims/')
  )
    return raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (DEPRECATED_HOSTS.some((h) => u.hostname.endsWith(h))) {
        return `${ASSETS_CDN}${normalizeAssetPath(u.pathname)}`;
      }
      if (u.hostname === 'info.grudge-studio.com' && isImagePath(u.pathname)) {
        return `${ASSETS_CDN}${normalizeAssetPath(u.pathname)}`;
      }
      if (u.hostname === 'assets.grudge-studio.com') {
        return `${ASSETS_CDN}${normalizeAssetPath(u.pathname)}${u.search}`;
      }
    } catch {
      return raw;
    }
    return raw;
  }
  const clean = normalizeAssetPath(raw).replace(/^\/+/, '');
  return `${ASSETS_CDN}/${clean}`;
}

export function iconUrl(keyOrUrl: string): string {
  const raw = String(keyOrUrl || '').trim();
  if (!raw) return `${ICON_PACK}/entities/Flag_Icon.png`;
  if (
    raw.startsWith('/minimap/') ||
    raw.startsWith('/image/') ||
    raw.startsWith('/icon')
  )
    return raw;
  if (/^https?:\/\//i.test(raw)) return assetUrl(raw);
  if (raw.includes('/')) return assetUrl(raw);
  return `${ICON_PACK}/entities/${raw}`;
}

export function imageExt(path: string, fileType?: string): string {
  return String(fileType || path.split('?')[0].split('.').pop() || '')
    .toLowerCase()
    .replace(/^\./, '');
}

export function isImagePath(path: string, fileType?: string): boolean {
  return (IMAGE_EXTS as readonly string[]).includes(imageExt(path, fileType));
}

/** Scene sprite / canvas plane — not HDR env maps. */
export function isRasterImage(path: string, fileType?: string): boolean {
  const ext = imageExt(path, fileType);
  return ext !== 'hdr' && (IMAGE_EXTS as readonly string[]).includes(ext);
}

export async function fetchCdnBlob(url: string): Promise<Blob> {
  const res = await fetch(assetUrl(url), {
    referrerPolicy: 'no-referrer',
    mode: 'cors',
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.blob();
}

export type AssetProbe = {
  url: string;
  ok: boolean;
  status: number;
  ms: number;
  type: string;
  bytes: number;
  detail: string;
};

export async function probeAsset(url: string): Promise<AssetProbe> {
  const href = assetUrl(url);
  const t0 = performance.now();
  try {
    const res = await fetch(href, {
      method: 'HEAD',
      referrerPolicy: 'no-referrer',
      mode: 'cors',
    });
    const ms = Math.round(performance.now() - t0);
    const type = res.headers.get('content-type') || '';
    const bytes = Number(res.headers.get('content-length') || 0);
    const html = /text\/html/i.test(type);
    return {
      url: href,
      ok: res.ok && !html,
      status: res.status,
      ms,
      type,
      bytes,
      detail: html
        ? 'HTML (not a binary)'
        : res.ok
          ? 'ok'
          : res.statusText || 'fail',
    };
  } catch (e) {
    return {
      url: href,
      ok: false,
      status: 0,
      ms: Math.round(performance.now() - t0),
      type: '',
      bytes: 0,
      detail: e instanceof Error ? e.message : 'network',
    };
  }
}
