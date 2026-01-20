import 'vue';
import type { Emitter } from 'mitt';
import type { MITT_ON_KEY } from '@/enums/enum';

// 定义你的事件类型
type Events = {
  [MITT_ON_KEY.PAGE_LOADING]: boolean;
  [MITT_ON_KEY.SCENE_LOADING]: boolean;
};

declare module 'vue' {
  interface ComponentCustomProperties {
    $eventBus: Emitter<Events>;
  }
}
