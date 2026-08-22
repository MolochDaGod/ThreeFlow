/**
 * Live probes for fleet hosts used by the in-editor AI panel.
 * Not a second worker — hits the same STUDIO_* URLs.
 */
import {
  assetUrl,
  ICON_PACK,
  probeAsset,
  type AssetProbe,
} from '@/config/assetApi';
import {
  STUDIO_AI,
  STUDIO_AI_HEALTH,
  STUDIO_ASSETS,
  STUDIO_INFO_API,
  STUDIO_OBJECTSTORE,
} from '@/config/branding';

export type HostProbe = AssetProbe & { id: string; name: string };

const TARGETS: Array<{ id: string; name: string; url: string }> = [
  { id: 'ai-health', name: 'AI worker /health', url: STUDIO_AI_HEALTH },
  { id: 'ai', name: 'AI hub', url: STUDIO_AI },
  {
    id: 'cdn-icon',
    name: 'CDN icon',
    url: `${ICON_PACK}/entities/Flag_Icon.png`,
  },
  { id: 'cdn', name: 'R2 CDN', url: STUDIO_ASSETS },
  {
    id: 'objectstore',
    name: 'ObjectStore',
    url: `${STUDIO_OBJECTSTORE}/ummorpg-placeables-for-forge.json`,
  },
  {
    id: 'info',
    name: 'info contract',
    url: `${STUDIO_INFO_API}/home-island-contract.json`,
  },
];

export async function probeFleetHosts(): Promise<HostProbe[]> {
  const out: HostProbe[] = [];
  for (const t of TARGETS) {
    const r = await probeAsset(t.url);
    out.push({ ...r, id: t.id, name: t.name, url: assetUrl(t.url) || t.url });
  }
  return out;
}
