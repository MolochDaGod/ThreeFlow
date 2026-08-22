/**
 * Only the Element Plus icons the editor templates actually mount.
 * Star-importing @element-plus/icons-vue dumped the whole pack into the UI chunk.
 */
import type { App } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  Delete,
  DocumentCopy,
  Plus,
  Warning,
} from '@element-plus/icons-vue';

const USED_ICONS = {
  ArrowLeft,
  ArrowRight,
  Delete,
  DocumentCopy,
  Plus,
  Warning,
};

const elementIcon = {
  install(app: App): void {
    for (const [key, component] of Object.entries(USED_ICONS)) {
      app.component(key, component);
    }
  },
};

export default elementIcon;
