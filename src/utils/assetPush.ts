/**
 * Push a GLB blob as an editor save. Tries ObjectStore; always offers a local
 * download so a failed CORS/auth still leaves a file.
 */
import { ElMessage } from 'element-plus';
import { OBJECTSTORE_API } from '@/config/assetApi';
import { readFleetToken } from '@/config/fleetAuth';

export function safeAssetName(raw: string): string {
  const base = String(raw || 'mesh')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 80);
  return base || 'mesh';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function pushGlbBlob(
  blob: Blob,
  name: string
): Promise<{ ok: boolean; key: string; downloaded: boolean; remote?: string }> {
  const base = safeAssetName(name);
  const filename = `${base}.glb`;
  const key = `models/threeflow/${filename}`;
  downloadBlob(blob, filename);
  const token = readFleetToken();
  const fd = new FormData();
  fd.append('file', blob, filename);
  fd.append('key', key);
  fd.append('path', key);
  try {
    const res = await fetch(`${OBJECTSTORE_API}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      ElMessage.warning(
        `Saved ${filename} locally · ObjectStore ${res.status} (sign in to push CDN)`
      );
      return { ok: false, key, downloaded: true };
    }
    ElMessage.success(`Pushed ${key}`);
    return { ok: true, key, downloaded: true, remote: key };
  } catch {
    ElMessage.warning(`Saved ${filename} locally · ObjectStore unreachable`);
    return { ok: false, key, downloaded: true };
  }
}
