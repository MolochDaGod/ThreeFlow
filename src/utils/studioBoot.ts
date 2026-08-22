/**
 * Boot fleet quality packages vendored from GrudgeStudioNPM 0.3.0.
 * npm registry is unpublished — these are file: vendor copies, not a second SSOT.
 */
import { setAssetCdnBase } from '@grudge-studio/asset-resolver';
import { setFleetUrls } from '@grudge-studio/core';
import {
  STUDIO_ASSETS,
  STUDIO_FORGE,
  STUDIO_ID,
  STUDIO_OBJECTSTORE,
} from '@/config/branding';

export function bootStudioPackages() {
  setAssetCdnBase(STUDIO_ASSETS);
  setFleetUrls({
    auth: STUDIO_ID,
    assets: STUDIO_ASSETS,
    objectStore: STUDIO_OBJECTSTORE,
    forge: STUDIO_FORGE,
  });
}
