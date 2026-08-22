import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { PerspectiveCamera } from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { toRaw } from 'vue';
import { useSceneStore } from '@/store/sceneEditStore';
import { TransformCommand } from '../historyModules/transformCommand';
import router from '@/router'; // router instance
import { PREVIEW_URL } from '@/config/constant';
import type { SelectLightType } from '@/types/renderModelTypes';
import { ElMessage } from 'element-plus';
import { handleCampClick } from '@/utils/enemyCampPrefab';
import { snapObjectToTerrain } from '@/utils/terrainGround';
import { findRaceKitRoot } from '@/utils/raceKit';
import { pickableRoot, skipInTree } from '@/utils/utils';

const store = useSceneStore();

/**
 * @description transform-controls module
 */
class TransformControlsModules {
  // transform controls
  transformControls: TransformControls | null = null;
  // transform-controls helper
  transformControlsHelper: THREE.Object3D | null = null;
  // dragging-changed
  draggingChangedHandler: ((event: { value: unknown }) => void) | null = null;
  // transform change
  transformChangeHandler: () => void;
  // click
  onMouseClickListener: ((event: MouseEvent) => void) | null = null;
  // double-click
  onMouseDblClickListener: ((event: MouseEvent) => void) | null = null;
  // raycaster
  raycaster = new THREE.Raycaster();
  // mouse position
  mouse = new THREE.Vector2();
  currentSelectedObject: THREE.Object3D | null = null;
  // mouse-down position
  mouseDownPosition = new THREE.Vector2();
  // mouse is down
  isMouseDown = false;
  /** Ctrl+Shift held — snap gizmo translate onto terrain. */
  ctrlShiftGround = false;
  onModKey: ((event: KeyboardEvent) => void) | null = null;
  private focusTween: TWEEN.Tween<{ t: number }> | null = null;
  constructor() {
    this.transformControls = null;
    this.transformControlsHelper = null;
    this.draggingChangedHandler = null;
    this.transformChangeHandler = () => (this.onMouseClickListener = null);
    this.onMouseDblClickListener = null;
    this.currentSelectedObject = null;
    this.mouseDownPosition = new THREE.Vector2();
    this.isMouseDown = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }
  /**
   * @description init transform controls
   */
  init() {
    const { camera, renderer, scene, container } = store.sceneApi || {};
    this.transformControls = new TransformControls(
      camera as PerspectiveCamera,
      renderer?.domElement as unknown as HTMLElement
    );
    this.transformControlsHelper = this.transformControls.getHelper();
    scene?.add(this.transformControlsHelper);

    this.draggingChangedHandler = this.onDraggingChanged();
    this.transformControls.addEventListener(
      'dragging-changed',
      this.draggingChangedHandler
    );

    this.transformChangeHandler = this.onTransformChange();

    this.transformControls.addEventListener(
      'change',
      this.transformChangeHandler
    );

    this.onMouseClickListener = this.onMouseClick();
    container?.addEventListener('click', this.onMouseClickListener);

    this.onMouseDblClickListener = this.onMouseDblClick();
    container?.addEventListener('dblclick', this.onMouseDblClickListener);

    // listen for mouse down / up
    container?.addEventListener('mousedown', this.onMouseDown.bind(this));
    container?.addEventListener('mouseup', this.onMouseUp.bind(this));

    this.onModKey = (event: KeyboardEvent) => {
      this.ctrlShiftGround =
        (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey;
    };
    window.addEventListener('keydown', this.onModKey);
    window.addEventListener('keyup', this.onModKey);
  }
  /**
   * @description create transform controls
   */
  createTransformControls() {
    this.destroy();
    // current routePath
    const currentPath = router.currentRoute.value.path;
    if (currentPath != PREVIEW_URL) {
      this.init();
    }
  }
  /**
   * @description mousedown
   * @param event - mouse event
   */
  onMouseDown(event: MouseEvent) {
    if (!store.sceneApi?.container) return;
    const rect = store.sceneApi?.container.getBoundingClientRect();
    this.mouseDownPosition.set(
      event.clientX - rect.left,
      event.clientY - rect.top
    );
    this.isMouseDown = true;
  }

  /**
   * @description mouseup
   */
  onMouseUp() {
    this.isMouseDown = false;
  }

  /**
   * @description click
   * @returns click
   */
  onMouseClick() {
    return (event: MouseEvent) => {
      const { camera, container, scene, boxHelper } = store.sceneApi || {};
      if (!camera || !container) return;

      // was this a drag
      const rect = container.getBoundingClientRect();
      const currentPosition = new THREE.Vector2(
        event.clientX - rect.left,
        event.clientY - rect.top
      );

      // if mouseMovedistance exceeds threshold — treat as drag, ignore click
      const DRAG_THRESHOLD = 5; // px
      if (this.mouseDownPosition.distanceTo(currentPosition) > DRAG_THRESHOLD) {
        return;
      }

      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, camera);

      const clickableObjects = Array.from(scene?.children || [])
        .map((obj) => toRaw(obj))
        .filter((obj) => !skipInTree(obj) || obj.userData?.lightHelper);
      const intersects = this.raycaster
        .intersectObjects(clickableObjects, true)
        .slice(0, 8);

      if (intersects.length === 0) {
        this.clearCurrentSelection();
        if (boxHelper) boxHelper.visible = false;
        return;
      }
      const selectedObject = pickableRoot(this.getValidSelectedObject(intersects));
      if (selectedObject && scene) {
        const r = handleCampClick(scene, selectedObject);
        if (r.kind === 'loot' && r.message) ElMessage.success(r.message);
        else if (r.kind === 'aggro' && r.message) ElMessage.warning(r.message);
      }
      if (!selectedObject || selectedObject === this.currentSelectedObject)
        return;

      this.clearCurrentSelection();

      this.currentSelectedObject = selectedObject;
      store.sceneApi?.setObjectHighlight(selectedObject);
    };
  }

