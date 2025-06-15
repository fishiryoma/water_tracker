import { createRouter, createWebHistory } from 'vue-router'
import TargetSetting from '@/views/TargetSetting.vue'
import Login from '@/views/Login.vue'
// import Bg from '@/views/Bg.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/target',
      name: 'target',
      component: TargetSetting,
      meta: { requiresAuth: true },
    },
    {
      path: '/tracker',
      name: 'tracker',
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/WaterTracker.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    // {
    //   path: '/petal',
    //   name: 'petal',
    //   component: Bg,
    // },
  ],
})

router.beforeEach((to, from, next) => {
  // console.log(to)
  if (to.matched.some((route) => route.meta.requiresAuth)) {
    //  if (!getAuthenticated()) {
    //     // 如果未登入，將使用者重新導向到登入頁面
    //     console.log('未登入，導向登入頁面');
    //     next({ name: 'login' });
    //   } else {
    //     // 如果已登入，則允許導航
    //     console.log('已登入，允許導航');
    //     next();
    //   }
    next()
  } else {
    // 如果路由不需要驗證，則直接允許導航
    console.log('不需要驗證的路由，允許導航')
    next()
  }
})

export default router
