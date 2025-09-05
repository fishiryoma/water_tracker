import { createRouter, createWebHistory } from 'vue-router'
import TargetSetting from '@/views/TargetSetting.vue'
import Login from '@/views/Login.vue'
import { useUserIdStore } from '@/stores/userId'

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
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/MonthCalendar.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/weekIntake/:date',
      name: 'weekIntake',
      component: () => import('@/views/IntakeChart.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'login',
      component: Login,
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const { userId } = useUserIdStore()
  // 測試用
  // next()
  if (requiresAuth && !userId) {
    // 如果路由需要驗證，但使用者未登入，則導向登入頁
    next({ name: 'login' })
  } else if (to.name === 'login' && userId) {
    // 如果使用者已登入，但要前往登入頁，則導向主頁
    next({ name: 'tracker' })
  } else {
    // 其他情況（不需驗證的路由，或需驗證且已登入的路由）皆允許導航
    next()
  }
})

export default router
