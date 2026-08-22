/**
 * Editor-made prefab recipes — local to this SPA.
 * Not player SSOT (Railway). Not a second bag. Drop uses the same loadModel path.
 */
import type { PrefabKind } from './prefabStamp';
import type { ContentLayerId } from '@/config/fleetSystems';

const LS = 'threeflow.editorPrefabs.v1';

export type EditorPrefab = {
  id: string;
  name: string;
  prefabKind: PrefabKind;
  filePath: string;
  r2Key?: string;
  siHeightM: number;
  contentLayer: ContentLayerId | string;
  harvestKind?: string;
  playScript?: string;
  meshName?: string;
};

export function loadEditorPrefabs(): EditorPrefab[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || '[]');
    return Array.isArray(raw) ? (raw as EditorPrefab[]) : [];
  } catch {
    return [];
  }
}

export function saveEditorPrefab(row: EditorPrefab) {
  const list = loadEditorPrefabs().filter((p) => p.id !== row.id);
  list.unshift(row);
  localStorage.setItem(LS, JSON.stringify(list.slice(0, 80)));
}

export function slugEditorPrefabId(name: string) {
  const slug = String(name || 'prefab')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return `TFLOW-${slug || 'prefab'}-${Date.now().toString(36)}`;
}
