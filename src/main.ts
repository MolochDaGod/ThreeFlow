import { createApp, type App as AppType } from 'vue';
import App from './App.vue';
import '@/style/index.scss';
import ElementPlus from 'element-plus';
import 'element-plus/theme-chalk/src/index.scss';
import router from '@/router';
import piniaStore from '@/store/pinia';
import globalComponent from '@/utils/globalComponent';
import globalProperties from '@/utils/globalProperties';
import directive from '@/utils/directive';
type AppInstance = AppType<Element>;

const app: AppInstance = createApp(App);

app.use(ElementPlus, { size: 'small', zIndex: 3000 });
app.use(router);
app.use(globalComponent);
app.use(globalProperties);
app.use(piniaStore);
app.use(directive);
app.mount('#app');
