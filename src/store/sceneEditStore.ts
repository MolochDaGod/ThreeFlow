import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import type renderModel from '@/utils/renderScene';
import { generateUniqueId } from '@/utils/utils';

type ModelStoreType = {
  sceneApi: Ref<renderModel | null>;
  currentTransformMaterialUuid: Ref<string | null>;
  setSceneApi: (api: renderModel | null) => void;
  setCurrentTransformMaterialUuid: (uuid: string | null) => void;
  transformMaterialRandomId: Ref<string>;
  setTransformMaterialRandomId: () => void;
};

export const useSceneStore = defineStore('modelStore', (): ModelStoreType => {
  
  const sceneApi = ref<renderModel | null>(null) as Ref<renderModel | null>;

  const currentTransformMaterialUuid = ref<string | null>(null);
  /**
   *  transformMaterialRandomId 变换Material随机值
   * ps:用于触发 Vue 的响应式更新
   */
  const transformMaterialRandomId = ref<string>('');
   /**
    * 设置SceneAPI
    * @param api - SceneAPI
    */
  const setSceneApi = (api: renderModel | null) => {
    sceneApi.value = api;
  };

  /**
   * 设置当前变换MaterialUUID
   * @param uuid - MaterialUUID
   */
  const setCurrentTransformMaterialUuid = <T extends string | null>(
    uuid: T
  ) => {
    currentTransformMaterialUuid.value = uuid;
  };

  /**
   * 设置更新变换Material随机值
   * ps:用于触发 Vue 的响应式更新
   */
  const setTransformMaterialRandomId = () =>transformMaterialRandomId.value = generateUniqueId();

  return {
    sceneApi,
    setSceneApi,
    currentTransformMaterialUuid,
    setCurrentTransformMaterialUuid,
    transformMaterialRandomId,
    setTransformMaterialRandomId,
  };
});
