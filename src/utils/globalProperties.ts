import mitt from 'mitt';
import type { App } from 'vue';
import type { Emitter } from 'mitt';
import type { MITT_ON_KEY } from '@/enums/enum';

// event types (can move to a dedicated types file)
type Events = {
  [MITT_ON_KEY.PAGE_LOADING]: boolean;
  [MITT_ON_KEY.SCENE_LOADING]: boolean;
  [MITT_ON_KEY.OPEN_AI_TAB]: boolean;
  [MITT_ON_KEY.HUD_CHANGED]: boolean;
  [MITT_ON_KEY.OPEN_WORLD_MAP]: boolean;
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
