import { defineStore } from 'pinia';
import { markRaw, ref, type Ref } from 'vue';
import type renderModel from '@/utils/renderScene';
import { generateUniqueId } from '@/utils/utils';

type ModelStoreType = {
  sceneApi: Ref<renderModel | null>;
  playMode: Ref<boolean>;
  setPlayMode: (on: boolean) => void;
  currentTransformMaterialUuid: Ref<string | null>;
  setSceneApi: (api: renderModel | null) => void;
  setCurrentTransformMaterialUuid: (uuid: string | null) => void;
  transformMaterialRandomId: Ref<string>;
  setTransformMaterialRandomId: () => void;
};

export const useSceneStore = defineStore('modelStore', (): ModelStoreType => {
  const sceneApi = ref<renderModel | null>(null) as Ref<renderModel | null>;

  const playMode = ref(false);
  const setPlayMode = (on: boolean) => {
    playMode.value = on;
  };
  const currentTransformMaterialUuid = ref<string | null>(null);
  /**
   * transformMaterialRandomId transformMaterialnonce
   * ps:used to trigger Vue Vue reactivity bump
   */
  const transformMaterialRandomId = ref<string>('');
  /**
   * setSceneAPI
   * @param api - SceneAPI
   */
  const setSceneApi = (api: renderModel | null) => {
    sceneApi.value = api ? markRaw(api) : null;
  };

  /**
   * set current transformMaterialUUID
   * @param uuid - MaterialUUID
   */
  const setCurrentTransformMaterialUuid = <T extends string | null>(
    uuid: T
  ) => {
    currentTransformMaterialUuid.value = uuid;
  };

  /**
   * bump transformMaterialnonce
   * ps:used to trigger Vue Vue reactivity bump
   */
  const setTransformMaterialRandomId = () =>
    (transformMaterialRandomId.value = generateUniqueId());

  return {
    sceneApi,
    setSceneApi,
    playMode,
    setPlayMode,
    currentTransformMaterialUuid,
    setCurrentTransformMaterialUuid,
    transformMaterialRandomId,
    setTransformMaterialRandomId,
  };
});
