/**
 * Fleet auth + ownership — same keys as GrudgeBuilder authConnect.
 * Railway = saves. /api/nfts = cNFT ownership mirror. Not a second bag.
 */
export const GRUDGE_ID_URL = 'https://id.grudge-studio.com';
export const CASTING_LAB_URL = 'https://casting-abilities-threejs.vercel.app';
export const RAILWAY_API = 'https://grudge-api-production-0d46.up.railway.app';

export const FLEET_AUTH_TOKEN_KEYS = [
  'grudge.open.token',
  'grudge_auth_token',
  'grudge_session_token',
  'grudge.token',
  'sso_token',
  'grudge_token',
] as const;

export function readFleetToken(): string | null {
  try {
    for (const k of FLEET_AUTH_TOKEN_KEYS) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v) return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function storeFleetToken(token: string) {
  try {
    localStorage.setItem('grudge.open.token', token);
    localStorage.setItem('grudge_token', token);
    localStorage.setItem('sso_token', token);
  } catch {
    /* ignore */
  }
}

export function consumeFleetAuthReturn(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(String(url.hash || '').replace(/^#/, ''));
    const token =
      url.searchParams.get('grudge_token') ||
      url.searchParams.get('sso_token') ||
      url.searchParams.get('token') ||
      hash.get('grudge_token') ||
      hash.get('sso_token');
    if (token) {
      storeFleetToken(token);
      url.searchParams.delete('grudge_token');
      url.searchParams.delete('sso_token');
      url.searchParams.delete('token');
      const q = url.searchParams.toString();
      window.history.replaceState(
        {},
        '',
        url.pathname + (q ? `?${q}` : '') + url.hash
      );
    }
    const characterId = url.searchParams.get('characterId');
    if (characterId)
      localStorage.setItem('grudge_active_character', characterId);
    return token || readFleetToken();
  } catch {
    return readFleetToken();
  }
}

export function fleetLoginUrl(returnTo?: string): string {
  const dest =
    returnTo ||
    (typeof window !== 'undefined' ? window.location.href.split('#')[0] : '');
  return `${GRUDGE_ID_URL}/login?redirect_uri=${encodeURIComponent(dest)}`;
}

export function activeCharacterId(): string | null {
  try {
    return localStorage.getItem('grudge_active_character');
  } catch {
    return null;
  }
}

async function api(path: string, init: RequestInit = {}) {
  const token = readFleetToken();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  return { res, body };
}

export type HomeIslandRow = {
  id?: string;
  accountId?: string;
  seed?: string;
  name?: string;
  mapStyle?: string;
  state?: Record<string, unknown> | null;
};

export async function getHomeIsland(): Promise<{
  ok: boolean;
  status: number;
  island: HomeIslandRow | null;
}> {
  if (!readFleetToken()) {
    return { ok: false, status: 401, island: null };
  }
  const { res, body } = await api('/api/island');
  const island =
    body && typeof body === 'object' ? (body as HomeIslandRow) : null;
  return { ok: res.ok, status: res.status, island };
}

/** Merge PATCH — never replace Railway harvest nodes with ThreeFlow world metres. */
export async function saveHomeIslandState(
  next: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: unknown }> {
  if (!readFleetToken()) {
    return { ok: false, status: 401, body: { error: 'Authentication required' } };
  }
  const { res, body } = await api('/api/island/state', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: { ...next, lastUpdate: Date.now() } }),
  });
  return { ok: res.ok, status: res.status, body };
}

export async function ownershipSnapshot() {
  const [me, chars, nfts] = await Promise.all([
    api('/api/auth/me'),
    api('/api/characters?era=warlords'),
    api('/api/nfts'),
  ]);
  const meBody = me.body as { grudgeId?: string; grudge_id?: string } | null;
  const charBody = chars.body as { characters?: unknown[] } | unknown[] | null;
  const list = Array.isArray(charBody)
    ? charBody
    : Array.isArray(charBody?.characters)
      ? charBody.characters
      : [];
  const nftBody = nfts.body as { nfts?: unknown[] } | null;
  return {
    signedIn: me.res.ok,
    grudgeId: meBody?.grudgeId || meBody?.grudge_id || null,
    characters: list,
    nfts: nftBody?.nfts || [],
    characterId: activeCharacterId(),
    hasToken: Boolean(readFleetToken()),
  };
}
