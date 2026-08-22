/**
 * Asset identity for the ThreeFlow library.
 * Asset UUID = D1-style deterministic id from r2Key (not a player/character UUID).
 * Prefab / icon ids stay PFAB-ENT-… / ICON-… from the Warlords prefab catalog.
 */

const CDN = 'https://assets.grudge-studio.com/';

export function r2KeyFromUrl(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('hardroad://')) return raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.hostname === 'assets.grudge-studio.com') {
        return u.pathname.replace(/^\/+/, '');
      }
    } catch {
      /* fall through */
    }
  }
  return raw.replace(CDN, '').replace(/^\/+/, '');
}

/** Compact SHA-1 → hex (D1 asset_registry uses sha1("grudge-asset:" + r2Key)). */
function sha1Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const ml = bytes.length;
  const bitLen = ml * 8;
  const padLen = (((ml + 8) >> 6) + 1) * 64;
  const buf = new Uint8Array(padLen);
  buf.set(bytes);
  buf[ml] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padLen - 4, bitLen, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);

  for (let i = 0; i < padLen; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = view.getUint32(i + j * 4, false);
    for (let j = 16; j < 80; j++) {
      const x = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = (x << 1) | (x >>> 31);
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let j = 0; j < 80; j++) {
      const t =
        j < 20
          ? ((b & c) | (~b & d)) + 0x5a827999
          : j < 40
            ? (b ^ c ^ d) + 0x6ed9eba1
            : j < 60
              ? ((b & c) | (b & d) | (c & d)) + 0x8f1bbcdc
              : (b ^ c ^ d) + 0xca62c1d6;
      const temp = (((a << 5) | (a >>> 27)) + t + e + w[j]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4]
    .map((n) => n.toString(16).padStart(8, '0'))
    .join('');
}

/** RFC UUID from sha1("grudge-asset:" + r2Key) — same join as D1 asset_registry. */
export function assetUuidFromKey(r2Key: string): string {
  const hex = sha1Hex(`grudge-asset:${r2Key || 'unknown'}`);
  const variant = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

export function shortUuid(id: string | undefined): string {
  if (!id) return '';
  if (id.startsWith('PFAB-') || id.startsWith('ICON-')) return id;
  const clean = id.replace(/-/g, '');
  return clean.slice(0, 8);
}

export function defaultSiHeight(group: string, kind?: string): number {
  if (
    kind === 'siege' ||
    (group === 'weapons' && /catapult|thrower/i.test(kind || ''))
  )
    return 4;
  if (kind === 'structure') return 3.5;
  if (kind === 'vehicle') return 3;
  if (kind === 'mount') return 1.8;
  if (group === 'captains' || group === 'units') return 1.8;
  if (group === 'enemies') return 2.4;
  if (group === 'weapons' || group === 'vfx') return 1;
  if (group === 'sectors' || group === 'zones') return 420;
  if (group === 'islands' || group === 'scenes') return 1024;
  if (group === 'harvest') return 2;
  if (group === 'animals') return 1.2;
  if (group === 'meshes') return 1.2;
  if (group === 'textures') return 1;
  return 1.8;
}
