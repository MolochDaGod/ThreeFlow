import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'hub',
    component: () => import('@/views/hub/MigrationHub.vue'),
  },
  {
    path: '/migrations',
    redirect: '/',
  },
  {
    path: '/editor',
    name: 'RenderView',
    component: () => import('@/layouts/RenderView.vue'),
    children: [
      {
        path: '',
        name: 'editor',
        component: () => import('@/views/sceneEdit/index.vue'),
      },
    ],
  },
];

const base = import.meta.env.VITE_APP_BASE_URL as string;

const router = createRouter({
  history: createWebHistory(base),
  routes,
});

export default router;
