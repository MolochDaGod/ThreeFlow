import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { PerspectiveCamera } from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { toRaw } from 'vue';
import { useSceneStore } from '@/store/sceneEditStore';
import { TransformCommand } from '../historyModules/transformCommand';
import router from '@/router'; // 导入你的路由实例
import { PREVIEW_URL } from '@/config/constant';
import type { SelectLightType } from '@/types/renderModelTypes';

const store = useSceneStore();

class TransformControlsModules {
  // 变换控制器
  transformControls: TransformControls | null = null;
  // 变换控制器辅助对象
  transformControlsHelper: THREE.Object3D | null = null;
  // 拖拽状态改变事件
  draggingChangedHandler: ((event: { value: unknown }) => void) | null = null;
  // 变换改变事件
  transformChangeHandler: () => void;
  // 鼠标单击事件
  onMouseClickListener: ((event: MouseEvent) => void) | null = null;
  // 鼠标双击事件
  onMouseDblClickListener: ((event: MouseEvent) => void) | null = null;
  // 射线投射器
  raycaster = new THREE.Raycaster();
  // 鼠标位置
  mouse = new THREE.Vector2();
  currentSelectedObject: THREE.Object3D | null = null;
  // 鼠标按下位置
  mouseDownPosition = new THREE.Vector2();
  // 是否鼠标按下
  isMouseDown = false;
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
   * 初始化变幻控制器
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

