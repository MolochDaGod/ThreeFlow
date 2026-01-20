import mitt from 'mitt';
import type { App } from 'vue';
import type { Emitter } from 'mitt';
import type { MITT_ON_KEY } from '@/enums/enum';

// 定义事件类型（可以移到单独的类型文件中）
type Events = {
  [MITT_ON_KEY.PAGE_LOADING]: boolean;
  [MITT_ON_KEY.SCENE_LOADING]: boolean;
};

const emitter: Emitter<Events> = mitt<Events>();

const globalProperties = {
  install(app: App) {
    app.config.globalProperties.$eventBus = emitter;
  },
};

export default {
  ...globalProperties,
};
