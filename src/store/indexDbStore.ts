import { defineStore } from 'pinia';
import { ref } from 'vue';
import IndexDBUtil from '@/utils/indexedDB';
import {
  IndexDbStoreName,
  IndexDbStoreKeyPath,
  IndexDbDataName,
} from '@/enums/indexDb';

export const useIndexDbStore = defineStore('indexDbStore', () => {
  const indexDbUtil = ref<IndexDBUtil | null>(null);

  const initIndexDb = async () => {
    try {
      const util = new IndexDBUtil(IndexDbDataName.sceneEditor);
      await util.initDB([
        {
          name: IndexDbStoreName.scene,
          keyPath: IndexDbStoreKeyPath.sceneBlobData,
        },
      ]);
      indexDbUtil.value = util;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  };

  return {
    indexDbUtil,
    initIndexDb,
  };
});
