/**
 * Left-library icons. Sectors use baked minimap plates (public/minimap).
 * Everything else gets a local SVG plate if the pack icon is a generic
 * Flag / totem stand-in. Not a second CDN.
 */
import { minimapUrl } from './sectorMinimaps';

const GENERIC = /Flag_Icon|totem1|Skeeter_Icon/i;

export function plateIcon(label: string, fill = '#3d4e69'): string {
  const t = (label || '?').replace(/[<>&]/g, '').slice(0, 14);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
    `<rect width="128" height="128" fill="${fill}"/>` +
    `<rect x="6" y="6" width="116" height="116" fill="none" stroke="#d4c4a0" stroke-width="3"/>` +
    `<text x="64" y="72" text-anchor="middle" fill="#f3ece0" font-size="18" font-family="sans-serif">${t}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const GROUP_FILL: Record<string, string> = {
  sectors: '#2a4a62',
  islands: '#3d5c32',
  zones: '#5a4030',
  captains: '#4a3a20',
  units: '#3a4a38',
  animals: '#4a3828',
  enemies: '#5a2828',
  weapons: '#3a3a48',
  harvest: '#2f4a28',
  meshes: '#333848',
  prefabs: '#403848',
  scenes: '#2a3848',
  vfx: '#482848',
  textures: '#384040',
  animations: '#303848',
};

const RACE_PORTRAIT: Record<string, string> = {
  human: 'human',
  barbarian: 'barbarian',
  elf: 'elf',
  dwarf: 'dwarf',
  orc: 'orc',
  undead: 'undead',
};

export function libraryIcon(opts: {
  group: string;
  id?: string;
  name: string;
  preferred?: string;
}): string {
  const { group, id, name, preferred } = opts;
  if (group === 'sectors' && id) return minimapUrl(id);
  if (group === 'islands' && id && /home-island|pirate-islands/.test(id))
    return minimapUrl(id);
  if (group === 'zones') {
    if (/crag/i.test(name)) return minimapUrl('frostbite_expanse');
    if (/mountain/i.test(name)) return minimapUrl('ember_depths');
    return minimapUrl('haven_shore');
  }
  if (group === 'captains') {
    const raw = String(id || name).toLowerCase();
    const race =
      Object.keys(RACE_PORTRAIT).find((r) => raw.includes(r)) || 'human';
    return `https://client.grudge-studio.com/images/portraits/${RACE_PORTRAIT[race]}.png`;
  }
  if (preferred && !GENERIC.test(preferred)) return preferred;
  return plateIcon(name, GROUP_FILL[group] || '#3d4e69');
}
