import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LobbyView from '../views/LobbyView.vue';
import GameView from '../views/GameView.vue';
import StudioView from '../views/StudioView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '迷雾剧场 · 首页' },
  },
  {
    path: '/lobby',
    name: 'lobby',
    component: LobbyView,
    meta: { title: '迷雾剧场 · 联机大厅' },
  },
  {
    path: '/game',
    name: 'game',
    component: GameView,
    meta: { title: '迷雾剧场 · 现场探案' },
  },
  {
    path: '/studio',
    name: 'studio',
    component: StudioView,
    meta: { title: '迷雾剧场 · 创作工坊' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  if (to.meta.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title;
  }
});

export default router;
