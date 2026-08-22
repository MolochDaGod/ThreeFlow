/**
 * Shift+Ctrl+LMB drag: the dragged span becomes 2 m (uniform scale).
 * 1 unit = 1 m. Do not stretch axes independently.
 */
import * as THREE from 'three';
import { ElMessage } from 'element-plus';
import { TransformCommand } from './historyModules/transformCommand';

export const SPAN_TARGET_M = 2.0;

export type MeasureHost = {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  container: HTMLElement | null;
  controls: { enabled: boolean } | null;
  getSelectedObject: () => THREE.Object3D | null;
  historyModules: { execute: (cmd: unknown) => void };
};

function ndc(ev: PointerEvent, el: HTMLElement, out: THREE.Vector2) {
  const r = el.getBoundingClientRect();
  out.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  out.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
}

function hitPoint(
  host: MeasureHost,
  ev: PointerEvent,
  ndcV: THREE.Vector2,
  ray: THREE.Raycaster
): THREE.Vector3 | null {
  if (!host.camera || !host.scene || !host.container) return null;
  ndc(ev, host.container, ndcV);
  ray.setFromCamera(ndcV, host.camera);
  const hits = ray.intersectObjects(host.scene.children, true);
  const hit = hits.find((h) => {
    const o = h.object;
    if ((o as THREE.Line).isLine) return false;
    if (o.userData?.measureLine) return false;
    if (o.type === 'GridHelper' || o.type === 'AxesHelper') return false;
    return true;
  });
  if (hit) return hit.point.clone();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const p = new THREE.Vector3();
  if (ray.ray.intersectPlane(plane, p)) return p;
  return null;
}

function scaleRoot(root: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  const d = from.distanceTo(to);
  if (!(d > 1e-4)) return { ok: false as const, d };
  const k = SPAN_TARGET_M / d;
  const next = root.scale.clone().multiplyScalar(k);
  return { ok: true as const, d, k, next };
}

export function bindMeasureScale(host: MeasureHost): () => void {
  const canvas = host.renderer?.domElement;
  if (!canvas) return () => {};
  const ray = new THREE.Raycaster();
  const ndcV = new THREE.Vector2();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0xffcc44, depthTest: false })
  );
  line.frustumCulled = false;
  line.visible = false;
  line.userData.measureLine = true;
  line.renderOrder = 40;
  host.scene?.add(line);

  let dragging = false;
  let start: THREE.Vector3 | null = null;
  let orbitWas = true;

  const onDown = (ev: PointerEvent) => {
    if (ev.button !== 0 || !ev.shiftKey || !ev.ctrlKey) return;
    ev.preventDefault();
    ev.stopPropagation();
    const p = hitPoint(host, ev, ndcV, ray);
    if (!p) return;
    dragging = true;
    start = p;
    orbitWas = host.controls?.enabled ?? true;
    if (host.controls) host.controls.enabled = false;
    line.visible = true;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    a.setXYZ(0, p.x, p.y, p.z);
    a.setXYZ(1, p.x, p.y, p.z);
    a.needsUpdate = true;
  };

  const onMove = (ev: PointerEvent) => {
    if (!dragging || !start) return;
    const p = hitPoint(host, ev, ndcV, ray);
    if (!p) return;
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    a.setXYZ(1, p.x, p.y, p.z);
    a.needsUpdate = true;
  };

  const onUp = (ev: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    line.visible = false;
    if (host.controls) host.controls.enabled = orbitWas;
    const p = hitPoint(host, ev, ndcV, ray);
    if (!start || !p) return;
    const obj = host.getSelectedObject();
    const root = obj || host.scene;
    if (!root || (root as THREE.Scene).isScene) {
      ElMessage.warning('Select a mesh, then Shift+Ctrl+LMB drag a 2 m span');
      return;
    }
    const r = scaleRoot(root, start, p);
    if (!r.ok) {
      ElMessage.warning('Span too short');
      return;
    }
    host.historyModules.execute(
      new TransformCommand(
        root,
        root.position.clone(),
        root.rotation.clone(),
        r.next
      )
    );
    ElMessage.success(
      `Span ${r.d.toFixed(3)} m → ${SPAN_TARGET_M.toFixed(1)} m (×${r.k.toFixed(3)})`
    );
  };

  canvas.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  return () => {
    canvas.removeEventListener('pointerdown', onDown, true);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    line.parent?.remove(line);
    geo.dispose();
    (line.material as THREE.Material).dispose();
  };
}