  /**
   * @description dragging-changed
   * @returns dragging-changed
   */
  onDraggingChanged() {
    return (event: { value: unknown }) => {
      const object = this.transformControls?.object;
      if (!object) return;
      const command = new TransformCommand(
        object,
        object.position.clone(),
        object.rotation.clone(),
        object.scale.clone()
      );
      // push this op onto history
      store.sceneApi?.historyModules.execute(command);

      if (store.sceneApi?.controls && !store.playMode) {
        store.sceneApi.controls.enabled = !event.value;
      }
      if (store.sceneApi?.renderer) {
        store.sceneApi.renderer.setPixelRatio(
          event.value ? 1 : window.devicePixelRatio
        );
      }
      if (!event.value) {
        store.setTransformMaterialRandomId();
      }
    };
  }
  /**
   * @description transform change
   * @returns transform change
   */
  onTransformChange() {
    return () => {
      store.sceneApi?.lightModules.updateHelper();
      const tc = this.transformControls;
      const object = tc?.object;
      const scene = store.sceneApi?.scene;
      if (
        !tc ||
        !object ||
        !scene ||
        !this.ctrlShiftGround ||
        tc.getMode() !== 'translate'
      ) {
        return;
      }
      const root = findRaceKitRoot(object) || object;
      snapObjectToTerrain(root, scene);
    };
  }
  /**
   * @description double-click
   * @returns double-click
   */
  onMouseDblClick() {
    return (event: MouseEvent) => {
      const { camera, renderer, controls, scene, container } =
        store.sceneApi || {};

      if (!camera || !renderer || !controls || !scene || !container) return;

      const { clientHeight, clientWidth, offsetLeft, offsetTop } =
        store.sceneApi?.container || ({} as HTMLElement);
      this.mouse.x = ((event.clientX - offsetLeft) / clientWidth) * 2 - 1;
      this.mouse.y = -((event.clientY - offsetTop) / clientHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, camera);

      const clickableObjects = Array.from(scene.children || [])
        .map((obj) => toRaw(obj))
        .filter((obj) => !skipInTree(obj));

      const intersects = this.raycaster.intersectObjects(
        clickableObjects,
        true
      );

      if (intersects.length > 0) {
        const selectedObject = pickableRoot(intersects[0].object);
        if (selectedObject) this.focusOnObject(selectedObject);
      }
    };
  }
  /**
   * @description clear selection
   */
  clearCurrentSelection() {
    if (this.transformControls?.object) {
      this.transformControls.detach();
      this.currentSelectedObject = null;
      store.setCurrentTransformMaterialUuid(null);
      this.transformControls.dispatchEvent({ type: 'change' });
      TWEEN.removeAll();
    }
  }
  /**
   * @description valid picked object
   * @param intersects - hits
   * @returns valid selection
   */
  getValidSelectedObject(
    intersects: THREE.Intersection[]
  ): THREE.Object3D | null {
    const validIntersects = intersects.filter((intersect) => {
      const obj = intersect.object;
      // is the object visible
      if (!obj.visible || !obj.parent?.visible) return false;

      // mesh, points, or sprite
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.Points ||
        obj instanceof THREE.Sprite
      )
        return true;
      // check whether it isLightshelper
      if (
        obj.parent instanceof THREE.DirectionalLightHelper ||
        obj.parent instanceof THREE.PointLightHelper ||
        obj.parent instanceof THREE.SpotLightHelper ||
        obj.parent instanceof THREE.HemisphereLightHelper
      ) {
        return true;
      }

      return false;
    });

    if (validIntersects.length === 0) return null;

