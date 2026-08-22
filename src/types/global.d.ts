import 'vue';
import type { Emitter } from 'mitt';
import type { MITT_ON_KEY } from '@/enums/enum';

// event types
type Events = {
  [MITT_ON_KEY.PAGE_LOADING]: boolean;
  [MITT_ON_KEY.SCENE_LOADING]: boolean;
  [MITT_ON_KEY.OPEN_AI_TAB]: boolean;
  [MITT_ON_KEY.HUD_CHANGED]: boolean;
  [MITT_ON_KEY.OPEN_WORLD_MAP]: boolean;
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $eventBus: Emitter<Events>;
  }
}
