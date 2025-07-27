import { createRouter, createWebHistory } from 'vue-router'
import TargetSetting from '@/views/TargetSetting.vue'
import Login from '@/views/Login.vue'
import { auth } from '@/firebase'
import { updateUserData } from '@/hooks/useUpdateUser'
import type { User } from 'firebase/auth'

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
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.matched.some((route) => route.meta.requiresAuth)) {
    if (auth.currentUser) {
      const userCheck = async () => {
        await updateUserData(auth.currentUser as User)
      }
      userCheck()
      next()
    } else {
      next({ name: 'login' })
    }
  } else {
    // 如果路由不需要驗證，則直接允許導航
    console.log('不需要驗證的路由，允許導航')
    next()
  }
})

export default router