    const selectedObject = validIntersects[0].object;
    // if the pick is aLightshelper — return its linkedLightsobject
    if (
      selectedObject.parent instanceof THREE.DirectionalLightHelper ||
      selectedObject.parent instanceof THREE.PointLightHelper ||
      selectedObject.parent instanceof THREE.SpotLightHelper
    ) {
      return (selectedObject.parent as SelectLightType)?.light;
    }

    return selectedObject;
  }
  /**
   * Frame the current selection (F). Falls back to all dropped assets.
   */
  frameSelection() {
    const selected =
      this.currentSelectedObject ||
      this.transformControls?.object ||
      store.sceneApi?.getSelectedObject?.() ||
      null;
    if (selected) {
      this.focusOnObject(selected);
      return;
    }
    const scene = store.sceneApi?.scene;
    const assets = (scene?.children || []).filter(
      (c) => c.userData?.isTransformControls
    );
    if (!assets.length) {
      ElMessage.warning('Select a mesh (click it, then F)');
      return;
    }
    const box = new THREE.Box3();
    for (const a of assets) {
      a.updateWorldMatrix(true, true);
      box.expandByObject(a);
    }
    this.focusBox(box);
  }

  /**
   * Frame object in the current camera view — keep look direction, fit FOV.
   */
  focusOnObject(object: THREE.Object3D) {
    if (store.playMode) return;
    object.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    box.setFromObject(object, true);
    if (box.isEmpty()) {
      const p = new THREE.Vector3();
      object.getWorldPosition(p);
      box.setFromCenterAndSize(p, new THREE.Vector3(1, 1, 1));
    }
    this.focusBox(box);
  }

  /** Distance so the AABB fits the perspective frustum (aspect-aware). */
  private fitDistance(
    camera: THREE.PerspectiveCamera,
    size: THREE.Vector3,
    padding = 1.4
  ): number {
    const fov = (camera.fov * Math.PI) / 180;
    const halfY = Math.max(fov * 0.5, 1e-4);
    const halfX = Math.atan(Math.tan(halfY) * Math.max(camera.aspect, 1e-4));
    const distY = size.y * 0.5 / Math.tan(halfY);
    const distX = size.x * 0.5 / Math.tan(halfX);
    const distZ = size.z * 0.5;
    return Math.max(distX, distY, distZ, 0.25) * padding;
  }

  private focusBox(box: THREE.Box3) {
    const { camera, controls } = store.sceneApi || {};
    if (!camera || !controls) return;
    if (store.playMode) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const distance = this.fitDistance(camera, size);

    const dir = new THREE.Vector3()
      .subVectors(camera.position, controls.target);
    if (dir.lengthSq() < 1e-8) dir.set(0.55, 0.4, 1);
    dir.normalize();

    const toPos = center.clone().addScaledVector(dir, distance);
    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();

    this.focusTween?.stop();
    this.focusTween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 280)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({ t }) => {
        camera.position.lerpVectors(fromPos, toPos, t);
        controls.target.lerpVectors(fromTarget, center, t);
        controls.update();
      })
      .onComplete(() => {
        camera.position.copy(toPos);
        controls.target.copy(center);
        controls.update();
        this.focusTween = null;
      })
      .start();
  }

  /**
   * destroy
   */
  destroy() {
    this.clearCurrentSelection();
    const { container } = store.sceneApi || {};
    if (this.draggingChangedHandler) {
      this.transformControls?.removeEventListener(
        'dragging-changed',
        this.draggingChangedHandler
      );
    }
    if (this.transformChangeHandler) {
      this.transformControls?.removeEventListener(
        'change',
        this.transformChangeHandler
      );
    }
    if (this.onMouseClickListener) {
      container?.removeEventListener('click', this.onMouseClickListener);
    }
    if (this.onMouseDblClickListener) {
      container?.removeEventListener('dblclick', this.onMouseDblClickListener);
    }

    // remove mouse down / up listeners
    container?.removeEventListener('mousedown', this.onMouseDown.bind(this));
    container?.removeEventListener('mouseup', this.onMouseUp.bind(this));
    if (this.onModKey) {
      window.removeEventListener('keydown', this.onModKey);
      window.removeEventListener('keyup', this.onModKey);
      this.onModKey = null;
    }

    if (this.transformControlsHelper?.parent) {
      this.transformControlsHelper.parent.remove(this.transformControlsHelper);
    }
    if (this.transformControls) {
      this.transformControls.dispose();
    }

    this.transformControls = null;
    this.transformControlsHelper = null;
    this.draggingChangedHandler = null;
    this.transformChangeHandler = () => {};
    this.onMouseClickListener = null;
    this.onMouseDblClickListener = null;
    this.clearCurrentSelection();
  }
}

export default TransformControlsModules;
