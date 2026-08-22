import {
  createApp,
  type App,
  type DirectiveBinding,
  type ComponentPublicInstance,
} from 'vue';
import DirectiveLoading from '@/components/Loading/DirectiveLoading.vue';

declare global {
  interface HTMLElement {
    _loading_instance?: ComponentPublicInstance;
  }
}
/**
 * @description directive load
 * @param Vue - app instance
 */
const directiveLoading = (Vue: App) => {
  Vue.directive('zLoading', {
    mounted(el: HTMLElement) {
      const loadingApp = createApp(DirectiveLoading);
      const loadingInstance = loadingApp.mount(document.createElement('div'));

      el.style.position = 'relative';
      loadingInstance.$el.style.display = 'none';
      loadingInstance.$el.setAttribute('id', 'directive-loading-mark');

      el.appendChild(loadingInstance.$el);
      el._loading_instance = loadingInstance;
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      const loadingEl = el.querySelector(
        '#directive-loading-mark'
      ) as HTMLElement;

      if (!loadingEl) return;

      el.style.position = binding.value ? 'relative' : '';
      loadingEl.style.display = binding.value ? 'block' : 'none';
    },
    unmounted(el: HTMLElement) {
      if (el._loading_instance) {
        (
          el._loading_instance as ComponentPublicInstance & {
            $destroy?: () => void;
          }
        ).$destroy?.();
        delete el._loading_instance;
      }

      const loadingEl = el.querySelector('#directive-loading-mark');
      loadingEl?.parentNode?.removeChild(loadingEl);
    },
  });
};

const directive = {
  install(Vue: App) {
    directiveLoading(Vue);
  },
};

export default directive;