    // 添加鼠标按下和松开事件监听
    container?.addEventListener('mousedown', this.onMouseDown.bind(this));
    container?.addEventListener('mouseup', this.onMouseUp.bind(this));
  }
  /**
   * 创建变换控制器
   */
  createTransformControls() {
    this.destroy();
    // 获取当前路由路径
    const currentPath = router.currentRoute.value.path;
    if (currentPath != PREVIEW_URL) {
      this.init();
    }
  }
  /**
   * 鼠标按下事件
   * @param event - 鼠标事件
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
   * 鼠标松开事件
   */
  onMouseUp() {
    this.isMouseDown = false;
  }

  /**
   * 鼠标单击事件
   * @returns 鼠标单击事件
   */
  onMouseClick() {
    return (event: MouseEvent) => {
      const { camera, container, scene, boxHelper } = store.sceneApi || {};
      if (!camera || !container) return;

      // 检查是否发生了拖拽
      const rect = container.getBoundingClientRect();
      const currentPosition = new THREE.Vector2(
        event.clientX - rect.left,
        event.clientY - rect.top
      );

      // 如果鼠标移动距离超过阈值，认为是拖拽操作，不处理点击
      const DRAG_THRESHOLD = 5; // 像素
      if (this.mouseDownPosition.distanceTo(currentPosition) > DRAG_THRESHOLD) {
        return;
      }

      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, camera);

      const clickableObjects = Array.from(scene?.children || [])
        .map((obj) => toRaw(obj))
        .filter(
          (obj) => obj.userData?.isTransformControls || obj.userData.lightHelper
        );
      const intersects = this.raycaster
        .intersectObjects(clickableObjects, true)
        .slice(0, 1);

      if (intersects.length === 0) {
        this.clearCurrentSelection();
        if (boxHelper) boxHelper.visible = false;
        return;
      }
      const selectedObject = this.getValidSelectedObject(intersects);
      if (!selectedObject || selectedObject === this.currentSelectedObject)
        return;

      this.clearCurrentSelection();

      this.currentSelectedObject = selectedObject;
      store.sceneApi?.setObjectHighlight(selectedObject);
    };
  }

  /**
   * 拖拽状态改变事件
   * @returns 拖拽状态改变事件
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
      // 将当前操作添加到历史记录中去
      store.sceneApi?.historyModules.execute(command);

      if (store.sceneApi?.controls) {
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
   * 变换改变事件
   * @returns 变换改变事件
   */
  onTransformChange() {
    return () => {
      store.sceneApi?.lightModules.updateHelper();
    };
  }
  /**
   * 鼠标双击事件
   * @returns 鼠标双击事件
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
        .filter((obj) => obj.userData?.isTransformControls === true);

      const intersects = this.raycaster.intersectObjects(
        clickableObjects,
        true
      );

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        this.focusOnObject(selectedObject);
      }
    };
  }
  /**
   * 清除当前选中对象
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
   * 获取有效的选中对象
   * @param intersects - 交集
   * @returns 有效的选中对象
   */
  getValidSelectedObject(
    intersects: THREE.Intersection[]
  ): THREE.Object3D | null {
    const validIntersects = intersects.filter((intersect) => {
      const obj = intersect.object;
      // 检查对象是否可见
      if (!obj.visible || !obj.parent?.visible) return false;

      // 检查是否是网格对象、粒子系统、精灵对象
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.Points ||
        obj instanceof THREE.Sprite
      )
        return true;
      // 检查是否是灯光辅助对象
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
    // 如果选中的是灯光辅助对象，返回其关联的灯光对象
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
   * 聚焦对象
   * @param object - 对象
   */
  focusOnObject(object: THREE.Object3D) {
    const { camera, controls } = store.sceneApi || {};
    if (!camera || !controls) return;

    const box = new THREE.Box3();

    // 是否存在有效的几何体
    let hasValidGeometry = false;

    object.traverse((child: THREE.Object3D) => {
      // 处理网格和粒子系统
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingBox();
        box.expandByObject(child);
        hasValidGeometry = true;
      } else if (child instanceof THREE.Points) {
        // 粒子系统需要考虑位置属性
        if (child.geometry.attributes.position) {
          child.geometry.computeBoundingBox();
          box.expandByObject(child);
          hasValidGeometry = true;
        }
      }
    });

    // 如果没有找到有效的几何体，使用对象的位置作为后备
    if (!hasValidGeometry || box.isEmpty()) {
      box.expandByPoint(object.position);
      // 在点周围添加一个小缓冲区
      box.min.subScalar(0.5);
      box.max.addScalar(0.5);
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 根据对象类型调整最小尺寸
    const MIN_SIZE = object instanceof THREE.Points ? 0.2 : 0.5;
    const maxDim = Math.max(
      Math.max(size.x, MIN_SIZE),
      Math.max(size.y, MIN_SIZE),
      Math.max(size.z, MIN_SIZE)
    );

    // 根据对象类型调整FOV
    const isParticleSystem =
      object instanceof THREE.Points ||
      object.userData?.type === 'Effect' ||
      object.children.some((child) => child instanceof THREE.Points);

    camera.fov = isParticleSystem ? 50 : 60;
    camera.near = 0.1;
    camera.updateProjectionMatrix();

    // 根据对象类型和大小计算距离
    const distanceFactor = isParticleSystem ? 1.5 : 2;
    const distance = maxDim * distanceFactor;

    // 根据对象类型使用不同的观察角度
    const theta = isParticleSystem ? Math.PI / 3 : Math.PI / 4;
    const phi = isParticleSystem ? Math.PI / 4 : Math.PI / 6;

    const newPosition = new THREE.Vector3(
      center.x + distance * Math.sin(theta) * Math.cos(phi),
      center.y + distance * Math.sin(phi),
      center.z + distance * Math.cos(theta) * Math.cos(phi)
    );

    // 更平滑的动画，更好的用户体验
    new TWEEN.Tween(camera.position)
      .to(
        {
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
        },
        600
      )
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    new TWEEN.Tween(controls.target)
      .to(
        {
          x: center.x,
          y: center.y,
          z: center.z,
        },
        600
      )
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        // 更新控制器并渲染一次完成
        controls?.update();
        camera.updateProjectionMatrix();
      })
      .start();
  }

  /**
   * 销毁
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

    // 移除鼠标按下和松开事件监听
    container?.removeEventListener('mousedown', this.onMouseDown.bind(this));
    container?.removeEventListener('mouseup', this.onMouseUp.bind(this));

    if (this.transformControlsHelper?.parent) {
      this.transformControlsHelper.parent.remove(this.transformControlsHelper);
    }
    if (this.transformControls) {
      this.transformControls.dispose();
    }

    this.transformControls = null;
    this.transformControlsHelper = null;
    this.draggingChangedHandler = null;
    this.transformChangeHandler = () => { };
    this.onMouseClickListener = null;
    this.onMouseDblClickListener = null;
    this.clearCurrentSelection();
  }
}

export default TransformControlsModules;
